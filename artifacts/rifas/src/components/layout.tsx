import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Download, PlusCircle, Settings, Ticket, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportLocalBackup, importLocalBackup } from "@/hooks/use-raffles";
import { useAppSettings } from "@/lib/app-settings";
import Setup from "@/pages/setup";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function Layout({ children }: { children: React.ReactNode }) {
  const { settings, saveSettings, t } = useAppSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<File | null>(null);
  const [online, setOnline] = useState(navigator.onLine);
  const fileInput = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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

  const restoreBackup = async () => {
    if (!backupToRestore) return;
    try { importLocalBackup(await backupToRestore.text()); window.location.reload(); }
    catch (error) {
      setBackupToRestore(null);
      toast({ variant: "destructive", title: "No se pudo restaurar el respaldo", description: error instanceof Error ? error.message : "Selecciona un archivo de respaldo válido." });
    }
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
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-2"><Check className="w-3.5 h-3.5 text-green-600" /> {t(online ? "Guardado local" : "Modo sin conexión")}</span>
            <Button variant="ghost" size="sm" className="px-2 font-semibold" aria-label={t("Idioma")} onClick={() => saveSettings({ ...settings, language: settings.language === "es" ? "en" : "es" })}>{settings.language.toUpperCase()}</Button>
            <Button variant="ghost" size="icon" aria-label={t("Configuración")} onClick={() => setSettingsOpen(true)}><Settings className="w-5 h-5" /></Button>
            <Link href="/raffles/new" className="hidden sm:flex"><Button variant="outline"><PlusCircle className="w-5 h-5 mr-2" />{t("Nueva Rifa")}</Button></Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">{children}</main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border/50 mt-auto"><p>© {new Date().getFullYear()} {settings.appName}. Tus datos permanecen en este dispositivo.</p></footer>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("Configuración y respaldo")}</DialogTitle><DialogDescription>{t("Personaliza la aplicación o guarda una copia portátil de tus rifas.")}</DialogDescription></DialogHeader>
          <Setup compact onDone={() => setSettingsOpen(false)} />
          <div className="border-t pt-5 grid sm:grid-cols-2 gap-3">
            <Button variant="outline" onClick={downloadBackup}><Download className="w-4 h-4 mr-2" />{t("Descargar respaldo")}</Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()}><Upload className="w-4 h-4 mr-2" />{t("Restaurar respaldo")}</Button>
            <input ref={fileInput} className="hidden" type="file" accept="application/json" onChange={(event) => { setBackupToRestore(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={backupToRestore !== null} onOpenChange={(open) => !open && setBackupToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Restaurar este respaldo?</AlertDialogTitle>
            <AlertDialogDescription>Los datos locales actuales se reemplazarán con <strong>{backupToRestore?.name}</strong>. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={restoreBackup}>Restaurar respaldo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
