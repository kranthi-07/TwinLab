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
    zoom: externalZoom,
    onUpdateZoom,
    onClose
}) {
    const [internalZoom, setInternalZoom] = useState(1);
    const zoom = externalZoom !== undefined ? externalZoom : internalZoom;

    const setZoom = (valOrFn) => {
        const nextVal = typeof valOrFn === "function" ? valOrFn(zoom) : valOrFn;
        if (onUpdateZoom) {
            onUpdateZoom(nextVal);
        } else {
            setInternalZoom(nextVal);
        }
    };
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
            } else if (c.type === "motor-dc") {
                rating = "3V-6V DC • 12,500 RPM";
                desc = "130 Cylindrical DC Hobby Motor";
                key = "motor_dc";
            } else if (c.type === "motor-geared" || c.type === "motor-bo") {
                rating = "3V-6V DC • TT BO Dual Shaft";
                desc = "TT Gearbox BO DC Motor";
                key = "motor_geared";
            } else if (c.type === "battery-aa" || c.type === "battery-aaa") {
                const isAAA = c.type === "battery-aaa";
                const cells = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : 2);
                rating = `${(cells * 1.5).toFixed(1)}V DC (${cells}× ${isAAA ? "AAA" : "AA"})`;
                desc = `${isAAA ? "AAA" : "AA"} Battery Pack Enclosure`;
                key = `bat_${c.type}_${cells}`;
            } else if (c.type === "battery-coin") {
                rating = "3.0V DC • 225mAh";
                desc = "CR2032 Lithium Coin Cell";
                key = "bat_coin";
            } else if (c.type === "capacitor-electrolytic") {
                rating = `${c.capacitance || "10µF"} • 50V Polarized`;
                desc = "Aluminum Electrolytic Capacitor";
                key = `cap_elec_${c.capacitance}`;
            } else if (c.type === "sensor-pir") {
                rating = "4.5V-20V VCC • 3.3V TTL";
                desc = "HC-SR501 Pyroelectric PIR Sensor";
                key = "sensor_pir";
            } else if (c.type === "sensor-ultrasonic") {
                rating = "5V VCC • 2cm - 400cm";
                desc = "HC-SR04 Ultrasonic Sonar Transducer";
                key = "sensor_ultrasonic";
            } else if (c.type === "sensor-temp" || c.type === "sensor-temperature" || c.type === "sensor-tmp36") {
                rating = "2.7V-5.5V • 10mV/°C";
                desc = "TMP36 Precision Temperature Sensor";
                key = "sensor_temp";
            } else if (c.type === "photoresistor" || c.type === "sensor-light") {
                rating = "5kΩ - 500kΩ Light Dependent";
                desc = "Cadmium Sulfide (CdS) Photoresistor";
                key = "photoresistor";
            } else if (c.type === "transistor" || c.type === "transistor-npn") {
                rating = "40V / 800mA • TO-92";
                desc = "2N2222 NPN Bipolar Transistor";
                key = "transistor_npn";
            } else if (c.type === "transistor-pnp") {
                rating = "40V / 200mA • TO-92";
                desc = "2N3906 PNP Bipolar Transistor";
                key = "transistor_pnp";
            } else if (c.type === "mosfet-n" || c.type === "mosfet-p") {
                rating = "100V / 33A • TO-220";
                desc = "IRF540N N-Channel Power MOSFET";
                key = "mosfet";
            } else if (c.type === "servo-sg90") {
                rating = "4.8V-6V • 180° Micro Servo";
                desc = "TowerPro SG90 Mini Servo";
                key = "servo";
            } else if (c.type?.startsWith("ic-")) {
                rating = "DIP-14 • High-Speed CMOS";
                desc = c.name || "74HC Logic Integrated Circuit";
                key = c.type;
            } else if (c.type?.startsWith("lcd")) {
                rating = "I2C HD44780 5V";
                desc = c.type === "lcd-2004" ? "20x4 Alphanumeric LCD" : "16x2 Alphanumeric LCD";
                key = c.type;
            } else if (c.type === "rpi-pico" || c.type === "raspberry-pi") {
                rating = "RP2040 Dual ARM Cortex-M0+";
                desc = "Raspberry Pi Pico Microcontroller";
                key = "rpi_pico";
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

                                    {/* H. DC MOTORS: IEEE Standard Motor Circle with "M" inside */}
                                    {(c.type === "motor-dc" || c.type === "motor-geared" || c.type === "motor-bo") && (() => {
                                        const isGeared = c.type === "motor-geared" || c.type === "motor-bo";
                                        const isSpinning = Boolean(simulationResult?.motorStates?.[c.id]?.isSpinning);

                                        return (
                                            <g className="symbol-motor">
                                                {/* Leads from 0,0 and 48,0 into central motor circle */}
                                                <line x1="0" y1="0" x2="8" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                                <line x1="40" y1="0" x2="48" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                                {/* Motor Main Circle (Radius 16 at x=24, y=0) */}
                                                <circle 
                                                    cx="24" 
                                                    cy="0" 
                                                    r="16" 
                                                    fill={isSpinning ? "rgba(56, 189, 248, 0.15)" : "rgba(15, 23, 42, 0.9)"} 
                                                    stroke={isSelected ? "#FF8A00" : "#38bdf8"} 
                                                    strokeWidth="2.4" 
                                                />
                                                {/* "M" Letter Symbol */}
                                                <text x="24" y="5" textAnchor="middle" fontSize="13" fontWeight="900" fill="#38bdf8" fontFamily="sans-serif">M</text>
                                                {/* Polarity markers */}
                                                <text x="4" y="-4" fontSize="9" fill="#ef4444" fontWeight="bold">+</text>
                                                <text x="44" y="-4" fontSize="9" fill="#94a3b8" fontWeight="bold">−</text>
                                                {/* Terminals */}
                                                <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                                <circle cx="48" cy="0" r="3.5" fill="#38bdf8" />
                                                {/* Ref Des & Rating */}
                                                <text x="24" y="-22" textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x="24" y="28" textAnchor="middle" className="sch-val-label">{isGeared ? "TT GEARED" : "DC MOTOR"}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* I. AA & AAA BATTERY PACKS & COIN CELL */}
                                    {(c.type === "battery-aa" || c.type === "battery-aaa" || c.type === "battery-coin") && (() => {
                                        const isCoin = c.type === "battery-coin";
                                        const cellCount = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : c.voltage === 4.5 ? 3 : 2);
                                        const totalWidth = cellCount === 1 ? 64 : cellCount === 4 ? 176 : cellCount === 3 ? 140 : 96;
                                        const posLeadX = isCoin ? 48 : (totalWidth - 20);
                                        const negLeadX = isCoin ? 16 : 20;
                                        const leadY = isCoin ? 32 : -14;
                                        const midX = (posLeadX + negLeadX) / 2;

                                        return (
                                            <g className="symbol-battery-pack">
                                                <line x1={negLeadX} y1={leadY} x2={negLeadX} y2={leadY + 20} stroke="#f8fafc" strokeWidth="2" />
                                                <line x1={posLeadX} y1={leadY} x2={posLeadX} y2={leadY + 20} stroke="#f8fafc" strokeWidth="2" />
                                                <line x1={negLeadX} y1={leadY + 20} x2={midX - 6} y2={leadY + 20} stroke="#f8fafc" strokeWidth="2" />
                                                <line x1={midX + 6} y1={leadY + 20} x2={posLeadX} y2={leadY + 20} stroke="#f8fafc" strokeWidth="2" />
                                                {/* Long positive plate */}
                                                <line x1={midX + 6} y1={leadY + 12} x2={midX + 6} y2={leadY + 28} stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="round" />
                                                {/* Short negative plate */}
                                                <line x1={midX - 6} y1={leadY + 15} x2={midX - 6} y2={leadY + 25} stroke="#f8fafc" strokeWidth="4.5" strokeLinecap="round" />
                                                <text x={midX + 12} y={leadY + 16} fontSize="9" fill="#ef4444" fontWeight="bold">+</text>
                                                <text x={midX - 14} y={leadY + 16} fontSize="9" fill="#94a3b8" fontWeight="bold">−</text>
                                                <circle cx={negLeadX} cy={leadY} r="3.5" fill="#38bdf8" />
                                                <circle cx={posLeadX} cy={leadY} r="3.5" fill="#38bdf8" />
                                                <text x={midX} y={leadY - 6} textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x={midX} y={leadY + 42} textAnchor="middle" className="sch-val-label">{isCoin ? "3V COIN" : `${(cellCount * 1.5).toFixed(1)}V DC`}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* J. ELECTROLYTIC CAPACITOR: Polarized (Straight + Curved Plate) */}
                                    {c.type === "capacitor-electrolytic" && (
                                        <g className="symbol-capacitor-elec">
                                            {/* Anode lead at 0, 0 to 6, 0 */}
                                            <line x1="0" y1="0" x2="6" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                            {/* Straight Anode Plate */}
                                            <line x1="6" y1="-10" x2="6" y2="10" stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="round" />
                                            <text x="3" y="-12" fontSize="9" fill="#ef4444" fontWeight="bold">+</text>
                                            {/* Curved Cathode Plate */}
                                            <path d="M 12 -10 C 9 -5, 9 5, 12 10" fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinecap="round" />
                                            {/* Cathode lead from 10, 0 to 16, 0 */}
                                            <line x1="10" y1="0" x2="16" y2="0" stroke={isSelected ? "#FF8A00" : "#f8fafc"} strokeWidth="2.2" />
                                            <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="0" r="3.5" fill="#38bdf8" />
                                            <text x="8" y="-18" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="8" y="24" textAnchor="middle" className="sch-val-label">{c.capacitance || "10µF"}</text>
                                        </g>
                                    )}

                                    {/* K. PIEZO BUZZER: Acoustic Transducer Symbol */}
                                    {c.type === "buzzer" && (
                                        <g className="symbol-buzzer">
                                            <line x1="0" y1="32" x2="0" y2="20" stroke="#f8fafc" strokeWidth="2.2" />
                                            <line x1="16" y1="32" x2="16" y2="20" stroke="#f8fafc" strokeWidth="2.2" />
                                            <circle cx="8" cy="14" r="12" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2.2" />
                                            <path d="M 2 14 L 14 6 L 14 22 Z" fill="#38bdf8" />
                                            <circle cx="0" cy="32" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="32" r="3.5" fill="#38bdf8" />
                                            <text x="8" y="-4" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="8" y="46" textAnchor="middle" className="sch-val-label">BUZZER</text>
                                        </g>
                                    )}

                                    {/* L. PIR MOTION SENSOR & ULTRASONIC SENSOR */}
                                    {(c.type === "sensor-pir" || c.type === "sensor-ultrasonic") && (() => {
                                        const isPir = c.type === "sensor-pir";
                                        const width = isPir ? 48 : 64;
                                        return (
                                            <g className="symbol-sensor">
                                                <rect x="-8" y="-42" width={width} height="36" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                                <circle cx={isPir ? 16 : 24} cy="-24" r="9" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
                                                <text x={isPir ? 16 : 24} y="-21" textAnchor="middle" fontSize="6.5" fill="#38bdf8" fontWeight="bold">{isPir ? "PIR" : "SONAR"}</text>
                                                {/* Leads & Pins */}
                                                <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                                <circle cx="16" cy="0" r="3.5" fill="#38bdf8" />
                                                <circle cx="32" cy="0" r="3.5" fill="#38bdf8" />
                                                {!isPir && <circle cx="48" cy="0" r="3.5" fill="#38bdf8" />}
                                                <line x1="0" y1="-6" x2="0" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                                <line x1="16" y1="-6" x2="16" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                                <line x1="32" y1="-6" x2="32" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                                {!isPir && <line x1="48" y1="-6" x2="48" y2="0" stroke="#f8fafc" strokeWidth="2" />}
                                                <text x={isPir ? 16 : 24} y="-48" textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x={isPir ? 16 : 24} y="14" textAnchor="middle" className="sch-val-label">{isPir ? "HC-SR501" : "HC-SR04"}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* M. TMP36 TEMPERATURE SENSOR */}
                                    {(c.type === "sensor-temp" || c.type === "sensor-temperature" || c.type === "sensor-tmp36") && (
                                        <g className="symbol-temp-sensor">
                                            <rect x="-6" y="-38" width="44" height="32" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                            <text x="16" y="-22" textAnchor="middle" fontSize="7" fill="#38bdf8" fontWeight="bold">TMP36</text>
                                            <text x="16" y="-12" textAnchor="middle" fontSize="5" fill="#94a3b8">TEMP</text>
                                            <line x1="0" y1="-6" x2="0" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="16" y1="-6" x2="16" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="32" y1="-6" x2="32" y2="0" stroke="#f8fafc" strokeWidth="2" />
                                            <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="0" r="3.5" fill="#38bdf8" />
                                            <text x="16" y="-44" textAnchor="middle" className="sch-ref-des">{des}</text>
                                        </g>
                                    )}

                                    {/* N. PHOTORESISTOR (LDR): Resistor with light arrows */}
                                    {(c.type === "photoresistor" || c.type === "sensor-light") && (
                                        <g className="symbol-photoresistor">
                                            <circle cx="16" cy="16" r="14" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                                            <path d="M 0 16 L 8 16 L 11 11 L 15 21 L 19 11 L 22 16 L 32 16" fill="none" stroke="#f8fafc" strokeWidth="2" />
                                            {/* Light Inflow Arrows */}
                                            <line x1="26" y1="2" x2="20" y2="8" stroke="#f59e0b" strokeWidth="1.6" markerEnd="url(#schematic-arrow)" />
                                            <line x1="30" y1="6" x2="24" y2="12" stroke="#f59e0b" strokeWidth="1.6" markerEnd="url(#schematic-arrow)" />
                                            <circle cx="0" cy="16" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="16" r="3.5" fill="#38bdf8" />
                                            <text x="16" y="-2" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="16" y="38" textAnchor="middle" className="sch-val-label">LDR</text>
                                        </g>
                                    )}

                                    {/* O. BIPOLAR TRANSISTORS (NPN & PNP) */}
                                    {(c.type === "transistor" || c.type === "transistor-npn" || c.type === "transistor-pnp") && (() => {
                                        const isPNP = c.type === "transistor-pnp";
                                        return (
                                            <g className="symbol-transistor">
                                                <circle cx="16" cy="8" r="16" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                                {/* Base Bar */}
                                                <line x1="16" y1="0" x2="16" y2="16" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" />
                                                {/* Base Lead at (16, 16) */}
                                                <line x1="16" y1="16" x2="16" y2="24" stroke="#f8fafc" strokeWidth="2" />
                                                {/* Collector line at (0, 16) */}
                                                <line x1="0" y1="16" x2="8" y2="16" stroke="#f8fafc" strokeWidth="2" />
                                                <line x1="8" y1="16" x2="16" y2="4" stroke="#f8fafc" strokeWidth="2" />
                                                {/* Emitter line at (32, 16) */}
                                                <line x1="32" y1="16" x2="24" y2="16" stroke="#f8fafc" strokeWidth="2" />
                                                <line x1="24" y1="16" x2="16" y2="12" stroke="#f8fafc" strokeWidth="2" />
                                                <circle cx="0" cy="16" r="3.5" fill="#38bdf8" />
                                                <circle cx="16" cy="16" r="3.5" fill="#38bdf8" />
                                                <circle cx="32" cy="16" r="3.5" fill="#38bdf8" />
                                                <text x="16" y="-14" textAnchor="middle" className="sch-ref-des">{des}</text>
                                                <text x="16" y="36" textAnchor="middle" className="sch-val-label">{isPNP ? "2N3906 PNP" : "2N2222 NPN"}</text>
                                            </g>
                                        );
                                    })()}

                                    {/* P. POWER MOSFET (TO-220 N-Channel & P-Channel) */}
                                    {(c.type === "mosfet-n" || c.type === "mosfet-p") && (
                                        <g className="symbol-mosfet">
                                            <circle cx="16" cy="-18" r="18" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                            {/* Gate Lead at 0, 0 */}
                                            <line x1="0" y1="0" x2="0" y2="-18" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="0" y1="-18" x2="8" y2="-18" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="8" y1="-26" x2="8" y2="-10" stroke="#f8fafc" strokeWidth="2.8" />
                                            {/* Drain at 16, 0 */}
                                            <line x1="16" y1="0" x2="16" y2="-12" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="16" y1="-12" x2="12" y2="-12" stroke="#f8fafc" strokeWidth="2" />
                                            {/* Source at 32, 0 */}
                                            <line x1="32" y1="0" x2="32" y2="-24" stroke="#f8fafc" strokeWidth="2" />
                                            <line x1="32" y1="-24" x2="12" y2="-24" stroke="#f8fafc" strokeWidth="2" />
                                            <circle cx="0" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="0" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="0" r="3.5" fill="#38bdf8" />
                                            <text x="16" y="-42" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="16" y="16" textAnchor="middle" className="sch-val-label">IRF540N</text>
                                        </g>
                                    )}

                                    {/* Q. POTENTIOMETER: Resistor with Wiper */}
                                    {c.type === "potentiometer" && (
                                        <g className="symbol-potentiometer">
                                            <path d="M 0 48 L 0 32 L 6 32 L 8 24 L 12 40 L 16 24 L 20 40 L 24 24 L 26 32 L 32 32 L 32 48" fill="none" stroke="#f8fafc" strokeWidth="2" />
                                            {/* Wiper Arrow from Center Pin (16, 48) to Resistor Center */}
                                            <line x1="16" y1="48" x2="16" y2="34" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#schematic-arrow)" />
                                            <circle cx="0" cy="48" r="3.5" fill="#38bdf8" />
                                            <circle cx="16" cy="48" r="3.5" fill="#38bdf8" />
                                            <circle cx="32" cy="48" r="3.5" fill="#38bdf8" />
                                            <text x="16" y="14" textAnchor="middle" className="sch-ref-des">{des}</text>
                                            <text x="16" y="62" textAnchor="middle" className="sch-val-label">10k POT</text>
                                        </g>
                                    )}

                                    {/* R. DIP-14 LOGIC ICs (74HCxx, 555, L293D) */}
                                    {c.type?.startsWith("ic-") && (
                                        <g className="symbol-dip-ic">
                                            <rect x="-8" y="-6" width="112" height="44" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                            <path d="M -8 12 C -4 12, -4 20, -8 20" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                                            {[0, 16, 32, 48, 64, 80, 96].map(px => (
                                                <g key={px}>
                                                    <circle cx={px} cy="0" r="3" fill="#38bdf8" />
                                                    <circle cx={px} cy="32" r="3" fill="#38bdf8" />
                                                </g>
                                            ))}
                                            <text x="48" y="19" textAnchor="middle" fontSize="8" fill="#38bdf8" fontWeight="bold">{c.name || c.type.toUpperCase()}</text>
                                            <text x="48" y="-12" textAnchor="middle" className="sch-ref-des">{des}</text>
                                        </g>
                                    )}

                                    {/* S. CHARACTER LCD MODULES (1602 / 2004) */}
                                    {c.type?.startsWith("lcd") && (
                                        <g className="symbol-lcd">
                                            <rect x="0" y="-30" width="80" height="40" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="2" />
                                            <rect x="8" y="-24" width="64" height="20" rx="2" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1" />
                                            <text x="40" y="-11" textAnchor="middle" fontSize="6.5" fill="#38bdf8" fontWeight="bold">{c.type === "lcd-2004" ? "LCD 20x4" : "LCD 16x2"}</text>
                                            <circle cx="16" cy="-10" r="2.5" fill="#38bdf8" />
                                            <circle cx="32" cy="-10" r="2.5" fill="#38bdf8" />
                                            <circle cx="48" cy="-10" r="2.5" fill="#38bdf8" />
                                            <circle cx="64" cy="-10" r="2.5" fill="#38bdf8" />
                                            <text x="40" y="-36" textAnchor="middle" className="sch-ref-des">{des}</text>
                                        </g>
                                    )}

                                    {/* T. RASPBERRY PI PICO & ARDUINO MEGA/NANO */}
                                    {(c.type === "rpi-pico" || c.type === "raspberry-pi" || c.type === "arduino-mega" || c.type === "arduino-nano") && (() => {
                                        const isPico = c.type === "rpi-pico" || c.type === "raspberry-pi";
                                        const isMega = c.type === "arduino-mega";
                                        const w = isPico ? 128 : isMega ? 220 : 100;
                                        const h = isPico ? 368 : isMega ? 300 : 110;

                                        return (
                                            <g className="symbol-mcu-expanded">
                                                <rect x="0" y="0" width={w} height={h} rx="6" fill="rgba(15, 23, 42, 0.85)" stroke="#38bdf8" strokeWidth="2" />
                                                <text x={w / 2} y="24" textAnchor="middle" className="sch-mcu-title">{isPico ? "RPI PICO" : isMega ? "ARDUINO MEGA" : "ARDUINO NANO"}</text>
                                                <text x={w / 2} y="38" textAnchor="middle" className="sch-mcu-chip">{isPico ? "RP2040 ARM" : isMega ? "ATmega2560" : "ATmega328P"}</text>
                                                <text x={w / 2} y={h - 10} textAnchor="middle" className="sch-ref-des">{des}</text>
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
