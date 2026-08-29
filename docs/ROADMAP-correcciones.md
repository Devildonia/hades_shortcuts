# Roadmap de correcciones — Auditoría v1.0.0-rc-1

> Plan de trabajo para cerrar todos los bugs, brechas de rendimiento, i18n y
> accesibilidad detectados en la auditoría profunda. Cada tarea indica
> archivo, cambio exacto y verificación. Estado: `[ ]` pendiente · `[x]` hecho.

## Reglas generales

- 100% vanilla, sin Node/npm. Tests en `tests/index.html` (baseline: 132/132 en verde).
- Una fase = un commit. Antes de cada commit: suite completa en verde.
- Sin `git push` hasta que el usuario lo pida.
- Todo texto nuevo de UI entra en el diccionario i18n (es/en/fr/de), nunca hardcoded.
- Patrón de referencia para guardias de teclado: `initGlobalShortcuts()` en `js/app.js`
  (comprueba `document.activeElement` contra input/textarea/contenteditable).

## Correcciones sobre hallazgos previos (verificado en esta sesión)

- El input del token GitHub (`#sync-token-input`) ya es `type="password"` en
  `index.html:1041` → **no requiere cambio** (se descarta del alcance).
- `_locales/{es,en,fr,de}/messages.json` solo contiene `extName`/`extDesc`
  (convención de Chrome para el manifest) → **no es duplicación real**.
  La duplicación real es solo: diccionario embebido en `js/i18n.js` vs `locales/*.json`.
- El CSS no usa selectores `a.enlace-icono` (0 apariciones): la sustitución
  `<a>` → `<div>` de la Fase 5 no rompe estilos por selector.

---

## Fase 1 — Seguridad (P0) ✅ COMPLETADO

### T1.1 ✅ Escapar `macro.icon` en el render de macros
- Archivo: `js/macros.js` → `renderMacroList()`.
- Cambio: `${escapeHtml(macro.icon || '⚡')}` en vez de `${macro.icon || '⚡'}`.
- Endurecimiento (misma tarea): en `saveFromForm()`, sanitizar el icono antes de
  guardar: aceptar solo (a) cadena corta ≤ 16 caracteres sin `<`, o (b) URL
  `http(s)://` / `data:image/...` válida (mismo criterio que `sanitizeCssUrl`).
- Verificación: test nuevo — guardar macro con icono `<img src=x onerror=alert(1)>`,
  renderizar, y afirmar que el DOM contiene el texto escapado y **no** ningún
  elemento `<img>` inyectado.
- Riesgo: mínimo. Esfuerzo: S.

### T1.2 ✅ Escapar `data-ev-id` en la lista del widget de calendario
- Archivo: `js/calendar-agenda.js` → `render()`.
- Cambio: `data-ev-id="${escapeHtml(ev.id)}"` (la vista completa ya lo hace).
- Verificación: suite en verde + test opcional con id hostil (`ev"><script>`).
- Esfuerzo: S (1 línea).

### T1.3 ✅ Validar icono personalizado en el editor de atajos
- Archivo: `js/shortcut-manager.js` → `saveShortcut()`.
- Cambio: si `customIconInput.value` no pasa la validación http(s)/data:image,
  ignorarlo y conservar `selectedIcon`. Reutilizar el helper de T1.1 (extraer a
  `js/state.js` como `sanitizeIconUrl()` para compartirlo).
- Verificación: test nuevo — guardar atajo con icono `javascript:alert(1)` → se
  descarta y queda el icono predefinido.
- Esfuerzo: S.

**Done de Fase 1:** ✅ 5 tests nuevos en verde (132→137) + suite completa en verde (137/137).

---

## Fase 2 — Rendimiento (P1) ✅ COMPLETADO

### T2.1 ✅ Búsqueda: eliminar layout thrashing y re-parseo
- Archivo: `js/search.js` → `filterShortcuts()`.
- Cambio: (a) `card.textContent` en vez de `card.innerText`; (b) hoisear
  `const parsed = tagsFilter.parseQuery(query)` ANTES del bucle por tarjeta.
- Verificación: tests de búsqueda existentes en verde + medida manual de tiempo
  de filtro con 60 tarjetas (antes/después, debe bajar de forma medible).
- Esfuerzo: S.

