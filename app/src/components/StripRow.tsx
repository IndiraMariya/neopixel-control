import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorWheel } from "@/components/ColorWheel";
import { cn } from "@/lib/utils";
import type { StripInfo } from "@/lib/ble";
import type { StripState } from "@/hooks/useStripState";

interface StripRowProps {
  info: StripInfo;
  state: StripState;
  expanded: boolean;
  onToggleExpand: () => void;
  onColorChange: (hex: string) => void;
  onBrightnessChange: (brightness: number) => void;
  onPowerToggle: () => void;
}

export function StripRow({
  info,
  state,
  expanded,
  onToggleExpand,
  onColorChange,
  onBrightnessChange,
  onPowerToggle,
}: StripRowProps) {
  const on = state.brightness > 0;

  return (
    <div className="border-t border-border py-3.5 first:border-t-0 first:pt-0.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${info.name} color, tap to edit`}
          onClick={onToggleExpand}
          className={cn(
            "h-9 w-9 shrink-0 rounded-[11px] shadow-[inset_0_0_0_1px_hsl(var(--border))] transition-transform active:scale-95",
            expanded && "ring-2 ring-primary"
          )}
          style={{ backgroundColor: state.hex }}
        />
        <div className="min-w-0 flex-1">
          <div className={cn("text-sm font-bold", !on && "text-muted-foreground")}>{info.name}</div>
          <div className={cn("text-xs text-muted-foreground", !on && "opacity-70")}>
            {info.pin} · {info.pixels} px
          </div>
        </div>
        <Switch checked={on} onCheckedChange={onPowerToggle} aria-label={`${info.name} power`} />
      </div>
      <div className="mt-2.5 flex items-center gap-2.5">
        <Slider
          className="flex-1"
          value={[state.brightness]}
          min={0}
          max={255}
          step={1}
          aria-label={`${info.name} brightness`}
          onValueChange={([v]) => onBrightnessChange(v)}
        />
        <span className="w-7 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{state.brightness}</span>
      </div>
      {expanded && (
        <div className="flex justify-center pt-4">
          <ColorWheel value={state.hex} onChange={onColorChange} size={132} label={`${info.name} color`} />
        </div>
      )}
    </div>
  );
}
