import React from "react";
import "./ComponentArt.css";

export function ComponentArt({ type, color = "#ef4444", className = "", size = "normal" }) {
    const t = (type || "").toLowerCase();

    // 1. ARDUINO UNO R3
    if (t.startsWith("arduino-uno")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* PCB Surface */}
                <rect x="8" y="8" width="84" height="52" rx="4" fill="#008184" stroke="#004d40" strokeWidth="1.5" />
                {/* Silver USB-B Jack */}
                <rect x="5" y="16" width="12" height="14" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <rect x="7" y="19" width="4" height="8" rx="0.5" fill="#1e293b" />
                {/* Black DC Barrel Jack */}
                <rect x="5" y="38" width="14" height="16" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <circle cx="12" cy="46" r="3" fill="#18181b" stroke="#71717a" strokeWidth="1" />
                {/* Red Reset Button */}
                <rect x="18" y="14" width="7" height="7" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                <circle cx="21.5" cy="17.5" r="2.2" fill="#ef4444" />
                {/* 16MHz Crystal */}
                <rect x="22" y="27" width="12" height="5" rx="2.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
                {/* ATmega328P DIP IC */}
                <rect x="38" y="36" width="36" height="12" rx="1.5" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <circle cx="41" cy="42" r="1.5" fill="#3f3f46" />
                <text x="56" y="44.5" fill="#a1a1aa" fontSize="4.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ATMEGA328P</text>
                {/* Top Headers */}
                <rect x="26" y="9.5" width="62" height="5" rx="1" fill="#0f172a" />
                {[...Array(10)].map((_, i) => (
                    <circle key={`ut-${i}`} cx={29 + i * 5.8} cy={12} r="1" fill="#fbbf24" />
                ))}
                {/* Bottom Headers */}
                <rect x="32" y="53.5" width="56" height="5" rx="1" fill="#0f172a" />
                {[...Array(8)].map((_, i) => (
                    <circle key={`ub-${i}`} cx={35 + i * 6.8} cy={56} r="1" fill="#fbbf24" />
                ))}
                <text x="58" y="24" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">ARDUINO</text>
            </svg>
        );
    }

    // 2. ARDUINO MEGA 2560
    if (t.startsWith("arduino-mega")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="4" y="8" width="92" height="52" rx="4" fill="#005c5e" stroke="#00383a" strokeWidth="1.5" />
                {/* USB & DC */}
                <rect x="2" y="14" width="10" height="14" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <rect x="2" y="38" width="12" height="16" rx="2" fill="#09090b" />
                {/* ATmega2560 QFP Rotated */}
                <rect x="43" y="23" width="16" height="16" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" transform="rotate(45 51 31)" />
                <text x="51" y="32" fill="#a1a1aa" fontSize="3.8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">MEGA 2560</text>
                {/* Extended Right Dual Row Header */}
                <rect x="88" y="12" width="5.5" height="44" rx="1" fill="#0f172a" />
                {[...Array(7)].map((_, i) => (
                    <circle key={`mr-${i}`} cx={90.7} cy={15 + i * 6} r="0.9" fill="#fbbf24" />
                ))}
                {/* Top Headers */}
                <rect x="14" y="9.5" width="70" height="4.5" rx="1" fill="#0f172a" />
                {/* Bottom Headers */}
                <rect x="18" y="54" width="66" height="4.5" rx="1" fill="#0f172a" />
            </svg>
        );
    }

    // 3. ARDUINO NANO
    if (t.startsWith("arduino-nano")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="12" y="16" width="76" height="36" rx="3.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <rect x="8" y="26" width="8" height="16" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                <rect x="30" y="26" width="12" height="12" rx="1" fill="#09090b" transform="rotate(45 36 32)" />
                <rect x="52" y="30" width="7" height="7" rx="1.5" fill="#334155" />
                <circle cx="55.5" cy="33.5" r="1.8" fill="#ef4444" />
                {/* Top/Bot Headers */}
                <rect x="20" y="17.5" width="62" height="4" rx="0.8" fill="#0f172a" />
                <rect x="20" y="46.5" width="62" height="4" rx="0.8" fill="#0f172a" />
                <text x="68" y="28" fill="#ffffff" fontSize="5.5" fontWeight="900">NANO</text>
            </svg>
        );
    }

    // 4. ESP32 DEVKIT & S3
    if (t.startsWith("esp32")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="20" y="6" width="60" height="56" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                {/* Gold PCB Antenna */}
                <path d="M 34 10 L 38 10 L 38 14 L 42 14 L 42 10 L 46 10 L 46 14 L 50 14 L 50 10 L 54 10 L 54 14 L 58 14 L 58 10 L 62 10 L 62 14 L 66 14 L 66 10" fill="none" stroke="#eab308" strokeWidth="1.5" />
                {/* Metal RF Can */}
                <rect x="28" y="16" width="44" height="26" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="50" y="28" fill="#334155" fontSize="5" fontWeight="900" textAnchor="middle">ESPRESSIF</text>
                <text x="50" y="35" fill="#475569" fontSize="4.2" fontFamily="monospace" textAnchor="middle">ESP-WROOM-32</text>
                {/* CP2102 Bridge */}
                <rect x="44" y="44" width="12" height="10" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.6" />
                {/* Type-C Hub at Bottom */}
                <rect x="42" y="58" width="16" height="5" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                <rect x="46" y="59.5" width="8" height="2" rx="0.5" fill="#09090b" />
                {/* Pin Headers */}
                <rect x="21" y="10" width="5" height="48" rx="1" fill="#0f172a" />
                <rect x="74" y="10" width="5" height="48" rx="1" fill="#0f172a" />
            </svg>
        );
    }

    // 5. RASPBERRY PI PICO
    if (t.startsWith("rpi") || t === "pi") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="18" y="12" width="64" height="44" rx="3.5" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
                <rect x="15" y="27" width="7" height="14" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                {/* RP2040 chip */}
                <rect x="42" y="27" width="16" height="14" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
                <text x="50" y="36" fill="#a1a1aa" fontSize="3.8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">RP2040</text>
                {/* BOOTSEL Button */}
                <rect x="64" y="31" width="6" height="6" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.6" />
                <circle cx="67" cy="34" r="1.5" fill="#3b82f6" />
                {/* Castellated Pin Edges */}
                <rect x="19" y="13.5" width="62" height="3" rx="0.5" fill="#ca8a04" />
                <rect x="19" y="51.5" width="62" height="3" rx="0.5" fill="#ca8a04" />
                <text x="50" y="21" fill="#bbf7d0" fontSize="4.5" fontWeight="900" textAnchor="middle">Raspberry Pi Pico</text>
            </svg>
        );
    }

    // 6. STM32 BLUE PILL
    if (t.startsWith("stm32")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="16" y="14" width="68" height="40" rx="3" fill="#1d4ed8" stroke="#1e40af" strokeWidth="1.5" />
                <rect x="12" y="28" width="7" height="12" rx="1.5" fill="#cbd5e1" />
                <rect x="40" y="26" width="16" height="16" rx="1" fill="#09090b" transform="rotate(45 48 34)" />
                <rect x="66" y="26" width="8" height="6" rx="1" fill="#eab308" />
                <rect x="22" y="15.5" width="56" height="3.5" rx="0.8" fill="#0f172a" />
                <rect x="22" y="49" width="56" height="3.5" rx="0.8" fill="#0f172a" />
                <text x="50" y="23" fill="#ffffff" fontSize="4.8" fontWeight="bold" textAnchor="middle">STM32 ARM</text>
            </svg>
        );
    }

    // 7. ATTINY85 DIP-8
    if (t.startsWith("attiny")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* Silver IC Pins */}
                <line x1="26" y1="22" x2="32" y2="22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="26" y1="30" x2="32" y2="30" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="26" y1="38" x2="32" y2="38" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="26" y1="46" x2="32" y2="46" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="22" x2="74" y2="22" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="30" x2="74" y2="30" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="38" x2="74" y2="38" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="46" x2="74" y2="46" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                {/* Black Epoxy Body */}
                <rect x="32" y="16" width="36" height="36" rx="3" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                {/* Notch */}
                <circle cx="50" cy="16" r="3" fill="#27272a" />
                <circle cx="38" cy="22" r="1.5" fill="#52525b" />
                <text x="50" y="35" fill="#a1a1aa" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ATTINY</text>
                <text x="50" y="42" fill="#71717a" fontSize="4.2" fontFamily="monospace" textAnchor="middle">85-20PU</text>
            </svg>
        );
    }

    // 8. BREADBOARDS
    if (t.startsWith("breadboard")) {
        const isFull = t === "breadboard-full";
        const isMini = t === "breadboard-mini";
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x={isFull ? 4 : 8} y="14" width={isFull ? 92 : 84} height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                {!isMini && (
                    <>
                        <line x1="12" y1="19" x2="88" y2="19" stroke="#ef4444" strokeWidth="1.2" />
                        <line x1="12" y1="23" x2="88" y2="23" stroke="#3b82f6" strokeWidth="1.2" />
                        <line x1="12" y1="45" x2="88" y2="45" stroke="#ef4444" strokeWidth="1.2" />
                        <line x1="12" y1="49" x2="88" y2="49" stroke="#3b82f6" strokeWidth="1.2" />
                    </>
                )}
                <line x1="12" y1="34" x2="88" y2="34" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                <text x="50" y="32" fill="#64748b" fontSize="5" fontWeight="bold" textAnchor="middle">
                    {isFull ? "BREADBOARD 830-PT" : isMini ? "MINI 170-PT" : "BREADBOARD 400-PT"}
                </text>
            </svg>
        );
    }

    // 9. RESISTOR
    if (t === "resistor") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="8" y1="34" x2="30" y2="34" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="70" y1="34" x2="92" y2="34" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <rect x="28" y="24" width="44" height="20" rx="5" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
                <rect x="36" y="24" width="4" height="20" fill="#dc2626" />
                <rect x="45" y="24" width="4" height="20" fill="#dc2626" />
                <rect x="54" y="24" width="4" height="20" fill="#78350f" />
                <rect x="64" y="24" width="4" height="20" fill="#fbbf24" />
            </svg>
        );
    }

    // 10. LED (ALL COLORS)
    if (t.startsWith("led")) {
        const ledColor = t.includes("green") ? "#10b981" : 
                         t.includes("blue") ? "#3b9cff" : 
                         t.includes("yellow") ? "#eab308" : 
                         t.includes("rgb") ? "#a855f7" : (color || "#ef4444");
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* Silver Anode & Cathode Leads */}
                <line x1="44" y1="42" x2="44" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="56" y1="42" x2="56" y2="62" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* LED Brim */}
                <rect x="37" y="40" width="26" height="5" rx="1.5" fill={ledColor} stroke="#000" strokeOpacity="0.25" />
                {/* Diffused Bulb Dome */}
                <path d="M 39 40 C 39 16, 61 16, 61 40 Z" fill={ledColor} />
                {/* Glow & Specular Highlight */}
                <circle cx="46" cy="27" r="4" fill="#ffffff" fillOpacity="0.5" />
                <circle cx="50" cy="28" r="14" fill={ledColor} fillOpacity="0.25" />
            </svg>
        );
    }

    // 11. PUSH BUTTON (TACTILE)
    if (t.startsWith("push") || t === "button") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 4 Silver Bent Leads */}
                <line x1="24" y1="24" x2="32" y2="24" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="24" y1="44" x2="32" y2="44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="24" x2="76" y2="24" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="68" y1="44" x2="76" y2="44" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                {/* Square Body */}
                <rect x="32" y="18" width="36" height="32" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="36" cy="22" r="1.5" fill="#64748b" />
                <circle cx="64" cy="22" r="1.5" fill="#64748b" />
                <circle cx="36" cy="46" r="1.5" fill="#64748b" />
                <circle cx="64" cy="46" r="1.5" fill="#64748b" />
                {/* Round Actuator Plunger */}
                <circle cx="50" cy="34" r="11" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <circle cx="50" cy="34" r="8.5" fill="#3b82f6" />
                <circle cx="48" cy="32" r="2.5" fill="#93c5fd" fillOpacity="0.6" />
            </svg>
        );
    }

    // 12. POTENTIOMETER
    if (t === "potentiometer") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="38" y1="48" x2="38" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="50" y1="48" x2="50" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="62" y1="48" x2="62" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="50" cy="30" r="20" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <circle cx="50" cy="30" r="14" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <line x1="50" y1="30" x2="50" y2="18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
        );
    }

    // 13. SLIDE SWITCH (SPDT)
    if (t === "slide-switch" || t === "switch-spdt") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="38" y1="44" x2="38" y2="58" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="50" y1="44" x2="50" y2="58" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="62" y1="44" x2="62" y2="58" stroke="#cbd5e1" strokeWidth="2.5" />
                <rect x="28" y="20" width="44" height="24" rx="3" fill="#475569" stroke="#334155" strokeWidth="1.5" />
                <rect x="34" y="30" width="32" height="4" rx="1" fill="#0f172a" />
                <rect x="44" y="14" width="12" height="18" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            </svg>
        );
    }

    // 14. TOGGLE SWITCH (SPST)
    if (t === "switch-spst") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="24" y="18" width="52" height="32" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="50" cy="34" r="10" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <line x1="50" y1="34" x2="62" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                <circle cx="62" cy="20" r="3" fill="#94a3b8" />
                <rect x="16" y="32" width="8" height="4" rx="1" fill="#94a3b8" />
                <rect x="76" y="32" width="8" height="4" rx="1" fill="#94a3b8" />
            </svg>
        );
    }

    // 15. BATTERY 9V
    if (t === "battery-9v") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="32" y="14" width="36" height="48" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="32" y="14" width="36" height="13" rx="1" fill="#f97316" />
                <rect x="38" y="8" width="7" height="6" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <circle cx="60" cy="11" r="3.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <text x="50" y="44" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">9V</text>
            </svg>
        );
    }

    // 16. BATTERY COIN (CR2032 3V)
    if (t === "battery-coin") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <circle cx="50" cy="34" r="22" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="50" cy="34" r="18" fill="#f1f5f9" />
                <text x="50" y="31" fill="#334155" fontSize="11" fontWeight="bold" textAnchor="middle">+</text>
                <text x="50" y="42" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="middle">CR2032 3V</text>
            </svg>
        );
    }

    // 17. BATTERY AA / AAA CASE
    if (t.startsWith("battery-aa") || t.startsWith("battery-aaa")) {
        const isAA = t.startsWith("battery-aa");
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="18" y="12" width="64" height="44" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="24" y="17" width="52" height="15" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <rect x="72" y="20" width="3" height="9" rx="0.5" fill="#cbd5e1" />
                <rect x="24" y="36" width="52" height="15" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <rect x="21" y="39" width="3" height="9" rx="0.5" fill="#cbd5e1" />
                <path d="M 82 22 Q 92 18 92 28" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <path d="M 82 46 Q 92 50 92 40" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
                <text x="50" y="27" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle">{isAA ? "AA 3.0V" : "AAA 3.0V"}</text>
            </svg>
        );
    }

    // 18. BUZZER (PIEZO)
    if (t === "buzzer") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="42" y1="48" x2="42" y2="60" stroke="#dc2626" strokeWidth="2.5" />
                <line x1="58" y1="48" x2="58" y2="60" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="50" cy="32" r="20" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <circle cx="50" cy="32" r="7" fill="#1e293b" />
                <path d="M 74 24 A 10 10 0 0 1 74 40" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <text x="42" y="24" fill="#ef4444" fontSize="7" fontWeight="bold">+</text>
            </svg>
        );
    }

    // 19. LCD 1602 SCREEN
    if (t === "lcd-1602") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="10" y="12" width="80" height="44" rx="3.5" fill="#006644" stroke="#004d33" strokeWidth="1.5" />
                <rect x="16" y="18" width="68" height="32" rx="2" fill="#0f172a" />
                <rect x="20" y="22" width="60" height="24" rx="1" fill="#0284c7" fillOpacity="0.3" />
                <text x="24" y="33" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">TwinLab X 1602</text>
                <text x="24" y="42" fill="#38bdf8" fontSize="5.5" fontFamily="monospace">Ready: I2C 0x27</text>
                <circle cx="8" cy="24" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="30" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="36" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="42" r="1.5" fill="#ca8a04" />
            </svg>
        );
    }

    // 20. MULTIMETER
    if (t === "multimeter") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="32" y="8" width="36" height="52" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="36" y="12" width="28" height="13" rx="1.5" fill="#14532d" />
                <text x="50" y="21.5" fill="#4ade80" fontSize="7.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.00 V</text>
                <circle cx="50" cy="36" r="8" fill="#0f172a" />
                <line x1="50" y1="36" x2="50" y2="30" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" />
                <circle cx="42" cy="52" r="2.5" fill="#0f172a" />
                <circle cx="58" cy="52" r="2.5" fill="#dc2626" />
            </svg>
        );
    }

    // 21. OSCILLOSCOPE
    if (t === "oscilloscope") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="14" y="10" width="72" height="48" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <rect x="18" y="14" width="46" height="34" rx="2" fill="#09090b" stroke="#1e293b" strokeWidth="1" />
                {/* Waveform */}
                <path d="M 20 31 Q 26 21 32 31 T 44 31 T 56 31 T 62 31" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                {/* Dials on right */}
                <circle cx="74" cy="22" r="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <circle cx="74" cy="34" r="4" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
                <circle cx="74" cy="46" r="3" fill="#ca8a04" />
            </svg>
        );
    }

    // 22. PHOTORESISTOR (LDR)
    if (t === "photoresistor") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="44" y1="46" x2="44" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="56" y1="46" x2="56" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="50" cy="30" r="16" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />
                <path d="M 40 24 C 45 24, 45 28, 50 28 C 55 28, 55 32, 60 32 C 60 36, 40 36, 40 40" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    // 23. CERAMIC CAPACITOR (100nF)
    if (t === "capacitor-ceramic") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="45" y1="42" x2="45" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="55" y1="42" x2="55" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="50" cy="28" r="15" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                <text x="50" y="32" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">104</text>
            </svg>
        );
    }

    // 24. ELECTROLYTIC CAPACITOR (10uF)
    if (t === "capacitor-electrolytic") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <line x1="45" y1="46" x2="45" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="55" y1="46" x2="55" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <rect x="38" y="14" width="24" height="34" rx="3" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.2" />
                <rect x="52" y="14" width="6" height="34" fill="#e2e8f0" />
                <text x="55" y="30" fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle">-</text>
            </svg>
        );
    }

    // 25. JUMPER WIRE TOOL
    if (t.startsWith("wire")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <path d="M 20 48 C 24 16, 76 16, 80 48" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
                <rect x="16" y="44" width="8" height="8" rx="1.5" fill="#0f172a" />
                <rect x="76" y="44" width="8" height="8" rx="1.5" fill="#0f172a" />
                <line x1="20" y1="52" x2="20" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="80" y1="52" x2="80" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
            </svg>
        );
    }

    // 26. STARTER: LED + RESISTOR
    if (t === "starter-led-resistor") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="8" y="10" width="84" height="48" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                {/* Resistor */}
                <line x1="16" y1="34" x2="28" y2="34" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="48" y1="34" x2="56" y2="34" stroke="#cbd5e1" strokeWidth="2" />
                <rect x="28" y="27" width="20" height="14" rx="3" fill="#d97706" />
                <rect x="33" y="27" width="3" height="14" fill="#dc2626" />
                <rect x="39" y="27" width="3" height="14" fill="#78350f" />
                {/* Connecting Wire */}
                <path d="M 56 34 Q 64 22 72 34" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                {/* 5mm LED */}
                <path d="M 72 44 C 72 26, 88 26, 88 44 Z" fill="#ef4444" />
                <circle cx="77" cy="33" r="2.5" fill="#ffffff" opacity="0.6" />
                <text x="50" y="52" fill="#38bdf8" fontSize="4.5" fontWeight="bold" textAnchor="middle">Starter: LED + 220Ω</text>
            </svg>
        );
    }

    // 27. STARTER: 9V POWER AND LED
    if (t === "starter-battery-led") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="8" y="10" width="84" height="48" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                {/* 9V Battery */}
                <rect x="14" y="20" width="22" height="30" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <rect x="14" y="20" width="22" height="8" rx="1" fill="#f97316" />
                <text x="25" y="42" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">9V</text>
                {/* Red & Black Leads */}
                <path d="M 36 28 Q 50 16 64 28" fill="none" stroke="#ef4444" strokeWidth="2" />
                <path d="M 36 42 Q 50 54 74 44" fill="none" stroke="#09090b" strokeWidth="2" />
                {/* LED */}
                <path d="M 68 40 C 68 26, 82 26, 82 40 Z" fill="#10b981" />
                <text x="50" y="54" fill="#10b981" fontSize="4.5" fontWeight="bold" textAnchor="middle">Starter: DC Loop</text>
            </svg>
        );
    }

    // 28. STARTER: VARIABLE POT + LED
    if (t === "starter-pot-led") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="8" y="10" width="84" height="48" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                {/* Potentiometer */}
                <circle cx="28" cy="34" r="14" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="28" cy="34" r="9" fill="#0284c7" />
                <line x1="28" y1="34" x2="28" y2="25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                {/* Wire */}
                <path d="M 42 34 Q 54 20 68 32" fill="none" stroke="#f59e0b" strokeWidth="2" />
                {/* LED */}
                <path d="M 68 42 C 68 28, 82 28, 82 42 Z" fill="#f59e0b" />
                <text x="50" y="54" fill="#f59e0b" fontSize="4.5" fontWeight="bold" textAnchor="middle">Starter: Variable Dimmer</text>
            </svg>
        );
    }

    // 29. STARTER: BUTTON + BUZZER
    if (t === "starter-button-buzzer") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="8" y="10" width="84" height="48" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                {/* Pushbutton */}
                <rect x="16" y="24" width="20" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <circle cx="26" cy="34" r="6" fill="#3b82f6" />
                {/* Jumper */}
                <path d="M 36 34 Q 48 20 60 34" fill="none" stroke="#38bdf8" strokeWidth="2" />
                {/* Buzzer */}
                <circle cx="74" cy="34" r="14" fill="#09090b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="74" cy="34" r="5" fill="#1e293b" />
                <path d="M 88 28 A 8 8 0 0 1 88 40" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <text x="50" y="54" fill="#38bdf8" fontSize="4.5" fontWeight="bold" textAnchor="middle">Starter: Doorbell</text>
            </svg>
        );
    }

    // 30. TRANSISTORS (NPN 2N2222 & PNP 2N3906)
    if (t.includes("transistor") || t === "bjt" || t === "npn" || t === "pnp") {
        const isPNP = t.includes("pnp");
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 3 Leads */}
                <line x1="38" y1="44" x2="38" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="50" y1="44" x2="50" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="62" y1="44" x2="62" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* TO-92 Semi-Cylindrical Body */}
                <path d="M 32 44 L 68 44 C 68 20, 32 20, 32 44 Z" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="34" y="41" width="32" height="3" fill="#18181b" />
                <text x="50" y="34" fill="#e2e8f0" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{isPNP ? "2N3906" : "2N2222"}</text>
                <text x="50" y="41" fill="#FF8A00" fontSize="4.5" fontWeight="900" textAnchor="middle">{isPNP ? "PNP" : "NPN"}</text>
            </svg>
        );
    }

    // 31. N-CHANNEL MOSFET (IRF540N TO-220)
    if (t.includes("mosfet")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 3 Leads */}
                <line x1="40" y1="48" x2="40" y2="62" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="50" y1="48" x2="50" y2="62" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="60" y1="48" x2="60" y2="62" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* Silver Heat Tab at Top */}
                <rect x="35" y="10" width="30" height="16" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="50" cy="18" r="3.5" fill="#64748b" />
                {/* Black Epoxy Body */}
                <rect x="32" y="24" width="36" height="24" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <text x="50" y="35" fill="#f8fafc" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">IRF540N</text>
                <text x="50" y="43" fill="#10b981" fontSize="4.5" fontWeight="900" textAnchor="middle">N-MOSFET</text>
            </svg>
        );
    }

    // 31b. TMP36 PRECISION TEMPERATURE SENSOR (TO-92 PACKAGE)
    if (t.includes("temp") || t.includes("tmp36")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 3 Straight Leads (VCC, VOUT, GND) */}
                <line x1="38" y1="44" x2="38" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="50" y1="44" x2="50" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                <line x1="62" y1="44" x2="62" y2="60" stroke="#cbd5e1" strokeWidth="2.5" />
                {/* TO-92 Semi-Cylindrical Body */}
                <path d="M 30 44 L 70 44 C 70 18, 30 18, 30 44 Z" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="32" y="41" width="36" height="3" fill="#18181b" />
                <text x="50" y="32" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="900" textAnchor="middle">TMP36</text>
                <text x="50" y="39" fill="#94a3b8" fontSize="4" fontFamily="monospace" fontWeight="700" textAnchor="middle">-40°C~125°C</text>
            </svg>
        );
    }

    // 31c. SOIL MOISTURE SENSOR PROBE
    if (t.includes("soil")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 3 Header Pins at top (VCC, GND, SIG) */}
                <line x1="42" y1="12" x2="42" y2="4" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="50" y1="12" x2="50" y2="4" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="58" y1="12" x2="58" y2="4" stroke="#ca8a04" strokeWidth="2.2" strokeLinecap="round" />
                {/* Red Controller PCB */}
                <rect x="30" y="12" width="40" height="22" rx="3" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                {/* Status LEDs & Trimmer */}
                <circle cx="36" cy="18" r="1.8" fill="#22c55e" />
                <circle cx="64" cy="18" r="1.8" fill="#eab308" />
                <rect x="46" y="16" width="8" height="8" rx="1.5" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8" />
                <circle cx="50" cy="20" r="2" fill="#ca8a04" />
                <text x="50" y="30" fill="#ffffff" fontSize="4.5" fontFamily="monospace" fontWeight="900" textAnchor="middle">SOIL</text>
                {/* Left & Right Long Immersion Probe Prongs */}
                <rect x="36" y="34" width="9" height="30" rx="3" fill="#b91c1c" stroke="#991b1b" strokeWidth="1" />
                <rect x="55" y="34" width="9" height="30" rx="3" fill="#b91c1c" stroke="#991b1b" strokeWidth="1" />
                {/* Gold Interdigitated Sensing Traces */}
                <line x1="40.5" y1="40" x2="40.5" y2="60" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="59.5" y1="40" x2="59.5" y2="60" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
        );
    }

    // 32. DC MOTOR WITH PROPELLER
    if (t.includes("motor-dc") || t === "dc-motor") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* Leads */}
                <line x1="32" y1="48" x2="32" y2="60" stroke="#dc2626" strokeWidth="2.5" />
                <line x1="68" y1="48" x2="68" y2="60" stroke="#09090b" strokeWidth="2.5" />
                {/* Metal Can */}
                <circle cx="50" cy="30" r="22" fill="#475569" stroke="#64748b" strokeWidth="2" />
                <circle cx="50" cy="30" r="18" fill="#1e293b" />
                {/* Propeller Blades */}
                <path d="M 50 12 C 54 20, 54 26, 50 30 C 46 26, 46 20, 50 12 Z" fill="#0284c7" />
                <path d="M 66 38 C 58 36, 54 34, 50 30 C 54 26, 60 28, 66 38 Z" fill="#0284c7" />
                <path d="M 34 38 C 42 36, 46 34, 50 30 C 46 26, 40 28, 34 38 Z" fill="#0284c7" />
                <circle cx="50" cy="30" r="4" fill="#cbd5e1" />
            </svg>
        );
    }

    // 33. SG90 MICRO SERVO
    if (t.includes("servo")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 3 Color Wires */}
                <line x1="42" y1="48" x2="42" y2="60" stroke="#78350f" strokeWidth="2" />
                <line x1="50" y1="48" x2="50" y2="60" stroke="#dc2626" strokeWidth="2" />
                <line x1="58" y1="48" x2="58" y2="60" stroke="#f97316" strokeWidth="2" />
                {/* Translucent Blue Box */}
                <rect x="30" y="18" width="40" height="30" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <rect x="24" y="24" width="6" height="12" rx="1" fill="#0284c7" />
                <rect x="70" y="24" width="6" height="12" rx="1" fill="#0284c7" />
                {/* Splined Gear & White Horn */}
                <circle cx="44" cy="18" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="36" y="15" width="28" height="6" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                <circle cx="44" cy="18" r="2" fill="#0f172a" />
                <text x="50" y="40" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">SG90 9g</text>
            </svg>
        );
    }

    // 34. HC-SR04 ULTRASONIC SENSOR
    if (t.includes("ultrasonic") || t.includes("sonar")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* Blue PCB */}
                <rect x="18" y="16" width="64" height="36" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                {/* Dual Silver Transducers */}
                <circle cx="34" cy="34" r="12" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <circle cx="34" cy="34" r="8" fill="#94a3b8" />
                <text x="34" y="37" fill="#0f172a" fontSize="8" fontWeight="900" textAnchor="middle">T</text>
                <circle cx="66" cy="34" r="12" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
                <circle cx="66" cy="34" r="8" fill="#94a3b8" />
                <text x="66" y="37" fill="#0f172a" fontSize="8" fontWeight="900" textAnchor="middle">R</text>
                {/* 4 Pins */}
                <line x1="38" y1="52" x2="38" y2="60" stroke="#ca8a04" strokeWidth="2" />
                <line x1="46" y1="52" x2="46" y2="60" stroke="#ca8a04" strokeWidth="2" />
                <line x1="54" y1="52" x2="54" y2="60" stroke="#ca8a04" strokeWidth="2" />
                <line x1="62" y1="52" x2="62" y2="60" stroke="#ca8a04" strokeWidth="2" />
                <text x="50" y="24" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">HC-SR04</text>
            </svg>
        );
    }

    // 35. PIR MOTION SENSOR
    if (t.includes("pir")) {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="22" y="14" width="56" height="40" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
                {/* White Hemispherical Fresnel Dome */}
                <circle cx="50" cy="34" r="15" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <path d="M 38 34 Q 50 26 62 34" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <path d="M 38 34 Q 50 42 62 34" fill="none" stroke="#94a3b8" strokeWidth="1" />
                <text x="50" y="23" fill="#bbf7d0" fontSize="4.5" fontWeight="bold" textAnchor="middle">PIR MOTION</text>
            </svg>
        );
    }

    // 36. LOGIC GATES & MOTOR DRIVER (DIP-14 & DIP-16: 74HC08, 74HC00, 74HC32, 74HC04, L293D)
    if (t.startsWith("ic-") || t.includes("74hc") || t.includes("l293d") || t.includes("logic")) {
        const icName = t.includes("74hc08") ? "74HC08 AND" :
                       t.includes("74hc00") ? "74HC00 NAND" :
                       t.includes("74hc32") ? "74HC32 OR" :
                       t.includes("74hc04") ? "74HC04 NOT" :
                       t.includes("74hc02") ? "74HC02 NOR" :
                       t.includes("74hc86") ? "74HC86 XOR" :
                       t.includes("74hc132") ? "74HC132 SCHMITT" :
                       t.includes("l293d") ? "L293D MOTOR" : "74HC LOGIC";
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                {/* 14 Pins */}
                {[...Array(7)].map((_, i) => (
                    <g key={i}>
                        <line x1={16 + i * 11} y1="12" x2={16 + i * 11} y2="18" stroke="#cbd5e1" strokeWidth="2.5" />
                        <line x1={16 + i * 11} y1="50" x2={16 + i * 11} y2="56" stroke="#cbd5e1" strokeWidth="2.5" />
                    </g>
                ))}
                {/* Black Epoxy Body */}
                <rect x="12" y="18" width="76" height="32" rx="3" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
                {/* Notch */}
                <circle cx="12" cy="34" r="3.5" fill="#27272a" />
                <circle cx="20" cy="44" r="1.5" fill="#52525b" />
                <text x="50" y="32" fill="#e2e8f0" fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">{icName}</text>
                <text x="50" y="42" fill="#71717a" fontSize="4.2" fontFamily="monospace" textAnchor="middle">TWINLAB X</text>
            </svg>
        );
    }

    // 37. LARGE 20x4 LCD DISPLAY
    if (t === "lcd-2004") {
        return (
            <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
                <rect x="6" y="8" width="88" height="52" rx="4" fill="#006644" stroke="#004d33" strokeWidth="1.5" />
                <rect x="12" y="13" width="76" height="42" rx="2" fill="#0f172a" />
                <rect x="15" y="16" width="70" height="36" rx="1" fill="#0284c7" fillOpacity="0.35" />
                <text x="18" y="25" fill="#38bdf8" fontSize="4.8" fontFamily="monospace" fontWeight="bold">TwinLab X 2004</text>
                <text x="18" y="33" fill="#38bdf8" fontSize="4.8" fontFamily="monospace">Real-Time Simulation</text>
                <text x="18" y="41" fill="#38bdf8" fontSize="4.8" fontFamily="monospace">I2C Address: 0x27</text>
                <text x="18" y="49" fill="#38bdf8" fontSize="4.8" fontFamily="monospace">Status: Online</text>
            </svg>
        );
    }

    // Default High-Tech Dual-Inline Microchip
    return (
        <svg viewBox="0 0 100 68" className={`comp-art-svg ${className}`}>
            <rect x="28" y="14" width="44" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="36" cy="22" r="2.5" fill="#475569" />
            <text x="50" y="38" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">IC</text>
            {[...Array(4)].map((_, i) => (
                <g key={i}>
                    <line x1="20" y1="22 + i * 9" x2="28" y2="22 + i * 9" stroke="#cbd5e1" strokeWidth="2" />
                    <line x1="72" y1="22 + i * 9" x2="80" y2="22 + i * 9" stroke="#cbd5e1" strokeWidth="2" />
                </g>
            ))}
        </svg>
    );
}

export default ComponentArt;