### T2.2 ✅ Service Worker: acotar la caché
- Archivo: `sw.js` → handler de `fetch`.
- Cambio: solo hacer `cache.put` para peticiones **same-origin** (o allowlist:
  same-origin + `/iconos/` + `fonts/`). Excluir APIs de terceros (github,
  open-meteo, unsplash, algolia, mymemory, ipwho.is, google s2, cloudflare...).
  Mantener la estrategia red-first para navegación.
- Verificación: headless con `caches.keys()`/enumeración de entradas tras varios
  fetches de APIs → la caché solo contiene assets propios.
- Esfuerzo: M.

### T2.3 ✅ Theme Studio: guardar sin escribir por tick
- Archivo: `js/theme-studio.js`.
- Cambio: (a) sliders `blur`/`dim`: aplicar valor en vivo, pero `saveBgConfig()`
  con debounce ~200 ms y al `change` final; (b) `handleColorChange()`: pasar por
  `persistJson` (try/catch de cuota) en vez de `localStorage.setItem` crudo.
- Verificación: manual — mover slider rápido no satura el storage; suite en verde.
- Esfuerzo: S.

### T2.4 ✅ Weather: timeouts en red
- Archivo: `js/weather.js` → `fetchWeatherForCoords()`, `detectLocationAndWeather()`.
- Cambio: `AbortController` + timeout 8-10 s en los fetches a `open-meteo`,
  `ipwho.is` y geocoding (mismo criterio que `fetchTextMaybeProxy` de `state.js`).
- Verificación: manual con red cortada → toast de error en <15 s, sin promesas
  colgadas.
- Esfuerzo: S-M.

**Done de Fase 2:** ✅ búsqueda sin layout thrashing, caché SW acotada a same-origin,
debounce en sliders, timeouts 10 s en fetches de weather. Suite 137/137 en verde.

---

## Fase 3 — Lógica y UX (P1) ✅ COMPLETADO

### T3.1 ✅ Weather: primera pintura desde caché
- Archivo: `js/weather.js` → `init()`.
- Cambio: leer `weather_cache_v2`; si existe y tiene < 24 h, llamar
  `renderWeatherUI(city, temp, code, isDay)` de inmediato (paint instantáneo) y
  refrescar en segundo plano. Si es stale, igualmente pintar y refrescar.
- Verificación: manual — recargar con caché caliente: widget con datos antes del
  fetch.
- Esfuerzo: S.

### T3.2 ✅ Bangs: rechazar decimales malformados
- Archivo: `js/bangs.js` → `parseNumber()` de `evaluateArithmetic`.
- Cambio: tras consumir dígitos, si el fragmento contiene más de un `.` →
  lanzar error (el caller devuelve `null`).
- Verificación: tests nuevos — `evaluateArithmetic('1.2.3') === null`,
  `evaluateArithmetic('1.5+2.5') === '4'` (regresión).
- Esfuerzo: S.

### T3.3 ✅ Spaces: guardia de Alt+1..6 mientras se escribe
- Archivo: `js/spaces.js` → `bindKeyboardShortcuts`.
- Cambio: si `document.activeElement` es input/textarea/contenteditable → no
  capturar (mismo patrón de `initGlobalShortcuts` en `js/app.js`).
- Verificación: manual — escribir en post-it/scratchpad con Alt+1 no cambia space.
- Esfuerzo: S.

### T3.4 ✅ Radial HUD: guardia de Alt+C / Alt+W mientras se escribe
- Archivo: `js/radial-hud.js` → `bindEvents()`.
- Cambio: misma guardia de T3.3 para el atajo Alt+C/W; no `preventDefault` si
  hay foco en campo de edición.
- Verificación: manual — Alt+C dentro del omnibox no abre el HUD ni bloquea el carácter.
- Esfuerzo: S.

### T3.5 ✅ Post-its: techo de z-index
- Archivo: `js/postits.js`.
- Cambio: `const MAX_Z_INDEX = 900;` (patrón de `js/layout.js`). Al superar el
  techo, rebasear: restar la cantidad mínima para que el orden relativo se
  mantenga y el nuevo máximo vuelva a ≤ 900.
- Verificación: test nuevo — simular 20 apilamientos y afirmar que todo z-index
  ≤ 900 y el último apilado sigue siendo el superior.
- Esfuerzo: S-M.

