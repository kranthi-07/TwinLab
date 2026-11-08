import "./SmallComponent.css";
import { useState, useRef, useEffect } from "react";
import { soundManager } from "../../../utils/audioManager";

// Helper to calculate exact realistic dark shades for any LED color hex
function getLedColors(hex = "#ef4444") {
    const colorMap = {
        "#ef4444": { base: "#ef4444", darkLit: "#7f1d1d", darkUnlit: "#450a0a", rim: "#991b1b" }, // Red
        "#10b981": { base: "#10b981", darkLit: "#065f46", darkUnlit: "#064e3b", rim: "#047857" }, // Green
        "#3b82f6": { base: "#3b82f6", darkLit: "#1e40af", darkUnlit: "#172554", rim: "#1d4ed8" }, // Blue
        "#eab308": { base: "#eab308", darkLit: "#854d0e", darkUnlit: "#422006", rim: "#a16207" }, // Yellow
        "#f97316": { base: "#f97316", darkLit: "#9a3412", darkUnlit: "#431407", rim: "#c2410c" }, // Orange
        "#ffffff": { base: "#ffffff", unlitBase: "#64748b", darkLit: "#94a3b8", darkUnlit: "#1e293b", rim: "#475569" }, // White (Translucent clear water-white epoxy when unlit)
        "#a855f7": { base: "#a855f7", darkLit: "#581c87", darkUnlit: "#3b0764", rim: "#7e22ce" }, // Purple
    };

    const norm = (hex || "#ef4444").toLowerCase();
    if (colorMap[norm]) return colorMap[norm];

    // Generic RGB calculation for any custom hex:
    let c = norm.replace("#", "");
    if (c.length === 3) c = c.split("").map(x => x + x).join("");
    const num = parseInt(c, 16);
    if (isNaN(num)) return colorMap["#ef4444"];

    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;

    return {
        base: hex,
        darkLit: `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`,
        darkUnlit: `rgb(${Math.round(r * 0.28)}, ${Math.round(g * 0.28)}, ${Math.round(b * 0.28)})`,
        rim: `rgb(${Math.round(r * 0.65)}, ${Math.round(g * 0.65)}, ${Math.round(b * 0.65)})`
    };
}

// Calculate 4 standard color code bands for axial resistor
function getResistorColorBands(resistance = 220) {
    const colorHexMap = {
        black: "#09090b",
        brown: "#78350f",
        red: "#dc2626",
        orange: "#ea580c",
        yellow: "#eab308",
        green: "#16a34a",
        blue: "#2563eb",
        violet: "#7c3aed",
        gray: "#64748b",
        white: "#f8fafc",
        gold: "#d97706"
    };

    const r = Math.round(Number(resistance) || 220);
    const s = r.toString();
    const d1 = parseInt(s[0], 10) || 2;
    const d2 = parseInt(s[1] || "0", 10);
    const zeroes = s.length - 2;

    const colorNames = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"];
    const band1 = colorHexMap[colorNames[d1]] || colorHexMap.red;
    const band2 = colorHexMap[colorNames[d2]] || colorHexMap.red;
    const band3 = zeroes >= 0 && zeroes < colorNames.length ? colorHexMap[colorNames[zeroes]] : colorHexMap.brown;
    const band4 = colorHexMap.gold; // 5% tolerance

    return [band1, band2, band3, band4];
}

