import { useId, type ReactNode } from 'react'
import { Controller, type Control, type FieldValues, type UseControllerProps } from 'react-hook-form'
import { FieldShell } from '@/components/ui/field-shell'
import { cn } from '@/lib/utils'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>

type SelectFieldProps<
  TFieldValues extends FieldValues,
  TContext = undefined,
  TTransformedValues = TFieldValues,
> = Omit<SelectProps, 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'children'> &
  Omit<UseControllerProps<TFieldValues>, 'control'> & {
    control?: Control<TFieldValues, TContext, TTransformedValues>
    label: string
    children: ReactNode
    containerClassName?: string
  }

export function Select({ className, children, ...props }: Readonly<SelectProps>) {
  return (
    <select className={cn('w-full flex-1 border-0 bg-transparent px-0 py-0 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm', className)} {...props}>
      {children}
    </select>
  )
}

export function SelectField<
  TFieldValues extends FieldValues,
  TContext = undefined,
  TTransformedValues = TFieldValues,
>({
  control,
  name,
  label,
  children,
  containerClassName,
  className,
  ...props
}: Readonly<SelectFieldProps<TFieldValues, TContext, TTransformedValues>>) {
  const fieldId = useId()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldShell
          id={fieldId}
          label={label}
          disabled={props.disabled}
          error={fieldState.error?.message}
          className={containerClassName}
        >
          <Select id={fieldId} className={className} {...field} {...props}>
            {children}
          </Select>
        </FieldShell>
      )}
    />
  )
}
