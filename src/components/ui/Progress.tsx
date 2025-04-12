import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showValue = false,
  size = 'md',
  className = '',
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="relative">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        className={`
          w-full
          overflow-hidden
          rounded-full
          bg-primary/20
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
      {showValue && (
        <span className="absolute right-0 -top-6 text-sm text-gray-600">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}; 