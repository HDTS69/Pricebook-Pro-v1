import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  title?: string;
}

const variants = {
  default: {
    containerClass: 'bg-primary/10 text-primary border-primary/20',
    icon: Info
  },
  destructive: {
    containerClass: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: XCircle
  },
  success: {
    containerClass: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: CheckCircle
  },
  warning: {
    containerClass: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    icon: AlertCircle
  }
};

export const Alert: React.FC<AlertProps> = ({
  className = '',
  variant = 'default',
  title,
  children,
  ...props
}) => {
  const Icon = variants[variant].icon;

  return (
    <div
      role="alert"
      className={`
        relative
        w-full
        rounded-lg
        border
        p-4
        [&>svg]:absolute
        [&>svg]:left-4
        [&>svg]:top-4
        [&>svg+div]:translate-y-[-3px]
        [&:has(svg)]:pl-11
        ${variants[variant].containerClass}
        ${className}
      `}
      {...props}
    >
      <Icon className="h-5 w-5" />
      <div className="flex flex-col space-y-1">
        {title && (
          <h5 className="font-medium leading-none tracking-tight">
            {title}
          </h5>
        )}
        <div className="text-sm [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}; 