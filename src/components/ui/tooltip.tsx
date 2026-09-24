// Adapted shadcn/ui Tooltip (MIT).
import type { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
export function Hint({ label, children }: {
  label: string;
  children: ReactNode
 }) {

  return <Tooltip.Provider delayDuration={400}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        {children}
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content className="tooltip" sideOffset={7}>
          {label}
          <Tooltip.Arrow className="tooltip-arrow" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>;
}
