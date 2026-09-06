import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StripRow } from "@/components/StripRow";
import { STRIPS } from "@/lib/ble";
import type { StripState } from "@/hooks/useStripState";

interface StripListProps {
  strips: StripState[];
  onColorChange: (index: number, hex: string) => void;
  onBrightnessChange: (index: number, brightness: number) => void;
  onPowerToggle: (index: number) => void;
}

export function StripList({ strips, onColorChange, onBrightnessChange, onPowerToggle }: StripListProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <Card>
      <CardContent className="pt-4">
        {STRIPS.map((info, i) => (
          <StripRow
            key={info.pin}
            info={info}
            state={strips[i]}
            expanded={expandedIndex === i}
            onToggleExpand={() => setExpandedIndex((prev) => (prev === i ? null : i))}
            onColorChange={(hex) => onColorChange(i, hex)}
            onBrightnessChange={(b) => onBrightnessChange(i, b)}
            onPowerToggle={() => onPowerToggle(i)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
