import { useRef } from "react";
import { cn } from "@/lib/utils";
import { hexToHsv, hsvToHex } from "@/lib/color";

interface ColorWheelProps {
  value: string;
  onChange: (hex: string) => void;
  size?: number;
  label: string;
  className?: string;
}

// Hue = angle, saturation = radius, value fixed at 1 — brightness is a
// separate physical slider elsewhere in the UI. Drawn with a CSS conic +
// radial gradient rather than canvas, so the wheel is just one div.
export function ColorWheel({ value, onChange, size = 176, label, className }: ColorWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const { h, s } = hexToHsv(value);
  const R = size / 2;
  const ang = (h * Math.PI) / 180;
  const dist = s * R;
  const thumbX = R + Math.cos(ang) * dist;
  const thumbY = R + Math.sin(ang) * dist;

  function fromPointer(clientX: number, clientY: number) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const radius = rect.width / 2;
    const dx = clientX - (rect.left + radius);
    const dy = clientY - (rect.top + radius);
    const dist = Math.min(Math.hypot(dx, dy), radius);
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const sat = radius === 0 ? 0 : dist / radius;
    onChange(hsvToHex(hue, sat, 1));
  }

  return (
    <div
      ref={ref}
      role="slider"
      aria-label={label}
      tabIndex={0}
      className={cn("relative shrink-0 cursor-pointer touch-none rounded-full", className)}
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle at 50% 50%, #fff 0%, rgba(255,255,255,0) 62%), conic-gradient(from 90deg, #ff0000, #ffe600, #1aff4e, #17e6e6, #2a5cff, #d61aff, #ff0000)",
        boxShadow: "inset 0 0 0 1px hsl(var(--border)), 0 10px 22px rgba(0,0,0,0.14)",
      }}
      onPointerDown={(e) => {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        fromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (draggingRef.current) fromPointer(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <div
        className="pointer-events-none absolute rounded-full border-white box-border"
        style={{
          width: size > 140 ? 24 : 19,
          height: size > 140 ? 24 : 19,
          borderWidth: size > 140 ? 3 : 2.5,
          left: thumbX,
          top: thumbY,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 1px 6px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}
