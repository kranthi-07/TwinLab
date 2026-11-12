import "./TopFloatingBar.css";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";
import { soundManager } from "../../../utils/audioManager";

const COMPONENT_META = {
    "resistor": { label: "Resistor", icon: "ri-pulse-line" },
    "led": { label: "LED", icon: "ri-lightbulb-line" },
    "battery-9v": { label: "9V Battery", icon: "ri-battery-charge-line" },
    "battery-aa": { label: "AA Battery Pack", icon: "ri-battery-2-charge-line" },
    "battery-aaa": { label: "AAA Battery Pack", icon: "ri-battery-charge-line" },
    "battery-coin": { label: "Coin Cell (3V)", icon: "ri-copper-coin-line" },
    "capacitor-ceramic": { label: "Capacitor", icon: "ri-contrast-2-line" },
    "capacitor-electrolytic": { label: "Electrolytic Cap", icon: "ri-contrast-2-fill" },
    "potentiometer": { label: "Potentiometer", icon: "ri-equalizer-line" },
    "buzzer": { label: "Piezo Buzzer", icon: "ri-volume-up-line" },
    "button": { label: "Pushbutton", icon: "ri-radio-button-line" },
    "pushbutton": { label: "Pushbutton", icon: "ri-radio-button-line" },
    "switch-spdt": { label: "Slide Switch", icon: "ri-toggle-line" },
    "slide-switch": { label: "Slide Switch", icon: "ri-toggle-line" },
    "switch-spst": { label: "Toggle Switch", icon: "ri-toggle-line" },
    "lcd": { label: "Character LCD", icon: "ri-tv-line" },
    "lcd-1602": { label: "16x2 Character LCD", icon: "ri-tv-line" },
    "lcd-2004": { label: "20x4 Character LCD", icon: "ri-tv-line" },
    "motor-dc": { label: "130 DC Motor", icon: "ri-refresh-line" },
    "motor-geared": { label: "TT Geared DC Motor (Yellow BO)", icon: "ri-steering-2-line" },
    "servo-sg90": { label: "Micro Servo SG90", icon: "ri-settings-4-line" },
    "transistor": { label: "NPN Transistor (2N2222)", icon: "ri-git-commit-line" },
    "transistor-npn": { label: "NPN Transistor (2N2222)", icon: "ri-git-commit-line" },
    "transistor-pnp": { label: "PNP Transistor (2N3906)", icon: "ri-git-commit-line" },
    "mosfet-n": { label: "N-MOSFET (IRF540N)", icon: "ri-flashlight-line" },
    "sensor-ultrasonic": { label: "Ultrasonic (HC-SR04)", icon: "ri-radar-line" },
    "sensor-pir": { label: "PIR Motion Sensor", icon: "ri-user-voice-line" },
    "sensor-temp": { label: "TMP36 Temp Sensor", icon: "ri-temp-hot-line" },
    "sensor-tmp36": { label: "TMP36 Temp Sensor", icon: "ri-temp-hot-line" },
    "photoresistor": { label: "Photoresistor (LDR)", icon: "ri-sun-line" },
    "ic-74hc08": { label: "74HC08 Quad AND", icon: "ri-mind-map" },
    "ic-74hc00": { label: "74HC00 Quad NAND", icon: "ri-mind-map" },
    "ic-74hc32": { label: "74HC32 Quad OR", icon: "ri-mind-map" },
    "ic-74hc04": { label: "74HC04 Hex Inverter", icon: "ri-mind-map" },
    "ic-74hc02": { label: "74HC02 Quad NOR", icon: "ri-mind-map" },
    "ic-74hc86": { label: "74HC86 Quad XOR", icon: "ri-mind-map" },
    "ic-74hc132": { label: "74HC132 NAND Schmitt", icon: "ri-mind-map" },
    "ic-l293d": { label: "L293D Motor Driver", icon: "ri-cpu-line" },
    "multimeter": { label: "Multimeter", icon: "ri-dashboard-3-line" },
    "breadboard": { label: "Breadboard (Half)", icon: "ri-layout-grid-line" },
    "breadboard-half": { label: "Breadboard (Half)", icon: "ri-layout-grid-line" },
    "breadboard-full": { label: "Breadboard (Full)", icon: "ri-layout-grid-fill" },
    "breadboard-mini": { label: "Breadboard (Mini)", icon: "ri-grid-line" },
    "arduino-uno": { label: "Arduino Uno", icon: "ri-cpu-line" },
    "arduino-mega": { label: "Arduino Mega", icon: "ri-cpu-line" },
    "arduino-nano": { label: "Arduino Nano", icon: "ri-cpu-line" },
    "esp32": { label: "ESP32", icon: "ri-cpu-line" },
    "esp32-devkit": { label: "ESP32", icon: "ri-cpu-line" },
    "esp32-s3": { label: "ESP32", icon: "ri-cpu-line" },
    "rpi-pico": { label: "Raspberry Pi Pico (RP2040)", icon: "ri-cpu-line" },
    "raspberry-pi": { label: "Raspberry Pi Pico (RP2040)", icon: "ri-cpu-line" },
};

const WIRE_COLORS = [
    { key: "1", name: "Green", color: "#10b981" },
    { key: "2", name: "Red", color: "#ef4444" },
    { key: "3", name: "Black", color: "#1e293b" },
    { key: "4", name: "Blue", color: "#3b82f6" },
    { key: "5", name: "Yellow", color: "#eab308" },
    { key: "6", name: "Orange", color: "#f97316" },
    { key: "7", name: "White", color: "#f8fafc" },
    { key: "8", name: "Purple", color: "#8b5cf6" },
    { key: "9", name: "Brown", color: "#78350f" }
];

const BREADBOARD_COLORS = [
    { name: "Studio White", color: "#f8fafc", border: "#cbd5e1" },
    { name: "Ivory Cream", color: "#fefce8", border: "#fef08a" },
    { name: "Bone Gray", color: "#f1f5f9", border: "#cbd5e1" },
    { name: "Arctic Frost", color: "#f0fdfa", border: "#99f6e4" },
    { name: "Quartz White", color: "#faf5ff", border: "#e9d5ff" },
    { name: "Alabaster", color: "#fffbf5", border: "#fed7aa" },
];

const RESISTOR_PRESETS = ["100", "220", "330", "470", "1k", "2.2k", "4.7k", "10k", "100k", "1M"];
const CAPACITOR_PRESETS = ["10pF", "100pF", "1nF", "10nF", "100nF", "1µF", "10µF", "100µF"];
const VOLTAGE_PRESETS = ["1V", "1.5V", "3.3V", "5V", "9V", "12V"];

// Helper to parse resistor string to numeric Ohms (e.g., "100" -> 100, "100k" -> 100000, "1M" -> 1000000)
const parseResistanceValue = (val) => {
    if (typeof val === "number") return val;
    if (!val) return 220;
    const str = String(val).trim().replace(/[Ω\s]/g, "");
    if (str.endsWith("M")) return parseFloat(str) * 1000000;
    if (str.endsWith("k")) return parseFloat(str) * 1000;
    return parseFloat(str) || 220;
};