### T3.6 ✅ Backup: confirmar antes de importar
- Archivo: `js/backup.js` → `importBackup()`.
- Cambio: `confirm()` con clave nueva `settings_hub.backup.import_confirm`
  (añadida a los 4 diccionarios) ANTES de aplicar el payload.
- Verificación: manual + tests de i18n de la Fase 4.
- Esfuerzo: S.

### T3.7 ✅ Editor de atajos: confirmar borrado
- Archivo: `js/shortcut-manager.js` → `deleteShortcut()`.
- Cambio: `confirm()` con clave nueva `toasts.confirm_delete_shortcut` (4 idiomas).
- Verificación: manual.
- Esfuerzo: S.

### T3.8 ✅ TopSites: favicon con hostname, no URL completa
- Archivo: `js/extension-api.js` → `importTopSitesToShortcuts()`.
- Cambio: `domain=${encodeURIComponent(domain)}` donde `domain` es el hostname
  (ya se calcula unas líneas arriba).
- Verificación: manual en extensión (o lectura de código; el path no corre en PWA).
- Esfuerzo: S (1 línea).

### T3.9 ✅ DevTools: clipboard sin rejection huérfana
- Archivo: `js/devtools.js` → `bindCopyBtns()`.
- Cambio: `navigator.clipboard.writeText(text).catch(() => {})`.
- Verificación: lectura de código + manual.
- Esfuerzo: S (1 línea).

### T3.10 ✅ Neural Search: quitar código muerto
- Archivo: `js/neural-search.js`.
- Cambio: eliminar `fetchLiveInstantKnowledge()` (nunca se invoca). Las
  respuestas rápidas hardcodeadas: mover a diccionario i18n (clave
  `neural.quick_fallback`) o eliminar si son inalcanzables tras la limpieza.
- Verificación: suite en verde; grep sin referencias a la función.
- Esfuerzo: S.

### T3.11 ✅ Scratchpad: una sola clave de storage
- Archivo: `js/widgets.js` → `bindScratchpad`.
- Cambio: escribir solo en `hades_scratchpad_content`. Migración: al iniciar,
  si la nueva clave está vacía y `bento_scratchpad_notes` tiene datos → copiar
  y borrar la legacy.
- Verificación: manual — nota existente migra; escritura nueva solo toca 1 clave.
- Esfuerzo: S.

**Done de Fase 3:** 4 tests nuevos (T3.2 ×2 decimales, T3.5 ×2 techo de z-index),
guardias de teclado verificadas, sin escrituras duplicadas de storage.
Suite completa: **141/141 en verde** (estable en 3 ejecuciones headless).

---

## Fase 4 — i18n (P2) ✅ COMPLETADO

### T4.1 ✅ Extraer strings hardcodeadas a los 4 diccionarios
Añadir claves (es/en/fr/de) y sustituirlas:

| Módulo | Strings actuales | Nueva clave |
|---|---|---|
| `js/ambient-audio.js` | `Pausar` / `Reproducir` | `ambient.pause` / `ambient.play` |
| `js/crypto-sync.js` | ~10 mensajes de estado | `sync.*` (connected, last_sync, push_*, pull_*, errors) |
| `js/settings.js` | `confirm('¿Deseas reiniciar...')` | `toasts.reset_analytics_confirm` |
| `js/settings.js` | `${streak} 🔥` | quitar emoji; etiqueta `analytics.streak_label` |
| `js/personal-analytics.js` | `title="Descartar"` | `analytics.dismiss` |
| `js/devtools.js` | `📋 Copiar`, `✓ Copiado`, texto de error QR | `devtools.copy` / `devtools.copied` / `devtools.qr_too_long` |
| `js/extension-api.js` | 3 mensajes TopSites | `ext.topsites_denied` / `ext.topsites_added` / `ext.topsites_none` |
| `js/importer.js` | ternario manual 4 idiomas ×2 | `importer.all_duplicates` / `importer.duplicates_skipped` |
| `js/theme-studio.js` | 3 toasts de imagen + 1 de URL | `theme_studio.storage_full` / `image_saved` / `image_error` / `invalid_url` |
| `js/state.js` | toast «storage lleno» | `toasts.storage_full` vía inyección `setStorageFullMsg()` (evita ciclo state↔i18n) |
| `js/crypto-sync.js` | toast «No se pudo restaurar el Gist» | `sync.restore_failed` |

