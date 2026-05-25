import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {}

function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  disabled,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button }
