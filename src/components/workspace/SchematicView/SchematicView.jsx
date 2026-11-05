import "./SchematicView.css";
import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function SchematicView({
    components = [],
    wires = [],
    simulationResult = {},
    selectedId,
    onSelectComponent,
    projectName = "Project - 1",
    onClose
}) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 60, y: 60 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isBomOpen, setIsBomOpen] = useState(false);
    const containerRef = useRef(null);

    // Pan / Drag handlers
    const handleMouseDown = (e) => {
        if (e.target.closest(".schematic-ui-btn, .bom-drawer, .schematic-symbol-group")) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Wheel zoom
    const handleWheel = (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom(prev => Math.max(0.4, Math.min(2.5, +(prev + zoomDelta).toFixed(2))));
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, []);

    // Generate Bill of Materials (BOM)
    const bomItems = useMemo(() => {
        const groups = {};
        components.forEach((c) => {
            let key = c.type;
            let rating = "";
            let desc = "";

            if (c.type === "resistor") {
                const r = c.resistance || 220;
                const rStr = r >= 1e6 ? `${r / 1e6}MΩ` : r >= 1e3 ? `${r / 1e3}kΩ` : `${r}Ω`;
                rating = `${rStr} • 1/4W Metal Film`;
                desc = "Through-Hole Resistor";
                key = `resistor_${r}`;
            } else if (c.type === "capacitor-ceramic") {
                rating = `${c.capacitance || "100nF"} • 50V`;
                desc = "Ceramic Disc Capacitor";
                key = `cap_${c.capacitance}`;
            } else if (c.type === "led") {
                rating = `${c.color || "Red"} • 2.05V / 25mA`;
                desc = "5mm Diffused Through-Hole LED";
                key = `led_${c.color}`;
            } else if (c.type === "battery-9v") {
                rating = `${c.voltage != null ? c.voltage : 9}V DC`;
                desc = "DC Power Supply / 9V Battery";
                key = `bat_${c.voltage}`;
            } else if (c.type === "potentiometer") {
                rating = "10kΩ Linear";
                desc = "Rotary Potentiometer";
                key = "pot";
            } else if (c.type === "buzzer") {
                rating = "3V-12V • 2.4kHz";
                desc = "Active Piezo Transducer";
                key = "buzzer";
            } else if (c.type === "button" || c.type === "pushbutton") {
                rating = "50mA 12VDC";
                desc = "Tactile SPST Momentary Plunger";
                key = "btn";
            } else if (c.type === "slide-switch" || c.type === "switch-spdt") {
                rating = "0.3A 50VDC";
                desc = "SPDT Slide Selector Switch";
                key = "switch";
            } else if (c.type === "arduino-uno") {
                rating = "16MHz ATmega328P • 5V";
                desc = "Arduino Uno R3 Microcontroller";
                key = "arduino";
            } else if (c.type === "esp32" || c.type === "esp32-devkit") {
                rating = "240MHz Dual-Core • 3.3V / Wi-Fi";
                desc = "ESP32 DevKit V1 Microcontroller";
                key = "esp32";
            } else if (c.type === "multimeter") {
                rating = "Auto-Ranging 600V CAT II";
                desc = "Digital Multimeter (DMM)";
                key = "dmm";
            } else {
                rating = "-";
                desc = c.name || c.type;
            }

            if (!groups[key]) {
                groups[key] = {
                    key,
                    desc,
                    rating,
                    type: c.type,
                    designators: [c.designator || c.name || c.id],
                    count: 1
                };
            } else {
                groups[key].designators.push(c.designator || c.name || c.id);
                groups[key].count += 1;
            }
        });

        return Object.values(groups);
    }, [components]);

    // Export BOM as CSV
    const exportBomCsv = () => {
        const headers = ["Item", "Reference Designators", "Description", "Value / Rating", "Quantity"];
        const rows = bomItems.map((item, idx) => [
            idx + 1,
            `"${item.designators.join(", ")}"`,
            `"${item.desc}"`,
            `"${item.rating}"`,
            item.count
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}_BOM.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Export Netlist (.net)
    const exportNetlist = () => {
        let netText = `* SPICE Netlist generated by TwinLab EDA\n* Project: ${projectName}\n* Date: ${new Date().toLocaleString()}\n\n`;
        components.forEach((c) => {
            const des = c.designator || c.name || c.id;
            if (c.type === "resistor") {
                netText += `${des} N_${c.id}_1 N_${c.id}_2 ${c.resistance || 220}\n`;
            } else if (c.type === "capacitor-ceramic") {
                netText += `${des} N_${c.id}_1 N_${c.id}_2 ${c.capacitance || "100nF"}\n`;
            } else if (c.type === "battery-9v") {
                netText += `${des} N_${c.id}_POS N_${c.id}_NEG DC ${c.voltage != null ? c.voltage : 9}V\n`;
            } else if (c.type === "led") {
                netText += `${des} N_${c.id}_ANODE N_${c.id}_CATHODE DIODE_LED_${c.color || "RED"}\n`;
            } else {
                netText += `* ${des} (${c.type})\n`;
            }
        });
        netText += "\n.end\n";

        const blob = new Blob([netText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}.net`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div 
            className="schematic-view-container" 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Engineering Schematic Toolbar */}
            <header className="schematic-toolbar">
                <div className="toolbar-left">
                    <div className="schematic-badge">
                        <i className="ri-git-branch-line"></i>
                        <span>IEEE Schematic Mode</span>
                    </div>
                    <span className="schematic-proj-name">{projectName}</span>
                    <span className="schematic-zoom-pill">{Math.round(zoom * 100)}%</span>
                </div>

                <div className="toolbar-right">
                    <button 
                        className={`schematic-ui-btn ${isBomOpen ? "active" : ""}`}
                        onClick={() => setIsBomOpen(!isBomOpen)}
                        title="View Bill of Materials (BOM) Table"
                    >
                        <i className="ri-file-list-3-line"></i>
                        <span>Bill of Materials ({components.length})</span>
                    </button>

                    <button 
                        className="schematic-ui-btn"
                        onClick={exportNetlist}
                        title="Export SPICE Netlist file (.net)"
                    >
                        <i className="ri-download-2-line"></i>
                        <span>Netlist</span>
                    </button>

                    <button 
                        className="schematic-ui-btn"
                        onClick={() => {
                            setZoom(1);
                            setPan({ x: 60, y: 60 });
                        }}
                        title="Reset Schematic Zoom & Pan"
                    >
                        <i className="ri-fullscreen-line"></i>
                        <span>Fit View</span>
                    </button>
                </div>
            </header>

            {/* SVG Interactive Schematic Canvas */}
            <svg 
                className="schematic-svg-viewport"
                width="100%"
                height="100%"
            >
                <defs>
                    {/* Standard Schematic Blueprint Grid */}
                    <pattern id="schematic-grid-small" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="0.8" />
                    </pattern>
                    <pattern id="schematic-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
                        <rect width="100" height="100" fill="url(#schematic-grid-small)" />
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1.2" />
                    </pattern>

                    {/* Standard Arrow Marker for Wires & Rays */}
                    <marker id="schematic-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                </defs>

                {/* Grid Background */}
                <rect width="100%" height="100%" fill="url(#schematic-grid-major)" />

                {/* Dynamic Transform Group (Zoom & Pan) */}
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    
                    {/* ========================================================
                        1. SCHEMATIC WIRES (Clean Orthogonal Netlines with Solder Junctions)
                    ======================================================== */}
                    <g className="schematic-nets-layer">
                        {wires.map((w) => {
                            if (!w.points || w.points.length < 2) return null;
                            const pts = w.points;
                            const d = pts.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

                            return (
                                <g key={w.id} className="schematic-wire-item">
                                    {/* Main netline */}
                                    <path 
                                        d={d}
                                        fill="none"
                                        stroke="#38bdf8"
                                        strokeWidth="2.2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        opacity="0.9"
                                    />
                                    {/* Solder junction dots at endpoints */}
                                    <circle cx={pts[0].x} cy={pts[0].y} r="3.5" fill="#38bdf8" />
                                    <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill="#38bdf8" />
                                </g>
                            );
                        })}
                    </g>

                    {/* ========================================================
                        2. SCHEMATIC COMPONENT SYMBOLS
                    ======================================================== */}
                    <g className="schematic-components-layer">
                        {components.map((c) => {
                            const isSelected = selectedId === c.id;
                            const cx = c.x || 0;
                            const cy = c.y || 0;
                            const rot = c.rotation || 0;
                            const des = c.designator || c.name || c.id;

                            return (
                                <g 
                                    key={c.id} 
                                    className={`schematic-symbol-group ${isSelected ? "selected" : ""}`}
                                    transform={`translate(${cx}, ${cy}) rotate(${rot})`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectComponent && onSelectComponent(c.id);
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    {/* Component Selection Highlight Halo */}
                                    {isSelected && (
                                        <rect 
                                            x="-12" 
                                            y="-24" 
                                            width="88" 
                                            height="48" 
                                            rx="6" 
                                            fill="rgba(255, 138, 0, 0.15)" 
                                            stroke="#FF8A00" 
                                            strokeWidth="1.5"
                                            strokeDasharray="4 3"
                                        />
                                    )}

                                    {/* A. RESISTOR: IEEE Standard Zig-Zag Symbol */}
                                    {c.type === "resistor" && (() => {
                                        const r = c.resistance || 220;
                                        const rStr = r >= 1e6 ? `${r / 1e6}MΩ` : r >= 1e3 ? `${r / 1e3}kΩ` : `${r}Ω`;

                                        return (
                                            <g className="symbol-resistor">
                                                {/* Leads & Zig-Zag */}
                                                <path 
                                                    d="M 0 0 L 14 0 L 18 -9 L 26 9 L 34 -9 L 42 9 L 50 -9 L 54 0 L 64 0" 
                                                    fill="none" 
                                                    stroke={isSelected ? "#FF8A00" : "#f8fafc"} 
                                                    strokeWidth="2.2" 
                                                    strokeLinecap="round" 
                                                    strokeLinejoin="round" 
                                                />
                                                {/* Terminals */}
                                                <circle cx="0" cy="0" r="3" fill="#38bdf8" />
                                                <circle cx="64" cy="0" r="3" fill="#38bdf8" />
                                                {/* Text Label */}
                                                <text x="32" y="-14" textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x="32" y="20" textAnchor="middle" className="sch-val-label">{rStr}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* B. CAPACITOR: Standard Dual Parallel Plates */}
                                    {c.type === "capacitor-ceramic" && (
                                        <g className="symbol-capacitor">
                                            {/* Left lead & plate */}
                                            <line x1="0" y1="16" x2="6" y2="16" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                            <line x1="6" y1="4" x2="6" y2="28" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.6" strokeLinecap="round" />
                                            {/* Right plate & lead */}
                                            <line x1="10" y1="4" x2="10" y2="28" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.6" strokeLinecap="round" />
                                            <line x1="10" y1="16" x2="16" y2="16" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                            {/* Terminals */}
                                            <circle cx="0" cy="16" r="3" fill="#38bdf8" />
                                            <circle cx="16" cy="16" r="3" fill="#38bdf8" />
                                            {/* Text Label */}
                                            <text x="8" y="-2" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="8" y="38" textAnchor="middle" className="sch-val-label">{c.capacitance || "100nF"}</text>
                                        </g>
                                    )}

                                    {/* C. LED: Diode Triangle + Cathode Bar + Emitting Light Rays */}
                                    {c.type === "led" && (() => {
                                        const isLit = Boolean(simulationResult?.ledStates?.[c.id]?.isOn);

                                        return (
                                            <g className="symbol-led">
                                                {/* Anode lead */}
                                                <line x1="0" y1="0" x2="4" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                                {/* Diode Triangle */}
                                                <polygon 
                                                    points="4,-8 14,0 4,8" 
                                                    fill={isLit ? (c.color || "#ef4444") : "rgba(255, 255, 255, 0.15)"} 
                                                    stroke={isSelected ? "#FF8A00" : (c.color || "#ef4444")} 
                                                    strokeWidth="2" 
                                                />
                                                {/* Cathode Bar */}
                                                <line x1="14" y1="-8" x2="14" y2="8" stroke={isSelected ? "#FF8A00" : (c.color || "#ef4444")} strokeWidth="2.4" strokeLinecap="round" />
                                                {/* Cathode lead */}
                                                <line x1="14" y1="0" x2="16" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                                {/* Light emission rays */}
                                                <line x1="11" y1="-10" x2="15" y2="-15" stroke={c.color || "#ef4444"} strokeWidth="1.5" markerEnd="url(#schematic-arrow)" />
                                                <line x1="15" y1="-7" x2="19" y2="-12" stroke={c.color || "#ef4444"} strokeWidth="1.5" markerEnd="url(#schematic-arrow)" />
                                                {/* Terminals */}
                                                <circle cx="0" cy="0" r="3" fill="#38bdf8" />
                                                <circle cx="16" cy="0" r="3" fill="#38bdf8" />
                                                {/* Text Label */}
                                                <text x="8" y="-18" textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x="8" y="20" textAnchor="middle" className="sch-val-label">{c.color || "LED"}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* D. 9V BATTERY: Long (+), Short (-) Multi-Cell Stack */}
                                    {c.type === "battery-9v" && (
                                        <g className="symbol-battery">
                                            {/* Terminals at 24 and 72 at y=-14 */}
                                            <line x1="24" y1="-14" x2="24" y2="10" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2" />
                                            <line x1="72" y1="-14" x2="72" y2="10" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2" />
                                            {/* Battery Plates */}
                                            <line x1="48" y1="10" x2="72" y2="10" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="24" y1="10" x2="40" y2="10" stroke="#f8fafc" strokeWidth="2" />
                                            {/* Positive long plate */}
                                            <line x1="48" y1="2" x2="48" y2="18" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                                            {/* Negative short plate */}
                                            <line x1="40" y1="5" x2="40" y2="15" stroke="#f8fafc" strokeWidth="4.5" strokeLinecap="round" />
                                            {/* Polarity signs */}
                                            <text x="52" y="0" className="sch-polarity">+</text>
                                            <text x="34" y="0" className="sch-polarity">−</text>
                                            {/* Terminals */}
                                            <circle cx="24" cy="-14" r="3.5" fill="#38bdf8" />
                                            <circle cx="72" cy="-14" r="3.5" fill="#38bdf8" />
                                            {/* Labels */}
                                            <text x="48" y="-22" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="48" y="32" textAnchor="middle" className="sch-val-label">{c.voltage != null ? `${c.voltage}V` : "9V"}</text>
                                        </g>
                                    )}

                                    {/* E. PUSHBUTTON: Contact Switch with Plunger */}
                                    {(c.type === "button" || c.type === "pushbutton") && (
                                        <g className="symbol-button">
                                            {/* Fixed Contacts */}
                                            <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="0" cy="32" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="32" r="3.5" fill="#38bdf8" />
                                            {/* Internal bridging line */}
                                            <line x1="0" y1="0" x2="0" y2="10" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="32" y1="0" x2="32" y2="10" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="-2" y1="10" x2="34" y2="10" stroke="#f8fafc" strokeWidth="2.5" />
                                            <line x1="16" y1="10" x2="16" y2="4" stroke="#f8fafc" strokeWidth="2" />
                                            {/* Text Label */}
                                            <text x="16" y="-8" textAnchor="middle" className="sch-ref-des">{des}</text>
                                        </g>
                                    )}

                                    {/* F. SLIDE SWITCH: SPDT Contact */}
                                    {(c.type === "slide-switch" || c.type === "switch-spdt") && (
                                        <g className="symbol-switch">
                                            <circle cx="0" cy="16" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="16" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="16" r="3.5" fill="#38bdf8" />
                                            {/* Contact arm */}
                                            <line 
                                                x1="16" 
                                                y1="16" 
                                                x2={c.switchState === "right" ? "32" : "0"} 
                                                y2="16" 
                                                stroke={isSelected ? "#FF8A00" : "#f8fafc"} 
                                                strokeWidth="2.5" 
                                                strokeLinecap="round" 
                                            />
                                            <text x="16" y="2" textAnchor="middle" className="sch-ref-des">{des}</text>
                                        </g>
                                    )}

                                    {/* G. ARDUINO UNO & ESP32: Standard Dual-Rail IC Symbol */}
                                    {(c.type === "arduino-uno" || c.type === "esp32" || c.type === "esp32-devkit") && (() => {
                                        const isArduino = c.type === "arduino-uno";
                                        const width = isArduino ? 160 : 120;
                                        const height = isArduino ? 210 : 250;

                                        return (
                                            <g className="symbol-mcu">
                                                {/* IC Main Box */}
                                                <rect 
                                                    x="0" 
                                                    y="0" 
                                                    width={width} 
                                                    height={height} 
                                                    rx="6" 
                                                    fill="rgba(15, 23, 42, 0.85)" 
                                                    stroke={isSelected ? "#FF8A00" : "#38bdf8"} 
                                                    strokeWidth="2" 
                                                />
                                                {/* IC Header Notch */}
                                                <path d={`M ${width / 2 - 8} 0 C ${width / 2 - 8} 6, ${width / 2 + 8} 6, ${width / 2 + 8} 0`} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                                                {/* Title */}
                                                <text x={width / 2} y="22" textAnchor="middle" className="sch-mcu-title">{isArduino ? "ARDUINO UNO" : "ESP32 DEVKIT"}</text>
                                                <text x={width / 2} y="36" textAnchor="middle" className="sch-mcu-chip">{isArduino ? "ATmega328P" : "ESP-WROOM-32"}</text>
                                                <text x={width / 2} y={height - 10} textAnchor="middle" className="sch-ref-des">{des}</text>
                                            </g>
                                        );
                                    })()}
                                </g>
                            );
                        })}
                    </g>
                </g>
            </svg>

            {/* Engineering Schematic Blueprint Title Block (Lower Right Corner) */}
            <div className="schematic-title-block">
                <div className="title-block-row header-row">
                    <strong>TWINLAB ELECTRONICS EDA</strong>
                </div>
                <div className="title-block-row">
                    <span className="lbl">TITLE:</span>
                    <span className="val">{projectName}</span>
                </div>
                <div className="title-block-row double-col">
                    <div>
                        <span className="lbl">REV:</span>
                        <span className="val">1.0</span>
                    </div>
                    <div>
                        <span className="lbl">SHEET:</span>
                        <span className="val">1 OF 1</span>
                    </div>
                </div>
                <div className="title-block-row">
                    <span className="lbl">DATE:</span>
                    <span className="val">{new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* Bill of Materials (BOM) Slide-Over Drawer */}
            <AnimatePresence>
                {isBomOpen && (
                    <motion.div 
                        className="bom-drawer-wrapper"
                        initial={{ x: 420, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 420, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    >
                        <div className="bom-drawer-header">
                            <div className="bom-title-wrap">
                                <i className="ri-file-list-3-fill"></i>
                                <span>Bill of Materials (BOM)</span>
                            </div>
                            <button 
                                className="bom-close-btn"
                                onClick={() => setIsBomOpen(false)}
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="bom-drawer-body">
                            <div className="bom-summary-badge">
                                <span>Total Placed Parts: <strong>{components.length}</strong></span>
                                <span>Unique Components: <strong>{bomItems.length}</strong></span>
                            </div>

                            <table className="bom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Designators</th>
                                        <th>Description</th>
                                        <th>Value</th>
                                        <th>Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bomItems.map((item, idx) => (
                                        <tr key={item.key}>
                                            <td className="item-num">{idx + 1}</td>
                                            <td className="item-des">{item.designators.join(", ")}</td>
                                            <td className="item-desc">{item.desc}</td>
                                            <td className="item-val">{item.rating}</td>
                                            <td className="item-qty">{item.count}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bom-drawer-footer">
                            <button 
                                className="bom-export-btn"
                                onClick={exportBomCsv}
                            >
                                <i className="ri-download-cloud-line"></i>
                                <span>Export BOM to CSV</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SchematicView;
