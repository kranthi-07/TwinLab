// Web Audio API manager for Piezo Buzzer
class SoundManager {
    constructor() {
        this.ctx = null;
        this.activeBuzzers = new Map();
    }

    getAudioContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    startBuzzer(id, frequency = 880) {
        if (this.activeBuzzers.has(id)) return;
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = "square";
            osc.frequency.setValueAtTime(frequency, ctx.currentTime);

            // Safe, pleasant low volume so it doesn't disturb users
            gain.gain.setValueAtTime(0.04, ctx.currentTime);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            this.activeBuzzers.set(id, { osc, gain });
        } catch {
            // Audio context policy blocked or unavailable
        }
    }

    stopBuzzer(id) {
        const buzzer = this.activeBuzzers.get(id);
        if (buzzer) {
            try {
                buzzer.osc.stop();
                buzzer.osc.disconnect();
                buzzer.gain.disconnect();
            } catch {}
            this.activeBuzzers.delete(id);
        }
    }

    stopAll() {
        this.activeBuzzers.forEach((_, id) => this.stopBuzzer(id));
    }
}

export const soundManager = new SoundManager();
