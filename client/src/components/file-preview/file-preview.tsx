import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
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
  
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(fileType);
  const isPdf = fileType === 'application/pdf';
  const isPreviewable = isImage || isPdf;
  
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
  
  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            {isImage ? (
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
              />
            ) : isPdf && (
              <iframe
                src={`/api/download/${fileId}?embed=true`}
                title={fileName}
                className="w-full h-full border-0"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease',
                }}
              />
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