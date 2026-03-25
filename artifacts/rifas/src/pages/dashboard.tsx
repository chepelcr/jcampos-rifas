import { useRaffles } from "@/hooks/use-raffles"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Link } from "wouter"
import { Ticket, Calendar, Users, Trophy, ChevronRight, Loader2, Sparkles, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="success" className="animate-in fade-in zoom-in duration-500">Activa</Badge>
    case 'completed':
      return <Badge variant="default" className="bg-blue-100 text-blue-700">Completada</Badge>
    case 'cancelled':
      return <Badge variant="destructive">Cancelada</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function Dashboard() {
  const { data: raffles, isLoading, error } = useRaffles()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <h2 className="text-xl font-display font-bold text-muted-foreground animate-pulse">Cargando tus rifas...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Error al cargar las rifas</h2>
        <p className="text-muted-foreground mt-2">Por favor, intenta nuevamente más tarde.</p>
      </div>
    )
  }

  const activeCount = raffles?.filter(r => r.status === 'active').length || 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden bg-foreground text-background p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-40 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/90 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-4 backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-2" />
            Panel de Control
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4 leading-tight">
            Gestiona tus rifas con <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">estilo y facilidad</span>
          </h1>
          <p className="text-lg text-muted/80 mb-8 max-w-xl">
            Crea sorteos, asigna números, registra compradores y realiza los sorteos desde un solo lugar. 
            Tienes {activeCount} {activeCount === 1 ? 'rifa activa' : 'rifas activas'} en este momento.
          </p>
          <Link href="/raffles/new">
            <Button size="lg" className="rounded-full shadow-primary/30">
              <PlusCircle className="w-5 h-5 mr-2" />
              Crear Nueva Rifa
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-bold">Tus Rifas</h2>
        </div>

        {!raffles?.length ? (
          <Card className="border-dashed bg-transparent shadow-none border-4">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <Ticket className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-2xl font-bold text-foreground">Aún no hay rifas</h3>
              <p className="text-muted-foreground mt-2 mb-6 max-w-md">
                Empieza a generar emoción creando tu primera rifa. Configura los premios, el precio y la fecha del sorteo.
              </p>
              <Link href="/raffles/new">
                <Button variant="outline" className="rounded-full border-primary/50 text-primary">
                  Crear mi primera rifa
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map((raffle) => (
              <Link key={raffle.id} href={`/raffles/${raffle.id}`} className="block group">
                <Card className="h-full flex flex-col group-hover:-translate-y-1 group-hover:border-primary/50 transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <StatusBadge status={raffle.status} />
                      <Badge variant="outline" className="font-mono bg-muted/50">
                        {formatCurrency(raffle.pricePerNumber)}/núm
                      </Badge>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                      {raffle.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    
                    {raffle.drawDate && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2 text-primary/70" />
                        <span>Sorteo: {format(new Date(raffle.drawDate), "d 'de' MMMM, yyyy", { locale: es })}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Progreso
                        </span>
                        <span className="font-bold">{raffle.soldNumbers} / {raffle.totalNumbers}</span>
                      </div>
                      <div className="w-full bg-secondary/20 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(raffle.soldNumbers / raffle.totalNumbers) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center text-sm font-medium text-foreground bg-muted/50 p-3 rounded-xl">
                      <Trophy className="w-4 h-4 mr-2 text-accent" />
                      <span className="truncate">
                        {raffle.type === 'single_amount' 
                          ? `Premio: ${formatCurrency(raffle.singlePrizeAmount || 0)}` 
                          : `Múltiples premios (${raffle.prizes?.length || 0})`}
                      </span>
                    </div>

                  </CardContent>
                  <CardFooter className="pt-0 border-t border-border/50 mt-auto flex justify-between items-center bg-muted/10 rounded-b-2xl p-4">
                    <span className="text-sm font-semibold text-primary">Gestionar rifa</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
