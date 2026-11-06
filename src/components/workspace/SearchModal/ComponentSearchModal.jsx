import "./ComponentSearchModal.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Comprehensive catalog of all TwinLab components and virtual instruments
export const SEARCH_CATALOG = [
    {
        id: "resistor",
        type: "resistor",
        name: "Carbon Film Resistor",
        designator: "R1",
        category: "passives",
        categoryLabel: "Passive",
        badge: "Through-Hole 1/4W",
        specs: "220Ω (Customizable 10Ω - 1MΩ)",
        keywords: ["resistor", "resistance", "ohm", "r", "passive", "current limit"],
        defaultProps: { type: "resistor", name: "Resistor (220Ω)", resistance: 220 }
    },
    {
        id: "led",
        type: "led",
        name: "Diffused 5mm LED",
        designator: "D1",
        category: "outputs",
        categoryLabel: "Output",
        badge: "Optoelectronic",
        specs: "Red 2.05V • 25mA (6 Colors Available)",
        keywords: ["led", "light", "diode", "emitter", "lamp", "indicator"],
        defaultProps: { type: "led", name: "5mm LED (Red)", color: "#ef4444" }
    },
    {
        id: "battery-9v",
        type: "battery-9v",
        name: "9V Alkaline Battery",
        designator: "BAT1",
        category: "power",
        categoryLabel: "Power",
        badge: "DC Voltage Source",
        specs: "9.0V Nominal • Snap Terminals",
        keywords: ["battery", "power", "9v", "supply", "voltage", "source"],
        defaultProps: { type: "battery-9v", name: "9V Battery", voltage: 9 }
    },
    {
        id: "capacitor-ceramic",
        type: "capacitor-ceramic",
        name: "Ceramic Disc Capacitor",
        designator: "C1",
        category: "passives",
        categoryLabel: "Passive",
        badge: "Dielectric 50V",
        specs: "100nF (10pF - 470µF Presets)",
        keywords: ["capacitor", "cap", "ceramic", "filtering", "bypass", "farad", "nf", "uf"],
        defaultProps: { type: "capacitor-ceramic", name: "Ceramic Cap (100nF)", capacitance: "100nF" }
    },
    {
        id: "potentiometer",
        type: "potentiometer",
        name: "Rotary Potentiometer",
        designator: "POT1",
        category: "inputs",
        categoryLabel: "Input",
        badge: "Variable Resistor",
        specs: "10kΩ Linear Taper • Center Wiper",
        keywords: ["potentiometer", "pot", "variable", "dial", "knob", "wiper", "trimmer"],
        defaultProps: { type: "potentiometer", name: "Potentiometer (10k)", resistance: 10000, wiperValue: 0.5 }
    },
    {
        id: "buzzer",
        type: "buzzer",
        name: "Active Piezo Buzzer",
        designator: "BZ1",
        category: "outputs",
        categoryLabel: "Output",
        badge: "Audio Transducer",
        specs: "3V - 12V DC • 2.4kHz Audible Beeper",
        keywords: ["buzzer", "sound", "piezo", "beeper", "speaker", "audio", "alarm"],
        defaultProps: { type: "buzzer", name: "Piezo Buzzer", voltage: 5 }
    },
    {
        id: "pushbutton",
        type: "pushbutton",
        name: "Tactile Pushbutton",
        designator: "SW1",
        category: "inputs",
        categoryLabel: "Input",
        badge: "SPST Momentary",
        specs: "6x6mm Tactile • Normally Open",
        keywords: ["button", "pushbutton", "switch", "momentary", "tactile", "key"],
        defaultProps: { type: "pushbutton", name: "Pushbutton (Momentary)" }
    },
    {
        id: "slide-switch",
        type: "slide-switch",
        name: "SPDT Slide Switch",
        designator: "SW2",
        category: "inputs",
        categoryLabel: "Input",
        badge: "3-Terminal SPDT",
        specs: "Bistable • Dual Circuit Selector",
        keywords: ["switch", "slide", "spdt", "toggle", "selector"],
        defaultProps: { type: "slide-switch", name: "Slide Switch (SPDT)", switchState: "left" }
    },
    {
        id: "breadboard-half",
        type: "breadboard-half",
        name: "Breadboard (Half Size)",
        designator: "BB1",
        category: "breadboards",
        categoryLabel: "Prototyping",
        badge: "400 Tie-Points",
        specs: "30 Columns • Continuous Dual Power Rails",
        keywords: ["breadboard", "half", "board", "400", "solderless", "tie points"],
        defaultProps: { type: "breadboard-half", name: "Breadboard (Half)" }
    },
    {
        id: "breadboard-full",
        type: "breadboard-full",
        name: "Breadboard (Full Size)",
        designator: "BB2",
        category: "breadboards",
        categoryLabel: "Prototyping",
        badge: "830 Tie-Points",
        specs: "60 Columns • High Capacity Dual Bus",
        keywords: ["breadboard", "full", "830", "large", "solderless"],
        defaultProps: { type: "breadboard-full", name: "Breadboard (Full)" }
    },
    {
        id: "breadboard-mini",
        type: "breadboard-mini",
        name: "Breadboard (Mini 170)",
        designator: "BB3",
        category: "breadboards",
        categoryLabel: "Prototyping",
        badge: "170 Tie-Points",
        specs: "17 Columns • Compact Modular No-Rails",
        keywords: ["breadboard", "mini", "170", "compact", "small"],
        defaultProps: { type: "breadboard-mini", name: "Breadboard (Mini)" }
    },
    {
        id: "arduino-uno",
        type: "arduino-uno",
        name: "Arduino Uno R3",
        designator: "MCU1",
        category: "mcu",
        categoryLabel: "Microcontroller",
        badge: "ATmega328P 16MHz",
        specs: "14 Digital I/O • 6 PWM • 6 Analog (5V)",
        keywords: ["arduino", "uno", "atmega328p", "mcu", "microcontroller", "board", "avr"],
        defaultProps: { type: "arduino-uno", name: "Arduino Uno R3" }
    },
    {
        id: "arduino-mega",
        type: "arduino-mega",
        name: "Arduino Mega 2560",
        designator: "MCU2",
        category: "mcu",
        categoryLabel: "Microcontroller",
        badge: "ATmega2560 16MHz",
        specs: "54 Digital I/O • 16 Analog Inputs • 4 UARTs",
        keywords: ["arduino", "mega", "2560", "atmega2560", "mcu"],
        defaultProps: { type: "arduino-mega", name: "Arduino Mega 2560" }
    },
    {
        id: "arduino-nano",
        type: "arduino-nano",
        name: "Arduino Nano V3",
        designator: "MCU3",
        category: "mcu",
        categoryLabel: "Microcontroller",
        badge: "ATmega328P DIP-30",
        specs: "Breadboard-Friendly • 8 Analog Inputs",
        keywords: ["arduino", "nano", "dip30", "compact", "mcu"],
        defaultProps: { type: "arduino-nano", name: "Arduino Nano V3" }
    },
    {
        id: "esp32-devkit",
        type: "esp32-devkit",
        name: "ESP32-S3 DevKit",
        designator: "MCU4",
        category: "mcu",
        categoryLabel: "Microcontroller",
        badge: "Dual-Core 240MHz",
        specs: "Wi-Fi 4 + BLE 5.0 • 44 GPIOs (3.3V)",
        keywords: ["esp32", "esp", "s3", "wifi", "bluetooth", "ble", "iot", "dual core"],
        defaultProps: { type: "esp32-devkit", name: "ESP32-S3 DevKit" }
    },
    {
        id: "multimeter",
        type: "multimeter",
        name: "Digital Multimeter (DMM)",
        designator: "DMM1",
        category: "instruments",
        categoryLabel: "Bench Instrument",
        badge: "TwinLab TL-890D",
        specs: "True RMS • Voltage, Current, Ohms & Continuity",
        keywords: ["multimeter", "dmm", "voltmeter", "ammeter", "ohmmeter", "probe", "meter", "measure"],
        isInstrument: true,
        instrumentAction: "multimeter"
    },
    {
        id: "lcd-1602",
        type: "lcd-1602",
        name: "16x2 Character LCD (I2C)",
        designator: "LCD1",
        category: "outputs",
        categoryLabel: "Display",
        badge: "HD44780 + I2C",
        specs: "16x2 Alphanumeric • PCF8574 Backpack (SDA/SCL)",
        keywords: ["lcd", "display", "screen", "1602", "hd44780", "i2c", "text", "characters"],
        defaultProps: { type: "lcd-1602", name: "16x2 LCD (I2C)" }
    },
    {
        id: "battery-aa",
        type: "battery-aa",
        name: "AA Battery Holder",
        designator: "BAT2",
        category: "power",
        categoryLabel: "Power",
        badge: "1.5V / 3V / 6V Case",
        specs: "Configurable 1, 2, or 4 Cells with Spring Contacts",
        keywords: ["battery", "aa", "holder", "pack", "case", "cells", "1.5v", "3v", "6v"],
        defaultProps: { type: "battery-aa", name: "AA Battery Pack", cellCount: 2, voltage: 3.0 }
    },
    {
        id: "battery-aaa",
        type: "battery-aaa",
        name: "AAA Battery Holder",
        designator: "BAT3",
        category: "power",
        categoryLabel: "Power",
        badge: "1.5V / 3V / 6V Case",
        specs: "Compact AAA Enclosure with Snap Leads",
        keywords: ["battery", "aaa", "holder", "pack", "case", "cells"],
        defaultProps: { type: "battery-aaa", name: "AAA Battery Pack", cellCount: 2, voltage: 3.0 }
    },
    {
        id: "switch-spst",
        type: "switch-spst",
        name: "SPST Toggle Switch",
        designator: "SW3",
        category: "inputs",
        categoryLabel: "Input",
        badge: "Bistable 2-Pin",
        specs: "Single-Pole Single-Throw Mechanical Lever",
        keywords: ["switch", "spst", "toggle", "lever", "power switch", "on off"],
        defaultProps: { type: "switch-spst", name: "SPST Toggle Switch", switchState: "off" }
    },
    {
        id: "oscilloscope",
        type: "oscilloscope",
        name: "Dual-Trace Oscilloscope",
        designator: "DSO1",
        category: "instruments",
        categoryLabel: "Bench Instrument",
        badge: "200MHz DSO",
        specs: "Live Waveform Capture • CH1/CH2 Dual Probes",
        keywords: ["oscilloscope", "scope", "cro", "dso", "waveform", "frequency", "signal", "sine", "pulse"],
        isInstrument: true,
        instrumentAction: "oscilloscope"
    }
];

