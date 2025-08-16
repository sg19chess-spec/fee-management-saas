import React from 'react';
import { clsx } from 'clsx';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

const alertVariants = {
  default: 'alert',
  destructive: 'alert-destructive',
  success: 'alert-success',
  warning: 'alert-warning',
  info: 'alert-info',
};

const alertIcons = {
  default: InformationCircleIcon,
  destructive: XCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  info: InformationCircleIcon,
};

export function Alert({
  variant = 'default',
  children,
  className,
}: AlertProps) {
  const Icon = alertIcons[variant];

  return (
    <div className={clsx(alertVariants[variant], className)}>
      <Icon className="h-4 w-4" />
      <div className="ml-3">
        {children}
      </div>
    </div>
  );
}
