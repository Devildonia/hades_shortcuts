<div align="center">

# ⚡ HaDeS' Shortcuts · Next-Gen (v5.0)
### *A high-performance, ultra-aesthetic browser command center, productivity OS & startpage*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online%20Preview-brightgreen?logo=github)](https://devildonia.github.io/hades_shortcuts/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20Desktop-orange?logo=pwa)](https://devildonia.github.io/hades_shortcuts/)
[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-yellow.svg)](https://developer.mozilla.org/en-US/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-brightgreen.svg)]()
[![Bundle Size](https://img.shields.io/badge/Total%20Size-~200%20KB-success.svg)]()
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN%20%7C%20FR%20%7C%20DE-purple.svg)]()

<br />

<p align="center">
  <a href="https://devildonia.github.io/hades_shortcuts/">
    <img src="https://img.shields.io/badge/%F0%9F%8C%90%20Open%20Live%20Demo-https%3A%2F%2Fdevildonia.github.io%2Fhades__shortcuts%2F-blue?style=for-the-badge" alt="Try Live Demo" />
  </a>
</p>

<br />

<img src="docs/screenshots/demo.gif" alt="HaDeS' Shortcuts Live Demo" width="850" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />

<br />
<br />

[Live Demo](https://devildonia.github.io/hades_shortcuts/) •
[Features](#-key-features) •
[DevTools & Bangs](#-devtools-omnibox--bang-commands) •
[Freeform & Post-its](#-freeform-canvas--floating-post-its) •
[Widgets](#-bento-mini-widgets) •
[Gallery](#-visual-showcase) •
[Quick Start](#-quick-start) •
[Keyboard Shortcuts](#-keyboard-shortcuts) •
[Architecture](#-project-architecture)

<br />

</div>

---

## 📸 Visual Showcase

<div align="center">

| 🌌 **Deep Nebula Theme** | 🌅 **Sunset Amber Theme** |
| :---: | :---: |
| <img src="docs/screenshots/theme-nebula.png" width="420" alt="Deep Nebula Theme" /> | <img src="docs/screenshots/theme-sunset.png" width="420" alt="Sunset Amber Theme" /> |

| 💎 **Crystal Light Theme** | ⚙️ **Unified Settings Drawer** |
| :---: | :---: |
| <img src="docs/screenshots/theme-light.png" width="420" alt="Crystal Light Theme" /> | <img src="docs/screenshots/settings-drawer.png" width="420" alt="Settings Drawer" /> |

</div>

---

## 🌟 Key Features

### 🛠️ DevTools Omnibox & «Swiss Army Knife»
Transform your search bar into an instant utility suite:
- **`!uuid`**: Generates cryptographically secure UUIDv4 with 1-click clipboard copy.
- **`!color <value>`**: Full two-way color converter (HEX ⇄ RGB ⇄ HSL) with visual color chips.
- **`!b64 <text>` / `!b64d <hash>`**: Safe Base64 encoder and decoder in real time.
- **`!epoch` / `!time <timestamp>`**: Instant UNIX timestamp to readable ISO & relative date converter.
- **`!qr <text or url>`**: Generates high-resolution **Interactive Glass QR Modal** with PNG download and clipboard copy to seamlessly beam links to your smartphone.

### 🎨 Freeform Canvas & Floating Glass Post-its
- **Freeform Screen Positioning**: Move any category box, clock, weather, or notes anywhere across the 360° screen canvas with 1:1 cursor lock (`LayoutManager`).
- **Corner Resize Handles (`↘`)**: Dynamically resize width and height of any widget on the fly.
- **Glass Post-its**: Pin floating translucent sticky notes with custom neon color cycling, live in-place editing, and persistent positioning.

### 🔍 Smart HD Favicon Auto-Derivation
- When adding any URL (e.g. `https://figma.com`), the system automatically derives:
  - Official platform title (`Figma`).
  - High-Definition 128×128 px official favicon (`Google S2 / IconHorse HD API`).

### 📝 Bento Mini-Widgets ("Liquid Cards")
- **Glass Scratchpad**: Fast persistent notepad with auto-save in `localStorage` for ideas, checklists, and tasks.
- **Pomodoro Focus Timer**: 25 min focus / 5 min break timer with SVG circular progress ring and gentle acoustic alarm chimes.
- **Configurable Visibility**: Toggle widgets on/off anytime from the *Layout & Shortcuts* settings tab.

### 🔊 Procedural Web Audio API Synthesizer (0 KB)
- Zero external MP3 dependencies with real-time mathematical audio synthesis.
- 3 selectable haptic sound presets: **Sci-Fi Soft Pop**, **Mechanical Switch**, and **Acoustic Bubble**.

### 🎨 Custom Theme Studio
- Live color picker in *Settings > Appearance* to customize primary accent and secondary glow colors with instant CSS variable re-calculation.

### 📥 Universal Browser Bookmarks Importer
- Import `bookmarks.html` exported from **Google Chrome, Mozilla Firefox, Microsoft Edge, Brave, or Safari** with one click.

### 📱 PWA & Offline Support
- Fully installable Progressive Web App (`manifest.json` + `sw.js`) for a distraction-free standalone desktop experience on Windows, macOS, and Linux.

---

## ⚡ DevTools Omnibox & Bang Commands Cheatsheet

| Command | Action / Destination Service | Example |
| :--- | :--- | :--- |
| `!uuid` | Generate UUIDv4 with 1-click copy | `!uuid` |
| `!color <val>` | Color converter & visual preview swatch | `!color #00f2fe` or `!color rgb(0,242,254)` |
| `!b64 <text>` | Real-time UTF-8 Base64 Encoder | `!b64 Cyberpunk 2077` |
| `!b64d <hash>` | Real-time Base64 Decoder | `!b64d Q3liZXJwdW5r` |
| `!time` / `!epoch` | UNIX epoch to local date & relative time | `!time` or `!epoch 1787589157` |
| `!qr <link>` | Generate Interactive Glass QR Code Modal | `!qr https://github.com` |
| `!yt <query>` | YouTube Search | `!yt lofi hip hop` |
| `!gh <query>` | GitHub Repositories | `!gh three.js` |
| `!w <query>` | Wikipedia (ES) | `!w James Webb` |
| `!r <query>` | Reddit Search | `!r webdev` |
| `!m <query>` | Google Maps | `!m Vigo, Spain` |
| `!civitai <query>` | Civitai Model Hub | `!civitai cyberpunk` |
| `!tr <text>` | Google Translate | `!tr thank you so much` |
| `!npm <pkg>` | NPM Registry | `!npm canvas-confetti` |
| `!ddg <query>` | DuckDuckGo Direct | `!ddg privacy tools` |
| `<math expr>` | Instant Math Calculator | `150 * 1.21` or `(45 + 15) / 2` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus the main search bar instantly |
| <kbd>/</kbd> | Focus search bar (when not typing in an input/textarea) |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Pin note as floating Glass Post-it (in Scratchpad) |
| <kbd>Arrow Keys</kbd> (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>) | Navigate visible Bento cards |
| <kbd>Enter</kbd> | Launch highlighted shortcut, execute bang, or search engine |
| <kbd>ESC</kbd> | Clear search / Exit Edit Mode / Close open modals |

---

## 🚀 Quick Start

### Option 1: 🌐 Live Demo (Instant Web Preview)
Test and use the production dashboard directly in your browser without any installation:
👉 **[https://devildonia.github.io/hades_shortcuts/](https://devildonia.github.io/hades_shortcuts/)**

### Option 2: Direct Local File (Offline)
Simply clone the repository and double-click [`index.html`](index.html) in your browser. All assets, sounds, and dictionaries run 100% offline without any server setup.

### Option 3: Local HTTP Server
Run the included `local server.bat` script or launch a simple Python server:
```bash
# Launch a lightweight local server
python -m http.server 8080
```
Then visit `http://localhost:8080` in your favorite browser.

---

## 🌍 Internationalization (i18n)

All interface strings, category titles, greetings, widgets, and shortcut tooltips are fully localized:

```
locales/
├── es.json   # Español 🇪🇸
├── en.json   # English 🇬🇧
├── fr.json   # Français 🇫🇷
└── de.json   # Deutsch 🇩🇪
```

---

## 🏛️ Project Architecture (Anti-God File Modular Design)

The project enforces a strict Single Responsibility Principle (SRP) with native ES6 modules under `/js/` (~50–250 lines each, 0 god files):

```
├── manifest.json            # PWA manifest for desktop installation
├── sw.js                    # Service Worker for offline cache & performance
├── index.html               # Clean, accessible semantic DOM structure
├── style.css                # Fluid CSS design tokens, themes & animations
├── locales/                 # i18n translation dictionaries (ES, EN, FR, DE)
├── docs/
│   └── screenshots/         # High-res previews & animated demo GIF
├── js/
│   ├── app.js               # Main orchestrator & lifecycle manager
│   ├── state.js             # Reactive central state & localStorage sync
│   ├── audio.js             # Procedural Web Audio API synthesizer (0 KB)
│   ├── bangs.js             # Bang commands parser & safe math calculator
│   ├── devtools.js          # Built-in DevTools Omnibox & QR Code Generator
│   ├── postits.js           # Floating Glass Post-its manager
│   ├── layout.js            # Freeform Canvas & Corner Resize Engine (rAF)
│   ├── widgets.js           # Bento widgets manager (Scratchpad + Pomodoro)
│   ├── theme-studio.js      # Real-time custom theme color palette generator
│   ├── importer.js          # Universal HTML bookmarks parser (Chrome/Firefox)
│   ├── i18n.js              # Localization engine & dynamic loader
│   ├── weather.js           # Precision clock & Open-Meteo weather geocoder
│   ├── search.js            # Multi-engine search, bangs & arrow navigation
│   ├── render.js            # Dynamic Bento grid, cards & smart tooltips
│   ├── dragdrop.js          # Inner card reordering drag & drop manager
│   ├── shortcut-manager.js  # Add / Edit / Delete modal & HD Favicon engine
│   ├── backup.js            # JSON export, import & factory reset
│   └── settings.js          # Slide-over settings drawer controller
├── iconos/                  # 48 optimized WebP icon assets (60x60)
└── sounds/                  # Haptic audio fallback assets
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
