import "./TopFloatingBar.css";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../../context/ThemeContext";

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
    onToggleCodeEditor
}) {
    const { isDark, toggleTheme } = useTheme();
    const [isComponentsOpen, setIsComponentsOpen] = useState(false);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [viewModeType, setViewModeType] = useState("simulation"); // "simulation" | "schematic"
    
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
            "switch-spdt", "slide-switch", "multimeter", "arduino-uno", "esp32"
          ].includes(selectedComponent.type)
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

                                        {/* Breadboard item */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "breadboard", name: "Breadboard (Half-Size)" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Solderless Breadboard"
                                        >
                                            <div className="palette-item-miniature bb-miniature">
                                                <div className="mini-bb-lines">
                                                    <span className="red"></span>
                                                    <span className="blue"></span>
                                                </div>
                                            </div>
                                            <span>Breadboard</span>
                                        </button>

                                        {/* Arduino Uno R3 */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "arduino-uno", name: "Arduino Uno R3" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add Arduino Uno R3"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(14, 165, 233, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-cpu-line" style={{ color: "#38bdf8", fontSize: 16 }}></i>
                                            </div>
                                            <span>Arduino Uno</span>
                                        </button>

                                        {/* ESP32 DevKit V1 */}
                                        <button
                                            className="palette-item"
                                            onClick={() => {
                                                onAddComponent({ type: "esp32-devkit", name: "ESP32 DevKit V1" });
                                                setIsComponentsOpen(false);
                                            }}
                                            title="Add ESP32 DevKit V1"
                                        >
                                            <div className="palette-item-miniature" style={{ background: "rgba(168, 85, 247, 0.15)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <i className="ri-wifi-line" style={{ color: "#c084fc", fontSize: 16 }}></i>
                                            </div>
                                            <span>ESP32 DevKit</span>
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
                    3. TOP RIGHT BAR: Search, Modes, Code Bar (No Profile Icon)
                ------------------------------------------------------------ */}
                <div className="topbar-section right-section">
                    {/* Search */}
                    <button className="top-search-btn" title="Search Components (Ctrl+F)">
                        <i className="ri-search-line"></i>
                        <span>Search</span>
                    </button>

                    <div className="top-divider"></div>

                    {/* Modes Pill: Theme Switcher & Schematic Mode */}
                    <div className="modes-pill">
                        {/* Theme Switcher */}
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
                            className={`mode-btn view-btn ${viewModeType === "simulation" ? "active" : ""}`}
                            onClick={() => setViewModeType(viewModeType === "simulation" ? "schematic" : "simulation")}
                            title={viewModeType === "simulation" ? "Switch to Schematic View" : "Switch to Circuit Simulation"}
                        >
                            <i className={viewModeType === "simulation" ? "ri-cpu-line" : "ri-git-branch-line"}></i>
                            <span className="mode-label">{viewModeType === "simulation" ? "Circuit" : "Schematic"}</span>
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
                        className="context-property-bar"
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* USER-BASED NAMING: Editable Component Reference Designator Pill */}
                        {selectedComponent && (
                            <div className="inspector-subgroup name-edit-subgroup">
                                <div className="inspector-designator-pill" title="Click or type to rename component">
                                    <i className="ri-price-tag-3-line"></i>
                                    <input
                                        type="text"
                                        className="inspector-designator-input"
                                        value={editingCompName !== null ? editingCompName : (selectedComponent.designator || selectedComponent.name || "")}
                                        onFocus={() => setEditingCompName(selectedComponent.designator || selectedComponent.name || "")}
                                        onChange={(e) => setEditingCompName(e.target.value)}
                                        onBlur={() => {
                                            if (editingCompName !== null && editingCompName.trim()) {
                                                const trimmed = editingCompName.trim();
                                                onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                    designator: trimmed,
                                                    name: trimmed
                                                });
                                            }
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
                                        title="Rename component (e.g. R1, LED1, R_PULLUP)"
                                        placeholder="Name..."
                                    />
                                    <i className="ri-edit-line edit-pencil-icon"></i>
                                </div>
                                <div className="inspector-divider" />
                            </div>
                        )}
                        {/* A. WIRE PROPERTIES: Displayed ONLY when no component is selected */}
                        {(!selectedComponent && (isWireMode || !!selectedWire)) && (
                            <div className="inspector-group wire-group">
                                <div className="inspector-subgroup">
                                    <div className="inspector-label">
                                        <i className="ri-palette-line"></i>
                                        <span>Color</span>
                                    </div>
                                    <div className="wire-color-swatches">
                                        {WIRE_COLORS.map((item) => (
                                            <button
                                                key={item.name}
                                                className={`color-swatch-btn ${((selectedWire?.color || wireColor) === item.color) ? "active" : ""}`}
                                                style={{ "--swatch-color": item.color }}
                                                onClick={() => {
                                                    onChangeWireColor && onChangeWireColor(item.color);
                                                    if (selectedWire && onUpdateWire) {
                                                        onUpdateWire(selectedWire.id, { color: item.color });
                                                    }
                                                }}
                                                title={`[Key ${item.key}] ${item.name} Wire`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="inspector-divider" />

                                <div className="inspector-subgroup routing-subgroup">
                                    <div className="inspector-label">
                                        <i className="ri-git-branch-line"></i>
                                        <span>Routing</span>
                                    </div>
                                    <div className="routing-segmented-control" role="group" aria-label="Wire Routing Mode">
                                        {/* 1. Curved Wire Button */}
                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "curved" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("curved");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "curved" });
                                                }
                                            }}
                                            aria-label="Curve"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 C 7 14, 9 6, 17 6" strokeWidth="2.2" strokeLinecap="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">Curve</span>
                                        </button>

                                        {/* 2. 90-Degree Manhattan Wire Button */}
                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "manhattan" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("manhattan");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "manhattan" });
                                                }
                                            }}
                                            aria-label="90° Manhattan"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 H 10 V 6 H 17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">90° Manhattan</span>
                                        </button>

                                        {/* 3. Straight Wire Button */}
                                        <button
                                            type="button"
                                            className={`routing-mode-btn ${(selectedWire?.routingMode || routingMode) === "straight" ? "active" : ""}`}
                                            onClick={() => {
                                                onChangeRoutingMode && onChangeRoutingMode("straight");
                                                if (selectedWire && onUpdateWire) {
                                                    onUpdateWire(selectedWire.id, { routingMode: "straight" });
                                                }
                                            }}
                                            aria-label="Straight"
                                        >
                                            <svg className="routing-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                                                <path d="M3 14 L 17 6" strokeWidth="2.2" strokeLinecap="round" />
                                                <circle cx="3" cy="14" r="2" fill="currentColor" />
                                                <circle cx="17" cy="6" r="2" fill="currentColor" />
                                            </svg>
                                            <span className="routing-hover-label">Straight</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="inspector-divider" />

                                <span className="inspector-hint">
                                    {isWireMode ? "Keys 1-9 recolor • Click terminal to connect • Esc exits" : "Selected Wire • Keys 1-9 to recolor"}
                                </span>
                            </div>
                        )}

                        {/* B. RESISTOR PROPERTIES: Resistance Value & Units */}
                        {selectedComponent?.type === "resistor" && (() => {
                            const curNumeric = selectedComponent.resistance != null 
                                ? Number(selectedComponent.resistance)
                                : parseResistanceValue(selectedComponent.name?.match(/\(([^)]+)\)/)?.[1] || "220");

                            const displayValue = curNumeric >= 1000000 
                                ? `${+(curNumeric / 1000000).toFixed(2)}MΩ` 
                                : curNumeric >= 1000 
                                    ? `${+(curNumeric / 1000).toFixed(2)}kΩ` 
                                    : `${curNumeric}Ω`;

                            return (
                                <div className="inspector-group resistor-group">
                                    <div className="inspector-label">
                                        <i className="ri-pulse-line"></i>
                                        <span>Resistance</span>
                                    </div>
                                    <div className="preset-pill-group">
                                        {RESISTOR_PRESETS.map((val) => {
                                            const targetNumeric = parseResistanceValue(val);
                                            // Exact numerical match avoids "100" matching "100k" or substring collisions
                                            const isActive = Math.abs(curNumeric - targetNumeric) < 0.001;

                                            return (
                                                <button 
                                                    key={val}
                                                    className={`preset-pill ${isActive ? "active" : ""}`}
                                                    onClick={() => {
                                                        onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                            resistance: targetNumeric,
                                                            name: `Resistor (${val}Ω)`
                                                        });
                                                    }}
                                                    title={`Set to ${val}Ω`}
                                                >
                                                    {val}Ω
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <span className="inspector-specs-badge">{displayValue} • 1/4W Metal Film</span>
                                </div>
                            );
                        })()}

                        {/* C. LED PROPERTIES: Color & Forward Specs */}
                        {selectedComponent?.type === "led" && (
                            <div className="inspector-group led-group">
                                <div className="inspector-label">
                                    <i className="ri-lightbulb-line"></i>
                                    <span>LED Color</span>
                                </div>
                                <div className="wire-color-swatches">
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
                                <span className="inspector-specs-badge">Vf: 2.05V • Max 25mA</span>
                            </div>
                        )}

                        {/* D. BATTERY PROPERTIES: Voltage Selector */}
                        {selectedComponent?.type === "battery-9v" && (
                            <div className="inspector-group battery-group">
                                <div className="inspector-label">
                                    <i className="ri-battery-charge-line"></i>
                                    <span>DC Voltage</span>
                                </div>
                                <div className="preset-pill-group">
                                    {VOLTAGE_PRESETS.map((v) => {
                                        const curVolt = selectedComponent.voltage != null ? parseFloat(selectedComponent.voltage) : 9;
                                        const isActive = parseFloat(v) === curVolt;
                                        return (
                                            <button
                                                key={v}
                                                className={`preset-pill ${isActive ? "active" : ""}`}
                                                onClick={() => {
                                                    onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                        voltage: parseFloat(v),
                                                        name: `Battery (${v})`
                                                    });
                                                }}
                                            >
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                                <span className="inspector-specs-badge">DC Power Supply</span>
                            </div>
                        )}

                        {/* E. CAPACITOR PROPERTIES: Capacitance Selector */}
                        {selectedComponent?.type === "capacitor-ceramic" && (
                            <div className="inspector-group cap-group">
                                <div className="inspector-label">
                                    <i className="ri-contrast-2-line"></i>
                                    <span>Capacitance</span>
                                </div>
                                <div className="preset-pill-group">
                                    {CAPACITOR_PRESETS.map((c) => (
                                        <button
                                            key={c}
                                            className={`preset-pill ${c === (selectedComponent.capacitance || "100nF") ? "active" : ""}`}
                                            onClick={() => {
                                                onUpdateComponent && onUpdateComponent(selectedComponent.id, {
                                                    capacitance: c,
                                                    name: `Ceramic Cap (${c})`
                                                });
                                            }}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                <span className="inspector-specs-badge">50V Ceramic Disk</span>
                            </div>
                        )}

                        {/* F. POTENTIOMETER PROPERTIES: Max Resistance & Wiper */}
                        {selectedComponent?.type === "potentiometer" && (
                            <div className="inspector-group pot-group">
                                <div className="inspector-label">
                                    <i className="ri-equalizer-line"></i>
                                    <span>Potentiometer</span>
                                </div>
                                <span className="inspector-specs-badge">10kΩ • Linear Wiper 0 - 100%</span>
                            </div>
                        )}

                        {/* G. BUZZER PROPERTIES */}
                        {selectedComponent?.type === "buzzer" && (
                            <div className="inspector-group buzzer-group">
                                <div className="inspector-label">
                                    <i className="ri-volume-up-line"></i>
                                    <span>Piezo Buzzer</span>
                                </div>
                                <span className="inspector-specs-badge">3V-12V • 2.4kHz Active Audio</span>
                            </div>
                        )}

                        {/* H. BUTTON PROPERTIES */}
                        {(selectedComponent?.type === "button" || selectedComponent?.type === "pushbutton") && (
                            <div className="inspector-group button-group">
                                <div className="inspector-label">
                                    <i className="ri-radio-button-line"></i>
                                    <span>Pushbutton</span>
                                </div>
                                <span className="inspector-specs-badge">Tactile Momentary SPST (NO)</span>
                            </div>
                        )}

                        {/* I. SWITCH PROPERTIES */}
                        {(selectedComponent?.type === "switch-spdt" || selectedComponent?.type === "slide-switch") && (
                            <div className="inspector-group switch-group">
                                <div className="inspector-label">
                                    <i className="ri-toggle-line"></i>
                                    <span>Slide Switch</span>
                                </div>
                                <span className="inspector-specs-badge">SPDT Dual-Throw Selector</span>
                            </div>
                        )}

                        {/* J. MULTIMETER PROPERTIES */}
                        {selectedComponent?.type === "multimeter" && (
                            <div className="inspector-group multimeter-group">
                                <div className="inspector-label">
                                    <i className="ri-dashboard-3-line"></i>
                                    <span>Digital Multimeter</span>
                                </div>
                                <span className="inspector-specs-badge">Auto-Range • True RMS Probes</span>
                            </div>
                        )}

                        {/* K. MCU BOARD PROPERTIES */}
                        {(selectedComponent?.type === "arduino-uno" || selectedComponent?.type === "esp32" || selectedComponent?.type === "esp32-devkit") && (
                            <div className="inspector-group mcu-group">
                                <div className="inspector-label">
                                    <i className="ri-cpu-line"></i>
                                    <span>{selectedComponent.type === "arduino-uno" ? "Arduino Uno R3" : "ESP32 DevKit V1"}</span>
                                </div>
                                <span className="inspector-specs-badge">
                                    {selectedComponent.type === "arduino-uno" ? "16MHz ATmega328P • 5V / 3.3V Logic" : "240MHz Dual-Core • 3.3V / Wi-Fi"}
                                </span>
                                <button
                                    className="edit-firmware-pill-btn"
                                    onClick={onToggleCodeEditor}
                                    title="Open Firmware Editor for this MCU"
                                >
                                    <i className="ri-code-s-slash-line"></i>
                                    <span>Edit Code</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

export default TopFloatingBar;
