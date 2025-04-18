import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const EntityImportPage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sample template format
  const templateData = `name,type,headName,headPosition,headEmail,address,phone,website,socialMedia,tags
"Secretariat of Education","secretariat","John Doe","Secretary","johndoe@example.gov.br","123 Main St","5548999887766","education.gov.br","@educsec","education,government"
"Department of Urban Planning","administrative_unit","Jane Smith","Director","janesmith@example.gov.br","456 Park Ave","5548988776655","urbanplanning.gov.br","@urbanplan","urbanplanning,development"`;

  // Create downloadable template
  const handleDownloadTemplate = () => {
    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'entity-import-template.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a CSV file.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setValidationErrors([]);
      setImportResult(null);
    }
  };

  // Trigger file input click
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Validate CSV before uploading
  const validateCSV = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const errors: string[] = [];
        
        // Basic validation
        if (!content) {
          errors.push('File is empty');
          setValidationErrors(errors);
          return resolve(false);
        }
        
        const lines = content.split('\n');
        if (lines.length < 2) {
          errors.push('File must contain at least one header row and one data row');
          setValidationErrors(errors);
          return resolve(false);
        }

        // Check header
        const header = lines[0].trim().toLowerCase();
        const requiredColumns = ['name', 'type', 'headname', 'headposition', 'heademail'];
        
        for (const column of requiredColumns) {
          if (!header.includes(column)) {
            errors.push(`Missing required column: ${column}`);
          }
        }
        
        // Validate entity types in file
        const validTypes = ['secretariat', 'administrative_unit', 'external_entity', 'government_agency', 'association', 'council'];
        
        // Skip header and validate each row
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          // Simple CSV parsing (this doesn't handle quoted values with commas properly)
          const values = line.split(',');
          if (values.length < 5) {
            errors.push(`Row ${i} has insufficient columns`);
            continue;
          }
          
          // Check entity type (column 1)
          const type = values[1].trim().toLowerCase().replace(/"/g, '');
          if (!validTypes.includes(type)) {
            errors.push(`Row ${i}: Invalid entity type "${type}". Valid types are: ${validTypes.join(', ')}`);
          }
          
          // Check email format (column 4)
          const email = values[4].trim().replace(/"/g, '');
          if (!email.includes('@')) {
            errors.push(`Row ${i}: Invalid email format "${email}"`);
          }
        }
        
        setValidationErrors(errors);
        resolve(errors.length === 0);
      };
      
      reader.readAsText(file);
    });
  };

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Custom upload with progress
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', '/api/entities/import', true);
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };
        
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error('Invalid response format'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Import failed'));
            } catch (e) {
              reject(new Error(`Server error: ${xhr.status}`));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error occurred'));
        };
        
        xhr.send(formData);
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
      setImportResult({
        totalProcessed: data.totalProcessed,
        successful: data.successful,
        failed: data.failed,
        errors: data.errors || []
      });
      toast({
        title: 'Import completed',
        description: `Successfully imported ${data.successful} entities`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle import submission
  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import.',
        variant: 'destructive',
      });
      return;
    }
    
    setUploadProgress(0);
    
    // Validate file before uploading
    const isValid = await validateCSV(selectedFile);
    if (!isValid) {
      toast({
        title: 'Validation failed',
        description: 'Please fix the errors and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    // Start import
    importMutation.mutate(selectedFile);
  };

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Entity Import</h1>
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Import Entities from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file containing entity data to bulk import into the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* File upload section */}
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800">
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-4">
                  Select a CSV file with entity data to import
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <div className="flex gap-4">
                  <Button
                    onClick={handleSelectFile}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Select File
                  </Button>
                  
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || importMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4" />
                        Import Entities
                      </>
                    )}
                  </Button>
                </div>
                
                {selectedFile && (
                  <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-700 rounded flex items-center gap-2 w-full max-w-md">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </div>
              
              {/* Display validation errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Display upload progress */}
              {importMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              {/* Display import results */}
              {importResult && (
                <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Import Results</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <p>Total entities processed: {importResult.totalProcessed}</p>
                      <p className="text-green-600">Successfully imported: {importResult.successful}</p>
                      {importResult.failed > 0 && (
                        <p className="text-red-600">Failed imports: {importResult.failed}</p>
                      )}
                      
                      {importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Errors:</p>
                          <ul className="list-disc pl-5 mt-1 text-sm space-y-1">
                            {importResult.errors.map((error, index) => (
                              <li key={index} className="text-red-600">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Guidelines</CardTitle>
            <CardDescription>
              Follow these guidelines to ensure your CSV file is properly formatted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Required Columns</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Your CSV file must contain the following columns:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li><strong>name</strong> - Entity name (required)</li>
                  <li><strong>type</strong> - Entity type (required, must be one of: secretariat, administrative_unit, external_entity, government_agency, association, council)</li>
                  <li><strong>headName</strong> - Name of the entity head (required)</li>
                  <li><strong>headPosition</strong> - Position of the entity head (required)</li>
                  <li><strong>headEmail</strong> - Email of the entity head (required)</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Optional Columns</h3>
                <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                  <li><strong>address</strong> - Physical address of the entity</li>
                  <li><strong>phone</strong> - Contact phone number</li>
                  <li><strong>website</strong> - Entity website URL</li>
                  <li><strong>socialMedia</strong> - Social media handles</li>
                  <li><strong>tags</strong> - Comma-separated list of tags (the list itself should be inside quotes if using commas between tags)</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium">Example</h3>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-xs overflow-x-auto mt-2">
                  {templateData}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EntityImportPage;