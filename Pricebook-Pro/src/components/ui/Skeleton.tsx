import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}) => {
  const baseStyles = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
    ...style,
  };

  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-[shimmer_2s_infinite]',
    none: '',
  }[animation];

  const variantClass = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  }[variant];

  return (
    <div
      className={`
        bg-muted/50
        ${animationClass}
        ${variantClass}
        ${className}
      `}
      style={baseStyles}
      {...props}
    />
  );
};

// Optional: Add keyframes for wave animation to your global CSS
// @keyframes shimmer {
//   0% {
//     background-position: -200% 0;
//   }
//   100% {
//     background-position: 200% 0;
//   }
// } 