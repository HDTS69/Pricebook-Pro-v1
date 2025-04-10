import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const variants = {
  default: 'bg-background border',
  destructive:
    'destructive group border-destructive bg-destructive text-destructive-foreground',
  success: 'bg-green-500 text-white border-green-600',
};

export const Toast: React.FC<ToastProps> = ({
  className = '',
  variant = 'default',
  open = false,
  onOpenChange,
  duration = 5000,
  title,
  description,
  action,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    setIsVisible(open);
  }, [open]);

  useEffect(() => {
    if (isVisible && duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onOpenChange?.(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onOpenChange]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed
        bottom-4
        right-4
        z-50
        flex
        w-full
        max-w-md
        items-center
        gap-4
        rounded-lg
        border
        p-6
        shadow-lg
        transition-all
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      <div className="grid gap-1">
        {title && (
          <div className="text-sm font-semibold">
            {title}
          </div>
        )}
        {description && (
          <div className="text-sm opacity-90">
            {description}
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center space-x-2">
        {action}
      </div>
      <button
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
        onClick={() => {
          setIsVisible(false);
          onOpenChange?.(false);
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}; 