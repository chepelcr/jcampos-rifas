import { useState } from "react";
import { Laptop, Moon, Palette, ShieldCheck, Smartphone, Sun, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/lib/app-settings";

export default function Setup({ onDone, compact = false }: { onDone?: () => void; compact?: boolean }) {
  const { settings, saveSettings } = useAppSettings();
  const [appName, setAppName] = useState(settings.appName);
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [theme, setTheme] = useState(settings.theme);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    saveSettings({ configured: true, appName: appName.trim() || "Gestor de Rifas", primaryColor, accentColor, theme });
    onDone?.();
  };

  return (
    <div className={compact ? "bg-background" : "min-h-screen grid lg:grid-cols-2 bg-background"}>
      {!compact && <section className="hidden lg:flex relative overflow-hidden bg-foreground text-background p-16 flex-col justify-between">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex items-center gap-3 text-xl font-bold"><Ticket className="text-accent" /> Tu espacio, tus rifas</div>
        <div className="relative max-w-xl">
          <p className="text-primary font-bold uppercase tracking-[.25em] text-sm mb-5">Privacidad primero</p>
          <h1 className="text-5xl xl:text-6xl text-background leading-tight mb-6">Funciona incluso cuando no hay internet.</h1>
          <p className="text-xl text-background/70">La aplicación y tus rifas permanecen en este dispositivo. Las actualizaciones no borran tu información.</p>
        </div>
        <div className="relative grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl bg-white/10 p-4 flex gap-3"><ShieldCheck className="text-accent shrink-0" /> Sin cuenta ni servidor</div>
          <div className="rounded-2xl bg-white/10 p-4 flex gap-3"><Smartphone className="text-accent shrink-0" /> Instalable como app</div>
        </div>
      </section>}
      <main className={compact ? "py-4" : "flex items-center justify-center p-6 sm:p-12"}>
        <form onSubmit={submit} className="w-full max-w-lg space-y-8">
          {!compact && <div className="lg:hidden w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-brand-foreground flex items-center justify-center"><Ticket /></div>}
          <div>
            <span className="inline-flex items-center gap-2 text-primary font-bold text-sm"><Palette className="w-4 h-4" /> {compact ? "Personalización" : "Configuración inicial"}</span>
            {!compact && <h2 className="text-4xl mt-3">Hazla tuya</h2>}
            <p className="text-muted-foreground mt-3">Puedes cambiar estos datos más adelante desde el botón de configuración.</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="appName">Nombre de la aplicación</Label>
            <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} maxLength={40} required className="h-12" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <label className="space-y-3"><span className="text-sm font-medium">Color principal</span><div className="flex items-center gap-3 rounded-xl border p-3"><input aria-label="Color principal" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" /><span className="font-mono text-sm">{primaryColor}</span></div></label>
            <label className="space-y-3"><span className="text-sm font-medium">Color de acento</span><div className="flex items-center gap-3 rounded-xl border p-3"><input aria-label="Color de acento" type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" /><span className="font-mono text-sm">{accentColor}</span></div></label>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Apariencia</legend>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["light", "Claro", Sun],
                ["dark", "Oscuro", Moon],
                ["system", "Sistema", Laptop],
              ] as const).map(([value, label, Icon]) => (
                <button key={value} type="button" onClick={() => setTheme(value)} aria-pressed={theme === value}
                  className={`rounded-xl border p-3 flex flex-col items-center gap-2 text-sm transition-colors ${theme === value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
                  <Icon className="w-5 h-5" />{label}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="rounded-2xl bg-muted/50 border p-5 flex items-start gap-3 text-sm text-muted-foreground"><ShieldCheck className="w-5 h-5 text-primary shrink-0" /><p><strong className="text-foreground">Tus datos son locales.</strong> Haz respaldos periódicos desde Configuración si deseas moverlos a otro dispositivo.</p></div>
          <Button type="submit" size="lg" className="w-full rounded-xl h-13 text-base">Guardar y comenzar</Button>
        </form>
      </main>
    </div>
  );
}
