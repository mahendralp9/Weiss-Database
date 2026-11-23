# Weiss Schwarz Database

Searchable Weiss Schwarz card database for mobile (iPhone), with filters, a deck builder, deck export as an image, and favorites.

- **Open it:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and open the Pages URL on your phone.
- **Add to Home Screen:** open the page in Safari, tap Share → Add to Home Screen. It then opens like an app (PWA manifest included; no offline mode).
- **Data:** `index.html` embeds the card data (gzip + base64). Card images are packed into sprite sheets in `sheets/`.
- **Decks and favorites** are stored in the browser's `localStorage` on each device.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app (UI + embedded card data) |
| `sheets/sheet_NNN.jpg` | Sprite sheets of card images. Sheets 0-34 are 96x134 tiles (32x24), 35-133 are 128x179 (24x18), 134+ are 256x358 (12x8) |
| `sheets/hi_ggo.jpg`, `hi_ggo2.jpg` | 190x266 tiles (16 columns) for Gun Gale Online cards |
| `manifest.webmanifest`, `icon-*.png` | PWA metadata |
| `tools/` | Scripts used to rebuild sheets from the simulator data |

## Scope

Titles removed on request: licensed Western IP (Marvel, Disney family, Pixar, Star Wars), EN-only IP (RWBY, Adventure Time, Avatar the Last Airbender) and WS Blau (discontinued).

The camera card search needs Claude's runtime and only works inside Claude artifacts; on GitHub Pages the button is hidden.
