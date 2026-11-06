import "./RightSidebar.css";
import { useState, useRef, useEffect } from "react";
import breadboardImg from "../../../assets/twinlab/breadboard.webp";
import { Component3DThumbnail } from "../SearchModal/ComponentSearchModal";

// ============================================================
// VISUAL INSTRUMENT & COMPONENT ILLUSTRATION IMAGES
// ============================================================

function MultimeterIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Dark Bench Background */}
            <rect width="280" height="84" rx="8" fill="#090d16" />
            <path d="M 0 42 L 280 42" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            
            {/* Multimeter Body Case (Yellow Rubber Holster) */}
            <rect x="70" y="8" width="56" height="68" rx="6" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            
            {/* LCD Screen */}
            <rect x="76" y="14" width="44" height="20" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <rect x="78" y="16" width="40" height="16" rx="2" fill="#14281d" />
            <text x="82" y="27" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">9.00 V</text>
            <text x="108" y="22" fill="#4ade80" fontSize="5" fontFamily="sans-serif">AUTO</text>

            {/* Rotary Dial */}
            <circle cx="98" cy="46" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <line x1="98" y1="46" x2="98" y2="40" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />

            {/* Banana Jacks */}
            <circle cx="86" cy="64" r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <circle cx="110" cy="64" r="2.5" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />

            {/* Flexible Probe Cables */}
            <path d="M 110 66 C 120 78, 145 74, 160 52" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 86 66 C 75 78, 45 74, 30 52" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Red Test Probe Pen */}
            <g transform="translate(160, 24) rotate(25)">
                <rect x="-3" y="10" width="6" height="22" rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </g>

            {/* Black Test Probe Pen */}
            <g transform="translate(30, 24) rotate(-25)">
                <rect x="-3" y="10" width="6" height="22" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </g>

            {/* Spec Badge */}
            <rect x="180" y="24" width="86" height="36" rx="4" fill="rgba(234, 179, 8, 0.08)" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="1" />
            <text x="188" y="38" fill="#facc15" fontSize="8" fontWeight="bold">DMM • True RMS</text>
            <text x="188" y="50" fill="#94a3b8" fontSize="7">0 - 500V DC • 10MΩ</text>
        </svg>
    );
}

function OscilloscopeIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Background Case */}
            <rect width="280" height="84" rx="8" fill="#090d16" />

            {/* CRT Screen Display */}
            <rect x="12" y="10" width="130" height="64" rx="5" fill="#02120e" stroke="#043226" strokeWidth="1.5" />
            
            {/* CRT Grid lines */}
            <path d="M 12 26 L 142 26 M 12 42 L 142 42 M 12 58 L 142 58" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.8" />
            <path d="M 44 10 L 44 74 M 77 10 L 77 74 M 110 10 L 110 74" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.8" />

            {/* CH1 Waveform (Amber Sine Wave) */}
            <path d="M 14 36 Q 30 18, 45 36 T 77 36 T 109 36 T 140 36" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            
            {/* CH2 Waveform (Cyan Pulse Wave) */}
            <path d="M 14 54 H 28 V 46 H 50 V 54 H 74 V 46 H 96 V 54 H 120 V 46 H 140" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* On-Screen Status */}
            <text x="18" y="21" fill="#34d399" fontSize="6.5" fontFamily="monospace" fontWeight="bold">● RUN</text>
            <text x="96" y="21" fill="#facc15" fontSize="6.5" fontFamily="monospace">1.00 kHz</text>

            {/* Oscilloscope Hardware Bench Controls */}
            <g transform="translate(154, 12)">
                {/* Knob 1 */}
                <circle cx="20" cy="18" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <line x1="20" y1="18" x2="25" y2="13" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                <text x="10" y="34" fill="#94a3b8" fontSize="6">TIME/DIV</text>

                {/* Knob 2 */}
                <circle cx="64" cy="18" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <line x1="64" y1="18" x2="68" y2="23" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <text x="54" y="34" fill="#94a3b8" fontSize="6">VOLTS/DIV</text>

                {/* Channel Jack BNC Connectors */}
                <circle cx="20" cy="48" r="5" fill="#334155" stroke="#facc15" strokeWidth="1.2" />
                <circle cx="64" cy="48" r="5" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="14" y="58" fill="#facc15" fontSize="5.5" fontWeight="bold">CH1</text>
                <text x="58" y="58" fill="#38bdf8" fontSize="5.5" fontWeight="bold">CH2</text>
            </g>
        </svg>
    );
}

function SerialMonitorIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Terminal Window Case */}
            <rect width="280" height="84" rx="8" fill="#070a13" stroke="#1e293b" strokeWidth="1.2" />

            {/* Window Title Bar */}
            <rect width="280" height="22" rx="8" fill="#0f172a" />
            <circle cx="16" cy="11" r="3" fill="#ef4444" />
            <circle cx="26" cy="11" r="3" fill="#f59e0b" />
            <circle cx="36" cy="11" r="3" fill="#10b981" />
            <text x="52" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">UART Serial Monitor • COM3 (115200 baud)</text>

            {/* Terminal Monospace Logs */}
            <text x="14" y="36" fill="#34d399" fontSize="7" fontFamily="monospace">&gt; [0.00s] Firmware initialized (16MHz ATmega328P)</text>
            <text x="14" y="48" fill="#38bdf8" fontSize="7" fontFamily="monospace">&gt; [0.05s] Serial.begin(115200); [SUCCESS]</text>
            <text x="14" y="60" fill="#e2e8f0" fontSize="7" fontFamily="monospace">&gt; [1.20s] ADC Channel A0 reading = 1023 (5.00V)</text>
            <text x="14" y="72" fill="#facc15" fontSize="7" fontFamily="monospace">&gt; [2.40s] Ready for commands _</text>
        </svg>
    );
}

