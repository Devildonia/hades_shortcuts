<div align="center">

# ⚡ HaDeS' Shortcuts
### *A high-performance, ultra-aesthetic browser startpage & command center*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-yellow.svg)](https://developer.mozilla.org/en-US/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-brightgreen.svg)]()
[![Bundle Size](https://img.shields.io/badge/Total%20Size-~200%20KB-success.svg)]()
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN%20%7C%20FR%20%7C%20DE-purple.svg)]()

<br />

<img src="docs/screenshots/demo.gif" alt="HaDeS' Shortcuts Live Demo" width="850" style="border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.6);" />

<br />
<br />

[Features](#-key-features) •
[Gallery](#-visual-showcase) •
[Quick Start](#-quick-start) •
[Keyboard Shortcuts](#-keyboard-shortcuts) •
[Localization (i18n)](#-internationalization-i18n) •
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

### 💎 Liquid Glass 2.0 & Bento Grid Layout
- **Dynamic Aurora Backdrops**: Multi-layer ambient glow animations with subtle tactile grain overlay.
- **Spotlight Cursor Glow**: Real-time cursor tracking on Bento cards accelerated with `requestAnimationFrame` (60/144/240 FPS with 0% CPU overhead).
- **Smart Liquid Tooltips**: Contextual floating glass tooltips with viewport boundary collision detection (anti-clipping) and dynamic `aria-hidden` states (WCAG 2.2 AA).

### 🔍 Multi-Engine Web Search
- **Instant Search Switcher**: Toggle seamlessly between **Google, DuckDuckGo, Perplexity AI, Bing, YouTube, and GitHub** with official crisp WebP logos.
- **Live Fuzzy Filtering**: Real-time shortcut filtering across titles, tags, and descriptions as you type.

### ⚙️ Unified Settings Hub & Slide-Over Drawer
- **All-in-One Settings**: Dedicated glass drawer (<svg>⚙️</svg>) with 5 categorized tabs (*Appearance, Language, Weather, Layout & Shortcuts, Backup*).
- **Theme & Sound Controls**: Switch between 4 visual themes, toggle tactile sound effects, and control ambient Aurora glow.

### 🧩 Drag & Drop Customization & Shortcut Manager
- **Bento Grid Customization**: Reorder entire category blocks or rearrange individual icons with native HTML5 Drag & Drop.
- **Add / Edit / Delete**: Add custom shortcuts with custom URLs, bundled or custom WebP icons, descriptions, and tags.
- **Zero Idle Overhead**: The Drag & Drop engine only runs when *Edit Mode* is explicitly enabled.
- **Emergency Layout Reset**: Dedicated "🔄 Restore Factory Layout" button in the Layout tab.

### 💾 JSON Backup & Instant Restore
- **One-Click Export**: Download a full `shortcuts-backup.json` configuration file.
- **One-Click Restore**: Seamlessly import your setup across any browser or computer.
- **Factory Reset**: Revert back to the default 45 shortcuts at any time.

### 👤 Interactive Username & Saxon Genitive Engine
- **Customizable Name**: Click the title in the header to change your name on the fly.
- **Intelligent Suffix Grammar**: Automatically applies the single apostrophe `'` for names ending in `s/S` (*HaDeS' Shortcuts*, *Carlos' Shortcuts*) or `'s` for others (*Alex's Shortcuts*, *Elena's Shortcuts*).

### ⛅ Live Weather Widget
- **Automatic IP Geolocation**: Detects location without intrusive browser permission dialogs.
- **Open-Meteo Integration**: Accurate real-time temperature, condition descriptions in your active language, and day/night dynamic weather icons.
- **Custom City Picker**: Click the weather widget to search and pin any city worldwide with persistent local storage.

### 🌍 Full 4-Language Localization (i18n)
- Seamless 100% native translations across **Spanish (🇪🇸), English (🇬🇧), French (🇫🇷), and German (🇩🇪)**.
- Localizes greetings, date formats (`toLocaleDateString`), category titles, weather states, and all 45 shortcut descriptions.
- Auto-detects browser language and actively loads external `/locales/*.json` files with embedded fallback.

### 🛡️ Enterprise-Grade Security & Performance
- **Zero Dependencies**: Pure vanilla HTML5, CSS3, and ES6 JavaScript. No Node.js runtime, no npm packages, no bundlers required.
- **Reverse Tabnabbing Shield**: All external links are hardened with `rel="noopener noreferrer"`.
- **Cumulative Layout Shift (CLS = 0)**: Explicit `width="60"` and `height="60"` on all media assets.
- **WCAG 2.2 AA Accessibility**: Keyboard `:focus-visible` neon rings, dynamic `aria-hidden`, and `@media (prefers-reduced-motion: reduce)` support.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus the main search bar instantly |
| <kbd>/</kbd> | Focus search bar (when not inside an input) |
| <kbd>Tab</kbd> | Accessible keyboard navigation with `:focus-visible` ring |
| <kbd>Enter</kbd> | Launch highlighted shortcut or search active engine |
| <kbd>ESC</kbd> | Clear & blur search bar |

---

## 🚀 Quick Start

### Option 1: Direct Local File (Easiest)
Simply double-click [`index.html`](index.html) in your browser. All assets and dictionaries are self-contained and run offline without any server setup.

### Option 2: Local HTTP Server
Run the included `local server.bat` script or launch a simple Python server:
```bash
# Launch a lightweight local server
python -m http.server 8080
```
Then visit `http://localhost:8080` in your favorite browser.

---

## 🌍 Internationalization (i18n)

All interface strings, category titles, greetings, and shortcut tooltips are fully localized:

```
locales/
├── es.json   # Español 🇪🇸
├── en.json   # English 🇬🇧
├── fr.json   # Français 🇫🇷
└── de.json   # Deutsch 🇩🇪
```

---

## 🏛️ Project Architecture (Anti-God File Modular Design)

The project enforces a strict Single Responsibility Principle (SRP) with native ES6 modules under `/js/` (~50–185 lines each):

```
├── index.html               # Clean, accessible semantic DOM structure
├── style.css                # Fluid CSS design tokens, themes & animations
├── locales/                 # i18n translation dictionaries (ES, EN, FR, DE)
├── docs/
│   └── screenshots/         # High-res previews & animated demo GIF
├── js/
│   ├── app.js               # Main orchestrator & lifecycle manager
│   ├── state.js             # Reactive central state & localStorage sync
│   ├── i18n.js              # Localization engine & dynamic loader
│   ├── weather.js           # Precision clock & Open-Meteo weather geocoder
│   ├── search.js            # Multi-engine search & fuzzy shortcut filter
│   ├── render.js            # Dynamic Bento grid, cards & smart tooltips
│   ├── dragdrop.js          # Native HTML5 Drag & Drop manager
│   ├── shortcut-manager.js  # Add / Edit / Delete modal controller
│   ├── backup.js            # JSON export, import & factory reset
│   └── settings.js          # Slide-over settings drawer controller
├── iconos/                  # 48 optimized WebP icon assets (60x60)
└── sounds/                  # Haptic feedback audio effects (click & hover)
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
