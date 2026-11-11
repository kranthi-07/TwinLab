import "./dashboard.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NewProjectModal from "../../components/NewProjectModal/NewProjectModal";

const PROJECTS_STORAGE_KEY = "twinlab_user_projects";
const ACTIVE_STORAGE_KEY = "twinlab_active_project";
const DRAFT_STORAGE_KEY = "twinlab_workspace_draft";

export const STARTER_TEMPLATES = [
    {
        id: "esp32",
        name: "ESP32 IoT Node",
        chip: "ESP32-S3",
        badge: "Dual-Core 240MHz",
        desc: "Integrated Wi-Fi 4 & BLE 5.0 microcontroller with rich GPIO breakouts for IoT nodes.",
        specs: ["Wi-Fi & Bluetooth", "44 GPIO Pins", "Hardware Crypto"],
        icon: "ri-cpu-line",
        accent: "#FF8A00"
    },
    {
        id: "arduino",
        name: "Arduino Uno R3",
        chip: "ATmega328P",
        badge: "8-Bit AVR 16MHz",
        desc: "The world's standard hardware prototyping base with 5V logic and solderless breadboard integration.",
        specs: ["14 Digital I/O", "6 PWM Outputs", "5V Tolerant"],
        icon: "ri-router-line",
        accent: "#3B9CFF"
    },
    {
        id: "pi",
        name: "Raspberry Pi Pico",
        chip: "RP2040",
        badge: "Dual Cortex-M0+",
        desc: "Ultra-fast silicon with programmable I/O (PIO), dual ARM cores, and flexible pin multiplexing.",
        specs: ["Dual 133MHz Cores", "8 PIO State Machines", "264KB SRAM"],
        icon: "ri-computer-line",
        accent: "#A855F7"
    },
    {
        id: "blank",
        name: "Blank Canvas",
        chip: "Modular",
        badge: "Open Prototyping",
        desc: "Completely clean solderless workspace ready for custom ICs, sensors, and freeform routing.",
        specs: ["Freeform Routing", "Multi-voltage Rails", "Custom Schematics"],
        icon: "ri-layout-grid-line",
        accent: "#10B981"
    }
];

const ARCHITECTURE_CORES = [
    {
        id: "esp32",
        name: "ESP32-S3 Pro",
        family: "Espressif Xtensa LX7",
        clock: "240 MHz",
        cores: "Dual-Core 32-bit",
        sram: "512 KB",
        flash: "8 MB QSPI",
        gpio: "44 Pins",
        protocols: ["Wi-Fi 4", "BLE 5.0", "I2C", "SPI", "UART", "I2S"],
        accent: "#FF8A00",
        desc: "High-performance IoT powerhouse with dedicated vector instructions for AI edge acceleration and integrated wireless PHY.",
        status: "ONLINE • OPTIMIZED",
        pins: [
            { pin: "GPIO 1", type: "ADC / TOUCH", state: "HIGH 3.3V" },
            { pin: "GPIO 2", type: "BOOT / PWM", state: "PWM 64%" },
            { pin: "GPIO 19", type: "USB D-", state: "SYNC" },
            { pin: "GPIO 20", type: "USB D+", state: "SYNC" },
            { pin: "GPIO 43", type: "U0TXD", state: "ACTIVE" },
            { pin: "GPIO 44", type: "U0RXD", state: "LISTENING" }
        ]
    },
    {
        id: "arduino",
        name: "ATmega328P AVR",
        family: "Microchip 8-bit RISC",
        clock: "16 MHz",
        cores: "Single-Core 8-bit",
        sram: "2 KB",
        flash: "32 KB ISP",
        gpio: "14 Digital + 6 Analog",
        protocols: ["UART", "SPI", "I2C (TWI)"],
        accent: "#3B9CFF",
        desc: "The timeless embedded standard. Rugged 5V TTL logic with cycle-accurate opcode execution and hardware timer interrupts.",
        status: "ACTIVE • 5.0V LOGIC",
        pins: [
            { pin: "PIN D13", type: "SCK / LED", state: "CLK 1Hz" },
            { pin: "PIN D11", type: "MOSI / PWM", state: "READY" },
            { pin: "PIN D10", type: "SS / PWM", state: "HIGH 5V" },
            { pin: "PIN A0", type: "10-bit ADC", state: "2.54V IN" },
            { pin: "PIN A4", type: "I2C SDA", state: "PULLUP" },
            { pin: "PIN A5", type: "I2C SCL", state: "100 kHz" }
        ]
    },
    {
        id: "pi",
        name: "RP2040 Dual ARM",
        family: "Raspberry Pi Silicon",
        clock: "133 MHz",
        cores: "Dual Cortex-M0+",
        sram: "264 KB Striped",
        flash: "16 MB External",
        gpio: "30 Multi-Function",
        protocols: ["8x PIO State Machines", "Dual UART", "Dual SPI", "Dual I2C"],
        accent: "#A855F7",
        desc: "Modern silicon innovation with 8 programmable PIO state machines capable of synthesizing custom DVI, WS2812, and high-speed buses.",
        status: "RUNNING • PIO SYNC",
        pins: [
            { pin: "GP0", type: "UART0 TX", state: "115200" },
            { pin: "GP1", type: "UART0 RX", state: "LISTENING" },
            { pin: "GP2", type: "PIO0 SM0", state: "SYNTH" },
            { pin: "GP16", type: "SPI0 RX", state: "IDLE" },
            { pin: "GP18", type: "SPI0 SCK", state: "HIGH" },
            { pin: "GP25", type: "ONBOARD LED", state: "PULSE" }
        ]
    },
    {
        id: "logic",
        name: "74HC CMOS Matrix",
        family: "Discrete High-Speed Logic",
        clock: "50 MHz Max",
        cores: "Quad / Hex Gates",
        sram: "Flip-Flop Latches",
        flash: "Combinatorial",
        gpio: "Multi-gate DIP-14",
        protocols: ["TTL / CMOS", "74HC08 AND", "74HC32 OR", "74HC04 NOT", "74HC00 NAND"],
        accent: "#10B981",
        desc: "Hardware-level combinatorial and sequential logic building blocks. Zero latency sub-nanosecond gate response for pure silicon synthesis.",
        status: "BUS STEADY • CMOS",
        pins: [
            { pin: "GATE 1A", type: "INPUT", state: "HIGH" },
            { pin: "GATE 1B", type: "INPUT", state: "HIGH" },
            { pin: "GATE 1Y", type: "OUTPUT (AND)", state: "LOGIC 1" },
            { pin: "GATE 2A", type: "INPUT", state: "LOW" },
            { pin: "GATE 2B", type: "INPUT", state: "HIGH" },
            { pin: "GATE 2Y", type: "OUTPUT (AND)", state: "LOGIC 0" }
        ]
    }
];