const CATEGORIES = [
    { id: "all", label: "All Items" },
    { id: "mcu", label: "Microcontrollers" },
    { id: "outputs", label: "Displays & Outputs" },
    { id: "power", label: "Power & Batteries" },
    { id: "inputs", label: "Inputs & Switches" },
    { id: "passives", label: "Passives" },
    { id: "breadboards", label: "Breadboards" },
    { id: "instruments", label: "Instruments" }
];

export function Component3DThumbnail({ type }) {
    switch (type) {
        case "resistor":
            return (
                <svg viewBox="0 0 70 32" className="thumb-3d-svg">
                    <line x1="4" y1="16" x2="18" y2="16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="52" y1="16" x2="66" y2="16" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
                    <rect x="18" y="9" width="34" height="14" rx="4" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                    <rect x="23" y="9" width="3" height="14" fill="#dc2626" />
                    <rect x="29" y="9" width="3" height="14" fill="#dc2626" />
                    <rect x="35" y="9" width="3" height="14" fill="#78350f" />
                    <rect x="44" y="9" width="3" height="14" fill="#fbbf24" />
                </svg>
            );
        case "led":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <line x1="20" y1="26" x2="20" y2="38" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                    <line x1="30" y1="26" x2="30" y2="35" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 16 26 C 16 8, 34 8, 34 26 Z" fill="#ef4444" />
                    <rect x="15" y="24" width="20" height="3" rx="1" fill="#dc2626" />
                    <circle cx="25" cy="16" r="6" fill="#fca5a5" opacity="0.6" filter="blur(2px)" />
                </svg>
            );
        case "battery-9v":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="18" y="2" width="6" height="5" rx="1" fill="#94a3b8" />
                    <circle cx="32" cy="4.5" r="3" fill="#cbd5e1" />
                    <rect x="12" y="7" width="26" height="8" rx="1.5" fill="#b45309" />
                    <rect x="12" y="15" width="26" height="23" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="18" y="30" fill="#10b981" fontSize="8" fontWeight="bold">9V</text>
                </svg>
            );
        case "capacitor-ceramic":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <line x1="21" y1="24" x2="21" y2="38" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
                    <line x1="29" y1="24" x2="29" y2="38" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="25" cy="15" r="11" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
                    <text x="19" y="18" fill="#ffffff" fontSize="6.5" fontWeight="bold">104</text>
                </svg>
            );
        case "potentiometer":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="11" y="10" width="28" height="22" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                    <circle cx="25" cy="21" r="7" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                    <line x1="25" y1="21" x2="28" y2="16" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                </svg>
            );
        case "buzzer":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <circle cx="25" cy="20" r="14" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <circle cx="25" cy="20" r="4.5" fill="#1e293b" />
                    <text x="31" y="16" fill="#ef4444" fontSize="8" fontWeight="bold">+</text>
                </svg>
            );
        case "pushbutton":
        case "button":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="12" y="8" width="26" height="24" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <circle cx="25" cy="20" r="7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                    <circle cx="25" cy="20" r="4" fill="#475569" />
                </svg>
            );
        case "slide-switch":
        case "switch-spdt":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="8" y="12" width="34" height="16" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                    <rect x="12" y="8" width="10" height="24" rx="2" fill="#0f172a" />
                </svg>
            );
        case "switch-spst":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="12" y="10" width="26" height="20" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                    <circle cx="25" cy="20" r="6" fill="#0f172a" />
                    <line x1="25" y1="20" x2="31" y2="12" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
            );
        case "lcd-1602":
            return (
                <svg viewBox="0 0 60 40" className="thumb-3d-svg">
                    <rect x="6" y="8" width="48" height="24" rx="2.5" fill="#006644" stroke="#004d33" strokeWidth="1" />
                    <rect x="10" y="11" width="40" height="18" rx="1.5" fill="#0f172a" />
                    <rect x="12" y="13" width="36" height="14" rx="1" fill="#0284c7" fillOpacity="0.3" />
                    <text x="15" y="20" fill="#38bdf8" fontSize="4.5" fontFamily="monospace">TwinLab</text>
                    <text x="15" y="25" fill="#38bdf8" fontSize="4" fontFamily="monospace">16x2 LCD</text>
                </svg>
            );
        case "battery-aa":
        case "battery-aaa":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="8" y="8" width="34" height="24" rx="2.5" fill="#18181b" stroke="#27272a" strokeWidth="1" />
                    <rect x="12" y="11" width="26" height="8" rx="1" fill="#0284c7" />
                    <rect x="12" y="21" width="26" height="8" rx="1" fill="#0284c7" />
                    <path d="M 42 15 Q 46 12 46 18" fill="none" stroke="#ef4444" strokeWidth="1.2" />
                </svg>
            );
        case "breadboard-half":
        case "breadboard-full":
        case "breadboard-mini":
        case "breadboard":
            return (
                <svg viewBox="0 0 70 32" className="thumb-3d-svg">
                    <rect x="4" y="4" width="62" height="24" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <line x1="8" y1="8" x2="62" y2="8" stroke="#ef4444" strokeWidth="1" />
                    <line x1="8" y1="24" x2="62" y2="24" stroke="#3b82f6" strokeWidth="1" />
                    <rect x="16" y="12" width="38" height="8" rx="1" fill="#e2e8f0" />
                </svg>
            );
        case "arduino-uno":
            return (
                <svg viewBox="0 0 60 40" className="thumb-3d-svg">
                    <rect x="6" y="4" width="48" height="32" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                    <rect x="4" y="8" width="8" height="8" rx="1" fill="#94a3b8" />
                    <rect x="22" y="18" width="22" height="8" rx="1" fill="#0f172a" />
                    <rect x="14" y="6" width="36" height="3" fill="#1e293b" />
                    <rect x="14" y="31" width="36" height="3" fill="#1e293b" />
                </svg>
            );
        case "arduino-mega":
            return (
                <svg viewBox="0 0 70 40" className="thumb-3d-svg">
                    <rect x="4" y="4" width="62" height="32" rx="3" fill="#0369a1" stroke="#075985" strokeWidth="1" />
                    <rect x="2" y="8" width="8" height="8" rx="1" fill="#94a3b8" />
                    <rect x="38" y="14" width="12" height="12" rx="1" fill="#0f172a" />
                    <rect x="12" y="6" width="48" height="3" fill="#1e293b" />
                    <rect x="12" y="31" width="48" height="3" fill="#1e293b" />
                </svg>
            );
        case "arduino-nano":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="12" y="4" width="26" height="32" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                    <rect x="19" y="3" width="12" height="6" rx="1" fill="#94a3b8" />
                    <rect x="18" y="14" width="14" height="14" rx="1" fill="#0f172a" />
                </svg>
            );
        case "esp32-devkit":
        case "esp32":
            return (
                <svg viewBox="0 0 54 40" className="thumb-3d-svg">
                    <rect x="10" y="4" width="34" height="32" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <rect x="17" y="10" width="20" height="18" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="12" y1="6" x2="12" y2="34" stroke="#1e293b" strokeWidth="2" strokeDasharray="1 2" />
                    <line x1="42" y1="6" x2="42" y2="34" stroke="#1e293b" strokeWidth="2" strokeDasharray="1 2" />
                </svg>
            );
        case "multimeter":
            return (
                <svg viewBox="0 0 50 40" className="thumb-3d-svg">
                    <rect x="13" y="4" width="24" height="32" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                    <rect x="17" y="8" width="16" height="9" rx="1.5" fill="#14281d" />
                    <circle cx="25" cy="24" r="4.5" fill="#1e293b" />
                </svg>
            );
        case "oscilloscope":
            return (
                <svg viewBox="0 0 60 40" className="thumb-3d-svg">
                    <rect x="6" y="5" width="48" height="30" rx="3" fill="#090d16" stroke="#334155" strokeWidth="1" />
                    <rect x="10" y="9" width="26" height="22" rx="1.5" fill="#0b1b14" />
                    <path d="M 12 20 Q 16 13, 22 20 T 32 20" stroke="#facc15" strokeWidth="1.2" fill="none" />
                    <circle cx="44" cy="14" r="3" fill="#1e293b" />
                    <circle cx="44" cy="25" r="3" fill="#1e293b" />
                </svg>
            );
        default:
            return (
                <div className="thumb-generic-icon">
                    <i className="ri-cpu-line"></i>
                </div>
            );
    }
}

