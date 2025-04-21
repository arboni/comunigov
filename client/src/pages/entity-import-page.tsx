import { useRef, useState } from "react";
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
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle, Info, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface UserCreated {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  tempPassword?: string;
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

export default function EntityImportPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Download CSV template
  const downloadTemplate = () => {
    // Create a multi-line comment with detailed instructions
    const comments = [
      '# CSV Template for Entity Import',
      '# ',
      '# REQUIRED FIELDS (case-sensitive):',
      '# - name: Entity name',
      '# - type: Entity type (Must be one of: secretariat, administrative_unit, external_entity, government_agency, association, council)',
      '# - headName: Full name of the entity head',
      '# - headPosition: Position/title of the entity head',
      '# - headEmail: Email address of the entity head',
      '# ',
      '# OPTIONAL FIELDS:',
      '# - address: Physical address',
      '# - phone: Contact phone number',
      '# - website: Website URL',
      '# - socialMedia: Social media handles',
      '# - tags: Comma-separated tags without spaces between them (e.g., government,health)',
      '# ',
      '# NOTE: To import entity members, use the separate "Import Entity Members" feature after creating the entity',
      '# '
    ].join('\n');
    
    // Header row with column names - EXACT match with validation
    const headers = 'name,type,headName,headPosition,headEmail,address,phone,website,socialMedia,tags';
    
    // Example row with properly formatted data
    const exampleRow = 'City Hall,administrative_unit,John Smith,Mayor,john.smith@example.com,123 Main Street,+12345678901,https://example.com,@cityhallex,government/local';
    
    const csvContent = [
      comments,
      headers,
      exampleRow
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'entity_template.csv');
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
    // Check file extension
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvValidationError('Please select a CSV file');
      return false;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setCsvValidationError('File size exceeds 5MB limit');
      return false;
    }
    
    try {
      // Read file content to validate it contains expected headers
      const text = await file.text();
      
      // Skip any comment line (starting with #)
      const lines = text.split('\n').filter(line => !line.trim().startsWith('#'));
      
      if (lines.length < 2) {
        setCsvValidationError('The CSV file must contain at least a header row and one data row');
        return false;
      }
      
      // Get the first line with actual content (header row)
      // Convert to lowercase and trim whitespace for case-insensitive comparison
      const headerLine = lines[0].toLowerCase();
      const headers = headerLine.split(',').map(h => h.trim());
      
      // Define the required headers 
      const requiredHeaders = ['name', 'type', 'headname', 'headposition', 'heademail'];
      
      console.log('CSV Headers found:', headers);
      
      // Check for required headers
      const missingHeaders = requiredHeaders.filter(rh => {
        return !headers.includes(rh);
      });
      
      if (missingHeaders.length > 0) {
        setCsvValidationError(`Required headers missing: ${missingHeaders.join(', ')}`);
        return false;
      }
      
      return true;
    } catch (error) {
      setCsvValidationError('Error reading CSV file');
      console.error('CSV validation error:', error);
      return false;
    }
  };
  
  // Import CSV mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiRequest('POST', '/api/entities/import', formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import entities');
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
    if (!selectedFile) return;
    
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
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t("entities.import.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("entities.import.description")}
          </p>
        </div>
        
        {/* Instructions Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("entities.import.how_to.title")}</CardTitle>
            <CardDescription>
              {t("entities.import.how_to.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("entities.import.steps.download")}</li>
              <li>{t("entities.import.steps.fill")}</li>
              <li>{t("entities.import.steps.upload")}</li>
              <li>{t("entities.import.steps.review")}</li>
              <li>{t("entities.import.steps.confirm")}</li>
            </ol>
            
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>{t("entities.types.note_title")}</AlertTitle>
              <AlertDescription>
                {t("entities.types.valid_types")}
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>{t("entities.members.import_title")}</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{t("entities.members.import_description_1")}</p>
                <p className="mb-2">{t("entities.members.import_description_2")}</p>
                <p>{t("entities.members.import_description_3")}</p>
              </AlertDescription>
            </Alert>
            
            <div className="pt-2">
              <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> {t("entities.import.download_template")}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* File Upload Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("entities.import.upload.title")}</CardTitle>
            <CardDescription>
              {t("entities.import.upload.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {selectedFile 
                  ? t("entities.import.upload.file_selected", { filename: selectedFile.name }) 
                  : t("entities.import.upload.dropzone_text")
                }
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
                disabled={importMutation.isPending}
              >
                {t("entities.import.upload.select_button")}
              </Button>
            </div>
            
            {csvValidationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t("entities.import.validation.error_title")}</AlertTitle>
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
              {t("entities.import.buttons.reset")}
            </Button>
            <Button 
              variant="default" 
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedFile || !!csvValidationError || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("entities.import.buttons.importing")}
                </>
              ) : (
                t("entities.import.buttons.import")
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>{t("entities.import.results.title")}</CardTitle>
              <CardDescription>
                {t("entities.import.results.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.results.total_processed")}</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.results.successful")}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.successful}</p>
                </div>
                
                <div className={`${importResult.failed > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/30'} p-4 rounded-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">{t("entities.import.results.failed")}</span>
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
                    <span className="text-sm font-medium">{t("entities.import.results.users_created")}</span>
                    <Info className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.usersCreated || 0}</p>
                </div>
              </div>
              
              {/* Display created users */}
              {importResult.userDetails && importResult.userDetails.length > 0 && (
                <div className="mt-6 mb-2">
                  <h3 className="text-lg font-medium mb-2">{t("entities.import.results.created_users")}</h3>
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
                    <li>{t("entities.import.action_create_entities")}</li>
                    <li>{t("entities.import.action_create_entity_heads")}</li>
                    <li>{t("entities.import.action_generate_usernames")}</li>
                    <li>{t("entities.import.action_generate_passwords")}</li>
                  </ul>
                  <div className="mt-2 text-sm font-medium">{t("entities.import.note_members")}</div>
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