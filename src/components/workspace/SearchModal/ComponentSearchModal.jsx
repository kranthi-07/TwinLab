import "./ComponentSearchModal.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComponentArt } from "../../common/ComponentArt";

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
        id: "motor-dc",
        type: "motor-dc",
        name: "Standard 130 DC Motor",
        designator: "MOT1",
        category: "outputs",
        categoryLabel: "Actuator",
        badge: "3V-6V Brushed",
        specs: "12,000 RPM Coreless Motor • Bare Axle or Propeller",
        keywords: ["motor", "dc motor", "hobby motor", "propeller", "fan", "rotor", "actuator", "130"],
        defaultProps: { type: "motor-dc", name: "130 DC Motor", speed: 100, accessory: "propeller" }
    },
    {
        id: "motor-geared",
        type: "motor-geared",
        name: "TT Geared DC Motor (Yellow BO)",
        designator: "MOT2",
        category: "outputs",
        categoryLabel: "Actuator",
        badge: "1:48 Gearbox",
        specs: "Yellow BO Motor • Dual White D-Shaft • High Torque 200 RPM",
        keywords: ["geared motor", "bo motor", "yellow motor", "tt motor", "gearbox", "robot", "wheel motor", "chassis", "dual shaft"],
        defaultProps: { type: "motor-geared", name: "TT Geared DC Motor", speed: 100, gearRatio: "1:48", direction: "cw" }
    },
    {
        id: "servo-sg90",
        type: "servo-sg90",
        name: "Micro Servo SG90 (9g)",
        designator: "SRV1",
        category: "outputs",
        categoryLabel: "Actuator",
        badge: "PWM 0°-180°",
        specs: "4.8V-6V • Nylon Horn & Splined Shaft",
        keywords: ["servo", "sg90", "micro servo", "horn", "actuator", "pwm"],
        defaultProps: { type: "servo-sg90", name: "Micro Servo SG90", angle: 90 }
    },
    {
        id: "sensor-ultrasonic",
        type: "sensor-ultrasonic",
        name: "Ultrasonic Sensor (HC-SR04)",
        designator: "US1",
        category: "inputs",
        categoryLabel: "Sensor",
        badge: "Sonar 2cm-400cm",
        specs: "Transmitter & Receiver Cylinders • Trigger/Echo",
        keywords: ["ultrasonic", "sonar", "distance", "hc-sr04", "range", "sensor"],
        defaultProps: { type: "sensor-ultrasonic", name: "HC-SR04 Ultrasonic", distanceCm: 25 }
    },
    {
        id: "sensor-pir",
        type: "sensor-pir",
        name: "PIR Motion Sensor (HC-SR501)",
        designator: "PIR1",
        category: "inputs",
        categoryLabel: "Sensor",
        badge: "Infrared Pyroelectric",
        specs: "Fresnel Dome Lens • Dual Trimmers",
        keywords: ["pir", "motion", "infrared", "presence", "human", "fresnel"],
        defaultProps: { type: "sensor-pir", name: "PIR Motion Sensor" }
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
    { id: "all", label: "All Items", icon: "ri-apps-2-line" },
    { id: "mcu", label: "Microcontrollers", icon: "ri-cpu-line" },
    { id: "outputs", label: "Displays & LEDs", icon: "ri-lightbulb-line" },
    { id: "power", label: "Power & Batteries", icon: "ri-battery-2-charge-line" },
    { id: "inputs", label: "Inputs & Switches", icon: "ri-toggle-line" },
    { id: "passives", label: "Passives", icon: "ri-pulse-line" },
    { id: "breadboards", label: "Breadboards", icon: "ri-layout-grid-line" },
    { id: "instruments", label: "Instruments", icon: "ri-dashboard-3-line" }
];

export function Component3DThumbnail({ type }) {
    return <ComponentArt type={type} className="thumb-3d-svg" />;
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

                    {/* Split Body: Left Categories Sidebar & Center Results Viewport */}
                    <div className="search-modal-body-split">
                        <aside className="search-categories-sidebar">
                            <span className="search-sidebar-heading">CATEGORIES</span>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    className={`cat-sidebar-btn ${selectedCategory === cat.id ? "active" : ""}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    <i className={cat.icon}></i>
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </aside>

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
