import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
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
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle, Info, Download, Building, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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

export default function EntityMemberImportPage() {
  const [, setLocation] = useLocation();
  const { entityId } = useParams<{ entityId: string }>();
  const { t } = useTranslation();
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvValidationError, setCsvValidationError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  
  // Fetch entity details
  const { data: entity, isLoading: entityLoading, error: entityError } = useQuery<Entity>({
    queryKey: [`/api/entities/${entityId}`],
    enabled: !!entityId,
  });
  
  // Download CSV template
  const downloadTemplate = () => {
    // Create a multi-line comment with detailed instructions
    const comments = [
      '# CSV Template for Entity Member Import',
      '# ',
      '# REQUIRED FIELDS (case-sensitive):',
      '# - fullName: Member\'s full name',
      '# - email: Member\'s email address',
      '# - position: Member\'s position or role in the entity',
      '# ',
      '# OPTIONAL FIELDS:',
      '# - phone: Contact phone number',
      '# - whatsapp: WhatsApp number (must include country code)',
      '# - telegram: Telegram username (without @ symbol)',
      '# '
    ].join('\n');
    
    // Header row with column names - EXACT match with validation
    const headers = 'fullName,email,position,phone,whatsapp,telegram';
    
    // Example rows with properly formatted data
    const exampleRow1 = 'Jane Doe,jane.doe@example.com,Secretary,+12345678902,+12345678902,janedoe';
    const exampleRow2 = 'Bob Johnson,bob.johnson@example.com,IT Manager,+12345678903,,';
    const exampleRow3 = 'Susan Smith,susan.smith@example.com,Accountant,,,susansmith';
    
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
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${entity?.name || 'entity'}_members_template.csv`);
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
      const requiredHeaders = ['fullname', 'email', 'position'];
      
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
      
      const response = await apiRequest('POST', `/api/entities/${entityId}/members/import`, formData, true);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import entity members');
      }
      
      return await response.json() as ImportResult;
    },
    onSuccess: (data) => {
      setImportResult(data);
      toast({
        title: "Import complete",
        description: `Processed ${data.totalProcessed} members: ${data.successful} successful, ${data.failed} failed`,
        variant: data.failed > 0 ? "destructive" : "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
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
  
  // Go back to entity details
  const goBackToEntityDetail = () => {
    setLocation(`/entities/${entityId}`);
  };

  if (entityLoading) {
    return (
      <DashboardLayout>
        <div className="container px-4 py-6 max-w-5xl flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (entityError) {
    return (
      <DashboardLayout>
        <div className="container px-4 py-6 max-w-5xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t("errors.error")}</AlertTitle>
            <AlertDescription>
              {t("entities.could_not_load_entity")}
            </AlertDescription>
          </Alert>
          <Button onClick={goBackToEntityDetail} variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("entities.back_to_entities")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-2 mb-2">
          <Button onClick={goBackToEntityDetail} variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("entities.members.import_members")}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-4 w-4" />
              <p>{entity?.name}</p>
            </div>
          </div>
        </div>
        
        {/* Instructions Card */}
        <Card className="mb-8 mt-6">
          <CardHeader>
            <CardTitle>{t("entities.import.member_import.instructions_title")}</CardTitle>
            <CardDescription>
              {t("entities.import.member_import.instructions_description")} {entity?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>{t("entities.import.steps.download_template")}</li>
              <li>{t("entities.import.steps.fill_data")}</li>
              <li>{t("entities.import.steps.upload_file")}</li>
              <li>{t("entities.import.steps.review_results")}</li>
              <li>{t("entities.import.steps.confirm_import")}</li>
            </ol>
            
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>{t("entities.import.required_fields")}</AlertTitle>
              <AlertDescription>
                <p>{t("entities.import.required_fields_description", { fields: "fullName, email, position" })}</p>
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
              <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> {t("entities.import.member_import.csv_template")}
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
                disabled={importMutation.isPending}
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
              disabled={!selectedFile || !!csvValidationError || importMutation.isPending}
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
                  <h3 className="text-lg font-medium mb-2">Created Users</h3>
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Temporary Password</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.userDetails.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.fullName}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                                Entity Member
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
                    Make sure to save these credentials or communicate them to the users securely. 
                    These temporary passwords will only be shown once.
                  </p>
                </div>
              )}
              
              {/* Display errors */}
              {importResult.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">Error Details</h3>
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Error</TableHead>
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
                Import Another File
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Member Import</AlertDialogTitle>
              <AlertDialogDescriptionCustom>
                <div className="space-y-2">
                  <div>Are you sure you want to import members for <strong>{entity?.name}</strong> from <strong>{selectedFile?.name}</strong>?</div>
                  <div>This will add new members to the entity with the following actions:</div>
                  <ul className="list-disc pl-5 text-sm">
                    <li>Create entity members as users with 'entity_member' role</li>
                    <li>Generate usernames based on email addresses</li>
                    <li>Generate temporary passwords for all created users</li>
                    <li>Associate the members with {entity?.name}</li>
                  </ul>
                </div>
              </AlertDialogDescriptionCustom>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startImport}>
                Proceed with Import
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}