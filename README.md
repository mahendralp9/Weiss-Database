# Weiss Schwarz Database

Mobile-first Weiss Schwarz card database with a home dashboard for search, favorites, recently viewed cards, and collection shortcuts, plus filters, a deck builder, and deck export.

- **Open it:** enable GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and open the Pages URL on your phone.
- **Install on Android:** open the page in Chrome and tap **Install app** (or Chrome menu → **Install app** / **Add to Home screen**).
- **Install on iPhone/iPad:** open the page in Safari and tap **Share → Add to Home Screen**. The **Cara install** button shows both platform guides.
- **Offline:** the app shell and card database are cached, along with up to 24 recently viewed card-image sheets. Previously cached content remains available when offline.
- **Data:** `index.html` embeds the card data (gzip + base64). Card images are packed into sprite sheets in `sheets/`.
- **Decks, favorites, collection stock, and recently viewed cards** are stored in the browser's `localStorage` on each device.

## Layout

| Path | What it is |
| --- | --- |
| `index.html` | The whole app (UI + embedded card data) |
| `sheets/sheet_NNN.jpg` | Sprite sheets of card images. Sheets 0-34 are 96x134 tiles (32x24), 35-133 are 128x179 (24x18), 134+ are 256x358 (12x8) |
| `sheets/hi_ggo.jpg`, `hi_ggo2.jpg` | 190x266 tiles (16 columns) for Gun Gale Online cards |
| `manifest.webmanifest`, `app-icon.svg`, `icon-*.png` | PWA metadata and app icons |
| `sw.js` | App-shell and recently viewed image-sheet caching |
| `tools/` | Scripts used to rebuild sheets from the simulator data |

## Scope

Titles removed on request: licensed Western IP (Marvel, Disney family, Pixar, Star Wars), EN-only IP (RWBY, Adventure Time, Avatar the Last Airbender) and WS Blau (discontinued).

The camera card search needs Claude's runtime and only works inside Claude artifacts; on GitHub Pages the button is hidden.
