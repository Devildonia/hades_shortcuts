<div align="center">

# ⚡ HaDeS' Shortcuts · Next-Gen
### *A high-performance, ultra-aesthetic browser startpage, command center & productivity hub*

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
[Bangs & Calculator](#-bang-commands--live-calculator) •
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

### ⚡ Bang Commands (`!`) & Live Calculator
- **Direct Service Search**: Type `!yt music`, `!gh react`, `!w quantum`, `!r technology`, or `!civitai lora` to jump directly into destination search engines.
- **Instant Safe Math Evaluator**: Type `45 * 1.21`, `(120 + 30) / 2`, or `25 * 80` to see interactive calculated results right in your search bar.
- **Keyboard Arrow Navigation**: Navigate cards seamlessly with <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> and hit <kbd>Enter</kbd> to launch.

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

## ⚡ Bang Commands & Search Cheatsheet

| Command | Destination Service | Example |
| :--- | :--- | :--- |
| `!yt <query>` | YouTube Search | `!yt lofi hip hop` |
| `!gh <query>` | GitHub Repositories | `!gh three.js` |
| `!w <query>` | Wikipedia (ES) | `!w James Webb` |
| `!r <query>` | Reddit Search | `!r webdev` |
| `!m <query>` | Google Maps | `!m Vigo, Spain` |
| `!civitai <query>` | Civitai Model Hub | `!civitai cyberpunk` |
| `!tr <text>` | Google Translate | `!tr thank you so much` |
| `!npm <pkg>` | NPM Registry | `!npm canvas-confetti` |
| `!ddg <query>` | DuckDuckGo Direct | `!ddg privacy tools` |
| `<math expr>` | Instant Calculator | `150 * 1.21` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus the main search bar instantly |
| <kbd>/</kbd> | Focus search bar (when not typing in an input/textarea) |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Arrow Keys</kbd> (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>) | Navigate visible Bento cards |
| <kbd>Enter</kbd> | Launch highlighted shortcut, execute bang, or search engine |
| <kbd>ESC</kbd> | Clear & blur search bar / close open modals |

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

The project enforces a strict Single Responsibility Principle (SRP) with native ES6 modules under `/js/` (~50–190 lines each):

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
│   ├── widgets.js           # Bento widgets manager (Scratchpad + Pomodoro)
│   ├── theme-studio.js      # Real-time custom theme color palette generator
│   ├── importer.js          # Universal HTML bookmarks parser (Chrome/Firefox)
│   ├── i18n.js              # Localization engine & dynamic loader
│   ├── weather.js           # Precision clock & Open-Meteo weather geocoder
│   ├── search.js            # Multi-engine search, bangs & arrow navigation
│   ├── render.js            # Dynamic Bento grid, cards & smart tooltips
│   ├── dragdrop.js          # Native HTML5 Drag & Drop manager
│   ├── shortcut-manager.js  # Add / Edit / Delete modal controller
│   ├── backup.js            # JSON export, import & factory reset
│   └── settings.js          # Slide-over settings drawer controller
├── iconos/                  # 48 optimized WebP icon assets (60x60)
└── sounds/                  # Haptic audio fallback assets
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
