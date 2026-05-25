import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { UpdateClientData } from '@/services/clients/clients.service'
import type { ClientRow } from '@/types/client'

interface EditClientModalProps {
  client: ClientRow
  isSaving: boolean
  onSave: (data: UpdateClientData) => Promise<void>
  onClose: () => void
}

export function EditClientModal({
  client,
  isSaving,
  onSave,
  onClose,
}: Readonly<EditClientModalProps>) {
  const [nome, setNome] = useState(client.nome)
  const [dataNascimento, setDataNascimento] = useState(client.data_nascimento)
  const [sexo, setSexo] = useState<'masculino' | 'feminino'>(client.sexo)
  const [hasChanges, setHasChanges] = useState(false)

  function markChanged() {
    if (!hasChanges) setHasChanges(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await onSave({ nome: nome.trim(), data_nascimento: dataNascimento, sexo })
      toast.success('Cliente atualizado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cliente.')
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open: boolean) => {
        if (!open && !isSaving) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="bg-[rgba(9,16,12,0.98)] border border-[rgba(169,255,46,0.25)] ring-0 max-h-[90dvh] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="text-[#d8ffe8] font-bebas tracking-wide text-xl">
            Editar Cliente
          </DialogTitle>
        </DialogHeader>

        <form id="edit-client-form" className="space-y-4 mt-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#a9ff2e]">Nome</span>
            <Input
              type="text"
              value={nome}
              onChange={(e) => { setNome(e.target.value); markChanged() }}
              required
              className="border border-[rgba(169,255,46,0.5)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#a9ff2e]">Data de Nascimento</span>
            <Input
              type="date"
              value={dataNascimento}
              onChange={(e) => { setDataNascimento(e.target.value); markChanged() }}
              required
              className="border border-[rgba(169,255,46,0.5)]"
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[#a9ff2e]">Sexo</span>
            <select
              className="w-full rounded-xl border border-[rgba(169,255,46,0.2)] bg-[rgba(9,16,12,0.86)] px-3 py-2 text-sm text-[#d8ffe8]"
              value={sexo}
              onChange={(e) => {
                setSexo(e.target.value as 'masculino' | 'feminino')
                markChanged()
              }}
            >
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full sm:w-auto"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-client-form"
            className="h-10 w-full sm:w-auto"
            disabled={!hasChanges || isSaving}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
