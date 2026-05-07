import { useNavigate } from 'react-router-dom'
import { ClientsList } from '@/components/ClientsList'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Users } from 'lucide-react'

export function AdminDashboardPage() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <main className="min-h-screen px-4 py-8 ">
      <section className="max-w-[800px] mx-auto">
        <header className="mb-8">
          <h1 className="m-0 text-2xl sm:text-3xl font-bebas font-semibold text-[#eafff1] tracking-widest">
            Olá {profile?.nome ?? 'Admin'}
            <span className="hidden sm:inline">, seja bem-vindo ao Body Health Pro</span>
          </h1>
          <p className="mt-2 text-gray-400 max-w-prose text-sm">
            Gerenciar clientes e suas avaliações de composição corporal.
          </p>
          <div className="flex gap-3 mt-3">
            <Button type="button" variant="outline" onClick={() => void logout()} className="h-10">
              Sair
            </Button>
          </div>
        </header>

        {/* Action Cards */}
        <div className="grid gap-4 mb-8">
          {/* New Client Card */}
          <button
            onClick={() => navigate('/admin/clients/new')}
            className="w-full p-6 bg-[rgba(9,16,12,0.86)] rounded-2xl border border-[rgba(169,255,46,0.2)] hover:border-[rgba(169,255,46,0.5)] hover:bg-[rgba(9,16,12,0.95)] transition-all duration-300 cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[rgba(169,255,46,0.1)] rounded-xl group-hover:bg-[rgba(169,255,46,0.2)] transition-colors">
                  <Plus className="w-6 h-6 text-[#a9ff2e]" />
                </div>
                <div>
                  <h2 className="m-0 text-lg font-bebas tracking-tight text-[#d8ffe8] group-hover:text-[#a9ff2e] transition-colors">
                    Cadastrar Novo Cliente
                  </h2>
                  <p className="m-0 mt-1 text-sm text-gray-400">
                    Adicionar um novo cliente ao sistema
                  </p>
                </div>
              </div>
              <span className="text-[#a9ff2e] text-2xl group-hover:translate-x-1 transition-transform">
                →
              </span>
            </div>
          </button>

          {/* Clients List Card */}
          <div className="w-full p-6 bg-[rgba(9,16,12,0.86)] rounded-2xl border border-[rgba(169,255,46,0.2)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[rgba(169,255,46,0.1)] rounded-xl">
                <Users className="w-6 h-6 text-[#a9ff2e]" />
              </div>
              <div>
                <h2 className="m-0 text-lg font-bebas tracking-tight text-[#d8ffe8]">
                  Lista de Clientes
                </h2>
                <p className="m-0 mt-1 text-sm text-gray-400">
                  Ver e gerenciar todos os clientes cadastrados
                </p>
              </div>
            </div>
            <ClientsList refreshToken={0} />
          </div>
        </div>
      </section>
    </main>
  )
}
