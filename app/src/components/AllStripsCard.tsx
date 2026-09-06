import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ColorWheel } from "@/components/ColorWheel";

interface AllStripsCardProps {
  hex: string;
  brightness: number;
  onChange: (hex: string, brightness: number) => void;
}

export function AllStripsCard({ hex, brightness, onChange }: AllStripsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2.5 space-y-0 pb-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-border"
          style={{ backgroundColor: hex, boxShadow: `0 0 10px 1px ${hex}` }}
        />
        <CardTitle className="text-sm">All strips together</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 py-1.5">
          <ColorWheel value={hex} onChange={(newHex) => onChange(newHex, brightness)} label="Color for all strips" />
          <div className="w-full">
            <div className="mb-1.5 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>Brightness</span>
              <span className="tabular-nums text-primary">{brightness}</span>
            </div>
            <Slider
              value={[brightness]}
              min={0}
              max={255}
              step={1}
              aria-label="Brightness for all strips"
              onValueChange={([v]) => onChange(hex, v)}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2.5">
          <Button className="flex-1" onClick={() => onChange(hex, 230)}>
            All on
          </Button>
          <Button variant="outline" className="flex-1 text-destructive" onClick={() => onChange(hex, 0)}>
            All off
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
