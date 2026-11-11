// Web Audio API manager for Piezo Buzzers & Electric DC Motors
class SoundManager {
    constructor() {
        this.ctx = null;
        this.activeBuzzers = new Map();
        this.activeMotors = new Map();
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

    /**
     * Synthesize authentic electric DC motor sound with realistic spin-up inertia pitch ramp
     */
    startMotorSound(id, { type = "motor-dc", rpm = 12500, voltage = 6.0 } = {}) {
        if (this.activeMotors.has(id)) {
            this.updateMotorSound(id, { rpm, voltage });
            return;
        }

        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const now = ctx.currentTime;
            const isGeared = type === "motor-geared" || type === "motor-bo";

            // Target running frequency based on motor mechanics
            const targetFreq = isGeared 
                ? Math.min(260, Math.max(110, 120 + ((rpm || 200) / 220) * 110))
                : Math.min(520, Math.max(90, ((rpm || 12500) / 12500) * 310));

            // 1. Primary rotor / gear commutator oscillator
            const osc = ctx.createOscillator();
            osc.type = isGeared ? "sawtooth" : "triangle";
            // Start low (slow spin-up) and ramp up smoothly to target frequency
            osc.frequency.setValueAtTime(isGeared ? 65 : 75, now);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, targetFreq), now + 0.85);

            // 2. Sub-harmonic body hum for mechanical weight
            const subOsc = ctx.createOscillator();
            subOsc.type = "sine";
            subOsc.frequency.setValueAtTime(isGeared ? 35 : 45, now);
            subOsc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq * 0.5), now + 0.85);

            // 3. Lowpass acoustic filter (softens harsh square harmonics into realistic metallic purr)
            const filter = ctx.createBiquadFilter();
            filter.type = "lowpass";
            filter.frequency.setValueAtTime(isGeared ? 550 : 850, now);
            filter.Q.setValueAtTime(isGeared ? 2.5 : 1.8, now);

            // 4. Smooth Gain Envelope (gradual spin-up volume, pleasant levels)
            const targetGain = isGeared ? 0.032 : 0.038;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(targetGain, now + 0.6);

            // Connect graph
            osc.connect(filter);
            subOsc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            subOsc.start(now);

            this.activeMotors.set(id, { osc, subOsc, filter, gain, targetGain, isGeared });
        } catch {
            // Audio policy blocked
        }
    }

    /**
     * Dynamically update motor sound pitch with RPM changes
     */
    updateMotorSound(id, { rpm = 12500, voltage = 6.0 } = {}) {
        const motor = this.activeMotors.get(id);
        if (!motor || !this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const targetFreq = motor.isGeared 
                ? Math.min(260, Math.max(110, 120 + ((rpm || 200) / 220) * 110))
                : Math.min(520, Math.max(90, ((rpm || 12500) / 12500) * 310));

            motor.osc.frequency.cancelScheduledValues(now);
            motor.osc.frequency.exponentialRampToValueAtTime(Math.max(20, targetFreq), now + 0.35);

            motor.subOsc.frequency.cancelScheduledValues(now);
            motor.subOsc.frequency.exponentialRampToValueAtTime(Math.max(10, targetFreq * 0.5), now + 0.35);
        } catch {}
    }

    /**
     * Stop motor sound with realistic spin-down coasting deceleration
     */
    stopMotorSound(id) {
        const motor = this.activeMotors.get(id);
        if (!motor) return;

        try {
            if (this.ctx) {
                const now = this.ctx.currentTime;
                // Spin-down coasting pitch glide
                motor.osc.frequency.cancelScheduledValues(now);
                motor.osc.frequency.exponentialRampToValueAtTime(30, now + 0.7);

                motor.gain.gain.cancelScheduledValues(now);
                motor.gain.gain.linearRampToValueAtTime(0.0001, now + 0.75);

                setTimeout(() => {
                    try {
                        motor.osc.stop();
                        motor.subOsc.stop();
                        motor.osc.disconnect();
                        motor.subOsc.disconnect();
                        motor.filter.disconnect();
                        motor.gain.disconnect();
                    } catch {}
                }, 800);
            }
        } catch {}

        this.activeMotors.delete(id);
    }

    stopAll() {
        this.activeBuzzers.forEach((_, id) => this.stopBuzzer(id));
        this.activeMotors.forEach((_, id) => this.stopMotorSound(id));
    }
}

export const soundManager = new SoundManager();
