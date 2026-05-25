import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDateBR } from '@/utils/date'

type Sexo = 'masculino' | 'feminino'

interface Cliente {
    id: number
    nome: string
    data_nascimento: string
    sexo: Sexo
}

interface FormData {
    nome: string
    dataNascimento: string
    sexo: Sexo
}

interface EditClientProps {
    cliente: Cliente | null
    isEditing: boolean
    formData: FormData
    saveError: string | null
    saveMessage: string | null
    isSaving: boolean
    setIsEditing: (isEditing: boolean) => void
    setFormData: (formData: FormData | ((prev: FormData) => FormData)) => void
    setSaveError: (error: string | null) => void
    setSaveMessage: (message: string | null) => void
    handleSaveClient: () => Promise<void>
}

export function EditClient({
    cliente,
    isEditing,
    formData,
    saveError,
    saveMessage,
    isSaving,
    setIsEditing,
    setFormData,
    setSaveError,
    setSaveMessage,
    handleSaveClient,
}: Readonly<EditClientProps>) {
    return (
        <div className="bg-[rgba(9,16,12,0.86)] rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-[rgba(169,255,46,0.2)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3">
            <h2 className="m-0 font-bebas font-medium tracking-tight text-lg sm:text-xl text-[#d8ffe8]">
              Dados do Cliente
            </h2>
            {isEditing ? null : (
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)} className='h-10'>
                Editar Dados
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                type="text"
                value={formData.nome || cliente?.nome || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, nome: event.target.value }))}
                placeholder="Nome completo"
              />
              <Input
                type="date"
                value={formData.dataNascimento || cliente?.data_nascimento || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, dataNascimento: event.target.value }))}
              />
              <select
                className="w-full rounded-xl border border-[rgba(169,255,46,0.2)] bg-[rgba(9,16,12,0.86)] px-3 py-2 text-sm text-[#d8ffe8]"
                value={formData.sexo || cliente?.sexo || 'masculino'}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    sexo: event.target.value as 'masculino' | 'feminino',
                  }))
                }
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>

              {saveError ? <small className="text-red-500 text-xs">{saveError}</small> : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => void handleSaveClient()}
                  disabled={isSaving}
                  className='h-10'
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                   className='h-10'
                  onClick={() => {
                    setIsEditing(false)
                    setSaveError(null)
                    setSaveMessage(null)
                    setFormData({
                      nome: '',
                      dataNascimento: '',
                      sexo: 'masculino',
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs sm:text-sm text-gray-300">
              <div className="flex sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span>Nome:</span>
                <span className="text-[#d8ffe8]">{cliente?.nome}</span>
              </div>
              <div className="flex sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span>Nascimento:</span>
                <span className="text-[#d8ffe8]">{formatDateBR(cliente?.data_nascimento)}</span>
              </div>
              <div className="flex sm:flex-row sm:justify-between gap-1 sm:gap-2">
                <span>Sexo:</span>
                <span className="text-[#d8ffe8]">{cliente?.sexo}</span>
              </div>
            </div>
          )}

          {saveMessage ? <small className="text-[#a9ff2e] text-xs mt-2 block">{saveMessage}</small> : null}
        </div>
    )
}