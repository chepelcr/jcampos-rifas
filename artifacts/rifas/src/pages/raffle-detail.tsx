import { useState } from "react"
import { useRoute } from "wouter"
import { useRaffle, useRaffleNumbers, useRaffleBuyers, useDrawRaffleWrapper, useDeleteRaffleWrapper } from "@/hooks/use-raffles"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowLeft, Download, Image as ImageIcon, Users, Ticket, CheckCircle2, Trophy, Loader2, Sparkles, X, Trash2 } from "lucide-react"
import { Link, useLocation } from "wouter"
import { AssignDialog } from "@/components/assign-dialog"
import { BuyerInfoDialog } from "@/components/buyer-info-dialog"
import { RaffleNumber } from "@workspace/api-client-react"
import confetti from "canvas-confetti"

export default function RaffleDetail() {
  const [, params] = useRoute("/raffles/:id")
  const [, setLocation] = useLocation()
  const raffleId = parseInt(params?.id || "0")
  
  const { data: raffle, isLoading, error } = useRaffle(raffleId)
  const { data: numbers } = useRaffleNumbers(raffleId)
  const { data: buyers } = useRaffleBuyers(raffleId)
  
  const drawMutation = useDrawRaffleWrapper()
  const deleteMutation = useDeleteRaffleWrapper()

  const [activeTab, setActiveTab] = useState<'numbers' | 'buyers'>('numbers')
  const [selectedNumToAssign, setSelectedNumToAssign] = useState<number | null>(null)
  const [selectedSoldNum, setSelectedSoldNum] = useState<RaffleNumber | null>(null)

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>
  if (error || !raffle) return <div className="text-center py-20">Error al cargar la rifa</div>

  const handleDraw = () => {
    if (confirm("¿Estás seguro de realizar el sorteo ahora? Esta acción no se puede deshacer.")) {
      drawMutation.mutate({ id: raffleId }, {
        onSuccess: () => {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff512f', '#f09819', '#ffffff']
          });
        }
      })
    }
  }

  const handleDelete = () => {
    if (confirm("¿Eliminar toda la rifa? Se perderán todos los datos. Escribe 'ELIMINAR' para confirmar.") /* Simplified prompt */) {
      deleteMutation.mutate({ id: raffleId }, {
        onSuccess: () => setLocation("/")
      })
    }
  }

  // Create an array of 101 elements for the grid 0-100
  const gridNumbers = Array.from({ length: 101 }, (_, i) => i)
  
  // Map API numbers to a fast lookup dictionary
  const numbersMap = new Map(numbers?.map(n => [n.number, n]))

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-border">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>
        <div className="flex gap-2">
          <a href={`/api/raffles/${raffleId}/export/pdf`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="bg-white">
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          </a>
          <a href={`/api/raffles/${raffleId}/export/image`} target="_blank" rel="noreferrer">
            <Button variant="outline" className="bg-white">
              <ImageIcon className="w-4 h-4 mr-2" /> Imagen
            </Button>
          </a>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={handleDelete}>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-r from-primary to-accent p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-20">
            <Ticket className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4 max-w-2xl">
              <Badge className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                {raffle.status === 'active' ? 'En Curso' : raffle.status === 'completed' ? 'Finalizada' : 'Cancelada'}
              </Badge>
              <h1 className="text-4xl md:text-5xl font-display font-extrabold">{raffle.name}</h1>
              {raffle.description && <p className="text-white/80 text-lg">{raffle.description}</p>}
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full"><Ticket className="w-6 h-6" /></div>
                  <div>
                    <p className="text-white/70 text-sm">Precio Mxn</p>
                    <p className="text-2xl font-bold">{formatCurrency(raffle.pricePerNumber)}</p>
                  </div>
                </div>
                {raffle.drawDate && (
                  <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full"><Trophy className="w-6 h-6" /></div>
                    <div>
                      <p className="text-white/70 text-sm">Sorteo</p>
                      <p className="text-xl font-bold">{format(new Date(raffle.drawDate), "d MMM, yyyy", { locale: es })}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {raffle.status === 'active' && (
              <Button 
                size="lg" 
                variant="secondary"
                className="rounded-full shadow-2xl shadow-black/20 hover:scale-105"
                onClick={handleDraw}
                disabled={raffle.soldNumbers === 0 || drawMutation.isPending}
              >
                {drawMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Realizar Sorteo
              </Button>
            )}
          </div>
        </div>
        
        {/* Progress bar inside card */}
        <div className="bg-background p-6 border-b border-border/50">
           <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-muted-foreground flex items-center"><Users className="w-4 h-4 mr-2"/> Números Vendidos</span>
            <span className="text-primary font-bold">{raffle.soldNumbers} de {raffle.totalNumbers}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${(raffle.soldNumbers / raffle.totalNumbers) * 100}%` }}
            >
              <div className="absolute inset-0 bg-white/20 bg-[length:1rem_1rem] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_25%,rgba(255,255,255,.15)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.15)_75%,rgba(255,255,255,.15)_100%)] animate-[progress-pattern_1s_linear_infinite]" />
            </div>
          </div>
        </div>
      </Card>

      {/* Winners Section if completed */}
      {raffle.status === 'completed' && raffle.winners && raffle.winners.length > 0 && (
        <Card className="border-4 border-accent shadow-xl bg-gradient-to-br from-white to-accent/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="w-10 h-10 text-accent drop-shadow-md" />
              <h2 className="text-3xl font-display font-extrabold text-foreground">¡Ganadores!</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {raffle.winners.map((winner, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-accent/20 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                    {winner.number}
                  </div>
                  <div>
                    <Badge variant="outline" className="mb-2 bg-accent/10 border-accent/30 text-accent-foreground">
                      {winner.prize || 'Premio'}
                    </Badge>
                    <p className="font-bold text-xl">{winner.buyerName}</p>
                    <p className="text-muted-foreground text-sm">{winner.buyerPhone || 'Sin teléfono'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid & Buyers Layout */}
      <div className="bg-card rounded-3xl border shadow-lg overflow-hidden">
        <div className="flex border-b">
          <button 
            className={`flex-1 py-4 font-bold text-lg transition-colors relative ${activeTab === 'numbers' ? 'text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setActiveTab('numbers')}
          >
            Cuadrícula (0-100)
            {activeTab === 'numbers' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
          <button 
            className={`flex-1 py-4 font-bold text-lg transition-colors relative ${activeTab === 'buyers' ? 'text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}
            onClick={() => setActiveTab('buyers')}
          >
            Compradores ({buyers?.length || 0})
            {activeTab === 'buyers' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
          </button>
        </div>

        <div className="p-6 md:p-8 bg-muted/10 min-h-[500px]">
          {activeTab === 'numbers' ? (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-11 gap-2 md:gap-3">
              {gridNumbers.map((num) => {
                const info = numbersMap.get(num)
                const isSold = info?.status === 'sold'
                
                return (
                  <button
                    key={num}
                    onClick={() => {
                      if (raffle.status !== 'active') return;
                      if (isSold) {
                        setSelectedSoldNum(info)
                      } else {
                        setSelectedNumToAssign(num)
                      }
                    }}
                    disabled={raffle.status !== 'active' && !isSold}
                    className={`
                      aspect-square rounded-xl md:rounded-2xl flex items-center justify-center font-display font-bold text-xl transition-all duration-200
                      ${isSold 
                        ? 'bg-muted border border-border/50 text-muted-foreground cursor-pointer hover:bg-muted/80 shadow-inner relative overflow-hidden' 
                        : 'bg-white border-2 border-border text-foreground hover:border-primary hover:text-primary hover:shadow-lg hover:-translate-y-1 hover:bg-primary/5 cursor-pointer shadow-sm'
                      }
                      ${raffle.status !== 'active' && !isSold ? 'opacity-50 cursor-not-allowed hover:transform-none hover:border-border hover:shadow-none hover:text-foreground' : ''}
                    `}
                  >
                    <span className={isSold ? 'opacity-30' : ''}>{num}</span>
                    {isSold && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <X className="w-8 h-8 text-foreground/40 stroke-[3]" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {!buyers?.length ? (
                <div className="text-center py-20 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No hay compradores registrados aún.</p>
                </div>
              ) : (
                buyers.map(buyer => (
                  <div key={buyer.id} className="bg-white p-6 rounded-2xl shadow-sm border border-border flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                        {buyer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{buyer.name}</h4>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          {buyer.phone && <span className="flex items-center"><Phone className="w-3 h-3 mr-1"/>{buyer.phone}</span>}
                          {buyer.email && <span className="flex items-center"><Mail className="w-3 h-3 mr-1"/>{buyer.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {buyer.numbers.map(n => (
                        <Badge key={n} variant="secondary" className="bg-secondary/20 text-secondary-foreground text-sm py-1">
                          #{n}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {selectedNumToAssign !== null && (
        <AssignDialog 
          isOpen={true} 
          onClose={() => setSelectedNumToAssign(null)} 
          raffleId={raffleId} 
          number={selectedNumToAssign} 
        />
      )}

      {selectedSoldNum && (
        <BuyerInfoDialog
          isOpen={true}
          onClose={() => setSelectedSoldNum(null)}
          raffleId={raffleId}
          numberInfo={selectedSoldNum}
        />
      )}
    </div>
  )
}