function SmallComponent({
    id,
    type,
    name,
    designator,
    x,
    y,
    rotation = 0,
    color,
    voltage = 9,
    resistance = 220,
    isSelected,
    onSelect,
    onDelete,
    onRotate,
    onMouseDown,
    simState,
    isSimulating = false,
    isWireMode,
    activeWire,
    onStartWireAtPoint,
    isPressed = false,
    wiperValue = 0.5,
    switchState = "left",
    isOn,
    cells,
    lux = 50,
    capacitance = "100nF",
    backlightColor = "#0284c7",
    lcdTextColor = "#ffffff",
    angle = 90,
    distanceCm = 25,
    onUpdate
}) {
    const [hoveredTerminal, setHoveredTerminal] = useState(null);
    const lastMouseDownRef = useRef({ time: 0, key: "" });
    const voltageDisplay = voltage != null ? `${voltage}V` : "9V";

    // Play/stop electronic chime tone for buzzer
    useEffect(() => {
        if (type === "buzzer") {
            if (simState?.isBeeping) {
                soundManager.startBuzzer(id, 880);
            } else {
                soundManager.stopBuzzer(id);
            }
        }
        return () => {
            if (type === "buzzer") {
                soundManager.stopBuzzer(id);
            }
        };
    }, [type, id, simState?.isBeeping]);

    const getTerminalWorldCoords = (localX, localY) => {
        const rad = ((rotation || 0) * Math.PI) / 180;
        const worldX = Math.round(x + localX * Math.cos(rad) - localY * Math.sin(rad));
        const worldY = Math.round(y + localX * Math.sin(rad) + localY * Math.cos(rad));
        return { worldX, worldY };
    };

    const handleTerminalAction = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const { worldX, worldY } = getTerminalWorldCoords(localX, localY);
        onStartWireAtPoint && onStartWireAtPoint({ x: worldX, y: worldY });
    };

    // Second mousedown on terminal immediately opens wire (allows drag-to-wire instantly)
    const handleTerminalMouseDown = (e, termKey, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const now = Date.now();
        const isDouble = (lastMouseDownRef.current.key === termKey) && (now - lastMouseDownRef.current.time < 420);
        lastMouseDownRef.current = { time: now, key: termKey };

        if (isDouble) {
            handleTerminalAction(e, localX, localY);
        }
    };

    // Releasing mouse on a different terminal connects wire
    const handleTerminalMouseUp = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        if (activeWire && onStartWireAtPoint) {
            const { worldX, worldY } = getTerminalWorldCoords(localX, localY);
            const startPt = activeWire.points?.[0];
            if (startPt && (startPt.x !== worldX || startPt.y !== worldY)) {
                onStartWireAtPoint({ x: worldX, y: worldY });
            }
        }
    };

    const handleTerminalPress = (e, termKey, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const now = Date.now();
        const isDouble = (lastMouseDownRef.current.key === termKey) && (now - lastMouseDownRef.current.time < 420);

        if (activeWire || isDouble || isWireMode) {
            handleTerminalAction(e, localX, localY);
        }
    };

    return (
        <div 
            className={`canvas-small-comp comp-${type} ${isSelected ? "selected" : ""}`}
            style={{
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                transformOrigin: "0 0"
            }}
            onMouseLeave={() => setHoveredTerminal(null)}
            onMouseDown={(e) => {
                onSelect && onSelect(id);
                onMouseDown && onMouseDown(e, id);
            }}
        >
            {/* RESISTOR: 64px span (4 grid units of 16px). Pins at (0, 0) and (64, 0) */}
            {type === "resistor" && (() => {
                const curResistance = resistance || 220;
                const bands = getResistorColorBands(curResistance);
                const rLabel = curResistance >= 1e6 
                    ? `${+(curResistance / 1e6).toFixed(2)}MΩ` 
                    : curResistance >= 1e3 
                        ? `${+(curResistance / 1e3).toFixed(2)}kΩ` 
                        : `${curResistance}Ω`;
                const isConducting = Boolean(isSimulating && (simState?.isPowered || simState?.isDischarging || simState?.current > 0));

                return (
                    <div className={`resistor-container ${isConducting ? "is-conducting" : ""}`}>
                        {/* Continuous Shiny Metallic Silver Wire Track ("branches") linking Pin 1 (0,0) and Pin 2 (64,0) to Ceramic Body */}
                        <div className="resistor-wire-track"></div>
                        <div className="resistor-hole-lead lead-left"></div>
                        <div className="resistor-hole-lead lead-right"></div>

                        {/* Terminal Pin 1 at (0, 0) */}
                        <span 
                            className={`terminal-pin pin-1 ${hoveredTerminal === "r1" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("r1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "r1", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                            onClick={(e) => handleTerminalPress(e, "r1", 0, 0)}
                        />
                        {hoveredTerminal === "r1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}

                        {/* Ceramic Body */}
                        <div className={`resistor-ceramic-body ${isConducting ? "active-conducting" : ""}`}>
                            <span className="band" style={{ backgroundColor: bands[0] }}></span>
                            <span className="band" style={{ backgroundColor: bands[1] }}></span>
                            <span className="band" style={{ backgroundColor: bands[2] }}></span>
                            <span className="band" style={{ backgroundColor: bands[3] }}></span>
                            {isConducting && <div className="resistor-thermal-glow"></div>}
                        </div>

                        {/* Terminal Pin 2 at (64, 0) */}
                        <span 
                            className={`terminal-pin pin-2 ${hoveredTerminal === "r2" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("r2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "r2", 64, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 64, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 64, 0); }}
                            onClick={(e) => handleTerminalPress(e, "r2", 64, 0)}
                        />
                        {hoveredTerminal === "r2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 64, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* REALISTIC 5mm THROUGH-HOLE LED WITH ANVIL, DIE, BOND WIRE, BULLET DOME & BLAST BURNOUT */}
            {type === "led" && (() => {
                const ledShades = getLedColors(color);
                const isLit = Boolean(simState?.isOn && !simState?.isOverloaded);
                const isDim = Boolean(isLit && (simState?.isDim || (simState?.brightness != null && simState.brightness < 0.5)));
                const brightness = simState?.brightness || (isDim ? 0.35 : (isLit ? 0.9 : 0));

                return (
                    <div 
                        className={`led-container ${isLit ? (isDim ? "is-lit is-dim" : "is-lit is-bright") : "is-dull"} ${simState?.isOverloaded ? "is-overloaded" : ""}`}
                        style={{ 
                            "--led-color": ledShades.base,
                            "--led-brightness": brightness
                        }}
                    >
                        {/* Clickable Hit-Box covering entire 5mm LED dome & body to open properties */}
                        <div 
                            className="led-hitbox"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isWireMode && onSelect) onSelect(id);
                            }}
                            onMouseDown={(e) => {
                                if (!isWireMode) {
                                    onSelect && onSelect(id);
                                    onMouseDown && onMouseDown(e, id);
                                }
                            }}
                        />

                        <svg 
                            className="led-realistic-svg" 
                            viewBox="-12 -54 40 60" 
                            width="40" 
                            height="60"
                        >
                            <defs>
                                {/* Silver Metal Lead Gradient */}
                                <linearGradient id={`led-lead-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#94a3b8" />
                                    <stop offset="45%" stopColor="#f8fafc" />
                                    <stop offset="70%" stopColor="#cbd5e1" />
                                    <stop offset="100%" stopColor="#64748b" />
                                </linearGradient>

                                {/* Translucent Glass Dome Gradient with Dynamic Dim/Bright Light */}
                                <radialGradient id={`led-dome-grad-${id}`} cx="35%" cy="25%" r="75%">
                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={isLit ? (isDim ? "0.65" : "0.98") : "0.35"} />
                                    <stop offset="25%" stopColor={isLit ? ledShades.base : (ledShades.unlitBase || ledShades.base)} stopOpacity={isLit ? (isDim ? "0.78" : "0.98") : "0.65"} />
                                    <stop offset="70%" stopColor={isLit ? ledShades.base : (ledShades.unlitBase || ledShades.base)} stopOpacity={isLit ? (isDim ? "0.88" : "1.0") : "0.75"} />
                                    <stop offset="100%" stopColor={isLit ? (isDim ? ledShades.rim : ledShades.darkLit) : ledShades.darkUnlit} stopOpacity="0.95" />
                                </radialGradient>

                                {/* Overloaded / Burned Out Carbon Black Gradient */}
                                <radialGradient id={`led-burned-grad-${id}`} cx="45%" cy="35%" r="70%">
                                    <stop offset="0%" stopColor="#52525b" />
                                    <stop offset="35%" stopColor="#27272a" />
                                    <stop offset="70%" stopColor="#18181b" />
                                    <stop offset="100%" stopColor="#09090b" />
                                </radialGradient>

                                {/* Adaptive Volumetric Core Glow */}
                                <filter id={`led-glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
                                    <feGaussianBlur stdDeviation={isDim ? "1.8" : "4.8"} result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        {!isDim && <feMergeNode in="coloredBlur" opacity="0.6"/>}
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Volumetric Emissive Ambient Backlight Glow */}
                            {isLit && (
                                <circle 
                                    cx="8" 
                                    cy="-30" 
                                    r={isDim ? "14" : "22"} 
                                    fill={ledShades.base} 
                                    opacity={isDim ? "0.22" : "0.65"} 
                                    filter={`url(#led-glow-${id})`}
                                />
                            )}

                            {/* 1. Metal Leads (Through-Hole Pins connecting to Breadboard) with interactive hover */}
                            <rect 
                                x="-2" 
                                y="-14" 
                                width="4" 
                                height="14" 
                                rx="0.6" 
                                fill={`url(#led-lead-grad-${id})`} 
                                style={{ pointerEvents: "auto", cursor: "crosshair" }}
                                onMouseEnter={() => setHoveredTerminal("anode")}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, "anode", 0, 0)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                                onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                                onClick={(e) => handleTerminalPress(e, "anode", 0, 0)}
                            />
                            <rect 
                                x="14" 
                                y="-14" 
                                width="4" 
                                height="14" 
                                rx="0.6" 
                                fill={`url(#led-lead-grad-${id})`} 
                                style={{ pointerEvents: "auto", cursor: "crosshair" }}
                                onMouseEnter={() => setHoveredTerminal("cathode")}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, "cathode", 16, 0)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                                onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 0); }}
                                onClick={(e) => handleTerminalPress(e, "cathode", 16, 0)}
                            />

                            {/* 2. Internal Lead Frame (Visible through epoxy lens) */}
                            <g className="led-internal-frame" opacity={simState?.isOverloaded ? 0.35 : 0.75}>
                                {/* Anode Post (Left Post) */}
                                <path d="M 0 -14 L 3 -18 L 3 -29" stroke={`url(#led-lead-grad-${id})`} strokeWidth="1.6" strokeLinecap="round" fill="none" />
                                {/* Cathode Anvil (Right Anvil with Reflector Cup) */}
                                <path d="M 16 -14 L 13 -18 L 13 -26 L 6 -28 L 6 -30 L 11 -30 L 13 -27 Z" fill={`url(#led-lead-grad-${id})`} />
                                {/* Semiconductor Die (Chip in Reflector Cup) */}
                                <rect x="7.2" y="-29.2" width="1.8" height="1.8" rx="0.3" fill={simState?.isOn ? "#ffffff" : "#fbbf24"} />
                                {/* Gold Bond Wire */}
                                {!simState?.isOverloaded && (
                                    <path d="M 3 -29 Q 5 -33 7.8 -29" stroke="#f59e0b" strokeWidth="0.6" fill="none" />
                                )}
                            </g>

                            {/* 3. Base Collar / Flange (Color-matched to LED color) */}
                            <path 
                                d="M -3 -14 L 17 -14 L 19 -16 L 19 -18 L -3 -18 Z" 
                                fill={simState?.isOverloaded ? `url(#led-burned-grad-${id})` : `url(#led-dome-grad-${id})`}
                                stroke={simState?.isOverloaded ? "#3f3f46" : ledShades.rim}
                                strokeWidth="0.6"
                            />

                            {/* 4. Cylindrical Body + Parabolic Bullet Dome */}
                            <path 
                                className="led-dome-path"
                                d="M -2 -18 L -2 -31 C -2 -44 8 -46 8 -46 C 8 -46 18 -44 18 -31 L 18 -18 Z" 
                                fill={simState?.isOverloaded ? `url(#led-burned-grad-${id})` : `url(#led-dome-grad-${id})`}
                                stroke={simState?.isOverloaded ? "#27272a" : (simState?.isOn ? "#ffffff" : ledShades.rim)}
                                strokeWidth={simState?.isOn ? "1" : "0.7"}
                                filter={simState?.isOn ? `url(#led-glow-${id})` : "none"}
                            />

                            {/* 5. Realistic Specular Curved Glass Highlight */}
                            {!simState?.isOverloaded && (
                                <path 
                                    d="M 0 -22 L 0 -31 C 0 -38 5 -43 8 -44" 
                                    stroke="rgba(255, 255, 255, 0.75)" 
                                    strokeWidth="1.4" 
                                    strokeLinecap="round" 
                                    fill="none" 
                                />
                            )}

                            {/* 6. Realistic Overload / Burnout Crack & Soot */}
                            {simState?.isOverloaded && (
                                <g className="led-blast-cracks">
                                    <path d="M 8 -44 L 6 -36 L 9 -30 L 4 -23 L 7 -18" stroke="#71717a" strokeWidth="1" strokeLinecap="round" fill="none" />
                                    <path d="M 6 -36 L 12 -38 L 15 -32" stroke="#52525b" strokeWidth="0.8" strokeLinecap="round" fill="none" />
                                    <circle cx="8" cy="-30" r="5" fill="rgba(0,0,0,0.7)" />
                                </g>
                            )}
                        </svg>

                        {/* 7. Animated Blast Explosion: Starburst Flash & Rising Smoke Puffs */}
                        {simState?.isOverloaded && (
                            <div className="led-blast-effects">
                                <div className="blast-flash-starburst"></div>
                                <div className="blast-smoke-cloud smoke-1"></div>
                                <div className="blast-smoke-cloud smoke-2"></div>
                                <div className="blast-smoke-cloud smoke-3"></div>
                                <div className="blast-sparks-ring"></div>
                            </div>
                        )}

                        {/* Hover Tooltips explicitly mentioning Anode and Cathode */}
                        {hoveredTerminal === "anode" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Anode (+)
                            </div>
                        )}
                        {hoveredTerminal === "cathode" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Cathode (−)
                            </div>
                        )}

                        {/* Accurate Terminal Pins directly at (0, 0) and (16, 0) with Polarity Badges */}
                        <span 
                            className={`terminal-pin pin-anode ${hoveredTerminal === "anode" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("anode")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "anode", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                            onClick={(e) => handleTerminalPress(e, "anode", 0, 0)}
                        >
                            <span className="led-pin-label anode-plus" style={{ color: ledShades.base }}>+</span>
                        </span>
                        <span 
                            className={`terminal-pin pin-cathode ${hoveredTerminal === "cathode" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("cathode")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "cathode", 16, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 0); }}
                            onClick={(e) => handleTerminalPress(e, "cathode", 16, 0)}
                        >
                            <span className="led-pin-label cathode-minus">−</span>
                        </span>
                    </div>
                );
            })()}

            {/* CERAMIC CAPACITOR: 16px span. Pins at (0, 0) and (16, 0) */}
            {type === "capacitor-ceramic" && (() => {
                const isCharged = Boolean(isSimulating && (simState?.isPowered || simState?.isDischarging));
                return (
                    <div className={`capacitor-container ${isCharged ? "is-charged" : ""}`}>
                        {/* Metallic Wire Leads extending from Disc base to Pins (0, 0) and (16, 0) */}
                        <svg className="cap-leads-svg" viewBox="-4 -30 24 32" width="24" height="32" style={{ position: "absolute", top: -30, left: -4, pointerEvents: "none" }}>
                            <line x1="0" y1="0" x2="4" y2="-12" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                            <line x1="16" y1="0" x2="12" y2="-12" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>
                        <div className={`ceramic-disc ${isCharged ? "active-dielectric" : ""}`}>
                            <span>104</span>
                            {isCharged && <div className="cap-charge-glow"></div>}
                        </div>
                        <span 
                            className={`terminal-pin pin-1 ${hoveredTerminal === "cap1" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0 }}
                            onMouseEnter={() => setHoveredTerminal("cap1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "cap1", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                            onClick={(e) => handleTerminalPress(e, "cap1", 0, 0)}
                        />
                        {hoveredTerminal === "cap1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}
                        <span 
                            className={`terminal-pin pin-2 ${hoveredTerminal === "cap2" ? "targeted" : ""}`}
                            style={{ left: 16, top: 0 }}
                            onMouseEnter={() => setHoveredTerminal("cap2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "cap2", 16, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 0); }}
                            onClick={(e) => handleTerminalPress(e, "cap2", 16, 0)}
                        />
                        {hoveredTerminal === "cap2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* TACTILE PUSHBUTTON: 32px x 32px span. 4 Pins */}
            {type === "button" && (
                <div className={`button-tactile-container ${isPressed ? "is-pressed" : ""}`}>
                    <div className="tactile-case-body">
                        <div 
                            className="tactile-round-actuator"
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                if (isWireMode) return;
                                onUpdate && onUpdate({ isPressed: true });
                                const handleUp = () => {
                                    window.removeEventListener("mouseup", handleUp);
                                    onUpdate && onUpdate({ isPressed: false });
                                };
                                window.addEventListener("mouseup", handleUp);
                            }}
                        >
                            <div className="actuator-inner-cap"></div>
                        </div>
                    </div>
                    <span 
                        className={`terminal-pin pin-tl ${hoveredTerminal === "btn1" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("btn1")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn1", 0, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                        onClick={(e) => handleTerminalPress(e, "btn1", 0, 0)}
                    />
                    {hoveredTerminal === "btn1" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Terminal 1a
                        </div>
                    )}
                    <span 
                        className={`terminal-pin pin-tr ${hoveredTerminal === "btn2" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("btn2")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn2", 32, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 0)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 0); }}
                        onClick={(e) => handleTerminalPress(e, "btn2", 32, 0)}
                    />
                    {hoveredTerminal === "btn2" && (
                        <div className="terminal-hover-tooltip" style={{ left: 32, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Terminal 1b
                        </div>
                    )}
                    <span 
                        className={`terminal-pin pin-bl ${hoveredTerminal === "btn3" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("btn3")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn3", 0, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 32); }}
                        onClick={(e) => handleTerminalPress(e, "btn3", 0, 32)}
                    />
                    {hoveredTerminal === "btn3" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Terminal 2a
                        </div>
                    )}
                    <span 
                        className={`terminal-pin pin-br ${hoveredTerminal === "btn4" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("btn4")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn4", 32, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 32); }}
                        onClick={(e) => handleTerminalPress(e, "btn4", 32, 32)}
                    />
                    {hoveredTerminal === "btn4" && (
                        <div className="terminal-hover-tooltip" style={{ left: 32, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Terminal 2b
                        </div>
                    )}
                </div>
            )}

            {/* POTENTIOMETER: 32px span. 3 Terminals (0, 16px, 32px at Y=48) */}
            {type === "potentiometer" && (() => {
                const curWiper = wiperValue != null ? wiperValue : 0.5;
                const curAngle = -135 + curWiper * 270;
                const totalR = resistance || 10000;
                const currentOhms = Math.round(curWiper * totalR);
                const displayVal = currentOhms >= 1000 ? `${(currentOhms / 1000).toFixed(1)}kΩ` : `${currentOhms}Ω`;

                const handleDialMouseDown = (e) => {
                    e.stopPropagation();
                    if (isWireMode) return;
                    const dialElem = e.currentTarget;
                    const rect = dialElem.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;

                    const handleMove = (moveEvt) => {
                        const dx = moveEvt.clientX - centerX;
                        const dy = moveEvt.clientY - centerY;
                        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);
                        // Normalize 0 at bottom/top
                        let normalizedWiper = (angleDeg + 135) / 270;
                        if (normalizedWiper < 0) normalizedWiper = 0;
                        if (normalizedWiper > 1) normalizedWiper = 1;
                        onUpdate && onUpdate({ wiperValue: Math.round(normalizedWiper * 100) / 100 });
                    };

                    const handleUp = () => {
                        window.removeEventListener("mousemove", handleMove);
                        window.removeEventListener("mouseup", handleUp);
                    };

                    window.addEventListener("mousemove", handleMove);
                    window.addEventListener("mouseup", handleUp);
                };

                return (
                    <div className="pot-container">
                        {/* Prominent Floating Resistance Value Badge Above Potentiometer */}
                        <div className="pot-floating-value-badge">
                            {displayVal}
                        </div>

                        <div className="pot-round-case">
                            {/* Realistic Turning Knob with Notched Pointer Knot */}
                            <div 
                                className="pot-rotary-knob"
                                style={{ transform: `rotate(${curAngle}deg)` }}
                                onMouseDown={handleDialMouseDown}
                                title="Click and drag around knob to rotate resistance"
                            >
                                <div className="pot-knob-ridge-ring"></div>
                                <div className="pot-pointer-knot"></div>
                                <div className="pot-knob-cap"></div>
                            </div>
                        </div>
                        <div className="pot-lead-stems">
                            <div className="stem stem-1"></div>
                            <div className="stem stem-wiper"></div>
                            <div className="stem stem-2"></div>
                        </div>
                        <span 
                            className={`terminal-pin pin-t1 ${hoveredTerminal === "pot1" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("pot1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "pot1", 0, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 48); }}
                            onClick={(e) => handleTerminalPress(e, "pot1", 0, 48)}
                        />
                        {hoveredTerminal === "pot1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 48, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}
                        <span 
                            className={`terminal-pin pin-wiper ${hoveredTerminal === "potW" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("potW")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "potW", 16, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 48); }}
                            onClick={(e) => handleTerminalPress(e, "potW", 16, 48)}
                        />
                        {hoveredTerminal === "potW" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 48, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Wiper
                            </div>
                        )}
                        <span 
                            className={`terminal-pin pin-t2 ${hoveredTerminal === "pot2" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("pot2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "pot2", 32, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 48); }}
                            onClick={(e) => handleTerminalPress(e, "pot2", 32, 48)}
                        />
                        {hoveredTerminal === "pot2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 32, top: 48, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* SLIDE SWITCH (SPDT: 3 Terminals: 0, 16px, 32px at Y=16) */}
            {(type === "slide-switch" || type === "switch-spdt") && (() => {
                const isRight = switchState === "right";
                const handleToggle = (e) => {
                    e.stopPropagation();
                    if (isWireMode) return;
                    onUpdate && onUpdate({ switchState: isRight ? "left" : "right" });
                };

                return (
                    <div className={`switch-spdt-container ${isRight ? "pos-right" : "pos-left"}`}>
                        <div className="switch-metal-plate">
                            <div className="switch-slot-track">
                                <div 
                                    className="switch-knob-handle"
                                    onClick={handleToggle}
                                >
                                    <div className="handle-ridges"></div>
                                </div>
                            </div>
                        </div>
                        <div className="switch-lead-stems">
                            <div className="stem stem-1"></div>
                            <div className="stem stem-com"></div>
                            <div className="stem stem-2"></div>
                        </div>
                        <span 
                            className={`terminal-pin pin-sw1 ${hoveredTerminal === "sw1" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("sw1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw1", 0, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 16); }}
                            onClick={(e) => handleTerminalPress(e, "sw1", 0, 16)}
                        />
                        {hoveredTerminal === "sw1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}
                        <span 
                            className={`terminal-pin pin-swcom ${hoveredTerminal === "swcom" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("swcom")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "swcom", 16, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 16); }}
                            onClick={(e) => handleTerminalPress(e, "swcom", 16, 16)}
                        />
                        {hoveredTerminal === "swcom" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Common
                            </div>
                        )}
                        <span 
                            className={`terminal-pin pin-sw2 ${hoveredTerminal === "sw2" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("sw2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw2", 32, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 16); }}
                            onClick={(e) => handleTerminalPress(e, "sw2", 32, 16)}
                        />
                        {hoveredTerminal === "sw2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 32, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* REALISTIC MINIMAL BATTERY WITH DIGITAL VOLTAGE DISPLAY & DISCHARGING ANIMATION */}
            {type === "battery-9v" && (
                <div className={`battery-tinkercad-real ${simState?.isDischarging ? "active-discharging" : ""} ${simState?.isShortCircuit ? "short-circuited" : ""}`}>
                    {/* 1. TOP BRACKET WITH PROTRUDING METALLIC TERMINALS & SHARP NEEDLE PINS */}
                    <div className="battery-top-bracket">
                        {/* Negative Terminal Post (GND) */}
                        <div 
                            className={`battery-sharp-terminal term-neg ${hoveredTerminal === "neg" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("neg")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "batNeg", 24, -14)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 24, -14)}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleTerminalAction(e, 24, -14);
                            }}
                            onClick={(e) => handleTerminalPress(e, "batNeg", 24, -14)}
                        >
                            <div className="terminal-post-pillar"></div>
                            <div className="terminal-collar neg-collar"></div>
                            <div className="terminal-needle-pin">
                                <span className="needle-tip-dot"></span>
                            </div>

                            {/* Clean Minimal Badge */}
                            {hoveredTerminal === "neg" && (
                                <div className="terminal-hover-tooltip" style={{ left: 24, top: -14, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                    Negative (−)
                                </div>
                            )}
                        </div>

                        {/* Positive Terminal Post (Voltage) */}
                        <div 
                            className={`battery-sharp-terminal term-pos ${hoveredTerminal === "pos" ? "targeted" : ""}`}
                            onMouseEnter={() => setHoveredTerminal("pos")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "batPos", 72, -14)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 72, -14)}
                            onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleTerminalAction(e, 72, -14);
                            }}
                            onClick={(e) => handleTerminalPress(e, "batPos", 72, -14)}
                        >
                            <div className="terminal-post-pillar"></div>
                            <div className="terminal-collar pos-collar"></div>
                            <div className="terminal-needle-pin">
                                <span className="needle-tip-dot"></span>
                            </div>

                            {/* Clean Minimal Badge */}
                            {hoveredTerminal === "pos" && (
                                <div className="terminal-hover-tooltip" style={{ left: 72, top: -14, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                    Positive (+)
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. COPPER/CARAMEL SHOULDER BAND WITH CIRCULAR STAMPED POLARITIES */}
                    <div className="battery-copper-band">
                        <div className="polarity-circle neg-circ">
                            <span>−</span>
                        </div>
                        <div className="polarity-circle pos-circ">
                            <span>+</span>
                        </div>
                    </div>

                    {/* 3. MINIMAL MATTE DARK BODY WITH REALISTIC DIGITAL LCD DISPLAY & DISCHARGE STATUS */}
                    <div className="battery-minimal-body">
                        <div className="battery-digital-display">
                            <div className={`display-bezel ${simState?.isDischarging ? "bezel-discharging" : ""}`}>
                                <div className={`lcd-screen ${simState?.isDischarging ? "screen-discharging" : ""}`}>
                                    <div className="lcd-header-row">
                                        <span className="lcd-text">{voltageDisplay}</span>
                                        {simState?.isDischarging && (
                                            <span className="lcd-drain-bolt" title="Discharging circuit active">⚡</span>
                                        )}
                                    </div>
                                    {simState?.isDischarging && (
                                        <div className="battery-drain-track">
                                            <div className="battery-drain-pulse"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`display-subtext ${simState?.isShortCircuit ? "subtext-short" : (simState?.isDischarging ? "subtext-discharging" : "")}`}>
                                {simState?.isShortCircuit 
                                    ? "⚠️ SHORT CIRCUIT" 
                                    : simState?.isDischarging 
                                        ? `DRAIN • ${simState.currentMa}mA` 
                                        : "DC VOLTAGE"}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BUZZER: 16px span. Pins at (0, 32) and (16, 32) */}
            {type === "buzzer" && (
                <div className={`buzzer-container ${simState?.isBeeping ? "is-beeping" : ""}`}>
                    <div className="buzzer-cylinder">
                        <div className="buzzer-sound-hole"></div>
                        <span className="plus-mark">+</span>
                        {simState?.isBeeping && (
                            <div className="buzzer-soundwaves-radiator">
                                <div className="sonic-ring ring-1"></div>
                                <div className="sonic-ring ring-2"></div>
                                <div className="sonic-ring ring-3"></div>
                                <div className="sonic-arc-left"></div>
                                <div className="sonic-arc-right"></div>
                            </div>
                        )}
                    </div>
                    <span 
                        className={`terminal-pin pin-pos ${hoveredTerminal === "buzzerPos" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("buzzerPos")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "buzPos", 0, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 32); }}
                        onClick={(e) => handleTerminalPress(e, "buzPos", 0, 32)}
                    />
                    {hoveredTerminal === "buzzerPos" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Positive (+)
                        </div>
                    )}
                    <span 
                        className={`terminal-pin pin-neg ${hoveredTerminal === "buzzerNeg" ? "targeted" : ""}`}
                        onMouseEnter={() => setHoveredTerminal("buzzerNeg")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "buzNeg", 16, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 32); }}
                        onClick={(e) => handleTerminalPress(e, "buzNeg", 16, 32)}
                    />
                    {hoveredTerminal === "buzzerNeg" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Negative (−)
                        </div>
                    )}
                </div>
            )}

            {/* AA & AAA BATTERY PACK (WITH 1, 2, 4 CELL OPTIONS, COVER SWITCH & BLAST EFFECT) */}
            {(type === "battery-aa" || type === "battery-aaa") && (() => {
                const cellCount = cells || (voltage === 1.5 ? 1 : voltage === 6 ? 4 : voltage === 4.5 ? 3 : 2);
                const isAAA = type === "battery-aaa";
                const cellWidth = isAAA ? 24 : 32;
                const totalWidth = cellCount === 1 ? 56 : cellCount === 4 ? 144 : cellCount === 3 ? 112 : 84;
                const posLeadX = totalWidth - 18;
                const negLeadX = 18;
                const hasSwitch = switchState !== undefined ? Boolean(switchState) : (isOn !== undefined ? Boolean(isOn) : true);
                const caseColor = color || "#18181b";

                return (
                    <div 
                        className={`aa-battery-case ${simState?.isDischarging ? "active-discharging" : ""} ${simState?.isShortCircuit ? "short-circuited" : ""}`} 
                        style={{ width: totalWidth, "--case-bg": caseColor }}
                    >
                        {/* Terminal Lead Wires */}
                        <div className="battery-leads-header">
                            {/* Negative Lead (Black) */}
                            <div 
                                className={`aa-term-pin term-neg ${hoveredTerminal === "aaNeg" ? "targeted" : ""}`}
                                style={{ left: negLeadX }}
                                onMouseEnter={() => setHoveredTerminal("aaNeg")}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, "aaNeg", negLeadX, -14)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, negLeadX, -14)}
                                onClick={(e) => handleTerminalPress(e, "aaNeg", negLeadX, -14)}
                                onDoubleClick={(e) => handleTerminalAction(e, negLeadX, -14)}
                            >
                                <div className="lead-wire lead-neg"></div>
                                <span className="needle-tip-dot"></span>
                                {hoveredTerminal === "aaNeg" && (
                                    <div className="terminal-hover-tooltip" style={{ left: negLeadX, top: -14, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        GND (−)
                                    </div>
                                )}
                            </div>

                            {/* Positive Lead (Red) */}
                            <div 
                                className={`aa-term-pin term-pos ${hoveredTerminal === "aaPos" ? "targeted" : ""}`}
                                style={{ left: posLeadX }}
                                onMouseEnter={() => setHoveredTerminal("aaPos")}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, "aaPos", posLeadX, -14)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, posLeadX, -14)}
                                onClick={(e) => handleTerminalPress(e, "aaPos", posLeadX, -14)}
                                onDoubleClick={(e) => handleTerminalAction(e, posLeadX, -14)}
                            >
                                <div className="lead-wire lead-pos"></div>
                                <span className="needle-tip-dot"></span>
                                {hoveredTerminal === "aaPos" && (
                                    <div className="terminal-hover-tooltip" style={{ left: posLeadX, top: -14, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        {hasSwitch ? `${(cellCount * 1.5).toFixed(1)}V (+)` : "0V (Switch OFF)"}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Case Lid with Interactive Attached Switch */}
                        <div className="battery-case-lid">
                            <div 
                                className={`lid-switch-track ${hasSwitch ? "switch-on" : "switch-off"}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextState = !hasSwitch;
                                    onUpdate && onUpdate({ switchState: nextState, isOn: nextState });
                                }}
                                title="Click to toggle Battery Case switch ON / OFF"
                            >
                                <div className="lid-switch-thumb"></div>
                                <span className="lid-switch-label">{hasSwitch ? "ON" : "OFF"}</span>
                            </div>
                            <span className={`battery-power-led ${hasSwitch && simState?.isDischarging ? "glowing" : ""}`} title={hasSwitch ? "Power Active" : "Power Off"}></span>
                        </div>

                        {/* Molded ABS Enclosure with Cells */}
                        <div className="aa-molded-holder">
                            <div className="holder-rim">
                                {[...Array(cellCount)].map((_, idx) => (
                                    <div key={`cell-${idx}`} className={`battery-cylindrical-cell ${isAAA ? "is-aaa" : "is-aa"}`} style={{ width: cellWidth }}>
                                        <div className="cell-nipple-top"></div>
                                        <div className="cell-copper-shoulder">
                                            <span className="cell-plus">+</span>
                                        </div>
                                        <div className="cell-matte-body">
                                            <span className="cell-label-text">{isAAA ? "AAA" : "AA"}</span>
                                            <span className="cell-volt-text">1.5V</span>
                                            <span className="cell-brand-x">X</span>
                                        </div>
                                        <div className="cell-spring-contact">
                                            <span className="spring-coil"></span>
                                            <span className="cell-minus">−</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="holder-spec-tag">
                                {cellCount}× {isAAA ? "AAA" : "AA"} • {(cellCount * 1.5).toFixed(1)}V DC
                            </div>
                        </div>

                        {/* Realistic Explosion / Blast Animation when Short-Circuited */}
                        {(simState?.isShortCircuit || simState?.isOverloaded) && (
                            <div className="battery-blast-fireball-wrap">
                                <div className="blast-core-flash"></div>
                                <div className="blast-smoke smoke-1"></div>
                                <div className="blast-smoke smoke-2"></div>
                                <div className="blast-smoke smoke-3"></div>
                                <div className="blast-spark-shower">
                                    <span className="spark sp-1"></span>
                                    <span className="spark sp-2"></span>
                                    <span className="spark sp-3"></span>
                                    <span className="spark sp-4"></span>
                                </div>
                                <div className="scorch-overlay-mark"></div>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* REALISTIC 16x2 & 20x4 CHARACTER LCD (HD44780 / I2C DISPLAY) */}
            {(type === "lcd-1602" || type === "lcd-2004") && (() => {
                const is2004 = type === "lcd-2004";
                const isPowered = Boolean(isSimulating || simState?.isPowered);
                const bgColor = backlightColor || "#0284c7";
                const txtColor = lcdTextColor || "#ffffff";

                return (
                    <div 
                        className={`lcd-module-container ${is2004 ? "is-2004" : "is-1602"} ${isPowered ? "powered-on" : ""}`}
                        style={{
                            "--lcd-backlight": bgColor,
                            "--lcd-text-color": txtColor,
                            width: is2004 ? 240 : 196
                        }}
                    >
                        {/* 4-Pin I2C Header at Top (GND, VCC, SDA, SCL) */}
                        <div className="lcd-i2c-header">
                            {[
                                { name: "GND", x: 16, isGnd: true },
                                { name: "VCC", x: 32, is5V: true },
                                { name: "SDA", x: 48, isGpio: true },
                                { name: "SCL", x: 64, isGpio: true }
                            ].map((pin) => (
                                <div
                                    key={pin.name}
                                    className={`lcd-pin-socket ${hoveredTerminal === `lcd_${pin.name}` ? "targeted" : ""}`}
                                    style={{ left: pin.x }}
                                    onMouseEnter={() => setHoveredTerminal(`lcd_${pin.name}`)}
                                    onMouseLeave={() => setHoveredTerminal(null)}
                                    onMouseDown={(e) => handleTerminalMouseDown(e, `lcd_${pin.name}`, pin.x, -10)}
                                    onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, -10)}
                                    onClick={(e) => handleTerminalPress(e, `lcd_${pin.name}`, pin.x, -10)}
                                    onDoubleClick={(e) => handleTerminalAction(e, pin.x, -10)}
                                >
                                    <div className="socket-inner-metal"></div>
                                    <span className="lcd-pin-label">{pin.name}</span>
                                    {hoveredTerminal === `lcd_${pin.name}` && (
                                        <div className="terminal-hover-tooltip" style={{ left: pin.x, top: -10, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                            {pin.name} (I2C)
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Dark Blue PCB with Gold Mounting Holes */}
                        <div className="lcd-pcb-surface">
                            <div className="lcd-mount-hole hole-tl"></div>
                            <div className="lcd-mount-hole hole-tr"></div>
                            <div className="lcd-mount-hole hole-bl"></div>
                            <div className="lcd-mount-hole hole-br"></div>

                            {/* Metallic Screen Bezel */}
                            <div className="lcd-bezel-frame">
                                {/* Dot-Matrix LCD Screen Area */}
                                <div className={`lcd-matrix-screen ${isPowered ? "backlight-active" : ""}`}>
                                    <div className="lcd-text-row row-1">
                                        <span className="lcd-dot-text">{isPowered ? (is2004 ? "TwinLab X 2004 LCD" : "TwinLab X 1602") : ""}</span>
                                    </div>
                                    <div className="lcd-text-row row-2">
                                        <span className="lcd-dot-text">
                                            {isPowered ? "Simulation Online" : ""}
                                            {isPowered && <span className="lcd-cursor-prompt"></span>}
                                        </span>
                                    </div>
                                    {is2004 && (
                                        <>
                                            <div className="lcd-text-row row-3">
                                                <span className="lcd-dot-text">{isPowered ? "Supply: 5.0V DC" : ""}</span>
                                            </div>
                                            <div className="lcd-text-row row-4">
                                                <span className="lcd-dot-text">{isPowered ? "I2C Bus: 0x27 OK" : ""}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <span className="lcd-brand-stamp">{is2004 ? "2004A HD44780" : "1602A HD44780"}</span>
                        </div>
                    </div>
                );
            })()}

            {/* SPST TOGGLE SWITCH */}
            {type === "switch-spst" && (() => {
                const switchActive = Boolean(isOn != null ? isOn : switchState === "closed");
                return (
                    <div 
                        className={`spst-toggle-container ${switchActive ? "switch-closed" : "switch-open"}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate && onUpdate({ isOn: !switchActive, switchState: switchActive ? "open" : "closed" });
                        }}
                        title={`SPST Switch: ${switchActive ? "ON (Closed)" : "OFF (Open)"} - Click to Toggle`}
                    >
                        <div className="switch-metal-plate">
                            <span className="switch-legend-off">0</span>
                            <div className={`switch-rocker-lever ${switchActive ? "lever-on" : "lever-off"}`}>
                                <div className="lever-bat-knob"></div>
                            </div>
                            <span className="switch-legend-on">I</span>
                        </div>

                        {/* Terminal 1 (0, 16) */}
                        <span 
                            className={`terminal-pin pin-sw-1 ${hoveredTerminal === "sw1" ? "targeted" : ""}`}
                            style={{ left: 0, top: 16 }}
                            onMouseEnter={() => setHoveredTerminal("sw1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw1", 0, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                            onClick={(e) => handleTerminalPress(e, "sw1", 0, 16)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 16)}
                        />
                        {hoveredTerminal === "sw1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}

                        {/* Terminal 2 (32, 16) */}
                        <span 
                            className={`terminal-pin pin-sw-2 ${hoveredTerminal === "sw2" ? "targeted" : ""}`}
                            style={{ left: 32, top: 16 }}
                            onMouseEnter={() => setHoveredTerminal("sw2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw2", 32, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 16)}
                            onClick={(e) => handleTerminalPress(e, "sw2", 32, 16)}
                            onDoubleClick={(e) => handleTerminalAction(e, 32, 16)}
                        />
                        {hoveredTerminal === "sw2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 32, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* PHOTORESISTOR (LDR): Terminals at (0, 16) and (32, 16) with interactive lux light slider */}
            {type === "photoresistor" && (() => {
                const currentLux = lux != null ? lux : 50;
                // Dark: ~1MΩ, Bright: ~100Ω
                const calculatedR = Math.round(1000000 * Math.pow(10, -(currentLux / 25)));
                const isConducting = Boolean(isSimulating && (simState?.isPowered || simState?.isDischarging));

                return (
                    <div className={`photoresistor-container ${isConducting ? "is-sensing" : ""}`} title={`Photoresistor (LDR): ${currentLux}% Lux (~${calculatedR > 1000 ? (calculatedR/1000).toFixed(1) + 'k' : calculatedR}Ω)`}>
                        {/* Realistic Silver Wire Leads linking Pin 1 (0, 16) and Pin 2 (32, 16) to LDR Disc */}
                        <svg className="ldr-leads-svg" viewBox="-4 0 40 18" width="40" height="18" style={{ position: "absolute", top: 0, left: -4, pointerEvents: "none" }}>
                            <line x1="4" y1="16" x2="10" y2="2" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                            <line x1="36" y1="16" x2="30" y2="2" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>

                        <div className={`ldr-ceramic-disc ${isConducting ? "active-photo-cell" : ""}`}>
                            <div className="ldr-cadmium-track">
                                <svg className="ldr-wave-svg" viewBox="0 0 24 24">
                                    <path d="M 4,6 Q 8,3 12,6 T 20,6 M 4,12 Q 8,9 12,12 T 20,12 M 4,18 Q 8,15 12,18 T 20,18" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="ldr-brand-pill">X</span>
                            {isConducting && <div className="ldr-sens-halo"></div>}
                        </div>

                        {/* Interactive Lux Light Level Slider (Isolated from component drag) */}
                        <div 
                            className="ldr-lux-control" 
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                        >
                            <span className="ldr-sun-icon">☀️</span>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={currentLux}
                                onMouseDown={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                    const nextLux = Number(e.target.value);
                                    const newR = Math.round(1000000 * Math.pow(10, -(nextLux / 25)));
                                    onUpdate && onUpdate({ lux: nextLux, resistance: Math.max(100, newR) });
                                }}
                                className="ldr-slider"
                            />
                        </div>

                        {/* Terminal 1 (0, 16) */}
                        <span 
                            className={`terminal-pin pin-ldr-1 ${hoveredTerminal === "ldr1" ? "targeted" : ""}`}
                            style={{ left: 0, top: 16 }}
                            onMouseEnter={() => setHoveredTerminal("ldr1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "ldr1", 0, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                            onClick={(e) => handleTerminalPress(e, "ldr1", 0, 16)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 16)}
                        />
                        {hoveredTerminal === "ldr1" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 1
                            </div>
                        )}

                        {/* Terminal 2 (32, 16) */}
                        <span 
                            className={`terminal-pin pin-ldr-2 ${hoveredTerminal === "ldr2" ? "targeted" : ""}`}
                            style={{ left: 32, top: 16 }}
                            onMouseEnter={() => setHoveredTerminal("ldr2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "ldr2", 32, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 16)}
                            onClick={(e) => handleTerminalPress(e, "ldr2", 32, 16)}
                            onDoubleClick={(e) => handleTerminalAction(e, 32, 16)}
                        />
                        {hoveredTerminal === "ldr2" && (
                            <div className="terminal-hover-tooltip" style={{ left: 32, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Terminal 2
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* NPN & PNP BIPOLAR TRANSISTORS (TO-92 / 2N2222 / 2N3906 / MOSFET): Terminals (0, 16), (16, 16), (32, 16) */}
            {(type === "transistor" || type === "transistor-npn" || type === "transistor-pnp" || type === "mosfet-n") && (
                <div className="transistor-to92-container" title={`${type === "transistor-pnp" ? "PNP (2N3906)" : type === "mosfet-n" ? "N-MOSFET (IRF540N)" : "NPN (2N2222)"} Transistor`}>
                    {/* 3 Realistic Silver Wire Leads linking to Pins at (0, 16), (16, 16), (32, 16) */}
                    <svg className="trans-leads-svg" viewBox="-4 0 40 18" width="40" height="18" style={{ position: "absolute", top: 0, left: -4, pointerEvents: "none" }}>
                        <line x1="4" y1="16" x2="8" y2="4" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1="20" y1="16" x2="20" y2="4" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1="36" y1="16" x2="32" y2="4" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>

                    <div className="to92-body">
                        <div className="to92-flat-face">
                            <span className="transistor-part-text">{type === "transistor-pnp" ? "2N3906" : type === "mosfet-n" ? "IRF540" : "2N2222"}</span>
                            <span className="transistor-x-mark">X</span>
                        </div>
                        <div className="to92-curved-back"></div>
                    </div>

                    {/* Pin 1: Collector / Drain (0, 16) */}
                    <span 
                        className={`terminal-pin pin-trans-c ${hoveredTerminal === "trC" ? "targeted" : ""}`}
                        style={{ left: 0, top: 16 }}
                        onMouseEnter={() => setHoveredTerminal("trC")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trC", 0, 16)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                        onClick={(e) => handleTerminalPress(e, "trC", 0, 16)}
                        onDoubleClick={(e) => handleTerminalAction(e, 0, 16)}
                    />
                    {hoveredTerminal === "trC" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            {type === "mosfet-n" ? "Drain (D)" : "Collector (C)"}
                        </div>
                    )}

                    {/* Pin 2: Base / Gate (16, 16) */}
                    <span 
                        className={`terminal-pin pin-trans-b ${hoveredTerminal === "trB" ? "targeted" : ""}`}
                        style={{ left: 16, top: 16 }}
                        onMouseEnter={() => setHoveredTerminal("trB")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trB", 16, 16)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 16)}
                        onClick={(e) => handleTerminalPress(e, "trB", 16, 16)}
                        onDoubleClick={(e) => handleTerminalAction(e, 16, 16)}
                    />
                    {hoveredTerminal === "trB" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            {type === "mosfet-n" ? "Gate (G)" : "Base (B)"}
                        </div>
                    )}

                    {/* Pin 3: Emitter / Source (32, 16) */}
                    <span 
                        className={`terminal-pin pin-trans-e ${hoveredTerminal === "trE" ? "targeted" : ""}`}
                        style={{ left: 32, top: 16 }}
                        onMouseEnter={() => setHoveredTerminal("trE")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trE", 32, 16)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 16)}
                        onClick={(e) => handleTerminalPress(e, "trE", 32, 16)}
                        onDoubleClick={(e) => handleTerminalAction(e, 32, 16)}
                    />
                    {hoveredTerminal === "trE" && (
                        <div className="terminal-hover-tooltip" style={{ left: 32, top: 16, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            {type === "mosfet-n" ? "Source (S)" : "Emitter (E)"}
                        </div>
                    )}
                </div>
            )}

            {/* COIN CELL BATTERY (CR2032 3V): Terminals Negative (16, 32), Positive (48, 32) */}
            {type === "battery-coin" && (
                <div className="coin-cell-container" title="CR2032 3V Coin Battery">
                    <div className="coin-metal-disc">
                        <span className="coin-plus-sign">+</span>
                        <span className="coin-model-label">CR2032</span>
                        <span className="coin-volt-label">3V DC • TWINLAB X</span>
                    </div>

                    {/* Negative Pin (16, 32) */}
                    <span 
                        className={`terminal-pin pin-coin-neg ${hoveredTerminal === "coinNeg" ? "targeted" : ""}`}
                        style={{ left: 16, top: 32 }}
                        onMouseEnter={() => setHoveredTerminal("coinNeg")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "coinNeg", 16, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 32)}
                        onClick={(e) => handleTerminalPress(e, "coinNeg", 16, 32)}
                        onDoubleClick={(e) => handleTerminalAction(e, 16, 32)}
                    />
                    {hoveredTerminal === "coinNeg" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Negative (−)
                        </div>
                    )}

                    {/* Positive Pin (48, 32) */}
                    <span 
                        className={`terminal-pin pin-coin-pos ${hoveredTerminal === "coinPos" ? "targeted" : ""}`}
                        style={{ left: 48, top: 32 }}
                        onMouseEnter={() => setHoveredTerminal("coinPos")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "coinPos", 48, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 48, 32)}
                        onClick={(e) => handleTerminalPress(e, "coinPos", 48, 32)}
                        onDoubleClick={(e) => handleTerminalAction(e, 48, 32)}
                    />
                    {hoveredTerminal === "coinPos" && (
                        <div className="terminal-hover-tooltip" style={{ left: 48, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Positive (+) 3V
                        </div>
                    )}
                </div>
            )}

            {/* ELECTROLYTIC CAPACITOR: Anode (0, 0), Cathode (16, 0) */}
            {type === "capacitor-electrolytic" && (() => {
                const isCharged = Boolean(isSimulating && (simState?.isPowered || simState?.isDischarging));
                return (
                    <div className={`elec-cap-container ${isCharged ? "is-charged" : ""}`} title="Electrolytic Capacitor (10µF 50V)">
                        {/* Realistic Silver Wire Leads linking Pin 1 (0,0) and Pin 2 (16,0) to Can Body */}
                        <svg className="elec-leads-svg" viewBox="-4 -16 24 18" width="24" height="18" style={{ position: "absolute", top: -16, left: -4, pointerEvents: "none" }}>
                            <line x1="4" y1="16" x2="6" y2="4" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                            <line x1="20" y1="16" x2="18" y2="4" stroke="#cbd5e1" strokeWidth="2.2" strokeLinecap="round" />
                        </svg>

                        <div className={`elec-can-body ${isCharged ? "active-dielectric" : ""}`}>
                            <div className="elec-vent-top">
                                <div className="vent-cross-line"></div>
                            </div>
                            <div className="elec-negative-stripe">
                                <span>-</span><span>-</span>
                            </div>
                            <span className="elec-value-stamp">{capacitance || "10µF"}</span>
                            {isCharged && <div className="elec-charge-pulse"></div>}
                        </div>

                        {/* Anode Pin (0, 0) */}
                        <span 
                            className={`terminal-pin pin-elec-anode ${hoveredTerminal === "elAnode" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0 }}
                            onMouseEnter={() => setHoveredTerminal("elAnode")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "elAnode", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onClick={(e) => handleTerminalPress(e, "elAnode", 0, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                        />
                        {hoveredTerminal === "elAnode" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Anode (+)
                            </div>
                        )}

                        {/* Cathode Pin (16, 0) */}
                        <span 
                            className={`terminal-pin pin-elec-cathode ${hoveredTerminal === "elCathode" ? "targeted" : ""}`}
                            style={{ left: 16, top: 0 }}
                            onMouseEnter={() => setHoveredTerminal("elCathode")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "elCathode", 16, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                            onClick={(e) => handleTerminalPress(e, "elCathode", 16, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 16, 0)}
                        />
                        {hoveredTerminal === "elCathode" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Cathode (−)
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* DC MOTOR (LARGE REALISTIC BRUSHED STEEL CAN & ROTATING PROPELLER): Terminals Pos (0, 48), Neg (48, 48) */}
            {type === "motor-dc" && (() => {
                const isSpinning = Boolean(isSimulating && (simState?.isSpinning || (simState?.voltage && simState.voltage > 1.2)));
                return (
                    <div className={`dc-motor-container ${isSpinning ? "is-spinning" : ""}`} title="DC Hobby Motor with Aerodynamic Propeller Fan (3-12V)">
                        <svg className="dc-motor-svg" viewBox="-24 -18 96 90" width="96" height="90" style={{ position: "absolute", left: -24, top: -18, pointerEvents: "none" }}>
                            <defs>
                                <radialGradient id={`motor-can-grad-${id}`} cx="38%" cy="32%" r="68%">
                                    <stop offset="0%" stopColor="#f1f5f9" />
                                    <stop offset="35%" stopColor="#cbd5e1" />
                                    <stop offset="70%" stopColor="#64748b" />
                                    <stop offset="100%" stopColor="#334155" />
                                </radialGradient>
                                <linearGradient id={`motor-tab-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="50%" stopColor="#d97706" />
                                    <stop offset="100%" stopColor="#78350f" />
                                </linearGradient>
                            </defs>

                            {/* Two Curved Copper Solder Lugs branching to (0, 48) and (48, 48) */}
                            {/* Pos (+) Lug */}
                            <path d="M 12 36 Q 4 40 0 46" stroke={`url(#motor-tab-grad-${id})`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                            <circle cx="0" cy="48" r="2.8" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                            <text x="0" y="42" fill="#ef4444" fontSize="4.2" fontWeight="900" textAnchor="middle">+</text>

                            {/* Neg (-) Lug */}
                            <path d="M 36 36 Q 44 40 48 46" stroke={`url(#motor-tab-grad-${id})`} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                            <circle cx="48" cy="48" r="2.8" fill="#ca8a04" stroke="#78350f" strokeWidth="0.8" />
                            <text x="48" y="42" fill="#3b82f6" fontSize="4.2" fontWeight="900" textAnchor="middle">−</text>

                            {/* Main Cylindrical Steel Can (72px Diameter) */}
                            <circle cx="24" cy="18" r="34" fill={`url(#motor-can-grad-${id})`} stroke="#475569" strokeWidth="2" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.6))" />
                            <circle cx="24" cy="18" r="31" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                            <circle cx="24" cy="18" r="26" fill="#1e293b" opacity="0.15" />

                            {/* Front Bearing Hub Boss */}
                            <circle cx="24" cy="18" r="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.2" />
                            <circle cx="24" cy="18" r="3.5" fill="#0f172a" />

                            {/* Silkscreen text on can */}
                            <text x="24" y="-3" fill="#ffffff" fontSize="4.8" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">DC MOTOR 3-6V</text>
                            <text x="24" y="40" fill="rgba(255,255,255,0.75)" fontSize="3.6" fontWeight="bold" textAnchor="middle">TWINLAB X</text>
                        </svg>

                        {/* High-Speed Spinning 3-Blade Aerofoil Propeller Fan */}
                        <div 
                            className={`motor-propeller-fan ${isSpinning ? "spin-blur" : ""}`}
                            style={{ position: "absolute", left: 0, top: -6, width: 48, height: 48 }}
                        >
                            <div className="fan-blade blade-1"></div>
                            <div className="fan-blade blade-2"></div>
                            <div className="fan-blade blade-3"></div>
                            <div className="fan-hub-cap"></div>
                        </div>

                        {/* Positive Terminal Pin (0, 48) */}
                        <span 
                            className={`terminal-pin pin-motor-pos ${hoveredTerminal === "motPos" ? "targeted" : ""}`}
                            style={{ left: 0, top: 48, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("motPos")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "motPos", 0, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 48)}
                            onClick={(e) => handleTerminalPress(e, "motPos", 0, 48)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 48)}
                        />
                        {hoveredTerminal === "motPos" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 48, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (+) [Red]
                            </div>
                        )}

                        {/* Negative Terminal Pin (48, 48) */}
                        <span 
                            className={`terminal-pin pin-motor-neg ${hoveredTerminal === "motNeg" ? "targeted" : ""}`}
                            style={{ left: 48, top: 48, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("motNeg")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "motNeg", 48, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 48, 48)}
                            onClick={(e) => handleTerminalPress(e, "motNeg", 48, 48)}
                            onDoubleClick={(e) => handleTerminalAction(e, 48, 48)}
                        />
                        {hoveredTerminal === "motNeg" && (
                            <div className="terminal-hover-tooltip" style={{ left: 48, top: 48, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (−) [Black]
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* SG90 MICRO SERVO (ENLARGED FULL-SCALE REALISTIC SVG WITH ROTATING HORN): Pins GND (0, 48), 5V (16, 48), PWM (32, 48) */}
            {type === "servo-sg90" && (() => {
                const hornAngle = angle != null ? angle : 90;
                return (
                    <div className="servo-sg90-container" title={`SG90 9g Micro Servo (${hornAngle}°)`}>
                        <svg className="servo-realistic-svg" viewBox="-30 -22 100 78" width="100" height="78" style={{ position: "absolute", left: -30, top: -22, pointerEvents: "none" }}>
                            {/* Translucent Sky Blue Case */}
                            <rect x="-16" y="-12" width="64" height="48" rx="4.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.55))" />
                            <rect x="-13" y="-9" width="58" height="2.5" fill="rgba(255,255,255,0.4)" rx="1.2" />

                            {/* Left & Right Mounting Ears with Brass Eyelets */}
                            <rect x="-28" y="4" width="12" height="16" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                            <circle cx="-22" cy="12" r="2.8" fill="#ca8a04" stroke="#713f12" strokeWidth="0.9" />
                            <rect x="48" y="4" width="12" height="16" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
                            <circle cx="54" cy="12" r="2.8" fill="#ca8a04" stroke="#713f12" strokeWidth="0.9" />

                            {/* Splined Drive Gear Output Shaft */}
                            <circle cx="16" cy="4" r="12" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.4" />

                            {/* Rotating White Nylon Servo Horn with 4 Holes & Center Screw */}
                            <g style={{ transform: `rotate(${hornAngle - 90}deg)`, transformOrigin: "16px 4px", transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.3, 1)" }}>
                                <rect x="-10" y="0.5" width="52" height="7" rx="3.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))" />
                                <circle cx="-4" cy="4" r="1.3" fill="#475569" />
                                <circle cx="3" cy="4" r="1.3" fill="#475569" />
                                <circle cx="29" cy="4" r="1.3" fill="#475569" />
                                <circle cx="36" cy="4" r="1.3" fill="#475569" />
                                {/* Center Mounting Screw */}
                                <circle cx="16" cy="4" r="3" fill="#0f172a" />
                                <line x1="14" y1="4" x2="18" y2="4" stroke="#e2e8f0" strokeWidth="0.8" />
                                <line x1="16" y1="2" x2="16" y2="6" stroke="#e2e8f0" strokeWidth="0.8" />
                            </g>

                            {/* Silkscreen Brand */}
                            <text x="16" y="20" fill="#ffffff" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">SG90 9g</text>
                            <text x="16" y="29" fill="#bae6fd" fontSize="4.2" fontWeight="700" textAnchor="middle">TWINLAB X</text>

                            {/* 3-Color Ribbon Cable ("branches") linking servo case to header pins */}
                            <path d="M 8 36 C 6 40, 2 43, 0 46" stroke="#78350f" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                            <line x1="16" y1="36" x2="16" y2="46" stroke="#dc2626" strokeWidth="3.2" strokeLinecap="round" />
                            <path d="M 24 36 C 26 40, 30 43, 32 46" stroke="#f97316" strokeWidth="3.2" strokeLinecap="round" fill="none" />

                            {/* Molded Black DuPont Connector Block at Y=42 to 46 */}
                            <rect x="-5" y="42" width="42" height="5" rx="1.5" fill="#18181b" stroke="#3f3f46" strokeWidth="0.8" />

                            {/* 3 Gold Header Pins at Y=48 */}
                            <rect x="-2" y="44" width="4" height="6" rx="0.8" fill="#ca8a04" stroke="#713f12" strokeWidth="0.6" />
                            <rect x="14" y="44" width="4" height="6" rx="0.8" fill="#ca8a04" stroke="#713f12" strokeWidth="0.6" />
                            <rect x="30" y="44" width="4" height="6" rx="0.8" fill="#ca8a04" stroke="#713f12" strokeWidth="0.6" />
                            <text x="0" y="41" fill="#cbd5e1" fontSize="3" fontWeight="bold" textAnchor="middle">GND</text>
                            <text x="16" y="41" fill="#cbd5e1" fontSize="3" fontWeight="bold" textAnchor="middle">5V</text>
                            <text x="32" y="41" fill="#cbd5e1" fontSize="3" fontWeight="bold" textAnchor="middle">PWM</text>
                        </svg>

                        {/* 3 Header Pins at Y=48 */}
                        {[
                            { name: "GND", x: 0, isGnd: true, color: "#78350f" },
                            { name: "5V", x: 16, is5V: true, color: "#dc2626" },
                            { name: "PWM", x: 32, isSignal: true, color: "#f97316" }
                        ].map((pin) => (
                            <span
                                key={pin.name}
                                className={`terminal-pin pin-servo-${pin.name.toLowerCase()} ${hoveredTerminal === `servo_${pin.name}` ? "targeted" : ""}`}
                                style={{ left: pin.x, top: 48, transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => setHoveredTerminal(`servo_${pin.name}`)}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, `servo_${pin.name}`, pin.x, 48)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 48)}
                                onClick={(e) => handleTerminalPress(e, `servo_${pin.name}`, pin.x, 48)}
                                onDoubleClick={(e) => handleTerminalAction(e, pin.x, 48)}
                            />
                        ))}
                    </div>
                );
            })()}

            {/* TINKERCAD DIP-14 LOGIC GATES (74HC08 AND, 74HC00 NAND, 74HC32 OR, 74HC04 NOT, 74HC02 NOR, 74HC86 XOR, 74HC132) */}
            {type?.startsWith("ic-74hc") && (() => {
                const icCode = type.replace("ic-", "").toUpperCase();
                const icTitles = {
                    "74HC08": "Quad 2-Input AND Gate",
                    "74HC00": "Quad 2-Input NAND Gate",
                    "74HC32": "Quad 2-Input OR Gate",
                    "74HC04": "Hex Inverter (NOT)",
                    "74HC02": "Quad 2-Input NOR Gate",
                    "74HC86": "Quad 2-Input XOR Gate",
                    "74HC132": "Quad 2-Input NAND Schmitt"
                };
                const partTitle = icTitles[icCode] || `${icCode} Logic Gate`;

                // 14 Pins strictly snapped across breadboard center trough (Row e at Y=0, Row f at Y=32):
                // Top row 14-8 at Y=0 (Plugs into breadboard Row e)
                // Bottom row 1-7 at Y=32 (Plugs into breadboard Row f)
                const topPins = [
                    { num: 14, name: "VCC", x: 0, is5V: true },
                    { num: 13, name: "4B", x: 16 },
                    { num: 12, name: "4A", x: 32 },
                    { num: 11, name: "4Y", x: 48, isOut: true },
                    { num: 10, name: "3B", x: 64 },
                    { num: 9, name: "3A", x: 80 },
                    { num: 8, name: "3Y", x: 96, isOut: true }
                ];
                const bottomPins = [
                    { num: 1, name: "1A", x: 0 },
                    { num: 2, name: "1B", x: 16 },
                    { num: 3, name: "1Y", x: 32, isOut: true },
                    { num: 4, name: "2A", x: 48 },
                    { num: 5, name: "2B", x: 64 },
                    { num: 6, name: "2Y", x: 80, isOut: true },
                    { num: 7, name: "GND", x: 96, isGnd: true }
                ];
                const isPowered = Boolean(isSimulating || simState?.isPowered);

                return (
                    <div className={`dip14-ic-container ${isPowered ? "is-powered" : ""}`} title={`${icCode} - ${partTitle}`}>
                        {/* Metallic Through-Hole DIP Lead Fingers Connecting to Row e (Y=0) and Row f (Y=32) */}
                        <svg className="dip-leads-svg" viewBox="-4 -2 108 36" width="108" height="36" style={{ position: "absolute", top: -2, left: -4, pointerEvents: "none" }}>
                            {[0, 16, 32, 48, 64, 80, 96].map(px => (
                                <g key={`lead-${px}`}>
                                    {/* Top Pin Lead Line from Body (Y=6) to Breadboard Row e (Y=0) */}
                                    <line x1={px + 4} y1="0" x2={px + 4} y2="8" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
                                    {/* Bottom Pin Lead Line from Body (Y=26) to Breadboard Row f (Y=32) */}
                                    <line x1={px + 4} y1="24" x2={px + 4} y2="32" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
                                </g>
                            ))}
                        </svg>

                        {/* Molded DIP-14 Plastic Epoxy Body Centered Over Breadboard Divider Trough (Y=16) */}
                        <div className={`dip14-chip-body ${isPowered ? "active-silicon" : ""}`}>
                            <div className="ic-notch-mark"></div>
                            <div className="ic-pin1-dot"></div>
                            <span className="ic-text-brand">TWINLAB X</span>
                            <span className="ic-text-code">{icCode}</span>
                            <span className="ic-text-title">{partTitle.split(" ")[0]}</span>
                            {isPowered && <div className="ic-power-led-dot"></div>}
                        </div>

                        {/* Top Pins (14 down to 8 at Y=0) */}
                        {topPins.map((p) => (
                            <span
                                key={`top-${p.num}`}
                                className={`terminal-pin pin-ic-top ${hoveredTerminal === `ic_${p.num}` ? "targeted" : ""}`}
                                style={{ left: p.x, top: 0, transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => setHoveredTerminal(`ic_${p.num}`)}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, `ic_${p.num}`, p.x, 0)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, p.x, 0)}
                                onClick={(e) => handleTerminalPress(e, `ic_${p.num}`, p.x, 0)}
                                onDoubleClick={(e) => handleTerminalAction(e, p.x, 0)}
                            >
                                {isPowered && p.isOut && <span className="ic-logic-status-dot"></span>}
                            </span>
                        ))}

                        {/* Bottom Pins (1 to 7 at Y=32) */}
                        {bottomPins.map((p) => (
                            <span
                                key={`bot-${p.num}`}
                                className={`terminal-pin pin-ic-bot ${hoveredTerminal === `ic_${p.num}` ? "targeted" : ""}`}
                                style={{ left: p.x, top: 32, transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => setHoveredTerminal(`ic_${p.num}`)}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, `ic_${p.num}`, p.x, 32)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, p.x, 32)}
                                onClick={(e) => handleTerminalPress(e, `ic_${p.num}`, p.x, 32)}
                                onDoubleClick={(e) => handleTerminalAction(e, p.x, 32)}
                            >
                                {isPowered && p.isOut && <span className="ic-logic-status-dot"></span>}
                            </span>
                        ))}
                    </div>
                );
            })()}

            {/* HC-SR04 ULTRASONIC DISTANCE SENSOR (ENLARGED 7-COLUMN FULL-SCALE REALISTIC SVG): Pins VCC (0, 48), Trig (16, 48), Echo (32, 48), GND (48, 48) */}
            {type === "sensor-ultrasonic" && (() => {
                const distCm = distanceCm != null ? distanceCm : 25;
                const isPinging = Boolean(isSimulating);
                return (
                    <div className={`ultrasonic-container ${isPinging ? "is-pinging" : ""}`} title={`HC-SR04 Ultrasonic Distance Sensor (${distCm} cm)`}>
                        <svg className="ultrasonic-realistic-svg" viewBox="-38 -18 124 76" width="124" height="76" style={{ position: "absolute", left: -38, top: -18, pointerEvents: "none" }}>
                            {/* Blue FR-4 PCB Spanning 7 Breadboard Columns */}
                            <rect x="-34" y="-12" width="116" height="54" rx="5" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8" filter="drop-shadow(0 6px 16px rgba(0,0,0,0.6))" />

                            {/* 4 Corner Gold-Plated Mounting Holes with Annular Copper Rings */}
                            <circle cx="-28" cy="-6" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="76" cy="-6" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="-28" cy="36" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="76" cy="36" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />

                            {/* 16MHz Metal Quartz Crystal in Center */}
                            <rect x="19.5" y="6" width="9" height="16" rx="2.5" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
                            <text x="24" y="16" fill="#475569" fontSize="3.2" fontWeight="bold" textAnchor="middle">16.0</text>

                            {/* Dual Large Aluminum Ultrasonic Transducers: T (Transmitter) & R (Receiver) */}
                            {/* T (Transmitter) on Left */}
                            <circle cx="-8" cy="14" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />
                            <circle cx="-8" cy="14" r="14" fill="#1e293b" />
                            <circle cx="-8" cy="14" r="9" fill="#334155" />
                            <text x="-8" y="18" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle">T</text>

                            {/* R (Receiver) on Right */}
                            <circle cx="56" cy="14" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />
                            <circle cx="56" cy="14" r="14" fill="#1e293b" />
                            <circle cx="56" cy="14" r="9" fill="#334155" />
                            <text x="56" y="18" fill="#f8fafc" fontSize="11" fontWeight="900" textAnchor="middle">R</text>

                            {/* Silkscreen Labels */}
                            <text x="24" y="-3" fill="#ffffff" fontSize="5.5" fontWeight="900" textAnchor="middle">HC-SR04</text>
                            <text x="24" y="32" fill="#a7f3d0" fontSize="4.5" fontWeight="900" textAnchor="middle">{distCm} cm</text>
                            <text x="24" y="38" fill="rgba(255,255,255,0.7)" fontSize="3.2" fontWeight="700" textAnchor="middle">TWINLAB X</text>

                            {/* Pin Labels directly above the 4 pins */}
                            <text x="0" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">VCC</text>
                            <text x="16" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">Trig</text>
                            <text x="32" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">Echo</text>
                            <text x="48" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">GND</text>

                            {/* 4 Gold Header Pins extending from Y=42 to Y=48 */}
                            <line x1="0" y1="42" x2="0" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                            <line x1="16" y1="42" x2="16" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                            <line x1="32" y1="42" x2="32" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                            <line x1="48" y1="42" x2="48" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                        </svg>

                        {/* Sonar Ping Waves on T */}
                        {isPinging && (
                            <div className="sonar-ping-emitter" style={{ left: -8, top: 14 }}>
                                <div className="sonar-wave wave-1"></div>
                                <div className="sonar-wave wave-2"></div>
                                <div className="sonar-wave wave-3"></div>
                            </div>
                        )}

                        {/* 4 Header Pins at Y=48 snapped to 16px breadboard grid */}
                        {[
                            { name: "VCC", x: 0, is5V: true },
                            { name: "Trig", x: 16, isGpio: true },
                            { name: "Echo", x: 32, isGpio: true },
                            { name: "GND", x: 48, isGnd: true }
                        ].map((pin) => (
                            <span
                                key={pin.name}
                                className={`terminal-pin pin-sonar-${pin.name.toLowerCase()} ${hoveredTerminal === `sonar_${pin.name}` ? "targeted" : ""}`}
                                style={{ left: pin.x, top: 48, transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => setHoveredTerminal(`sonar_${pin.name}`)}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, `sonar_${pin.name}`, pin.x, 48)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 48)}
                                onClick={(e) => handleTerminalPress(e, `sonar_${pin.name}`, pin.x, 48)}
                                onDoubleClick={(e) => handleTerminalAction(e, pin.x, 48)}
                            />
                        ))}
                    </div>
                );
            })()}

            {/* PIR MOTION SENSOR (ENLARGED 6-COLUMN FULL-SCALE REALISTIC SVG): Pins VCC (0, 48), OUT (16, 48), GND (32, 48) */}
            {type === "sensor-pir" && (() => {
                const isScanning = Boolean(isSimulating);
                return (
                    <div className={`pir-container ${isScanning ? "is-scanning" : ""}`} title="PIR Motion Sensor (HC-SR501)">
                        <svg className="pir-realistic-svg" viewBox="-36 -18 104 76" width="104" height="76" style={{ position: "absolute", left: -36, top: -18, pointerEvents: "none" }}>
                            {/* Dark Green FR-4 PCB Spanning 6 Breadboard Columns */}
                            <rect x="-32" y="-12" width="96" height="54" rx="5" fill="#15803d" stroke="#166534" strokeWidth="1.8" filter="drop-shadow(0 6px 16px rgba(0,0,0,0.6))" />

                            {/* 4 Corner Gold Mounting Holes */}
                            <circle cx="-26" cy="-6" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="58" cy="-6" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="-26" cy="36" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <circle cx="58" cy="36" r="2" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />

                            {/* Large Hemispherical White Fresnel Dome with Concentric & Faceted Arcs */}
                            <circle cx="16" cy="14" r="22" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.8" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.3))" />
                            <circle cx="16" cy="14" r="17" fill="none" stroke="#cbd5e1" strokeWidth="0.9" />
                            <circle cx="16" cy="14" r="12" fill="none" stroke="#cbd5e1" strokeWidth="0.9" />
                            <circle cx="16" cy="14" r="7" fill="none" stroke="#cbd5e1" strokeWidth="0.9" />
                            <circle cx="16" cy="14" r="3" fill="none" stroke="#cbd5e1" strokeWidth="0.9" />
                            <path d="M -4 14 Q 16 0 36 14" stroke="#94a3b8" strokeWidth="1" fill="none" />
                            <path d="M -4 14 Q 16 28 36 14" stroke="#94a3b8" strokeWidth="1" fill="none" />
                            <line x1="16" y1="-8" x2="16" y2="36" stroke="#94a3b8" strokeWidth="1" />

                            {/* Dual SMD Trimmer Potentiometers (Sensitivity & Delay) */}
                            <rect x="-22" y="10" width="8" height="14" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
                            <line x1="-20" y1="17" x2="-16" y2="17" stroke="#451a03" strokeWidth="1" />
                            <rect x="46" y="10" width="8" height="14" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
                            <line x1="48" y1="17" x2="52" y2="17" stroke="#451a03" strokeWidth="1" />

                            {/* Silkscreen text */}
                            <text x="16" y="-4" fill="#bbf7d0" fontSize="5.5" fontWeight="900" textAnchor="middle">PIR MOTION</text>
                            <text x="16" y="38" fill="rgba(255,255,255,0.7)" fontSize="3.5" fontWeight="700" textAnchor="middle">HC-SR501 • TWINLAB X</text>

                            {/* Pin labels */}
                            <text x="0" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">VCC</text>
                            <text x="16" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">OUT</text>
                            <text x="32" y="40" fill="#ffffff" fontSize="3.5" fontWeight="bold" textAnchor="middle">GND</text>

                            {/* 3 Gold Header Pins at Y=48 */}
                            <line x1="0" y1="42" x2="0" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                            <line x1="16" y1="42" x2="16" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                            <line x1="32" y1="42" x2="32" y2="48" stroke="#ca8a04" strokeWidth="2.8" strokeLinecap="round" />
                        </svg>

                        {isScanning && <div className="pir-radar-beam" style={{ left: 16, top: 14 }}></div>}

                        {[
                            { name: "VCC", x: 0, is5V: true },
                            { name: "OUT", x: 16, isGpio: true },
                            { name: "GND", x: 32, isGnd: true }
                        ].map((pin) => (
                            <span
                                key={pin.name}
                                className={`terminal-pin pin-pir-${pin.name.toLowerCase()} ${hoveredTerminal === `pir_${pin.name}` ? "targeted" : ""}`}
                                style={{ left: pin.x, top: 48, transform: "translate(-50%, -50%)" }}
                                onMouseEnter={() => setHoveredTerminal(`pir_${pin.name}`)}
                                onMouseLeave={() => setHoveredTerminal(null)}
                                onMouseDown={(e) => handleTerminalMouseDown(e, `pir_${pin.name}`, pin.x, 48)}
                                onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 48)}
                                onClick={(e) => handleTerminalPress(e, `pir_${pin.name}`, pin.x, 48)}
                                onDoubleClick={(e) => handleTerminalAction(e, pin.x, 48)}
                            />
                        ))}
                    </div>
                );
            })()}
        </div>
    );
}

export default SmallComponent;
