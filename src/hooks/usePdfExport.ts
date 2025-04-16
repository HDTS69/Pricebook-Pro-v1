import { useRef, useState } from 'react';
import { generateQuotePdf, generateJobPdf } from '@/lib/pdfGenerator';
import { useSimpleToast } from '@/components/ui/simple-toast';

export function usePdfExport() {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const jobRef = useRef<HTMLDivElement>(null);
  const { toast } = useSimpleToast();

  const exportQuoteToPdf = async (quoteId: string) => {
    try {
      if (!quoteRef.current) {
        throw new Error('Quote template reference not available');
      }

      setIsGenerating(true);
      await generateQuotePdf(quoteId, `quote-pdf-${quoteId}`, {
        filename: `quote-${quoteId}.pdf`,
      });
      
      toast({
        title: 'Success',
        description: 'Quote has been exported to PDF',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating quote PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export quote to PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewQuotePdf = async (templateId: string) => {
    try {
      const element = document.getElementById(templateId);
      if (!element) {
        throw new Error(`Element with ID ${templateId} not found`);
      }

      setIsGenerating(true);
      setPreviewUrl(null);

      const result = await generateQuotePdf(templateId, templateId, {
        filename: `quote-${templateId}.pdf`,
        preview: true,
      });
      
      // Type guard to check if result is a string (URL) or void
      if (typeof result === 'string') {
        setPreviewUrl(result);
        setIsPreviewOpen(true);
        return result;
      } else {
        // If result is void, throw an error
        throw new Error('Failed to generate PDF preview');
      }
    } catch (error) {
      console.error('Error generating quote PDF preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF preview',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const exportJobToPdf = async (jobId: string) => {
    try {
      if (!jobRef.current) {
        throw new Error('Job template reference not available');
      }

      setIsGenerating(true);
      await generateJobPdf(jobId, `job-pdf-${jobId}`, {
        filename: `job-${jobId}.pdf`,
      });
      
      toast({
        title: 'Success',
        description: 'Job has been exported to PDF',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating job PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export job to PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const previewJobPdf = async (jobId: string) => {
    try {
      if (!jobRef.current) {
        throw new Error('Job template reference not available');
      }

      setIsGenerating(true);
      setPreviewUrl(null);

      const pdfUrl = await generateJobPdf(jobId, `job-pdf-${jobId}`, {
        filename: `job-${jobId}.pdf`,
        preview: true,
      }) as string;
      
      setPreviewUrl(pdfUrl);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error generating job PDF preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF preview',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  return {
    quoteRef,
    jobRef,
    isGenerating,
    isPreviewOpen,
    previewUrl,
    exportQuoteToPdf,
    previewQuotePdf,
    exportJobToPdf,
    previewJobPdf,
    closePreview,
  };
} 