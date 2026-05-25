import { Skeleton } from "./ui/skeleton";

export function ClientCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-4 mb-2.5 bg-[rgba(9,16,12,0.86)] border border-[rgba(169,255,46,0.2)]">
      <div>
        <Skeleton className="h-[18px] sm:h-[20px] w-2/5" />
        <Skeleton className="h-3 sm:h-3.5 w-3/5 mt-1" />
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.05)]">
          <Skeleton className="h-3 w-4/5 mb-1.5" />
          <Skeleton className="h-[22px] w-1/4" />
        </div>
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.05)]">
          <Skeleton className="h-3 w-4/5 mb-1.5" />
          <Skeleton className="h-[18px] w-2/5" />
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-1">
        <Skeleton className="h-10 w-[58px] rounded-xl" />
        <Skeleton className="h-10 w-[72px] rounded-xl" />
      </div>
    </div>
  )
}