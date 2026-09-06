import { useEffect, useRef, useState } from "react";
import { STRIPS } from "@/lib/ble";

export interface StripState {
  hex: string;
  brightness: number;
}

const STORE_KEY = "neopixel-ui-state-v3";

function defaultState(): StripState[] {
  return STRIPS.map((s) => ({ hex: s.defaultHex, brightness: 200 }));
}

function loadLocal(): StripState[] | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === STRIPS.length) return parsed;
    return null;
  } catch {
    return null; // storage unavailable (e.g. sandboxed preview) — fall back silently
  }
}

// UI-only convenience: remembers the last colors/brightness you set so a
// reload doesn't reset everything. The device itself has no way to report
// its current state back, so this is just what the app last *sent*.
export function useStripState() {
  const [strips, setStrips] = useState<StripState[]>(() => loadLocal() ?? defaultState());
  // Remembers each strip's last non-zero brightness, so switching a strip
  // back on restores where it was instead of guessing.
  const lastOnBrightness = useRef<number[]>(strips.map((s) => s.brightness || 200));

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(strips));
    } catch {
      // storage unavailable — ignore
    }
    strips.forEach((s, i) => {
      if (s.brightness > 0) lastOnBrightness.current[i] = s.brightness;
    });
  }, [strips]);

  function updateStrip(index: number, patch: Partial<StripState>) {
    setStrips((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  // Returns the brightness it switched to, synchronously, so callers (e.g.
  // the BLE write) don't have to infer it from state that hasn't
  // re-rendered yet.
  function togglePower(index: number): number {
    const next = strips[index].brightness === 0 ? lastOnBrightness.current[index] || 200 : 0;
    setStrips((prev) => prev.map((s, i) => (i === index ? { ...s, brightness: next } : s)));
    return next;
  }

  function setAll(hex: string, brightness: number) {
    setStrips((prev) => prev.map(() => ({ hex, brightness })));
  }

  function applyScenePalette(palette: string[], brightness: number) {
    setStrips(palette.map((hex) => ({ hex, brightness })));
  }

  return { strips, updateStrip, togglePower, setAll, applyScenePalette };
}
