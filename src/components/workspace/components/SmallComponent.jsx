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
    isWireMode,
    activeWire,
    onStartWireAtPoint,
    isPressed = false,
    wiperValue = 0.5,
    switchState = "left",
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
                if (isWireMode) return;
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

                return (
                    <div className="resistor-container" title={`Resistor: ${rLabel}`}>
                        <span 
                            className={`terminal-pin pin-1 ${hoveredTerminal === "r1" ? "targeted" : ""}`}
                            title="Lead 1 (0, 0)"
                            onMouseEnter={() => setHoveredTerminal("r1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "r1", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                            onClick={(e) => handleTerminalPress(e, "r1", 0, 0)}
                        />
                        <div className="resistor-wire-track"></div>
                        <div className="resistor-ceramic-body">
                            <span className="band" style={{ backgroundColor: bands[0] }}></span>
                            <span className="band" style={{ backgroundColor: bands[1] }}></span>
                            <span className="band" style={{ backgroundColor: bands[2] }}></span>
                            <span className="band" style={{ backgroundColor: bands[3] }}></span>
                        </div>
                        <span 
                            className={`terminal-pin pin-2 ${hoveredTerminal === "r2" ? "targeted" : ""}`}
                            title="Lead 2 (64, 0)"
                            onMouseEnter={() => setHoveredTerminal("r2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "r2", 64, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 64, 0)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 64, 0); }}
                            onClick={(e) => handleTerminalPress(e, "r2", 64, 0)}
                        />
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
                            title={name || `5mm LED (${isDim ? "Dim light" : isLit ? "Bright light" : simState?.status || "Off"})`}
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
                            <div className="terminal-hover-tooltip anode-tip">
                                <span className="tip-sign">+</span>
                                <span>Anode</span>
                            </div>
                        )}
                        {hoveredTerminal === "cathode" && (
                            <div className="terminal-hover-tooltip cathode-tip">
                                <span className="tip-sign">−</span>
                                <span>Cathode</span>
                            </div>
                        )}

                        {/* Accurate Terminal Pins directly at (0, 0) and (16, 0) with Polarity Badges */}
                        <span 
                            className={`terminal-pin pin-anode ${hoveredTerminal === "anode" ? "targeted" : ""}`}
                            title="Anode (+ Positive)"
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
                            title="Cathode (- Negative)"
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

            {/* CERAMIC CAPACITOR: 16px span. Pins at (0, 16) and (16, 16) */}
            {type === "capacitor-ceramic" && (
                <div className="capacitor-container">
                    <div className="ceramic-disc">104</div>
                    <div className="cap-lead-stems">
                        <div className="stem stem-1"></div>
                        <div className="stem stem-2"></div>
                    </div>
                    <span 
                        className={`terminal-pin pin-1 ${hoveredTerminal === "cap1" ? "targeted" : ""}`}
                        title="Terminal 1"
                        onMouseEnter={() => setHoveredTerminal("cap1")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "cap1", 0, 16)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 16); }}
                        onClick={(e) => handleTerminalPress(e, "cap1", 0, 16)}
                    />
                    <span 
                        className={`terminal-pin pin-2 ${hoveredTerminal === "cap2" ? "targeted" : ""}`}
                        title="Terminal 2"
                        onMouseEnter={() => setHoveredTerminal("cap2")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "cap2", 16, 16)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 16)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 16); }}
                        onClick={(e) => handleTerminalPress(e, "cap2", 16, 16)}
                    />
                </div>
            )}

            {/* TACTILE PUSHBUTTON: 32px x 32px span. 4 Pins */}
            {type === "button" && (
                <div className={`button-tactile-container ${isPressed ? "is-pressed" : ""}`}>
                    <div className="tactile-case-body">
                        <div 
                            className="tactile-round-actuator"
                            title="Click and hold to press button"
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
                        title="Terminal 1a"
                        onMouseEnter={() => setHoveredTerminal("btn1")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn1", 0, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 0); }}
                        onClick={(e) => handleTerminalPress(e, "btn1", 0, 0)}
                    />
                    <span 
                        className={`terminal-pin pin-tr ${hoveredTerminal === "btn2" ? "targeted" : ""}`}
                        title="Terminal 1b"
                        onMouseEnter={() => setHoveredTerminal("btn2")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn2", 32, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 0)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 0); }}
                        onClick={(e) => handleTerminalPress(e, "btn2", 32, 0)}
                    />
                    <span 
                        className={`terminal-pin pin-bl ${hoveredTerminal === "btn3" ? "targeted" : ""}`}
                        title="Terminal 2a"
                        onMouseEnter={() => setHoveredTerminal("btn3")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn3", 0, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 32); }}
                        onClick={(e) => handleTerminalPress(e, "btn3", 0, 32)}
                    />
                    <span 
                        className={`terminal-pin pin-br ${hoveredTerminal === "btn4" ? "targeted" : ""}`}
                        title="Terminal 2b"
                        onMouseEnter={() => setHoveredTerminal("btn4")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "btn4", 32, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 32); }}
                        onClick={(e) => handleTerminalPress(e, "btn4", 32, 32)}
                    />
                </div>
            )}

            {/* POTENTIOMETER: 32px span. 3 Terminals (0, 16px, 32px at Y=48) */}
            {type === "potentiometer" && (() => {
                const curWiper = wiperValue != null ? wiperValue : 0.5;
                const curAngle = -135 + curWiper * 270;
                const resistanceK = (curWiper * 10).toFixed(1);

                const handleDialMouseDown = (e) => {
                    e.stopPropagation();
                    if (isWireMode) return;
                    const startY = e.clientY;
                    const startWiper = curWiper;

                    const handleMove = (moveEvt) => {
                        const dy = startY - moveEvt.clientY;
                        const delta = dy / 150;
                        const nextWiper = Math.max(0, Math.min(1, Math.round((startWiper + delta) * 100) / 100));
                        onUpdate && onUpdate({ wiperValue: nextWiper });
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
                        <div className="pot-round-case">
                            <div 
                                className="pot-knob-dial"
                                style={{ transform: `rotate(${curAngle}deg)` }}
                                onMouseDown={handleDialMouseDown}
                                title={`Drag up/down to adjust resistance: ${resistanceK} kΩ`}
                            >
                                <div className="knob-indicator-dot"></div>
                            </div>
                            <div className="pot-value-pill">
                                {resistanceK}kΩ
                            </div>
                        </div>
                        <div className="pot-lead-stems">
                            <div className="stem stem-1"></div>
                            <div className="stem stem-wiper"></div>
                            <div className="stem stem-2"></div>
                        </div>
                        <span 
                            className={`terminal-pin pin-t1 ${hoveredTerminal === "pot1" ? "targeted" : ""}`}
                            title="Terminal 1"
                            onMouseEnter={() => setHoveredTerminal("pot1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "pot1", 0, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 48); }}
                            onClick={(e) => handleTerminalPress(e, "pot1", 0, 48)}
                        />
                        <span 
                            className={`terminal-pin pin-wiper ${hoveredTerminal === "potW" ? "targeted" : ""}`}
                            title="Wiper (Output)"
                            onMouseEnter={() => setHoveredTerminal("potW")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "potW", 16, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 48); }}
                            onClick={(e) => handleTerminalPress(e, "potW", 16, 48)}
                        />
                        <span 
                            className={`terminal-pin pin-t2 ${hoveredTerminal === "pot2" ? "targeted" : ""}`}
                            title="Terminal 2"
                            onMouseEnter={() => setHoveredTerminal("pot2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "pot2", 32, 48)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 48)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 48); }}
                            onClick={(e) => handleTerminalPress(e, "pot2", 32, 48)}
                        />
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
                                    title={`Click to switch (Currently: ${isRight ? "Right" : "Left"})`}
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
                            title="Terminal 1 (Left)"
                            onMouseEnter={() => setHoveredTerminal("sw1")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw1", 0, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 16); }}
                            onClick={(e) => handleTerminalPress(e, "sw1", 0, 16)}
                        />
                        <span 
                            className={`terminal-pin pin-swcom ${hoveredTerminal === "swcom" ? "targeted" : ""}`}
                            title="Common (Center)"
                            onMouseEnter={() => setHoveredTerminal("swcom")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "swcom", 16, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 16); }}
                            onClick={(e) => handleTerminalPress(e, "swcom", 16, 16)}
                        />
                        <span 
                            className={`terminal-pin pin-sw2 ${hoveredTerminal === "sw2" ? "targeted" : ""}`}
                            title="Terminal 2 (Right)"
                            onMouseEnter={() => setHoveredTerminal("sw2")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "sw2", 32, 16)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 16)}
                            onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 32, 16); }}
                            onClick={(e) => handleTerminalPress(e, "sw2", 32, 16)}
                        />
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
                            title="GND (-)"
                        >
                            <div className="terminal-post-pillar"></div>
                            <div className="terminal-collar neg-collar"></div>
                            <div className="terminal-needle-pin">
                                <span className="needle-tip-dot"></span>
                            </div>

                            {/* Clean Minimal Badge */}
                            {hoveredTerminal === "neg" && (
                                <div className="terminal-simple-pill">GND (-)</div>
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
                            title="Voltage (+)"
                        >
                            <div className="terminal-post-pillar"></div>
                            <div className="terminal-collar pos-collar"></div>
                            <div className="terminal-needle-pin">
                                <span className="needle-tip-dot"></span>
                            </div>

                            {/* Clean Minimal Badge */}
                            {hoveredTerminal === "pos" && (
                                <div className="terminal-simple-pill">Voltage (+)</div>
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
                            <div className="buzzer-sound-waves">
                                <div className="sound-wave wave-1"></div>
                                <div className="sound-wave wave-2"></div>
                                <div className="sound-wave wave-3"></div>
                            </div>
                        )}
                    </div>
                    <span 
                        className={`terminal-pin pin-pos ${hoveredTerminal === "buzzerPos" ? "targeted" : ""}`}
                        title="Positive (+)"
                        onMouseEnter={() => setHoveredTerminal("buzzerPos")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "buzPos", 0, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 0, 32); }}
                        onClick={(e) => handleTerminalPress(e, "buzPos", 0, 32)}
                    />
                    <span 
                        className={`terminal-pin pin-neg ${hoveredTerminal === "buzzerNeg" ? "targeted" : ""}`}
                        title="Negative (-)"
                        onMouseEnter={() => setHoveredTerminal("buzzerNeg")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "buzNeg", 16, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 32)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleTerminalAction(e, 16, 32); }}
                        onClick={(e) => handleTerminalPress(e, "buzNeg", 16, 32)}
                    />
                </div>
            )}
        </div>
    );
}

export default SmallComponent;
