import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Download, PlusCircle, Settings, Ticket, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportLocalBackup, importLocalBackup } from "@/hooks/use-raffles";
import { useAppSettings } from "@/lib/app-settings";
import Setup from "@/pages/setup";

export function Layout({ children }: { children: React.ReactNode }) {
  const { settings } = useAppSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const markOnline = () => setOnline(true);
    const markOffline = () => setOnline(false);
    window.addEventListener("online", markOnline);
    window.addEventListener("offline", markOffline);
    return () => {
      window.removeEventListener("online", markOnline);
      window.removeEventListener("offline", markOffline);
    };
  }, []);

  const downloadBackup = () => {
    const blob = new Blob([exportLocalBackup()], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `respaldo-rifas-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const restoreBackup = async (file?: File) => {
    if (!file || !confirm("¿Reemplazar los datos locales con este respaldo?")) return;
    try { importLocalBackup(await file.text()); window.location.reload(); }
    catch (error) { alert(error instanceof Error ? error.message : "No se pudo restaurar el respaldo."); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent text-brand-foreground flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform"><Ticket className="w-6 h-6" /></div>
            <span className="font-display font-bold text-xl sm:text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{settings.appName}</span>
          </Link>
          <nav className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-2"><Check className="w-3.5 h-3.5 text-green-600" /> {online ? "Guardado local" : "Modo sin conexión"}</span>
            <Button variant="ghost" size="icon" aria-label="Configuración" onClick={() => setSettingsOpen(true)}><Settings className="w-5 h-5" /></Button>
            <Link href="/raffles/new" className="hidden sm:flex"><Button variant="outline"><PlusCircle className="w-5 h-5 mr-2" />Nueva Rifa</Button></Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50 mt-auto"><p>© {new Date().getFullYear()} {settings.appName}. Tus datos permanecen en este dispositivo.</p></footer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Configuración y respaldo</DialogTitle><DialogDescription>Personaliza la aplicación o guarda una copia portátil de tus rifas.</DialogDescription></DialogHeader>
          <Setup compact onDone={() => setSettingsOpen(false)} />
          <div className="border-t pt-5 grid sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={downloadBackup}><Download className="w-4 h-4 mr-2" />Descargar respaldo</Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()}><Upload className="w-4 h-4 mr-2" />Restaurar respaldo</Button>
            <input ref={fileInput} className="hidden" type="file" accept="application/json" onChange={(event) => restoreBackup(event.target.files?.[0])} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
