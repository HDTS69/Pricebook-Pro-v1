import { FileDown, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface PdfPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  pdfUrl: string | null;
  title: string;
  isLoading?: boolean;
}

export function PdfPreviewDialog({
  isOpen,
  onClose,
  onDownload,
  pdfUrl,
  title,
  isLoading = false,
}: PdfPreviewDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
        aria-labelledby="pdf-preview-title"
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
          <DialogTitle id="pdf-preview-title">{title}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={isLoading || !pdfUrl}
              aria-label="Download PDF"
              title="Download PDF"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              aria-label="Close preview"
              title="Close preview"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden relative min-h-[60vh] bg-background dark:bg-background">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-muted-foreground">Generating PDF...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={pdfUrl} 
              className="w-full h-full border-0"
              title="PDF Preview"
              sandbox="allow-same-origin allow-scripts"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No PDF to display</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 