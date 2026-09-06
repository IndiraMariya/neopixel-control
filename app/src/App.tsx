import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SceneGrid } from "@/components/SceneGrid";
import { AllStripsCard } from "@/components/AllStripsCard";
import { StripList } from "@/components/StripList";
import { useNeoPixelBLE } from "@/hooks/useNeoPixelBLE";
import { useStripState } from "@/hooks/useStripState";
import { SCENES, type SceneName } from "@/lib/ble";
import { cn } from "@/lib/utils";

function App() {
  const ble = useNeoPixelBLE();
  const { strips, updateStrip, togglePower, setAll, applyScenePalette } = useStripState();
  const [activeScene, setActiveScene] = useState<SceneName | null>(null);

  function handleSceneSelect(name: SceneName) {
    const brightness = name === "off" ? 0 : 200;
    applyScenePalette(SCENES[name], brightness);
    setActiveScene(name);
    ble.writeScheme(name); // the device computes the exact preset itself
  }

  function handleAllChange(hex: string, brightness: number) {
    setAll(hex, brightness);
    setActiveScene(null);
    ble.writeAll(hex, brightness);
  }

  function handleStripColor(index: number, hex: string) {
    updateStrip(index, { hex });
    setActiveScene(null);
    ble.writeStrip(index, hex, strips[index].brightness);
  }

  function handleStripBrightness(index: number, brightness: number) {
    updateStrip(index, { brightness });
    setActiveScene(null);
    ble.writeStrip(index, strips[index].hex, brightness);
  }

  function handleStripPower(index: number) {
    const newBrightness = togglePower(index);
    setActiveScene(null);
    ble.writeStrip(index, strips[index].hex, newBrightness);
  }

  const connLabel =
    ble.status === "connecting" ? "Connecting…" : ble.status === "connected" ? ble.deviceName || "Connected" : "Connect";

  return (
    <div className="min-h-dvh bg-background px-4 pb-16 pt-[max(18px,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-[440px] flex-col">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Bluetooth LE · {ble.stripCount} strips
            </div>
            <h1 className="text-[22px] font-bold tracking-tight">Chandelier</h1>
          </div>
          <button
            type="button"
            onClick={ble.connect}
            disabled={ble.status === "connecting"}
            aria-label={ble.status === "connected" ? "Disconnect from chandelier" : "Connect to chandelier via Bluetooth"}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold shadow-sm disabled:opacity-55 active:opacity-80"
          >
            <span
              className={cn(
                "h-[7px] w-[7px] rounded-full bg-destructive transition-colors",
                ble.status === "connected" && "bg-[#2f9e58] shadow-[0_0_8px_#2f9e58]",
                ble.status === "connecting" && "animate-pulse bg-primary"
              )}
            />
            {connLabel}
          </button>
        </header>

        <div className="flex flex-col gap-3">
          <SceneGrid active={activeScene} onSelect={handleSceneSelect} />

          <AllStripsCard hex={strips[0]?.hex ?? "#ff9d4d"} brightness={strips[0]?.brightness ?? 200} onChange={handleAllChange} />

          <StripList
            strips={strips}
            onColorChange={handleStripColor}
            onBrightnessChange={handleStripBrightness}
            onPowerToggle={handleStripPower}
          />
        </div>

        {!ble.bluetoothSupported && (
          <Alert className="mt-3">
            <AlertDescription className="text-center leading-relaxed">
              Web Bluetooth isn't available in this browser.
              <br />
              Open this page inside the <strong className="text-foreground">Bluefy</strong> app on iPhone to connect.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Toaster theme="light" position="bottom-center" />
    </div>
  );
}

export default App;
