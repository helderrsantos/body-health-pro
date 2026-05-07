import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

export interface ButtonProps extends ButtonPrimitive.Props, VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loadingText?: string
  showLoadingText?: boolean
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  isLoading = false,
  loadingText = 'Carregando...',
  showLoadingText = true,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {showLoadingText ? loadingText : null}
        </span>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button }
