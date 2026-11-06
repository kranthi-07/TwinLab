import "./LeftSidebar.css";
import { useState, useRef, useEffect } from "react";
import { COMPONENTS_CATALOG } from "../../../data/componentsCatalog";

function ComponentCatalogThumbnail({ component }) {
    const type = component.type || component.id;
    const color = component.color || "#ef4444";

    if (type === "arduino-uno") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="8" y="4" width="64" height="48" rx="4" fill="#008184" stroke="#005c5e" strokeWidth="1.5" />
                <rect x="4" y="8" width="12" height="14" rx="1.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                <rect x="4" y="32" width="14" height="16" rx="2" fill="#0f172a" />
                <rect x="28" y="24" width="28" height="10" rx="1" fill="#1e293b" />
                <circle cx="30" cy="29" r="1.5" fill="#475569" />
                <rect x="22" y="6" width="46" height="5" rx="1" fill="#0f172a" />
                <rect x="22" y="45" width="46" height="5" rx="1" fill="#0f172a" />
                {[...Array(8)].map((_, i) => (
                    <circle key={`t-${i}`} cx={25 + i * 5.5} cy={8.5} r="1" fill="#fbbf24" />
                ))}
                {[...Array(8)].map((_, i) => (
                    <circle key={`b-${i}`} cx={25 + i * 5.5} cy={47.5} r="1" fill="#fbbf24" />
                ))}
                <circle cx="16" cy="24" r="2.5" fill="#ef4444" />
            </svg>
        );
    }

    if (type === "arduino-mega") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="2" y="6" width="76" height="44" rx="3.5" fill="#005c5e" stroke="#00383a" strokeWidth="1.5" />
                {/* USB-B & DC Jack */}
                <rect x="1" y="10" width="10" height="13" rx="1.5" fill="#94a3b8" />
                <rect x="1" y="31" width="12" height="15" rx="1.5" fill="#0f172a" />
                {/* ATmega2560 Quad Flat Pack rotated */}
                <rect x="34" y="20" width="14" height="14" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" transform="rotate(45 41 27)" />
                {/* Extended Dual-Row Right Header */}
                <rect x="71" y="10" width="5" height="36" rx="1" fill="#0f172a" />
                {[...Array(6)].map((_, i) => (
                    <circle key={`rh-${i}`} cx={73.5} cy={13 + i * 6} r="0.8" fill="#fbbf24" />
                ))}
                {/* Top Headers */}
                <rect x="14" y="8" width="54" height="4.5" rx="1" fill="#0f172a" />
                {/* Bottom Headers */}
                <rect x="14" y="43.5" width="54" height="4.5" rx="1" fill="#0f172a" />
                <text x="40" y="41" fill="#a1a1aa" fontSize="4.5" fontWeight="bold" textAnchor="middle">MEGA 2560</text>
            </svg>
        );
    }

    if (type === "arduino-nano") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* Horizontal DIP-30 Board */}
                <rect x="8" y="14" width="64" height="28" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                {/* Mini-USB on left */}
                <rect x="6" y="22" width="7" height="12" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Reset button center */}
                <rect x="37" y="25" width="6" height="6" rx="1" fill="#334155" />
                <circle cx="40" cy="28" r="1.5" fill="#ef4444" />
                {/* ATmega328P QFP */}
                <rect x="22" y="23" width="9" height="9" rx="0.8" fill="#09090b" transform="rotate(45 26.5 27.5)" />
                {/* Top 15-pin Header */}
                <rect x="15" y="15.5" width="53" height="3.5" rx="0.8" fill="#0f172a" />
                {[...Array(9)].map((_, i) => (
                    <circle key={`nt-${i}`} cx={18 + i * 5.8} cy={17.2} r="0.8" fill="#fbbf24" />
                ))}
                {/* Bottom 15-pin Header */}
                <rect x="15" y="37" width="53" height="3.5" rx="0.8" fill="#0f172a" />
                {[...Array(9)].map((_, i) => (
                    <circle key={`nb-${i}`} cx={18 + i * 5.8} cy={38.8} r="0.8" fill="#fbbf24" />
                ))}
                <text x="56" y="29.5" fill="#ffffff" fontSize="4.8" fontWeight="bold">NANO</text>
            </svg>
        );
    }

    if (type === "esp32" || type === "esp32-devkit" || type === "esp32-s3") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="16" y="4" width="48" height="48" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="24" y="16" width="32" height="24" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="40" y="30" fill="#475569" fontSize="5.5" fontWeight="bold" textAnchor="middle">ESP32</text>
                <path d="M 28 8 L 32 8 L 32 12 L 36 12 L 36 8 L 40 8 L 40 12 L 44 12 L 44 8 L 48 8 L 48 12 L 52 12 L 52 8" fill="none" stroke="#eab308" strokeWidth="1.5" />
                <rect x="34" y="48" width="12" height="5" rx="1" fill="#94a3b8" />
                <rect x="17" y="8" width="4.5" height="40" rx="1" fill="#0f172a" />
                <rect x="58.5" y="8" width="4.5" height="40" rx="1" fill="#0f172a" />
            </svg>
        );
    }

    // Full-Size Breadboard (830 Tie Points) - Wide layout
    if (type === "breadboard-full") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="3" y="10" width="74" height="36" rx="3.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Extended Dual Rails */}
                <line x1="8" y1="14" x2="72" y2="14" stroke="#ef4444" strokeWidth="1" />
                <line x1="8" y1="17.5" x2="72" y2="17.5" stroke="#3b82f6" strokeWidth="1" />
                <line x1="8" y1="38.5" x2="72" y2="38.5" stroke="#3b82f6" strokeWidth="1" />
                <line x1="8" y1="42" x2="72" y2="42" stroke="#ef4444" strokeWidth="1" />
                {/* Center Trench */}
                <line x1="6" y1="28" x2="74" y2="28" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                {/* Dense columns */}
                {[...Array(4)].map((_, r) => (
                    <g key={r}>
                        {[...Array(12)].map((_, c) => (
                            <rect key={c} x={10 + c * 5} y={20 + (r < 2 ? r * 3 : 8 + (r - 2) * 3)} width="1.6" height="1.6" rx="0.3" fill="#64748b" />
                        ))}
                    </g>
                ))}
            </svg>
        );
    }

    // Mini Breadboard (170 Tie Points) - Compact layout with NO power rails
    if (type === "breadboard-mini") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="18" y="11" width="44" height="34" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
                {/* No Power Rails! Only Center Divider Trench */}
                <line x1="20" y1="28" x2="60" y2="28" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="2 2" />
                {[...Array(4)].map((_, r) => (
                    <g key={r}>
                        {[...Array(6)].map((_, c) => (
                            <rect key={c} x={24 + c * 5.8} y={16 + (r < 2 ? r * 4.5 : 9 + (r - 2) * 4.5)} width="2" height="2" rx="0.4" fill="#64748b" />
                        ))}
                    </g>
                ))}
            </svg>
        );
    }

    // Standard Half Breadboard (400 Tie Points)
    if (type?.startsWith("breadboard")) {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="8" y="8" width="64" height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="14" y1="13" x2="66" y2="13" stroke="#ef4444" strokeWidth="1" />
                <line x1="14" y1="17" x2="66" y2="17" stroke="#3b82f6" strokeWidth="1" />
                <line x1="14" y1="39" x2="66" y2="39" stroke="#3b82f6" strokeWidth="1" />
                <line x1="14" y1="43" x2="66" y2="43" stroke="#ef4444" strokeWidth="1" />
                <line x1="12" y1="28" x2="68" y2="28" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                {[...Array(5)].map((_, r) => (
                    <g key={r}>
                        {[...Array(8)].map((_, c) => (
                            <rect key={c} x={18 + c * 6} y={20 + (r < 2 ? r * 3 : 8 + (r - 2) * 3)} width="1.8" height="1.8" rx="0.3" fill="#64748b" />
                        ))}
                    </g>
                ))}
            </svg>
        );
    }

    if (type === "resistor") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="8" y1="28" x2="26" y2="28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="54" y1="28" x2="72" y2="28" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                <rect x="24" y="20" width="32" height="16" rx="4" fill="#d4a373" stroke="#bc6c25" strokeWidth="1" />
                <rect x="29" y="20" width="3.5" height="16" fill="#dc2626" />
                <rect x="36" y="20" width="3.5" height="16" fill="#dc2626" />
                <rect x="43" y="20" width="3.5" height="16" fill="#78350f" />
                <rect x="50" y="20" width="3.5" height="16" fill="#eab308" />
            </svg>
        );
    }

    if (type === "led" || component.id?.startsWith("led")) {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="36" y1="36" x2="36" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="44" y1="36" x2="44" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <rect x="32" y="34" width="16" height="4" rx="1.5" fill={color} stroke="#000" strokeOpacity="0.2" />
                <path d="M 33 34 C 33 16, 47 16, 47 34 Z" fill={color} />
                <ellipse cx="37" cy="25" rx="2" ry="5" fill="#ffffff" fillOpacity="0.45" />
            </svg>
        );
    }

    if (type === "button" || type === "push-button") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="22" y1="18" x2="16" y2="18" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="22" y1="38" x2="16" y2="38" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="58" y1="18" x2="64" y2="18" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="58" y1="38" x2="64" y2="38" stroke="#94a3b8" strokeWidth="2.5" />
                <rect x="22" y="14" width="36" height="28" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <circle cx="26" cy="18" r="1.5" fill="#94a3b8" />
                <circle cx="54" cy="18" r="1.5" fill="#94a3b8" />
                <circle cx="26" cy="38" r="1.5" fill="#94a3b8" />
                <circle cx="54" cy="38" r="1.5" fill="#94a3b8" />
                <circle cx="40" cy="28" r="8" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <circle cx="40" cy="28" r="5.5" fill="#3b82f6" />
            </svg>
        );
    }

    if (type === "potentiometer") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="32" y1="42" x2="32" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="40" y1="42" x2="40" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="48" y1="42" x2="48" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="40" cy="25" r="17" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="40" cy="25" r="11" fill="#0284c7" />
                <line x1="40" y1="25" x2="40" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "slide-switch" || type === "switch-spdt") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="30" y1="36" x2="30" y2="50" stroke="#94a3b8" strokeWidth="2" />
                <line x1="40" y1="36" x2="40" y2="50" stroke="#94a3b8" strokeWidth="2" />
                <line x1="50" y1="36" x2="50" y2="50" stroke="#94a3b8" strokeWidth="2" />
                <rect x="22" y="16" width="36" height="20" rx="2" fill="#475569" stroke="#334155" strokeWidth="1" />
                <rect x="26" y="24" width="28" height="4" rx="1" fill="#0f172a" />
                <rect x="36" y="12" width="8" height="16" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
            </svg>
        );
    }

    if (type === "battery-9v") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="26" y="14" width="28" height="38" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                <rect x="26" y="14" width="28" height="10" rx="1" fill="#f97316" />
                <rect x="30" y="8" width="6" height="6" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <circle cx="48" cy="11" r="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <text x="40" y="38" fill="#e2e8f0" fontSize="7" fontWeight="bold" textAnchor="middle">9V</text>
            </svg>
        );
    }

    if (type === "battery-coin") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <circle cx="40" cy="28" r="18" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="40" cy="28" r="15" fill="#f1f5f9" />
                <text x="40" y="26" fill="#334155" fontSize="8" fontWeight="bold" textAnchor="middle">+</text>
                <text x="40" y="34" fill="#64748b" fontSize="5" fontWeight="bold" textAnchor="middle">3V</text>
            </svg>
        );
    }

    if (type === "buzzer") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="34" y1="42" x2="34" y2="52" stroke="#dc2626" strokeWidth="2" />
                <line x1="46" y1="42" x2="46" y2="52" stroke="#0f172a" strokeWidth="2" />
                <circle cx="40" cy="26" r="16" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                <circle cx="40" cy="26" r="5" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <path d="M 60 20 A 8 8 0 0 1 60 32" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "multimeter") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="26" y="6" width="28" height="44" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="30" y="10" width="20" height="10" rx="1.5" fill="#1e2d24" stroke="#14532d" strokeWidth="1" />
                <text x="40" y="17.5" fill="#4ade80" fontSize="5.5" fontWeight="bold" textAnchor="middle">0.00</text>
                <circle cx="40" cy="30" r="6" fill="#0f172a" />
                <line x1="40" y1="30" x2="40" y2="25" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="34" cy="44" r="2" fill="#0f172a" />
                <circle cx="46" cy="44" r="2" fill="#dc2626" />
            </svg>
        );
    }

    if (type === "photoresistor") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="36" y1="38" x2="36" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="44" y1="38" x2="44" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="40" cy="24" r="14" fill="#fed7aa" stroke="#fb923c" strokeWidth="1.5" />
                <path d="M 32 20 C 36 20, 36 24, 40 24 C 44 24, 44 28, 48 28" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "capacitor-ceramic") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="36" y1="36" x2="36" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="44" y1="36" x2="44" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="40" cy="24" r="12" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                <text x="40" y="27" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">104</text>
            </svg>
        );
    }

    if (type === "capacitor-electrolytic") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <line x1="36" y1="40" x2="36" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <line x1="44" y1="40" x2="44" y2="52" stroke="#94a3b8" strokeWidth="2" />
                <rect x="32" y="12" width="16" height="28" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
                <rect x="42" y="12" width="4" height="28" fill="#e2e8f0" />
                <text x="44" y="24" fill="#0f172a" fontSize="5" fontWeight="bold" textAnchor="middle">-</text>
            </svg>
        );
    }

    if (type === "lcd-1602") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="8" y="10" width="64" height="36" rx="3" fill="#006644" stroke="#004d33" strokeWidth="1.5" />
                <rect x="14" y="14" width="52" height="26" rx="2" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                <rect x="17" y="17" width="46" height="20" rx="1" fill="#0284c7" fillOpacity="0.35" />
                <text x="20" y="26" fill="#38bdf8" fontSize="5" fontFamily="monospace" fontWeight="bold">TwinLab v2.4</text>
                <text x="20" y="33" fill="#38bdf8" fontSize="5" fontFamily="monospace">Ready...</text>
                {/* 4 I2C Backpack pins on left */}
                <rect x="4" y="16" width="4" height="12" rx="0.5" fill="#18181b" />
                <circle cx="6" cy="18" r="0.8" fill="#ca8a04" />
                <circle cx="6" cy="21" r="0.8" fill="#ca8a04" />
                <circle cx="6" cy="24" r="0.8" fill="#ca8a04" />
                <circle cx="6" cy="27" r="0.8" fill="#ca8a04" />
            </svg>
        );
    }

    if (type === "battery-aa" || type === "battery-aaa") {
        const isAA = type === "battery-aa";
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* Black plastic enclosure */}
                <rect x="12" y="10" width="56" height="36" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                {/* 2 Cylindrical Cells */}
                <rect x="16" y="14" width="48" height="12" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                <rect x="58" y="16" width="3" height="8" rx="0.8" fill="#cbd5e1" />
                <rect x="16" y="29" width="48" height="12" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                <rect x="13" y="31" width="3" height="8" rx="0.8" fill="#cbd5e1" />
                {/* Red and Black snap wires */}
                <path d="M 68 18 Q 74 14 74 22" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 68 36 Q 74 40 74 32" fill="none" stroke="#09090b" strokeWidth="1.8" strokeLinecap="round" />
                <text x="38" y="23" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">{isAA ? "AA 3V" : "AAA 3V"}</text>
            </svg>
        );
    }

    if (type === "switch-spst") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                <rect x="22" y="16" width="36" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="40" cy="28" r="8" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                {/* Toggle bat lever */}
                <line x1="40" y1="28" x2="48" y2="18" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <circle cx="48" cy="18" r="2.5" fill="#94a3b8" />
                {/* 2 Solder Lugs */}
                <rect x="16" y="26" width="6" height="4" rx="1" fill="#94a3b8" />
                <rect x="58" y="26" width="6" height="4" rx="1" fill="#94a3b8" />
            </svg>
        );
    }

    if (type === "starter-led-resistor") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* Mini breadboard base */}
                <rect x="6" y="8" width="68" height="40" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
                <line x1="8" y1="13" x2="72" y2="13" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
                <line x1="8" y1="43" x2="72" y2="43" stroke="#3b82f6" strokeWidth="0.8" opacity="0.6" />
                {/* Resistor placed */}
                <rect x="16" y="24" width="22" height="6" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
                <line x1="12" y1="27" x2="16" y2="27" stroke="#64748b" strokeWidth="1.2" />
                <line x1="38" y1="27" x2="44" y2="27" stroke="#64748b" strokeWidth="1.2" />
                {/* 5mm LED placed */}
                <circle cx="52" cy="27" r="7" fill="#ef4444" />
                <circle cx="50" cy="25" r="2.5" fill="#fca5a5" opacity="0.8" />
                <line x1="44" y1="27" x2="48" y2="27" stroke="#64748b" strokeWidth="1.2" />
                <line x1="56" y1="27" x2="62" y2="27" stroke="#64748b" strokeWidth="1.2" />
                {/* Circuit wire */}
                <path d="M 62 27 Q 66 35 40 38" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    if (type === "starter-battery-led") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* 9V Battery */}
                <rect x="8" y="14" width="22" height="28" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                <rect x="8" y="14" width="22" height="7" rx="0.5" fill="#f97316" />
                <rect x="11" y="10" width="4" height="4" rx="0.5" fill="#cbd5e1" />
                <circle cx="23" cy="12" r="2" fill="#cbd5e1" />
                {/* Resistor */}
                <rect x="36" y="18" width="16" height="5" rx="1.5" fill="#d97706" />
                {/* LED */}
                <circle cx="62" cy="28" r="7" fill="#ef4444" />
                <circle cx="60" cy="26" r="2" fill="#fca5a5" opacity="0.8" />
                {/* Connecting leads */}
                <path d="M 13 10 C 13 6, 36 6, 36 18" fill="none" stroke="#ef4444" strokeWidth="1.2" />
                <line x1="52" y1="20.5" x2="57" y2="24" stroke="#64748b" strokeWidth="1.2" />
                <path d="M 62 35 C 62 46, 23 46, 23 14" fill="none" stroke="#0f172a" strokeWidth="1.2" />
            </svg>
        );
    }

    if (type === "starter-pot-led") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* Potentiometer */}
                <circle cx="26" cy="28" r="14" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
                <circle cx="26" cy="28" r="9" fill="#0284c7" />
                <line x1="26" y1="28" x2="26" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                {/* Wire to LED */}
                <path d="M 38 28 Q 46 22 54 28" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                {/* LED */}
                <circle cx="60" cy="28" r="7" fill="#ef4444" />
                <circle cx="58" cy="26" r="2" fill="#fca5a5" opacity="0.8" />
            </svg>
        );
    }

    if (type === "starter-button-buzzer") {
        return (
            <svg viewBox="0 0 80 56" className="catalog-svg-art">
                {/* Pushbutton */}
                <rect x="12" y="18" width="22" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                <circle cx="23" cy="28" r="5" fill="#3b82f6" />
                {/* Connecting Wire */}
                <path d="M 34 28 Q 44 20 52 28" fill="none" stroke="#eab308" strokeWidth="1.2" />
                {/* Piezo Buzzer */}
                <circle cx="60" cy="28" r="12" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
                <circle cx="60" cy="28" r="4" fill="#1e293b" />
                {/* Sound waves */}
                <path d="M 72 23 A 6 6 0 0 1 72 33" fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
        );
    }

    // Default microchip fallback
    return (
        <svg viewBox="0 0 80 56" className="catalog-svg-art">
            <rect x="22" y="10" width="36" height="36" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="28" cy="16" r="2" fill="#475569" />
            <text x="40" y="32" fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle">IC</text>
            {[...Array(4)].map((_, i) => (
                <g key={i}>
                    <line x1="16" y1="16 + i * 8" x2="22" y2="16 + i * 8" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="58" y1="16 + i * 8" x2="64" y2="16 + i * 8" stroke="#94a3b8" strokeWidth="2" />
                </g>
            ))}
        </svg>
    );
}

