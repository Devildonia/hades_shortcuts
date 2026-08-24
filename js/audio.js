// js/audio.js - Procedural Web Audio API Sound Synthesizer (0 KB, Zero Latency)

import { state } from './state.js';

export class AudioSynthesizer {
    constructor() {
        this.ctx = null;
        this.preset = localStorage.getItem('sound_preset') || 'scifi';
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

    setPreset(preset) {
        this.preset = preset;
        localStorage.setItem('sound_preset', preset);
    }

    play(type = 'hover') {
        if (!state.soundEnabled) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'hover') {
            if (this.preset === 'scifi') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(980, now + 0.05);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (this.preset === 'mech') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(280, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
                osc.start(now);
                osc.stop(now + 0.03);
            } else {
                // bubble
                osc.type = 'sine';
                osc.frequency.setValueAtTime(700, now);
                osc.frequency.exponentialRampToValueAtTime(1400, now + 0.06);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
                osc.start(now);
                osc.stop(now + 0.06);
            }
        } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.07);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.start(now);
            osc.stop(now + 0.07);
        } else if (type === 'chime') {
            this.playTone(523.25, 0.4, 0.25, 0);   // C5
            this.playTone(659.25, 0.5, 0.25, 0.1); // E5
            this.playTone(783.99, 0.7, 0.3, 0.2);  // G5
        }
    }

    playTone(freq, duration, volume, delay = 0) {
        const ctx = this.getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }
}

export const soundFx = new AudioSynthesizer();
