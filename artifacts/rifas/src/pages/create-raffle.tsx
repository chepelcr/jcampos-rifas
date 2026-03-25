import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useLocation } from "wouter"
import { useCreateRaffleWrapper } from "@/hooks/use-raffles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Loader2, Sparkles } from "lucide-react"
import { Link } from "wouter"

const formSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  drawDate: z.string().optional(),
  pricePerNumber: z.coerce.number().min(1, "El precio debe ser mayor a 0"),
  type: z.enum(["single_amount", "multiple_prizes"]),
  singlePrizeAmount: z.coerce.number().optional(),
  prizes: z.array(z.string()).optional(),
}).refine(data => {
  if (data.type === 'single_amount' && !data.singlePrizeAmount) {
    return false;
  }
  return true;
}, {
  message: "Debe especificar el monto del premio",
  path: ["singlePrizeAmount"]
}).refine(data => {
  if (data.type === 'multiple_prizes' && (!data.prizes || data.prizes.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Debe agregar al menos un premio",
  path: ["prizes"]
});

type FormValues = z.infer<typeof formSchema>

export default function CreateRaffle() {
  const [, setLocation] = useLocation()
  const createMutation = useCreateRaffleWrapper()
  const [prizesList, setPrizesList] = useState<string[]>([''])

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "single_amount",
      prizes: []
    }
  })

  const watchType = watch("type")

  const onSubmit = (data: FormValues) => {
    // Clean up data based on type
    const payload = {
      ...data,
      prizes: data.type === 'multiple_prizes' ? prizesList.filter(p => p.trim() !== '') : [],
      singlePrizeAmount: data.type === 'single_amount' ? data.singlePrizeAmount : undefined,
    }

    createMutation.mutate({ data: payload as any }, {
      onSuccess: (newRaffle) => {
        setLocation(`/raffles/${newRaffle.id}`)
      }
    })
  }

  const addPrize = () => setPrizesList([...prizesList, ''])
  const removePrize = (index: number) => {
    const newList = [...prizesList]
    newList.splice(index, 1)
    setPrizesList(newList)
  }
  const updatePrize = (index: number, value: string) => {
    const newList = [...prizesList]
    newList[index] = value
    setPrizesList(newList)
    setValue("prizes", newList)
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Panel
      </Link>

      <Card className="border-t-4 border-t-primary shadow-2xl">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <CardTitle className="text-3xl">Crear Nueva Rifa</CardTitle>
          <CardDescription className="text-base">
            Configura los detalles de tu próximo sorteo (Automáticamente se crearán 100 números del 0 al 99).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                1. Información General
              </h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Rifa</Label>
                  <Input id="name" placeholder="Ej. Gran Rifa Navideña" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive font-medium">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descripción (Opcional)</Label>
                  <textarea 
                    id="description" 
                    className="flex min-h-[100px] w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                    placeholder="Detalles sobre el propósito de la rifa..."
                    {...register("description")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerNumber">Precio por Número (CRC)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₡</span>
                      <Input id="pricePerNumber" type="number" step="1" className="pl-8" placeholder="1000" {...register("pricePerNumber")} />
                    </div>
                    {errors.pricePerNumber && <p className="text-sm text-destructive font-medium">{errors.pricePerNumber.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="drawDate">Fecha del Sorteo (Opcional)</Label>
                    <Input id="drawDate" type="date" {...register("drawDate")} />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-muted/30 p-6 rounded-2xl border border-border/50">
              <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
                2. Configuración de Premios
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${watchType === 'single_amount' ? 'border-primary bg-primary/5 shadow-md text-primary' : 'border-border hover:border-primary/50'}`}>
                  <input type="radio" value="single_amount" className="sr-only" {...register("type")} />
                  <span className="font-bold text-lg mb-1">Monto Único</span>
                  <span className="text-xs opacity-80">Un solo ganador se lleva el premio</span>
                </label>
                <label className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center text-center transition-all ${watchType === 'multiple_prizes' ? 'border-primary bg-primary/5 shadow-md text-primary' : 'border-border hover:border-primary/50'}`}>
                  <input type="radio" value="multiple_prizes" className="sr-only" {...register("type")} />
                  <span className="font-bold text-lg mb-1">Múltiples Premios</span>
                  <span className="text-xs opacity-80">Varios ganadores (1er, 2do lugar...)</span>
                </label>
              </div>

              <div className="mt-6">
                {watchType === 'single_amount' ? (
                  <div className="space-y-2 animate-in fade-in">
                    <Label htmlFor="singlePrizeAmount">Monto del Premio (CRC)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₡</span>
                      <Input id="singlePrizeAmount" type="number" step="1" className="pl-8 text-lg font-bold" placeholder="500000" {...register("singlePrizeAmount")} />
                    </div>
                    {errors.singlePrizeAmount && <p className="text-sm text-destructive font-medium">{errors.singlePrizeAmount.message}</p>}
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in">
                    <Label>Lista de Premios (Ordenados de 1er lugar hacia abajo)</Label>
                    {prizesList.map((prize, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center p-0 rounded-full bg-background shrink-0">
                          {index + 1}
                        </Badge>
                        <Input 
                          value={prize}
                          onChange={(e) => updatePrize(index, e.target.value)}
                          placeholder={`Ej. Pantalla 50" o ₡2000`}
                        />
                        {prizesList.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePrize(index)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addPrize} className="w-full border-dashed">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar otro premio
                    </Button>
                    {errors.prizes && <p className="text-sm text-destructive font-medium">{errors.prizes.message}</p>}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg rounded-2xl" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creando Rifa...</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> Generar Rifa y 100 Números</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