// 3D Realistic Component Preview Artwork for the Inspector Tab
function ComponentPreviewArtwork({ component }) {
    if (!component) return null;

    const t = component.type || "";

    if (t.startsWith("breadboard")) {
        const isMini = t === "breadboard-mini";
        const isFull = t === "breadboard-full";
        return (
            <svg viewBox="0 0 240 100" className="inspector-svg-artwork">
                <defs>
                    <radialGradient id="insp-hole-depth" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#2a3547" />
                        <stop offset="100%" stopColor="#0b0e14" />
                    </radialGradient>
                    <linearGradient id="insp-bb-body" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="10%" stopColor={component.color || "#f8fafc"} />
                        <stop offset="90%" stopColor={component.color || "#e2e8f0"} />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                </defs>
                {/* 3D Drop Shadow */}
                <rect x="14" y="14" width="212" height="76" rx="8" fill="rgba(0,0,0,0.4)" filter="blur(4px)" />
                {/* Main Body */}
                <rect x="12" y="10" width="216" height="74" rx="8" fill="url(#insp-bb-body)" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Bevel highlight */}
                <rect x="14" y="12" width="212" height="70" rx="6" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1" />
                {/* Power Rails (if not mini) */}
                {!isMini && (
                    <>
                        <line x1="20" y1="18" x2="220" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="20" y1="24" x2="220" y2="24" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="20" y1="70" x2="220" y2="70" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                        <line x1="20" y1="76" x2="220" y2="76" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                )}
                {/* Center Channel Trench */}
                <rect x="18" y="44" width="204" height="6" rx="2" fill="#cbd5e1" />
                {/* Grid Tie Holes Matrix */}
                {Array.from({ length: 18 }).map((_, col) => (
                    <g key={col} transform={`translate(${24 + col * 11}, 0)`}>
                        <rect x="0" y="32" width="3" height="3" rx="0.5" fill="url(#insp-hole-depth)" />
                        <rect x="0" y="38" width="3" height="3" rx="0.5" fill="url(#insp-hole-depth)" />
                        <rect x="0" y="53" width="3" height="3" rx="0.5" fill="url(#insp-hole-depth)" />
                        <rect x="0" y="59" width="3" height="3" rx="0.5" fill="url(#insp-hole-depth)" />
                    </g>
                ))}
            </svg>
        );
    }

    if (t === "resistor") {
        return (
            <svg viewBox="0 0 220 80" className="inspector-svg-artwork">
                <defs>
                    <linearGradient id="insp-lead-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    <linearGradient id="insp-res-body" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fde68a" />
                        <stop offset="25%" stopColor="#d97706" />
                        <stop offset="85%" stopColor="#b45309" />
                        <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                </defs>
                {/* Shadow */}
                <ellipse cx="110" cy="54" rx="70" ry="8" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
                {/* Axial Leads */}
                <rect x="15" y="38" width="55" height="4" rx="2" fill="url(#insp-lead-grad)" />
                <rect x="150" y="38" width="55" height="4" rx="2" fill="url(#insp-lead-grad)" />
                {/* Resistor Body with 3D Contour */}
                <rect x="65" y="24" width="90" height="32" rx="10" fill="url(#insp-res-body)" stroke="#92400e" strokeWidth="1" />
                <rect x="70" y="22" width="16" height="36" rx="8" fill="url(#insp-res-body)" />
                <rect x="134" y="22" width="16" height="36" rx="8" fill="url(#insp-res-body)" />
                {/* Specular Highlight Strip */}
                <rect x="70" y="27" width="80" height="3" rx="1.5" fill="rgba(255,255,255,0.45)" />
                {/* Color Bands */}
                <rect x="80" y="22" width="7" height="36" fill="#dc2626" />
                <rect x="94" y="24" width="7" height="32" fill="#dc2626" />
                <rect x="108" y="24" width="7" height="32" fill="#78350f" />
                <rect x="128" y="22" width="7" height="36" fill="#fbbf24" />
            </svg>
        );
    }

    if (t === "led") {
        const ledCol = component.color || "#ef4444";
        return (
            <svg viewBox="0 0 160 100" className="inspector-svg-artwork">
                <defs>
                    <radialGradient id="insp-led-dome-glow" cx="40%" cy="30%" r="65%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="35%" stopColor={ledCol} />
                        <stop offset="85%" stopColor={ledCol} />
                        <stop offset="100%" stopColor="#000000" />
                    </radialGradient>
                    <filter id="insp-led-glow" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={ledCol} floodOpacity="0.7" />
                    </filter>
                </defs>
                {/* Shadow */}
                <ellipse cx="80" cy="85" rx="25" ry="6" fill="rgba(0,0,0,0.4)" filter="blur(3px)" />
                {/* Anode & Cathode Leads */}
                <rect x="72" y="62" width="4" height="28" rx="1" fill="#94a3b8" />
                <rect x="84" y="62" width="4" height="24" rx="1" fill="#cbd5e1" />
                {/* LED Base Flange / Collar */}
                <rect x="62" y="56" width="36" height="8" rx="2" fill={ledCol} filter="brightness(0.7)" />
                {/* Dome with Specular Highlight and Outer Glow */}
                <path d="M 64 56 C 64 18, 96 18, 96 56 Z" fill="url(#insp-led-dome-glow)" filter="url(#insp-led-glow)" />
                {/* Specular Glint */}
                <ellipse cx="74" cy="32" rx="4" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(-20 74 32)" />
            </svg>
        );
    }

    if (t === "battery-9v") {
        return (
            <svg viewBox="0 0 160 100" className="inspector-svg-artwork">
                <defs>
                    <linearGradient id="insp-bat-jacket" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="20%" stopColor="#1e293b" />
                        <stop offset="60%" stopColor="#334155" />
                        <stop offset="100%" stopColor="#090d16" />
                    </linearGradient>
                    <linearGradient id="insp-copper-top" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#9a3412" />
                        <stop offset="50%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#7c2d12" />
                    </linearGradient>
                </defs>
                {/* Shadow */}
                <ellipse cx="80" cy="88" rx="36" ry="7" fill="rgba(0,0,0,0.5)" filter="blur(3px)" />
                {/* Terminal Snaps */}
                <rect x="62" y="12" width="10" height="8" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                <circle cx="95" cy="16" r="6" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <circle cx="95" cy="16" r="2.5" fill="#1e293b" />
                {/* Battery Copper Shoulder */}
                <rect x="52" y="18" width="56" height="16" rx="3" fill="url(#insp-copper-top)" />
                {/* Battery Main Body */}
                <rect x="52" y="32" width="56" height="52" rx="4" fill="url(#insp-bat-jacket)" stroke="#334155" strokeWidth="1" />
                {/* 9V Emblem */}
                <rect x="64" y="44" width="32" height="20" rx="3" fill="#10b981" />
                <text x="80" y="58" fill="#ffffff" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">9V</text>
                <text x="80" y="76" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ALKALINE</text>
            </svg>
        );
    }

    if (t === "capacitor-ceramic") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <defs>
                    <radialGradient id="insp-cap-disc" cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#fdba74" />
                        <stop offset="40%" stopColor="#ea580c" />
                        <stop offset="85%" stopColor="#c2410c" />
                        <stop offset="100%" stopColor="#7c2d12" />
                    </radialGradient>
                </defs>
                {/* Leads */}
                <line x1="72" y1="46" x2="72" y2="82" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="88" y1="46" x2="88" y2="82" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                {/* Ceramic Disc Body */}
                <circle cx="80" cy="36" r="26" fill="url(#insp-cap-disc)" stroke="#9a3412" strokeWidth="1" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))" />
                <text x="80" y="41" fill="#ffffff" fontSize="12" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">104</text>
                <text x="80" y="49" fill="rgba(255,255,255,0.7)" fontSize="6.5" textAnchor="middle">50V</text>
            </svg>
        );
    }

    if (t === "potentiometer") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <rect x="52" y="16" width="56" height="52" rx="8" fill="#0284c7" stroke="#0369a1" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                <circle cx="80" cy="42" r="18" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="80" cy="42" r="14" fill="#1e293b" />
                <line x1="80" y1="42" x2="88" y2="34" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                <circle cx="62" cy="74" r="3" fill="#94a3b8" />
                <circle cx="80" cy="74" r="3" fill="#94a3b8" />
                <circle cx="98" cy="74" r="3" fill="#94a3b8" />
            </svg>
        );
    }

    if (t === "buzzer") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <circle cx="80" cy="42" r="32" fill="#0f172a" stroke="#334155" strokeWidth="2" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                <circle cx="80" cy="42" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <circle cx="80" cy="42" r="4" fill="#050811" />
                <text x="96" y="32" fill="#ef4444" fontSize="14" fontWeight="bold">+</text>
                <line x1="72" y1="74" x2="72" y2="84" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="88" y1="74" x2="88" y2="84" stroke="#94a3b8" strokeWidth="2.5" />
            </svg>
        );
    }

    if (t === "button" || t === "pushbutton") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <rect x="52" y="18" width="56" height="52" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                <rect x="56" y="22" width="48" height="44" rx="4" fill="#0f172a" />
                <circle cx="80" cy="44" r="15" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="80" cy="44" r="11" fill="#475569" />
                {/* 4 Corner Pins */}
                <rect x="44" y="26" width="8" height="4" rx="1" fill="#cbd5e1" />
                <rect x="44" y="58" width="8" height="4" rx="1" fill="#cbd5e1" />
                <rect x="108" y="26" width="8" height="4" rx="1" fill="#cbd5e1" />
                <rect x="108" y="58" width="8" height="4" rx="1" fill="#cbd5e1" />
            </svg>
        );
    }

    if (t === "switch-spdt" || t === "slide-switch") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <rect x="46" y="26" width="68" height="36" rx="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.5))" />
                <rect x="54" y="32" width="52" height="24" rx="3" fill="#1e293b" />
                <rect x="56" y="28" width="20" height="32" rx="3" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                {/* 3 bottom pins */}
                <rect x="62" y="62" width="4" height="12" fill="#94a3b8" />
                <rect x="78" y="62" width="4" height="12" fill="#94a3b8" />
                <rect x="94" y="62" width="4" height="12" fill="#94a3b8" />
            </svg>
        );
    }

    if (t === "arduino-uno") {
        return (
            <svg viewBox="0 0 180 100" className="inspector-svg-artwork">
                <rect x="20" y="10" width="140" height="80" rx="8" fill="#0284c7" stroke="#0369a1" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.6))" />
                {/* Silver USB-B Port */}
                <rect x="14" y="18" width="26" height="22" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
                {/* Black DC Barrel Jack */}
                <rect x="14" y="58" width="30" height="24" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                {/* ATmega328P DIP-28 Chip */}
                <rect x="75" y="54" width="58" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="82" y="66" fill="#94a3b8" fontSize="7" fontFamily="monospace">ATmega328P</text>
                {/* Header Sockets */}
                <rect x="48" y="14" width="102" height="9" rx="1.5" fill="#1e293b" />
                <rect x="48" y="77" width="102" height="9" rx="1.5" fill="#1e293b" />
                <text x="52" y="42" fill="#ffffff" fontSize="11" fontWeight="800">ARDUINO UNO R3</text>
            </svg>
        );
    }

    if (t === "arduino-mega") {
        return (
            <svg viewBox="0 0 190 100" className="inspector-svg-artwork">
                <rect x="15" y="10" width="160" height="80" rx="8" fill="#0369a1" stroke="#075985" strokeWidth="2" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.6))" />
                <rect x="10" y="18" width="24" height="22" rx="3" fill="#cbd5e1" />
                <rect x="10" y="58" width="28" height="24" rx="3" fill="#0f172a" />
                <rect x="75" y="38" width="24" height="24" rx="2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <text x="77" y="52" fill="#94a3b8" fontSize="6" fontFamily="monospace">ATmega2560</text>
                <rect x="42" y="14" width="124" height="8" fill="#1e293b" />
                <rect x="42" y="78" width="124" height="8" fill="#1e293b" />
                <text x="46" y="34" fill="#ffffff" fontSize="10" fontWeight="bold">ARDUINO MEGA 2560</text>
            </svg>
        );
    }

    if (t === "arduino-nano") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                <rect x="44" y="10" width="72" height="70" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" filter="drop-shadow(0 6px 12px rgba(0,0,0,0.6))" />
                <rect x="62" y="8" width="36" height="14" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <rect x="58" y="32" width="44" height="24" rx="2" fill="#0f172a" />
                <text x="64" y="47" fill="#94a3b8" fontSize="7" fontFamily="monospace">ATmega328</text>
                <text x="80" y="68" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">NANO V3</text>
            </svg>
        );
    }

    if (t === "esp32" || t === "esp32-devkit" || t === "esp32-s3") {
        return (
            <svg viewBox="0 0 170 90" className="inspector-svg-artwork">
                <rect x="25" y="8" width="120" height="74" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.7))" />
                {/* Brushed Aluminum Shield */}
                <rect x="55" y="20" width="68" height="46" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="62" y="44" fill="#0f172a" fontSize="8.5" fontWeight="800">ESP-WROOM-32</text>
                <text x="62" y="54" fill="#475569" fontSize="6.5">2.4GHz Wi-Fi + BLE</text>
                {/* Gold PCB Antenna */}
                <rect x="123" y="26" width="14" height="34" rx="1" fill="#eab308" />
                {/* Dual Pin Headers */}
                <rect x="29" y="12" width="6" height="66" rx="1" fill="#1e293b" />
                <rect x="135" y="12" width="6" height="66" rx="1" fill="#1e293b" />
            </svg>
        );
    }

    if (t === "multimeter") {
        return <MultimeterIllustration />;
    }

    if (t === "oscilloscope") {
        return <OscilloscopeIllustration />;
    }

    // Generic fallback
    return (
        <div className="inspector-generic-icon">
            <i className="ri-cpu-line"></i>
        </div>
    );
}

