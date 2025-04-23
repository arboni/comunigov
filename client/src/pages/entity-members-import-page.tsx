import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Alert,
  AlertTitle,
  AlertDescription 
} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescriptionCustom,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle, Info, Download, Building, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

interface UserCreated {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  tempPassword?: string;
}

interface Entity {
  id: number;
  name: string;
  type: string;
  headName: string;
  headPosition: string;
  headEmail: string;
  address?: string;
  phone?: string;
  website?: string;
  socialMedia?: string;
  tags?: string[];
}

interface ImportResult {
  message: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: string[];
  usersCreated?: number;
  userDetails?: UserCreated[];
}

export default function EntityMembersImportPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  // Fetch all entities
  const { data: entities, isLoading: entitiesLoading } = useQuery<Entity[]>({
    queryKey: ['/api/entities'],
  });
  
  // Download CSV template
  const downloadTemplate = () => {
    // Create a multi-line comment with detailed instructions
    const comments = [
      '# Modelo CSV para Importação de Membros de Entidade',
      '# ',
      '# CAMPOS OBRIGATÓRIOS:',
      '# - nomeCompleto: Nome completo do membro',
      '# - email: Endereço de email do membro',
      '# - cargo: Cargo/posição do membro na entidade',
      '# ',
      '# CAMPOS OPCIONAIS:',
      '# - telefone: Número de telefone de contato',
      '# - whatsapp: Número de WhatsApp (incluir código do país)',
      '# - telegram: Nome de usuário do Telegram (sem @)',
      '# ',
      '# OBSERVAÇÃO: Os membros serão automaticamente associados à entidade selecionada',
      '# ',
      '# SUPORTE: Este arquivo suporta delimitadores ponto-e-vírgula (;) ou vírgula (,)',
      '# '
    ].join('\n');
    
    // Header row with column names using semicolon as delimiter
    const headers = 'nomeCompleto;email;cargo;telefone;whatsapp;telegram';
    
    // Example rows with properly formatted data
    const exampleRow1 = '"Carlos Oliveira";"carlos@example.com";"Assistente Administrativo";"(99) 1234-5678";"5599123456789";"carlos_telegram"';
    const exampleRow2 = '"Ana Paula Silva";"ana@example.com";"Analista Técnico";"(99) 8765-4321";"5599987654321";"ana_telegram"';
    const exampleRow3 = '"Roberto Santos";"roberto@example.com";"Coordenador de TI";"(99) 2345-6789";"";"roberto_santos"';
    
    const csvContent = [
      comments,
      headers,
      exampleRow1,
      exampleRow2,
      exampleRow3
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate a filename with the selected entity name if available
    const selectedEntity = entities?.find(e => e.id.toString() === selectedEntityId);
    const entityName = selectedEntity?.name || 'entidade';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${entityName}_membros_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    
    // Reset states when selecting a new file
    setSelectedFile(file);
    setCsvValidationError(null);
    setImportResult(null);
    
    if (file) {
      validateCSV(file);
    }
  };
  
  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Basic CSV validation
  const validateCSV = async (file: File): Promise<boolean> => {
    // Check if entity is selected
    if (!selectedEntityId) {
      setCsvValidationError(t('entities.import.validation.select_entity'));
      return false;
    }
    
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvValidationError(t('entities.import.validation.not_csv'));
      return false;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCsvValidationError(t('entities.import.validation.file_too_large'));
      return false;
    }
    
    try {
      // Read file content to validate it contains expected headers
      const text = await file.text();
      
      // Skip any comment line (starting with #)
      const lines = text.split('\n').filter(line => !line.trim().startsWith('#'));
      
      if (lines.length < 2) {
        setCsvValidationError(t('entities.import.validation.missing_rows'));
        return false;
      }
      
      // Get the first line with actual content (header row)
      // Convert to lowercase and trim whitespace for case-insensitive comparison
      const headerLine = lines[0].toLowerCase();
      
      // Auto-detect the delimiter (comma or semicolon)
      const delimiter = headerLine.includes(';') ? ';' : ',';
      console.log(`Detected delimiter: "${delimiter}" in member CSV file`);
      
      const headers = headerLine.split(delimiter).map(h => h.trim());
      
      console.log('CSV Headers found:', headers);
      
      // Define the required headers with both English and Portuguese versions
      const requiredHeadersMap = {
        'fullname': ['fullname', 'full_name', 'full name', 'name', 'nomecompleto', 'nome_completo', 'nome completo', 'nome'],
        'email': ['email', 'e-mail', 'correio'],
        'position': ['position', 'role', 'job_title', 'job title', 'title', 'cargo', 'funcao', 'função', 'posicao', 'posição']
      };
      
      // For each required header category, check if any variant exists in the file
      const missingHeaders = [];
      for (const [key, variants] of Object.entries(requiredHeadersMap)) {
        const hasHeaderVariant = variants.some(variant => headers.includes(variant));
        if (!hasHeaderVariant) {
          missingHeaders.push(key);
        }
      }
      
      if (missingHeaders.length > 0) {
        setCsvValidationError(t('entities.import.error_missing_headers', { headers: missingHeaders.join(', ') }));
        return false;
      }
      
      return true;
    } catch (error) {
      setCsvValidationError(t('entities.import.error_reading_file'));
      console.error('CSV validation error:', error);
      return false;
    }
  };
  
  // Import CSV mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedEntityId) {
        throw new Error(t('entities.import.validation.select_entity'));
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityId', selectedEntityId);
      
      const response = await apiRequest('POST', '/api/entities/members/import', formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('entities.import.error_import_failed'));
      }
      
      return await response.json() as ImportResult;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: t("entities.import.toast_success"),
        description: t("entities.import.toast_success_description", {
          total: data.totalProcessed,
          successful: data.successful,
          failed: data.failed
        }),
        variant: data.failed > 0 ? "destructive" : "default",
      });
      
      // Invalidate the entity users query to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/entities/${selectedEntityId}/users`] });
    },
    onError: (error: Error) => {
      toast({
        title: t("entities.import.toast_error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Start import process
  const startImport = () => {
    if (!selectedFile || !selectedEntityId) return;
    
    setShowConfirmDialog(false);
    
    // Reset previous import result
    setImportResult(null);
    
    // Start the import
    importMutation.mutate(selectedFile);
  };
  
  // Prepare for new import
  const resetImport = () => {
    setSelectedFile(null);
    setCsvValidationError(null);
    setImportResult(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Go back to entities page
  const goBackToEntities = () => {
    setLocation('/entities');
  };

  return (
    <DashboardLayout>
      <div className="container px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-2">
          <Button onClick={goBackToEntities} variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{t("entities.members.import_members")}</h1>
        </div>
        
        {/* Entity Selection Card */}
        <Card className="mb-8 mt-6">
          <CardHeader>
            <CardTitle>{t("entities.members.select_entity")}</CardTitle>
            <CardDescription>
              {t("entities.members.select_entity_description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col space-y-1.5">
                <Select
                  value={selectedEntityId || ""}
                  onValueChange={(value) => {
                    setSelectedEntityId(value);
                    // Re-validate file if one is already selected
                    if (selectedFile) {
                      validateCSV(selectedFile);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("entities.members.select_entity_placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {entitiesLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : entities && entities.length > 0 ? (
                      entities.map((entity) => (
                        <SelectItem key={entity.id} value={entity.id.toString()}>
                          {entity.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                        {t("entities.no_entities_found")}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Instructions Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("entities.import.member_import.instructions_title")}</CardTitle>
            <CardDescription>
              {t("entities.import.member_import.instructions_description")}
              {selectedEntityId && entities && (
                <div className="flex items-center gap-2 mt-2">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">
                    {entities.find(e => e.id.toString() === selectedEntityId)?.name}
                  </span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("entities.import.steps.select_entity")}</li>
              <li>{t("entities.import.steps.download_template")}</li>
              <li>{t("entities.import.steps.fill_data")}</li>
              <li>{t("entities.import.steps.upload_file")}</li>
              <li>{t("entities.import.steps.review_results")}</li>
            </ol>
            
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>{t("entities.import.required_fields")}</AlertTitle>
              <AlertDescription>
                <p>{t("entities.import.required_fields_description", { fields: "fullName/nomeCompleto, email, position/cargo" })}</p>
                <p className="mt-1">{t("entities.import.optional_fields")}</p>
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>{t("entities.import.communication_channels")}</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{t("entities.import.whatsapp_format")}</p>
                <p>{t("entities.import.telegram_format")}</p>
              </AlertDescription>
            </Alert>
            
            <div className="pt-2">
              <Button 
                onClick={downloadTemplate} 
                variant="outline" 
                className="flex items-center gap-2"
                disabled={!selectedEntityId}
              >
                <Download className="h-4 w-4" /> 
                {t("entities.import.member_import.csv_template")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* File Upload Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("csv.upload_file")}</CardTitle>
            <CardDescription>
              {t("entities.import.member_import.upload_instructions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {selectedFile ? `${t("common.selected")}: ${selectedFile.name}` : t("csv.select_or_drop")}
              </p>
              <Input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                onClick={handleButtonClick} 
                variant="secondary"
                disabled={importMutation.isPending || !selectedEntityId}
              >
                {t("csv.select_file")}
              </Button>
            </div>
            
            {csvValidationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("csv.validation_error")}</AlertTitle>
                <AlertDescription>{csvValidationError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
            <Button 
              variant="outline" 
              onClick={resetImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {t("common.reset")}
            </Button>
            <Button 
              variant="default" 
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedFile || !selectedEntityId || !!csvValidationError || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("entities.import.processing")}
                </>
              ) : (
                t("entities.import.member_import.submit")
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>{t("entities.import.results")}</CardTitle>
              <CardDescription>
                {t("entities.import.results_description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.total_processed")}</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.success_count")}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.successful}</p>
                </div>
                
                <div className={`${importResult.failed > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/30'} p-4 rounded-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.failed_count")}</span>
                    {importResult.failed > 0 ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">{importResult.failed}</p>
                </div>
                
                <div className="bg-blue-100 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.users_created")}</span>
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.usersCreated || 0}</p>
                </div>
              </div>
              
              {/* Display created users */}
              {importResult.userDetails && importResult.userDetails.length > 0 && (
                <div className="mt-6 mb-2">
                  <h3 className="text-lg font-medium mb-2">{t("entities.import.created_users")}</h3>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("entities.members.fullName")}</TableHead>
                          <TableHead>{t("entities.members.username")}</TableHead>
                          <TableHead>{t("entities.members.role")}</TableHead>
                          <TableHead>{t("entities.members.email")}</TableHead>
                          <TableHead>{t("entities.members.temp_password")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.userDetails.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                user.role === 'entity_head' 
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              }`}>
                                {user.role === 'entity_head' 
                                  ? t("entities.members.roles.entity_head") 
                                  : t("entities.members.roles.entity_member")
                                }
                              </span>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell className="font-mono text-xs">{user.tempPassword}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t("entities.import.results.save_credentials_notice")}
                  </p>
                </div>
              )}
              
              {/* Display errors */}
              {importResult.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">{t("entities.import.results.error_details")}</h3>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("entities.import.results.error")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={resetImport} variant="outline">
                {t("entities.import.buttons.import_another")}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("entities.import.confirm_import")}</AlertDialogTitle>
              <AlertDialogDescriptionCustom>
                <div className="space-y-2">
                  <div>{t("entities.import.confirm_question", { file: selectedFile?.name })}</div>
                  <div>{t("entities.import.confirm_description")}</div>
                  <ul className="list-disc pl-5 text-sm">
                    <li>{t("entities.import.action_create_members", { entity: entities?.find(e => e.id.toString() === selectedEntityId)?.name || '' })}</li>
                    <li>{t("entities.import.action_generate_usernames")}</li>
                    <li>{t("entities.import.action_generate_passwords")}</li>
                  </ul>
                </div>
              </AlertDialogDescriptionCustom>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction onClick={startImport}>
                {t("entities.import.proceed_import")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}