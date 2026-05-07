import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-[rgba(9,16,12,0.86)] rounded-2xl border border-[rgba(169,255,46,0.2)]',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4', className)} {...props} />
}

function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 flex items-center justify-between', className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('font-semibold text-[#d8ffe8]', className)} {...props} />
}

function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-xs text-gray-400 mt-1', className)} {...props} />
}

export { Card, CardContent, CardHeader, CardTitle, CardDescription }
