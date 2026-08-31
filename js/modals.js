// js/modals.js - Materialización de modales diferidos (<template data-modal="..."> de index.html)
//
// IMPORTANTE: debe ser el PRIMER import de app.js. Varios engines (AIAgentEngine,
// CalendarAgendaEngine, MiniHudManager, MacroEngine, DevToolsEngine…) se instancian
// a nivel de módulo y sus constructores consultan sus modales de inmediato; al
// ejecutar este módulo primero, todos los modales ya están en el DOM cuando esos
// constructores corren.
//
// En tests (tests/index.html no carga las plantillas) materializeModal devuelve
// null: idéntico al comportamiento previo, donde los engines ya guardan contra null.
import { materializeModal } from './utils.js';

export const MODAL_IDS = [
    'weather-modal',
    'user-modal',
    'calendar-modal',
    'calendar-event-modal',
    'agenda-full-modal',
    'rss-modal',
    'zen-shield-screen',
    'ai-agent-drawer',
    'macro-editor-modal',
    'settings-drawer',
    'shortcut-modal',
    'qr-modal',
    'mini-hud-modal',
];

export function materializeAllModals() {
    MODAL_IDS.forEach(materializeModal);
}

materializeAllModals();
