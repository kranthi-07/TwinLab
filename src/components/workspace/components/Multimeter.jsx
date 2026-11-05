import "./Multimeter.css";
import { useState, useRef, useEffect } from "react";
import { soundManager } from "../../../utils/audioManager";

const GRID_STEP = 16;
const snapToGrid = (val) => Math.round(val / GRID_STEP) * GRID_STEP;

function Multimeter({
    id,
    x,
    y,
    rotation = 0,
    mode = "voltage", // "voltage" | "current" | "resistance" | "continuity"
    probeRed,
    probeBlack,
    onUpdate,
    simState,
    isSelected,
    onSelect,
    onDelete,
    onMouseDown,
    isWireMode,
    activeWire,
    onStartWireAtPoint,
    zoom = 1,
    findSnapTarget
}) {
    // Default probe positions relative to DMM body if not set (needle tip coordinates)
    const redPos = probeRed || { x: x + 160, y: y + 48 };
    const blackPos = probeBlack || { x: x + 160, y: y + 112 };

    const [draggingProbe, setDraggingProbe] = useState(null); // 'red' | 'black' | null
    const [hoveredProbe, setHoveredProbe] = useState(null);
    const [activeSnapPoint, setActiveSnapPoint] = useState(null);

    // Audio chime for continuity mode
    useEffect(() => {
        if (mode === "continuity" && simState?.isContinuityBeep) {
            soundManager.startBuzzer(`dmm_${id}`, 1760);
        } else {
            soundManager.stopBuzzer(`dmm_${id}`);
        }
        return () => {
            soundManager.stopBuzzer(`dmm_${id}`);
        };
    }, [id, mode, simState?.isContinuityBeep]);

    // Handle dial rotation click
    const handleSetMode = (e, nextMode) => {
        e.stopPropagation();
        onUpdate && onUpdate({ mode: nextMode });
    };

    // Dragging probe needles with intelligent magnetic pin/hole snapping
    const handleProbeMouseDown = (e, probeType) => {
        e.stopPropagation();
        if (isWireMode) return;
        setDraggingProbe(probeType);

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const initialProbe = probeType === "red" ? { ...redPos } : { ...blackPos };

        const handleMove = (moveEvt) => {
            const dx = (moveEvt.clientX - startMouseX) / (zoom || 1);
            const dy = (moveEvt.clientY - startMouseY) / (zoom || 1);
            const rawX = initialProbe.x + dx;
            const rawY = initialProbe.y + dy;

            // Search for nearby breadboard hole or terminal (24px magnetic lock radius)
            const snap = findSnapTarget ? findSnapTarget(rawX, rawY, 24) : null;
            const targetX = snap ? snap.x : Math.round(rawX);
            const targetY = snap ? snap.y : Math.round(rawY);

            setActiveSnapPoint(snap ? { x: targetX, y: targetY } : null);

            if (probeType === "red") {
                onUpdate && onUpdate({ probeRed: { x: targetX, y: targetY } });
            } else {
                onUpdate && onUpdate({ probeBlack: { x: targetX, y: targetY } });
            }
        };

        const handleUp = () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            setDraggingProbe(null);
            setActiveSnapPoint(null);
        };

        window.addEventListener("mousemove", handleMove);
        window.addEventListener("mouseup", handleUp);
    };

    // Calculate dial angle based on current mode
    // 12 o'clock = voltage (0deg), 3 o'clock = current (90deg), 6 o'clock = resistance (180deg), 9 o'clock = continuity (270deg)
    const dialAngles = {
        voltage: 0,
        current: 90,
        resistance: 180,
        continuity: 270
    };
    const currentAngle = dialAngles[mode] || 0;

    // Cable start points on DMM body
    const redJack = { x: x + 88, y: y + 184 };
    const blackJack = { x: x + 32, y: y + 184 };

    // Format LCD display readout
    const displayValue = simState?.readout != null ? simState.readout : (mode === "resistance" || mode === "continuity" ? "0.L" : "0.00");
    const displayUnit = simState?.unit != null ? simState.unit : (mode === "voltage" ? "V" : mode === "current" ? "mA" : "Ω");

    return (
        <div className={`dmm-system ${isSelected ? "selected" : ""}`}>
            {/* SVG Flexible Test Probe Cables & Snap Markers */}
            <svg className="dmm-cables-svg">
                {/* Active Magnetic Pin Lock Ring */}
                {activeSnapPoint && (
                    <g className="probe-magnetic-snap-fx">
                        <circle cx={activeSnapPoint.x} cy={activeSnapPoint.y} r="8" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3 2" />
                        <circle cx={activeSnapPoint.x} cy={activeSnapPoint.y} r="2.5" fill="#38bdf8" />
                    </g>
                )}

                {/* Red Probe Cable (Enters bottom of probe handle) */}
                <path
                    d={`M ${redJack.x} ${redJack.y} C ${redJack.x + 35} ${redJack.y + 60}, ${redPos.x - 25} ${redPos.y + 85}, ${redPos.x} ${redPos.y + 56}`}
                    stroke="#dc2626"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
                {/* Black Probe Cable (Enters bottom of probe handle) */}
                <path
                    d={`M ${blackJack.x} ${blackJack.y} C ${blackJack.x - 25} ${blackJack.y + 60}, ${blackPos.x - 25} ${blackPos.y + 85}, ${blackPos.x} ${blackPos.y + 56}`}
                    stroke="#0f172a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
            </svg>

            {/* DMM BENCHTOP METER BODY */}
            <div
                className="dmm-body-case"
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0"
                }}
                onMouseDown={(e) => {
                    onSelect && onSelect(id);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Holster Top Bevel & Brand */}
                <div className="dmm-header">
                    <span className="dmm-brand">TWINLAB</span>
                    <span className="dmm-model">TL-890D</span>
                </div>

                {/* High-Contrast Digital LCD Screen */}
                <div className="dmm-lcd-bezel">
                    <div className="dmm-lcd-screen">
                        <div className="dmm-lcd-top-icons">
                            <span className="dmm-icon-indicator">{mode.toUpperCase()}</span>
                            {mode === "continuity" && <span className="dmm-sound-indicator">🔊</span>}
                            <span className="dmm-hold-indicator">AUTO</span>
                        </div>
                        <div className="dmm-lcd-digits">
                            <span className="digits-text">{displayValue}</span>
                            <span className="unit-text">{displayUnit}</span>
                        </div>
                    </div>
                </div>

                {/* Special Tactile Mode Selector Keypad */}
                <div className="dmm-function-keypad">
                    <button
                        type="button"
                        className={`dmm-fn-key fn-voltage ${mode === "voltage" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "voltage")}
                        title="DC Voltage (V⎓)"
                    >
                        <span className="fn-led-dot"></span>
                        <span className="fn-key-label">V⎓</span>
                    </button>
                    <button
                        type="button"
                        className={`dmm-fn-key fn-current ${mode === "current" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "current")}
                        title="DC Current (mA⎓)"
                    >
                        <span className="fn-led-dot"></span>
                        <span className="fn-key-label">mA</span>
                    </button>
                    <button
                        type="button"
                        className={`dmm-fn-key fn-resistance ${mode === "resistance" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "resistance")}
                        title="Resistance (Ω)"
                    >
                        <span className="fn-led-dot"></span>
                        <span className="fn-key-label">Ω</span>
                    </button>
                    <button
                        type="button"
                        className={`dmm-fn-key fn-continuity ${mode === "continuity" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "continuity")}
                        title="Continuity Beeper (•)))"
                    >
                        <span className="fn-led-dot"></span>
                        <span className="fn-key-label">🔊</span>
                    </button>
                </div>

                {/* Rotary Mode Selector Dial */}
                <div className="dmm-dial-area">
                    {/* Range Labels around dial */}
                    <button
                        type="button"
                        className={`dial-label-btn label-v ${mode === "voltage" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "voltage")}
                        title="DC Voltage (V)"
                    >
                        V⎓
                    </button>
                    <button
                        type="button"
                        className={`dial-label-btn label-a ${mode === "current" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "current")}
                        title="DC Current (mA)"
                    >
                        mA⎓
                    </button>
                    <button
                        type="button"
                        className={`dial-label-btn label-ohm ${mode === "resistance" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "resistance")}
                        title="Resistance (Ω)"
                    >
                        Ω
                    </button>
                    <button
                        type="button"
                        className={`dial-label-btn label-cont ${mode === "continuity" ? "active" : ""}`}
                        onClick={(e) => handleSetMode(e, "continuity")}
                        title="Continuity (Beep)"
                    >
                        •)))
                    </button>

                    {/* Rotary Center Knob */}
                    <div 
                        className="dmm-rotary-knob"
                        style={{ transform: `rotate(${currentAngle}deg)` }}
                    >
                        <div className="dial-pointer-notch"></div>
                        <div className="dial-cap"></div>
                    </div>
                </div>

                {/* Bottom Banana Jacks */}
                <div className="dmm-jack-row">
                    <div className="banana-jack jack-com" title="COM Ground Jack (-)">
                        <span className="jack-label">COM</span>
                        <div className="jack-socket black-socket"></div>
                    </div>
                    <div className="banana-jack jack-vma" title="V/Ω/mA Input Jack (+)">
                        <span className="jack-label">V·Ω·mA</span>
                        <div className="jack-socket red-socket"></div>
                    </div>
                </div>
            </div>

            {/* RED TEST PROBE (Movable needle handle - Tip centered at redPos) */}
            <div
                className={`dmm-probe-pen red-probe ${hoveredProbe === "red" ? "hovered" : ""} ${draggingProbe === "red" ? "dragging" : ""}`}
                style={{ 
                    left: redPos.x, 
                    top: redPos.y 
                }}
                onMouseEnter={() => setHoveredProbe("red")}
                onMouseLeave={() => setHoveredProbe(null)}
                onMouseDown={(e) => handleProbeMouseDown(e, "red")}
            >
                {/* Needle tip at (0, 0) */}
                <div 
                    className="probe-needle-point"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onStartWireAtPoint && onStartWireAtPoint(redPos);
                    }}
                >
                    <span className="probe-contact-tip"></span>
                    <span className="needle-metal"></span>
                </div>
                <div className="probe-barrel red-barrel">
                    <span className="probe-plus-sign">+</span>
                </div>
            </div>

            {/* BLACK TEST PROBE (Movable needle handle - Tip centered at blackPos) */}
            <div
                className={`dmm-probe-pen black-probe ${hoveredProbe === "black" ? "hovered" : ""} ${draggingProbe === "black" ? "dragging" : ""}`}
                style={{ 
                    left: blackPos.x, 
                    top: blackPos.y 
                }}
                onMouseEnter={() => setHoveredProbe("black")}
                onMouseLeave={() => setHoveredProbe(null)}
                onMouseDown={(e) => handleProbeMouseDown(e, "black")}
            >
                {/* Needle tip at (0, 0) */}
                <div 
                    className="probe-needle-point"
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        onStartWireAtPoint && onStartWireAtPoint(blackPos);
                    }}
                >
                    <span className="probe-contact-tip"></span>
                    <span className="needle-metal"></span>
                </div>
                <div className="probe-barrel black-barrel">
                    <span className="probe-minus-sign">−</span>
                </div>
            </div>
        </div>
    );
}

export default Multimeter;
