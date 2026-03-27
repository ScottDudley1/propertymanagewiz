'use client'

import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, ...props }, ref) => (
    <label className={cn('relative inline-flex items-center cursor-pointer', className)}>
      <input ref={ref} type="checkbox" className="sr-only peer" {...props} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-violet-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500" />
    </label>
  ),
);
Toggle.displayName = 'Toggle';
