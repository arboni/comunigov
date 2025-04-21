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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Upload, AlertTriangle, CheckCircle, XCircle, Info, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { useToast } from "@/hooks/use-toast";

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
        title: "Import complete",
        description: `Processed ${data.totalProcessed} entities: ${data.successful} successful, ${data.failed} failed`,
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
  
  return (
    <DashboardLayout>
      <div className="container px-4 py-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Import Entities</h1>
          <p className="text-muted-foreground mt-2">
            Bulk import entities from a CSV file
          </p>
        </div>
        
        {/* Instructions Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How to Import Entities</CardTitle>
            <CardDescription>
              Follow these steps to bulk import entities into the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Download the CSV template file</li>
              <li>Fill in the entity data following the template format</li>
              <li>Upload the completed CSV file</li>
              <li>Review the validation results and fix any errors</li>
              <li>Confirm the import to add the entities to the system</li>
            </ol>
            
            <Alert className="bg-muted/50">
              <Info className="h-4 w-4" />
              <AlertTitle>Note about entity types</AlertTitle>
              <AlertDescription>
                Valid entity types are: secretariat, administrative_unit, external_entity, government_agency, association, council
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertTitle>Entity Members Import</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Entity members are now imported separately through a dedicated import process.</p>
                <p className="mb-2">First create the entity using this import, then go to the entity detail page to import its members.</p>
                <p>This separation makes it easier to manage entities and their members without formatting issues.</p>
              </AlertDescription>
            </Alert>
            
            <div className="pt-2">
              <Button onClick={downloadTemplate} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Download CSV Template
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* File Upload Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file with entity data to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select or drag & drop CSV file'}
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
                Select File
              </Button>
            </div>
            
            {csvValidationError && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Validation Error</AlertTitle>
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
              Reset
            </Button>
            <Button 
              variant="default" 
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedFile || !!csvValidationError || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                </>
              ) : (
                'Import Entities'
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Import Results */}
        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                Summary of the entity import operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Processed</span>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.totalProcessed}</p>
                </div>
                
                <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Successful</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold">{importResult.successful}</p>
                </div>
                
                <div className={`${importResult.failed > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-muted/30'} p-4 rounded-lg`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Failed</span>
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
                    <span className="text-sm font-medium">Users Created</span>
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
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                user.role === 'entity_head' 
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                              }`}>
                                {user.role === 'entity_head' ? 'Entity Head' : 'Entity Member'}
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
              <AlertDialogTitle>Confirm Entity Import</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>Are you sure you want to import the entities from <strong>{selectedFile?.name}</strong>?</p>
                <p>This will add new entities to the system with the following actions:</p>
                <ul className="list-disc pl-5 text-sm">
                  <li>Create entities based on CSV data</li>
                  <li>Create entity heads as users with 'entity_head' role</li>
                  <li>Generate usernames based on email addresses</li>
                  <li>Generate temporary passwords for all created users</li>
                </ul>
                <p className="mt-2 text-sm font-medium">Note: Entity members can be imported separately after creating the entity.</p>
              </AlertDialogDescription>
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