// ============================================================
// MAIN RIGHT SIDEBAR COMPONENT
// ============================================================

function RightSidebar({
    onOpenOscilloscope,
    onOpenSerial,
    onOpenMultimeter,
    selectedComponent,
    components = [],
    onSelectComponent,
    onUpdateComponent,
    onDeleteComponent,
    onRotateComponent,
    onAddComponent,
    simulationResult
}) {
    const [activeTab, setActiveTab] = useState(null);
    const rightSidebarRef = useRef(null);

    // Close panel on outside click on the screen
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (rightSidebarRef.current && !rightSidebarRef.current.contains(e.target)) {
                setActiveTab(null);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const tabs = [
        {
            id: "instruments",
            title: "Instruments",
            icon: "ri-flask-line",
            color: "#FF8A00"
        },
        {
            id: "inspector",
            title: "Inspector",
            icon: "ri-focus-3-line",
            color: "#3B9CFF"
        },
        {
            id: "connections",
            title: "Connections",
            icon: "ri-node-tree",
            color: "#00D28F"
        },
        {
            id: "pinned",
            title: "Pinned",
            icon: "ri-pushpin-line",
            color: "#C779FF"
        }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab);

    const handleClick = (id) => {
        setActiveTab(activeTab === id ? null : id);
    };

    const handleOpenInst = (action) => {
        action && action();
        setActiveTab(null);
    };

    return (
        <aside 
            ref={rightSidebarRef}
            className={`right-sidebar ${activeTab ? "open" : ""}`}
            style={{ "--accent": currentTab?.color || "#FF8A00" }}
        >
            {/* =================================
                SIDEBAR EXPANDED PANEL
            ================================= */}
            <div className="right-panel">
                {currentTab && (
                    <>
                        <div className="right-panel-header">
                            <div className="right-panel-title">
                                <div className="right-heading-icon" style={{ color: currentTab.color }}>
                                    <i className={currentTab.icon}></i>
                                </div>
                                <div>
                                    <h3>{currentTab.title}</h3>
                                    <span>TwinLab Virtual Bench</span>
                                </div>
                            </div>
                            <button className="right-close" onClick={() => setActiveTab(null)} title="Close Panel">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="right-panel-content" key={activeTab}>
                            {/* 1. INSTRUMENTS TAB WITH REAL VISUAL PREVIEW IMAGES */}
                            {activeTab === "instruments" && (
                                <div className="instruments-gallery">
                                    {/* Voltmeter / DMM Card */}
                                    <div className="instrument-feature-card" onClick={() => handleOpenInst(onOpenMultimeter)}>
                                        <div className="instrument-art-container">
                                            <MultimeterIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>Digital Multimeter</strong>
                                                <span className="inst-badge badge-dmm">TL-890D</span>
                                            </div>
                                            <p>Precision DC Voltage, Current, Resistance & Continuity beeper.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn primary" onClick={(e) => { e.stopPropagation(); handleOpenInst(onOpenMultimeter); }}>
                                                    <i className="ri-dashboard-3-line"></i> Open Meter
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Oscilloscope Card */}
                                    <div className="instrument-feature-card" onClick={() => handleOpenInst(onOpenOscilloscope)}>
                                        <div className="instrument-art-container">
                                            <OscilloscopeIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>Dual-Trace Oscilloscope</strong>
                                                <span className="inst-badge badge-cro">200 MHz</span>
                                            </div>
                                            <p>Real-time waveform signal analyzer with live frequency & Vpp.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn primary" onClick={(e) => { e.stopPropagation(); handleOpenInst(onOpenOscilloscope); }}>
                                                    <i className="ri-line-chart-line"></i> Launch Scope
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Serial Monitor Card */}
                                    <div className="instrument-feature-card" onClick={() => handleOpenInst(onOpenSerial)}>
                                        <div className="instrument-art-container">
                                            <SerialMonitorIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>UART Serial Monitor</strong>
                                                <span className="inst-badge badge-uart">115200</span>
                                            </div>
                                            <p>Real-time hardware UART serial communication logger for MCU.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn" onClick={(e) => { e.stopPropagation(); handleOpenInst(onOpenSerial); }}>
                                                    <i className="ri-terminal-box-line"></i> Open Console
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. INSPECTOR TAB WITH BACK BUTTON, COMPONENT IMAGE AND LIVE STATS */}
                            {activeTab === "inspector" && (
                                <div className="inspector-panel-view">
                                    {selectedComponent ? (
                                        <div className="inspector-active-card">
                                            {/* Inspector Back Navigation Button */}
                                            <div className="inspector-top-nav">
                                                <button 
                                                    type="button"
                                                    className="inspector-back-nav-btn"
                                                    onClick={() => onSelectComponent && onSelectComponent(null)}
                                                    title="Back to all workspace components"
                                                >
                                                    <i className="ri-arrow-left-s-line"></i>
                                                    <span>All Components</span>
                                                    <span className="comp-count-chip">{components.length}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inspector-close-btn"
                                                    onClick={() => onSelectComponent && onSelectComponent(null)}
                                                    title="Deselect"
                                                >
                                                    <i className="ri-close-line"></i>
                                                </button>
                                            </div>

                                            {/* Visual 3D Component Artwork Banner */}
                                            <div className="inspector-banner">
                                                <ComponentPreviewArtwork component={selectedComponent} />
                                            </div>

                                            {/* Component Name & Type */}
                                            <div className="inspector-meta-row">
                                                <div>
                                                    <h4 className="comp-name-title">{selectedComponent.name || selectedComponent.type}</h4>
                                                    <span className="comp-type-tag">{selectedComponent.type}</span>
                                                </div>
                                                <div className="comp-quick-actions">
                                                    <button 
                                                        className="meta-action-btn" 
                                                        onClick={onRotateComponent}
                                                        title="Rotate 90° (R)"
                                                    >
                                                        <i className="ri-anticlockwise-line"></i>
                                                    </button>
                                                    <button 
                                                        className="meta-action-btn delete" 
                                                        onClick={() => onDeleteComponent && onDeleteComponent(selectedComponent.id)}
                                                        title="Delete (Del)"
                                                    >
                                                        <i className="ri-delete-bin-line"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Live Simulation Measurements */}
                                            <div className="inspector-stats-box">
                                                <span className="stats-box-title">ELECTRICAL STATUS</span>
                                                <div className="stats-grid">
                                                    <div className="stat-pill">
                                                        <span className="stat-label">Position</span>
                                                        <span className="stat-val">X: {selectedComponent.x}, Y: {selectedComponent.y}</span>
                                                    </div>
                                                    <div className="stat-pill">
                                                        <span className="stat-label">Rotation</span>
                                                        <span className="stat-val">{selectedComponent.rotation || 0}°</span>
                                                    </div>
                                                    {selectedComponent.resistance != null && (
                                                        <div className="stat-pill highlight">
                                                            <span className="stat-label">Resistance</span>
                                                            <span className="stat-val">{selectedComponent.resistance >= 1000 ? `${selectedComponent.resistance / 1000} kΩ` : `${selectedComponent.resistance} Ω`}</span>
                                                        </div>
                                                    )}
                                                    {selectedComponent.voltage != null && (
                                                        <div className="stat-pill highlight">
                                                            <span className="stat-label">Voltage</span>
                                                            <span className="stat-val">{selectedComponent.voltage} V</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Renaming Input */}
                                            <div className="inspector-field-group">
                                                <label>Custom Label</label>
                                                <input 
                                                    type="text"
                                                    className="inspector-text-input"
                                                    value={selectedComponent.name || ""}
                                                    onChange={(e) => onUpdateComponent && onUpdateComponent(selectedComponent.id, { name: e.target.value })}
                                                    placeholder="Enter component name..."
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="inspector-empty-gallery">
                                            <div className="inspector-placeholder-lead">
                                                <i className="ri-focus-3-line"></i>
                                                <p>Select any component on your canvas to inspect its parameters.</p>
                                            </div>

                                            {/* Placed Workspace Components with 3D thumbnails */}
                                            <div className="quick-add-section">
                                                <span className="section-label">WORKSPACE COMPONENTS ({components.length})</span>
                                                <div className="placed-components-list">
                                                    {components.length > 0 ? (
                                                        components.map((c) => (
                                                            <div 
                                                                key={c.id} 
                                                                className="placed-item-chip"
                                                                onClick={() => onSelectComponent && onSelectComponent(c.id)}
                                                            >
                                                                <div className="chip-3d-thumb">
                                                                    <Component3DThumbnail type={c.type} />
                                                                </div>
                                                                <div className="chip-info">
                                                                    <span className="chip-name">{c.name || c.type}</span>
                                                                    <span className="chip-pos">Position: ({c.x}, {c.y})</span>
                                                                </div>
                                                                <i className="ri-arrow-right-s-line chip-chevron"></i>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="no-comps-hint">No components on canvas. Open palette or search to add.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. CONNECTIONS TAB */}
                            {activeTab === "connections" && (
                                <Empty
                                    icon="ri-node-tree"
                                    title="Circuit Connections"
                                    text="Live topological netlist and solder nodes appear here."
                                />
                            )}

                            {/* 4. PINNED TAB */}
                            {activeTab === "pinned" && (
                                <Empty
                                    icon="ri-pushpin-line"
                                    title="Pinned Benchmarks"
                                    text="Pin frequently used probe needles or reference voltages."
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* =================================
                FLOATING ICON RAIL
            ================================= */}
            <div className="right-icons">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`right-icon ${isActive ? "active" : ""}`}
                            style={{ "--icon-color": tab.color }}
                            onClick={() => handleClick(tab.id)}
                        >
                            <i className={tab.icon}></i>
                            <span className="right-tooltip">{tab.title}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function Empty({ icon, title, text }) {
    return (
        <div className="right-empty">
            <i className={icon}></i>
            <strong>{title}</strong>
            <span>{text}</span>
        </div>
    );
}

export default RightSidebar;
