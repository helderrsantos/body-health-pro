import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import React from 'react'

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  className?: string
}

function CheckboxComponent({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer h-5 w-5 shrink-0 rounded border border-[rgba(169,255,46,0.3)] bg-[rgba(9,16,12,0.86)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a9ff2e] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#a9ff2e] data-[state=checked]:text-neutral-950 data-[state=checked]:border-[#a9ff2e]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { CheckboxComponent }