function ComponentSearchModal({
    isOpen = false,
    onClose,
    onAddComponent,
    onOpenInstrument
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setSelectedCategory("all");
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 60);
        }
    }, [isOpen]);

    // Handle Esc key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Filter results live as user types or changes category
    const filteredResults = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        return SEARCH_CATALOG.filter(item => {
            // Category match
            if (selectedCategory !== "all" && item.category !== selectedCategory) {
                return false;
            }
            if (!q) return true;
            // Match name, categoryLabel, specs, or keywords
            return (
                item.name.toLowerCase().includes(q) ||
                item.categoryLabel.toLowerCase().includes(q) ||
                item.specs.toLowerCase().includes(q) ||
                (item.keywords && item.keywords.some(k => k.includes(q)))
            );
        });
    }, [searchQuery, selectedCategory]);

    const handleSelectComponent = (item) => {
        if (item.isInstrument) {
            if (onOpenInstrument) onOpenInstrument(item.instrumentAction);
        } else {
            if (onAddComponent) {
                onAddComponent(item.defaultProps);
            }
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="search-modal-backdrop" onClick={onClose}>
                <motion.div 
                    className="search-modal-card"
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Search Input Bar */}
                    <div className="search-input-header">
                        <i className="ri-search-2-line search-mag-icon"></i>
                        <input
                            ref={inputRef}
                            type="text"
                            className="search-modal-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search 20+ components, MCUs, sensors, instruments... (e.g. ESP32, LED, Resistor)"
                            spellCheck={false}
                        />
                        {searchQuery && (
                            <button 
                                className="search-clear-btn" 
                                onClick={() => setSearchQuery("")}
                                title="Clear search"
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        )}
                        <span className="search-esc-badge" onClick={onClose}>ESC</span>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="search-categories-bar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`cat-pill-btn ${selectedCategory === cat.id ? "active" : ""}`}
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Results Grid / List with 3D Images */}
                    <div className="search-results-viewport">
                        {filteredResults.length > 0 ? (
                            <div className="search-results-grid">
                                {filteredResults.map(item => (
                                    <div 
                                        key={item.id}
                                        className="search-item-card"
                                        onClick={() => handleSelectComponent(item)}
                                    >
                                        <div className="item-thumbnail-stage">
                                            <Component3DThumbnail type={item.type} />
                                        </div>
                                        <div className="item-info-meta">
                                            <div className="item-title-row">
                                                <h4 className="item-name">{item.name}</h4>
                                                <span className="item-category-tag">{item.categoryLabel}</span>
                                            </div>
                                            <p className="item-specs-subtext">{item.specs}</p>
                                        </div>
                                        <button className="item-add-action-btn" title="Add to Canvas">
                                            <i className="ri-add-line"></i>
                                            <span>Add</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="search-empty-state">
                                <i className="ri-compass-3-line"></i>
                                <h3>No components found for "{searchQuery}"</h3>
                                <p>Try searching for "Resistor", "Arduino", "Breadboard", or clear filters.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Tips */}
                    <div className="search-modal-footer">
                        <span>Tip: Press <strong>Ctrl+F</strong> anytime in the workspace to search</span>
                        <span>{filteredResults.length} components available</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default ComponentSearchModal;
