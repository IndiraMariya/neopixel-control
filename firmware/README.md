# Firmware

Two Arduino sketches for the XIAO ESP32C6, each in its own folder (Arduino
requires a sketch's folder name to match its `.ino` filename).

## ble_neopixel_6strips

The real firmware — drives all 6 NeoPixel strips over BLE. This is what
`index.html` / `app/` talks to; see [app/src/lib/ble.ts](../app/src/lib/ble.ts)
for the exact protocol (service/characteristic UUIDs, wire format, scheme
names) and keep the two in sync if you change pins, pixel counts, or add a
scheme.

Also persists each strip's last color/brightness to flash (NVS) and restores
it on boot, so the strips come back the way they were left after a power cut.

## neopixel_strip_tester

A standalone diagnostic sketch for bringing up or debugging one strip at a
time — no BLE, no dependency on the other sketch. Wire a single strip to
`TEST_PIN`, set `NUM_PIXELS` to match it, flash, then drive it from the
Serial Monitor (115200 baud) with `r` / `g` / `b` / `w` / `off` / `chase` /
`count`. `chase` lights one pixel at a time down the strip — wherever it
stops is the dead pixel or break in the data line.

Useful for confirming a strip's actual pixel count or isolating a wiring
problem before wiring everything into the full 6-strip rig.
