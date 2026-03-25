import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useReleaseNumberWrapper } from "@/hooks/use-raffles"
import { Phone, Mail, User, Unlock, Loader2 } from "lucide-react"
import { RaffleNumber } from "@workspace/api-client-react"

type Props = {
  isOpen: boolean
  onClose: () => void
  raffleId: number
  numberInfo: RaffleNumber | null
}

export function BuyerInfoDialog({ isOpen, onClose, raffleId, numberInfo }: Props) {
  const releaseMutation = useReleaseNumberWrapper()

  if (!numberInfo) return null

  const handleRelease = () => {
    if (confirm(`¿Estás seguro de liberar el número ${numberInfo.number}? Perderá su dueño actual.`)) {
      releaseMutation.mutate(
        { id: raffleId, number: numberInfo.number },
        { onSuccess: onClose }
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center gap-4 mb-4">
             <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center text-3xl font-display font-bold shadow-inner">
              {numberInfo.number}
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Número Vendido</DialogTitle>
          <DialogDescription className="text-center">
            Información del comprador actual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-secondary/10 rounded-2xl p-6 mt-4 border border-secondary/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Comprador</p>
              <p className="font-bold text-lg">{numberInfo.buyerName || "Desconocido"}</p>
            </div>
          </div>
          
          {/* Note: the API returns minimal info on the number object, we'd ideally fetch full buyer details, 
              but for this UI we display what we have or generic placeholders if not available on this object directly */}
        </div>

        <div className="pt-6">
          <Button 
            variant="destructive" 
            className="w-full bg-red-100 text-red-700 hover:bg-red-200 border-none shadow-none" 
            onClick={handleRelease}
            disabled={releaseMutation.isPending}
          >
            {releaseMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
            Liberar Número
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Liberar el número lo pondrá disponible para otra persona.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
