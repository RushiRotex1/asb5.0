import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
    </div>
  );
};