import { useNavigate } from 'react-router-dom'
import { ClientRegistrationForm } from '@/components/ClientRegistrationForm'
import { Button } from '@/components/ui/button'


export function ClientRegistrationPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen px-4 py-6 sm:py-8">
      <section className="card w-full max-w-[920px] mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row gap-4 sm:items-start">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="sm:self-start p-2 h-12 w-12 hover:bg-opacity-20 shrink-0 flex justify-start"
          >
             <span className="text-[#a9ff2e] text-2xl group-hover:translate-x-1 transition-transform ">
                ←
              </span>
          </Button>
          <div className="flex flex-col w-full">
          <h1 className="m-0 text-2xl sm:text-3xl font-bebas font-semibold text-[#eafff1] tracking-widest">
            Cadastrar Novo Cliente
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm max-w-prose mt-1">
            Preencha os dados iniciais do cliente para criar seu prontuário.
          </p>
          </div>
        </header>

        <ClientRegistrationForm
          onClientCreated={() => {
            navigate('/admin')
          }}
        />
      </section>
    </main>
  )
}
