# Weiss Schwarz Database

A mobile-first, installable Weiss Schwarz card database. Search the card catalog, read card effects, track favorites and collection stock, scan card codes, and build or export decks.

## Open the app

The app is a static website and does not need a server-side database or account.

1. In the GitHub repository, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)` folder, then save.
4. Open the published Pages URL shown in the Pages settings. The first deployment may take a few minutes.

The site must be served over HTTPS (GitHub Pages does this automatically) or from `localhost` for installation and offline features to work.

## Install on your device

Open the published site in the recommended browser for your device:

- **Android:** In Chrome, tap **Install app** if it appears. You can also open **⋮ → Install app** or **Add to Home screen**.
- **iPhone or iPad:** In Safari, tap **Share → Add to Home Screen → Add**.
- **Desktop:** In a supported browser, use the install icon in the address bar or the browser menu's **Install app** option, if available.

The app's **How to install** button also shows the Android and iPhone/iPad steps. Once installed, launch it from your home screen or app launcher.

## Features

- **Card search:** Search card codes, names, traits, or effect text. Filter by series and set, and use the color, level, climax, favorite, and collection filters.
- **Card details:** View card metadata, effect text, and a larger image preview. Mark cards as favorites and keep a per-card collection stock count.
- **Card scanning:** Use the camera button to read a card code from an image and find matching catalog entries. OCR loads from a CDN the first time it is needed, so scanning initially requires internet access.
- **Home dashboard:** Quickly reach search, favorites, recently viewed cards, and decks.
- **Deck builder:** Create and name multiple decks, add cards from the catalog, set a cover card, import a text deck list, and duplicate or delete decks. The builder checks the 50-card deck size, maximum of 8 climaxes, and maximum of 4 copies of a card.
- **Deck sharing:** Copy a deck list or export a deck image.
- **Installable and offline-capable:** The service worker caches the app shell and database. It also retains up to 24 recently used sprite sheets. Remote card images and the initial OCR download require an internet connection; bundled sprite sheets are used as the image fallback when available.

## Data and image sources

The card catalog is embedded in `index.html` as gzip-compressed JSON encoded with base64. Card effect text is shown separately from card artwork.

Image selection prefers official English images when available, then high-resolution LittleAKIBA images, followed by official Japanese images and bundled sprite sheets as fallbacks. Remote image availability depends on the source hosts and an internet connection.

Some effect text comes from simulator `CardData.txt` data and LittleAKIBA translations; these sources are used with permission. The catalog does not include every Weiss Schwarz title or every card printing. Titles excluded on request include Marvel, Disney family, Pixar, Star Wars, RWBY, Adventure Time, Avatar: The Last Airbender, and WS Blau.

## Privacy and storage

Favorites, collection stock, recently viewed cards, and decks are stored in the browser's `localStorage` on the current device. They are not synchronized between devices or uploaded to this repository. Clearing the browser's site data removes these saved items.

## Run locally

From the repository root, start a local static web server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>. Serving through localhost allows the browser to use service workers and other app features that do not work reliably from a `file://` URL.

## Development and tests

The app is intentionally built as a static site: the main interface and embedded card data are in `index.html`, with the OCR matcher in `ocr-matcher.js` and the service worker in `sw.js`.

Run the test suite with Node.js:

```sh
node --test tests/*.test.cjs
```

The tests cover card data, effect formatting and rendering, image-source selection, and OCR matching.

## Repository layout

| Path | Description |
| --- | --- |
| `index.html` | Application UI, styles, and embedded card catalog |
| `ocr-matcher.js` | Background worker for matching recognized card codes |
| `sw.js` | App-shell, offline, and recently viewed sprite-sheet caching |
| `sheets/sheet_NNN.jpg` | Bundled card sprite sheets |
| `sheets/hi_ggo.jpg`, `sheets/hi_ggo2.jpg` | Gun Gale Online sprite sheets |
| `manifest.webmanifest`, `app-icon.svg`, `icon-*.png` | PWA metadata and icons |
| `tools/` | Utility scripts used for card image and sprite-sheet preparation |
| `tests/` | Node.js tests for catalog behavior and OCR matching |
