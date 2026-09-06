import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SCENE_NAMES, type SceneName } from "@/lib/ble";

const SCENE_LABELS: Record<SceneName, string> = {
  sunset: "Sunset",
  ocean: "Ocean",
  forest: "Forest",
  off: "Off",
};

const SCENE_STYLES: Record<SceneName, string> = {
  sunset: "bg-[linear-gradient(120deg,#ff7a18,#ff3d46,#8f1a8c)] text-white",
  ocean: "bg-[linear-gradient(120deg,#12b0ff,#00d0c0,#0050b4)] text-white",
  forest: "bg-[linear-gradient(120deg,#3fbf3f,#8fc410,#0a6a3c)] text-white",
  off: "bg-[#1c1c1c] text-neutral-300",
};

interface SceneGridProps {
  active: SceneName | null;
  onSelect: (scene: SceneName) => void;
}

export function SceneGrid({ active, onSelect }: SceneGridProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Scenes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5">
          {SCENE_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => onSelect(name)}
              className={cn(
                "flex min-h-[60px] items-end rounded-2xl px-3.5 py-3.5 text-left text-sm font-bold shadow-[0_1px_4px_rgba(0,0,0,0.5)] transition-transform active:scale-[0.96]",
                SCENE_STYLES[name],
                active === name && "ring-2 ring-primary ring-offset-2 ring-offset-card"
              )}
            >
              {SCENE_LABELS[name]}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-center text-xs leading-relaxed text-muted-foreground">
          Applies a preset across all six strips.
        </p>
      </CardContent>
    </Card>
  );
}
