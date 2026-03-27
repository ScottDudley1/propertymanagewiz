'use client'

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'danger' | 'purple';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <span ref={ref} className={cn(base, variants[variant], className)} {...props} />
  ),
);
Badge.displayName = 'Badge';
