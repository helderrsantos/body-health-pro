import { BackgroundLightning } from "@/components/home/BackgroundLightning"
import { Skeleton } from "@/components/ui/skeleton"

export function FieldSkeleton({ labelWidth = 'w-24' }: { labelWidth?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={`h-3.5 ${labelWidth}`} />
      <Skeleton className="h-10 w-full rounded-xl" />
    </div>
  )
}

export function ClientDetailSkeleton() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0e0a] via-[#0f1410] to-[#0a0e0a] p-3 sm:p-4 md:p-6 overflow-hidden">
      <BackgroundLightning />
      <div className="max-w-2xl mx-auto relative z-10">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Skeleton className="h-10 w-[72px] rounded-xl" />
          <div className="text-center flex-1 space-y-1.5">
            <Skeleton className="h-7 sm:h-8 w-1/2 mx-auto" />
            <Skeleton className="h-3.5 w-2/5 mx-auto" />
          </div>
          <div className="w-12 hidden sm:block" />
        </div>

        <div className="bg-[rgba(9,16,12,0.86)] rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[rgba(169,255,46,0.2)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
            <Skeleton className="h-6 sm:h-7 w-36" />
            <Skeleton className="h-10 w-[100px] rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex sm:justify-between gap-1 sm:gap-2">
              <Skeleton className="h-3.5 sm:h-4 w-10" />
              <Skeleton className="h-3.5 sm:h-4 w-36" />
            </div>
            <div className="flex sm:justify-between gap-1 sm:gap-2">
              <Skeleton className="h-3.5 sm:h-4 w-[78px]" />
              <Skeleton className="h-3.5 sm:h-4 w-24" />
            </div>
            <div className="flex sm:justify-between gap-1 sm:gap-2">
              <Skeleton className="h-3.5 sm:h-4 w-10" />
              <Skeleton className="h-3.5 sm:h-4 w-[78px]" />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Skeleton className="h-7 w-52 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-[rgba(9,16,12,0.86)] rounded-2xl border border-[rgba(169,255,46,0.2)] overflow-hidden">
                <div className="p-3 sm:p-4 flex flex-row items-center gap-3 sm:gap-4">
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[rgba(9,16,12,0.86)] rounded-2xl p-6 border border-[rgba(169,255,46,0.2)]">
          <Skeleton className="h-7 w-36 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

            <div className="col-span-1 md:col-span-2">
              <FieldSkeleton labelWidth="w-32" />
            </div>

            <FieldSkeleton labelWidth="w-10" />
            <FieldSkeleton labelWidth="w-12" />

            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

              <div className="space-y-3">
                <Skeleton className="h-4 w-36" />
                <div className="grid grid-cols-1 gap-3">
                  <FieldSkeleton labelWidth="w-12" />
                  <FieldSkeleton labelWidth="w-12" />
                  <FieldSkeleton labelWidth="w-16" />
                  <FieldSkeleton labelWidth="w-16" />
                  <FieldSkeleton labelWidth="w-14" />
                  <div className="space-y-2 pt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex gap-1">
                        <FieldSkeleton labelWidth="w-20" />
                        <FieldSkeleton labelWidth="w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <FieldSkeleton key={i} labelWidth="w-24" />
                  ))}
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 flex flex-col md:flex-row gap-2 md:gap-3 mt-2">
              <Skeleton className="h-10 w-full md:w-[138px] rounded-xl" />
              <Skeleton className="h-10 w-full md:w-[80px] rounded-xl" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}