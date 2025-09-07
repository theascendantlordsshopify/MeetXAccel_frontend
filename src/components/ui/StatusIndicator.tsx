import React from 'react';
import { clsx } from 'clsx';

interface StatusIndicatorProps {
  status: 'active' | 'inactive' | 'error' | 'warning' | 'success' | 'pending';
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };
  
  const statusColors = {
    active: 'bg-accent-500',
    success: 'bg-accent-500',
    inactive: 'bg-neutral-400',
    error: 'bg-danger-500',
    warning: 'bg-warning-500',
    pending: 'bg-warning-500',
  };
  
  const textColors = {
    active: 'text-accent-700',
    success: 'text-accent-700',
    inactive: 'text-neutral-500',
    error: 'text-danger-700',
    warning: 'text-warning-700',
    pending: 'text-warning-700',
  };
  
  return (
    <div className="flex items-center">
      <span
        className={clsx(
          'inline-block rounded-full mr-2',
          dotSizes[size],
          statusColors[status]
        )}
      />
      {label && (
        <span className={clsx('text-sm font-medium', textColors[status])}>
          {label}
        </span>
      )}
    </div>
  );
};