import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { useAssignNumberWrapper } from "@/hooks/use-raffles"
import { Loader2, User } from "lucide-react"

const schema = z.object({
  buyerName: z.string().min(2, "El nombre es requerido"),
  buyerPhone: z.string().optional(),
  buyerEmail: z.string().email("Email inválido").optional().or(z.literal('')),
})

type AssignProps = {
  isOpen: boolean
  onClose: () => void
  raffleId: number
  number: number
}

export function AssignDialog({ isOpen, onClose, raffleId, number }: AssignProps) {
  const assignMutation = useAssignNumberWrapper()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: z.infer<typeof schema>) => {
    assignMutation.mutate(
      { id: raffleId, number, data },
      {
        onSuccess: () => {
          reset()
          onClose()
        }
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-3xl font-display font-bold mx-auto mb-4 shadow-lg shadow-primary/30">
            {number}
          </div>
          <DialogTitle className="text-center text-3xl">Asignar Número</DialogTitle>
          <DialogDescription className="text-center text-base">
            Ingresa los datos del comprador para apartar este número.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="buyerName">Nombre Completo <span className="text-destructive">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input id="buyerName" className="pl-10" placeholder="Ej. Juan Pérez" {...register("buyerName")} />
            </div>
            {errors.buyerName && <p className="text-sm text-destructive">{errors.buyerName.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buyerPhone">Teléfono (Opcional)</Label>
              <Input id="buyerPhone" placeholder="10 dígitos" {...register("buyerPhone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buyerEmail">Email (Opcional)</Label>
              <Input id="buyerEmail" placeholder="correo@ejemplo.com" {...register("buyerEmail")} />
              {errors.buyerEmail && <p className="text-sm text-destructive">{errors.buyerEmail.message}</p>}
            </div>
          </div>
          
          <div className="pt-6">
            <Button type="submit" size="lg" className="w-full text-lg" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Confirmar Asignación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
