import React from 'react';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  isActive: boolean;
  onClick: (value: string) => void;
}

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  isActive: boolean;
}

export const Tabs: React.FC<TabsProps> = ({ children, className = '', ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export const TabsList: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`} {...props}>
    {children}
  </div>
);

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value, isActive, onClick, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-background text-foreground shadow-sm' : ''} ${className}`}
    onClick={() => onClick(value)}
    {...props}
  >
    {children}
  </button>
);

export const TabsContent: React.FC<TabsContentProps> = ({ children, value, isActive, className = '', ...props }) => (
  <div className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!isActive ? 'hidden' : ''} ${className}`} {...props}>
    {children}
  </div>
); 