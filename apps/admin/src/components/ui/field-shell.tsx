import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FieldShellProps {
  id?: string
  label: string
  disabled?: boolean
  error?: string
  className?: string
  children: ReactNode
}

export function FieldShell({
  id,
  label,
  disabled,
  error,
  className,
  children,
}: Readonly<FieldShellProps>) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-[#a9ff2e]" aria-disabled={disabled}>
        {label}
      </label>
      {children}
      {error ? <small className="text-red-500 text-xs">{error}</small> : null}
    </div>
  )
}