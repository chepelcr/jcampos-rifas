import { Link } from "wouter"
import { Ticket, PlusCircle } from "lucide-react"

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Gestor de Rifas
              </span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/raffles/new" className="hidden sm:flex">
                <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                  <PlusCircle className="w-5 h-5" />
                  Nueva Rifa
                </button>
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50 mt-auto">
        <p>© {new Date().getFullYear()} Gestor de Rifas. Creado para celebrar.</p>
      </footer>
    </div>
  )
}
