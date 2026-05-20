import { Button } from '@/components/ui/button'
import { Database, LogOut } from 'lucide-react'

interface HomeUserMenuProps {
  onOpenData: () => void
  onLogout: () => Promise<void>
}

export function HomeUserMenu({ onOpenData, onLogout }: Readonly<HomeUserMenuProps>) {
  return (
    <nav
      aria-label="Menu principal do usuario"
     className="mt-4 flex items-center gap-3 rounded-xl border border-[rgba(169,255,46,0.18)] bg-[rgba(9,16,12,0.7)] p-3"
 >
      <Button type="button" variant="outline" onClick={onOpenData} className="h-10 flex-1 sm:flex-none sm:w-auto">
        <Database className="mr-2 h-4 w-4" />
        Dados
      </Button>
      <Button type="button" variant="outline" onClick={() => void onLogout()} className="h-10 flex-1 sm:flex-none sm:w-auto">
        <LogOut className="mr-2 h-4 w-4" />
        Sair
      </Button>
    </nav>
  )
}