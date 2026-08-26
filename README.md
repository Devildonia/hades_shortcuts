<div align="center">

# ⚡ HaDeS' Shortcuts · Next-Gen (v6.0)
### *A high-performance, ultra-aesthetic browser command center, productivity OS & startpage*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online%20Preview-brightgreen?logo=github)](https://devildonia.github.io/hades_shortcuts/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blue?logo=googlechrome)](dist/hades-shortcuts-chrome-v6.0.0.zip)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20Desktop-orange?logo=pwa)](https://devildonia.github.io/hades_shortcuts/)
[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-yellow.svg)](https://developer.mozilla.org/en-US/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-brightgreen.svg)]()
[![Bundle Size](https://img.shields.io/badge/Total%20Size-~250%20KB-success.svg)]()
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
[Spaces](#-arc-inspired-multi-profile-spaces-contextual-workspaces) •
[Deep Focus & Zen Shield](#-deep-focus-mode--zen-distraction-shield) •
[Calendar Hub](#-bento-calendar--agenda-hub-universal-schedule-hub) •
[Tech Radar & RSS](#-live-tech-radar--multi-channel-rssatom-reader) •
[Tags & Smart Views](#-multi-tag-compound-search--saved-smart-views-linear-style-cmdk) •
[Personal Analytics](#-100-local-personal-analytics--predictive-context-engine-my-dashboard-knows-me) •
[DevTools & Bangs](#-devtools-omnibox--bang-commands-cheatsheet) •
[Keyboard Shortcuts](#-keyboard-shortcuts) •
[Architecture](#-project-architecture-anti-god-file-modular-design)

<br />

</div>

---

## 📸 Visual Showcase

<div align="center">

| 🌌 **Deep Nebula Theme** | 🌅 **Sunset Amber Theme** |
| :---: | :---: |
| <img src="docs/screenshots/theme-nebula.png" width="420" alt="Deep Nebula Theme" /> | <img src="docs/screenshots/theme-sunset.png" width="420" alt="Sunset Amber Theme" /> |

| 💎 **Crystal Light Theme** | ⚙️ **Floating Glass Settings Modal** |
| :---: | :---: |
| <img src="docs/screenshots/theme-light.png" width="420" alt="Crystal Light Theme" /> | <img src="docs/screenshots/settings-drawer.png" width="420" alt="Floating Settings Modal" /> |

| 📱 **Interactive Glass QR Modal** | ⚡ **Cyber Neon Dashboard & Bento** |
| :---: | :---: |
| <img src="docs/screenshots/devtools-qr-preview.png" width="420" alt="Interactive QR Modal" /> | <img src="docs/screenshots/theme-cyber.png" width="420" alt="Cyber Neon Dashboard" /> |

</div>

---

## 🌟 Key Features

### 🪐 Arc-Inspired Multi-Profile Spaces («Contextual Workspaces»)
- **Isolated Digital Profiles**: Switch between custom workflow environments in one click or keyboard shortcut (<kbd>Alt</kbd> + <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd>):
  - 💼 **Work & Dev Space**: Development shortcuts, Git tools, productivity apps, and clean daylight theme.
  - 🏠 **Personal & Leisure Space**: Social media, entertainment, shopping, and deep nebula theme.
  - 🎨 **3D & AI Media Space**: Fast access to 3D generators (Meshy, Tripo3D), GLSL shaders, audio/video generation, and cyber amber theme.
  - ⚡ **Instant In-Place Morphing**: Switches shortcuts, themes, scratchpad notes, and canvas positions without full page reload.

### 🧘 Deep Focus Mode & Zen Distraction Shield
- **Holistic Concentration Architecture**:
  - ⚡ **!work / !focus Bang Sync**: Trigger a 25-minute deep focus session via `!work` or <kbd>Alt</kbd> + <kbd>F</kbd>.
  - 🌫️ **Zen Morphing**: Temporarily dims background distractions, freezes Tech Radar headlines, and spotlights only your active work tools and countdown clock.
  - 🛡️ **Zen Shield Distraction Blocker**: Intercepts attempts to open distracting social media (Twitter/X, Instagram, Reddit, TikTok) and displays a 4-7-8 breathing pacer with live timer.
  - 🔔 **Seamless Break Transition**: Smoothly restores full dashboard visibility upon timer completion with an ambient chime.

### 📅 Bento Calendar & Agenda Hub («Universal Schedule Hub»)
- **Zero-Knowledge Universal Calendar Integration**:
  - 🔄 **Direct RFC 5545 iCal/ICS Parsing**: Client-side parsing of private iCal subscription URLs from Google Calendar, Microsoft Outlook, Apple iCloud, Nextcloud, or Proton Calendar (0 external proxy servers).
  - 🚨 **15-Minute Meeting Proximity Radar**: The bento card pulses with a neon warning halo (`.meeting-pulse-alert`) when an event is starting within 15 minutes.
  - 🚀 **1-Click Video Call Access**: Automatically parses and detects meeting links for **Google Meet**, **Zoom**, **Microsoft Teams**, and **Discord**.
  - 📐 **Full Bento Freeform Support**: Drag, resize (`tile-calendar`), or toggle visibility with `LayoutManager`.

### 📡 Live Tech Radar & Multi-Channel RSS/Atom Reader
- **Zero-Dependency Universal Feed Aggregator**:
  - 📰 **Native DOMParser XML Engine (0 KB)**: Parses any RSS 2.0 or Atom 1.0 feed (HackerNews, Hugging Face, Ars Technica, Blender/3D News, Substack, Reddit) directly in the browser.
  - 🎛️ **Horizontal Channel Selector**: Toggle between custom feeds with high-speed cached switching (<kbd>30 min TTL</kbd>).
  - ➕ **Custom Feeds Manager**: Add unlimited custom RSS feeds with custom names and emoji icons.
  - 📌 **1-Click Post-it Pinning**: Click 📌 on any headline to immediately spawn a floating translucent Glass Post-it on your dashboard.

### 🏷️ Multi-Tag Compound Search & Saved Smart Views («Linear-Style CMDK»)
- **Professional Multi-Dimensional Filtering**:
  - 🔍 **Compound Boolean Operators**: Query shortcuts with `tag:<name>` / `#<name>`, `cat:<category>`, `is:fav`, and `freq:top` in a single search string (e.g. `tag:ia tag:3d freq:top`).
  - 🎨 **Dynamic Color Tag Badges**: Assign vibrant neon hex tags to shortcuts (`#ia`, `#3d`, `#dev`, `#tools`, `#design`).
  - 🔖 **Saved Smart Views**: Pin any complex search query as a permanent pill in the category bar with 1 click (`🔖 [ 🤖 IA & 3D Top ]`).

### 📈 100% Local Personal Analytics & Predictive Context Engine («My Dashboard Knows Me»)
- **Privacy-First Zero-Telemetry Intelligence**: All usage statistics are computed in-memory and sliding-window `localStorage` without sending a single byte to external servers:
  - 🔮 **Time-Aware Smart Suggestions**: Learns your daily habits and displays an interactive context chip (e.g. *"You usually open GitHub & Gmail at 09:00 — Launch now?"*).
  - 📊 **Procedural 7-Day SVG Activity Chart**: Ultra-lightweight native vector chart (< 2 KB, 0 external chart libraries) tracking your daily launch volume.
  - 🔥 **Productivity Streak & Peak Hour Detection**: Displays active day streaks and identifies your peak productivity windows (e.g. `10:00 AM`).
  - 🛡️ **Full Data Sovereignty**: 1-click JSON metrics export and full history wipe with confirmation.

### 🛸 Radial HUD Action Wheel (360° Gestural Quick Access)
- **Holographic Circular Menu**: Press <kbd>Middle-Click</kbd> anywhere on the background or <kbd>Alt</kbd> + <kbd>C</kbd> to deploy an 8-node radial wheel orbiting your cursor:
  1. ⚡ **Top Favorites**: Instant launch of your most-used shortcut.
  2. 🎧 **Ambient Audio**: 1-click play/pause and soundscape toggle.
  3. ⏳ **Pomodoro Focus**: Quick start/pause timer.
  4. 📌 **Instant Post-it**: Creates a sticky note directly under your mouse cursor.
  5. 🌓 **Theme Switcher**: Instant day/night/cyber color cycling.
  6. 📱 **QR Generator**: Generates mobile QR code on the fly.
  7. 🔍 **Search Focus**: Jump to omnibox.
  8. ⚙️ **Floating Settings**: Open centered configuration modal.

### ☀️ Dynamic Solar Lighting & Circadian Rhythm Engine
- **Astronomical Solar Synthesis**: Calculates true solar elevation angle and solar time according to your geographic coordinates:
  - 🌅 **Golden Dawn (06:00 - 10:00)**: Warm amber gold tones and gentle sunrise glows.
  - ☀️ **High Noon (10:00 - 18:00)**: High-contrast sapphire cyan and crystal daylight mesh.
  - 🌆 **Cyber Twilight (18:00 - 22:00)**: Vibrant neon magenta, sunset violet, and twilight auroras.
  - 🌌 **Deep Space Midnight (22:00 - 06:00)**: Deep navy abyssal palette with starry micro-particles on the Aurora Canvas and blue-light eye protection.

### 📊 Cyberpunk System Telemetry & Network Health Capsule
- **Real-Time Network & Hardware Monitoring**:
  - 📶 **Live Latency Ping (ms)**: High-frequency non-blocking ping probe against global Cloudflare (`1.1.1.1`) and Google DNS endpoints.
  - 🔋 **Battery API**: Real-time battery charge percentage and charging status (`⚡95%`).
  - 🖥️ **Refresh Rate Monitor**: Real-time display refresh rate detector (60Hz, 120Hz, 144Hz).
  - 🌐 **Instant Offline Auto-Failover**: Dynamic detection of offline states with auto-cached local fallbacks.

### 🎧 Procedural Ambient Focus Sound Engine (0 KB, 100% Offline)
Pure mathematical acoustic synthesis using modern **Web Audio API** nodes (`AudioContext`, `BiquadFilterNode`, `BufferSourceNode`, `OscillatorNode`):
- 🌧️ **Cyber Rain**: Algorithmic noise with randomized rainfall gusts.
- 🚀 **Deep Space (Brown Noise)**: Ultra-low frequency integration (200 Hz cutoff) for ADHD calming and deep focus.
- ☕ **Binaural Alpha Waves (432 Hz)**: Dual stereo sine wave oscillators producing an 8 Hz Alpha brainwave beat.
- 🌊 **Cosmic Waves**: 10-second rhythmic ocean wave breathing cycle.

### 🔒 Zero-Knowledge Encrypted Cloud Sync (E2EE)
- **Client-Side PBKDF2 + AES-256-GCM**: Derive 256-bit encryption keys with 100,000 PBKDF2 iterations using native `window.crypto.subtle`.
- **Private GitHub Gist Backup**: Safely synchronize all your custom shortcuts, 360° canvas positions, glass post-its, and theme settings with zero server tracking.

---

## ⚡ DevTools Omnibox & Bang Commands Cheatsheet

| Command | Action / Destination Service | Example |
| :--- | :--- | :--- |
| `!work` / `!focus` | Start 25-min Deep Focus session + Zen Shield blocker | `!work` |
| `!chill` | Routine: Open Media Apps + Cosmic Waves Audio | `!chill` |
| `!3d` | Routine: Open 3D AI Tools + Deep Space Audio | `!3d` |
| `!social` | Routine: Open Community & Social Apps | `!social` |
| `!uuid` | Generate UUIDv4 with 1-click clipboard copy | `!uuid` |
| `!color <val>` | Color converter & visual preview swatch | `!color #00f2fe` |
| `!b64 <text>` | Real-time UTF-8 Base64 Encoder | `!b64 Cyberpunk` |
| `!b64d <hash>` | Real-time Base64 Decoder | `!b64d Q3liZXJwdW5r` |
| `!time` / `!epoch` | UNIX epoch to local date & relative time | `!epoch 1787589157` |
| `!qr <link>` | Generate 100% Client-Side Canvas 2D QR Code | `!qr https://github.com` |
| `!yt <query>` | YouTube Search | `!yt lofi hip hop` |
| `!gh <query>` | GitHub Repositories | `!gh three.js` |
| `!w <query>` | Wikipedia (ES) | `!w James Webb` |
| `!r <query>` | Reddit Search | `!r webdev` |
| `!m <query>` | Google Maps | `!m Vigo, Spain` |
| `!civitai <query>` | Civitai Model Hub | `!civitai cyberpunk` |
| `!tr <text>` | Google Translate | `!tr thank you` |
| `!npm <pkg>` | NPM Registry | `!npm canvas-confetti` |
| `!ddg <query>` | DuckDuckGo Direct | `!ddg privacy` |
| `<math expr>` | Instant Math Calculator | `150 * 1.21` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | Switch Spaces (*Trabajo & Dev*, *Personal*, *3D & IA*) |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Toggle Deep Focus Mode & Zen Shield |
| <kbd>Alt</kbd> + <kbd>C</kbd> / <kbd>Middle-Click</kbd> | Open 360° Radial HUD Action Wheel |
| <kbd>Alt</kbd> + <kbd>Space</kbd> / <kbd>Ctrl</kbd> + <kbd>Space</kbd> | Open / Close Mini-HUD Launcher Overlay |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus the main search bar instantly |
| <kbd>/</kbd> | Focus search bar (when not typing in an input/textarea) |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open Settings Drawer |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Pin note as floating Glass Post-it (in Scratchpad) |
| <kbd>Arrow Keys</kbd> (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd>) | Navigate visible Bento cards |
| <kbd>Enter</kbd> | Launch highlighted shortcut, execute bang, or search engine |
| <kbd>ESC</kbd> | Clear search / Exit Edit Mode / Close open modals & HUD |

---

## 🚀 Quick Start

### Option 1: 🌐 Live Demo (Instant Web Preview)
Test and use the production dashboard directly in your browser without any installation:
👉 **[https://devildonia.github.io/hades_shortcuts/](https://devildonia.github.io/hades_shortcuts/)**

### Option 2: 🧩 Chrome / Edge / Brave Extension (Manifest V3)
Transform every new browser tab into HaDeS with 1 click:
1. Download the pre-built package: [`dist/hades-shortcuts-chrome-v6.0.0.zip`](dist/hades-shortcuts-chrome-v6.0.0.zip) (or clone the repository).
2. Open `chrome://extensions/` in your Chromium-based browser (Chrome, Edge, Brave, Opera).
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** (*Cargar descomprimida*) and select this project folder.
5. Press <kbd>Ctrl</kbd> + <kbd>T</kbd> to enjoy your instant command center in every new tab!

### Option 3: Local HTTP Server
```bash
# Launch a lightweight local server
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

---

## 🌍 Internationalization (i18n)

All interface strings, category titles, greetings, widgets, and shortcut tooltips are fully localized with 100% dictionary parity:

```
locales/
├── es.json   # Español 🇪🇸
├── en.json   # English 🇬🇧
├── fr.json   # Français 🇫🇷
└── de.json   # Deutsch 🇩🇪
```

---

## 🏛️ Project Architecture (Anti-God File Modular Design)

The project enforces a strict Single Responsibility Principle (SRP) with native ES6 modules under `/js/` (~40–270 lines each, 0 god files):

```
├── manifest.json            # Chrome Extension Manifest V3 & PWA manifest
├── sw.js                    # Service Worker for offline cache & performance
├── index.html               # Clean, accessible semantic DOM structure
├── style.css                # Fluid CSS design tokens, themes & animations
├── locales/                 # i18n translation dictionaries (ES, EN, FR, DE)
├── dist/
│   └── hades-shortcuts-chrome-v6.0.0.zip # Chrome Extension release package
├── js/
│   ├── app.js               # Main orchestrator & lifecycle manager (229 lines)
│   ├── platform.js          # Universal platform abstraction: Web vs Extension (40 lines)
│   ├── spaces.js            # Arc-inspired multi-profile spaces manager (154 lines)
│   ├── focus-mode.js        # Deep Focus Mode, !work bang & Zen Shield blocker (155 lines)
│   ├── tags-filter.js       # Multi-tag compound query tokenizer & saved smart views (212 lines)
│   ├── calendar-agenda.js   # RFC 5545 iCal/Google calendar parser & proximity radar (188 lines)
│   ├── personal-analytics.js# 100% local usage analytics, 7-day SVG chart & suggestions (207 lines)
│   ├── extension-api.js     # Native TopSites & background context menu bridge (79 lines)
│   ├── sw-extension.js      # Manifest V3 background service worker (30 lines)
│   ├── state.js             # Reactive central state & localStorage sync (231 lines)
│   ├── audio.js             # Procedural Web Audio API synthesizer (100 lines)
│   ├── ambient-audio.js     # Procedural focus ambient soundscapes (252 lines)
│   ├── aurora-canvas.js     # Reactive Aurora Canvas mesh & Mini-HUD launcher (212 lines)
│   ├── solar-engine.js      # Astronomical solar elevation & circadian lighting (63 lines)
│   ├── radial-hud.js        # 360° holographic action wheel & sub-orbital favs (228 lines)
│   ├── telemetry.js         # Real-time ping, battery, fps & offline monitor (109 lines)
│   ├── tech-radar.js        # Multi-channel RSS/Atom feed reader & aggregator (248 lines)
│   ├── neural-search.js     # Local semantic vector search & AI assistant (155 lines)
│   ├── macros.js            # Compound multi-action macro & routine engine (117 lines)
│   ├── crypto-sync.js       # Zero-knowledge AES-256-GCM + GitHub Gist sync (228 lines)
│   ├── bangs.js             # Bang commands parser & safe math calculator (115 lines)
│   ├── devtools.js          # Built-in DevTools Omnibox & Canvas 2D QR Generator (252 lines)
│   ├── postits.js           # Floating Glass Post-its manager (238 lines)
│   ├── layout.js            # Freeform Canvas & Corner Resize Engine (269 lines)
│   ├── widgets.js           # Bento widgets manager: Scratchpad + Pomodoro (140 lines)
│   ├── theme-studio.js      # Real-time custom theme color palette generator (69 lines)
│   ├── importer.js          # Universal HTML bookmarks parser (84 lines)
│   ├── i18n.js              # Localization engine & dynamic loader (68 lines)
│   ├── weather.js           # Precision clock & Open-Meteo weather geocoder (275 lines)
│   ├── search.js            # Multi-engine search, bangs & arrow navigation (271 lines)
│   ├── render.js            # Dynamic Bento grid, cards & smart tooltips (194 lines)
│   ├── dragdrop.js          # Inner card reordering drag & drop manager (111 lines)
│   ├── shortcut-manager.js  # Add / Edit / Delete modal & HD Favicon engine (254 lines)
│   ├── backup.js            # JSON export, import & factory reset (96 lines)
│   └── settings.js          # Floating settings modal controller (215 lines)
├── iconos/                  # 48 optimized WebP icon assets (60x60)
└── sounds/                  # Haptic audio fallback assets
```

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).
