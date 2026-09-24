// Adapted shadcn/ui Toggle Group (MIT), with a custom shared-layout selection plate.
import { useId } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { snappySpring } from '../../lib/motion.ts';
export function Segmented({ value, onChange, options, label }: {
  value: string;
  onChange: (value: string) => void;
  options: {
    value: string;
    label: string
   }[];
  label: string
 }) {

  const id = useId();
  const reduced = useReducedMotion();

  return <LayoutGroup id={id}>
    <ToggleGroup.Root type="single" value={value} onValueChange={next => {
      if (next) onChange(next);
    }} className="segmented" aria-label={label}>
      {options.map(option => <ToggleGroup.Item key={option.value} value={option.value} className="segment">
        {value === option.value && <motion.span className="segment-plate" layoutId="selection" transition={reduced ? { duration: 0 } : snappySpring} />}
        <span>
          {option.label}
        </span>
      </ToggleGroup.Item>)}
    </ToggleGroup.Root>
  </LayoutGroup>;
}
