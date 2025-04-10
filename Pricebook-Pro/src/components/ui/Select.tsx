import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}
interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {}

export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => (
  <select
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '', ...props }) => (
  <button
    className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${className}`}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
);

export const SelectContent: React.FC<SelectContentProps> = ({ children, className = '', ...props }) => (
  <div
    className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const SelectItem: React.FC<SelectItemProps> = ({ children, value, className = '', ...props }) => (
  <option
    value={value}
    className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </option>
);

export const SelectValue: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ children, ...props }) => (
  <span {...props}>{children}</span>
); 