import { createContext, useContext, useEffect, useMemo, useState } from "react";

const SETTINGS_KEY = "rifas-app-settings-v1";

export type AppSettings = {
  configured: boolean;
  appName: string;
  primaryColor: string;
  accentColor: string;
};

const defaults: AppSettings = {
  configured: false,
  appName: "Gestor de Rifas",
  primaryColor: "#e62e62",
  accentColor: "#f7bd1b",
};

function loadSettings(): AppSettings {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

function hexToHsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return `${Math.round(h < 0 ? h + 360 : h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

type SettingsContextValue = { settings: AppSettings; saveSettings: (value: AppSettings) => void };
const SettingsContext = createContext<SettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(loadSettings);
  const saveSettings = (value: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
    setSettings(value);
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", hexToHsl(settings.primaryColor));
    document.documentElement.style.setProperty("--ring", hexToHsl(settings.primaryColor));
    document.documentElement.style.setProperty("--accent", hexToHsl(settings.accentColor));
    document.title = settings.appName;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", settings.primaryColor);
  }, [settings]);

  const value = useMemo(() => ({ settings, saveSettings }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useAppSettings debe usarse dentro de AppSettingsProvider");
  return context;
}
