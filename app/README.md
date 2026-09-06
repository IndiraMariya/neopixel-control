# Chandelier control — React source

This is the source for the chandelier control page. The repo's `index.html`
at the root is a **built, minified copy** of this app — this is where you
actually make changes.

**Stack**: React + TypeScript + Vite (dev) + Tailwind CSS + shadcn/ui, bundled
to a single HTML file with Parcel for deployment.

## Why a separate build step

The page needs to be a single static HTML file (no server, no bundler at
runtime) so it can be opened directly — via GitHub Pages, or as a local file
in the **Bluefy** app on iPhone — and still use the Web Bluetooth API to talk
to the real device. Vite's dev server is great for iterating, but its output
isn't a single self-contained file; Parcel's `html-inline` step is what
produces that.

## BLE protocol

`src/lib/ble.ts` holds every hardware-facing constant — the service UUID, the
six per-strip characteristic UUIDs, and the exact scene colors the firmware
computes for `sunset`/`ocean`/`forest`/`off`. These **must** match
`ble_neopixel_6strips.ino` exactly, or writes silently go to the wrong
characteristic (or a characteristic that doesn't exist). If you change the
firmware's UUIDs or pin/pixel layout, update this file to match.

## Developing

```bash
pnpm install
pnpm dev          # Vite dev server with HMR — Web Bluetooth works here too,
                   # since it's just a regular page served over localhost
```

## Building the deployable single-file page

```bash
pnpm add -D parcel @parcel/config-default parcel-resolver-tspaths html-inline
pnpm exec parcel build index.html --dist-dir dist --no-source-maps
pnpm exec html-inline dist/index.html > bundle.html
cp bundle.html ../index.html
```

(Or use `scripts/bundle-artifact.sh` from Anthropic's `web-artifacts-builder`
skill, which does the same thing plus dependency installation.)

Then commit both the updated `app/` source and the regenerated root
`index.html` together.