function getInitialProjects() {
    try {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Storage error:", e);
    }

    const defaultProject = {
        id: "proj-1",
        name: "Project - 1",
        template: "esp32",
        chip: "ESP32-S3",
        accent: "#FF8A00",
        icon: "ri-cpu-line",
        status: "Active",
        lastEdited: "Just now",
        updatedAt: new Date().toISOString(),
        components: [
            { id: "esp32-1", type: "esp32-devkit", name: "ESP32 DevKit V1", x: 60, y: 40 },
            { id: "bb-1", type: "breadboard-half", name: "Breadboard", x: 200, y: 40 },
            { id: "res-1", type: "resistor", name: "Resistor", x: 260, y: 70 },
            { id: "led-1", type: "led", name: "LED Blue", color: "#3b82f6", x: 300, y: 70 }
        ],
        wires: [
            { id: "w1", color: "#3b82f6", points: [{ x: 130, y: 70 }, { x: 260, y: 70 }] },
            { id: "w2", color: "#0f172a", points: [{ x: 130, y: 90 }, { x: 300, y: 90 }] }
        ]
    };

    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([defaultProject]));
        localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(defaultProject));
    } catch (e) {}

    return [defaultProject];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } }
};

// ============================================================
// DYNAMIC REAL PROJECT LIVE CIRCUIT MINI PREVIEW
// 90%-100% Close-to-Real Hardware Renderers with Symmetrical Centering
// ============================================================
function renderMiniComponent(c, id) {
    const cx = c.x || 0;
    const cy = c.y || 0;
    const rot = c.rotation || 0;

    // 1. Breadboards (Full, Half, Mini)
    if (c.type?.startsWith("breadboard")) {
        const bbW = c.type === "breadboard-full" ? 540 : c.type === "breadboard-mini" ? 180 : 320;
        const bbH = c.type === "breadboard-mini" ? 95 : 110;
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                {/* Real Cream Beveled Chassis */}
                <rect width={bbW} height={bbH} rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="3" y="3" width={bbW - 6} height={bbH - 6} rx="4" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                {/* Power Bus Rails (+ Red / - Blue) */}
                <line x1="12" y1="12" x2={bbW - 12} y2="12" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="20" x2={bbW - 12} y2="20" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1={bbH - 20} x2={bbW - 12} y2={bbH - 20} stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1={bbH - 12} x2={bbW - 12} y2={bbH - 12} stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" />
                {/* Center IC DIP Valley Trough */}
                <rect x="8" y={bbH / 2 - 5} width={bbW - 16} height="10" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />
                {/* Terminal Tie Dots across rows */}
                {[...Array(Math.floor(bbW / 18))].map((_, i) => (
                    <g key={i} transform={`translate(${16 + i * 18}, 0)`}>
                        <circle cx="0" cy="30" r="1.2" fill="#64748b" />
                        <circle cx="0" cy="36" r="1.2" fill="#64748b" />
                        <circle cx="0" cy="42" r="1.2" fill="#64748b" />
                        <circle cx="0" cy={bbH - 42} r="1.2" fill="#64748b" />
                        <circle cx="0" cy={bbH - 36} r="1.2" fill="#64748b" />
                        <circle cx="0" cy={bbH - 30} r="1.2" fill="#64748b" />
                    </g>
                ))}
                <text x={bbW / 2} y={bbH / 2 + 2.5} fill="#94a3b8" fontSize="6" fontWeight="bold" textAnchor="middle" letterSpacing="0.1em">BREADBOARD</text>
            </g>
        );
    }

    // 2. Arduino Uno / Mega / Nano
    if (c.type?.includes("arduino")) {
        const isNano = c.type === "arduino-nano";
        if (isNano) {
            return (
                <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                    <rect width="80" height="36" rx="4" fill="#008784" stroke="#004d40" strokeWidth="1.2" />
                    <rect x="0" y="8" width="14" height="20" rx="1.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
                    <rect x="34" y="10" width="16" height="16" rx="2" fill="#09090b" transform="rotate(45 42 18)" />
                    <rect x="4" y="2" width="72" height="4" fill="#0f172a" />
                    <rect x="4" y="30" width="72" height="4" fill="#0f172a" />
                    <circle cx="22" cy="18" r="2" fill="#ef4444" />
                    <circle cx="68" cy="14" r="1.5" fill="#10b981" />
                    <text x="56" y="22" fill="#ffffff" fontSize="5" fontWeight="900">NANO</text>
                </g>
            );
        }
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                {/* Official Teal Arduino PCB */}
                <rect width="138" height="98" rx="6" fill="#008784" stroke="#004d40" strokeWidth="1.5" />
                {/* Silver USB-B Jack */}
                <rect x="0" y="10" width="24" height="22" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <rect x="4" y="14" width="16" height="14" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Black DC Barrel Jack with Center Pin */}
                <rect x="0" y="66" width="28" height="22" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <circle cx="14" cy="77" r="4" fill="#64748b" />
                <circle cx="14" cy="77" r="1.5" fill="#000000" />
                {/* ATmega328P DIP-28 Chip & Socket */}
                <rect x="42" y="40" width="56" height="18" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <circle cx="45" cy="49" r="1.8" fill="#3f3f46" />
                <text x="70" y="52" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">ATmega328P</text>
                {/* 16.000 MHz Crystal Oscillator */}
                <ellipse cx="38" cy="24" rx="7" ry="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Dual Female Header Strips (Digital top, Power/Analog bottom) */}
                <rect x="34" y="4" width="98" height="9" rx="1.5" fill="#18181b" stroke="#27272a" strokeWidth="0.8" />
                <rect x="34" y="85" width="98" height="9" rx="1.5" fill="#18181b" stroke="#27272a" strokeWidth="0.8" />
                {/* Reset Pushbutton */}
                <circle cx="28" cy="38" r="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
                {/* Status LEDs (PWR Green, Pin 13 Yellow, TX/RX) */}
                <circle cx="120" cy="20" r="2.8" fill="#10b981" filter="drop-shadow(0 0 3px #10b981)" />
                <circle cx="120" cy="32" r="2.8" fill="#f59e0b" filter="drop-shadow(0 0 3px #f59e0b)" />
                <text x="74" y="74" fill="#ffffff" fontSize="8" fontWeight="900" textAnchor="middle" letterSpacing="0.08em">ARDUINO UNO</text>
            </g>
        );
    }

    // 3. ESP32 DevKit / ESP32-S3
    if (c.type?.includes("esp32")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                {/* Matte Black PCB */}
                <rect width="90" height="130" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                {/* Gold PCB Meander Antenna at top */}
                <path d="M 28 6 L 28 14 L 36 14 L 36 6 L 44 6 L 44 14 L 52 14 L 52 6 L 60 6" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
                {/* Silver RF Metal Shield Can */}
                <rect x="18" y="20" width="54" height="46" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="45" y="42" fill="#334155" fontSize="6.5" fontWeight="900" textAnchor="middle">ESPRESSIF</text>
                <text x="45" y="52" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">ESP32-S3</text>
                {/* USB-C Receptacle at bottom */}
                <rect x="34" y="118" width="22" height="12" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                {/* EN & BOOT gold tactile switches */}
                <circle cx="22" cy="116" r="3.5" fill="#d97706" />
                <circle cx="68" cy="116" r="3.5" fill="#d97706" />
                {/* Dual 19-Pin Black Headers along left and right */}
                <rect x="4" y="10" width="8" height="110" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
                <rect x="78" y="10" width="8" height="110" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.8" />
                {/* PWR Red and GPIO Blue LEDs */}
                <circle cx="24" cy="80" r="2.5" fill="#ef4444" filter="drop-shadow(0 0 3px #ef4444)" />
                <circle cx="66" cy="80" r="2.5" fill="#3b82f6" filter="drop-shadow(0 0 3px #3b82f6)" />
            </g>
        );
    }

    // 4. PIR Motion Sensor (HC-SR501)
    if (c.type === "sensor-pir") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="105" height="75" rx="5" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
                <circle cx="8" cy="8" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="97" cy="8" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="8" cy="67" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="97" cy="67" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                {/* Concentric Faceted Fresnel Dome Lens */}
                <circle cx="52.5" cy="36" r="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="52.5" cy="36" r="21" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="52.5" cy="36" r="14" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="52.5" cy="36" r="7" fill="none" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="24.5" y1="36" x2="80.5" y2="36" stroke="#e2e8f0" strokeWidth="0.8" />
                <line x1="52.5" y1="8" x2="52.5" y2="64" stroke="#e2e8f0" strokeWidth="0.8" />
                {/* Dual Orange Sensitivity & Time Trimmers */}
                <rect x="12" y="28" width="10" height="16" rx="2" fill="#ea580c" />
                <circle cx="17" cy="36" r="3" fill="#fb923c" />
                <rect x="83" y="28" width="10" height="16" rx="2" fill="#ea580c" />
                <circle cx="88" cy="36" r="3" fill="#fb923c" />
                {/* 3 Header Pins at bottom */}
                <rect x="44" y="68" width="17" height="7" rx="1" fill="#0f172a" />
                <circle cx="47" cy="72" r="1.5" fill="#ca8a04" />
                <circle cx="52.5" cy="72" r="1.5" fill="#ca8a04" />
                <circle cx="58" cy="72" r="1.5" fill="#ca8a04" />
                <text x="52.5" y="14" fill="#ffffff" fontSize="4.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">PIR MOTION SENSOR</text>
            </g>
        );
    }

    // 5. Ultrasonic Sensor (HC-SR04)
    if (c.type === "sensor-ultrasonic") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="84" height="48" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                {/* Dual Aluminum Transducer Cylinders (T and R) */}
                <circle cx="22" cy="22" r="16" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="22" cy="22" r="12" fill="#0f172a" />
                <circle cx="62" cy="22" r="16" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
                <circle cx="62" cy="22" r="12" fill="#0f172a" />
                <text x="22" y="26" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">T</text>
                <text x="62" y="26" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">R</text>
                {/* Crystal Oscillator */}
                <rect x="38" y="18" width="8" height="14" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                {/* 4 Header Pins at bottom */}
                <rect x="32" y="42" width="20" height="6" rx="1" fill="#0f172a" />
                <circle cx="35" cy="45" r="1.2" fill="#ca8a04" />
                <circle cx="39" cy="45" r="1.2" fill="#ca8a04" />
                <circle cx="43" cy="45" r="1.2" fill="#ca8a04" />
                <circle cx="47" cy="45" r="1.2" fill="#ca8a04" />
                <text x="42" y="10" fill="#ffffff" fontSize="4" fontWeight="bold" textAnchor="middle">HC-SR04</text>
            </g>
        );
    }

    // 6. Mabuchi 130 DC Motor (Matching Image 1: Bare Axle or Propeller)
    if (c.type === "motor-dc") {
        const isAxle = c.accessory === "axle";
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                {/* Brushed Steel Can (Diameter 80px centered at 24, -58) */}
                <circle cx="24" cy="-58" r="40" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                <circle cx="24" cy="-58" r="36" fill="#cbd5e1" />
                <circle cx="24" cy="-58" r="32" fill="#64748b" opacity="0.15" />
                {/* Stamped Ventilation Louvers */}
                <path d="M -8 -66 C -12 -62, -12 -54, -8 -50" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M 56 -66 C 60 -62, 60 -54, 56 -50" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Two Threaded M2 Screw Mounting Holes */}
                <circle cx="8" cy="-58" r="2.8" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                <circle cx="40" cy="-58" r="2.8" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
                {/* Center Raised Zinc Collar Boss */}
                <circle cx="24" cy="-58" r="14" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                {/* Sintered Bronze Bushing */}
                <circle cx="24" cy="-58" r="7" fill="#d97706" stroke="#92400e" strokeWidth="1" />
                {/* Hardened Steel Axle Shaft */}
                <circle cx="24" cy="-58" r="3.2" fill="#334155" />
                {/* 3-Blade Aviation Propeller (if not bare axle) */}
                {!isAxle && (
                    <g transform="translate(24, -58)">
                        <path d="M 0 0 C -5 -16, -10 -28, 0 -34 C 10 -28, 5 -16, 0 0" fill="#0ea5e9" stroke="#0284c7" strokeWidth="1" />
                        <path d="M 0 0 C -5 -16, -10 -28, 0 -34 C 10 -28, 5 -16, 0 0" fill="#0ea5e9" stroke="#0284c7" strokeWidth="1" transform="rotate(120)" />
                        <path d="M 0 0 C -5 -16, -10 -28, 0 -34 C 10 -28, 5 -16, 0 0" fill="#0ea5e9" stroke="#0284c7" strokeWidth="1" transform="rotate(240)" />
                        <circle cx="0" cy="0" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                    </g>
                )}
                {/* Flexible Hookup Leads to (0, 0) and (48, 0) */}
                <path d="M 10 -35 C 6 -15, 2 -8, 0 0" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 38 -35 C 42 -15, 46 -8, 48 0" stroke="#18181b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="48" cy="0" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <text x="24" y="-84" fill="#ffffff" fontSize="4.5" fontWeight="900" textAnchor="middle">130 DC MOTOR</text>
            </g>
        );
    }

    // 6b. TT Geared DC Motor (Yellow BO Motor - Image 2)
    if (c.type === "motor-geared" || c.type === "motor-bo") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                {/* Yellow ABS Gearbox Body */}
                <rect x="-6" y="-98" width="60" height="52" rx="5" fill="#facc15" stroke="#ca8a04" strokeWidth="1.8" />
                {/* Assembly Screws on Gearbox */}
                <circle cx="0" cy="-92" r="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
                <circle cx="48" cy="-92" r="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
                <circle cx="48" cy="-52" r="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.6" />
                {/* White Nylon D-Shaft */}
                <circle cx="24" cy="-72" r="10" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                <circle cx="24" cy="-72" r="6.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                <rect x="22" y="-78.5" width="4" height="13" fill="#e2e8f0" />
                <circle cx="24" cy="-72" r="1.5" fill="#64748b" />
                {/* Rear 130 DC Motor Casing */}
                <rect x="6" y="-46" width="36" height="24" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
                {/* Clear Plastic Retention Strap (Translucent Clip) */}
                <rect x="3" y="-39" width="42" height="9" rx="2" fill="rgba(241,245,249,0.55)" stroke="#94a3b8" strokeWidth="0.8" />
                {/* Endbell Solder Terminals */}
                <rect x="12" y="-22" width="24" height="5" rx="1.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                {/* Flexible Hookup Leads */}
                <path d="M 15 -18 C 10 -10, 4 -5, 0 0" stroke="#ef4444" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M 33 -18 C 38 -10, 44 -5, 48 0" stroke="#18181b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <circle cx="48" cy="0" r="3" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                <text x="24" y="-103" fill="#ffffff" fontSize="4.5" fontWeight="900" textAnchor="middle">TT BO MOTOR</text>
            </g>
        );
    }

    // 7. Micro Servo SG90
    if (c.type === "servo-sg90") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="64" height="38" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                <circle cx="20" cy="19" r="12" fill="#0369a1" />
                <rect x="18" y="5" width="4" height="28" rx="2" fill="#ffffff" transform="rotate(35 20 19)" />
                <circle cx="20" cy="19" r="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <rect x="-6" y="15" width="6" height="8" rx="1" fill="#0284c7" />
                <circle cx="-3" cy="19" r="1.5" fill="#ca8a04" />
                <rect x="64" y="15" width="6" height="8" rx="1" fill="#0284c7" />
                <circle cx="67" cy="19" r="1.5" fill="#ca8a04" />
                <text x="44" y="23" fill="#ffffff" fontSize="5.5" fontWeight="900" textAnchor="middle">SG90 9g</text>
            </g>
        );
    }

    // 8. 9V Battery
    if (c.type === "battery-9v") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="48" height="68" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                <rect x="0" y="0" width="48" height="12" rx="2" fill="#d97706" />
                <rect x="10" y="-8" width="9" height="9" rx="1.5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                <circle cx="34" cy="-4" r="4.5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                <rect x="8" y="24" width="32" height="16" rx="2" fill="#0284c7" opacity="0.85" />
                <text x="24" y="35" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle">9.0V</text>
                <text x="24" y="56" fill="#94a3b8" fontSize="4.5" fontWeight="bold" textAnchor="middle">TWINLAB</text>
            </g>
        );
    }

    // 9. AA / AAA Battery Pack
    if (c.type?.startsWith("battery-aa")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="76" height="52" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="6" y="8" width="28" height="36" rx="2" fill="#334155" />
                <rect x="42" y="8" width="28" height="36" rx="2" fill="#334155" />
                <rect x="18" y="5" width="4" height="4" fill="#d97706" />
                <rect x="54" y="5" width="4" height="4" fill="#d97706" />
                <text x="20" y="28" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">AA</text>
                <text x="56" y="28" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">AA</text>
            </g>
        );
    }

    // 10. Coin Cell CR2032 3V
    if (c.type === "battery-coin") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="18" cy="18" r="17" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="18" cy="18" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                <text x="18" y="13" fill="#ef4444" fontSize="7" fontWeight="bold" textAnchor="middle">+</text>
                <text x="18" y="20" fill="#334155" fontSize="5" fontWeight="900" textAnchor="middle">CR2032</text>
                <text x="18" y="26" fill="#64748b" fontSize="4" fontWeight="bold" textAnchor="middle">3V</text>
            </g>
        );
    }

    // 11. Electrolytic Capacitor
    if (c.type === "capacitor-electrolytic") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="24" height="36" rx="4" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.2" />
                <rect x="2" y="0" width="20" height="5" rx="1" fill="#cbd5e1" />
                <rect x="17" y="0" width="5" height="36" fill="#ffffff" />
                <text x="19.5" y="14" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">−</text>
                <text x="19.5" y="26" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">−</text>
                <line x1="6" y1="36" x2="6" y2="48" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="18" y1="36" x2="18" y2="48" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="6" cy="48" r="2" fill="#ca8a04" />
                <circle cx="18" cy="48" r="2" fill="#ca8a04" />
                <text x="10" y="22" fill="#ffffff" fontSize="4" fontWeight="bold" textAnchor="middle">100µF</text>
            </g>
        );
    }

    // 12. Ceramic Capacitor
    if (c.type === "capacitor-ceramic") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="12" cy="12" r="11" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                <text x="12" y="14" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle">104</text>
                <path d="M 7 22 L 7 28 L 5 32 L 5 38" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                <path d="M 17 22 L 17 28 L 19 32 L 19 38" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                <circle cx="5" cy="38" r="1.8" fill="#ca8a04" />
                <circle cx="19" cy="38" r="1.8" fill="#ca8a04" />
            </g>
        );
    }

    // 13. Potentiometer
    if (c.type === "potentiometer") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="18" cy="18" r="17" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                <circle cx="18" cy="18" r="11" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                <line x1="18" y1="18" x2="26" y2="10" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="6" y1="35" x2="6" y2="44" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="18" y1="35" x2="18" y2="44" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="30" y1="35" x2="30" y2="44" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="6" cy="44" r="2" fill="#ca8a04" />
                <circle cx="18" cy="44" r="2" fill="#ca8a04" />
                <circle cx="30" cy="44" r="2" fill="#ca8a04" />
                <text x="18" y="30" fill="#ffffff" fontSize="4.5" fontWeight="bold" textAnchor="middle">10kΩ</text>
            </g>
        );
    }

    // 14. Transistor (TO-92 NPN / PNP)
    if (c.type?.includes("transistor")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <path d="M 2 4 C 2 -4, 22 -4, 22 4 L 22 18 C 22 22, 2 22, 2 18 Z" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <text x="12" y="11" fill="#cbd5e1" fontSize="4.5" fontWeight="bold" textAnchor="middle">2N2222</text>
                <line x1="5" y1="21" x2="2" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
                <line x1="12" y1="21" x2="12" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
                <line x1="19" y1="21" x2="22" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
                <circle cx="2" cy="34" r="1.8" fill="#ca8a04" />
                <circle cx="12" cy="34" r="1.8" fill="#ca8a04" />
                <circle cx="22" cy="34" r="1.8" fill="#ca8a04" />
            </g>
        );
    }

    // 15. N-MOSFET (TO-220 IRF540N)
    if (c.type?.includes("mosfet")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect x="4" y="0" width="28" height="14" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <circle cx="18" cy="7" r="3" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
                <rect x="0" y="14" width="36" height="26" rx="2" fill="#18181b" stroke="#27272a" strokeWidth="1" />
                <text x="18" y="30" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle">IRF540N</text>
                <line x1="6" y1="40" x2="6" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="18" y1="40" x2="18" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="30" y1="40" x2="30" y2="54" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="6" cy="54" r="2" fill="#ca8a04" />
                <circle cx="18" cy="54" r="2" fill="#ca8a04" />
                <circle cx="30" cy="54" r="2" fill="#ca8a04" />
            </g>
        );
    }

    // 16. Piezo Buzzer
    if (c.type === "buzzer") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="18" cy="18" r="17" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
                <circle cx="18" cy="18" r="7" fill="#000000" />
                <circle cx="18" cy="18" r="13" fill="none" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="28" y="14" fill="#ef4444" fontSize="6" fontWeight="bold">+</text>
                <text x="18" y="30" fill="#94a3b8" fontSize="4.5" textAnchor="middle">BUZZER</text>
            </g>
        );
    }

    // 17. Pushbutton
    if (c.type === "pushbutton" || c.type === "button") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="28" height="28" rx="3" fill="#18181b" stroke="#334155" strokeWidth="1" />
                <rect x="3" y="3" width="22" height="22" rx="2" fill="#94a3b8" />
                <circle cx="14" cy="14" r="7" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
                <circle cx="5" cy="5" r="1" fill="#475569" />
                <circle cx="23" cy="5" r="1" fill="#475569" />
                <circle cx="5" cy="23" r="1" fill="#475569" />
                <circle cx="23" cy="23" r="1" fill="#475569" />
            </g>
        );
    }

    // 18. Slide / Toggle Switch
    if (c.type?.includes("switch")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="32" height="16" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <rect x="4" y="3" width="10" height="10" rx="1.5" fill="#0f172a" />
                <line x1="6" y1="16" x2="6" y2="24" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="16" y1="16" x2="16" y2="24" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="26" y1="16" x2="26" y2="24" stroke="#cbd5e1" strokeWidth="1.5" />
            </g>
        );
    }

    // 19. DIP IC Logic Gates (74HC08, 74HC00, L293D)
    if (c.type?.startsWith("ic-")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="68" height="26" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1" />
                <path d="M 0 9 A 4 4 0 0 1 0 17" fill="none" stroke="#27272a" strokeWidth="1" />
                <circle cx="6" cy="6" r="1.5" fill="#3f3f46" />
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <g key={i}>
                        <rect x={10 + i * 8} y="-4" width="3.5" height="4" fill="#cbd5e1" />
                        <rect x={10 + i * 8} y="26" width="3.5" height="4" fill="#cbd5e1" />
                    </g>
                ))}
                <text x="36" y="16" fill="#ffffff" fontSize="5.5" fontWeight="bold" textAnchor="middle" letterSpacing="0.05em">
                    {c.name?.slice(0, 7) || "74HC08"}
                </text>
            </g>
        );
    }

    // 20. 16x2 Character LCD Module
    if (c.type?.startsWith("lcd")) {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="140" height="54" rx="4" fill="#15803d" stroke="#166534" strokeWidth="1.2" />
                <rect x="12" y="8" width="116" height="38" rx="2" fill="#09090b" stroke="#334155" strokeWidth="1" />
                <rect x="18" y="13" width="104" height="28" rx="2" fill="#0284c7" />
                <text x="24" y="24" fill="#ffffff" fontSize="6" fontFamily="monospace" fontWeight="bold">TWINLAB X LIVE</text>
                <text x="24" y="34" fill="#ffffff" fontSize="5" fontFamily="monospace">120 FPS NATIVE</text>
                <rect x="14" y="2" width="48" height="4" fill="#ca8a04" />
            </g>
        );
    }

    // 21. 5mm LED
    if (c.type === "led") {
        const ledCol = c.color || "#ef4444";
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="12" cy="12" r="10" fill={ledCol} opacity="0.9" filter="drop-shadow(0 0 6px currentColor)" />
                <circle cx="10" cy="9" r="4" fill="#ffffff" opacity="0.6" />
                <line x1="7" y1="22" x2="7" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
                <line x1="17" y1="22" x2="17" y2="34" stroke="#cbd5e1" strokeWidth="1.2" />
                <circle cx="7" cy="34" r="1.8" fill="#ca8a04" />
                <circle cx="17" cy="34" r="1.8" fill="#ca8a04" />
            </g>
        );
    }

    // 22. Resistor
    if (c.type === "resistor") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <line x1="0" y1="10" x2="48" y2="10" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="10" y="4" width="28" height="12" rx="3" fill="#e2d9c8" stroke="#a89f91" strokeWidth="0.8" />
                <rect x="14" y="4" width="3" height="12" fill="#78350f" />
                <rect x="20" y="4" width="3" height="12" fill="#09090b" />
                <rect x="26" y="4" width="3" height="12" fill="#dc2626" />
                <rect x="33" y="4" width="2.5" height="12" fill="#ca8a04" />
            </g>
        );
    }

    // 23. Photoresistor LDR
    if (c.type === "photoresistor") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <circle cx="14" cy="14" r="13" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
                <path d="M 5 14 Q 9 8 14 14 T 23 14" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                <line x1="7" y1="27" x2="7" y2="38" stroke="#cbd5e1" strokeWidth="1.2" />
                <line x1="21" y1="27" x2="21" y2="38" stroke="#cbd5e1" strokeWidth="1.2" />
            </g>
        );
    }

    // 24. Multimeter
    if (c.type === "multimeter") {
        return (
            <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
                <rect width="80" height="110" rx="8" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="8" y="8" width="64" height="32" rx="3" fill="#09090b" />
                <text x="40" y="28" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold" textAnchor="middle">5.00 V</text>
                <circle cx="40" cy="68" r="18" fill="#18181b" stroke="#334155" strokeWidth="1.2" />
                <circle cx="40" cy="68" r="6" fill="#ca8a04" />
                <line x1="40" y1="68" x2="40" y2="52" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                <circle cx="28" cy="98" r="4" fill="#ef4444" />
                <circle cx="52" cy="98" r="4" fill="#09090b" />
            </g>
        );
    }

    // Default High-Fidelity Silicon Block Fallback
    return (
        <g key={c.id || id} transform={`translate(${cx}, ${cy}) rotate(${rot})`}>
            <rect width="36" height="24" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <circle cx="4" cy="4" r="1.5" fill="#ca8a04" />
            <text x="18" y="15" fill="#94a3b8" fontSize="5" fontWeight="bold" textAnchor="middle">{c.name?.slice(0, 6) || "MODULE"}</text>
        </g>
    );
}

