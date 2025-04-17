import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

interface FilePreviewProps {
  fileId: number;
  fileName: string;
  fileType: string;
}

export default function FilePreview({ fileId, fileName, fileType }: FilePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  console.log('File preview props:', { fileId, fileName, fileType });
  
  // Use both regex and simple includes check for more robust type detection
  const isImage = fileType && (
    /^image\/(jpeg|jpg|png|gif|webp)$/i.test(fileType) || 
    ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(fileType.toLowerCase()) ||
    fileType.toLowerCase().includes('image')
  );
  
  const isPdf = fileType && (
    fileType === 'application/pdf' || 
    fileType.toLowerCase().includes('pdf')
  );
  
  // Force all files to be previewable for testing
  const isPreviewable = true; // isImage || isPdf;
  
  console.log('File preview analysis:', { isImage, isPdf, isPreviewable });
  
  // If file is not previewable, just provide a download button
  if (!isPreviewable) {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/download/${fileId}`} download>
          <Download className="h-4 w-4 mr-1" />
          Download
        </a>
      </Button>
    );
  }
  
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.25, 0.5));
  };
  
  const handleRotate = () => {
    setRotation(prevRotation => (prevRotation + 90) % 360);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Reset states when opening the dialog
      setError(null);
      setIsLoading(true);
      setZoom(1);
      setRotation(0);
    }
    setIsOpen(open);
  };
  
  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            View
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{fileName}</DialogTitle>
              <DialogDescription>
                {isImage ? 'Image preview' : 'PDF document'}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              {isImage && (
                <Button variant="outline" size="icon" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" size="icon" asChild>
                <a href={`/api/download/${fileId}`} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
              <DialogClose asChild>
                <Button variant="outline" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-md">
            {error ? (
              <div className="text-center py-8">
                <p className="text-red-500 font-medium mb-2">Error loading preview</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  asChild
                >
                  <a href={`/api/download/${fileId}`} download>
                    <Download className="h-4 w-4 mr-1" />
                    Download instead
                  </a>
                </Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8 flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Loading preview...</p>
              </div>
            ) : isImage ? (
              <img 
                src={`/api/download/${fileId}`}
                alt={fileName}
                style={{ 
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError("Failed to load image. The file may be corrupted or not accessible.");
                  setIsLoading(false);
                }}
              />
            ) : isPdf ? (
              <iframe
                src={`/api/download/${fileId}?embed=true`}
                title={fileName}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError("Failed to load PDF. The file may be corrupted or not accessible.");
                  setIsLoading(false);
                }}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">Preview not available</p>
                <p className="text-sm text-muted-foreground">This file type cannot be previewed.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  asChild
                >
                  <a href={`/api/download/${fileId}`} download>
                    <Download className="h-4 w-4 mr-1" />
                    Download file
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Button variant="outline" size="sm" asChild>
        <a href={`/api/download/${fileId}`} download>
          <Download className="h-4 w-4 mr-1" />
          Download
        </a>
      </Button>
    </div>
  );
}