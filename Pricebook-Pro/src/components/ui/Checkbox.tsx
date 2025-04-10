import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  className = '', 
  label,
  ...props 
}) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className={`
            peer
            h-4
            w-4
            shrink-0
            rounded-sm
            border
            border-primary
            ring-offset-background
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-ring
            focus-visible:ring-offset-2
            disabled:cursor-not-allowed
            disabled:opacity-50
            ${className}
          `}
          {...props}
        />
        <Check
          className="
            absolute
            top-1/2
            left-1/2
            h-3
            w-3
            -translate-x-1/2
            -translate-y-1/2
            opacity-0
            text-white
            transition-opacity
            peer-checked:opacity-100
            peer-checked:[&:not(:disabled)]:bg-primary
          "
        />
      </div>
      {label && (
        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </span>
      )}
    </label>
  );
}; 