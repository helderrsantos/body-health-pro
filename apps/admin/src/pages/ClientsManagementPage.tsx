import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { ClientsList } from '@/components/ClientsList'
import { Button } from '@/components/ui/button'

export function ClientsManagementPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen px-4 py-8">
      <section className="max-w-[1200px] mx-auto w-full p-6 bg-[rgba(9,16,12,0.86)] rounded-2xl border border-[rgba(169,255,46,0.2)]">
        <header className="mb-6 flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-[rgba(169,255,46,0.12)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[rgba(169,255,46,0.1)] rounded-xl">
              <Users className="w-6 h-6 text-[#a9ff2e]" />
            </div>
            <div>
              <h1 className="m-0 text-2xl font-bebas tracking-tight text-[#d8ffe8]">
                Lista de Clientes
              </h1>
              <p className="m-0 mt-1 text-sm text-gray-400">
                Visualize e gerencie os clientes para inclusão e atualização dos dados.
              </p>
            </div>
          </div>
        </header>

        <ClientsList refreshToken={0} />
      </section>
    </main>
  )
}
