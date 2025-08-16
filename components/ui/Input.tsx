import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export function Input({
  error,
  label,
  helperText,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
        </label>
      )}
      
      <input
        id={inputId}
        className={clsx(
          'input',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      
      {error && (
        <p className="form-message-destructive text-sm">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="form-description text-sm">
          {helperText}
        </p>
      )}
    </div>
  );
}
