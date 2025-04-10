import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface DialogProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Dialog: React.FC<DialogProps> = ({ children, open, onOpenChange }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>{children}</div>
);

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className = '', ...props }) => (
  <div className={`pb-4 border-b ${className}`} {...props}>{children}</div>
);

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold ${className}`} {...props}>{children}</h2>
);

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className = '', ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>{children}</p>
);

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className = '', ...props }) => (
  <div className={`pt-4 border-t flex justify-end space-x-2 ${className}`} {...props}>{children}</div>
);

export const DialogClose: React.FC<DialogCloseProps> = ({ children, onClick, ...props }) => (
  <Button variant="ghost" onClick={onClick} {...props}>
    {children || <X className="h-4 w-4" />}
  </Button>
); 