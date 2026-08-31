<div align="center">

# HaDeS' Shortcuts (v1.0.0-rc-1)
### *A cyberpunk browser command center & startpage — vanilla HTML/CSS/JS, zero runtime dependencies*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online%20Preview-brightgreen?logo=github)](https://devildonia.github.io/hades_shortcuts/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-v1.0.0--rc--1%20MV3-blue?logo=googlechrome)](https://github.com/Devildonia/hades_shortcuts/releases/latest/download/hades-shortcuts-chrome-v1.0.0-rc-1.zip)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable%20Desktop-orange?logo=pwa)](https://devildonia.github.io/hades_shortcuts/)
[![Pure Vanilla](https://img.shields.io/badge/Stack-Vanilla%20HTML%20%2F%20CSS%20%2F%20JS-yellow.svg)](https://developer.mozilla.org/en-US/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0%20Zero-brightgreen.svg)]()
[![i18n](https://img.shields.io/badge/i18n-ES%20%7C%20EN%20%7C%20FR%20%7C%20DE-purple.svg)]()
[![Tests](https://img.shields.io/badge/Tests-169%20in--browser%2C%200%20dependencies-brightgreen)](tests/index.html)

<br />

<p align="center">
  <a href="https://devildonia.github.io/hades_shortcuts/">
    <img src="https://img.shields.io/badge/%F0%9F%8C%90%20Open%20Live%20Demo-https%3A%2F%2Fdevildonia.github.io%2Fhades__shortcuts%2F-blue?style=for-the-badge" alt="Try Live Demo" />
  </a>
</p>

<br />

<img src="docs/screenshots/demo.gif" alt="HaDeS' Shortcuts live demo: six visual themes and contained settings drawer" width="850" />

<br />
<br />

[Live Demo](https://devildonia.github.io/hades_shortcuts/) ·
[Features](#key-features) ·
[Architecture](#architecture) ·
[Keyboard](#keyboard-shortcuts) ·
[Bangs](#devtools-omnibox--bang-commands) ·
[Quick Start](#quick-start) ·
[Testing](#testing)

</div>

---

## What's new in v1.0.0-rc-1

First release candidate of 1.0. Chrome MV3 `version` stays numeric (`1.0.0`); the human tag is `1.0.0-rc-1` (`version_name`, cache-bust and zip).

- **Audit hardening**: single ESM graph (no duplicate engines), `openSafeUrl` on every live `window.open`, iCal `TZID` parsing, Focus/Pomodoro share remaining time, `alert()` replaced with toasts on Focus and iCal sync.
- **i18n parity**: embedded dictionaries match `locales/` (ES / EN / FR / DE); weather, user, iCal, RSS, smart-view, zen and AI modals use `data-i18n`.
- **PWA cache** `hades-shortcuts-v1.0.0-cache`; startpage loads `js/app.js` (stale `js/bundle.js` removed).
- **Six visual themes**: Cyber Neon, Deep Nebula, Sunset Amber, **Abyss OLED**, **Jade Terminal**, Crystal Light.
- **Contained Command Center settings** (max 620px) with six tabs, including Habits & Analytics.
- **57 bundled shortcuts** across 11 Bento categories, including **Spotify** in Audio Generation, **eBay** in Shopping & Payments, and a full **Gaming** row.
- **Arc-style spaces** filter categories in place: Work & Dev (all), Personal & Leisure (social, shopping, gaming…), 3D & AI Creation (Gemini lives with Google Workspace).
- Empty category boxes stay hidden unless Edit Mode is on. Widget titles use inline SVG instead of emoji.
- Macro **Run / Edit** actions are equal-width Bento chips.

---

## Visual showcase

<div align="center">

| Cyber Neon | Deep Nebula |
| :---: | :---: |
| <img src="docs/screenshots/theme-cyber.png" width="420" alt="Cyber Neon dashboard" /> | <img src="docs/screenshots/theme-nebula.png" width="420" alt="Deep Nebula dashboard" /> |

| Sunset Amber | Crystal Light |
| :---: | :---: |
| <img src="docs/screenshots/theme-sunset.png" width="420" alt="Sunset Amber dashboard" /> | <img src="docs/screenshots/theme-light.png" width="420" alt="Crystal Light dashboard" /> |

| Abyss OLED | Jade Terminal |
| :---: | :---: |
| <img src="docs/screenshots/theme-abyss.png" width="420" alt="Abyss OLED dashboard" /> | <img src="docs/screenshots/theme-jade.png" width="420" alt="Jade Terminal dashboard" /> |

| Command Center Settings | Offline QR (Nayuki) |
| :---: | :---: |
| <img src="docs/screenshots/settings-drawer.png" width="420" alt="Contained settings drawer with six themes" /> | <img src="docs/screenshots/devtools-qr-preview.png" width="420" alt="Client-side QR modal" /> |

</div>

> **Screenshots** — `docs/screenshots/` se mantiene en el repo (no Git LFS): GitHub renderiza estas
> vistas embebidas directamente, y moverlas a LFS rompería las imágenes en el README sin beneficio real.

---

## Architecture

Vanilla HTML / CSS / ES modules. `js/app.js` boots the page; `js/state.js` is the reactive hub; everything else is a single-responsibility engine.

```mermaid
flowchart TB
  subgraph shell [Shell]
    HTML["index.html"]
    CSS["style.css tokens + 6 themes"]
    LOC["locales/ ES EN FR DE"]
    SW["sw.js PWA network-first"]
  end

  HTML --> APP["js/app.js orchestrator"]
  CSS --> HTML
  LOC --> I18N["i18n.js"]
  APP --> I18N
  APP --> STATE["state.js shortcuts, theme, layout"]

  subgraph surface [Dashboard surface]
    RENDER["render.js Bento grid"]
    SEARCH["search.js + bangs.js"]
    WIDGETS["widgets.js scratchpad / pomodoro"]
    SETTINGS["settings.js 620px drawer"]
  end

  subgraph engines [Engines]
    SPACES["spaces.js profiles"]
    MACROS["macros.js routines"]
    FOCUS["focus-mode.js Zen Shield"]
    RADAR["tech-radar.js RSS/Atom"]
    AURORA["aurora-canvas.js + solar-engine.js"]
    STUDIO["theme-studio.js backgrounds"]
    AI["ai-agent.js local / cloud"]
  end

  subgraph persist [Persistence]
    LS["localStorage"]
    BACKUP["backup.js JSON"]
    GIST["crypto-sync.js AES-256-GCM Gist"]
  end

  subgraph platform [Platforms]
    WEB["platform.js web vs extension"]
    MV3["manifest.json + sw-extension.js"]
  end

  APP --> surface
  APP --> engines
  STATE --> LS
  SETTINGS --> STUDIO
  SETTINGS --> MACROS
  SEARCH --> MACROS
  BACKUP --> LS
  GIST --> LS
  WEB --> MV3
  SW --> HTML
```

### Runtime flow

1. `index.html` loads design tokens and `js/app.js` as an ES module.
2. `app.js` hydrates `state`, locale, spaces, renderer, search, settings, widgets, and optional engines (Aurora, radar, calendar, AI).
3. `render.js` paints the Bento grid: **5 widget columns**, then **4 category columns**. Empty categories are skipped unless Edit Mode is on. The active space's `categoryIds` is a display filter — it does not replace the shortcut catalog.
4. Search, bangs, and macros all read the same `state.shortcuts` list.
5. Preferences live in `localStorage`. GitHub Gist sync encrypts that dashboard JSON with PBKDF2 + AES-256-GCM. API keys for OpenAI / Anthropic stay in `sessionStorage` for the tab only.

### Module map (`js/`)

| Module | Role |
| :--- | :--- |
| `app.js` | Lifecycle orchestrator |
| `state.js` | Reactive store, 11 categories, 57 default shortcuts |
| `i18n.js` | Dictionary loader + embedded fallbacks |
| `render.js` | Bento cards, tooltips, empty-category skip |
| `search.js` | Omnibox, engine picker, clear-X, bangs bridge |
| `spaces.js` | Work / Personal / 3D profiles |
| `settings.js` | Contained drawer, widget toggles, theme radios |
| `theme-studio.js` | Custom accents, Aurora / gradient / Unsplash / local wallpaper |
| `macros.js` | Visual routine studio + `!work` / `!focus` / `!chill` / `!3d` / `!social` |
| `focus-mode.js` | Deep Focus + social Zen Shield |
| `widgets.js` | Scratchpad + Pomodoro |
| `weather.js` | City weather widget + search modal |
| `calendar-agenda.js` | Client-side iCal + manual events |
| `tech-radar.js` | RSS/Atom reader |
| `ambient-audio.js` / `audio.js` | Procedural soundscapes + haptic clicks |
| `aurora-canvas.js` / `solar-engine.js` | WebGL mesh + circadian lighting |
| `radial-hud.js` | Middle-click / Alt+C action wheel |
| `ai-agent.js` | Heuristic / Ollama / OpenAI / Anthropic drawer |
| `neural-search.js` | Token-overlap ranking (not WebGPU embeddings) |
| `crypto-sync.js` | E2EE Gist push/pull |
| `backup.js` | JSON export / import / factory reset |
| `devtools.js` | Omnibox utilities + QR modal (`!qr`) |
| `qrcode.js` | Spec-compliant QR encoder (ISO/IEC 18004), local ES-module port of [Nayuki](https://www.nayuki.io/page/qr-code-generator-library)'s MIT library |
| `platform.js` | Web vs Chrome MV3 differences |
| `sw-extension.js` | Extension background worker |

Supporting files: `manifest.json` (Chrome new-tab override), `site.webmanifest` + `sw.js` (PWA), `iconos/` (60 WebP shortcuts + PWA icons), `locales/`, `tests/` (zero-dependency browser suite). All audio is synthesized at runtime with the Web Audio API (`js/audio.js`, `js/ambient-audio.js`) — zero sample files shipped.

---

## Key features

### Dynamic Background Studio
Three atmosphere modes from **Settings → Appearance**:
- **Aurora Canvas** — procedural mesh that follows the cursor and, optionally, solar elevation.
- **Solid / Gradient** — Midnight, Cyberpunk, Velvet, Emerald, OLED Black.
- **Image / Unsplash** — curated topics, random photo, local `FileReader` upload, custom URL, live **Blur** and **Dim** sliders.

### Visual Macro Studio
No-code routines in **Settings → Macros & Routines**: custom bang, title, shortcut checkboxes, ambient preset, Pomodoro action. Run them from the omnibox (`!work`) or the equal-width **Run / Edit** chips on each card.

### Bento Calendar & Agenda
Client-side RFC 5545 iCal (Google, Outlook, iCloud, Nextcloud, Proton). Manual events with title, time, and Meet / Zoom / Teams / Discord links. A neon pulse fires when a meeting is within 15 minutes.

### Widget visibility
Independent toggles in **Settings → Layout & Shortcuts**: Scratchpad, Calendar, Ambient Audio, Focus Timer, Tech Radar, System Telemetry capsule.

### Live weather
A nav-bar weather chip shows the temperature and conditions for your city (geolocation, IP fallback, or a manual city search such as Vigo or Madrid). The chosen city and last reading persist in `localStorage`.

### Contextual AI agent
Ground-truth injection of shortcuts, tags, spaces, calendar, focus state, and radar headlines. Providers: local heuristic (zero keys), Ollama (`localhost:11434`), LM Studio (`localhost:1234`, OpenAI-compatible endpoint), or OpenAI / Anthropic with a session-only key. Bang: `!ai` / `!ask`.

### Spaces
| Profile | Default filter | Default theme |
| :--- | :--- | :--- |
| Work & Dev | All 11 categories | Cyber Neon |
| Personal & Leisure | Social, Shopping, Gaming, Google, Tools, Video | Deep Nebula |
| 3D & AI Creation | 3D, AI, Art, Audio, Video, Google (Gemini) | Sunset Amber |

Switch with the header pills or <kbd>Alt</kbd>+<kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd>. Scratchpad text and last-used theme are remembered per space.

### Deep Focus & Zen Shield
`!work` / `!focus` or <kbd>Alt</kbd>+<kbd>F</kbd> starts a 25-minute session, dims noise, and intercepts Twitter/X, Instagram, Reddit, and TikTok with a 4-7-8 pacer.

### Tech Radar
In-browser RSS 2.0 / Atom 1.0 parser (Hacker News, Hugging Face, Ars Technica, Blender, custom feeds). 30-minute TTL. Pin any headline to a Glass Post-it.

### Smart views
Compound filters: `tag:<name>`, `#<name>`, `cat:<category>`, `is:fav`, `freq:top`. Pin a query as a permanent pill.

### Local analytics
In-memory + `localStorage` only. 7-day SVG chart, streak, peak hour, optional JSON export / wipe. No outbound telemetry.

### Radial HUD
<kbd>Middle-click</kbd> or <kbd>Alt</kbd>+<kbd>C</kbd>: favorites, ambient, Pomodoro, Post-it, theme cycle, QR, search, settings.

### Circadian lighting
Optional solar elevation coloring: Golden Dawn, High Noon, Cyber Twilight, Abyssal Midnight.

### Telemetry capsule
Latency probe, Battery API, refresh-rate detector, offline failover.

### Procedural audio (0 KB samples)
Web Audio API: Cyber Rain, Deep Space brown noise, 432 Hz binaural alpha, Cosmic Waves.

### Security & privacy
- QR codes are encoded locally with a real ISO/IEC 18004 generator (port of Project Nayuki's library) and painted on a 2D canvas — no third-party QR API or network call.
- GitHub Personal Access Tokens (PAT) live in `sessionStorage` (tab session only) and should strictly be created with minimal permissions: **`gist` scope only** (or Fine-Grained Token with Gists Read & Write).
- Local Ollama inference: when accessing from the browser, launch Ollama with CORS enabled (`OLLAMA_ORIGINS="*" ollama serve`).
- AES-256-GCM is used for **Gist dashboard sync**, not for LLM API keys.
- 57 bundled shortcuts; ranking in `neural-search.js` is local token overlap.

---

## DevTools omnibox & bang commands

| Command | Action | Example |
| :--- | :--- | :--- |
| `!work` / `!focus` | 25-min Deep Focus + Zen Shield | `!work` |
| `!chill` | Media apps + cosmic waves | `!chill` |
| `!3d` | 3D AI tools + deep space audio | `!3d` |
| `!social` | Community apps | `!social` |
| `!uuid` | UUIDv4 + clipboard | `!uuid` |
| `!color <val>` | Color preview | `!color #00f2fe` |
| `!b64` / `!b64d` | Base64 encode / decode | `!b64 Cyberpunk` |
| `!time` / `!epoch` | UNIX epoch helper | `!epoch 1787589157` |
| `!qr <link>` | Scannable offline QR (Nayuki encoder → canvas) | `!qr https://github.com` |
| `!yt` / `!gh` / `!w` / `!r` / `!m` | YouTube, GitHub, Wikipedia, Reddit, Maps | `!gh three.js` |
| `!civitai` / `!tr` / `!npm` / `!ddg` | Model hub, Translate, NPM, DuckDuckGo | `!ddg privacy` |
| `!ai <prompt>` / `!ask <prompt>` | Contextual AI agent (local heuristic / Ollama / LM Studio / cloud) | `!ai summarize my day` |
| `!t <text>` | Quick translate (MyMemory) | `!t hello world` |
| `<math>` | Instant calculator | `150 * 1.21` |

---

## Keyboard shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Alt</kbd> + <kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> | Switch spaces |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Toggle Deep Focus |
| <kbd>Alt</kbd> + <kbd>C</kbd> / <kbd>Middle-Click</kbd> | Radial HUD |
| <kbd>Alt</kbd> + <kbd>Space</kbd> / <kbd>Ctrl</kbd> + <kbd>Space</kbd> | Mini-HUD launcher |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Focus search |
| <kbd>/</kbd> | Focus search (when not typing) |
| <kbd>Ctrl</kbd> + <kbd>,</kbd> | Open settings |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Pin Scratchpad as Post-it |
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Navigate Bento cards |
| <kbd>Enter</kbd> | Launch / bang / web search |
| <kbd>Esc</kbd> | Clear search, exit edit mode, close modals |

---

## Quick start

### Live demo
**[https://devildonia.github.io/hades_shortcuts/](https://devildonia.github.io/hades_shortcuts/)**

### Chrome / Edge / Brave (Manifest V3)
1. Download the extension from the [GitHub Releases page](https://github.com/Devildonia/hades_shortcuts/releases) (`hades-shortcuts-chrome-v1.0.0-rc-1.zip`), or clone this repo.
2. Open `chrome://extensions/`, enable **Developer Mode**.
3. **Load unpacked** and select the project folder.
4. <kbd>Ctrl</kbd> + <kbd>T</kbd> opens the Command Center as your new tab.

### Local server
```bash
python -m http.server 8080
```
Then open `http://localhost:8080`.

---

## Internationalization

```
locales/
├── es.json   # Español
├── en.json   # English
├── fr.json   # Français
└── de.json   # Deutsch
```

UI chrome, greetings, widget copy, settings, and shortcut tooltips stay in parity across the four dictionaries.

---

## Testing

Zero-dependency test suite — **no Node, no npm, no build**. Vanilla ES modules that run directly in the browser:

```bash
python -m http.server 8080
# → open http://localhost:8080/tests/
```

**169 tests across 22 modules** cover the bangs math evaluator (zero-`eval`), the drag/resize editing engine, i18n anti-divergence (`locales/*.json` ↔ embedded dict, all four languages) **plus cross-language key parity** (no key missing in any language), E2EE Gist crypto, PWA, layout, accessibility, and more. Machine-readable results are exposed at `window.__testResults` (JSON) for future CI.

Headless one-liner (no GUI):

```bash
msedge --headless --virtual-time-budget=30000 --dump-dom http://localhost:8080/tests/ 2>/dev/null | grep -o "<title>[^<]*</title>"
# → ✅ Tests: 169/169 pasaron
```

---

## Credits

- **QR Code generator** — `js/qrcode.js` is an ES-module port of [Project Nayuki](https://www.nayuki.io/)'s [QR Code generator library](https://www.nayuki.io/page/qr-code-generator-library) (MIT). Copyright (c) Project Nayuki. The original algorithm encodes all 40 QR versions with Reed–Solomon ECC, automatic masking, and format/version bits; we only adapt the TypeScript reference into a pure browser module and canvas renderer. Full license text is preserved in the file header.

## License

MIT. See [LICENSE](LICENSE). Third-party notice above applies to the bundled Nayuki QR encoder.
