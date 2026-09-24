// shadcn/ui Input, MIT. Adapted to TAB's design system and mobile input sizing.
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils.ts';
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => <input ref={ref} type={type} className={cn('input', className)} {...props} />);
Input.displayName = 'Input';
