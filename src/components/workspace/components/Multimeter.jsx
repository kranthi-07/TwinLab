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
    onStartWireAtPoint
}) {
    // Default probe positions relative to DMM body if not set
    const redPos = probeRed || { x: x + 160, y: y + 48 };
    const blackPos = probeBlack || { x: x + 160, y: y + 112 };

    const [draggingProbe, setDraggingProbe] = useState(null); // 'red' | 'black' | null
    const [hoveredProbe, setHoveredProbe] = useState(null);

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

    // Dragging probe needles
    const handleProbeMouseDown = (e, probeType) => {
        e.stopPropagation();
        if (isWireMode) return;
        setDraggingProbe(probeType);

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;
        const initialProbe = probeType === "red" ? { ...redPos } : { ...blackPos };

        const handleMove = (moveEvt) => {
            const dx = moveEvt.clientX - startMouseX;
            const dy = moveEvt.clientY - startMouseY;
            const newX = snapToGrid(initialProbe.x + dx);
            const newY = snapToGrid(initialProbe.y + dy);

            if (probeType === "red") {
                onUpdate && onUpdate({ probeRed: { x: newX, y: newY } });
            } else {
                onUpdate && onUpdate({ probeBlack: { x: newX, y: newY } });
            }
        };

        const handleUp = () => {
            window.removeEventListener("mousemove", handleMove);
            window.removeEventListener("mouseup", handleUp);
            setDraggingProbe(null);
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
    const redJack = { x: x + 88, y: y + 162 };
    const blackJack = { x: x + 32, y: y + 162 };

    // Format LCD display readout
    const displayValue = simState?.readout != null ? simState.readout : (mode === "resistance" || mode === "continuity" ? "0.L" : "0.00");
    const displayUnit = simState?.unit != null ? simState.unit : (mode === "voltage" ? "V" : mode === "current" ? "mA" : "Ω");

    return (
        <div className={`dmm-system ${isSelected ? "selected" : ""}`}>
            {/* SVG Flexible Test Probe Cables */}
            <svg className="dmm-cables-svg">
                {/* Red Probe Cable */}
                <path
                    d={`M ${redJack.x} ${redJack.y} C ${redJack.x + 40} ${redJack.y + 40}, ${redPos.x - 40} ${redPos.y + 30}, ${redPos.x} ${redPos.y}`}
                    stroke="#dc2626"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))"
                />
                {/* Black Probe Cable */}
                <path
                    d={`M ${blackJack.x} ${blackJack.y} C ${blackJack.x - 20} ${blackJack.y + 50}, ${blackPos.x - 30} ${blackPos.y + 40}, ${blackPos.x} ${blackPos.y}`}
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
                    if (isWireMode) return;
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

            {/* RED TEST PROBE (Movable needle handle) */}
            <div
                className={`dmm-probe-pen red-probe ${hoveredProbe === "red" ? "hovered" : ""} ${draggingProbe === "red" ? "dragging" : ""}`}
                style={{ transform: `translate(${redPos.x}px, ${redPos.y}px)` }}
                onMouseEnter={() => setHoveredProbe("red")}
                onMouseLeave={() => setHoveredProbe(null)}
                onMouseDown={(e) => handleProbeMouseDown(e, "red")}
                title="Red Probe Tip (+) - Drag onto any pin, terminal, or breadboard hole"
            >
                <div className="probe-needle-point">
                    <span className="needle-metal"></span>
                    <span 
                        className="probe-contact-tip"
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            onStartWireAtPoint && onStartWireAtPoint(redPos);
                        }}
                    ></span>
                </div>
                <div className="probe-barrel red-barrel">
                    <span className="probe-plus-sign">+</span>
                </div>
            </div>

            {/* BLACK TEST PROBE (Movable needle handle) */}
            <div
                className={`dmm-probe-pen black-probe ${hoveredProbe === "black" ? "hovered" : ""} ${draggingProbe === "black" ? "dragging" : ""}`}
                style={{ transform: `translate(${blackPos.x}px, ${blackPos.y}px)` }}
                onMouseEnter={() => setHoveredProbe("black")}
                onMouseLeave={() => setHoveredProbe(null)}
                onMouseDown={(e) => handleProbeMouseDown(e, "black")}
                title="Black Probe Tip (COM / -) - Drag onto any pin, terminal, or breadboard hole"
            >
                <div className="probe-needle-point">
                    <span className="needle-metal"></span>
                    <span 
                        className="probe-contact-tip"
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            onStartWireAtPoint && onStartWireAtPoint(blackPos);
                        }}
                    ></span>
                </div>
                <div className="probe-barrel black-barrel">
                    <span className="probe-minus-sign">−</span>
                </div>
            </div>
        </div>
    );
}

export default Multimeter;
