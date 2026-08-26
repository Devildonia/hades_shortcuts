// js/ambient-audio.js - Procedural Web Audio API Ambient Focus Generator (0 KB, 100% Offline)

import { soundFx } from './audio.js';

export class AmbientSoundEngine {
    constructor() {
        this.ctx = null;
        this.currentPreset = localStorage.getItem('ambient_preset_v1') || 'rain';
        this.volume = parseFloat(localStorage.getItem('ambient_volume_v1') || '0.5');
        this.isPlaying = false;
        this.activeNodes = [];
        this.masterGain = null;

        this.card = document.getElementById('widget-ambient-card');
        this.playBtn = document.getElementById('ambient-play-btn');
        this.playText = document.getElementById('ambient-play-text');
        this.chips = document.querySelectorAll('.ambient-chip');
        this.slider = document.getElementById('ambient-volume-slider');
        this.volDisplay = document.getElementById('ambient-vol-val');
    }

    init() {
        this.syncUI();
        this.bindEvents();
    }

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    syncUI() {
        if (this.slider) this.slider.value = Math.round(this.volume * 100);
        if (this.volDisplay) this.volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
        if (this.chips) {
            this.chips.forEach(chip => {
                chip.classList.toggle('active', chip.getAttribute('data-preset') === this.currentPreset);
            });
        }
        this.updatePlayBtnVisuals();
    }

    updatePlayBtnVisuals() {
        if (this.playBtn) this.playBtn.classList.toggle('is-playing', this.isPlaying);
        if (this.playText) this.playText.textContent = this.isPlaying ? 'Pausar' : 'Reproducir';
        if (this.card) this.card.classList.toggle('is-playing', this.isPlaying);
    }

    setPreset(preset) {
        soundFx.play('click');
        this.currentPreset = preset;
        localStorage.setItem('ambient_preset_v1', preset);
        this.syncUI();
        if (this.isPlaying) {
            this.stopNodes();
            this.startPreset(preset);
        }
    }

    setVolume(volFloat) {
        this.volume = Math.max(0, Math.min(1, volFloat));
        localStorage.setItem('ambient_volume_v1', this.volume.toString());
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
        }
        if (this.volDisplay) this.volDisplay.textContent = `${Math.round(this.volume * 100)}%`;
    }

    toggle() {
        soundFx.play('click');
        this.isPlaying ? this.stop() : this.play();
    }

    play() {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        this.stopNodes();
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(this.volume, ctx.currentTime + 0.3);
        this.masterGain.connect(ctx.destination);

        this.startPreset(this.currentPreset);
        this.isPlaying = true;
        this.updatePlayBtnVisuals();
    }

    stop() {
        if (!this.isPlaying) return;
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            setTimeout(() => {
                this.stopNodes();
                this.isPlaying = false;
                this.updatePlayBtnVisuals();
            }, 350);
        } else {
            this.stopNodes();
            this.isPlaying = false;
            this.updatePlayBtnVisuals();
        }
    }

    stopNodes() {
        this.activeNodes.forEach(node => {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (e) {}
        });
        this.activeNodes = [];
    }

    startPreset(preset) {
        const ctx = this.getAudioContext();
        if (!ctx || !this.masterGain) return;
        if (preset === 'rain') this.buildRain(ctx);
        else if (preset === 'space') this.buildSpace(ctx);
        else if (preset === 'binaural') this.buildBinaural(ctx);
        else if (preset === 'waves') this.buildWaves(ctx);
    }

    buildRain(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, ctx.currentTime);

        noise.connect(filter);
        filter.connect(this.masterGain);
        noise.start();
        this.activeNodes.push(noise, filter);
    }

    buildSpace(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < data.length; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const brown = ctx.createBufferSource();
        brown.buffer = buf;
        brown.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, ctx.currentTime);

        brown.connect(filter);
        filter.connect(this.masterGain);
        brown.start();
        this.activeNodes.push(brown, filter);
    }

    buildBinaural(ctx) {
        const oscL = ctx.createOscillator(), oscR = ctx.createOscillator();
        oscL.type = 'sine'; oscR.type = 'sine';
        oscL.frequency.setValueAtTime(432, ctx.currentTime);
        oscR.frequency.setValueAtTime(440, ctx.currentTime);

        const panL = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
        const panR = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
        if (panL.pan) panL.pan.setValueAtTime(-0.8, ctx.currentTime);
        if (panR.pan) panR.pan.setValueAtTime(0.8, ctx.currentTime);

        const gainL = ctx.createGain(), gainR = ctx.createGain();
        gainL.gain.setValueAtTime(0.18, ctx.currentTime);
        gainR.gain.setValueAtTime(0.18, ctx.currentTime);

        oscL.connect(gainL); gainL.connect(panL); panL.connect(this.masterGain);
        oscR.connect(gainR); gainR.connect(panR); panR.connect(this.masterGain);
        oscL.start(); oscR.start();

        this.activeNodes.push(oscL, oscR, gainL, gainR, panL, panR);
    }

    buildWaves(ctx) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < data.length; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179;
            b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520;
            data[i] = (b0 + b1 + b2) * 0.7;
        }

        const pink = ctx.createBufferSource();
        pink.buffer = buf;
        pink.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.1, ctx.currentTime);

        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(250, ctx.currentTime);
        filter.frequency.setValueAtTime(350, ctx.currentTime);

        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        pink.connect(filter);
        filter.connect(this.masterGain);
        pink.start();
        lfo.start();

        this.activeNodes.push(pink, filter, lfo, lfoGain);
    }

    bindEvents() {
        if (this.playBtn) this.playBtn.addEventListener('click', () => this.toggle());
        if (this.chips) {
            this.chips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const preset = chip.getAttribute('data-preset');
                    if (preset) this.setPreset(preset);
                });
            });
        }
        if (this.slider) {
            this.slider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value, 10) / 100);
            });
        }
    }
}

export const ambientAudio = new AmbientSoundEngine();