- Verificación: grep final — 0 strings de UI hardcodeadas en `js/` (excluidos
  defaults de fallback `|| '...'`, que quedan como seguridad).
- Esfuerzo: M.

### T4.2 ✅ Bang `!w`: Wikipedia por idioma activo
- Archivo: `js/bangs.js` → `BANGS_MAP['!w']`.
- Cambio: resolver el dominio según `state.language` (es → es.wikipedia,
  en → en.wikipedia, fr → fr.wikipedia, de → de.wikipedia). `parseBangQuery`
  recibe la lengua o se resuelve en el caller (mejor: `buildBangUrl(bang, lang)`).
- Verificación: test nuevo — con `state.language='en'`, `!w hello` apunta a
  `en.wikipedia.org`.
- Esfuerzo: S.

### T4.3 ✅ Test de consistencia embebido ↔ locales/*.json
- Archivo: `tests/index.html` (o helper en `js/i18n.js`).
- Cambio: test que `fetch`ea `locales/{es,en,fr,de}.json` y compare el **conjunto
  de claves** (recursivo) contra `i18nDictionaries[lang]`. Detecta desviaciones
  futuras sin migrar nada.
- Verificación: test pasa hoy y fallaría si una copia diverge.
- Esfuerzo: S-M.

**Done de Fase 4:** i18n sin strings sueltas — grep final: 0 toasts/confirms/alerts hardcodeados en `js/` (se añadieron `theme-studio.js`, `state.js` e `sync.restore_failed` más allá de la tabla original) + bang `!w` por idioma + test antidivergencia embebido↔JSON en verde (456→462 claves/lang, en sincronía). Suite completa: **146/146 en verde**.

> Nota: las plantillas de contenido IA de `js/ai-agent.js` (`generateLocalHeuristicResponse`) se dejan como ítem separado: son contenido de respuesta (markdown dinámico), no etiquetas de UI.

> **Cierre 100 % → 0 literal absoluto (follow-up):** `js/ai-agent.js` queda con **0 strings de runtime en español** (solo quedan comentarios de código en español, deliberadamente, para el maintainer). Se extrajeron a los 4 diccionarios (es/en/fr/de; diccionario embebido `js/i18n.js` regenerado a partir de `locales/*.json` para mantener sincronía): `ai_agent.thinking`, `ai_agent.stopped`, `ai_agent.local_failed`, `ai_agent.fallback_suffix`, el bloque `ai_agent.error.{empty,missing_key,network,aborted,timeout,http,unreachable}`, `ai_agent.providers.{local_heuristic,ollama,lmstudio,openai,anthropic}` (antes el mapa `PROVIDER_LABELS`, ahora vía `providerLabel()`), `ai_agent.system_prompt` (con placeholder `{context}`) y `ai_agent.user_label`. La firma `HTTP <status>` se conserva como firma técnica (la matchea el regex de `describeError` y no contiene español). Suite completa: **154/154 en verde** (incluido el test antidivergencia embebido↔JSON).

---

## Fase 5 — Validez HTML y accesibilidad (P2) ✅ COMPLETADO

### T5.1 ✅ Tarjetas: `<a>` con `<button>` anidados → HTML válido
- Archivos: `js/render.js` (+ ajustes menores en `style.css` si hacen falta).
- Cambio: la tarjeta pasa de `<a class="enlace-icono" href target rel>` a
  `<div class="enlace-icono" role="link" tabindex="0">`. La navegación pasa a
  `openSafeUrl(shortcut.url, '_blank')` en el handler de click (no-edit-mode),
  y se añade `keydown` (Enter/Space) para teclado. El `<button>` de edición
  queda dentro de un contenedor no interactivo → válido.
- Riesgo: M. Mitigación: no cambia la clase ni el DOM visible; el CSS no usa
  selectores `a.enlace-icono` (verificado: 0 apariciones); drag & drop usa
  `draggable` (compatible con div); `bindCardInteractions` ya gestiona clicks.
- Verificación: suite en verde + checklist manual: click abre URL, Enter desde
  teclado abre URL, drag & drop en edit-mode funciona, botones editar/borrar
  siguen funcionando, tooltip y spotlight intactos.
