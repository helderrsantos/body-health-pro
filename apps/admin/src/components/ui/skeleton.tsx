import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[rgba(169,255,46,0.07)]', className)}
      {...props}
    />
  )
}

export { Skeleton }
