// js/crypto-sync.js - Zero-Knowledge E2EE Multi-Device Cloud Sync (AES-256-GCM + GitHub Gist)

import { state, showToast, readJsonStorage } from './state.js';
import { soundFx } from './audio.js';

export class CryptoSyncEngine {
    constructor(renderer) {
        this.renderer = renderer;
        this.githubToken = sessionStorage.getItem('sync_github_token') || '';
        try { localStorage.removeItem('sync_github_token'); } catch (e) {}
        this.gistId = localStorage.getItem('sync_gist_id') || '';
        this.password = '';
        this.lastSync = localStorage.getItem('sync_last_timestamp') || null;

        this.tokenInput = document.getElementById('sync-token-input');
        this.gistInput = document.getElementById('sync-gist-input');
        this.passInput = document.getElementById('sync-pass-input');
        this.pushBtn = document.getElementById('sync-push-btn');
        this.pullBtn = document.getElementById('sync-pull-btn');
        this.statusEl = document.getElementById('sync-status-msg');
    }

    init() {
        this.syncUI();
        this.bindEvents();
    }

    syncUI() {
        if (this.tokenInput) this.tokenInput.value = this.githubToken;
        if (this.gistInput) this.gistInput.value = this.gistId;
        this.updateStatus(this.lastSync ? `Última sincronización: ${new Date(parseInt(this.lastSync)).toLocaleString()}` : 'No conectado');
    }

    updateStatus(msg, isError = false) {
        if (!this.statusEl) return;
        this.statusEl.textContent = msg;
        this.statusEl.className = `sync-status-msg ${isError ? 'error' : 'success'}`;
    }

    async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            enc.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encryptData(plainText, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);
        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(plainText)
        );

        const payload = {
            salt: Array.from(salt),
            iv: Array.from(iv),
            cipher: Array.from(new Uint8Array(encrypted))
        };
        return JSON.stringify(payload);
    }

    async decryptData(cipherJsonStr, password) {
        const payload = JSON.parse(cipherJsonStr);
        const salt = new Uint8Array(payload.salt);
        const iv = new Uint8Array(payload.iv);
        const cipher = new Uint8Array(payload.cipher);
        const key = await this.deriveKey(password, salt);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            cipher
        );
        const dec = new TextDecoder();
        return dec.decode(decrypted);
    }

    getPackagePayload() {
        return {
            version: '1.0.0-rc-1',
            timestamp: Date.now(),
            shortcuts: state.shortcuts,
            categories: state.categories,
            canvasPositions: readJsonStorage('canvas_positions_v1', {}),
            postits: readJsonStorage('glass_postits_v1', []),
            customMacros: readJsonStorage('custom_macros_v1', {}),
            userName: state.userName,
            theme: state.theme,
            soundEnabled: state.soundEnabled,
            soundPreset: soundFx.preset,
            language: state.language,
            showShortcutTags: state.showShortcutTags,
            showChromeBezel: state.showChromeBezel
        };
    }

    applyPackagePayload(data) {
        if (data.shortcuts) state.saveShortcuts(data.shortcuts);
        if (data.categories) state.saveCategories(data.categories);
        if (data.canvasPositions) localStorage.setItem('canvas_positions_v1', JSON.stringify(data.canvasPositions));
        if (data.postits) localStorage.setItem('glass_postits_v1', JSON.stringify(data.postits));
        if (data.customMacros) localStorage.setItem('custom_macros_v1', JSON.stringify(data.customMacros));
        if (data.userName) state.setUserName(data.userName);
        if (data.theme) state.setTheme(data.theme);
        if (typeof data.soundEnabled === 'boolean') state.setSoundEnabled(data.soundEnabled);
        if (typeof data.showShortcutTags === 'boolean') state.setShowShortcutTags(data.showShortcutTags);
        if (typeof data.showChromeBezel === 'boolean') state.setShowChromeBezel(data.showChromeBezel);
        if (data.language) state.setLanguage(data.language);

        this.lastSync = Date.now().toString();
        localStorage.setItem('sync_last_timestamp', this.lastSync);
        this.updateStatus(`✓ Sincronizado con éxito (${new Date().toLocaleTimeString()})`);
        if (this.renderer) this.renderer.render();
    }

    async pushToGist() {
        const token = (this.tokenInput ? this.tokenInput.value : this.githubToken).trim();
        const pass = (this.passInput ? this.passInput.value : '').trim();
        if (!token || !pass) {
            this.updateStatus('Introduce tu GitHub Token y Contraseña de Cifrado.', true);
            return;
        }

        soundFx.play('click');
        this.updateStatus('Cifrando datos y subiendo a GitHub...');

        try {
            const rawData = JSON.stringify(this.getPackagePayload());
            const encrypted = await this.encryptData(rawData, pass);
            let gistId = (this.gistInput ? this.gistInput.value : this.gistId).trim();

            const gistPayload = {
                description: 'HaDeS Shortcuts E2EE Encrypted Backup',
                public: false,
                files: { 'hades-sync.enc': { content: encrypted } }
            };

            let url = 'https://api.github.com/gists';
            let method = 'POST';
            if (gistId) {
                url += `/${gistId}`;
                method = 'PATCH';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistPayload)
            });

            if (!res.ok) throw new Error(`GitHub API Error: ${res.status}`);
            const resData = await res.json();

            this.gistId = resData.id;
            this.githubToken = token;
            sessionStorage.setItem('sync_github_token', token);
            localStorage.removeItem('sync_github_token');
            localStorage.setItem('sync_gist_id', resData.id);
            if (this.gistInput) this.gistInput.value = resData.id;

            this.lastSync = Date.now().toString();
            localStorage.setItem('sync_last_timestamp', this.lastSync);
            soundFx.play('chime');
            this.updateStatus(`✓ Datos subidos y cifrados en Gist (${resData.id.slice(0, 8)}...)`);
        } catch (err) {
            this.updateStatus(`Error al subir: ${err.message}`, true);
        }
    }

    async pullFromGist() {
        const token = (this.tokenInput ? this.tokenInput.value : this.githubToken).trim();
        const gistId = (this.gistInput ? this.gistInput.value : this.gistId).trim();
        const pass = (this.passInput ? this.passInput.value : '').trim();

        if (!token || !gistId || !pass) {
            this.updateStatus('Introduce Token, Gist ID y Contraseña de Cifrado.', true);
            return;
        }

        soundFx.play('click');
        this.updateStatus('Descargando y descifrando datos...');

        try {
            const res = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github+json'
                }
            });
            if (!res.ok) throw new Error(`Gist no encontrado (${res.status})`);
            const gistData = await res.json();
            const fileObj = gistData.files['hades-sync.enc'];
            if (!fileObj || !fileObj.content) throw new Error('Archivo de respaldo no encontrado en el Gist');

            const decryptedStr = await this.decryptData(fileObj.content, pass);
            const parsed = JSON.parse(decryptedStr);
            this.applyPackagePayload(parsed);
            soundFx.play('chime');
        } catch (err) {
            this.updateStatus(`Error al restaurar: ${err && err.message ? err.message : 'contraseña o datos no válidos'}`, true);
            showToast('No se pudo restaurar el Gist.', 'error');
        }
    }

    bindEvents() {
        if (this.pushBtn) this.pushBtn.addEventListener('click', () => this.pushToGist());
        if (this.pullBtn) this.pullBtn.addEventListener('click', () => this.pullFromGist());
    }
}
