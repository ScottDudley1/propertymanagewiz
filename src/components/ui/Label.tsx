'use client'

import { type LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const base = 'block text-sm font-medium text-gray-700 mb-1';

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn(base, className)} {...props} />
  ),
);
Label.displayName = 'Label';
