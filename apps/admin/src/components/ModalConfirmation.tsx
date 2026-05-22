import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function ModalConfirmation(props: Readonly<{ nome: string }>) {
  return (
    <Dialog>
      <form>
        <DialogTrigger>
          <Button variant="outline">Abrir Dialog</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Deseja deletar este cliente?</DialogTitle>
            <DialogDescription>
              Deseja realmente deletar o cliente '{props.nome}'? Esta ação não pode ser desfeita.
              Clique em "Confirmar" para deletar o cliente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
