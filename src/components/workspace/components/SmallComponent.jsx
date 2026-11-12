import "./SmallComponent.css";
import React, { useState, useRef, useEffect, Fragment } from "react";
import { soundManager } from "../../../utils/audioManager";
import ThreeMotorView from "./ThreeMotorView";

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
    hasSwitch = false,
    temperature = 25,
    cells,
    lux = 50,
    capacitance = "100nF",
    backlightColor = "#0284c7",
    lcdTextColor = "#ffffff",
    angle = 90,
    distanceCm = 25,
    is3D = true,
    viewMode = "3d",
    rot3D = 35,
    pitch3D = 20,
    speed = 100,
    accessory = "propeller",
    gearRatio = "1:48",
    direction = "cw",
    onUpdate
}) {
    const [hoveredTerminal, setHoveredTerminal] = useState(null);
    const lastMouseDownRef = useRef({ time: 0, key: "" });
    const rotorRef = useRef(null);
    const tachRpmRef = useRef(null);
    const liveAngleRef = useRef(0);
    const liveRpmRef = useRef(0);
    const voltageDisplay = voltage != null ? `${voltage}V` : "9V";

    // Play/stop electronic chime tone for buzzer
    useEffect(() => {
        if (type === "buzzer") {
            if (isSimulating && simState?.isBeeping) {
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
    }, [type, id, isSimulating, simState?.isBeeping]);

    // Play/stop realistic mechanical audio for DC motors
    useEffect(() => {
        const isMotor = type === "motor-dc" || type === "motor-geared" || type === "motor-bo";
        if (isMotor) {
            const motorSim = simState || {};
            const isSpinning = Boolean(isSimulating && motorSim.isSpinning && (motorSim.rpm > 0 || motorSim.voltage >= 1.0));
            if (isSpinning) {
                const isGeared = type === "motor-geared" || type === "motor-bo";
                soundManager.startMotorSound(id, {
                    type: isGeared ? "motor-geared" : "motor-dc",
                    rpm: motorSim.rpm || (isGeared ? 220 : 12500),
                    voltage: motorSim.voltage || 6.0
                });
            } else {
                soundManager.stopMotorSound(id);
            }
        }
        return () => {
            if (isMotor) {
                soundManager.stopMotorSound(id);
            }
        };
    }, [type, id, isSimulating, simState?.isSpinning, simState?.rpm, simState?.voltage]);

    // Smooth physical rotor acceleration loop (initially slow, ramping up quickly to full speed, and coasting down!)
    useEffect(() => {
        const isMotor = type === "motor-dc" || type === "motor-geared" || type === "motor-bo";
        if (!isMotor) return;

        const motorSim = simState || {};
        const isSpinning = Boolean(isSimulating && motorSim.isSpinning && (motorSim.rpm > 0 || motorSim.voltage >= 1.0));
        const isGeared = type === "motor-geared" || type === "motor-bo";
        const baseRpm = isGeared ? 220 : 12500;
        const targetRpm = isSpinning ? (motorSim.rpm || baseRpm) : 0;
        const dirSign = (motorSim.direction || direction) === "ccw" ? -1 : 1;

        let animFrame;
        let lastTime = performance.now();

        const updateAnimation = (now) => {
            const dt = Math.min(0.08, (now - lastTime) / 1000);
            lastTime = now;

            // Physical acceleration curve: starts slow, accelerates fast, and coasts down with inertia
            const accelRate = liveRpmRef.current < targetRpm ? 2.6 : 2.2;
            liveRpmRef.current += (targetRpm - liveRpmRef.current) * Math.min(1, dt * accelRate);

            if (liveRpmRef.current > 0.5) {
                liveAngleRef.current = (liveAngleRef.current + dirSign * (liveRpmRef.current / 60) * 360 * dt) % 360;
                if (rotorRef.current) {
                    rotorRef.current.setAttribute("transform", `rotate(${liveAngleRef.current.toFixed(2)})`);
                    rotorRef.current.style.transform = "";
                }
                if (tachRpmRef.current) {
                    tachRpmRef.current.textContent = Math.round(liveRpmRef.current).toLocaleString();
                }
            } else if (!isSpinning && liveRpmRef.current <= 0.5) {
                liveRpmRef.current = 0;
                if (tachRpmRef.current) {
                    tachRpmRef.current.textContent = "0";
                }
            }

            if (isSpinning || liveRpmRef.current > 0.5) {
                animFrame = requestAnimationFrame(updateAnimation);
            }
        };

        animFrame = requestAnimationFrame(updateAnimation);

        return () => {
            if (animFrame) cancelAnimationFrame(animFrame);
        };
    }, [type, isSimulating, simState?.isSpinning, simState?.rpm, simState?.voltage, simState?.direction, direction]);

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
                e.stopPropagation();
                onSelect && onSelect(id);
                onMouseDown && onMouseDown(e, id);
            }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect && onSelect(id);
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
                            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
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
                            style={{ left: 16, top: 0, transform: "translate(-50%, -50%)" }}
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
                <div className={`battery-tinkercad-real ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "active-discharging" : ""} ${isSimulating && simState?.isShortCircuit ? "short-circuited" : ""}`}>
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
                    <div className={`battery-copper-band ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "band-discharging" : ""}`}>
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
                            <div className={`display-bezel ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "bezel-discharging" : ""}`}>
                                <div className={`lcd-screen ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "screen-discharging" : ""}`}>
                                    <div className="lcd-header-row">
                                        <span className="lcd-text">{voltageDisplay}</span>
                                        {isSimulating && (simState?.isDischarging || simState?.currentMa > 0) && (
                                            <span className="lcd-drain-bolt">⚡</span>
                                        )}
                                    </div>
                                    {isSimulating && (simState?.isDischarging || simState?.currentMa > 0) && (
                                        <div className="battery-drain-track">
                                            <div className="battery-drain-pulse"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={`display-subtext ${isSimulating && simState?.isShortCircuit ? "subtext-short" : (isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "subtext-discharging" : "")}`}>
                                {isSimulating && simState?.isShortCircuit 
                                    ? "⚠️ SHORT CIRCUIT" 
                                    : (isSimulating && (simState?.isDischarging || simState?.currentMa > 0)) 
                                        ? `DRAIN • ${simState.currentMa || 20}mA` 
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
                const cellWidth = isAAA ? 30 : 38;
                const totalWidth = cellCount === 1 ? 64 : cellCount === 4 ? 176 : cellCount === 3 ? 140 : 96;
                const posLeadX = totalWidth - 20;
                const negLeadX = 20;
                const userHasSwitch = Boolean(hasSwitch);
                const isSwitchOn = userHasSwitch ? (switchState !== false && isOn !== false) : true;
                const caseColor = color || "#18181b";

                return (
                    <div 
                        className={`aa-battery-case ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "active-discharging" : ""} ${isSimulating && simState?.isShortCircuit ? "short-circuited" : ""}`} 
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
                                        {userHasSwitch ? (isSwitchOn ? `${(cellCount * 1.5).toFixed(1)}V (+)` : "0V (Switch OFF)") : `${(cellCount * 1.5).toFixed(1)}V (+)`}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Case Lid: Optional Integrated Switch (User-Controlled) */}
                        {userHasSwitch ? (
                            <div className="battery-case-lid">
                                <div 
                                    className={`lid-switch-track ${isSwitchOn ? "switch-on" : "switch-off"}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const nextState = !isSwitchOn;
                                        onUpdate && onUpdate({ switchState: nextState, isOn: nextState });
                                    }}
                                >
                                    <div className="lid-switch-thumb"></div>
                                    <span className="lid-switch-label">{isSwitchOn ? "ON" : "OFF"}</span>
                                </div>
                                <span className={`battery-power-led ${isSwitchOn && isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "glowing" : ""}`}></span>
                            </div>
                        ) : (
                            <div className="battery-case-lid sealed-lid">
                                <div className="wire-grommet-dot neg-grommet" style={{ left: negLeadX }}></div>
                                <div className="wire-grommet-dot pos-grommet" style={{ left: posLeadX }}></div>
                            </div>
                        )}

                        {/* Active Energy Discharge HUD Badge */}
                        {isSimulating && (simState?.isDischarging || simState?.currentMa > 0) && (
                            <div className="aa-discharge-badge">
                                <span className="aa-discharge-bolt">⚡</span>
                                <span className="aa-discharge-text">DRAIN • {simState?.currentMa || 20}mA</span>
                            </div>
                        )}

                        {/* Molded ABS Enclosure with Cells */}
                        <div className="aa-molded-holder">
                            <div className="holder-rim">
                                {[...Array(cellCount)].map((_, idx) => (
                                    <div key={`cell-${idx}`} className={`battery-cylindrical-cell ${isAAA ? "is-aaa" : "is-aa"} ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "cell-discharging" : ""}`} style={{ width: cellWidth }}>
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
                const isPowered = Boolean(isSimulating && simState?.isPowered);
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
                                { name: "GND", x: 16, isGnd: true, desc: "Ground (0V)" },
                                { name: "VCC", x: 32, is5V: true, desc: "Power (+5V)" },
                                { name: "SDA", x: 48, isGpio: true, desc: "I2C Data (SDA)" },
                                { name: "SCL", x: 64, isGpio: true, desc: "I2C Clock (SCL)" }
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
                                        <div className="terminal-hover-tooltip" style={{ left: "50%", top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                            {pin.name}: {pin.desc}
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
                            style={{ left: 0, top: 16, transform: "translate(-50%, -50%)" }}
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
                            style={{ left: 32, top: 16, transform: "translate(-50%, -50%)" }}
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
                    <div className={`photoresistor-container ${isConducting ? "is-sensing" : ""}`}>
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
                            style={{ left: 0, top: 16, transform: "translate(-50%, -50%)" }}
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
                            style={{ left: 32, top: 16, transform: "translate(-50%, -50%)" }}
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

            {/* NPN & PNP BIPOLAR TRANSISTORS (TO-92 / 2N2222 / 2N3904 / 2N3906): Terminals (0, 0), (16, 0), (32, 0) */}
            {(type === "transistor" || type === "transistor-npn" || type === "transistor-pnp") && (
                <div className="transistor-to92-container">
                    {/* 3 Realistic Tinned Copper Wire Leads linking down to Pins at (0, 0), (16, 0), (32, 0) */}
                    <svg className="trans-leads-svg" viewBox="-6 -36 44 40" width="44" height="40" style={{ position: "absolute", top: -36, left: -6, pointerEvents: "none" }}>
                        <line x1="0" y1="-14" x2="0" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                        <line x1="16" y1="-14" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                        <line x1="32" y1="-14" x2="32" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                    </svg>

                    {/* TO-92 Molded Epoxy Case Body sitting above pins */}
                    <div className="to92-body">
                        <div className="to92-curved-back"></div>
                        <div className="to92-flat-face">
                            <span className="transistor-part-text font-mono">{type === "transistor-pnp" ? "2N3906" : "2N2222"}</span>
                            <span className="transistor-x-mark font-mono">E B C</span>
                        </div>
                    </div>

                    {/* Pin 1: Emitter (E) (0, 0) */}
                    <span 
                        className={`terminal-pin pin-trans-e ${hoveredTerminal === "trE" ? "targeted" : ""}`}
                        style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("trE")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trE", 0, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                        onClick={(e) => handleTerminalPress(e, "trE", 0, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                    />
                    {hoveredTerminal === "trE" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Emitter (E)
                        </div>
                    )}

                    {/* Pin 2: Base (B) (16, 0) */}
                    <span 
                        className={`terminal-pin pin-trans-b ${hoveredTerminal === "trB" ? "targeted" : ""}`}
                        style={{ left: 16, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("trB")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trB", 16, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                        onClick={(e) => handleTerminalPress(e, "trB", 16, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 16, 0)}
                    />
                    {hoveredTerminal === "trB" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Base (B)
                        </div>
                    )}

                    {/* Pin 3: Collector (C) (32, 0) */}
                    <span 
                        className={`terminal-pin pin-trans-c ${hoveredTerminal === "trC" ? "targeted" : ""}`}
                        style={{ left: 32, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("trC")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "trC", 32, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 0)}
                        onClick={(e) => handleTerminalPress(e, "trC", 32, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 32, 0)}
                    />
                    {hoveredTerminal === "trC" && (
                        <div className="terminal-hover-tooltip" style={{ left: 32, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Collector (C)
                        </div>
                    )}
                </div>
            )}

            {/* POWER MOSFET (TO-220 / IRF540N): Terminals Gate (0, 0), Drain (16, 0), Source (32, 0) */}
            {(type === "mosfet-n" || type === "mosfet-p") && (
                <div 
                    className="mosfet-to220-container"
                    style={{ position: "relative", width: 44, height: 48, pointerEvents: "auto", cursor: "move" }}
                >
                    {/* TO-220 Metal Heatsink Tab + Black Molded Case + 3 Straight Pin Leads */}
                    <svg className="to220-svg" viewBox="-6 -44 44 48" width="44" height="48" style={{ position: "absolute", top: -44, left: -6, pointerEvents: "auto", cursor: "move" }}>
                        <defs>
                            {/* Silver Metal Tab Gradient */}
                            <linearGradient id={`to220-tab-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#94a3b8" />
                                <stop offset="50%" stopColor="#f1f5f9" />
                                <stop offset="100%" stopColor="#64748b" />
                            </linearGradient>
                            {/* Black Molded Body Gradient */}
                            <linearGradient id={`to220-body-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#27272a" />
                                <stop offset="100%" stopColor="#09090b" />
                            </linearGradient>
                        </defs>

                        {/* Interactive Click/Drag Hitbox Rect */}
                        <rect x="-6" y="-44" width="44" height="40" fill="transparent" pointerEvents="all" cursor="move" />

                        {/* 1. Metal Heat Sink Tab (Top) */}
                        <path d="M 0 -38 L 32 -38 L 32 -18 L 0 -18 Z" fill={`url(#to220-tab-grad-${id})`} stroke="#475569" strokeWidth="0.8" rx="2" />
                        {/* Tab Screw Mounting Hole */}
                        <circle cx="16" cy="-28" r="4.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />

                        {/* 2. Black Molded Epoxy Body */}
                        <rect x="-2" y="-20" width="36" height="15" rx="2" fill={`url(#to220-body-grad-${id})`} stroke="#18181b" strokeWidth="1" />
                        <line x1="2" y1="-18" x2="30" y2="-18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                        <text x="16" y="-10" fill="#e2e8f0" fontSize="5" fontWeight="900" fontFamily="monospace" textAnchor="middle">IRF540N</text>
                        <text x="16" y="-6" fill="#a1a1aa" fontSize="3.5" fontWeight="700" fontFamily="monospace" textAnchor="middle">G  D  S</text>

                        {/* 3. Three Heavy-Duty Leads extending to Pins at 0, 16, 32 */}
                        <line x1="0" y1="-5" x2="0" y2="0" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="16" y1="-5" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="32" y1="-5" x2="32" y2="0" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>

                    {/* Pin 1: Gate (G) (0, 0) */}
                    <span 
                        className={`terminal-pin pin-mosfet-g ${hoveredTerminal === "mosG" ? "targeted" : ""}`}
                        style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("mosG")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "mosG", 0, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                        onClick={(e) => handleTerminalPress(e, "mosG", 0, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                    />
                    {hoveredTerminal === "mosG" && (
                        <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Gate (G)
                        </div>
                    )}

                    {/* Pin 2: Drain (D) (16, 0) */}
                    <span 
                        className={`terminal-pin pin-mosfet-d ${hoveredTerminal === "mosD" ? "targeted" : ""}`}
                        style={{ left: 16, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("mosD")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "mosD", 16, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                        onClick={(e) => handleTerminalPress(e, "mosD", 16, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 16, 0)}
                    />
                    {hoveredTerminal === "mosD" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Drain (D)
                        </div>
                    )}

                    {/* Pin 3: Source (S) (32, 0) */}
                    <span 
                        className={`terminal-pin pin-mosfet-s ${hoveredTerminal === "mosS" ? "targeted" : ""}`}
                        style={{ left: 32, top: 0, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("mosS")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "mosS", 32, 0)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 32, 0)}
                        onClick={(e) => handleTerminalPress(e, "mosS", 32, 0)}
                        onDoubleClick={(e) => handleTerminalAction(e, 32, 0)}
                    />
                    {hoveredTerminal === "mosS" && (
                        <div className="terminal-hover-tooltip" style={{ left: 32, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Source (S)
                        </div>
                    )}
                </div>
            )}

            {/* COIN CELL BATTERY (CR2032 3V): Terminals Negative (16, 32), Positive (48, 32) */}
            {type === "battery-coin" && (
                <div className={`coin-cell-container ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "active-discharging" : ""}`}>
                    <div className="coin-metal-disc">
                        <span className="coin-plus-sign">+</span>
                        <span className="coin-model-label">CR2032</span>
                        <span className={`coin-volt-label ${isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? "coin-volt-discharging" : ""}`}>
                            {isSimulating && (simState?.isDischarging || simState?.currentMa > 0) ? `⚡ 3V • ${simState?.currentMa || 15}mA` : "3V DC • TWINLAB X"}
                        </span>
                        {isSimulating && (simState?.isDischarging || simState?.currentMa > 0) && (
                            <div className="coin-energy-pulse-ring"></div>
                        )}
                    </div>

                    {/* Negative Pin (16, 32) */}
                    <span 
                        className={`terminal-pin pin-coin-neg ${hoveredTerminal === "coinNeg" ? "targeted" : ""}`}
                        style={{ left: 16, top: 32, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("coinNeg")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "coinNeg", 16, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 16, 32)}
                        onClick={(e) => handleTerminalPress(e, "coinNeg", 16, 32)}
                        onDoubleClick={(e) => handleTerminalAction(e, 16, 32)}
                    >
                        <span className="coin-pin-badge badge-neg">−</span>
                    </span>
                    {hoveredTerminal === "coinNeg" && (
                        <div className="terminal-hover-tooltip" style={{ left: 16, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Negative (−) GND
                        </div>
                    )}

                    {/* Positive Pin (48, 32) */}
                    <span 
                        className={`terminal-pin pin-coin-pos ${hoveredTerminal === "coinPos" ? "targeted" : ""}`}
                        style={{ left: 48, top: 32, transform: "translate(-50%, -50%)" }}
                        onMouseEnter={() => setHoveredTerminal("coinPos")}
                        onMouseLeave={() => setHoveredTerminal(null)}
                        onMouseDown={(e) => handleTerminalMouseDown(e, "coinPos", 48, 32)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, 48, 32)}
                        onClick={(e) => handleTerminalPress(e, "coinPos", 48, 32)}
                        onDoubleClick={(e) => handleTerminalAction(e, 48, 32)}
                    >
                        <span className="coin-pin-badge badge-pos">+</span>
                    </span>
                    {hoveredTerminal === "coinPos" && (
                        <div className="terminal-hover-tooltip" style={{ left: 48, top: 32, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                            Positive (+) 3V DC
                        </div>
                    )}
                </div>
            )}

            {/* ELECTROLYTIC CAPACITOR (REALISTIC CYLINDRICAL CAN): Anode (0, 0), Cathode (16, 0) */}
            {type === "capacitor-electrolytic" && (() => {
                const isCharged = Boolean(isSimulating && (simState?.isPowered || simState?.isDischarging));
                const capVal = capacitance || "10µF";
                return (
                    <div className={`elec-cap-container ${isCharged ? "is-charged" : ""}`}>
                        {/* High-Fidelity SVG Aluminum Can Body + Polarity Negative Stripe + Two Vertical Wire Leads */}
                        <svg className="elec-realistic-svg" viewBox="-12 -54 40 58" width="40" height="58" style={{ position: "absolute", top: -54, left: -12, pointerEvents: "auto", cursor: "move" }}>
                            <defs>
                                {/* Aluminum Can Sleeve Gradient */}
                                <linearGradient id={`elec-sleeve-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#0369a1" />
                                    <stop offset="35%" stopColor="#0284c7" />
                                    <stop offset="70%" stopColor="#0369a1" />
                                    <stop offset="100%" stopColor="#082f49" />
                                </linearGradient>
                                {/* Top Aluminum Vent Gradient */}
                                <linearGradient id={`elec-vent-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#cbd5e1" />
                                    <stop offset="50%" stopColor="#f8fafc" />
                                    <stop offset="100%" stopColor="#94a3b8" />
                                </linearGradient>
                            </defs>

                            {/* 1. Scored Aluminum Safety Relief Vent (Top) */}
                            <ellipse cx="8" cy="-44" rx="13" ry="4" fill={`url(#elec-vent-grad-${id})`} stroke="#64748b" strokeWidth="0.8" />
                            {/* Vent Cross Etching lines */}
                            <line x1="3" y1="-44" x2="13" y2="-44" stroke="#475569" strokeWidth="0.8" />
                            <line x1="8" y1="-46.5" x2="8" y2="-41.5" stroke="#475569" strokeWidth="0.8" />

                            {/* 2. Cylindrical Sleeve Can Body */}
                            <path d="M -5 -44 L 21 -44 L 21 -12 L -5 -12 Z" fill={`url(#elec-sleeve-grad-${id})`} stroke="#0284c7" strokeWidth="0.8" />
                            
                            {/* 3. Negative Polarity White Stripe (Right side, aligned with Cathode pin at x=16) */}
                            <rect x="12" y="-44" width="7" height="32" fill="#f8fafc" opacity="0.95" />
                            <text x="15.5" y="-35" fill="#0369a1" fontSize="7" fontWeight="900" textAnchor="middle">-</text>
                            <text x="15.5" y="-24" fill="#0369a1" fontSize="7" fontWeight="900" textAnchor="middle">-</text>
                            <text x="15.5" y="-14" fill="#0369a1" fontSize="7" fontWeight="900" textAnchor="middle">-</text>

                            {/* 4. Silkscreen Ratings Stamp */}
                            <text x="3.5" y="-28" fill="#ffffff" fontSize="4.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">{capVal}</text>
                            <text x="3.5" y="-21" fill="#93c5fd" fontSize="3.8" fontWeight="700" fontFamily="monospace" textAnchor="middle">50V</text>
                            <text x="3.5" y="-14" fill="rgba(255,255,255,0.7)" fontSize="3.2" fontWeight="700" fontFamily="monospace" textAnchor="middle">105°C</text>

                            {/* 5. Bottom Molded Rubber Sealing Bung */}
                            <ellipse cx="8" cy="-12" rx="13" ry="3" fill="#18181b" stroke="#27272a" strokeWidth="0.8" />

                            {/* 6. Two Sturdy Tinned Copper Wire Leads going down into breadboard holes (0, 0) and (16, 0) */}
                            {/* Anode (+) Lead */}
                            <line x1="0" y1="-12" x2="0" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                            {/* Cathode (−) Lead */}
                            <line x1="16" y1="-12" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>

                        {/* Active Electric Field Glow Pulse during Simulation */}
                        {isCharged && <div className="elec-field-glow-pulse" style={{ left: -5, top: -46, width: 26, height: 34 }} />}

                        {/* Anode (+) Pin at (0, 0) */}
                        <span 
                            className={`terminal-pin pin-elec-anode ${hoveredTerminal === "elAnode" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
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

                        {/* Cathode (−) Pin at (16, 0) */}
                        <span 
                            className={`terminal-pin pin-elec-cathode ${hoveredTerminal === "elCathode" ? "targeted" : ""}`}
                            style={{ left: 16, top: 0, transform: "translate(-50%, -50%)" }}
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

            {/* DC MOTOR: Ultra-Realistic 2D & 3D Interactive Model with 360° Joystick Rotation & Dynamic 3D Leads */}
            {type === "motor-dc" && (() => {
                const isMotor3D = is3D !== false && viewMode !== "2d";
                const currentRot = rot3D != null ? rot3D : 35;
                const currentPitch = pitch3D != null ? pitch3D : 20;
                const motorSpeed = speed != null ? speed : 100;

                // Live electrical simulation state
                const motorSim = simState || {};
                const isSpinning = Boolean(
                    isSimulating && motorSim.isSpinning && (motorSim.rpm > 0 || motorSim.voltage >= 1.0)
                );
                const actualRpm = isSpinning 
                    ? (motorSim.rpm || Math.round((motorSpeed / 100) * 12500)) 
                    : 0;
                const actualVoltage = isSpinning ? (motorSim.voltage || 0) : 0;
                const actualCurrent = isSpinning ? (motorSim.currentMa || 0) : 0;
                const actualDir = motorSim.direction || direction || "cw";
                const isAxleOnly = accessory === "axle";

                // Dynamic spin rotation speed for 2D animation
                const spinDuration = isSpinning && actualRpm > 0 
                    ? `${Math.max(0.02, (60 / actualRpm)).toFixed(3)}s` 
                    : "0.12s";

                // 3D Lug projection math for the flexible hookup leads
                // Motor center is at (24, -65) in canvas local coordinates.
                const radY = (currentRot * Math.PI) / 180;
                const radX = (currentPitch * Math.PI) / 180;

                const projectLug = (x0, y0, z0) => {
                    const x1 = x0 * Math.cos(radY) + z0 * Math.sin(radY);
                    const y1 = y0;
                    const z1 = -x0 * Math.sin(radY) + z0 * Math.cos(radY);

                    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
                    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

                    return {
                        x: Math.round(24 + x1),
                        y: Math.round(-65 + y2),
                        z: z2
                    };
                };

                const posLug = projectLug(-16, 16, -26);
                const negLug = projectLug(16, 16, -26);

                // Natural flexible silicone hookup leads drooping down to breadboard pins (0, 0) and (48, 0)
                const redC1X = Math.round(posLug.x + (0 - posLug.x) * 0.35);
                const redC1Y = Math.round(posLug.y + Math.max(16, (0 - posLug.y) * 0.45));
                const redC2X = Math.round(0 + (posLug.x - 0) * 0.15);
                const redC2Y = -18;
                const redLeadPath = `M ${posLug.x} ${posLug.y} C ${redC1X} ${redC1Y}, ${redC2X} ${redC2Y}, 0 0`;

                const blkC1X = Math.round(negLug.x + (48 - negLug.x) * 0.35);
                const blkC1Y = Math.round(negLug.y + Math.max(16, (0 - negLug.y) * 0.45));
                const blkC2X = Math.round(48 + (negLug.x - 48) * 0.15);
                const blkC2Y = -18;
                const blkLeadPath = `M ${negLug.x} ${negLug.y} C ${blkC1X} ${blkC1Y}, ${blkC2X} ${blkC2Y}, 48 0`;

                return (
                    <div className={`dc-motor-container ${isSpinning ? "is-spinning" : ""} ${isMotor3D ? "mode-3d" : "mode-2d"}`}>
                        {/* DYNAMIC FLEXIBLE SILICONE HOOKUP LEADS (SVG) */}
                        <svg className="dc-motor-dynamic-leads-svg" viewBox="-50 -130 150 145" style={{ position: "absolute", left: -50, top: -130, width: 150, height: 145, pointerEvents: "none", overflow: "visible" }}>
                            <defs>
                                <linearGradient id={`motor-tab-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="50%" stopColor="#d97706" />
                                    <stop offset="100%" stopColor="#78350f" />
                                </linearGradient>
                                <radialGradient id={`solder-droplet-grad-${id}`} cx="35%" cy="35%" r="65%">
                                    <stop offset="0%" stopColor="#f8fafc" />
                                    <stop offset="40%" stopColor="#cbd5e1" />
                                    <stop offset="100%" stopColor="#64748b" />
                                </radialGradient>
                                <filter id={`wire-shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.55" />
                                </filter>
                            </defs>

                            {/* Drop Shadows for Wires */}
                            <path d={redLeadPath} stroke="rgba(0,0,0,0.4)" strokeWidth="5.5" strokeLinecap="round" fill="none" filter={`url(#wire-shadow-${id})`} />
                            <path d={blkLeadPath} stroke="rgba(0,0,0,0.4)" strokeWidth="5.5" strokeLinecap="round" fill="none" filter={`url(#wire-shadow-${id})`} />

                            {/* Positive (+) Flexible Red Silicone Lead */}
                            <path d={redLeadPath} stroke="#dc2626" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                            <path d={redLeadPath} stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />

                            {/* Negative (-) Flexible Black Silicone Lead */}
                            <path d={blkLeadPath} stroke="#18181b" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                            <path d={blkLeadPath} stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />

                            {/* Solder Lugs attached directly at projected 3D coordinates */}
                            <g transform={`translate(${posLug.x}, ${posLug.y})`}>
                                <rect x="-3.5" y="-5" width="7" height="10" rx="1.5" fill={`url(#motor-tab-grad-${id})`} stroke="#78350f" strokeWidth="0.8" />
                                <circle cx="0" cy="0" r="2.8" fill={`url(#solder-droplet-grad-${id})`} stroke="#475569" strokeWidth="0.6" />
                                <text x="0" y="-6.5" fill="#ef4444" fontSize="5" fontWeight="900" textAnchor="middle">+</text>
                            </g>

                            <g transform={`translate(${negLug.x}, ${negLug.y})`}>
                                <rect x="-3.5" y="-5" width="7" height="10" rx="1.5" fill={`url(#motor-tab-grad-${id})`} stroke="#78350f" strokeWidth="0.8" />
                                <circle cx="0" cy="0" r="2.8" fill={`url(#solder-droplet-grad-${id})`} stroke="#475569" strokeWidth="0.6" />
                                <text x="0" y="-6.5" fill="#38bdf8" fontSize="5" fontWeight="900" textAnchor="middle">−</text>
                            </g>

                            {/* Breadboard Header Solder Collars at (0, 0) and (48, 0) */}
                            <circle cx="0" cy="0" r="3.2" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                            <circle cx="48" cy="0" r="3.2" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                        </svg>

                        {/* 3D WEBGL MOTOR (POWERED BY THREE.JS) */}
                        {isMotor3D ? (
                            <div className="motor-3d-webgl-wrapper" style={{ position: "absolute", left: -56, top: -145, width: 160, height: 160, pointerEvents: "auto", cursor: "move" }}>
                                <ThreeMotorView 
                                    type="motor-dc"
                                    rot3D={currentRot}
                                    pitch3D={currentPitch}
                                    isSpinning={isSpinning}
                                    rpm={actualRpm}
                                    accessory={accessory}
                                    direction={actualDir}
                                />
                            </div>
                        ) : (
                            /* 2D HIGH-FIDELITY MABUCHI 130 MOTOR (MATCHING IMAGE 1 WITH ZERO-OFFSET PROPELLER) */
                            <div className="motor-2d-stage" style={{ position: "absolute", left: -36, top: -125, width: 120, height: 135, pointerEvents: "auto", cursor: "move" }}>
                                <svg viewBox="-36 -125 120 135" width="120" height="135" style={{ overflow: "visible" }}>
                                    <defs>
                                        <radialGradient id={`motor-can-grad-2d-${id}`} cx="38%" cy="32%" r="68%">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="25%" stopColor="#e2e8f0" />
                                            <stop offset="60%" stopColor="#94a3b8" />
                                            <stop offset="90%" stopColor="#475569" />
                                            <stop offset="100%" stopColor="#1e293b" />
                                        </radialGradient>

                                        <radialGradient id={`zinc-boss-grad-${id}`} cx="35%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#f8fafc" />
                                            <stop offset="45%" stopColor="#cbd5e1" />
                                            <stop offset="85%" stopColor="#64748b" />
                                            <stop offset="100%" stopColor="#475569" />
                                        </radialGradient>

                                        <radialGradient id={`bronze-bushing-grad-${id}`} cx="35%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#fef3c7" />
                                            <stop offset="40%" stopColor="#f59e0b" />
                                            <stop offset="80%" stopColor="#b45309" />
                                            <stop offset="100%" stopColor="#78350f" />
                                        </radialGradient>

                                        <linearGradient id={`prop-blade-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#38bdf8" />
                                            <stop offset="50%" stopColor="#0284c7" />
                                            <stop offset="100%" stopColor="#0369a1" />
                                        </linearGradient>
                                    </defs>

                                    {/* Main 130 Cylindrical Brushed Steel Can (Diameter 92px centered at 24, -65) */}
                                    <circle cx="24" cy="-65" r="46" fill={`url(#motor-can-grad-2d-${id})`} stroke="#475569" strokeWidth="2.5" filter="drop-shadow(0 10px 22px rgba(0,0,0,0.65))" />
                                    <circle cx="24" cy="-65" r="43" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                                    <circle cx="24" cy="-65" r="39" fill="#0f172a" opacity="0.08" />

                                    {/* Stamped Curved Side Ventilation Louvers (Left & Right as in Image 1) */}
                                    <g>
                                        <path d="M -11 -75 C -15 -70, -15 -60, -11 -55" stroke="#1e293b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                                        <path d="M -11 -75 C -15 -70, -15 -60, -11 -55" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
                                        <line x1="-13" y1="-67" x2="-10" y2="-67" stroke="#d97706" strokeWidth="2" />
                                        <line x1="-13" y1="-63" x2="-10" y2="-63" stroke="#b45309" strokeWidth="2" />
                                    </g>
                                    <g>
                                        <path d="M 59 -75 C 63 -70, 63 -60, 59 -55" stroke="#1e293b" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                                        <path d="M 59 -75 C 63 -70, 63 -60, 59 -55" stroke="#cbd5e1" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.7" />
                                        <line x1="57" y1="-67" x2="60" y2="-67" stroke="#d97706" strokeWidth="2" />
                                        <line x1="57" y1="-63" x2="60" y2="-63" stroke="#b45309" strokeWidth="2" />
                                    </g>

                                    {/* Two Threaded M2 Mounting Screw Holes Flanking Center Collar */}
                                    <circle cx="5" cy="-65" r="3.2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                                    <circle cx="5" cy="-65" r="1.8" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
                                    <circle cx="43" cy="-65" r="3.2" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                                    <circle cx="43" cy="-65" r="1.8" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.6" strokeDasharray="1.5 1.5" />

                                    {/* Laser Engraved Hardware Spec Stamping */}
                                    <text x="24" y="-95" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.08em" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>MABUCHI 130</text>
                                    <text x="24" y="-88" fill="#94a3b8" fontSize="4.5" fontWeight="bold" textAnchor="middle">3V - 6V DC</text>

                                    {/* Center Raised Zinc Bearing Boss Collar (Matching Image 1) */}
                                    <circle cx="24" cy="-65" r="16" fill={`url(#zinc-boss-grad-${id})`} stroke="#64748b" strokeWidth="1.8" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.45))" />
                                    <circle cx="24" cy="-65" r="13" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="0.8" />

                                    {/* Sintered Bronze Bushing Ring */}
                                    <circle cx="24" cy="-65" r="8" fill={`url(#bronze-bushing-grad-${id})`} stroke="#78350f" strokeWidth="1" />
                                    <circle cx="24" cy="-65" r="5" fill="#451a03" opacity="0.3" />

                                    {/* Hardened Steel Axle Rod in Center */}
                                    <circle cx="24" cy="-65" r="3.6" fill="#f8fafc" stroke="#334155" strokeWidth="1" />
                                    <circle cx="23" cy="-66" r="1.2" fill="#ffffff" />

                                    {/* 3-Blade Aerofoil Propeller Fan: 100% Centered directly at axle (24, -65) */}
                                    {!isAxleOnly && (
                                        <g transform="translate(24, -65)">
                                            <g ref={rotorRef}>
                                                <path d="M 0 0 C -6 -16, -11 -32, 0 -42 C 11 -32, 6 -16, 0 0" fill={`url(#prop-blade-grad-${id})`} stroke="#0284c7" strokeWidth="1.2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" />
                                                <path d="M 0 0 C -6 -16, -11 -32, 0 -42 C 11 -32, 6 -16, 0 0" fill={`url(#prop-blade-grad-${id})`} stroke="#0284c7" strokeWidth="1.2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" transform="rotate(120)" />
                                                <path d="M 0 0 C -6 -16, -11 -32, 0 -42 C 11 -32, 6 -16, 0 0" fill={`url(#prop-blade-grad-${id})`} stroke="#0284c7" strokeWidth="1.2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.4))" transform="rotate(240)" />

                                                <circle cx="0" cy="0" r="7.5" fill="radial-gradient(circle, #ffffff 0%, #cbd5e1 50%, #0284c7 100%)" stroke="#0369a1" strokeWidth="1.5" />
                                                <circle cx="0" cy="0" r="3.2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
                                            </g>
                                        </g>
                                    )}

                                    <text x="24" y="-28" fill="rgba(255,255,255,0.7)" fontSize="4.5" fontWeight="bold" textAnchor="middle">
                                        {isAxleOnly ? "BARE STEEL AXLE" : "3-BLADE PROPELLER"}
                                    </text>
                                </svg>
                            </div>
                        )}

                        {/* LIVE DIGITAL TACHOMETER / RPM OLED HUD TELEMETRY DISPLAY */}
                        <div className="motor-tachometer-hud" style={{ position: "absolute", left: 24, top: -140, transform: "translateX(-50%)" }}>
                            <div className={`tachometer-screen ${isSpinning ? "is-running" : "is-standby"}`}>
                                <div className="tachometer-top-row">
                                    <span className={`tach-pulse-led ${isSpinning ? "pulsing" : ""}`}></span>
                                    <span className="tach-title">130 TACHOMETER</span>
                                    <span className="tach-dir-badge">{actualDir.toUpperCase()}</span>
                                </div>
                                <div className="tachometer-main-val">
                                    <span ref={tachRpmRef} className="tach-number">{isSpinning ? actualRpm.toLocaleString() : "0"}</span>
                                    <span className="tach-unit">RPM</span>
                                </div>
                                <div className="tachometer-sub-bar">
                                    <span>{actualVoltage > 0 ? `${actualVoltage.toFixed(1)}V` : "0.0V"}</span>
                                    <span>•</span>
                                    <span>{actualCurrent > 0 ? `${actualCurrent}mA` : "0mA"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Positive Terminal Pin (0, 0) */}
                        <span 
                            className={`terminal-pin pin-motor-pos ${hoveredTerminal === "motPos" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("motPos")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "motPos", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onClick={(e) => handleTerminalPress(e, "motPos", 0, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                        />
                        {hoveredTerminal === "motPos" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (+) [Red]
                            </div>
                        )}

                        {/* Negative Terminal Pin (48, 0) */}
                        <span 
                            className={`terminal-pin pin-motor-neg ${hoveredTerminal === "motNeg" ? "targeted" : ""}`}
                            style={{ left: 48, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("motNeg")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "motNeg", 48, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 48, 0)}
                            onClick={(e) => handleTerminalPress(e, "motNeg", 48, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 48, 0)}
                        />
                        {hoveredTerminal === "motNeg" && (
                            <div className="terminal-hover-tooltip" style={{ left: 48, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (−) [Black]
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* TT GEARED DC MOTOR (YELLOW BO MOTOR): Ultra-Realistic 2D & 3D Interactive Model (Image 2) */}
            {(type === "motor-geared" || type === "motor-bo") && (() => {
                const isMotor3D = is3D !== false && viewMode !== "2d";
                const currentRot = rot3D != null ? rot3D : 35;
                const currentPitch = pitch3D != null ? pitch3D : 20;
                const motorSpeed = speed != null ? speed : 100;
                const currentRatio = gearRatio || "1:48";

                // Gearbox calculation: 1:48 -> ~220 RPM, 1:120 -> ~90 RPM, 1:220 -> ~45 RPM
                const baseRpm = currentRatio === "1:220" ? 45 : currentRatio === "1:120" ? 90 : 220;

                // Live electrical simulation state
                const motorSim = simState || {};
                const isSpinning = Boolean(
                    isSimulating && motorSim.isSpinning && (motorSim.rpm > 0 || motorSim.voltage >= 1.0)
                );
                const actualRpm = isSpinning 
                    ? (motorSim.rpm || Math.round((motorSpeed / 100) * baseRpm)) 
                    : 0;
                const actualVoltage = isSpinning ? (motorSim.voltage || 0) : 0;
                const actualCurrent = isSpinning ? (motorSim.currentMa || 0) : 0;
                const actualDir = motorSim.direction || direction || "cw";

                const shaftDuration = isSpinning && actualRpm > 0 
                    ? `${Math.max(0.04, (60 / actualRpm)).toFixed(3)}s` 
                    : "0.27s";

                // 3D Lug projection math for the flexible hookup leads
                const radY = (currentRot * Math.PI) / 180;
                const radX = (currentPitch * Math.PI) / 180;

                const projectLug = (x0, y0, z0) => {
                    const x1 = x0 * Math.cos(radY) + z0 * Math.sin(radY);
                    const y1 = y0;
                    const z1 = -x0 * Math.sin(radY) + z0 * Math.cos(radY);

                    const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
                    const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

                    return {
                        x: Math.round(24 + x1),
                        y: Math.round(-70 + y2),
                        z: z2
                    };
                };

                const posLug = projectLug(-14, 22, -24);
                const negLug = projectLug(14, 22, -24);

                // Natural flexible silicone hookup leads drooping down to breadboard pins (0, 0) and (48, 0)
                const redC1X = Math.round(posLug.x + (0 - posLug.x) * 0.35);
                const redC1Y = Math.round(posLug.y + Math.max(16, (0 - posLug.y) * 0.45));
                const redC2X = Math.round(0 + (posLug.x - 0) * 0.15);
                const redC2Y = -18;
                const redLeadPath = `M ${posLug.x} ${posLug.y} C ${redC1X} ${redC1Y}, ${redC2X} ${redC2Y}, 0 0`;

                const blkC1X = Math.round(negLug.x + (48 - negLug.x) * 0.35);
                const blkC1Y = Math.round(negLug.y + Math.max(16, (0 - negLug.y) * 0.45));
                const blkC2X = Math.round(48 + (negLug.x - 48) * 0.15);
                const blkC2Y = -18;
                const blkLeadPath = `M ${negLug.x} ${negLug.y} C ${blkC1X} ${blkC1Y}, ${blkC2X} ${blkC2Y}, 48 0`;

                return (
                    <div className={`geared-motor-container ${isSpinning ? "is-spinning" : ""} ${isMotor3D ? "mode-3d" : "mode-2d"}`}>
                        {/* DYNAMIC FLEXIBLE SILICONE HOOKUP LEADS (SVG) */}
                        <svg className="dc-motor-dynamic-leads-svg" viewBox="-50 -140 150 155" style={{ position: "absolute", left: -50, top: -140, width: 150, height: 155, pointerEvents: "none", overflow: "visible" }}>
                            <defs>
                                <linearGradient id={`geared-tab-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#f59e0b" />
                                    <stop offset="50%" stopColor="#d97706" />
                                    <stop offset="100%" stopColor="#78350f" />
                                </linearGradient>
                                <radialGradient id={`geared-solder-grad-${id}`} cx="35%" cy="35%" r="65%">
                                    <stop offset="0%" stopColor="#f8fafc" />
                                    <stop offset="40%" stopColor="#cbd5e1" />
                                    <stop offset="100%" stopColor="#64748b" />
                                </radialGradient>
                                <filter id={`geared-wire-shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.55" />
                                </filter>
                            </defs>

                            {/* Drop Shadows */}
                            <path d={redLeadPath} stroke="rgba(0,0,0,0.4)" strokeWidth="5.5" strokeLinecap="round" fill="none" filter={`url(#geared-wire-shadow-${id})`} />
                            <path d={blkLeadPath} stroke="rgba(0,0,0,0.4)" strokeWidth="5.5" strokeLinecap="round" fill="none" filter={`url(#geared-wire-shadow-${id})`} />

                            {/* Red Lead (+) */}
                            <path d={redLeadPath} stroke="#dc2626" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                            <path d={redLeadPath} stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />

                            {/* Black Lead (−) */}
                            <path d={blkLeadPath} stroke="#18181b" strokeWidth="3.6" strokeLinecap="round" fill="none" />
                            <path d={blkLeadPath} stroke="#52525b" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.8" />

                            {/* Solder Tabs */}
                            <g transform={`translate(${posLug.x}, ${posLug.y})`}>
                                <rect x="-3.5" y="-5" width="7" height="10" rx="1.5" fill={`url(#geared-tab-grad-${id})`} stroke="#78350f" strokeWidth="0.8" />
                                <circle cx="0" cy="0" r="2.8" fill={`url(#geared-solder-grad-${id})`} stroke="#475569" strokeWidth="0.6" />
                                <text x="0" y="-6.5" fill="#ef4444" fontSize="5" fontWeight="900" textAnchor="middle">+</text>
                            </g>
                            <g transform={`translate(${negLug.x}, ${negLug.y})`}>
                                <rect x="-3.5" y="-5" width="7" height="10" rx="1.5" fill={`url(#geared-tab-grad-${id})`} stroke="#78350f" strokeWidth="0.8" />
                                <circle cx="0" cy="0" r="2.8" fill={`url(#geared-solder-grad-${id})`} stroke="#475569" strokeWidth="0.6" />
                                <text x="0" y="-6.5" fill="#38bdf8" fontSize="5" fontWeight="900" textAnchor="middle">−</text>
                            </g>

                            {/* Breadboard Header Pins at (0, 0) and (48, 0) */}
                            <circle cx="0" cy="0" r="3.2" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                            <circle cx="48" cy="0" r="3.2" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                        </svg>

                        {/* 3D WEBGL YELLOW BO GEARBOX MOTOR (POWERED BY THREE.JS) */}
                        {isMotor3D ? (
                            <div className="geared-motor-3d-webgl-wrapper" style={{ position: "absolute", left: -56, top: -150, width: 160, height: 160, pointerEvents: "auto", cursor: "move" }}>
                                <ThreeMotorView 
                                    type="motor-geared"
                                    rot3D={currentRot}
                                    pitch3D={currentPitch}
                                    isSpinning={isSpinning}
                                    rpm={actualRpm}
                                    direction={actualDir}
                                    gearRatio={currentRatio}
                                />
                            </div>
                        ) : (
                            /* 2D HIGH-FIDELITY TT BO GEARED MOTOR (IMAGE 2) */
                            <div className="geared-motor-2d-stage" style={{ position: "absolute", left: -36, top: -140, width: 120, height: 145, pointerEvents: "auto", cursor: "move" }}>
                                <svg viewBox="-36 -140 120 145" width="120" height="145" style={{ overflow: "visible" }}>
                                    <defs>
                                        <linearGradient id={`yellow-abs-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#fef08a" />
                                            <stop offset="25%" stopColor="#facc15" />
                                            <stop offset="85%" stopColor="#eab308" />
                                            <stop offset="100%" stopColor="#ca8a04" />
                                        </linearGradient>

                                        <linearGradient id={`silver-can-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="30%" stopColor="#cbd5e1" />
                                            <stop offset="70%" stopColor="#94a3b8" />
                                            <stop offset="100%" stopColor="#475569" />
                                        </linearGradient>

                                        <linearGradient id={`clear-strap-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                                            <stop offset="40%" stopColor="rgba(241,245,249,0.35)" />
                                            <stop offset="70%" stopColor="rgba(241,245,249,0.55)" />
                                            <stop offset="100%" stopColor="rgba(203,213,225,0.75)" />
                                        </linearGradient>

                                        <radialGradient id={`nylon-dshaft-grad-${id}`} cx="35%" cy="35%" r="65%">
                                            <stop offset="0%" stopColor="#ffffff" />
                                            <stop offset="65%" stopColor="#f1f5f9" />
                                            <stop offset="100%" stopColor="#cbd5e1" />
                                        </radialGradient>
                                    </defs>

                                    {/* Ambient Drop Shadow */}
                                    <rect x="-14" y="-128" width="76" height="96" rx="8" fill="rgba(0,0,0,0.55)" filter="blur(6px)" />

                                    {/* 1. Yellow ABS Gearbox Main Body */}
                                    <path 
                                        d="M -12 -124 L 56 -124 Q 60 -124 60 -120 L 60 -64 Q 60 -60 56 -60 L 46 -60 L 46 -38 Q 46 -34 42 -34 L 6 -34 Q 2 -34 2 -38 L 2 -60 L -8 -60 Q -12 -60 -12 -64 Z" 
                                        fill={`url(#yellow-abs-grad-${id})`} 
                                        stroke="#a16207" 
                                        strokeWidth="2" 
                                    />

                                    <path d="M -10 -122 L 54 -122" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" strokeLinecap="round" />
                                    <path d="M -10 -122 L -10 -62" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round" />

                                    {/* Assembly Screws (Silver Phillips Screws as seen in Image 2) */}
                                    <circle cx="-4" cy="-116" r="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                    <line x1="-5.5" y1="-116" x2="-2.5" y2="-116" stroke="#475569" strokeWidth="0.8" />
                                    <line x1="-4" y1="-117.5" x2="-4" y2="-114.5" stroke="#475569" strokeWidth="0.8" />

                                    <circle cx="50" cy="-116" r="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                    <line x1="48.5" y1="-116" x2="51.5" y2="-116" stroke="#475569" strokeWidth="0.8" />
                                    <line x1="50" y1="-117.5" x2="50" y2="-114.5" stroke="#475569" strokeWidth="0.8" />

                                    <circle cx="50" cy="-68" r="3" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
                                    <line x1="48.5" y1="-68" x2="51.5" y2="-68" stroke="#475569" strokeWidth="0.8" />
                                    <line x1="50" y1="-69.5" x2="50" y2="-66.5" stroke="#475569" strokeWidth="0.8" />

                                    {/* Molded Mounting Eyelet Hole */}
                                    <circle cx="-3" cy="-72" r="3.5" fill="#ca8a04" stroke="#854d0e" strokeWidth="1" />
                                    <circle cx="-3" cy="-72" r="1.8" fill="#0f172a" />

                                    {/* 2. Rear Cylindrical 130 DC Motor Casing */}
                                    <rect x="4" y="-56" width="40" height="30" rx="4" fill={`url(#silver-can-grad-${id})`} stroke="#475569" strokeWidth="1.5" />
                                    <line x1="6" y1="-42" x2="42" y2="-42" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />

                                    {/* 3. Translucent Clear Plastic Retention Strap (Iconic White/Clear Strap in Image 2) */}
                                    <rect x="1" y="-48" width="46" height="12" rx="2.5" fill={`url(#clear-strap-grad-${id})`} stroke="rgba(203,213,225,0.9)" strokeWidth="1.2" />
                                    <rect x="-1" y="-49" width="4" height="14" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
                                    <rect x="45" y="-49" width="4" height="14" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />

                                    {/* Rear White Nylon Endbell with Solder Eyelets */}
                                    <rect x="10" y="-27" width="28" height="7" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                    <rect x="12" y="-22" width="6" height="4" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />
                                    <circle cx="15" cy="-20" r="1.5" fill="#e2e8f0" />
                                    <rect x="30" y="-22" width="6" height="4" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />
                                    <circle cx="33" cy="-20" r="1.5" fill="#e2e8f0" />

                                    {/* 4. Output Shaft Boss & White Nylon D-Shaft (Image 2) */}
                                    <circle cx="24" cy="-92" r="15" fill="#eab308" stroke="#a16207" strokeWidth="1.5" />
                                    <circle cx="24" cy="-92" r="11" fill="#facc15" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />

                                    {/* High-Contrast Slotted Optical Speed Encoder Disc & Neon Indicator Cross */}
                                    <g transform="translate(24, -92)">
                                        <g ref={rotorRef}>
                                            {/* Optical Speed Encoder Outer Strobe Ring (38px diameter) */}
                                            <circle cx="0" cy="0" r="19" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" filter="drop-shadow(0 3px 6px rgba(0,0,0,0.5))" />
                                            <circle cx="0" cy="0" r="15" fill="none" stroke="#facc15" strokeWidth="2.8" strokeDasharray="3.2 2.5" />
                                            <circle cx="0" cy="0" r="11" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />

                                            {/* High-Visibility Neon Orange Radial Cross Indicator Arms */}
                                            <rect x="-16" y="-2" width="32" height="4" rx="1.5" fill="#f97316" stroke="#c2410c" strokeWidth="0.6" />
                                            <rect x="-2" y="-16" width="4" height="32" rx="1.5" fill="#f97316" stroke="#c2410c" strokeWidth="0.6" />

                                            {/* Direction Indicator Tip Beacon (neon green) */}
                                            <circle cx="13" cy="0" r="2.8" fill="#22c55e" stroke="#15803d" strokeWidth="0.6" filter="drop-shadow(0 0 4px #22c55e)" />
                                            <circle cx="13" cy="0" r="1" fill="#ffffff" />

                                            {/* Central Nylon Shaft Boss with Double-Flat D-Shaft Keyway */}
                                            <circle cx="0" cy="0" r="6" fill={`url(#nylon-dshaft-grad-${id})`} stroke="#94a3b8" strokeWidth="0.8" />
                                            <path d="M -3 -5.5 L 3 -5.5 L 5.5 -2 L 5.5 2 L 3 5.5 L -3 5.5 L -5.5 2 L -5.5 -2 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
                                            <circle cx="0" cy="0" r="1.8" fill="#64748b" />
                                        </g>
                                    </g>

                                    {/* Gearbox Specs Label */}
                                    <text x="24" y="-112" fill="#78350f" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.04em">TT BO MOTOR</text>
                                    <text x="24" y="-76" fill="#854d0e" fontSize="5" fontWeight="bold" textAnchor="middle">
                                        {currentRatio} • {actualRpm} RPM
                                    </text>
                                </svg>
                            </div>
                        )}

                        {/* LIVE DIGITAL TACHOMETER / RPM OLED HUD TELEMETRY DISPLAY */}
                        <div className="motor-tachometer-hud" style={{ position: "absolute", left: 24, top: -145, transform: "translateX(-50%)" }}>
                            <div className={`tachometer-screen ${isSpinning ? "is-running" : "is-standby"}`}>
                                <div className="tachometer-top-row">
                                    <span className={`tach-pulse-led ${isSpinning ? "pulsing" : ""}`}></span>
                                    <span className="tach-title">TT TACHOMETER</span>
                                    <span className="tach-dir-badge">{actualDir.toUpperCase()}</span>
                                </div>
                                <div className="tachometer-main-val">
                                    <span ref={tachRpmRef} className="tach-number">{isSpinning ? actualRpm.toLocaleString() : "0"}</span>
                                    <span className="tach-unit">RPM</span>
                                </div>
                                <div className="tachometer-sub-bar">
                                    <span>{actualVoltage > 0 ? `${actualVoltage.toFixed(1)}V` : "0.0V"}</span>
                                    <span>•</span>
                                    <span>{actualCurrent > 0 ? `${actualCurrent}mA` : "0mA"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Positive Terminal Pin (0, 0) */}
                        <span 
                            className={`terminal-pin pin-geared-pos ${hoveredTerminal === "gbPos" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("gbPos")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "gbPos", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onClick={(e) => handleTerminalPress(e, "gbPos", 0, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                        />
                        {hoveredTerminal === "gbPos" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (+) [Red]
                            </div>
                        )}

                        {/* Negative Terminal Pin (48, 0) */}
                        <span 
                            className={`terminal-pin pin-geared-neg ${hoveredTerminal === "gbNeg" ? "targeted" : ""}`}
                            style={{ left: 48, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("gbNeg")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "gbNeg", 48, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 48, 0)}
                            onClick={(e) => handleTerminalPress(e, "gbNeg", 48, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 48, 0)}
                        />
                        {hoveredTerminal === "gbNeg" && (
                            <div className="terminal-hover-tooltip" style={{ left: 48, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Motor (−) [Black]
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* SG90 MICRO SERVO (HUGE REALISTIC FULL-SCALE SVG WITH ROTATING HORN): Pins GND (0, 0), 5V (16, 0), PWM (32, 0) */}
            {type === "servo-sg90" && (() => {
                const isPowered = Boolean(isSimulating && simState?.isPowered);
                const hornAngle = angle != null ? angle : 90;
                return (
                    <div className={`servo-sg90-container ${isPowered ? "is-powered" : "is-unpowered"}`}>
                        <svg className="servo-realistic-svg" viewBox="-80 -165 192 175" width="192" height="175" style={{ position: "absolute", left: -80, top: -165, pointerEvents: "auto", cursor: "move" }}>
                            {/* Full Hit-Box to ensure 100% reliable click-to-select anywhere on servo */}
                            <rect x="-80" y="-165" width="192" height="175" fill="transparent" pointerEvents="all" cursor="pointer" />
                            {/* Translucent Cobalt Sky Blue Servo Enclosure: Width 140px, Height 86px from Y=-146 to Y=-60 */}
                            <rect x="-54" y="-146" width="140" height="86" rx="7" fill={isPowered ? "#0284c7" : "#0f3a56"} stroke={isPowered ? "#0369a1" : "#082f49"} strokeWidth="2.5" filter="drop-shadow(0 10px 24px rgba(0,0,0,0.65))" />
                            <rect x="-48" y="-140" width="128" height="4" fill={isPowered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"} rx="2" />

                            {/* Status Header Badge (Tells user if 5V power is connected) */}
                            <g transform="translate(16, -141)">
                                <rect x="-48" y="0" width="96" height="11" rx="3" fill={isPowered ? "#064e3b" : "#18181b"} stroke={isPowered ? "#10b981" : "#3f3f46"} strokeWidth="0.8" />
                                <circle cx="-40" cy="5.5" r="2.8" fill={isPowered ? "#34d399" : "#64748b"} filter={isPowered ? "drop-shadow(0 0 4px #34d399)" : "none"} />
                                <text x="4" y="8" fill={isPowered ? "#ecfdf5" : "#94a3b8"} fontSize="6" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                                    {isPowered ? `5V ACTIVE • ${hornAngle}°` : "OFF • UNPOWERED"}
                                </text>
                            </g>

                            {/* Left & Right Mounting Flanges with Brass Eyelets & Mounting Screws */}
                            {/* Left Flange */}
                            <rect x="-76" y="-115" width="22" height="26" rx="3" fill={isPowered ? "#0284c7" : "#0f3a56"} stroke={isPowered ? "#0369a1" : "#082f49"} strokeWidth="1.8" />
                            <circle cx="-65" cy="-102" r="4.2" fill="#ca8a04" stroke="#713f12" strokeWidth="1.2" />
                            <circle cx="-65" cy="-102" r="2.2" fill="#0f172a" />
                            {/* Right Flange */}
                            <rect x="86" y="-115" width="22" height="26" rx="3" fill={isPowered ? "#0284c7" : "#0f3a56"} stroke={isPowered ? "#0369a1" : "#082f49"} strokeWidth="1.8" />
                            <circle cx="97" cy="-102" r="4.2" fill="#ca8a04" stroke="#713f12" strokeWidth="1.2" />
                            <circle cx="97" cy="-102" r="2.2" fill="#0f172a" />

                            {/* Splined Drive Gear Output Shaft Hub (Center at (16, -112)) */}
                            <circle cx="16" cy="-112" r="18" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.3))" />

                            {/* Large Rotating White Nylon Servo Horn with multiple linkage pushrod holes */}
                            <g style={{ transform: `rotate(${hornAngle - 90}deg)`, transformOrigin: "16px -112px", transition: "transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1)" }}>
                                <rect x="-38" y="-120" width="108" height="16" rx="8" fill={isPowered ? "#ffffff" : "#cbd5e1"} stroke="#94a3b8" strokeWidth="1.5" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.4))" />
                                <circle cx="-26" cy="-112" r="2.5" fill="#475569" />
                                <circle cx="-14" cy="-112" r="2.5" fill="#475569" />
                                <circle cx="46" cy="-112" r="2.5" fill="#475569" />
                                <circle cx="58" cy="-112" r="2.5" fill="#475569" />
                                {/* Center Mounting Phillips Screw */}
                                <circle cx="16" cy="-112" r="5" fill="#0f172a" />
                                <line x1="12.5" y1="-112" x2="19.5" y2="-112" stroke="#e2e8f0" strokeWidth="1.2" />
                                <line x1="16" y1="-115.5" x2="16" y2="-108.5" stroke="#e2e8f0" strokeWidth="1.2" />
                            </g>

                            {/* Silkscreen Brand Label on Servo Body */}
                            <text x="16" y="-88" fill="#ffffff" fontSize="9.5" fontWeight="900" textAnchor="middle" letterSpacing="0.06em">MICRO SERVO SG90</text>
                            <text x="16" y="-74" fill={isPowered ? "#bae6fd" : "#64748b"} fontSize="6.5" fontWeight="800" textAnchor="middle">9g • TWINLAB X</text>

                            {/* 3-Color Flexible Ribbon Cable (Brown GND, Red 5V, Orange PWM) gracefully looping down */}
                            <path d="M 4 -60 C -4 -40, -4 -25, 0 -12" stroke="#78350f" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                            <path d="M 16 -60 C 16 -40, 16 -25, 16 -12" stroke="#dc2626" strokeWidth="4.2" strokeLinecap="round" fill="none" />
                            <path d="M 28 -60 C 36 -40, 36 -25, 32 -12" stroke="#f97316" strokeWidth="4.2" strokeLinecap="round" fill="none" />

                            {/* Molded Black DuPont Connector Housing Block from Y=-14 to Y=-4 */}
                            <rect x="-6" y="-14" width="44" height="10" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />

                            {/* Crisp Silkscreen Pin Badges on Connector */}
                            <rect x="-6" y="-22" width="44" height="7.5" rx="1.5" fill="rgba(15, 23, 42, 0.9)" stroke="#334155" strokeWidth="0.8" />
                            <text x="0" y="-16.5" fill="#f8fafc" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="monospace">GND</text>
                            <text x="16" y="-16.5" fill={isPowered ? "#fca5a5" : "#f8fafc"} fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="monospace">5V</text>
                            <text x="32" y="-16.5" fill="#f8fafc" fontSize="5" fontWeight="900" textAnchor="middle" fontFamily="monospace">PWM</text>

                            {/* 3 Gold Header Terminal Pins extending to (0, 0), (16, 0), (32, 0) */}
                            <rect x="-2.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="13.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="29.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                        </svg>

                        {/* 3 Header Pins with Interactive Hover Tooltips */}
                        {[
                            { name: "GND", x: 0, label: "GND (Brown Wire • Ground)", color: "#78350f" },
                            { name: "5V", x: 16, label: "5V (Red Wire • Power +5V)", color: "#dc2626" },
                            { name: "PWM", x: 32, label: "PWM (Orange Wire • Signal)", color: "#f97316" }
                        ].map((pin) => (
                            <React.Fragment key={pin.name}>
                                <span
                                    className={`terminal-pin pin-servo-${pin.name.toLowerCase()} ${hoveredTerminal === `servo_${pin.name}` ? "targeted" : ""}`}
                                    style={{ left: pin.x, top: 0, transform: "translate(-50%, -50%)" }}
                                    onMouseEnter={() => setHoveredTerminal(`servo_${pin.name}`)}
                                    onMouseLeave={() => setHoveredTerminal(null)}
                                    onMouseDown={(e) => handleTerminalMouseDown(e, `servo_${pin.name}`, pin.x, 0)}
                                    onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 0)}
                                    onClick={(e) => handleTerminalPress(e, `servo_${pin.name}`, pin.x, 0)}
                                    onDoubleClick={(e) => handleTerminalAction(e, pin.x, 0)}
                                />
                                {hoveredTerminal === `servo_${pin.name}` && (
                                    <div className="terminal-hover-tooltip" style={{ left: pin.x, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        {pin.label}
                                    </div>
                                )}
                            </React.Fragment>
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
                    { num: 14, name: "VCC", x: 0, is5V: true, desc: "Power +5V" },
                    { num: 13, name: "4B", x: 16, desc: "Input 4B" },
                    { num: 12, name: "4A", x: 32, desc: "Input 4A" },
                    { num: 11, name: "4Y", x: 48, isOut: true, desc: "Output 4Y" },
                    { num: 10, name: "3B", x: 64, desc: "Input 3B" },
                    { num: 9, name: "3A", x: 80, desc: "Input 3A" },
                    { num: 8, name: "3Y", x: 96, isOut: true, desc: "Output 3Y" }
                ];
                const bottomPins = [
                    { num: 1, name: "1A", x: 0, desc: "Input 1A" },
                    { num: 2, name: "1B", x: 16, desc: "Input 1B" },
                    { num: 3, name: "1Y", x: 32, isOut: true, desc: "Output 1Y" },
                    { num: 4, name: "2A", x: 48, desc: "Input 2A" },
                    { num: 5, name: "2B", x: 64, desc: "Input 2B" },
                    { num: 6, name: "2Y", x: 80, isOut: true, desc: "Output 2Y" },
                    { num: 7, name: "GND", x: 96, isGnd: true, desc: "Ground 0V" }
                ];
                const isPowered = Boolean(isSimulating && simState?.isPowered);

                return (
                    <div className={`dip14-ic-container ${isPowered ? "is-powered" : ""}`}>
                        {/* Metallic Through-Hole DIP Lead Fingers Connecting to Row e (Y=0) and Row f (Y=32) */}
                        <svg className="dip-leads-svg" viewBox="-4 -2 108 36" width="108" height="36" style={{ position: "absolute", top: -2, left: -4, pointerEvents: "none" }}>
                            {[0, 16, 32, 48, 64, 80, 96].map(px => (
                                <g key={`lead-${px}`}>
                                    {/* Top Pin Lead Line from Body (Y=6) to Breadboard Row e (Y=0) */}
                                    <line x1={px} y1="0" x2={px} y2="8" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
                                    {/* Bottom Pin Lead Line from Body (Y=26) to Breadboard Row f (Y=32) */}
                                    <line x1={px} y1="24" x2={px} y2="32" stroke="#cbd5e1" strokeWidth="2.8" strokeLinecap="round" />
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

                        {/* Top Pins (14 down to 8 at Y=0) with Interactive Tooltips */}
                        {topPins.map((p) => (
                            <React.Fragment key={`top-${p.num}`}>
                                <span
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
                                {hoveredTerminal === `ic_${p.num}` && (
                                    <div className="terminal-hover-tooltip" style={{ left: p.x, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        Pin {p.num}: {p.name} ({p.desc})
                                    </div>
                                )}
                            </React.Fragment>
                        ))}

                        {/* Bottom Pins (1 to 7 at Y=32) with Interactive Tooltips */}
                        {bottomPins.map((p) => (
                            <React.Fragment key={`bot-${p.num}`}>
                                <span
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
                                {hoveredTerminal === `ic_${p.num}` && (
                                    <div className="terminal-hover-tooltip" style={{ left: p.x, top: 32, transform: `translate(-50%, 0) translateY(10px) rotate(${-(rotation || 0)}deg)` }}>
                                        Pin {p.num}: {p.name} ({p.desc})
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                );
            })()}

            {/* HC-SR04 ULTRASONIC DISTANCE SENSOR (HUGE REALISTIC FULL-SCALE SVG): Pins VCC (0, 0), Trig (16, 0), Echo (32, 0), GND (48, 0) */}
            {type === "sensor-ultrasonic" && (() => {
                const distCm = distanceCm != null ? distanceCm : 25;
                const isPowered = Boolean(isSimulating && simState?.isPowered);
                const isPinging = Boolean(isPowered && simState?.isPinging);
                return (
                    <div className={`ultrasonic-container ${isPinging ? "is-pinging" : ""} ${isPowered ? "is-powered" : "is-unpowered"}`}>
                        <svg className="ultrasonic-realistic-svg" viewBox="-100 -115 248 120" width="248" height="120" style={{ position: "absolute", left: -100, top: -115, pointerEvents: "auto", cursor: "move" }}>
                            {/* Full Hit-Box to ensure 100% reliable click-to-select anywhere on ultrasonic sensor */}
                            <rect x="-100" y="-115" width="248" height="120" fill="transparent" pointerEvents="all" cursor="pointer" />
                            <defs>
                                <radialGradient id={`sonar-transducer-grad-${id}`} cx="40%" cy="35%" r="65%">
                                    <stop offset="0%" stopColor="#f8fafc" />
                                    <stop offset="35%" stopColor="#e2e8f0" />
                                    <stop offset="70%" stopColor="#94a3b8" />
                                    <stop offset="100%" stopColor="#475569" />
                                </radialGradient>
                                <radialGradient id={`sonar-cone-grad-${id}`} cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#09090b" />
                                    <stop offset="70%" stopColor="#18181b" />
                                    <stop offset="100%" stopColor="#27272a" />
                                </radialGradient>
                            </defs>

                            {/* Blue FR-4 PCB: Width 220px, Height 96px from Y=-104 to Y=-8, X=-86 to X=134 */}
                            <rect x="-86" y="-104" width="220" height="96" rx="8" fill={isPowered ? "#0284c7" : "#0f3a56"} stroke={isPowered ? "#0369a1" : "#082f49"} strokeWidth="2.5" filter="drop-shadow(0 10px 24px rgba(0,0,0,0.65))" />

                            {/* 4 Corner Gold-Plated Mounting Holes with Annular Copper Rings */}
                            <circle cx="-76" cy="-94" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="-76" cy="-94" r="1.8" fill="#0f172a" />
                            <circle cx="124" cy="-94" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="124" cy="-94" r="1.8" fill="#0f172a" />
                            <circle cx="-76" cy="-18" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="-76" cy="-18" r="1.8" fill="#0f172a" />
                            <circle cx="124" cy="-18" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="124" cy="-18" r="1.8" fill="#0f172a" />

                            {/* Power Status LED */}
                            <circle cx="-72" cy="-70" r="3" fill={isPowered ? "#22c55e" : "#1e293b"} filter={isPowered ? "drop-shadow(0 0 4px #22c55e)" : "none"} />
                            <text x="-72" y="-76" fill={isPowered ? "#bbf7d0" : "#475569"} fontSize="4.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">PWR</text>

                            {/* 16MHz Metal Quartz Crystal in Center */}
                            <rect x="17.5" y="-70" width="13" height="26" rx="3.5" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2" />
                            <text x="24" y="-53" fill="#475569" fontSize="5" fontWeight="900" textAnchor="middle">16.0</text>

                            {/* Dual HUGE Aluminum Ultrasonic Transducers (Diameter 64px, radius 32px each) */}
                            {/* T (Transmitter) on Left: Center (-36, -56) */}
                            <circle cx="-36" cy="-56" r="32" fill={`url(#sonar-transducer-grad-${id})`} stroke={isPowered ? "#475569" : "#334155"} strokeWidth="2.8" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.45))" />
                            <circle cx="-36" cy="-56" r="29" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
                            <circle cx="-36" cy="-56" r="23" fill={`url(#sonar-cone-grad-${id})`} />
                            <circle cx="-36" cy="-56" r="14" fill="#334155" opacity="0.4" />
                            {/* Protective Metallic Speaker Mesh Hatch */}
                            <line x1="-50" y1="-56" x2="-22" y2="-56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <line x1="-36" y1="-70" x2="-36" y2="-42" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="-36" y="-50" fill="#f8fafc" fontSize="18" fontWeight="900" textAnchor="middle" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">T</text>

                            {/* R (Receiver) on Right: Center (84, -56) */}
                            <circle cx="84" cy="-56" r="32" fill={`url(#sonar-transducer-grad-${id})`} stroke={isPowered ? "#475569" : "#334155"} strokeWidth="2.8" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.45))" />
                            <circle cx="84" cy="-56" r="29" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" />
                            <circle cx="84" cy="-56" r="23" fill={`url(#sonar-cone-grad-${id})`} />
                            <circle cx="84" cy="-56" r="14" fill="#334155" opacity="0.4" />
                            {/* Protective Metallic Speaker Mesh Hatch */}
                            <line x1="70" y1="-56" x2="98" y2="-56" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <line x1="84" y1="-70" x2="84" y2="-42" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                            <text x="84" y="-50" fill="#f8fafc" fontSize="18" fontWeight="900" textAnchor="middle" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">R</text>

                            {/* Silkscreen Brand & Spec Labels */}
                            <text x="24" y="-88" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">HC-SR04</text>
                            <text x="24" y="-76" fill="rgba(255,255,255,0.75)" fontSize="5" fontWeight="700" textAnchor="middle">TWINLAB X</text>
                            <text x="24" y="-30" fill={isPowered ? "#a7f3d0" : "#64748b"} fontSize={isPowered ? "7.5" : "6.5"} fontWeight="900" textAnchor="middle">
                                {isPowered ? `${distCm} cm` : "OFF • 0V"}
                            </text>

                            {/* Black DuPont Connector Block at Y=-14 to Y=-4 */}
                            <rect x="-6" y="-14" width="60" height="10" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />

                            {/* Pin Labels directly above the 4 pins without colliding with TWINLAB X */}
                            <text x="0" y="-17" fill={isPowered ? "#86efac" : "#f8fafc"} fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">VCC</text>
                            <text x="16" y="-17" fill="#f8fafc" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">TRIG</text>
                            <text x="32" y="-17" fill="#f8fafc" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">ECHO</text>
                            <text x="48" y="-17" fill="#f8fafc" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">GND</text>

                            {/* 4 Gold Header Pins extending from Y=-6 to Y=0 */}
                            <rect x="-2.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="13.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="29.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="45.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                        </svg>

                        {/* Dual Ultrasonic Sonar Waves on BOTH T (Transmitter) and R (Receiver) */}
                        {isPinging && (
                            <>
                                {/* Transmitter (T) Acoustic Sonar Pulses */}
                                <div className="sonar-ping-emitter emitter-transmitter" style={{ left: -36, top: -56 }}>
                                    <div className="sonar-wave wave-1"></div>
                                    <div className="sonar-wave wave-2"></div>
                                    <div className="sonar-wave wave-3"></div>
                                </div>

                                {/* Receiver (R) Echo Reflection Pulses */}
                                <div className="sonar-ping-emitter emitter-receiver" style={{ left: 84, top: -56 }}>
                                    <div className="sonar-wave wave-1 echo-wave"></div>
                                    <div className="sonar-wave wave-2 echo-wave"></div>
                                    <div className="sonar-wave wave-3 echo-wave"></div>
                                </div>

                                {/* Front Combined Acoustic Radar Arcs */}
                                <div className="sonar-acoustic-cone" style={{ left: 24, top: -56 }}>
                                    <div className="sonar-cone-arc arc-1"></div>
                                    <div className="sonar-cone-arc arc-2"></div>
                                    <div className="sonar-cone-arc arc-3"></div>
                                </div>
                            </>
                        )}

                        {/* 4 Header Pins at Y=0 snapped to 16px breadboard grid with Interactive Hover Tooltips */}
                        {[
                            { name: "VCC", x: 0, label: "VCC (Power +5V)" },
                            { name: "Trig", x: 16, label: "TRIG (Trigger Pulse)" },
                            { name: "Echo", x: 32, label: "ECHO (Echo Receive)" },
                            { name: "GND", x: 48, label: "GND (Ground)" }
                        ].map((pin) => (
                            <React.Fragment key={pin.name}>
                                <span
                                    className={`terminal-pin pin-sonar-${pin.name.toLowerCase()} ${hoveredTerminal === `sonar_${pin.name}` ? "targeted" : ""}`}
                                    style={{ left: pin.x, top: 0, transform: "translate(-50%, -50%)" }}
                                    onMouseEnter={() => setHoveredTerminal(`sonar_${pin.name}`)}
                                    onMouseLeave={() => setHoveredTerminal(null)}
                                    onMouseDown={(e) => handleTerminalMouseDown(e, `sonar_${pin.name}`, pin.x, 0)}
                                    onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 0)}
                                    onClick={(e) => handleTerminalPress(e, `sonar_${pin.name}`, pin.x, 0)}
                                    onDoubleClick={(e) => handleTerminalAction(e, pin.x, 0)}
                                />
                                {hoveredTerminal === `sonar_${pin.name}` && (
                                    <div className="terminal-hover-tooltip" style={{ left: pin.x, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        {pin.label}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                );
            })()}

            {/* PIR MOTION SENSOR (HUGE REALISTIC FULL-SCALE SVG): Pins VCC (0, 0), OUT (16, 0), GND (32, 0) */}
            {type === "sensor-pir" && (() => {
                const isPowered = Boolean(isSimulating && simState?.isPowered);
                const isMotion = Boolean(isPowered && (simState?.isMotion || motionActive));
                const isScanning = Boolean(isPowered && simState?.isScanning);
                return (
                    <div className={`pir-container ${isScanning ? "is-scanning" : ""} ${isPowered ? "is-powered" : "is-unpowered"} ${isMotion ? "motion-active" : ""}`}>
                        <svg className="pir-realistic-svg" viewBox="-95 -145 220 150" width="220" height="150" style={{ position: "absolute", left: -95, top: -145, pointerEvents: "auto", cursor: "move" }}>
                            {/* Full Hit-Box to ensure 100% reliable click-to-select anywhere on PIR motion sensor */}
                            <rect x="-95" y="-145" width="220" height="150" fill="transparent" pointerEvents="all" cursor="pointer" />
                            {/* Dark Green FR-4 PCB: Width 200px, Height 124px from Y=-132 to Y=-8, X=-84 to X=116 */}
                            <rect x="-84" y="-132" width="200" height="124" rx="8" fill={isPowered ? "#15803d" : "#0d4a22"} stroke={isPowered ? "#166534" : "#062b14"} strokeWidth="2.5" filter="drop-shadow(0 10px 24px rgba(0,0,0,0.65))" />

                            {/* 4 Corner Gold Mounting Holes with Annular Copper Rings */}
                            <circle cx="-74" cy="-122" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="-74" cy="-122" r="1.8" fill="#0f172a" />
                            <circle cx="106" cy="-122" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="106" cy="-122" r="1.8" fill="#0f172a" />
                            <circle cx="-74" cy="-18" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="-74" cy="-18" r="1.8" fill="#0f172a" />
                            <circle cx="106" cy="-18" r="3.5" fill="#ca8a04" stroke="#713f12" strokeWidth="1" />
                            <circle cx="106" cy="-18" r="1.8" fill="#0f172a" />

                            {/* Power LED (PWR) */}
                            <circle cx="-74" cy="-30" r="3" fill={isPowered ? "#22c55e" : "#1e293b"} filter={isPowered ? "drop-shadow(0 0 4px #22c55e)" : "none"} />
                            <text x="-74" y="-36" fill={isPowered ? "#86efac" : "#475569"} fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">PWR</text>

                            {/* Detection LED (OUT) */}
                            <circle cx="104" cy="-30" r="3" fill={isMotion ? "#f59e0b" : "#451a03"} filter={isMotion ? "drop-shadow(0 0 6px #f59e0b)" : "none"} />
                            <text x="104" y="-36" fill={isMotion ? "#fde68a" : "#64748b"} fontSize="4.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">OUT</text>

                            {/* Dual Large SMD Trimmer Potentiometers (Sensitivity & Time Delay) */}
                            {/* Left Trimmer (Sx - Sensitivity) */}
                            <rect x="-68" y="-78" width="16" height="24" rx="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
                            <circle cx="-60" cy="-66" r="6" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                            <line x1="-64" y1="-66" x2="-56" y2="-66" stroke="#451a03" strokeWidth="1.8" />
                            <line x1="-60" y1="-70" x2="-60" y2="-62" stroke="#451a03" strokeWidth="1.8" />
                            <text x="-60" y="-82" fill="#fde68a" fontSize="5" fontWeight="bold" textAnchor="middle">SENS</text>

                            {/* Right Trimmer (Tx - Time Delay) */}
                            <rect x="84" y="-78" width="16" height="24" rx="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
                            <circle cx="92" cy="-66" r="6" fill="#ca8a04" stroke="#78350f" strokeWidth="1" />
                            <line x1="88" y1="-66" x2="96" y2="-66" stroke="#451a03" strokeWidth="1.8" />
                            <line x1="92" y1="-70" x2="92" y2="-62" stroke="#451a03" strokeWidth="1.8" />
                            <text x="92" y="-82" fill="#fde68a" fontSize="5" fontWeight="bold" textAnchor="middle">TIME</text>

                            {/* Center: HUGE Hemispherical White Fresnel Dome (Diameter 80px, Radius 40px at (16, -70)) */}
                            <circle cx="16" cy="-70" r="40" fill={isPowered ? "#f8fafc" : "#e2e8f0"} stroke={isPowered ? (isMotion ? "#f59e0b" : "#cbd5e1") : "#94a3b8"} strokeWidth={isMotion ? "3.5" : "2.5"} filter={isMotion ? "drop-shadow(0 0 16px rgba(245,158,11,0.5))" : "drop-shadow(0 6px 14px rgba(0,0,0,0.35))"} />
                            <circle cx="16" cy="-70" r="33" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                            <circle cx="16" cy="-70" r="26" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                            <circle cx="16" cy="-70" r="19" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                            <circle cx="16" cy="-70" r="12" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                            <circle cx="16" cy="-70" r="5" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                            {/* Geometric Faceted Hexagon/Diamond Grid Lines */}
                            <path d="M -18 -70 Q 16 -96 50 -70" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                            <path d="M -18 -70 Q 16 -44 50 -70" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
                            <line x1="16" y1="-110" x2="16" y2="-30" stroke="#94a3b8" strokeWidth="1.2" />
                            <line x1="-24" y1="-70" x2="56" y2="-70" stroke="#94a3b8" strokeWidth="1.2" />

                            {/* Silkscreen text (Properly spaced without collision) */}
                            <text x="16" y="-118" fill={isPowered ? (isMotion ? "#fde047" : "#bbf7d0") : "#64748b"} fontSize="8.5" fontWeight="900" textAnchor="middle" letterSpacing="0.05em">
                                {isPowered ? (isMotion ? "🚨 MOTION DETECTED (HIGH)" : "PIR MOTION SENSOR") : "HC-SR501 (STANDBY / OFF)"}
                            </text>
                            <text x="16" y="-106" fill={isPowered ? "rgba(255,255,255,0.75)" : "#64748b"} fontSize="5.5" fontWeight="700" textAnchor="middle">
                                {isPowered ? "HC-SR501 • TWINLAB X" : "CONNECT VCC & GND TO ARM"}
                            </text>

                            {/* Black DuPont Connector Block at Y=-14 to Y=-4 */}
                            <rect x="-6" y="-14" width="44" height="10" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.2" />

                            {/* Pin labels (Clean and separated from silkscreen brand) */}
                            <text x="0" y="-17" fill={isPowered ? "#86efac" : "#f8fafc"} fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">VCC</text>
                            <text x="16" y="-17" fill={isMotion ? "#fde047" : "#f8fafc"} fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">OUT</text>
                            <text x="32" y="-17" fill="#f8fafc" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="monospace">GND</text>

                            {/* 3 Gold Header Pins at Y=0 */}
                            <rect x="-2.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="13.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                            <rect x="29.5" y="-6" width="5" height="7" rx="1" fill="#ca8a04" stroke="#713f12" strokeWidth="0.8" />
                        </svg>

                        {/* Interactive Direct Trigger Button on PIR Sensor */}
                        {isPowered && (
                            <button
                                type="button"
                                className="pir-motion-direct-trigger"
                                style={{
                                    position: "absolute",
                                    left: 16,
                                    top: -152,
                                    transform: "translateX(-50%)",
                                    background: isMotion ? "#f59e0b" : "rgba(15, 23, 42, 0.92)",
                                    color: isMotion ? "#000" : "#38bdf8",
                                    border: `1.5px solid ${isMotion ? "#fbbf24" : "rgba(56, 189, 248, 0.5)"}`,
                                    borderRadius: 18,
                                    padding: "4px 10px",
                                    fontSize: 10,
                                    fontWeight: 800,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    boxShadow: isMotion ? "0 0 16px rgba(245, 158, 11, 0.6)" : "0 4px 12px rgba(0,0,0,0.5)",
                                    zIndex: 10,
                                    whiteSpace: "nowrap"
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const nextMotion = !isMotion;
                                    onUpdate && onUpdate({ motionActive: nextMotion });
                                    if (nextMotion) {
                                        try { soundManager.playSensorPing("pir"); } catch (_) {}
                                    }
                                }}
                                title="Click to Simulate Human Motion in Field of View"
                            >
                                <i className={isMotion ? "ri-user-voice-fill" : "ri-hand"}></i>
                                <span>{isMotion ? "Motion Active (3.3V)" : "Simulate Motion"}</span>
                            </button>
                        )}

                        {/* Perfectly Wrapped 80px Circular Fresnel Dome Radar Scanning Animation */}
                        {isScanning && (
                            <div className="pir-radar-container" style={{ position: "absolute", left: 16, top: -70, width: 80, height: 80, transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
                                <div className="pir-radar-beam"></div>
                                <div className="pir-dome-pulse"></div>
                            </div>
                        )}

                        {/* 3 Header Pins with Interactive Hover Tooltips */}
                        {[
                            { name: "VCC", x: 0, label: "VCC (Power +5V)" },
                            { name: "OUT", x: 16, label: "OUT (Digital Motion Detect)" },
                            { name: "GND", x: 32, label: "GND (Ground)" }
                        ].map((pin) => (
                            <React.Fragment key={pin.name}>
                                <span
                                    className={`terminal-pin pin-pir-${pin.name.toLowerCase()} ${hoveredTerminal === `pir_${pin.name}` ? "targeted" : ""}`}
                                    style={{ left: pin.x, top: 0, transform: "translate(-50%, -50%)" }}
                                    onMouseEnter={() => setHoveredTerminal(`pir_${pin.name}`)}
                                    onMouseLeave={() => setHoveredTerminal(null)}
                                    onMouseDown={(e) => handleTerminalMouseDown(e, `pir_${pin.name}`, pin.x, 0)}
                                    onMouseUp={(e) => handleTerminalMouseUp(e, pin.x, 0)}
                                    onClick={(e) => handleTerminalPress(e, `pir_${pin.name}`, pin.x, 0)}
                                    onDoubleClick={(e) => handleTerminalAction(e, pin.x, 0)}
                                />
                                {hoveredTerminal === `pir_${pin.name}` && (
                                    <div className="terminal-hover-tooltip" style={{ left: pin.x, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                        {pin.label}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                );
            })()}

            {/* PRECISION TEMPERATURE SENSOR (TMP36 TO-92): Pins at (0, 0) VCC, (16, 0) VOUT, (32, 0) GND */}
            {(type === "sensor-temp" || type === "sensor-temperature") && (() => {
                const isPowered = Boolean(isSimulating && simState?.isPowered);
                const tempVal = temperature != null ? temperature : 25;
                const vOut = isPowered ? (simState?.voltageOut != null ? simState.voltageOut : (0.5 + tempVal * 0.01)) : 0;

                return (
                    <div className={`temp-sensor-container ${isPowered ? "is-powered" : ""}`}>
                        {/* High-Fidelity TO-92 Molded Plastic Case + Flat Face with TMP36 Markings + 3 Silver Wire Leads */}
                        <svg className="to92-temp-svg" viewBox="-6 -52 44 56" width="44" height="56" style={{ position: "absolute", top: -52, left: -6, pointerEvents: "auto", cursor: "move" }}>
                            <defs>
                                <linearGradient id={`to92-temp-grad-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#3f3f46" />
                                    <stop offset="50%" stopColor="#27272a" />
                                    <stop offset="100%" stopColor="#18181b" />
                                </linearGradient>
                                <radialGradient id={`to92-temp-glow-${id}`} cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
                                    <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                                </radialGradient>
                            </defs>

                            {/* Click target hitbox */}
                            <rect x="-6" y="-52" width="44" height="42" fill="transparent" pointerEvents="all" cursor="move" />

                            {/* Thermal Pulse Halo when powered */}
                            {isPowered && (
                                <circle cx="16" cy="-32" r="22" fill={`url(#to92-temp-glow-${id})`} />
                            )}

                            {/* TO-92 Package: Rounded back arch + flat front face */}
                            <path
                                d="M 0 -20 C 0 -48, 32 -48, 32 -20 Z"
                                fill={`url(#to92-temp-grad-${id})`}
                                stroke="#52525b"
                                strokeWidth="1.2"
                            />
                            {/* Flat Front Face Lip */}
                            <rect x="0" y="-22" width="32" height="4" rx="1" fill="#27272a" stroke="#52525b" strokeWidth="0.8" />

                            {/* Markings */}
                            <text x="16" y="-34" fill="#e4e4e7" fontSize="5.5" fontWeight="900" fontFamily="monospace" textAnchor="middle">TMP36</text>
                            <text x="16" y="-28" fill="#a1a1aa" fontSize="3.8" fontWeight="700" fontFamily="monospace" textAnchor="middle">TWINLAB X</text>
                            <text x="16" y="-24" fill={isPowered ? "#38bdf8" : "#71717a"} fontSize="3.5" fontWeight="800" fontFamily="monospace" textAnchor="middle">
                                {isPowered ? `${tempVal}°C` : "+Vs Vout GND"}
                            </text>

                            {/* 3 Tinned Metal Pin Leads (Local x: 0, 16, 32; y: -18 to 0) */}
                            <line x1="0" y1="-18" x2="0" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="16" y1="-18" x2="16" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                            <line x1="32" y1="-18" x2="32" y2="0" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>

                        {/* Pin 1: VCC (+Vs) at (0, 0) */}
                        <span
                            className={`terminal-pin pin-temp-vcc ${hoveredTerminal === "tmpVcc" ? "targeted" : ""}`}
                            style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("tmpVcc")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "tmpVcc", 0, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 0, 0)}
                            onClick={(e) => handleTerminalPress(e, "tmpVcc", 0, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 0, 0)}
                        />
                        {hoveredTerminal === "tmpVcc" && (
                            <div className="terminal-hover-tooltip" style={{ left: 0, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Pin 1: +Vs (2.7V - 5.5V)
                            </div>
                        )}

                        {/* Pin 2: VOUT (Analog Temp) at (16, 0) */}
                        <span
                            className={`terminal-pin pin-temp-vout ${hoveredTerminal === "tmpVout" ? "targeted" : ""}`}
                            style={{ left: 16, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("tmpVout")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "tmpVout", 16, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 16, 0)}
                            onClick={(e) => handleTerminalPress(e, "tmpVout", 16, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 16, 0)}
                        />
                        {hoveredTerminal === "tmpVout" && (
                            <div className="terminal-hover-tooltip" style={{ left: 16, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Pin 2: VOUT ({isPowered ? `${(vOut * 1000).toFixed(0)}mV` : "10mV/°C"})
                            </div>
                        )}

                        {/* Pin 3: GND at (32, 0) */}
                        <span
                            className={`terminal-pin pin-temp-gnd ${hoveredTerminal === "tmpGnd" ? "targeted" : ""}`}
                            style={{ left: 32, top: 0, transform: "translate(-50%, -50%)" }}
                            onMouseEnter={() => setHoveredTerminal("tmpGnd")}
                            onMouseLeave={() => setHoveredTerminal(null)}
                            onMouseDown={(e) => handleTerminalMouseDown(e, "tmpGnd", 32, 0)}
                            onMouseUp={(e) => handleTerminalMouseUp(e, 32, 0)}
                            onClick={(e) => handleTerminalPress(e, "tmpGnd", 32, 0)}
                            onDoubleClick={(e) => handleTerminalAction(e, 32, 0)}
                        />
                        {hoveredTerminal === "tmpGnd" && (
                            <div className="terminal-hover-tooltip" style={{ left: 32, top: 0, transform: `translate(-50%, -100%) translateY(-6px) rotate(${-(rotation || 0)}deg)` }}>
                                Pin 3: GND (0V)
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

export default SmallComponent;
