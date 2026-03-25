import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUpdateRaffleWrapper } from "@/hooks/use-raffles"
import { Loader2, Trophy, Plus, Trash2 } from "lucide-react"
import { Raffle } from "@workspace/api-client-react"
import { formatCurrency } from "@/lib/utils"

type EditPrizesDialogProps = {
  isOpen: boolean
  onClose: () => void
  raffle: Raffle
}

export function EditPrizesDialog({ isOpen, onClose, raffle }: EditPrizesDialogProps) {
  const updateMutation = useUpdateRaffleWrapper()

  const [prizes, setPrizes] = useState<string[]>(
    raffle.prizes && raffle.prizes.length > 0 ? raffle.prizes : [""]
  )
  const [error, setError] = useState<string | null>(null)

  const addPrize = () => setPrizes([...prizes, ""])
  const removePrize = (i: number) => setPrizes(prizes.filter((_, idx) => idx !== i))
  const updatePrize = (i: number, value: string) => {
    const next = [...prizes]
    next[i] = value
    setPrizes(next)
  }

  const handleSubmit = () => {
    setError(null)
    const filtered = prizes.filter((p) => p.trim() !== "")
    if (filtered.length === 0) {
      setError("Debe agregar al menos un premio.")
      return
    }
    updateMutation.mutate(
      { id: raffle.id, data: { prizes: filtered } },
      { onSuccess: onClose }
    )
  }

  const isSingleAmount = raffle.type === "single_amount"

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-7 h-7" />
          </div>
          <DialogTitle className="text-center text-2xl">Editar Premios</DialogTitle>
          <DialogDescription className="text-center">
            {isSingleAmount
              ? "El monto del premio no es editable."
              : "Modifica la lista de premios del sorteo."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Type badge — read-only, no switcher */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tipo:</span>
            <Badge variant="outline" className="font-semibold">
              {isSingleAmount ? "Monto Único" : "Múltiples Premios"}
            </Badge>
          </div>

          {isSingleAmount ? (
            <div className="space-y-2">
              <Label>Monto del Premio</Label>
              <div className="rounded-xl border bg-muted/40 px-4 py-3 text-lg font-bold text-muted-foreground select-none">
                {formatCurrency(raffle.singlePrizeAmount ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">El monto del premio no puede modificarse.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label>Lista de Premios (ordenados de 1er lugar hacia abajo)</Label>
              {prizes.map((prize, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0 rounded-full shrink-0">
                    {i + 1}
                  </Badge>
                  <Input
                    value={prize}
                    onChange={(e) => updatePrize(i, e.target.value)}
                    placeholder={`Ej. Pantalla 50" o $2000`}
                  />
                  {prizes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrize(i)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addPrize} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Agregar premio
              </Button>
              {error && <p className="text-sm text-destructive font-medium">{error}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={updateMutation.isPending}>
              {isSingleAmount ? "Cerrar" : "Cancelar"}
            </Button>
            {!isSingleAmount && (
              <Button className="flex-1" onClick={handleSubmit} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Guardar cambios
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