- Esfuerzo: M.
- Hecho: tarjeta → `<div class="enlace-icono" role="link" tabindex="0" data-href>`;
  navegación por `openSafeUrl()` (importado en `render.js`); `keydown` Enter/Space;
  `js/search.js` Enter usa `data-href`; 6 tests nuevos en `tests/validity-a11y.test.js`.

### T5.2 ✅ `<noscript>` en index.html
- Cambio: bloque `<noscript>` con mensaje claro (la app requiere JavaScript).
- Esfuerzo: S.
- Hecho: `<noscript>` tras `<body>` (ES+EN) + CSS `.noscript-banner` en `style.css`.

### T5.3 ✅ Marca de usuario: teclado en `role="button"`
- Archivo: `js/app.js` → `initUserNameSystem()`.
- Cambio: `brandTitle` (que ya tiene click) recibe `keydown` (Enter/Space →
  `openModal`), ya que `#brand-user-name` declara `role="button" tabindex="0"`
  en `index.html`.
- Verificación: manual — Tab hasta la marca + Enter abre el modal.
- Esfuerzo: S.
- Hecho: `#brand-user-name` (role="button" tabindex="0") ahora escucha `keydown`
  (Enter/Space → `openModal`), igual patrón que weather-widget.

### T5.4 ✅ Recorrido final de roles
- Cambio: grep de `role="button"` en `index.html` y confirmar que cada uno tiene
  handler de teclado (weather: ya tiene; brand: T5.3; resto: verificar y anotar).
- Esfuerzo: S.
- Hecho: solo 2 `role="button"` en index.html — `#brand-user-name` (T5.3) y
  `#weather-widget` (ya tenía Enter/Space en `js/weather.js:234`). Sin roles
  creados por JS (grep limpio). Guardas de fuente en los tests T5.3/T5.4.

**Done de Fase 5:** ✅ HTML válido en la grilla (tarjetas `<div role="link">`),
sin roles de botón sin teclado, `<noscript>` presente. Suite completa: **154/154 en verde**
(146→154, +8 tests en `tests/validity-a11y.test.js`). App principal arranca sin errores.

---

## Fase 6 — Repositorio y versiones (P3) ✅ COMPLETADO (repo)

### T6.1 ✅ (repo) `dist/*.zip` fuera de git
- Cambio: subir `hades-shortcuts-chrome-v1.0.0-rc-1.zip` como asset de un
  GitHub Release, borrarlo del árbol, añadir `dist/` a `.gitignore` y nota en
  README (desde dónde descargarlo).
- Esfuerzo: S.
- Hecho (lado repo): `git rm --cached` del zip (queda en disco, regenerable con
  `package-extension.py`), `dist/` añadido a `.gitignore`, README apunta a
  `github.com/Devildonia/hades_shortcuts/releases` (badge + Quick Start).
- ⏳ Pendiente (acción externa): crear el GitHub Release con el zip como asset
  para que el link `releases/latest/download/...` funcione:
  `gh release create v1.0.0-rc-1 dist/hades-shortcuts-chrome-v1.0.0-rc-1.zip --notes "v1.0.0-rc-1"`

### T6.2 ✅ Screenshots: decisión explícita
- Mantener `docs/screenshots/` en el repo (el README los renderiza en GitHub;
  moverlos a LFS rompería las vistas embebidas sin beneficio real). Anotar la
  decisión en README o este roadmap. Sin acción de código.
- Hecho: nota añadida bajo “Visual showcase” del README (razón: vistas embebidas).

### T6.3 ✅ Versión única
- Cambio: constante `APP_VERSION = '1.0.0-rc-1'` en `js/state.js` (o `app.js`),
  importada por `js/backup.js`, `js/crypto-sync.js` y cualquier otro sitio que
  la repita. `manifest.json` conserva `version: "1.0.0"` (requisito semver de
  Chrome) + `version_name` rc.
- Verificación: grep — 1 definición, N imports.
- Esfuerzo: S.
- Hecho: `export const APP_VERSION` en `js/state.js`; `backup.js` y
  `crypto-sync.js` la importan. grep: literal `1.0.0-rc-1` solo en `state.js`
  (def), 2 imports. `manifest.json`: `version: "1.0.0"` + `version_name` rc.