function StudioValueUnitControl({
    label = "Value",
    numericValue = "",
    unit = "",
    units = [],
    presets = [],
    onNumericChange,
    onUnitChange,
    onPresetSelect,
    subtext = ""
}) {
    const [localVal, setLocalVal] = useState(String(numericValue));

    useEffect(() => {
        setLocalVal(String(numericValue));
    }, [numericValue]);

    return (
        <div className="studio-val-unit-control">
            <span className="studio-control-label">{label}</span>
            <div className="studio-control-cluster">
                {/* Manual Number Typing Input */}
                <input
                    type="number"
                    step="any"
                    className="studio-manual-number-input"
                    value={localVal}
                    onChange={(e) => {
                        const val = e.target.value;
                        setLocalVal(val);
                        onNumericChange(val);
                    }}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Enter") e.target.blur();
                    }}
                    placeholder="Val"
                    title="Type custom numerical value"
                />

                {/* Preset Values Dropdown */}
                {presets && presets.length > 0 && (
                    <select
                        className="studio-custom-select preset-select"
                        value=""
                        onChange={(e) => {
                            if (e.target.value) {
                                onPresetSelect(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        title="Quick preset values"
                    >
                        <option value="" disabled>Standard ▾</option>
                        {presets.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                )}

                {/* Unit Dropdown */}
                {units && units.length > 0 && (
                    <select
                        className="studio-custom-select unit-select"
                        value={unit}
                        onChange={(e) => onUnitChange(e.target.value)}
                        title="Unit"
                    >
                        {units.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {subtext && <span className="specs-subtext">{subtext}</span>}
        </div>
    );
}

function ResistorValueControl({ component, onUpdate }) {
    const rawR = component.resistance != null ? Number(component.resistance) : 220;
    let initialUnit = "Ω";
    let initialNum = rawR;
    if (rawR >= 1e6) {
        initialUnit = "MΩ";
        initialNum = +(rawR / 1e6).toFixed(3);
    } else if (rawR >= 1e3) {
        initialUnit = "kΩ";
        initialNum = +(rawR / 1e3).toFixed(3);
    }

    const [unit, setUnit] = useState(initialUnit);

    useEffect(() => {
        if (rawR >= 1e6) setUnit("MΩ");
        else if (rawR >= 1e3) setUnit("kΩ");
        else setUnit("Ω");
    }, [rawR]);

    const displayNum = unit === "MΩ" ? +(rawR / 1e6).toFixed(3) : unit === "kΩ" ? +(rawR / 1e3).toFixed(3) : rawR;

    return (
        <StudioValueUnitControl
            label="Resistance"
            numericValue={displayNum}
            unit={unit}
            units={["Ω", "kΩ", "MΩ"]}
            presets={["10Ω", "47Ω", "100Ω", "220Ω", "330Ω", "470Ω", "1kΩ", "2.2kΩ", "4.7kΩ", "10kΩ", "47kΩ", "100kΩ", "470kΩ", "1MΩ"]}
            onNumericChange={(typedStr) => {
                const n = parseFloat(typedStr);
                if (!isNaN(n) && n > 0) {
                    const mult = unit === "MΩ" ? 1e6 : unit === "kΩ" ? 1e3 : 1;
                    const ohms = Math.round(n * mult * 100) / 100;
                    onUpdate && onUpdate(component.id, {
                        resistance: ohms,
                        name: `Resistor (${n}${unit})`
                    });
                }
            }}
            onUnitChange={(newUnit) => {
                setUnit(newUnit);
                const mult = newUnit === "MΩ" ? 1e6 : newUnit === "kΩ" ? 1e3 : 1;
                const ohms = Math.round(displayNum * mult * 100) / 100;
                onUpdate && onUpdate(component.id, {
                    resistance: ohms,
                    name: `Resistor (${displayNum}${newUnit})`
                });
            }}
            onPresetSelect={(presetStr) => {
                const ohms = parseResistanceValue(presetStr);
                if (presetStr.includes("M")) setUnit("MΩ");
                else if (presetStr.includes("k")) setUnit("kΩ");
                else setUnit("Ω");

                onUpdate && onUpdate(component.id, {
                    resistance: ohms,
                    name: `Resistor (${presetStr})`
                });
            }}
            subtext="1/4W Metal Film"
        />
    );
}

function CapacitorValueControl({ component, onUpdate }) {
    const capStr = component.capacitance || "100nF";
    const match = capStr.match(/^([\d.]+)\s*([a-zA-ZµμF]+)$/);
    const initialNum = match ? match[1] : "100";
    const initialUnit = match ? match[2] : "nF";

    const [unit, setUnit] = useState(initialUnit);

    useEffect(() => {
        const m = (component.capacitance || "100nF").match(/^([\d.]+)\s*([a-zA-ZµμF]+)$/);
        if (m) setUnit(m[2]);
    }, [component.capacitance]);

    return (
        <StudioValueUnitControl
            label="Capacitance"
            numericValue={initialNum}
            unit={unit}
            units={["pF", "nF", "µF", "mF"]}
            presets={["10pF", "47pF", "100pF", "1nF", "10nF", "47nF", "100nF", "1µF", "10µF", "47µF", "100µF", "470µF"]}
            onNumericChange={(typedStr) => {
                const n = parseFloat(typedStr);
                if (!isNaN(n) && n > 0) {
                    const fullCap = `${n}${unit}`;
                    onUpdate && onUpdate(component.id, {
                        capacitance: fullCap,
                        name: `Ceramic Cap (${fullCap})`
                    });
                }
            }}
            onUnitChange={(newUnit) => {
                setUnit(newUnit);
                const fullCap = `${initialNum}${newUnit}`;
                onUpdate && onUpdate(component.id, {
                    capacitance: fullCap,
                    name: `Ceramic Cap (${fullCap})`
                });
            }}
            onPresetSelect={(presetStr) => {
                const m = presetStr.match(/^([\d.]+)\s*([a-zA-ZµμF]+)$/);
                if (m) setUnit(m[2]);
                onUpdate && onUpdate(component.id, {
                    capacitance: presetStr,
                    name: `Ceramic Cap (${presetStr})`
                });
            }}
            subtext="50V Ceramic Disk"
        />
    );
}

function ElectrolyticCapValueControl({ component, onUpdate }) {
    const capStr = component.capacitance || "10µF";
    const voltageRating = component.voltageRating || 50;

    const CAP_PRESETS = ["1µF", "4.7µF", "10µF", "22µF", "47µF", "100µF", "220µF", "470µF", "1000µF"];
    const VOLT_RATINGS = [16, 25, 35, 50, 63, 100];

    return (
        <div className="inspector-elec-cap-controls">
            <div className="inspector-label-inline">
                <i className="ri-contrast-2-fill"></i>
                <span>Capacitance</span>
            </div>

            <div className="compact-pill-selector-row">
                {CAP_PRESETS.map((val) => (
                    <button
                        key={val}
                        type="button"
                        className={`compact-pill-btn font-mono ${capStr === val ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { 
                            capacitance: val,
                            name: `Electrolytic Cap (${val})`
                        })}
                    >
                        {val}
                    </button>
                ))}
            </div>

            <div className="inspector-separator" />

            <div className="inspector-label-inline">
                <i className="ri-shield-check-line"></i>
                <span>Max Voltage</span>
            </div>

            <div className="compact-pill-selector-row">
                {VOLT_RATINGS.map((volt) => (
                    <button
                        key={volt}
                        type="button"
                        className={`compact-pill-btn font-mono ${voltageRating === volt ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { voltageRating: volt })}
                    >
                        {volt}V
                    </button>
                ))}
            </div>

            <span className="specs-subtext font-mono">
                Pin 1: Anode (+) • Pin 2: Cathode (−)
            </span>
        </div>
    );
}

function TransistorValueControl({ component, onUpdate }) {
    const isMosfet = component.type === "mosfet-n" || component.type === "mosfet-p" || component.type?.includes("mosfet");
    const isPnp = component.type === "transistor-pnp";

    const currentModel = component.model || (isMosfet ? "IRF540N" : isPnp ? "2N3906" : "2N2222");

    const BJT_MODELS = isPnp 
        ? [
            { name: "2N3906", hfe: 200, vce: "40V", ic: "200mA" },
            { name: "BC557", hfe: 250, vce: "45V", ic: "100mA" },
            { name: "BD140", hfe: 100, vce: "80V", ic: "1.5A" }
          ]
        : [
            { name: "2N2222", hfe: 150, vce: "40V", ic: "800mA" },
            { name: "2N3904", hfe: 200, vce: "40V", ic: "200mA" },
            { name: "BC547", hfe: 300, vce: "45V", ic: "100mA" },
            { name: "BD139", hfe: 100, vce: "80V", ic: "1.5A" }
          ];

    const MOSFET_MODELS = [
        { name: "IRF540N", type: "N-Ch Power", vds: "100V", id: "33A", rdson: "44mΩ" },
        { name: "IRLZ44N", type: "Logic N-Ch", vds: "55V", id: "47A", rdson: "22mΩ" },
        { name: "2N7000", type: "Small N-Ch", vds: "60V", id: "200mA", rdson: "5Ω" },
        { name: "FQP30N06L", type: "Logic N-Ch", vds: "60V", id: "32A", rdson: "35mΩ" }
    ];

    const activeList = isMosfet ? MOSFET_MODELS : BJT_MODELS;

    return (
        <div className="inspector-transistor-controls">
            <div className="inspector-label-inline">
                <i className={isMosfet ? "ri-flashlight-line" : "ri-git-commit-line"}></i>
                <span>{isMosfet ? "MOSFET Model" : "BJT Part Number"}</span>
            </div>

            <div className="compact-pill-selector-row">
                {activeList.map((m) => (
                    <button
                        key={m.name}
                        type="button"
                        className={`compact-pill-btn font-mono ${currentModel === m.name ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { 
                            model: m.name,
                            name: m.name,
                            designator: component.designator || m.name
                        })}
                    >
                        {m.name}
                    </button>
                ))}
            </div>

            <div className="inspector-separator" />

            <div className="transistor-pinout-strip font-mono">
                {isMosfet ? (
                    <span className="pinout-tag mosfet-tag">
                        <strong>TO-220 Pinout:</strong> 1: Gate (G) • 2: Drain (D) • 3: Source (S)
                    </span>
                ) : (
                    <span className="pinout-tag bjt-tag">
                        <strong>TO-92 Pinout:</strong> 1: Emitter (E) • 2: Base (B) • 3: Collector (C)
                    </span>
                )}
            </div>
        </div>
    );
}

function BatteryValueControl({ component, onUpdate }) {
    const rawV = component.voltage != null ? parseFloat(component.voltage) : 9;
    const [unit, setUnit] = useState("V");

    const displayNum = unit === "mV" ? +(rawV * 1000).toFixed(0) : rawV;

    return (
        <StudioValueUnitControl
            label="Voltage"
            numericValue={displayNum}
            unit={unit}
            units={["V", "mV"]}
            presets={["1.5V", "3V", "3.3V", "5V", "9V", "12V", "24V"]}
            onNumericChange={(typedStr) => {
                const n = parseFloat(typedStr);
                if (!isNaN(n) && n >= 0) {
                    const volts = unit === "mV" ? n / 1000 : n;
                    onUpdate && onUpdate(component.id, {
                        voltage: volts,
                        name: `Battery (${n}${unit})`
                    });
                }
            }}
            onUnitChange={(newUnit) => {
                setUnit(newUnit);
                const volts = newUnit === "mV" ? displayNum / 1000 : displayNum;
                onUpdate && onUpdate(component.id, {
                    voltage: volts,
                    name: `Battery (${volts}V)`
                });
            }}
            onPresetSelect={(presetStr) => {
                const volts = parseFloat(presetStr);
                setUnit("V");
                onUpdate && onUpdate(component.id, {
                    voltage: volts,
                    name: `Battery (${presetStr})`
                });
            }}
            subtext="DC Supply"
        />
    );
}

function AaBatteryValueControl({ component, onUpdate }) {
    const isAAA = component.type === "battery-aaa";
    const cellCount = component.cells || (component.voltage === 1.5 ? 1 : component.voltage === 6 ? 4 : component.voltage === 4.5 ? 3 : 2);
    const userHasSwitch = Boolean(component.hasSwitch);
    const isSwitchOn = userHasSwitch ? (component.switchState !== false && component.isOn !== false) : true;
    const caseColor = component.color || "#18181b";

    return (
        <div className="inspector-aa-controls" style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div className="inspector-field-group">
                    <span className="studio-control-label">Cells</span>
                    <div className="cells-segmented-picker">
                        {[1, 2, 3, 4].map((count) => (
                            <button
                                key={count}
                                type="button"
                                className={`cell-seg-btn ${cellCount === count ? "active" : ""}`}
                                onClick={() => {
                                    const volts = count * 1.5;
                                    onUpdate && onUpdate(component.id, {
                                        cells: count,
                                        voltage: volts,
                                        name: `${count}× ${isAAA ? "AAA" : "AA"} Pack (${volts}V)`
                                    });
                                }}
                            >
                                {count} {count === 1 ? "Cell" : "Cells"} ({count * 1.5}V)
                            </button>
                        ))}
                    </div>
                </div>

                <div className="inspector-field-group">
                    <span className="studio-control-label">Switch Option</span>
                    <button
                        type="button"
                        className={`battery-switch-toggle-btn ${userHasSwitch ? "is-on" : "is-off"}`}
                        onClick={() => {
                            onUpdate && onUpdate(component.id, { hasSwitch: !userHasSwitch });
                        }}
                        title={userHasSwitch ? "Integrated switch included on holder" : "No switch (direct wire output)"}
                    >
                        <span>{userHasSwitch ? "🔘 Switch: Added" : "⚪ Switch: None"}</span>
                    </button>
                </div>
            </div>

            {userHasSwitch && (
                <div className="inspector-field-group" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span className="studio-control-label">Switch State</span>
                    <button
                        type="button"
                        className={`battery-switch-toggle-btn ${isSwitchOn ? "is-on" : "is-off"}`}
                        onClick={() => {
                            const nextState = !isSwitchOn;
                            onUpdate && onUpdate(component.id, {
                                switchState: nextState,
                                isOn: nextState
                            });
                        }}
                    >
                        <span className="switch-status-dot"></span>
                        <span>{isSwitchOn ? "ON (Supplying Power)" : "OFF (Disconnected)"}</span>
                    </button>
                </div>
            )}

            <div className="inspector-field-group">
                <span className="studio-control-label">Case Color</span>
                <div className="wire-color-swatches compact-swatches">
                    {[
                        { name: "Matte Black", color: "#18181b" },
                        { name: "Duracell Gold", color: "#b45309" },
                        { name: "Industrial Slate", color: "#334155" },
                        { name: "Energy Cyan", color: "#0284c7" },
                        { name: "Safety Orange", color: "#ea580c" }
                    ].map((c) => (
                        <button
                            key={c.name}
                            type="button"
                            className={`color-swatch-btn ${caseColor === c.color ? "active" : ""}`}
                            style={{ "--swatch-color": c.color }}
                            onClick={() => onUpdate && onUpdate(component.id, { color: c.color })}
                            title={c.name}
                        />
                    ))}
                </div>
            </div>
            <span className="specs-subtext" style={{ fontSize: "10px", color: "#94a3b8" }}>{(cellCount * 1.5).toFixed(1)}V DC Nominal</span>
        </div>
    );
}

function LcdValueControl({ component, onUpdate }) {
    const is2004 = component.type === "lcd-2004" || Boolean(component.is2004) || component.size === "20x4";
    const backlightColor = component.backlightColor || "#0284c7";

    const LCD_BACKLIGHTS = [
        { name: "Classic Blue", color: "#0284c7", textColor: "#ffffff" },
        { name: "Neon Green", color: "#059669", textColor: "#064e3b" },
        { name: "Retro Amber", color: "#d97706", textColor: "#451a03" },
        { name: "Ice Cyan", color: "#06b6d4", textColor: "#083344" },
        { name: "OLED Obsidian", color: "#18181b", textColor: "#f8fafc" }
    ];

    return (
        <div className="inspector-lcd-controls">
            <div className="inspector-field-group">
                <span className="studio-control-label">Size</span>
                <div className="cells-segmented-picker">
                    <button
                        type="button"
                        className={`cell-seg-btn ${!is2004 ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { type: "lcd-1602", is2004: false, size: "16x2", name: "16x2 Character LCD" })}
                    >
                        16x2
                    </button>
                    <button
                        type="button"
                        className={`cell-seg-btn ${is2004 ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { type: "lcd-2004", is2004: true, size: "20x4", name: "20x4 Character LCD" })}
                    >
                        20x4 Large
                    </button>
                </div>
            </div>

            <div className="inspector-field-group">
                <span className="studio-control-label">Backlight</span>
                <div className="wire-color-swatches compact-swatches">
                    {LCD_BACKLIGHTS.map((bl) => (
                        <button
                            key={bl.name}
                            type="button"
                            className={`color-swatch-btn ${backlightColor === bl.color ? "active" : ""}`}
                            style={{ "--swatch-color": bl.color }}
                            onClick={() => onUpdate && onUpdate(component.id, { backlightColor: bl.color, lcdTextColor: bl.textColor })}
                            title={bl.name}
                        />
                    ))}
                </div>
            </div>
            <span className="specs-subtext">HD44780 Controller • I2C 0x27</span>
        </div>
    );
}

function UltrasonicValueControl({ component, onUpdate }) {
    const dist = component.distanceCm != null ? component.distanceCm : 25;
    return (
        <div className="inspector-ultrasonic-controls" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="inspector-field-group">
                <span className="studio-control-label">Distance</span>
                <div className="slider-with-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input 
                        type="range"
                        min="2"
                        max="400"
                        value={dist}
                        onChange={(e) => onUpdate && onUpdate(component.id, { distanceCm: Number(e.target.value) })}
                        className="studio-manual-number-input"
                    />
                    <span className="specs-subtext" style={{ minWidth: 42, fontWeight: 700 }}>{dist} cm</span>
                </div>
            </div>
            <div className="cells-segmented-picker">
                {[10, 25, 50, 100, 200].map(cm => (
                    <button
                        key={cm}
                        type="button"
                        className={`cell-seg-btn ${dist === cm ? "active" : ""}`}
                        onClick={() => onUpdate && onUpdate(component.id, { distanceCm: cm })}
                    >
                        {cm}cm
                    </button>
                ))}
            </div>
            <span className="specs-subtext">2cm - 400cm • 40kHz Sonar</span>
        </div>
    );
}

function PirValueControl({ component, onUpdate }) {
    const isMotion = Boolean(component.motionActive);
    return (
        <div className="inspector-pir-controls" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="inspector-field-group">
                <span className="studio-control-label">Sensor State</span>
                <button
                    type="button"
                    className={`cell-seg-btn ${isMotion ? "active" : ""}`}
                    style={{
                        background: isMotion ? "#f59e0b" : "rgba(255,255,255,0.08)",
                        color: isMotion ? "#000" : "#fff",
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 6
                    }}
                    onClick={() => {
                        const next = !isMotion;
                        onUpdate && onUpdate(component.id, { motionActive: next });
                        if (next) {
                            try { soundManager.playSensorPing("pir"); } catch (_) {}
                        }
                    }}
                >
                    {isMotion ? "🚨 Motion Detected (HIGH 3.3V)" : "Simulate Motion (LOW 0V)"}
                </button>
            </div>
            <span className="specs-subtext">HC-SR501 • 120° Pyroelectric Dome</span>
        </div>
    );
}

function ServoValueControl({ component, onUpdate }) {
    const curAngle = component.angle != null ? component.angle : 90;
    const handleAngleChange = (newAngle) => {
        const delta = Math.abs(curAngle - newAngle);
        onUpdate && onUpdate(component.id, { angle: newAngle });
        if (delta > 2) {
            try { soundManager.playServoMovement(component.id, delta); } catch (_) {}
        }
    };
    return (
        <div className="inspector-servo-controls" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="inspector-field-group">
                <span className="studio-control-label">Horn Angle</span>
                <div className="slider-with-val" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input 
                        type="range" 
                        min="0" 
                        max="180" 
                        value={curAngle} 
                        onChange={(e) => handleAngleChange(Number(e.target.value))}
                        className="studio-manual-number-input"
                    />
                    <span className="specs-subtext" style={{ minWidth: 36, fontWeight: 700 }}>{curAngle}°</span>
                </div>
            </div>
            <div className="cells-segmented-picker">
                {[0, 45, 90, 135, 180].map(a => (
                    <button
                        key={a}
                        type="button"
                        className={`cell-seg-btn ${curAngle === a ? "active" : ""}`}
                        onClick={() => handleAngleChange(a)}
                    >
                        {a}°
                    </button>
                ))}
            </div>
            <span className="specs-subtext">SG90 9g • 4.8V - 6V</span>
        </div>
    );
}

function MotorValueControl({ component, onUpdate }) {
    const is3D = component.is3D !== false && component.viewMode !== "2d";
    const speed = component.speed != null ? component.speed : 100;
    const rot3D = component.rot3D != null ? component.rot3D : 35;
    const pitch3D = component.pitch3D != null ? component.pitch3D : 20;
    const isGeared = component.type === "motor-geared" || component.type === "motor-bo";
    const accessory = component.accessory || "propeller"; // "propeller" | "axle"
    const gearRatio = component.gearRatio || "1:48";
    const direction = component.direction || "cw";

    const joystickRef = useRef(null);
    const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);

    const updateRotationFromPointer = (clientX, clientY) => {
        if (!joystickRef.current) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;

        // Angle in degrees from 0 to 359
        let rad = Math.atan2(dy, dx);
        let deg = Math.round((rad * 180) / Math.PI);
        let normalizedDeg = (deg + 360) % 360;

        // Radius for slight pitch dynamic
        const maxR = rect.width / 2 - 6;
        const dist = Math.min(maxR, Math.hypot(dx, dy));
        const factor = dist / maxR;
        const dynamicPitch = Math.round(15 + factor * 22);

        onUpdate && onUpdate(component.id, {
            rot3D: normalizedDeg,
            pitch3D: dynamicPitch,
            is3D: true,
            viewMode: "3d"
        });
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch (_) {}
        setIsDraggingJoystick(true);
        updateRotationFromPointer(e.clientX, e.clientY);
    };

    const handlePointerMove = (e) => {
        if (!isDraggingJoystick) return;
        e.preventDefault();
        e.stopPropagation();
        updateRotationFromPointer(e.clientX, e.clientY);
    };

    const handlePointerUp = (e) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch (_) {}
        setIsDraggingJoystick(false);
    };

    // Calculate thumb position within joystick ring (radius ~ 13px)
    const angleRad = (rot3D * Math.PI) / 180;
    const thumbDist = isDraggingJoystick ? 15 : 12;
    const thumbX = Math.cos(angleRad) * thumbDist;
    const thumbY = Math.sin(angleRad) * thumbDist;

    return (
        <div className="inspector-motor-controls">
            {/* ROW 1: Renderer Mode (2D / 3D) & Direction Toggle */}
            <div className="motor-controls-row">
                <div className="inspector-field-group">
                    <span className="studio-control-label">Renderer</span>
                    <div className="motor-mode-toggle-group">
                        <button
                            type="button"
                            className={`motor-mode-btn ${!is3D ? "active" : ""}`}
                            onClick={() => onUpdate && onUpdate(component.id, { is3D: false, viewMode: "2d" })}
                            title="2D Top-Down Schematic View"
                        >
                            <span>2D Canvas</span>
                        </button>
                        <button
                            type="button"
                            className={`motor-mode-btn ${is3D ? "active" : ""}`}
                            onClick={() => onUpdate && onUpdate(component.id, { is3D: true, viewMode: "3d" })}
                            title="3D Ultra-Realistic Three.js WebGL Engine"
                        >
                            <span>3D Three.js</span>
                        </button>
                    </div>
                </div>

                <div className="inspector-field-group">
                    <span className="studio-control-label">Direction</span>
                    <div className="motor-mode-toggle-group">
                        <button
                            type="button"
                            className={`motor-mode-btn ${direction === "cw" ? "active" : ""}`}
                            onClick={() => onUpdate && onUpdate(component.id, { direction: "cw" })}
                            title="Clockwise Rotation"
                        >
                            <span>CW ↻</span>
                        </button>
                        <button
                            type="button"
                            className={`motor-mode-btn ${direction === "ccw" ? "active" : ""}`}
                            onClick={() => onUpdate && onUpdate(component.id, { direction: "ccw" })}
                            title="Counter-Clockwise Rotation"
                        >
                            <span>CCW ↺</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ROW 2 (If 3D): 360° Circular Analog Joystick & Quick Snaps */}
            {is3D && (
                <div className="motor-controls-row" style={{ background: "rgba(0, 0, 0, 0.35)", padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <div className="joystick-control-cluster" style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {/* Interactive Gimbal Pad */}
                            <div
                                ref={joystickRef}
                                className={`motor-joystick-pad ${isDraggingJoystick ? "active-drag" : ""}`}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                title="Drag or click to rotate 3D Motor 360°"
                            >
                                <div className="joystick-crosshair-h"></div>
                                <div className="joystick-crosshair-v"></div>
                                <div className="joystick-center-well"></div>
                                <div
                                    className="motor-joystick-thumb"
                                    style={{
                                        transform: `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`
                                    }}
                                >
                                    <span className="thumb-led-dot"></span>
                                </div>
                            </div>
                            <span className="joystick-angle-badge" style={{ fontSize: "10px", fontWeight: 800 }}>{rot3D}°</span>
                        </div>

                        {/* Quick Snap Preset Orbit Angles */}
                        <div style={{ display: "flex", gap: 4 }}>
                            {[
                                { label: "0° Front", rot: 0, pitch: 20 },
                                { label: "45° Iso", rot: 45, pitch: 25 },
                                { label: "90° Side", rot: 90, pitch: 20 },
                                { label: "180° Rear", rot: 180, pitch: 20 }
                            ].map(p => (
                                <button
                                    key={p.rot}
                                    type="button"
                                    className={`joystick-snap-btn ${rot3D === p.rot ? "snap-active" : ""}`}
                                    onClick={() => onUpdate && onUpdate(component.id, { rot3D: p.rot, pitch3D: p.pitch })}
                                    style={{ fontSize: "10px", padding: "2px 6px" }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ROW 3: Customization Options (Gear Ratio or Shaft Accessory) */}
            <div className="motor-controls-row">
                {!isGeared ? (
                    <div className="inspector-field-group">
                        <span className="studio-control-label">Shaft Accessory</span>
                        <div className="motor-mode-toggle-group">
                            <button
                                type="button"
                                className={`motor-mode-btn ${accessory === "propeller" ? "active" : ""}`}
                                onClick={() => onUpdate && onUpdate(component.id, { accessory: "propeller" })}
                                title="Mount 3-Blade Aviation Propeller Fan"
                            >
                                <span>🌀 Propeller</span>
                            </button>
                            <button
                                type="button"
                                className={`motor-mode-btn ${accessory === "axle" ? "active" : ""}`}
                                onClick={() => onUpdate && onUpdate(component.id, { accessory: "axle" })}
                                title="Bare Hardened Steel Axle Shaft"
                            >
                                <span>🔩 Bare Axle</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="inspector-field-group">
                        <span className="studio-control-label">Gear Ratio</span>
                        <div className="motor-mode-toggle-group">
                            {["1:48", "1:120", "1:220"].map(ratio => (
                                <button
                                    key={ratio}
                                    type="button"
                                    className={`motor-mode-btn ${gearRatio === ratio ? "active" : ""}`}
                                    onClick={() => onUpdate && onUpdate(component.id, { gearRatio: ratio })}
                                    title={`Internal Gearbox Ratio ${ratio}`}
                                >
                                    <span>{ratio}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ROW 4: Live Tachometer Telemetry Card */}
            <div className="inspector-field-group" style={{ background: "rgba(2, 6, 23, 0.65)", padding: "4px 8px", borderRadius: 8, border: "1px solid rgba(56, 189, 248, 0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: speed > 0 ? "#22c55e" : "#64748b", boxShadow: speed > 0 ? "0 0 8px #22c55e" : "none" }}></span>
                        <span className="studio-control-label" style={{ margin: 0 }}>Tachometer</span>
                    </div>
                    <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 900, fontSize: "11px" }}>
                        {speed > 0 
                            ? (isGeared 
                                ? `${Math.round((speed / 100) * (gearRatio === "1:220" ? 45 : gearRatio === "1:120" ? 90 : 220))} RPM` 
                                : `${Math.round((speed / 100) * 12500).toLocaleString()} RPM`)
                            : "0 RPM"}
                    </span>
                </div>
                <div className="slider-with-val" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <input 
                        type="range"
                        min="0"
                        max="100"
                        value={speed}
                        onChange={(e) => onUpdate && onUpdate(component.id, { speed: Number(e.target.value) })}
                        className="studio-manual-number-input"
                    />
                    <span className="specs-subtext" style={{ minWidth: 36, fontWeight: 700 }}>{speed}%</span>
                </div>
            </div>
        </div>
    );
}

function PhotoresistorValueControl({ component, onUpdate }) {
    const rawLux = component.lux != null ? Number(component.lux) : 300;
    const calcR = Math.round(500000 / (Math.pow(Math.max(1, rawLux), 0.7) + 1));
    const rStr = calcR >= 1e6 ? `${(calcR / 1e6).toFixed(2)} MΩ` : calcR >= 1e3 ? `${(calcR / 1e3).toFixed(1)} kΩ` : `${calcR} Ω`;

    return (
        <div className="inspector-field-group" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="studio-control-label">Ambient Light (Lux)</span>
                <span style={{ fontFamily: "monospace", color: "#f59e0b", fontWeight: 800, fontSize: "11px" }}>
                    ☀️ {rawLux} Lux ({rStr})
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                    type="range"
                    min="0"
                    max="1000"
                    value={rawLux}
                    onChange={(e) => onUpdate && onUpdate(component.id, { lux: Number(e.target.value), resistance: calcR })}
                    className="studio-manual-number-input"
                    style={{ flex: 1 }}
                />
            </div>

            <div style={{ display: "flex", gap: 4 }}>
                {[
                    { label: "Dark (10 lx)", lux: 10 },
                    { label: "Room (300 lx)", lux: 300 },
                    { label: "Sunlight (1000 lx)", lux: 1000 }
                ].map(p => (
                    <button
                        key={p.lux}
                        type="button"
                        className={`motor-mode-btn ${rawLux === p.lux ? "active" : ""}`}
                        style={{ fontSize: "10px", padding: "2px 6px" }}
                        onClick={() => onUpdate && onUpdate(component.id, { lux: p.lux, resistance: Math.round(500000 / (Math.pow(p.lux, 0.7) + 1)) })}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function TempSensorValueControl({ component, onUpdate }) {
    const rawTemp = component.temperature != null ? Number(component.temperature) : 25;
    const vOut = Math.min(5.0, Math.max(0.1, 0.5 + rawTemp * 0.01));

    return (
        <div className="inspector-field-group" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="studio-control-label">Temperature (°C)</span>
                <span style={{ fontFamily: "monospace", color: "#38bdf8", fontWeight: 800, fontSize: "11px" }}>
                    🌡️ {rawTemp}°C (VOUT: {(vOut * 1000).toFixed(0)}mV)
                </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                    type="range"
                    min="-40"
                    max="125"
                    value={rawTemp}
                    onChange={(e) => onUpdate && onUpdate(component.id, { temperature: Number(e.target.value) })}
                    className="studio-manual-number-input"
                    style={{ flex: 1 }}
                />
                <span className="specs-subtext" style={{ minWidth: 32, fontWeight: 700 }}>{rawTemp}°C</span>
            </div>

            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[
                    { label: "Freezing (0°C)", temp: 0 },
                    { label: "Room (25°C)", temp: 25 },
                    { label: "Body (37°C)", temp: 37 },
                    { label: "Boiling (100°C)", temp: 100 }
                ].map(p => (
                    <button
                        key={p.temp}
                        type="button"
                        className={`motor-mode-btn ${rawTemp === p.temp ? "active" : ""}`}
                        style={{ fontSize: "10px", padding: "2px 6px" }}
                        onClick={() => onUpdate && onUpdate(component.id, { temperature: p.temp })}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function PotentiometerValueControl({ component, onUpdate }) {
    const rawR = component.resistance != null ? Number(component.resistance) : 10000;
    const [unit, setUnit] = useState(rawR >= 1e6 ? "MΩ" : rawR >= 1e3 ? "kΩ" : "Ω");

    const displayNum = unit === "MΩ" ? +(rawR / 1e6).toFixed(3) : unit === "kΩ" ? +(rawR / 1e3).toFixed(3) : rawR;

    return (
        <StudioValueUnitControl
            label="Resistance"
            numericValue={displayNum}
            unit={unit}
            units={["kΩ", "Ω", "MΩ"]}
            presets={["1kΩ", "5kΩ", "10kΩ", "20kΩ", "50kΩ", "100kΩ", "1MΩ"]}
            onNumericChange={(typedStr) => {
                const n = parseFloat(typedStr);
                if (!isNaN(n) && n > 0) {
                    const mult = unit === "MΩ" ? 1e6 : unit === "kΩ" ? 1e3 : 1;
                    const ohms = Math.round(n * mult);
                    onUpdate && onUpdate(component.id, {
                        resistance: ohms,
                        name: `Potentiometer (${n}${unit})`
                    });
                }
            }}
            onUnitChange={(newUnit) => {
                setUnit(newUnit);
                const mult = newUnit === "MΩ" ? 1e6 : newUnit === "kΩ" ? 1e3 : 1;
                const ohms = Math.round(displayNum * mult);
                onUpdate && onUpdate(component.id, {
                    resistance: ohms,
                    name: `Potentiometer (${displayNum}${newUnit})`
                });
            }}
            onPresetSelect={(presetStr) => {
                const ohms = parseResistanceValue(presetStr);
                if (presetStr.includes("M")) setUnit("MΩ");
                else if (presetStr.includes("k")) setUnit("kΩ");
                else setUnit("Ω");
                onUpdate && onUpdate(component.id, {
                    resistance: ohms,
                    name: `Potentiometer (${presetStr})`
                });
            }}
            subtext={`Wiper: ${Math.round((component.wiperValue ?? 0.5) * 100)}%`}
        />
    );
}

function TopFloatingBar({
    projectName = "Project - 1",
    projectAccent = "#FF8A00",
    onRenameProject,
    onBackToHome, 
    selectedComponent,
    onUpdateComponent,
    onRotate, 
    onDelete,
    onAddComponent,
    isWireMode,
    onToggleWireMode,
    wireColor = "#10b981",
    onChangeWireColor,
    routingMode = "curved",
    onChangeRoutingMode,
    selectedWire,
    onUpdateWire,
    onDeleteWire,
    zoom = 1,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onResetView,
    isZoomLocked = false,
    onToggleZoomLock,
    isFocusMode = false,
    onToggleFocusMode,
    isSimulating = false,
    onStartSimulation,
    onStopSimulation,
    isCodeOpen = false,
    onToggleCodeEditor,
    viewMode = "simulation",
    onChangeViewMode,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onOpenSearch
}) {
    const { isDark, toggleTheme } = useTheme();
    const [isComponentsOpen, setIsComponentsOpen] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [internalViewMode, setInternalViewMode] = useState("simulation");
    const effectiveViewMode = viewMode || internalViewMode;

    const handleToggleViewMode = () => {
        const nextMode = effectiveViewMode === "simulation" ? "schematic" : "simulation";
        if (onChangeViewMode) {
            onChangeViewMode(nextMode);
        } else {
            setInternalViewMode(nextMode);
        }
    };
    
    // Editable Project Name state
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInputValue, setNameInputValue] = useState(projectName || "Project - 1");
    const nameInputRef = useRef(null);

    useEffect(() => {
        setNameInputValue(projectName || "Project - 1");
    }, [projectName]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const handleStartEditing = () => {
        setNameInputValue(projectName || "Project - 1");
        setIsEditingName(true);
    };

    const handleCommitName = () => {
        setIsEditingName(false);
        const trimmed = (nameInputValue || "").trim();
        if (trimmed && trimmed !== projectName) {
            onRenameProject && onRenameProject(trimmed);
        } else {
            setNameInputValue(projectName || "Project - 1");
        }
    };

    const barWrapperRef = useRef(null);
    const [editingCompName, setEditingCompName] = useState(null);

    useEffect(() => {
        setEditingCompName(null);
    }, [selectedComponent?.id]);

    // Close overlays (Zoom popover, Components dropdown) when clicking outside on the screen
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (barWrapperRef.current && !barWrapperRef.current.contains(e.target)) {
                setIsComponentsOpen(false);
                setIsZoomOpen(false);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Determine what Contextual Inspector bar should show (Mutually exclusive: component OR wire)
    const showInspector = Boolean(selectedComponent || isWireMode || selectedWire);

    return (
        <header className="top-floating-bar-wrapper" ref={barWrapperRef}>
            {/* ============================================================
                MAIN TOP BAR (DIVIDED INTO 3 DISTINCT FLOATING ISLANDS)
            ============================================================ */}
            <div className="top-floating-bar">
                
                {/* ------------------------------------------------------------
                    1. TOP LEFT BAR: Back Button, Editable Title, Components
                ------------------------------------------------------------ */}
                <div className="topbar-section left-section">
                    {/* Back Button with Smooth Hover Toast */}
                    {onBackToHome && (
                        <div className="back-btn-wrap">
                            <button 
                                className="top-icon-btn back-btn" 
                                onClick={onBackToHome} 
                                aria-label="Return to Dashboard"
                            >
                                <i className="ri-arrow-left-line"></i>
                            </button>
                            <span className="back-hover-toast">Dashboard</span>
                        </div>
                    )}

                    <div className="top-divider"></div>

                    {/* Minimalist Studio Project Name Pill (No border, subtle background only) */}
                    <div 
                        className={`project-name-pill ${isEditingName ? "is-editing" : ""}`}
                        onClick={() => {
                            if (!isEditingName) handleStartEditing();
                        }}
                    >
                        <span 
                            className="project-status-dot"
                            style={{
                                background: projectAccent || "#FF8A00",
                                color: projectAccent || "#FF8A00"
                            }}
                        />
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                type="text"
                                className="topbar-project-name-input"
                                value={nameInputValue}
                                onChange={(e) => setNameInputValue(e.target.value)}
                                onBlur={handleCommitName}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCommitName();
                                    if (e.key === "Escape") {
                                        setNameInputValue(projectName || "Project - 1");
                                        setIsEditingName(false);
                                    }
                                }}
                                maxLength={30}
                                autoFocus
                                style={{ width: `${Math.max(65, Math.min(180, (nameInputValue || "").length * 8.5 + 4))}px` }}
                            />
                        ) : (
                            <div className="project-name-display-row">
                                <span 
                                    className="project-name-text"
                                    title="Click to rename project"
                                >
                                    {projectName || "Project - 1"}
                                </span>
                                <span className="topbar-cloud-indicator" title="Synced with TwinLab Cloud Vault">
                                    <i className="ri-cloud-line" />
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="top-divider"></div>

                    {/* Components Dropdown with Realistic Miniature Visuals */}
                    <div className="components-dropdown-wrap">
                        <button 
                            className={`top-tool-btn components-toggle-btn ${isComponentsOpen ? "active" : ""}`}
                            onClick={() => setIsComponentsOpen(!isComponentsOpen)}
                            title="Open Components Palette"
                        >
                            <i className="ri-layout-grid-line"></i>
                            <span>Components</span>
                            <i className={`ri-arrow-${isComponentsOpen ? "up" : "down"}-s-line caret`}></i>
                        </button>

                        <AnimatePresence>
                            {isComponentsOpen && (
                                <motion.div 
                                    className="components-palette-drawer"
                                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.16, ease: "easeOut" }}
                                >
                                    <div className="palette-header">
                                        <span>Components Palette</span>
                                        <small>Click to place on canvas</small>
                                    </div>

                                    <div className="palette-grid">
                                        {/* Wire item */}
                                        <button
                                            className={`palette-item ${isWireMode ? "wire-active" : ""}`}
                                            onClick={() => {
                                                onToggleWireMode();
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Toggle Connecting Wire tool"
                                        >
                                            <div className="palette-item-miniature wire-miniature">
                                                <svg width="34" height="20" viewBox="0 0 34 20">
                                                    <path d="M 4 10 Q 17 0 30 10" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                                    <circle cx="4" cy="10" r="2.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                                                    <circle cx="30" cy="10" r="2.5" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                                                </svg>
                                            </div>
                                            <span>Wire</span>
                                        </button>

                                        {/* Resistor item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "resistor", name: "Resistor (220Ω)", resistance: 220 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add 220Ω Resistor"
                                        >
                                            <div className="palette-item-miniature resistor-miniature">
                                                <div className="mini-resistor-lead"></div>
                                                <div className="mini-resistor-body">
                                                    <span className="b-red"></span>
                                                    <span className="b-red"></span>
                                                    <span className="b-brown"></span>
                                                    <span className="b-gold"></span>
                                                </div>
                                                <div className="mini-resistor-lead"></div>
                                            </div>
                                            <span>Resistor</span>
                                        </button>

                                        {/* LED item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "led", name: "5mm LED (Red)", color: "#ef4444" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add 5mm Red LED"
                                        >
                                            <div className="palette-item-miniature led-miniature">
                                                <div className="mini-led-dome"></div>
                                                <div className="mini-led-leads">
                                                    <span></span><span></span>
                                                </div>
                                            </div>
                                            <span>LED</span>
                                        </button>

                                        {/* Battery item (default 9V) */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "battery-9v", name: "Battery", voltage: 9 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Battery"
                                        >
                                            <div className="palette-item-miniature battery-miniature">
                                                <div className="mini-battery-snaps">
                                                    <span className="pos">+</span>
                                                    <span className="neg">-</span>
                                                </div>
                                                <div className="mini-battery-body"></div>
                                            </div>
                                            <span>Battery</span>
                                        </button>

                                        {/* Capacitor item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "capacitor-ceramic", name: "Ceramic Capacitor (100nF)" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Ceramic Capacitor"
                                        >
                                            <div className="palette-item-miniature cap-miniature">
                                                <div className="mini-cap-disc">104</div>
                                                <div className="mini-cap-leads">
                                                    <span></span><span></span>
                                                </div>
                                            </div>
                                            <span>Capacitor</span>
                                        </button>

                                        {/* Pushbutton item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "button", name: "Tactile Pushbutton" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Tactile Pushbutton"
                                        >
                                            <div className="palette-item-miniature button-miniature">
                                                <div className="mini-btn-case">
                                                    <div className="mini-btn-plunger"></div>
                                                </div>
                                            </div>
                                            <span>Button</span>
                                        </button>

                                        {/* Potentiometer item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "potentiometer", name: "Potentiometer (10kΩ)" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Potentiometer"
                                        >
                                            <div className="palette-item-miniature pot-miniature">
                                                <div className="mini-pot-dial"></div>
                                            </div>
                                            <span>Potentiometer</span>
                                        </button>

                                        {/* Buzzer item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "buzzer", name: "Piezo Buzzer" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Piezo Buzzer"
                                        >
                                            <div className="palette-item-miniature buzzer-miniature">
                                                <div className="mini-buzzer-cylinder">
                                                    <div className="mini-buzzer-hole"></div>
                                                </div>
                                            </div>
                                            <span>Buzzer</span>
                                        </button>

                                        {/* LCD 1602 Character Display */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "lcd-1602", name: "16x2 LCD Display" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add 16x2 Character LCD Display (I2C)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(2, 132, 199, 0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-tv-line" style={{ color: "#38bdf8", fontSize: 16 }}></i>
                                            </div>
                                            <span>LCD 16x2</span>
                                        </button>

                                        {/* AA Battery Case (2x AA = 3.0V) */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "battery-aa", name: "AA Battery Case", cells: 2, voltage: 3 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add 2× AA Battery Pack (3.0V)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(234, 179, 8, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-battery-2-charge-line" style={{ color: "#facc15", fontSize: 16 }}></i>
                                            </div>
                                            <span>AA Pack</span>
                                        </button>

                                        {/* AAA Battery Case */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "battery-aaa", name: "AAA Battery Case", cells: 2, voltage: 3 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add 2× AAA Battery Pack (3.0V)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(234, 179, 8, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-battery-line" style={{ color: "#facc15", fontSize: 16 }}></i>
                                            </div>
                                            <span>AAA Pack</span>
                                        </button>

                                        {/* Toggle Switch SPST */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "switch-spst", name: "Toggle Switch", isOn: false });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add SPST Toggle Switch"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(220, 38, 38, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-switch-line" style={{ color: "#ef4444", fontSize: 16 }}></i>
                                            </div>
                                            <span>Switch</span>
                                        </button>

                                        {/* Slide Switch */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "slide-switch", name: "Slide Switch" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add SPDT Slide Switch"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(148, 163, 184, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-toggle-line" style={{ color: "#cbd5e1", fontSize: 16 }}></i>
                                            </div>
                                            <span>Slide Switch</span>
                                        </button>

                                        {/* 130 DC Motor */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "motor-dc", name: "130 DC Motor", speed: 100, accessory: "propeller" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Standard 130 Cylindrical DC Motor"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(14, 165, 233, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-refresh-line" style={{ color: "#38bdf8", fontSize: 16 }}></i>
                                            </div>
                                            <span>DC Motor</span>
                                        </button>

                                        {/* TT Geared DC Motor (Yellow BO) */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "motor-geared", name: "TT Geared DC Motor", speed: 100, gearRatio: "1:48", direction: "cw" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Yellow TT Dual-Shaft Geared DC Motor (BO Motor)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(234, 179, 8, 0.2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-steering-2-line" style={{ color: "#eab308", fontSize: 16 }}></i>
                                            </div>
                                            <span>Yellow Geared Motor</span>
                                        </button>

                                        {/* TMP36 Temperature Sensor */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "sensor-temp", name: "TMP36 Temp Sensor", temperature: 25 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Precision TMP36 Temperature Sensor"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(56, 189, 248, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-temp-hot-line" style={{ color: "#38bdf8", fontSize: 16 }}></i>
                                            </div>
                                            <span>Temp Sensor (TMP36)</span>
                                        </button>

                                        {/* Photoresistor (LDR) */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "photoresistor", name: "Photoresistor (LDR)", lux: 300 });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Photoresistor / Light Dependent Resistor (LDR)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(245, 158, 11, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-sun-line" style={{ color: "#f59e0b", fontSize: 16 }}></i>
                                            </div>
                                            <span>Photoresistor (LDR)</span>
                                        </button>

                                        {/* Raspberry Pi Pico */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "rpi-pico", name: "Raspberry Pi Pico" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Raspberry Pi Pico (RP2040)"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(16, 185, 129, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-cpu-line" style={{ color: "#10b981", fontSize: 16 }}></i>
                                            </div>
                                            <span>Raspberry Pi Pico</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Selected Item Quick Action (Component: Rotate + Delete, Wire: Only Delete) */}
                    <AnimatePresence>
                        {(selectedComponent || selectedWire) && (
                            <motion.div 
                                className="selected-actions-group"
                                initial={{ opacity: 0, width: 0, scale: 0.85 }}
                                animate={{ opacity: 1, width: "auto", scale: 1 }}
                                exit={{ opacity: 0, width: 0, scale: 0.85 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <div className="top-divider"></div>
                                {selectedComponent && (
                                    <button className="top-icon-btn" onClick={onRotate} title="Rotate 90° (R)">
                                        <i className="ri-refresh-line"></i>
                                    </button>
                                )}
                                <button 
                                    className="top-icon-btn delete-btn" 
                                    onClick={() => {
                                        if (selectedComponent) {
                                            onDelete && onDelete();
                                        } else if (selectedWire) {
                                            if (onDeleteWire) onDeleteWire(selectedWire.id);
                                            else if (onDelete) onDelete();
                                        }
                                    }} 
                                    title={selectedComponent ? "Delete Component (Del)" : "Delete Wire (Del)"}
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ------------------------------------------------------------
                    2. CENTER TOP BAR: Exactly 4 Buttons (Run, Stop, Focus, Zoom)
                ------------------------------------------------------------ */}
                <div className="topbar-section center-section">
                    <div className="sim-controls-pill">
                        {/* 1. Run / Play */}
                        <button 
                            className={`sim-btn play ${isSimulating ? "running" : ""}`} 
                            onClick={onStartSimulation}
                            title={isSimulating ? "Simulation is running in real-time" : "Start Simulation"}
                        >
                            <i className="ri-play-fill"></i>
                            {isSimulating && <span className="sim-running-dot"></span>}
                        </button>

                        {/* 2. Stop */}
                        <button 
                            className={`sim-btn stop ${!isSimulating ? "inactive" : ""}`} 
                            onClick={onStopSimulation}
                            title={isSimulating ? "Stop Simulation" : "Simulation stopped"}
                        >
                            <i className="ri-stop-fill"></i>
                        </button>

                        <div className="sim-divider"></div>

                        {/* 3. Focus Mode */}
                        <button 
                            className={`sim-btn focus ${isFocusMode ? "active" : ""}`} 
                            onClick={onToggleFocusMode} 
                            title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
                        >
                            <i className="ri-focus-3-line"></i>
                        </button>

                        {/* 4. Zoom Controls Popover Button */}
                        <div className="zoom-btn-container">
                            <button 
                                className={`sim-btn zoom-btn ${isZoomOpen ? "active" : ""}`} 
                                onClick={() => setIsZoomOpen(!isZoomOpen)}
                                title={`Zoom: ${Math.round(zoom * 100)}% (Click for controls)`}
                            >
                                <i className="ri-zoom-in-line"></i>
                                <span className="zoom-quick-percent">{Math.round(zoom * 100)}%</span>
                            </button>

                            {/* Zoom Dropdown Controls */}
                            <AnimatePresence>
                                {isZoomOpen && (
                                    <motion.div 
                                        className="zoom-dropdown-popover"
                                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <button 
                                            className="zoom-pop-btn" 
                                            onClick={() => { onZoomOut(); }}
                                            disabled={isZoomLocked}
                                            title="Zoom Out (-)"
                                        >
                                            <i className="ri-subtract-line"></i>
                                        </button>
                                        <button 
                                            className="zoom-pop-reset" 
                                            onClick={() => { onResetZoom(); }}
                                            title="Reset zoom to 100%"
                                        >
                                            {Math.round(zoom * 100)}%
                                        </button>
                                        <button 
                                            className="zoom-pop-btn" 
                                            onClick={() => { onZoomIn(); }}
                                            disabled={isZoomLocked}
                                            title="Zoom In (+)"
                                        >
                                            <i className="ri-add-line"></i>
                                        </button>
                                        <div className="zoom-pop-divider"></div>
                                        <button 
                                            className="zoom-pop-btn" 
                                            onClick={() => { onResetView(); }}
                                            title="Center Workspace"
                                        >
                                            <i className="ri-fullscreen-line"></i>
                                        </button>
                                        <button 
                                            className={`zoom-pop-btn ${isZoomLocked ? "locked" : ""}`} 
                                            onClick={() => { onToggleZoomLock(); }}
                                            title={isZoomLocked ? "Unlock Zoom" : "Lock Zoom"}
                                        >
                                            <i className={isZoomLocked ? "ri-lock-fill" : "ri-lock-unlock-line"}></i>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------------------
                    3. TOP RIGHT BAR: Undo/Redo, Search, Modes, Code Bar
                ------------------------------------------------------------ */}
                <div className="topbar-section right-section">
                    {/* Undo & Redo Buttons */}
                    <div className="undo-redo-pill">
                        <button 
                            type="button"
                            className="undo-redo-btn"
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                        >
                            <i className="ri-arrow-go-back-line"></i>
                        </button>
                        <button 
                            type="button"
                            className="undo-redo-btn"
                            onClick={onRedo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Y)"
                        >
                            <i className="ri-arrow-go-forward-line"></i>
                        </button>
                    </div>

                    <div className="top-divider"></div>

                    {/* Search Component Modal Trigger */}
                    <button 
                        className="top-search-btn" 
                        onClick={onOpenSearch}
                        title="Search Components (Ctrl+F)"
                    >
                        <i className="ri-search-line"></i>
                        <span>Search</span>
                        <span className="search-kbd-chip">Ctrl F</span>
                    </button>

                    <div className="top-divider"></div>

                    {/* Modes Pill: Theme Switcher & Schematic Mode */}
                    <div className="modes-pill">
                        {/* Quick Theme Toggle */}
                        <button 
                            className="mode-btn theme-btn"
                            onClick={toggleTheme}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
                        </button>

                        <div className="mode-sub-divider"></div>

                        {/* View Mode: Simulation vs Schematic */}
                        <button 
                            className={`mode-btn view-btn ${effectiveViewMode === "simulation" ? "active" : ""}`}
                            onClick={handleToggleViewMode}
                            title={effectiveViewMode === "simulation" ? "Switch to Schematic View" : "Switch to Circuit Simulation"}
                        >
                            <i className={effectiveViewMode === "simulation" ? "ri-cpu-line" : "ri-git-branch-line"}></i>
                            <span className="mode-label">{effectiveViewMode === "simulation" ? "Circuit" : "Schematic"}</span>
                        </button>
                    </div>

                    <div className="top-divider"></div>

                    {/* Code Bar */}
                    <button 
                        className={`code-pill-btn ${isCodeOpen ? "active" : ""}`} 
                        onClick={onToggleCodeEditor}
                        title="Toggle Embedded C++ Firmware Editor"
                    >
                        <i className="ri-code-s-slash-line"></i>
                        <span>Code</span>
                        <span className="code-badge">C++</span>
                    </button>
                </div>
            </div>

            {/* ============================================================
                DYNAMIC CONTEXTUAL PROPERTY INSPECTOR BAR
                (Displays directly below the left top bar whenever Wire, 
                 Resistor, Capacitor, LED, Battery, Potentiometer, Buzzer,
                 Buttons, Switches, Multimeter or MCU is active)
            ============================================================ */}
            <AnimatePresence mode="wait">
                {showInspector && (
                    <motion.div 
                        key={selectedComponent?.id ? `comp-${selectedComponent.id}` : (isWireMode ? "wire-mode" : "wire-sel")}
                        className="context-property-bar compact-two-row-bar"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {selectedComponent ? (
                            <div className="inspector-two-rows">
                                {/* ROW 1: Component Type Badge, Editable Name Box, and Quick Actions */}
                                <div className="inspector-row-top">
                                    <div className="inspector-type-badge">
                                        <i className={COMPONENT_META[selectedComponent.type]?.icon || "ri-cpu-line"}></i>
                                        <span>{COMPONENT_META[selectedComponent.type]?.label || "Component"}</span>
                                    </div>

                                    <div className="inspector-name-edit-wrap">
                                        <span className="name-prefix">Name</span>
                                        <input
                                            type="text"
                                            className="compact-name-input"
                                            value={editingCompName !== null ? editingCompName : (selectedComponent.designator || selectedComponent.name || "")}
                                            onFocus={() => setEditingCompName(selectedComponent.designator || selectedComponent.name || "")}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setEditingCompName(val);
                                                onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                    designator: val,
                                                    name: val
                                                });
                                            }}
                                            onBlur={() => {
                                                setEditingCompName(null);
                                            }}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === "Enter") {
                                                    e.target.blur();
                                                } else if (e.key === "Escape") {
                                                    setEditingCompName(null);
                                                }
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="1"
                                            title="Click to rename component"
                                        />
                                    </div>

                                    <div className="inspector-quick-actions">
                                        {onRotate && (
                                            <button
                                                type="button"
                                                className="inspector-action-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRotate(selectedComponent.id);
                                                }}
                                                title="Rotate 90° (R)"
                                            >
                                                <i className="ri-anticlockwise-2-line"></i>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                type="button"
                                                className="inspector-action-btn delete-action"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(selectedComponent.id);
                                                }}
                                                title="Delete (Del)"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ROW 2: Values & Properties with Manual Writing, Value Dropdowns & Unit Dropdowns */}
                                <div className="inspector-row-bottom">
                                    {/* Resistor */}
                                    {selectedComponent.type === "resistor" && (
                                        <ResistorValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* Capacitor */}
                                    {selectedComponent.type === "capacitor-ceramic" && (
                                        <CapacitorValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* Electrolytic Capacitor */}
                                    {selectedComponent.type === "capacitor-electrolytic" && (
                                        <ElectrolyticCapValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* Transistors & MOSFETs */}
                                    {(selectedComponent.type === "transistor" || 
                                      selectedComponent.type === "transistor-npn" || 
                                      selectedComponent.type === "transistor-pnp" || 
                                      selectedComponent.type === "mosfet-n" || 
                                      selectedComponent.type === "mosfet-p" ||
                                      selectedComponent.type?.includes("transistor") ||
                                      selectedComponent.type?.includes("mosfet")) && (
                                        <TransistorValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* 9V Battery */}
                                    {selectedComponent.type === "battery-9v" && (
                                        <BatteryValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* AA & AAA Battery Pack */}
                                    {(selectedComponent.type === "battery-aa" || selectedComponent.type === "battery-aaa") && (
                                        <AaBatteryValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* Coin Cell (CR2032) */}
                                    {selectedComponent.type === "battery-coin" && (
                                        <div className="inspector-simple-badge-row">
                                            <i className="ri-copper-coin-line"></i>
                                            <span>3.0V Lithium Coin Cell (CR2032)</span>
                                        </div>
                                    )}

                                    {/* LCD Screen (16x2 and 20x4) */}
                                    {(selectedComponent.type === "lcd-1602" || selectedComponent.type === "lcd-2004" || selectedComponent.type?.startsWith("lcd")) && (
                                        <LcdValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* DC Motor & Yellow Geared Motor */}
                                    {(selectedComponent.type === "motor-dc" || selectedComponent.type === "motor-geared") && (
                                        <MotorValueControl 
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}

                                    {/* Micro Servo SG90 */}
                                    {selectedComponent.type === "servo-sg90" && (
                                        <ServoValueControl 
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}

                                    {/* Ultrasonic Distance Sensor HC-SR04 */}
                                    {(selectedComponent.type === "sensor-ultrasonic" || selectedComponent.type?.includes("ultrasonic")) && (
                                        <UltrasonicValueControl 
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}

                                    {/* PIR Motion Sensor */}
                                    {(selectedComponent.type === "sensor-pir" || selectedComponent.type?.includes("pir")) && (
                                        <PirValueControl 
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}

                                    {/* Photoresistor / Light Sensor (LDR) */}
                                    {(selectedComponent.type === "photoresistor" || selectedComponent.type === "sensor-light") && (
                                        <PhotoresistorValueControl
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}

                                    {/* TMP36 Temperature Sensor */}
                                    {(selectedComponent.type === "sensor-temp" || selectedComponent.type === "sensor-temperature") && (
                                        <TempSensorValueControl
                                            component={selectedComponent}
                                            onUpdate={onUpdateComponent}
                                        />
                                    )}



                                    {/* Logic Gates (DIP-14) */}
                                    {selectedComponent.type?.startsWith("ic-74hc") && (
                                        <div className="inspector-simple-badge-row">
                                            <i className="ri-mind-map"></i>
                                            <span>74HC High-Speed CMOS Logic • 2V-6V VCC</span>
                                        </div>
                                    )}

                                    {/* LED */}
                                    {selectedComponent.type === "led" && (
                                        <div className="inspector-led-controls">
                                            <div className="inspector-label-inline">Color</div>
                                            <div className="wire-color-swatches compact-swatches">
                                                {[
                                                    { name: "Red", color: "#ef4444" },
                                                    { name: "Green", color: "#10b981" },
                                                    { name: "Blue", color: "#3b82f6" },
                                                    { name: "Yellow", color: "#eab308" },
                                                    { name: "Orange", color: "#f97316" },
                                                    { name: "White", color: "#ffffff" }
                                                ].map((c) => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        className={`color-swatch-btn ${(selectedComponent.color === c.color) ? "active" : ""}`}
                                                        style={{ "--swatch-color": c.color }}
                                                        onClick={() => {
                                                            onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                                color: c.color,
                                                                name: `5mm LED (${c.name})`
                                                            });
                                                        }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                            <span className="specs-subtext">2.05V • 25mA</span>
                                        </div>
                                    )}

                                    {/* Slide Switch */}
                                    {(selectedComponent.type === "switch-spdt" || selectedComponent.type === "slide-switch") && (
                                        <div className="inspector-switch-controls">
                                            <div className="switch-toggle-pill">
                                                <button 
                                                    type="button"
                                                    className={`switch-side-btn ${selectedComponent.switchState !== "right" ? "active" : ""}`}
                                                    onClick={() => onUpdateComponent && onUpdateComponent(selectedComponent.id, { switchState: "left" })}
                                                >
                                                    Left (1 - C)
                                                </button>
                                                <button 
                                                    type="button"
                                                    className={`switch-side-btn ${selectedComponent.switchState === "right" ? "active" : ""}`}
                                                    onClick={() => onUpdateComponent && onUpdateComponent(selectedComponent.id, { switchState: "right" })}
                                                >
                                                    Right (2 - C)
                                                </button>
                                            </div>
                                            <span className="specs-subtext">SPDT</span>
                                        </div>
                                    )}

                                    {/* Potentiometer */}
                                    {selectedComponent.type === "potentiometer" && (
                                        <PotentiometerValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
                                    )}

                                    {/* Buzzer */}
                                    {selectedComponent.type === "buzzer" && (
                                        <div className="inspector-simple-badge-row">
                                            <i className="ri-volume-up-line"></i>
                                            <span>3V-12V • 2.4kHz Active Audio</span>
                                        </div>
                                    )}

                                    {/* Pushbutton */}
                                    {(selectedComponent.type === "button" || selectedComponent.type === "pushbutton") && (
                                        <div className="inspector-simple-badge-row">
                                            <i className="ri-radio-button-line"></i>
                                            <span>Tactile Momentary SPST</span>
                                        </div>
                                    )}

                                    {/* Breadboard Tint (Close to White Shades) */}
                                    {selectedComponent.type?.startsWith("breadboard") && (
                                        <div className="inspector-bb-controls">
                                            <div className="inspector-label-inline">
                                                <i className="ri-palette-line"></i>
                                                <span>Body Tint</span>
                                            </div>
                                            <div className="wire-color-swatches compact-swatches bb-color-swatches">
                                                {BREADBOARD_COLORS.map((c) => (
                                                    <button
                                                        key={c.name}
                                                        type="button"
                                                        className={`color-swatch-btn ${((selectedComponent.color || "#f1f3f6") === c.color) ? "active" : ""}`}
                                                        style={{ 
                                                            "--swatch-color": c.color,
                                                            border: `1.5px solid ${c.border}`
                                                        }}
                                                        onClick={() => {
                                                            onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                                color: c.color
                                                            });
                                                        }}
                                                        title={`${c.name} (${c.color})`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="specs-subtext">
                                                {selectedComponent.type === "breadboard-mini" ? "170 Tie-Points • No Rails" :
                                                 selectedComponent.type === "breadboard-full" ? "830 Tie-Points • Dual Bus" :
                                                 "400 Tie-Points • Solderless"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Multimeter */}
                                    {selectedComponent.type === "multimeter" && (
                                        <div className="inspector-simple-badge-row">
                                            <i className="ri-dashboard-3-line"></i>
                                            <span>Auto-Range • True RMS Probes</span>
                                        </div>
                                    )}

                                    {/* MCU */}
                                    {(selectedComponent.type?.startsWith("arduino") || selectedComponent.type?.startsWith("esp32")) && (
                                        <div className="inspector-mcu-row">
                                            <span className="specs-subtext">
                                                {selectedComponent.type === "arduino-mega" ? "ATmega2560 • 54 I/O • 16 Analog" :
                                                 selectedComponent.type === "arduino-nano" ? "ATmega328P DIP-30 • 5V" :
                                                 selectedComponent.type === "esp32" || selectedComponent.type === "esp32-devkit" || selectedComponent.type === "esp32-s3" ? "ESP32-S3 Dual-Core • 3.3V" :
                                                 "ATmega328P • 5V Logic"}
                                            </span>
                                            <button
                                                type="button"
                                                className="edit-firmware-pill-btn"
                                                onClick={onToggleCodeEditor}
                                                title="Open Firmware Editor for this MCU"
                                            >
                                                <i className="ri-code-s-slash-line"></i>
                                                <span>Edit Code</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* WIRE PROPERTIES: 2 Rows */
                            <div className="inspector-two-rows wire-two-rows">
                                {/* Row 1: Wire Color & Delete Wire */}
                                <div className="inspector-row-top wire-color-row">
                                    <div className="inspector-label-inline">
                                        <i className="ri-palette-line"></i>
                                        <span>Color</span>
                                    </div>
                                    <div className="wire-color-swatches compact-swatches">
                                        {WIRE_COLORS.map((item) => (
                                            <button
                                                key={item.name}
                                                type="button"
                                                className={`color-swatch-btn ${((selectedWire?.color || wireColor) === item.color) ? "active" : ""}`}
                                                style={{ "--swatch-color": item.color }}
                                                onClick={() => {
                                                    onChangeWireColor && onChangeWireColor(item.color);
                                                    if (selectedWire && onUpdateWire) {
                                                        onUpdateWire(selectedWire.id, { color: item.color });
                                                    }
                                                }}
                                                title={`[Key ${item.key}] ${item.name}`}
                                            />
                                        ))}
                                    </div>
                                    {selectedWire && onDeleteWire && (
                                        <button
                                            type="button"
                                            className="inspector-action-btn delete-action"
                                            onClick={() => onDeleteWire(selectedWire.id)}
                                            title="Delete Wire (Del)"
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    )}
                                </div>

                                {/* Row 2: Wire Routing & Hint */}
                                <div className="inspector-row-bottom wire-routing-row">
                                    <div className="routing-segmented-control compact-routing" role="group" aria-label="Wire Routing Mode">
                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "curved" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("curved");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "curved" });
                                                }
                                            }}
                                            title="Curve"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 C 7 14, 9 6, 17 6" strokeWidth="2.2" strokeLinecap="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">Curve</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "manhattan" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("manhattan");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "manhattan" });
                                                }
                                            }}
                                            title="90° Manhattan"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 H 10 V 6 H 17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">90°</span>
                                        </button>

                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "straight" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("straight");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "straight" });
                                                }
                                            }}
                                            title="Straight"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 L 17 6" strokeWidth="2.2" strokeLinecap="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">Straight</span>
                                        </button>
                                    </div>

                                    <span className="compact-shortcut-hint">Keys 1-9 • Esc</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

export default TopFloatingBar;
