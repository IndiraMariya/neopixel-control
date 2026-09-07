// BLE protocol constants — these must match ble_neopixel_6strips.ino exactly.
// The firmware exposes 6 NeoPixel strips, a characteristic that sets all 6 at
// once, and a characteristic that applies a named scheme preset. Pin/pixel
// values below are cosmetic labels only (index-to-characteristic mapping is
// what actually matters for the protocol) but should still match PIN_STRIP_*
// / NUM_PIXELS_* in the firmware.

export interface StripInfo {
  name: string;
  pin: string;
  pixels: number;
  defaultHex: string;
}

export const STRIPS: StripInfo[] = [
  { name: "Strip 0", pin: "D0", pixels: 14, defaultHex: "#ff9d4d" },
  { name: "Strip 1", pin: "D1", pixels: 17, defaultHex: "#ff7a3c" },
  { name: "Strip 2", pin: "D2", pixels: 8, defaultHex: "#ff5a4a" },
  { name: "Strip 3", pin: "D4", pixels: 8, defaultHex: "#ff466a" },
  { name: "Strip 4", pin: "D5", pixels: 1, defaultHex: "#e0468c" },
  { name: "Strip 5", pin: "D6", pixels: 2, defaultHex: "#b83c9c" },
];

export const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";

// Index maps directly to STRIPS above (strip0..strip5).
export const CHAR_STRIP_UUIDS = [
  "beb5483e-36e1-4688-b7f5-ea07361b26a1", // strip0 (D0)
  "beb5483e-36e1-4688-b7f5-ea07361b26a2", // strip1 (D1)
  "beb5483e-36e1-4688-b7f5-ea07361b26a3", // strip2 (D2)
  "beb5483e-36e1-4688-b7f5-ea07361b26a6", // strip3 (D3)
  "beb5483e-36e1-4688-b7f5-ea07361b26a7", // strip4 (D4)
  "beb5483e-36e1-4688-b7f5-ea07361b26a8", // strip5 (D5)
];
export const CHAR_ALL_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a4";
export const CHAR_SCHEME_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a5";

// Scene colors mirror the exact RGB values hardcoded in the firmware's
// SchemeCallback — the device computes these itself; this table only lets
// the UI reflect what just happened on the device.
export const SCENES: Record<string, string[]> = {
  sunset: ["#ff5e00", "#ff8214", "#ff3d46", "#d61e46", "#961464", "#461478"],
  ocean: ["#0096ff", "#00b4e6", "#00c8c8", "#0096a0", "#0064be", "#0050b4"],
  forest: ["#1e9628", "#46a014", "#78a014", "#14783c", "#0a5a32", "#284614"],
  off: Array(6).fill("#000000"),
};
export const SCENE_NAMES = ["sunset", "ocean", "forest", "off"] as const;
export type SceneName = (typeof SCENE_NAMES)[number];