function LeftSidebar({ onAddComponent }) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem("twinlab_sidebar_view_mode") || "list";
        } catch {
            return "list";
        }
    });
    const [showTip, setShowTip] = useState(true);

    const sidebarRef = useRef(null);

    // Auto-expire drag-hint after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTip(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Close sidebar on click outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const tabs = [
        {
            id: "all",
            title: "All Components",
            icon: "ri-apps-2-line",
            color: "#A855F7"
        },
        {
            id: "boards",
            title: "Boards & ICs",
            icon: "ri-cpu-line",
            color: "#FF8A00"
        },
        {
            id: "devices",
            title: "Sensors & Modules",
            icon: "ri-hard-drive-3-line",
            color: "#00D28F"
        },
        {
            id: "favorites",
            title: "Favorites",
            icon: "ri-star-line",
            color: "#FFD54A"
        }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

    const handleTabClick = (tabId) => {
        if (open && activeTab === tabId) {
            setOpen(false);
            return;
        }
        setActiveTab(tabId);
        setOpen(true);
    };

    const setViewModePref = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem("twinlab_sidebar_view_mode", mode);
        } catch {}
    };

    // Filter out wire tool (wire is drawn interactively between points)
    const EXCLUDED_TYPES = new Set(["wire", "wire-tool"]);

    const filteredComponents = COMPONENTS_CATALOG.filter((comp) => {
        if (EXCLUDED_TYPES.has(comp.type) || EXCLUDED_TYPES.has(comp.id)) {
            return false;
        }
        const matchesTab = activeTab === "all" ? true : comp.category === activeTab;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
                              comp.name.toLowerCase().includes(q) ||
                              (comp.desc && comp.desc.toLowerCase().includes(q)) ||
                              (comp.tag && comp.tag.toLowerCase().includes(q));
        return matchesTab && matchesSearch;
    });

    const handleDragStart = (e, component) => {
        e.dataTransfer.setData("application/twinlab-component", JSON.stringify(component));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <aside
            ref={sidebarRef}
            className={`left-sidebar ${open ? "open" : ""}`}
            style={{
                "--accent": currentTab.color
            }}
        >
            {/* ==========================================
                ICON RAIL (Always left-pinned inside container)
            ========================================== */}
            <div className="sidebar-icons">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`sidebar-icon ${isActive && open ? "active" : ""}`}
                            onClick={() => handleTabClick(tab.id)}
                            style={{
                                "--icon-color": tab.color
                            }}
                        >
                            <i className={tab.icon}></i>
                            <span className="tooltip">
                                {tab.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ==========================================
                PANEL (Unveils smoothly as container widens)
            ========================================== */}
            <div className="sidebar-panel">
                <div className="sidebar-header">
                    <div className="header-title-wrap">
                        <h3>{currentTab.title}</h3>
                        <span className="component-count">{filteredComponents.length} items</span>
                    </div>

                    <div className="header-actions">
                        {/* Segmented switch: Blocks vs List */}
                        <div className="view-mode-segmented">
                            <button
                                type="button"
                                className={`mode-seg-btn ${viewMode === "block" ? "active" : ""}`}
                                onClick={() => setViewModePref("block")}
                                title="Grid View"
                            >
                                <i className="ri-layout-grid-fill"></i>
                            </button>
                            <button
                                type="button"
                                className={`mode-seg-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewModePref("list")}
                                title="List View"
                            >
                                <i className="ri-list-check"></i>
                            </button>
                        </div>

                        {/* Close Cross Button */}
                        <button
                            type="button"
                            className="close-sidebar-btn"
                            onClick={() => setOpen(false)}
                            title="Close Sidebar"
                        >
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                </div>

                {/* Search Bar with Instant Clear */}
                <div className="sidebar-search">
                    <i className="ri-search-line"></i>
                    <input
                        type="text"
                        placeholder="Search boards, sensors, modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery("")} title="Clear search">
                            <i className="ri-close-circle-fill"></i>
                        </button>
                    )}
                </div>

                {/* Quick Hint Banner (Expires in 2s) */}
                {showTip && (
                    <div className="drag-hint">
                        <i className="ri-drag-move-fill"></i>
                        <span>Drag & drop onto workspace or click to add</span>
                    </div>
                )}

                {/* Component List / Grid */}
                <div className={`sidebar-content view-${viewMode}`}>
                    {filteredComponents.length > 0 ? (
                        filteredComponents.map((component) => (
                            <div
                                key={component.id}
                                className={`component-card card-${viewMode}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, component)}
                                onClick={() => {
                                    onAddComponent && onAddComponent(component);
                                    setOpen(false);
                                }}
                                title={`Click or drag to add ${component.name}`}
                            >
                                <div className="component-preview">
                                    {component.image ? (
                                        <img 
                                            src={component.image} 
                                            alt={component.name} 
                                            className="component-img"
                                            draggable={false}
                                        />
                                    ) : (
                                        <ComponentCatalogThumbnail component={component} />
                                    )}
                                    <span className="drag-pill">Drag</span>
                                </div>

                                <div className="component-info">
                                    <div className="component-title-row">
                                        <h4>{component.name}</h4>
                                        {component.tag && (
                                            <span className="component-tag">{component.tag}</span>
                                        )}
                                    </div>
                                    {viewMode === "list" && component.desc && (
                                        <p>{component.desc}</p>
                                    )}
                                </div>

                                {viewMode === "list" && (
                                    <button 
                                        className="quick-add-btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddComponent && onAddComponent(component);
                                            setOpen(false);
                                        }}
                                        title="Quick Add"
                                    >
                                        <i className="ri-add-line"></i>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <i className="ri-search-eye-line"></i>
                            <p>No components found</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

export default LeftSidebar;
