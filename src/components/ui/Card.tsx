'use client'

import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

const base = 'bg-white rounded-xl border border-gray-200 p-6';

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(base, hover && 'hover:shadow-lg transition-shadow', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
