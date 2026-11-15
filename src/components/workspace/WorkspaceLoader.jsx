import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TwinLabMark } from "../common/TwinLabLogo";
import "./WorkspaceLoader.css";

const TELEMETRY_PHASES = [
    { text: "CALIBRATING SPICE MATRIX SOLVER...", pct: 30 },
    { text: "INITIALIZING VIRTUAL MCU FABRIC...", pct: 65 },
    { text: "SYNCHRONIZING DIGITAL TWIN THREADS...", pct: 90 },
    { text: "DIGITAL TWIN ONLINE // READY", pct: 100 }
];

export default function WorkspaceLoader({ onComplete, duration = 950, projectName = "DIGITAL TWIN WORKSPACE" }) {
    const [phaseIdx, setPhaseIdx] = useState(0);
    const [progress, setProgress] = useState(15);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const stepTime = Math.max(140, Math.floor(duration / TELEMETRY_PHASES.length));

        const interval = setInterval(() => {
            setPhaseIdx((prev) => {
                const next = prev + 1;
                if (next < TELEMETRY_PHASES.length) {
                    setProgress(TELEMETRY_PHASES[next].pct);
                    return next;
                } else {
                    clearInterval(interval);
                    setProgress(100);
                    setTimeout(() => {
                        setIsExiting(true);
                        setTimeout(() => {
                            if (onComplete) onComplete();
                        }, 350);
                    }, 200);
                    return prev;
                }
            });
        }, stepTime);

        return () => clearInterval(interval);
    }, [duration, onComplete]);

    const currentPhase = TELEMETRY_PHASES[Math.min(phaseIdx, TELEMETRY_PHASES.length - 1)];

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div 
                    className="workspace-futuristic-loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Background Cyber Blueprint Grid & Vignette */}
                    <div className="ws-loader-grid" />
                    <div className="ws-loader-vignette" />

                    {/* Minimalist Futuristic Corner Crosshairs */}
                    <div className="ws-corner-cross tl font-mono">+ SYS // TWINLAB-X</div>
                    <div className="ws-corner-cross tr font-mono">40.00 MHz +</div>
                    <div className="ws-corner-cross bl font-mono">+ SPICE // REALTIME</div>
                    <div className="ws-corner-cross br font-mono">MCU BUS READY +</div>

                    {/* Centered Cool, Simple Cybernetic Core */}
                    <div className="ws-loader-center-box">
                        {/* Rotating Orbital Reticle Ring */}
                        <div className="ws-holo-ring-container">
                            <svg className="ws-holo-svg-outer" viewBox="0 0 160 160">
                                <circle 
                                    cx="80" cy="80" r="74" 
                                    fill="none" 
                                    stroke="rgba(56, 189, 248, 0.18)" 
                                    strokeWidth="1" 
                                    strokeDasharray="4 8"
                                />
                                <circle 
                                    cx="80" cy="80" r="66" 
                                    fill="none" 
                                    stroke="#38bdf8" 
                                    strokeWidth="1.5" 
                                    strokeDasharray="36 90"
                                    strokeLinecap="round"
                                />
                                <circle 
                                    cx="80" cy="80" r="66" 
                                    fill="none" 
                                    stroke="#ff8a00" 
                                    strokeWidth="1.5" 
                                    strokeDasharray="24 100"
                                    strokeDashoffset="60"
                                    strokeLinecap="round"
                                />
                            </svg>

                            <svg className="ws-holo-svg-inner" viewBox="0 0 120 120">
                                <circle 
                                    cx="60" cy="60" r="50" 
                                    fill="none" 
                                    stroke="rgba(255, 138, 0, 0.3)" 
                                    strokeWidth="1" 
                                    strokeDasharray="2 6"
                                />
                                <circle 
                                    cx="60" cy="60" r="42" 
                                    fill="none" 
                                    stroke="rgba(56, 189, 248, 0.5)" 
                                    strokeWidth="1.2" 
                                    strokeDasharray="14 36"
                                />
                            </svg>

                            {/* Core Logo Mark */}
                            <div className="ws-holo-core">
                                <div className="ws-core-energy-aura" />
                                <TwinLabMark size={50} />
                            </div>
                        </div>

                        {/* Title & Project Target */}
                        <div className="ws-loader-title-box">
                            <h2 className="ws-loader-title">
                                <span className="brand-twin">Twin</span>
                                <span className="brand-lab">Lab</span>
                                <span className="brand-x">X</span>
                            </h2>
                            <div className="ws-loader-subtitle font-mono">
                                <span>{projectName}</span>
                            </div>
                        </div>

                        {/* Minimal Sleek Neon Telemetry Bar */}
                        <div className="ws-loader-progress-wrap">
                            <div className="ws-progress-track">
                                <div 
                                    className="ws-progress-neon-bar" 
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            {/* Live Monospaced Telemetry */}
                            <div className="ws-progress-metric font-mono">
                                <span className="ws-metric-dot" />
                                <span className="ws-metric-text">{currentPhase.text}</span>
                                <span className="ws-metric-val">{progress}%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
