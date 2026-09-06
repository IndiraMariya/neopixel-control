# neopixel-control

A Bluetooth LE control page for a chandelier of 6 NeoPixel strips driven by
a XIAO ESP32C6 (`ble_neopixel_6strips.ino`).

- **`index.html`** — the deployable page. Open it in Chrome/Edge or the
  **Bluefy** app on iPhone (Web Bluetooth isn't supported in Safari) to
  connect to the chandelier over BLE. This file is a built, minified bundle
  — don't hand-edit it.
- **`app/`** — the React + TypeScript source for that page. See
  [app/README.md](app/README.md) for how to develop and rebuild it.
