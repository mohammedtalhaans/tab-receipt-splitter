// shadcn/ui Button, MIT. Adapted: thermal variants, 44px+ targets, tactile states.
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils.ts';
const buttonVariants = cva('btn', {
  variants: {
    variant: { primary: 'btn-primary', secondary: 'btn-secondary', ghost: 'btn-ghost', danger: 'btn-danger', paper: 'btn-paper' },
    size: { default: 'btn-default', large: 'btn-large', icon: 'btn-icon', small: 'btn-small' }
  },
  defaultVariants: { variant: 'primary', size: 'default' },
});
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
 }
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ asChild, className, variant, size, type = 'button', ...props }, ref) => {

  const Component = asChild ? Slot : 'button';

  return <Component ref={ref} type={asChild ? undefined : type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