### T6.4 ✅ Iconos reales 16/48 en el manifest
- Cambio: generar `iconos/pwa-16.png` y `iconos/pwa-48.png` desde `pwa-192.png`
  (script one-shot con Python/Pillow, fuera del proyecto) y referenciarlos en
  `manifest.json`.
- Esfuerzo: S.
- Hecho: Pillow (LANCZOS) genera 16×16 y 48×48 RGBA; `manifest.json` →
  `16→pwa-16.png, 48→pwa-48.png, 128→pwa-512.png`. JSON validado.

### T6.5 ✅ Cache-busting unificado
- Cambio: `js/app.js?v=1.0.0-rc-1.dragfix` → versión limpia al liberar (la
  constante de T6.3 guía el valor).
- Esfuerzo: S.
- Hecho: `index.html` → `style.css?v=1.0.0-rc-1` y `js/app.js?v=1.0.0-rc-1`
  (mismo valor que `APP_VERSION`, sin sufijo `.dragfix`).

**Done de Fase 6:** ✅ zip fuera de git (`dist/` en .gitignore), versión única
(`APP_VERSION` en `state.js`, 2 imports), iconos 16/48 reales, cache-bust unificado.
Suite completa: **154/154 en verde**.

---

## Fase 7 — Verificación final y cierre ✅ COMPLETADO

1. ✅ Suite completa: **154/154 en verde** (objetivo ≥142 superado), verificada en
   Edge headless tras cada fase y en el cierre.
2. ✅ Checklist — verificado por código/test (trazabilidad):
   - ✅ Búsqueda: `filterShortcuts` usa `textContent` (no `innerText`) y hoishea
     `parseQuery` antes del bucle → sin layout thrashing (js/search.js:163,184).
   - ✅ Weather: `fetchWithTimeout` (AbortController, 10 s) + `showToast(...'error')`
     en catch + caché `weather_cache_v2` (js/weather.js:6,158,163).
   - ✅ Sliders: `debouncedSave` ~200 ms + `flushSave` on `change` (js/theme-studio.js:394-413);
     post-its también con debounce (js/postits.js:211) → sin ráfagas de escrituras.
   - ✅ Alt+1..N (spaces) y Alt+C/W (radial-hud) guardan con `isEditing`
     (js/spaces.js:211, js/radial-hud.js:214) → no capturan con input enfocado.
   - ✅ Post-its: z-index acotado `MAX_Z_INDEX=900` + rebaseline a 1..n
     (js/postits.js `_bumpZIndex`).
   - ✅ Backup: importar pide `confirm` (js/backup.js:65); borrar atajo pide
     `confirm` (js/shortcut-manager.js:206); reset pide `confirm` (js/backup.js:119).
   - ✅ Macro con icono malicioso: `escapeHtml` en render + sanitize al guardar
     (T1.1, test en verde).
   - ✅ Marca de usuario: Enter/Space abre el modal (T5.3, guard de fuente en test).
3. ⏸ Lighthouse: opcional; es una herramienta Node (conflicta con “sin Node”).
   Se omite por diseño; la suite + auditoría de a11y cubren el alcance.
4. ✅ Commits: uno por fase sobre `main` (Fase 1..7).
5. ✅ Hallazgo de cierre: `js/search.js:179` leía `card.getAttribute('href')` (siempre
   `null` tras T5.1); corregido a `data-href`. Suite sigue **154/154**.
6. **Push solo cuando el usuario lo pida.**

> Nota: `Alt+F` (Focus) y `Alt+Space` (Mini HUD) son atajos globales por diseño
> (no requieren guardar de `isEditing`); quedan fuera del checklist anterior.

## Resumen de esfuerzo

| Fase | Alcance | Esfuerzo | Prioridad |
|---|---|---|---|
| 1 — Seguridad | XSS macro icon, ids, iconos | S | P0 |
| 2 — Rendimiento | search, SW cache, sliders, timeouts | S-M | P1 |
| 3 — Lógica/UX | 11 tareas de 1 línea a media | S-M | P1 |
| 4 — i18n | ~30 strings + test antidivergencia | M | P2 |
| 5 — A11y/HTML válido | tarjetas, noscript, teclado | M | P2 |
| 6 — Repo/versiones | dist, version, iconos | S | P3 |
| 7 — Verificación | suite ampliada + checklist | S | — |
