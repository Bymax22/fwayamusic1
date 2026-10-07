"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type PaletteId = "fwaya-purple" | "electric-blue" | "emerald" | "coral" | "amber-gold";

export type Palette = {
  id: PaletteId;
  name: string;
  accent: string;
  surface: string;
  text: string;
};

export const palettes: Palette[] = [
  { id: "fwaya-purple", name: "Fwaya Purple", accent: "#9B5DE5", surface: "#36454F", text: "#FFFFFF" },
  { id: "electric-blue", name: "Electric Blue", accent: "#4F8CFF", surface: "#26313F", text: "#FFFFFF" },
  { id: "emerald", name: "Emerald", accent: "#34D399", surface: "#26352F", text: "#FFFFFF" },
  { id: "coral", name: "Coral", accent: "#FF6B6B", surface: "#3A292B", text: "#FFFFFF" },
  { id: "amber-gold", name: "Amber Gold", accent: "#F5B942", surface: "#393326", text: "#FFFFFF" },
];

const STORAGE_KEY = "fwaya-theme-palette";
const PLATFORM_BACKGROUND = "0, 0, 0";
const defaultPalette = palettes[0];
const paletteById = new Map(palettes.map((palette) => [palette.id, palette]));
const listeners = new Set<() => void>();
let selectedPalette = defaultPalette;
let initialized = false;

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return selectedPalette;
}

function applyPalette(palette: Palette) {
  selectedPalette = palette;
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const rgb = (hex: string) => {
      const value = hex.replace("#", "");
      return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)).join(", ");
    };

    root.dataset.palette = palette.id;
    root.style.setProperty("--primary-accent", rgb(palette.accent));
    root.style.setProperty("--primary-light", rgb(palette.accent));
    root.style.setProperty("--accent-light", rgb(palette.accent));
    root.style.setProperty("--purple-deep", rgb(palette.accent));
    root.style.setProperty("--purple-bright", rgb(palette.accent));
    root.style.setProperty("--background", PLATFORM_BACKGROUND);
    root.style.setProperty("--primary-dark", PLATFORM_BACKGROUND);
    root.style.setProperty("--primary-dark-darker", PLATFORM_BACKGROUND);
    root.style.setProperty("--dark-bg", PLATFORM_BACKGROUND);
    root.style.setProperty("--card", PLATFORM_BACKGROUND);
    root.style.setProperty("--border", rgb(palette.surface));
    root.style.setProperty("--input", rgb(palette.surface));
    root.style.setProperty("--muted", rgb(palette.surface));
    root.style.setProperty("--bg-dark", rgb(palette.surface));
    root.style.setProperty("--foreground", rgb(palette.text));
    root.style.setProperty("--card-foreground", rgb(palette.text));
    root.style.setProperty("--muted-foreground", rgb(palette.text));
    root.style.setProperty("--text-primary", rgb(palette.text));
    root.style.setProperty("--text-muted", rgb(palette.text));
    root.style.setProperty("--light-bg", rgb(palette.text));
    root.style.setProperty("--ring", rgb(palette.accent));
  }
  notifyListeners();
}

function initializePalette() {
  if (initialized) return;
  initialized = true;
  if (typeof window !== "undefined") {
    const storedId = window.localStorage.getItem(STORAGE_KEY) as PaletteId | null;
    applyPalette((storedId && paletteById.get(storedId)) || defaultPalette);
  }
}

function selectPalette(id: PaletteId) {
  const palette = paletteById.get(id);
  if (!palette) return;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  initialized = true;
  applyPalette(palette);
}

type ThemeContextType = {
  palette: Palette;
  selectedPalette: Palette;
  palettes: Palette[];
  selectPalette: (id: PaletteId) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const palette = useSyncExternalStore(subscribe, getSnapshot, () => defaultPalette);

  useEffect(() => {
    initializePalette();
  }, []);

  return (
    <ThemeContext.Provider value={{ palette, selectedPalette: palette, palettes, selectPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