function ProjectCircuitMiniPreview({ project, onOpen }) {
    const comps = project.components || [];
    const wires = project.wires || [];
    const hasComps = comps.length > 0;

    // Component dimension lookup for precise bounding box
    const getCompBounds = (c) => {
        const x = c.x || 0;
        const y = c.y || 0;
        let w = 48, h = 48;
        if (c.type?.startsWith("breadboard")) {
            w = c.type === "breadboard-full" ? 540 : c.type === "breadboard-mini" ? 180 : 320;
            h = 105;
        } else if (c.type?.includes("arduino")) {
            w = 140; h = 100;
        } else if (c.type?.includes("esp32")) {
            w = 90; h = 130;
        } else if (c.type === "sensor-pir") {
            w = 105; h = 75;
        } else if (c.type === "sensor-ultrasonic") {
            w = 84; h = 48;
        } else if (c.type === "motor-dc") {
            w = 80; h = 80;
        } else if (c.type?.startsWith("lcd")) {
            w = 140; h = 54;
        } else if (c.type === "battery-9v") {
            w = 48; h = 68;
        } else if (c.type?.startsWith("battery-aa")) {
            w = 76; h = 52;
        } else if (c.type?.startsWith("ic-")) {
            w = 68; h = 26;
        } else if (c.type === "multimeter") {
            w = 80; h = 110;
        } else if (c.type === "servo-sg90") {
            w = 64; h = 38;
        }
        return { minX: x, maxX: x + w, minY: y, maxY: y + h };
    };

    // Calculate symmetrical bounding box centered around circuit coordinates
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    if (hasComps) {
        comps.forEach(c => {
            const b = getCompBounds(c);
            minX = Math.min(minX, b.minX);
            maxX = Math.max(maxX, b.maxX);
            minY = Math.min(minY, b.minY);
            maxY = Math.max(maxY, b.maxY);
        });
        if (wires.length > 0) {
            wires.forEach(w => {
                (w.points || []).forEach(pt => {
                    minX = Math.min(minX, pt.x);
                    maxX = Math.max(maxX, pt.x);
                    minY = Math.min(minY, pt.y);
                    maxY = Math.max(maxY, pt.y);
                });
            });
        }
    } else {
        minX = 0; maxX = 360; minY = 0; maxY = 180;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const rawW = Math.max(260, maxX - minX);
    const rawH = Math.max(130, maxY - minY);

    // Maintain a comfortable 2.05:1 aspect ratio centered symmetrically with balanced margins!
    const padding = 55;
    const targetAspect = 2.05;
    let finalW = rawW + padding * 2;
    let finalH = rawH + padding * 2;
    if (finalW / finalH < targetAspect) {
        finalW = finalH * targetAspect;
    } else {
        finalH = finalW / targetAspect;
    }

    const viewBoxX = Math.round(centerX - finalW / 2);
    const viewBoxY = Math.round(centerY - finalH / 2);
    const viewBox = `${viewBoxX} ${viewBoxY} ${Math.round(finalW)} ${Math.round(finalH)}`;

    return (
        <motion.div 
            className="hero-real-twin-preview"
            whileHover={{ y: -3, borderColor: project.accent || "#ff8a00" }}
            onClick={() => onOpen(project)}
            title="Click to open this simulated digital twin in workspace"
        >
            {/* Corner Decorators */}
            <div className="tech-corner-decor tl"></div>
            <div className="tech-corner-decor tr"></div>
            <div className="tech-corner-decor bl"></div>
            <div className="tech-corner-decor br"></div>

            {/* Top Status */}
            <div className="mini-preview-top">
                <div className="mini-badge-wrap">
                    <span className="live-pill">
                        <span className="live-dot pulse" />
                        ACTIVE TWIN SIMULATION
                    </span>
                    <span className="live-fps-tag font-mono">120 FPS</span>
                </div>
                <span className="mini-chip-tag font-mono">{project.chip || "Modular"}</span>
            </div>

            {/* Dynamic Mini Circuit Simulation Canvas */}
            <div className="mini-circuit-canvas">
                <svg className="mini-circuit-svg" viewBox={viewBox}>
                    <defs>
                        <pattern id="miniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="8" cy="8" r="0.6" fill="rgba(255,255,255,0.18)" />
                        </pattern>
                    </defs>
                    <rect x={viewBoxX} y={viewBoxY} width={finalW} height={finalH} fill="url(#miniGrid)" />

                    {/* Wires with Live Current Pulsing */}
                    {wires.map((w, idx) => {
                        const pts = w.points || [];
                        if (pts.length < 2) return null;
                        const d = `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[1].x) / 2} ${Math.min(pts[0].y, pts[1].y) - 15} ${pts[1].x} ${pts[1].y}`;
                        return (
                            <path
                                key={w.id || idx}
                                d={d}
                                stroke={w.color || "#10b981"}
                                strokeWidth="2.4"
                                fill="none"
                                strokeDasharray="5 3"
                                className="mini-signal-wire"
                            />
                        );
                    })}

                    {/* Highly-Detailed 90%-100% Real Components */}
                    {comps.map((c, idx) => renderMiniComponent(c, idx))}
                </svg>
            </div>

            {/* Bottom Meta Bar */}
            <div className="mini-preview-meta">
                <div className="mini-project-ident">
                    <i className={project.icon || "ri-cpu-line"} style={{ color: project.accent || "#ff8a00" }} />
                    <div className="mini-project-names">
                        <h4>{project.name}</h4>
                        <span>{comps.length} Elements • {wires.length} Wires • {project.lastEdited || "Active"}</span>
                    </div>
                </div>

                <div className="mini-preview-action font-mono">
                    <span>Open in Workspace</span>
                    <i className="ri-arrow-right-line" />
                </div>
            </div>
        </motion.div>
    );
}

function Dashboard({ onOpenWorkspace }) {
    const [projects, setProjects] = useState(getInitialProjects);
    const [openModal, setOpenModal] = useState(false);
    const [selectedTemplateForModal, setSelectedTemplateForModal] = useState("esp32");
    const [activeCoreTab, setActiveCoreTab] = useState("esp32");
    const [projectFilter, setProjectFilter] = useState("all");

    // Sync with localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setProjects(parsed);
                }
            }
        } catch (e) {}
    }, []);

    const getNextProjectName = () => {
        let maxNum = 0;
        projects.forEach(p => {
            const match = p.name && p.name.match(/^Project\s*-\s*(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `Project - ${maxNum + 1}`;
    };

    const suggestedName = getNextProjectName();

    const activeProject = projects[0] || {
        id: "proj-1",
        name: "Project - 1",
        chip: "ESP32-S3",
        accent: "#FF8A00",
        icon: "ri-cpu-line",
        components: []
    };

    const handleCreateProject = ({ name, template, color }) => {
        const templateObj = STARTER_TEMPLATES.find(t => t.id === template) || STARTER_TEMPLATES[0];
        const finalName = name?.trim() || suggestedName;
        const now = Date.now();

        let initialComponents = [];
        let initialWires = [];

        if (template === "esp32") {
            initialComponents = [
                { id: `esp32-${now}`, type: "esp32-devkit", name: "ESP32 DevKit V1", x: 160, y: 160 },
                { id: `bb-${now + 1}`, type: "breadboard-half", name: "Breadboard (Half)", x: 480, y: 160 },
                { id: `res-${now + 2}`, type: "resistor", name: "Resistor (220Ω)", resistance: 220, x: 672, y: 272 },
                { id: `led-${now + 3}`, type: "led", name: "5mm LED (Blue)", color: "#3b82f6", x: 736, y: 288 }
            ];
            initialWires = [
                { id: `wire-${now + 4}`, color: "#3b82f6", points: [{ x: 304, y: 320 }, { x: 672, y: 240 }] },
                { id: `wire-${now + 5}`, color: "#0f172a", points: [{ x: 304, y: 368 }, { x: 752, y: 240 }] }
            ];
        } else if (template === "arduino") {
            initialComponents = [
                { id: `ard-${now}`, type: "arduino-uno", name: "Arduino Uno R3", x: 144, y: 160 },
                { id: `bb-${now + 1}`, type: "breadboard-half", name: "Breadboard (Half)", x: 512, y: 160 },
                { id: `res-${now + 2}`, type: "resistor", name: "Resistor (220Ω)", resistance: 220, x: 704, y: 272 },
                { id: `led-${now + 3}`, type: "led", name: "5mm LED (Red)", color: "#ef4444", x: 768, y: 288 }
            ];
            initialWires = [
                { id: `wire-${now + 4}`, color: "#ef4444", points: [{ x: 352, y: 176 }, { x: 704, y: 240 }] },
                { id: `wire-${now + 5}`, color: "#0f172a", points: [{ x: 336, y: 176 }, { x: 784, y: 240 }] }
            ];
        }

        const newProject = {
            id: `proj-${now}`,
            name: finalName,
            template: templateObj.id,
            chip: templateObj.chip,
            accent: color || templateObj.accent,
            icon: templateObj.icon,
            status: "Active",
            lastEdited: "Just now",
            updatedAt: new Date().toISOString(),
            components: initialComponents,
            wires: initialWires
        };

        const updated = [newProject, ...projects];
        setProjects(updated);
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(newProject));
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {}

        setOpenModal(false);
        if (onOpenWorkspace) onOpenWorkspace();
    };

    const handleOpenProject = (project) => {
        try {
            localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(project));
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {}
        if (onOpenWorkspace) onOpenWorkspace();
    };

    const handleDeleteProject = (e, id) => {
        e.stopPropagation();
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
            if (updated.length > 0) {
                localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(updated[0]));
            } else {
                localStorage.removeItem(ACTIVE_STORAGE_KEY);
            }
        } catch (e) {}
    };

    const handleTemplateClick = (tmpl) => {
        setSelectedTemplateForModal(tmpl.id);
        setOpenModal(true);
    };

    const currentCore = ARCHITECTURE_CORES.find(c => c.id === activeCoreTab) || ARCHITECTURE_CORES[0];

    const filteredProjects = projects.filter(p => {
        if (projectFilter === "all") return true;
        if (projectFilter === "esp32") return p.chip?.includes("ESP32") || p.template === "esp32";
        if (projectFilter === "arduino") return p.chip?.includes("ATmega") || p.template === "arduino";
        if (projectFilter === "pi") return p.chip?.includes("RP2040") || p.template === "pi";
        return true;
    });

    return (
        <>
            <motion.div 
                className="dashboard advanced-tech-dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* ================= COMPACT HERO WITH REAL RECENT SIMULATION PREVIEW ================= */}
                <motion.section className="hero hero-cockpit-grid compact-hero" variants={itemVariants}>
                    {/* Left: Lead Card */}
                    <div className="hero-content cockpit-lead-card">
                        <div className="tech-corner-decor tl"></div>
                        <div className="tech-corner-decor tr"></div>
                        <div className="tech-corner-decor bl"></div>
                        <div className="tech-corner-decor br"></div>

                        <div className="hero-header-row">
                            <span className="hero-pill tech-pill">
                                <span className="dot pulse"></span>
                                DIGITAL TWIN PLATFORM
                            </span>
                            <span className="system-tag font-mono">SPICE_KERNEL // 120 FPS</span>
                        </div>

                        <h1 className="tech-hero-title">
                            Silicon-Accurate <br />
                            <span className="hero-accent">Hardware Simulation.</span>
                        </h1>

                        <p className="hero-subtext">
                            Simulate microcontrollers, discrete silicon, analog circuits, and sensor telemetry in real time. 
                            Zero physical hardware required with instant cloud synchronization.
                        </p>

                        <div className="hero-buttons">
                            <motion.button 
                                className="btn-primary tech-btn-primary"
                                onClick={() => {
                                    setSelectedTemplateForModal("esp32");
                                    setOpenModal(true);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="ri-add-line"></i>
                                <span>Initialize New Twin</span>
                            </motion.button>

                            <motion.button 
                                className="btn-secondary tech-btn-secondary"
                                onClick={() => handleOpenProject(activeProject)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="ri-terminal-box-line"></i>
                                <span>Open Full Workspace</span>
                                <i className="ri-arrow-right-line"></i>
                            </motion.button>
                        </div>

                        {/* Telemetry Gauge Strip */}
                        <div className="cockpit-gauge-row">
                            <div className="gauge-item">
                                <span className="gauge-k">CORE CLOCK</span>
                                <span className="gauge-v font-mono">240.0 MHz</span>
                            </div>
                            <div className="gauge-sep">/</div>
                            <div className="gauge-item">
                                <span className="gauge-k">SOLVER</span>
                                <span className="gauge-v highlight font-mono">&lt; 0.04 ms</span>
                            </div>
                            <div className="gauge-sep">/</div>
                            <div className="gauge-item">
                                <span className="gauge-k">RAILS</span>
                                <span className="gauge-v font-mono">3.3V / 5.0V</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: User's Actual Recent Project Live Simulation Preview */}
                    <ProjectCircuitMiniPreview 
                        project={activeProject} 
                        onOpen={handleOpenProject} 
                    />
                </motion.section>

                {/* ================= RECENT REAL PROJECTS (DIRECTLY BELOW HERO) ================= */}
                <motion.section className="section recent-projects-section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <span className="tech-section-kicker">// ACTIVE SILICON VAULT</span>
                            <h2>Active Digital Twins</h2>
                            <span className="section-meta">Your live simulated circuits and digital twins</span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="vault-filter-tabs">
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "all" ? "active" : ""}`}
                                onClick={() => setProjectFilter("all")}
                            >
                                All ({projects.length})
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "esp32" ? "active" : ""}`}
                                onClick={() => setProjectFilter("esp32")}
                            >
                                ESP32
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "arduino" ? "active" : ""}`}
                                onClick={() => setProjectFilter("arduino")}
                            >
                                Arduino
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "pi" ? "active" : ""}`}
                                onClick={() => setProjectFilter("pi")}
                            >
                                RP2040
                            </button>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {filteredProjects.map((p) => (
                            <motion.div
                                key={p.id}
                                className="project-card tech-project-card"
                                whileHover={{ y: -4, borderColor: p.accent || "#FF8A00" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenProject(p)}
                            >
                                <div className="tech-corner-decor tl"></div>
                                <div className="tech-corner-decor tr"></div>
                                <div className="tech-corner-decor bl"></div>
                                <div className="tech-corner-decor br"></div>

                                <div className="card-top">
                                    <div className="card-icon" style={{ color: p.accent || "#FF8A00" }}>
                                        <i className={p.icon || "ri-cpu-line"}></i>
                                    </div>
                                    <div className="card-badges">
                                        <span className="cloud-sync-badge" title="Synced with TwinLab Cloud Vault">
                                            <i className="ri-cloud-line"></i> Cloud
                                        </span>
                                        <span className={`status-tag ${p.status?.toLowerCase() || "active"}`}>
                                            {p.status || "Active"}
                                        </span>
                                        {projects.length > 1 && (
                                            <button 
                                                className="project-delete-btn"
                                                onClick={(e) => handleDeleteProject(e, p.id)}
                                                title="Delete Project"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-content">
                                    <h3>{p.name}</h3>
                                    <div className="card-sub-info">
                                        <span className="chip-badge font-mono">{p.chip || "Modular"}</span>
                                        <span className="comp-count-badge">
                                            <i className="ri-layout-grid-line"></i>
                                            {p.components?.length || 0} {p.components?.length === 1 ? "component" : "components"}
                                        </span>
                                    </div>
                                    <p className="card-meta">Last synchronized {p.lastEdited || "Recently"}</p>
                                </div>

                                <div className="card-action">
                                    <span>Launch Workspace</span>
                                    <i className="ri-arrow-right-up-line"></i>
                                </div>
                            </motion.div>
                        ))}

                        {/* Minimalist Create Project Slot */}
                        <motion.div 
                            className="new-card-slot tech-new-slot"
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedTemplateForModal("esp32");
                                setOpenModal(true);
                            }}
                        >
                            <div className="tech-corner-decor tl"></div>
                            <div className="tech-corner-decor tr"></div>
                            <div className="tech-corner-decor bl"></div>
                            <div className="tech-corner-decor br"></div>

                            <div className="new-slot-icon">
                                <i className="ri-add-line"></i>
                            </div>
                            <span className="new-slot-title">Initialize Digital Twin</span>
                            <span className="new-slot-sub font-mono">{suggestedName}</span>
                        </motion.div>
                    </div>
                </motion.section>

                {/* ================= ARCHITECTURE BLUEPRINT EXPLORER ================= */}
                <motion.section className="section tech-arch-section" variants={itemVariants}>
                    <div className="section-head tech-section-head">
                        <div>
                            <span className="tech-section-kicker">// SILICON BLUEPRINT EXPLORER</span>
                            <h2>Hardware Architecture Cores</h2>
                            <span className="section-meta">Inspect instruction sets, bus pinouts, and physical specifications</span>
                        </div>
                        <div className="arch-tabs">
                            {ARCHITECTURE_CORES.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`arch-tab-btn ${activeCoreTab === c.id ? "active" : ""}`}
                                    onClick={() => setActiveCoreTab(c.id)}
                                >
                                    <span className="tab-dot" style={{ background: c.accent }}></span>
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="arch-blueprint-card">
                        <div className="arch-card-left">
                            <div className="arch-header">
                                <div className="arch-title-wrap">
                                    <span className="arch-family-tag font-mono">{currentCore.family}</span>
                                    <h3>{currentCore.name}</h3>
                                </div>
                                <span className="arch-status-pill font-mono" style={{ borderColor: `${currentCore.accent}40`, color: currentCore.accent }}>
                                    <span className="pulse-dot" style={{ background: currentCore.accent }}></span>
                                    {currentCore.status}
                                </span>
                            </div>

                            <p className="arch-desc">{currentCore.desc}</p>

                            <div className="arch-specs-grid">
                                <div className="arch-spec-item">
                                    <span className="spec-label">CORE CLOCK</span>
                                    <span className="spec-value">{currentCore.clock}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">CPU ARCHITECTURE</span>
                                    <span className="spec-value">{currentCore.cores}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">ON-CHIP SRAM</span>
                                    <span className="spec-value">{currentCore.sram}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">FLASH STORAGE</span>
                                    <span className="spec-value">{currentCore.flash}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">GPIO ALLOCATION</span>
                                    <span className="spec-value">{currentCore.gpio}</span>
                                </div>
                            </div>

                            <div className="arch-cta-wrap">
                                <motion.button
                                    className="btn-primary arch-deploy-btn"
                                    style={{ background: currentCore.accent }}
                                    onClick={() => {
                                        setSelectedTemplateForModal(currentCore.id === "logic" ? "blank" : currentCore.id);
                                        setOpenModal(true);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="ri-cpu-line"></i>
                                    <span>Deploy {currentCore.name} Twin</span>
                                    <i className="ri-arrow-right-line"></i>
                                </motion.button>
                            </div>
                        </div>

                        <div className="arch-card-right">
                            <div className="pinout-header">
                                <span className="pinout-title font-mono">// LIVE PINOUT BUS MATRIX</span>
                                <span className="pinout-status">POLLED REAL-TIME</span>
                            </div>
                            <div className="pinout-list">
                                {currentCore.pins.map((pin, pidx) => (
                                    <div key={pidx} className="pinout-row">
                                        <div className="pin-ident">
                                            <span className="pin-dot" style={{ background: currentCore.accent }}></span>
                                            <span className="pin-name font-mono">{pin.pin}</span>
                                        </div>
                                        <span className="pin-type font-mono">{pin.type}</span>
                                        <span className="pin-state font-mono">{pin.state}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ================= PLATFORM CAPABILITY MATRIX ================= */}
                <motion.section className="capability-strip" variants={itemVariants}>
                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-speed-line"></i>
                            </div>
                            <span className="cap-code font-mono">01 // KERNEL</span>
                        </div>
                        <h4>0.05ms SPICE Kernel</h4>
                        <p>Real-time mixed-signal circuit solver with sub-millisecond matrix convergence.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-cpu-line"></i>
                            </div>
                            <span className="cap-code font-mono">02 // ARCH</span>
                        </div>
                        <h4>Multi-Core Emulation</h4>
                        <p>Instruction execution for ESP32-S3, ATmega328P AVR, and RP2040.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-sound-module-line"></i>
                            </div>
                            <span className="cap-code font-mono">03 // SILICON</span>
                        </div>
                        <h4>50+ Verified Components</h4>
                        <p>Physical models for HC-SR04 Ultrasonic, PIR Radar, SG90 Servos, and 74HC Logic.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-cloud-line"></i>
                            </div>
                            <span className="cap-code font-mono">04 // VAULT</span>
                        </div>
                        <h4>Digital Twin Cloud Vault</h4>
                        <p>Encrypted state retention, snapshot rollbacks, and team branch sync.</p>
                    </div>
                </motion.section>

                {/* ================= STARTER TEMPLATES ================= */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <span className="tech-section-kicker">// BOOTSTRAP PRESETS</span>
                            <h2>Starter Silicon Blueprints</h2>
                            <span className="section-meta">Select a hardware base to bootstrap your digital twin</span>
                        </div>
                    </div>

                    <div className="templates-grid">
                        {STARTER_TEMPLATES.map((t) => (
                            <motion.div
                                key={t.id}
                                className="template-card tech-template-card"
                                style={{ "--card-accent": t.accent }}
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTemplateClick(t)}
                            >
                                <div className="tech-corner-decor tl"></div>
                                <div className="tech-corner-decor tr"></div>
                                <div className="tech-corner-decor bl"></div>
                                <div className="tech-corner-decor br"></div>

                                <div className="template-card-glow"></div>
                                <div className="template-top-row">
                                    <div className="template-icon" style={{ color: t.accent }}>
                                        <i className={t.icon}></i>
                                    </div>
                                    <span className="template-arch-badge font-mono">{t.badge}</span>
                                </div>

                                <div className="template-content">
                                    <div className="template-title-wrap">
                                        <h3>{t.name}</h3>
                                        <span className="template-chip-pill font-mono" style={{ borderColor: `${t.accent}40`, color: t.accent }}>
                                            {t.chip}
                                        </span>
                                    </div>
                                    <p>{t.desc}</p>
                                </div>

                                <div className="template-specs">
                                    {t.specs.map(spec => (
                                        <span key={spec} className="spec-tag">
                                            <i className="ri-check-line"></i>
                                            {spec}
                                        </span>
                                    ))}
                                </div>

                                <div className="template-action">
                                    <span>Initialize {t.name}</span>
                                    <div className="action-circle">
                                        <i className="ri-arrow-right-line"></i>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>
            </motion.div>

            <NewProjectModal
                open={openModal}
                suggestedName={suggestedName}
                initialTemplate={selectedTemplateForModal}
                onClose={() => setOpenModal(false)}
                onCreateProject={handleCreateProject}
            />
        </>
    );
}

export default Dashboard;
