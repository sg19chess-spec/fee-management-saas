import React from 'react';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface AlertProps {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info';
  className?: string;
  onClose?: () => void;
  dismissible?: boolean;
}

export function Alert({ 
  children, 
  variant = 'info',
  className,
  onClose,
  dismissible = false
}: AlertProps) {
  const baseClasses = 'rounded-lg p-4 border';
  
  const variantClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return CheckCircleIcon;
      case 'error':
        return XCircleIcon;
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const Icon = getIcon();

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconClasses[variant]}`} />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm">
            {children}
          </div>
        </div>
        {dismissible && onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  {
                    'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600': variant === 'success',
                    'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600': variant === 'error',
                    'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600': variant === 'warning',
                    'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600': variant === 'info',
                  }
                )}
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
