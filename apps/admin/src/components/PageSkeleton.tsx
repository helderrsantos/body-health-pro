import { Skeleton } from '@/components/ui/skeleton'

function ClientRowSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl p-4 mb-2.5 bg-[rgba(9,16,12,0.5)] border border-[rgba(169,255,46,0.15)]">
      <div>
        <Skeleton className="h-[18px] w-2/5" />
        <Skeleton className="h-3.5 w-3/5 mt-1" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.03)]">
          <Skeleton className="h-3 w-4/5 mb-1.5" />
          <Skeleton className="h-[22px] w-1/4" />
        </div>
        <div className="flex-1 rounded-lg p-2 bg-[rgba(169,255,46,0.03)]">
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

export function PageSkeleton() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0a0e0a] via-[#0f1410] to-[#0a0e0a] px-4 py-8 overflow-hidden">
      <div className="relative max-w-[800px] mx-auto z-10">

        {/* cabeçalho — espelha AdminDashboardPage header */}
        <header className="mb-8">
          <Skeleton className="h-8 sm:h-10 w-3/4 max-w-[480px]" />
          <Skeleton className="h-3.5 w-64 mt-2" />
          {/* HomeUserMenu — nav com 2 botões h-10 */}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-[rgba(169,255,46,0.18)] bg-[rgba(9,16,12,0.7)] p-3">
            <Skeleton className="h-10 flex-1 sm:flex-none sm:w-[90px] rounded-xl" />
            <Skeleton className="h-10 flex-1 sm:flex-none sm:w-[80px] rounded-xl" />
          </div>
        </header>

        <div className="grid gap-4 mb-8">
          {/* card 1: Cadastrar Novo Cliente — p-6, flex items-center justify-between */}
          <div className="p-6 rounded-2xl border border-[rgba(169,255,46,0.2)] bg-[rgba(9,16,12,0.86)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                <div>
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-3.5 w-52 mt-1" />
                </div>
              </div>
              <Skeleton className="h-6 w-4 shrink-0" />
            </div>
          </div>

          {/* card 2: Lista de Clientes — p-6 com header + ClientsList inline */}
          <div className="p-6 rounded-2xl border border-[rgba(169,255,46,0.2)] bg-[rgba(9,16,12,0.86)]">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
              <div>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-3.5 w-56 mt-1" />
              </div>
            </div>

            {/* ClientsList — border-t pt-4 */}
            <div className="border-t border-[rgba(169,255,46,0.26)] pt-4">
              <Skeleton className="h-6 w-44 mb-3" />
              {/* form busca: input + 2 botões, flex-col sm:flex-row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <Skeleton className="h-10 w-full rounded-xl sm:flex-1" />
                <Skeleton className="h-10 w-full sm:w-20 rounded-xl" />
                <Skeleton className="h-10 w-full sm:w-28 rounded-xl" />
              </div>
              <ul className="m-0 p-0 list-none">
                {Array.from({ length: 3 }).map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                  <li key={i}><ClientRowSkeleton /></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
