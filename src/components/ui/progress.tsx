// Adapted shadcn/ui Progress (MIT). null means indeterminate, never fake progress.
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils.ts';
export function Progress({ value, label, className }: {
  value: number | null;
  label: string;
  className?: string
 }) {

  return <ProgressPrimitive.Root className={cn('progress', value === null && 'indeterminate', className)} value={value === null ? null : value * 100} aria-label={label}>
    <ProgressPrimitive.Indicator className="progress-fill" style={value === null ? undefined : { transform: `scaleX(${Math.max(0, Math.min(1, value))})` }} />
  </ProgressPrimitive.Root>;
}
