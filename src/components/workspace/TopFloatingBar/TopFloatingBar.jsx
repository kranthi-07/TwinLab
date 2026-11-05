import "./TopFloatingBar.css";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";

const COMPONENT_META = {
    "resistor": { label: "Resistor", icon: "ri-pulse-line" },
    "led": { label: "LED", icon: "ri-lightbulb-line" },
    "battery-9v": { label: "Battery", icon: "ri-battery-charge-line" },
    "capacitor-ceramic": { label: "Capacitor", icon: "ri-contrast-2-line" },
    "potentiometer": { label: "Potentiometer", icon: "ri-equalizer-line" },
    "buzzer": { label: "Buzzer", icon: "ri-volume-up-line" },
    "button": { label: "Pushbutton", icon: "ri-radio-button-line" },
    "pushbutton": { label: "Pushbutton", icon: "ri-radio-button-line" },
    "switch-spdt": { label: "Slide Switch", icon: "ri-toggle-line" },
    "slide-switch": { label: "Slide Switch", icon: "ri-toggle-line" },
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
    const showInspector = selectedComponent 
        ? [
            "resistor", "led", "battery-9v", "capacitor-ceramic", 
            "potentiometer", "buzzer", "button", "pushbutton", 
            "switch-spdt", "slide-switch", "multimeter", 
            "arduino-uno", "arduino-mega", "arduino-nano", "esp32", "esp32-devkit", "esp32-s3",
            "breadboard", "breadboard-half", "breadboard-full", "breadboard-mini"
          ].includes(selectedComponent.type) || selectedComponent.type?.startsWith("breadboard") || selectedComponent.type?.startsWith("arduino") || selectedComponent.type?.startsWith("esp32")
        : (isWireMode || !!selectedWire);

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
                            <span 
                                className="project-name-text"
                                title="Click to rename project"
                            >
                                {projectName || "Project - 1"}
                            </span>
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

                                        {/* Digital Multimeter */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "multimeter", name: "Digital Multimeter" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Digital Multimeter"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(234, 179, 8, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-dashboard-3-line" style={{ color: "#facc15", fontSize: 16 }}></i>
                                            </div>
                                            <span>Multimeter</span>
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
                        key={selectedComponent?.id ? `${selectedComponent.type}-${selectedComponent.id}` : (isWireMode ? "wire-mode" : "wire-sel")}
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

                                    {/* Battery */}
                                    {selectedComponent.type === "battery-9v" && (
                                        <BatteryValueControl 
                                            component={selectedComponent} 
                                            onUpdate={onUpdateComponent} 
                                        />
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
