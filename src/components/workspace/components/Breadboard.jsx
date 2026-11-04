import "./Breadboard.css";
import { useState, useRef, useEffect } from "react";

// Standard Half-Size Solderless Breadboard (30 Columns)
const COLUMNS = 30;
const ROWS_UPPER = ["a", "b", "c", "d", "e"];
const ROWS_LOWER = ["f", "g", "h", "i", "j"];

// Exact 16px Grid Mathematics (Matches background dot grid 1:1)
const GRID_STEP = 16;
const X_START = 48; // 3 * 16px

// Y coordinates for each pin row (all exact multiples of 16px)
const Y_RAIL_TOP_PLUS = 16;  // 1 * 16
const Y_RAIL_TOP_MINUS = 32; // 2 * 16

const Y_UPPER_ROWS = {
    a: 64,  // 4 * 16
    b: 80,  // 5 * 16
    c: 96,  // 6 * 16
    d: 112, // 7 * 16
    e: 128  // 8 * 16
};

const Y_LOWER_ROWS = {
    f: 160, // 10 * 16
    g: 176, // 11 * 16
    h: 192, // 12 * 16
    i: 208, // 13 * 16
    j: 224  // 14 * 16
};

const Y_RAIL_BOT_MINUS = 256; // 16 * 16
const Y_RAIL_BOT_PLUS = 272;  // 17 * 16

// Total dimensions: 560px x 288px (35 x 18 grid units)
const BOARD_WIDTH = 560;
const BOARD_HEIGHT = 288;

function Breadboard({ 
    id, 
    x, 
    y, 
    rotation = 0, 
    isSelected, 
    onSelect, 
    onDelete, 
    onRotate,
    onMouseDown,
    onStartWireAtPoint,
    isWireMode,
    activeWire
}) {
    // Current pointed pin state
    const [hoveredPin, setHoveredPin] = useState(null);
    const breadboardRef = useRef(null);
    const lastMouseDownRef = useRef({ time: 0, key: "" });

    // Instantly start wire on second mousedown (so instant dragging opens wire)
    const handleHoleMouseDown = (e, holeKey, worldPt) => {
        e.stopPropagation();
        const now = Date.now();
        const isDouble = (lastMouseDownRef.current.key === holeKey) && (now - lastMouseDownRef.current.time < 420);
        lastMouseDownRef.current = { time: now, key: holeKey };

        if (isDouble) {
            onStartWireAtPoint && onStartWireAtPoint(worldPt);
        }
    };

    // Releasing mouse on a different hole finishes the wire
    const handleHoleMouseUp = (e, worldPt) => {
        e.stopPropagation();
        if (activeWire && onStartWireAtPoint) {
            const startPt = activeWire.points?.[0];
            if (startPt && (startPt.x !== worldPt.x || startPt.y !== worldPt.y)) {
                onStartWireAtPoint(worldPt);
            }
        }
    };

    // Handle single click (in wire mode or active routing) or rapid double tap/click
    const handleHolePress = (e, holeKey, worldPt) => {
        e.stopPropagation();
        const now = Date.now();
        const isDouble = (lastMouseDownRef.current.key === holeKey) && (now - lastMouseDownRef.current.time < 420);

        if (activeWire || isDouble || isWireMode) {
            onStartWireAtPoint && onStartWireAtPoint(worldPt);
        }
    };

    // Guaranteed instant clear when cursor leaves the breadboard boundaries
    useEffect(() => {
        const handleGlobalPointerMove = (e) => {
            if (!breadboardRef.current) return;
            const el = document.elementFromPoint(e.clientX, e.clientY);
            if (!el || !breadboardRef.current.contains(el)) {
                setHoveredPin(null);
            }
        };
        window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
        window.addEventListener("pointerleave", () => setHoveredPin(null));
        window.addEventListener("blur", () => setHoveredPin(null));
        return () => {
            window.removeEventListener("pointermove", handleGlobalPointerMove);
            window.removeEventListener("pointerleave", () => setHoveredPin(null));
            window.removeEventListener("blur", () => setHoveredPin(null));
        };
    }, []);

    // Helper to calculate exact visual mode for any hole (crisp normal opacity, no white shade)
    const getPinMode = (section, col, rowIndex = null) => {
        if (!hoveredPin) return { mode: "normal", opacity: 1 };

        // Terminal Banks (Upper & Lower)
        if (section === "bankUpper" || section === "bankLower") {
            if (hoveredPin.section === section && hoveredPin.col === col) {
                const dist = Math.abs(hoveredPin.rowIndex - rowIndex);
                if (dist === 0) return { mode: "target", opacity: 1 };
                if (dist === 1) return { mode: "beside_normal", opacity: 1 };
                return { mode: "beside_faded", opacity: 1 };
            }
            return { mode: "normal", opacity: 1 };
        }

        // Power Rails (Full 30-column continuous bus)
        if (hoveredPin.section === section) {
            const dist = Math.abs(hoveredPin.col - col);
            if (dist === 0) return { mode: "target", opacity: 1 };
            if (dist <= 2) return { mode: "beside_normal", opacity: 1 };
            if (dist <= 4) return { mode: "beside_faded", opacity: 1 };
            return { mode: "rail_continuity", opacity: 1 };
        }

        return { mode: "normal", opacity: 1 };
    };

    // Render single interactive hole with multi-tier highlights
    const renderHole = (key, cx, cy, title, section, col, row = null, rowIndex = null) => {
        const { mode, opacity } = getPinMode(section, col, rowIndex);

        return (
            <g 
                key={key}
                className="breadboard-hole-node"
                opacity={opacity}
                onMouseEnter={() => setHoveredPin({ section, col, row, rowIndex })}
                onMouseLeave={() => setHoveredPin(null)}
                onMouseDown={(e) => handleHoleMouseDown(e, key, { x: x + cx, y: y + cy })}
                onMouseUp={(e) => handleHoleMouseUp(e, { x: x + cx, y: y + cy })}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onStartWireAtPoint && onStartWireAtPoint({ x: x + cx, y: y + cy });
                }}
                onClick={(e) => handleHolePress(e, key, { x: x + cx, y: y + cy })}
                style={{ cursor: "default" }}
            >
                <title>{title}</title>

                {/* 1. Main pointed pin: Small, simple, elegant CAD highlight */}
                {mode === "target" && (
                    <rect 
                        x={cx - 3.5} 
                        y={cy - 3.5} 
                        width="7" 
                        height="7" 
                        rx="1.5" 
                        fill="#FF8A00" 
                        stroke="#ffffff" 
                        strokeWidth="1.2"
                    />
                )}

                {/* 2. Beside 2 pins: Clean, subtle tie-strip green accent */}
                {mode === "beside_normal" && (
                    <rect 
                        x={cx - 3} 
                        y={cy - 3} 
                        width="6" 
                        height="6" 
                        rx="1.2" 
                        fill="#10b981" 
                        stroke="#059669" 
                        strokeWidth="0.8"
                    />
                )}

                {/* 3. Beside pins of those pins: Subtle faded green */}
                {mode === "beside_faded" && (
                    <rect 
                        x={cx - 2.5} 
                        y={cy - 2.5} 
                        width="5" 
                        height="5" 
                        rx="1" 
                        fill="rgba(16, 185, 129, 0.45)" 
                        stroke="rgba(5, 150, 105, 0.6)" 
                        strokeWidth="0.6"
                    />
                )}

                {/* 4. Power rail continuous bus */}
                {mode === "rail_continuity" && (
                    <rect 
                        x={cx - 4} 
                        y={cy - 4} 
                        width="8" 
                        height="8" 
                        rx="1.5" 
                        fill="rgba(16, 185, 129, 0.22)" 
                        stroke="rgba(5, 150, 105, 0.45)" 
                        strokeWidth="0.8"
                    />
                )}

                {/* 5. Standard hole (normal state or faded remaining pin) */}
                {(mode === "normal" || mode === "faded_unrelated") && (
                    <g>
                        <rect 
                            x={cx - 4} 
                            y={cy - 4} 
                            width="8" 
                            height="8" 
                            rx="1.5" 
                            fill="url(#hole-depth)" 
                            stroke="#4b5563" 
                            strokeWidth="0.8" 
                        />
                        <rect 
                            x={cx - 1.5} 
                            y={cy - 1.5} 
                            width="3" 
                            height="3" 
                            rx="0.5" 
                            fill="#9ca3af" 
                            opacity="0.8" 
                        />
                    </g>
                )}
            </g>
        );
    };

    return (
        <div 
            ref={breadboardRef}
            className={`canvas-breadboard ${isSelected ? "selected" : ""}`}
            style={{
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                cursor: "default"
            }}
            onMouseLeave={() => setHoveredPin(null)}
            onPointerLeave={() => setHoveredPin(null)}
            onMouseDown={(e) => {
                if (isWireMode) return;
                onSelect && onSelect(id);
                onMouseDown && onMouseDown(e, id);
            }}
        >
            {/* Pure Vector Tinkercad Breadboard (1:1 with 16px background dots) */}
            <svg 
                className="breadboard-svg" 
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`} 
                width={BOARD_WIDTH} 
                height={BOARD_HEIGHT}
                style={{ cursor: "default" }}
                onMouseLeave={() => setHoveredPin(null)}
            >
                <defs>
                    <filter id="breadboard-shadow" x="-5%" y="-5%" width="110%" height="115%">
                        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.45" />
                    </filter>
                    
                    <radialGradient id="hole-depth" cx="50%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#1e2530" />
                        <stop offset="100%" stopColor="#0b0e14" />
                    </radialGradient>

                    <linearGradient id="body-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#fafafa" />
                        <stop offset="5%" stopColor="#f1f3f6" />
                        <stop offset="95%" stopColor="#e8ebef" />
                        <stop offset="100%" stopColor="#dce0e6" />
                    </linearGradient>

                    {/* Main Pointed Pin Highlight Filter */}
                    <filter id="target-pin-glow" x="-80%" y="-80%" width="260%" height="260%">
                        <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#FF8A00" floodOpacity="1" />
                    </filter>

                    {/* Beside 2 Pins: Green Glow Normal Filter */}
                    <filter id="pin-glow-normal" x="-60%" y="-60%" width="220%" height="220%">
                        <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#10b981" floodOpacity="0.95" />
                    </filter>

                    {/* Beside Pins of Those Pins: Faded Green Filter */}
                    <filter id="pin-glow-faded" x="-40%" y="-40%" width="180%" height="180%">
                        <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#10b981" floodOpacity="0.5" />
                    </filter>
                </defs>

                {/* Main Plastic Body with Interlocking Dovetail Tabs */}
                <g filter="url(#breadboard-shadow)">
                    {/* Left Interlocking Notch */}
                    <path d="M 6 112 L 0 112 L 0 176 L 6 176 Z" fill="#e8ebef" stroke="#cbd5e1" strokeWidth="1" />
                    {/* Right Interlocking Peg */}
                    <path d="M 554 116 L 560 116 L 560 172 L 554 172 Z" fill="#e8ebef" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Main Board Base */}
                    <rect 
                        x="6" 
                        y="4" 
                        width="548" 
                        height="280" 
                        rx="12" 
                        ry="12" 
                        fill="url(#body-gradient)" 
                        stroke="#c4cbd4" 
                        strokeWidth="1.5"
                    />

                    {/* Inner Bevel Rim */}
                    <rect 
                        x="10" 
                        y="8" 
                        width="540" 
                        height="272" 
                        rx="8" 
                        ry="8" 
                        fill="none" 
                        stroke="#ffffff" 
                        strokeWidth="1" 
                        opacity="0.8" 
                    />
                </g>

                {/* ====================================================
                    POWER RAIL BUS LINES (+ Red and - Blue)
                ==================================================== */}
                {/* Top Power Rails */}
                <line x1="44" y1="8" x2="516" y2="8" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
                <text x="30" y="12" fill="#ef4444" fontSize="13" fontWeight="700" fontFamily="monospace" textAnchor="middle">+</text>
                <text x="530" y="12" fill="#ef4444" fontSize="13" fontWeight="700" fontFamily="monospace" textAnchor="middle">+</text>

                <line x1="44" y1="40" x2="516" y2="40" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
                <text x="30" y="36" fill="#3b82f6" fontSize="15" fontWeight="700" fontFamily="monospace" textAnchor="middle">-</text>
                <text x="530" y="36" fill="#3b82f6" fontSize="15" fontWeight="700" fontFamily="monospace" textAnchor="middle">-</text>

                {/* Bottom Power Rails */}
                <line x1="44" y1="248" x2="516" y2="248" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
                <text x="30" y="260" fill="#3b82f6" fontSize="15" fontWeight="700" fontFamily="monospace" textAnchor="middle">-</text>
                <text x="530" y="260" fill="#3b82f6" fontSize="15" fontWeight="700" fontFamily="monospace" textAnchor="middle">-</text>

                <line x1="44" y1="280" x2="516" y2="280" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
                <text x="30" y="276" fill="#ef4444" fontSize="13" fontWeight="700" fontFamily="monospace" textAnchor="middle">+</text>
                <text x="530" y="276" fill="#ef4444" fontSize="13" fontWeight="700" fontFamily="monospace" textAnchor="middle">+</text>

                {/* ====================================================
                    COLUMN LABELS (1 to 30)
                ==================================================== */}
                {[...Array(COLUMNS)].map((_, c) => {
                    const colNum = c + 1;
                    const cx = X_START + c * GRID_STEP;
                    const isMajor = colNum % 5 === 0 || colNum === 1;

                    return (
                        <g key={`col-num-${colNum}`}>
                            {isMajor && (
                                <>
                                    <text 
                                        x={cx} 
                                        y="52" 
                                        fill="#64748b" 
                                        fontSize="8.5" 
                                        fontWeight="600" 
                                        fontFamily="monospace" 
                                        textAnchor="middle"
                                    >
                                        {colNum}
                                    </text>
                                    <text 
                                        x={cx} 
                                        y="238" 
                                        fill="#64748b" 
                                        fontSize="8.5" 
                                        fontWeight="600" 
                                        fontFamily="monospace" 
                                        textAnchor="middle"
                                    >
                                        {colNum}
                                    </text>
                                </>
                            )}
                        </g>
                    );
                })}

                {/* ====================================================
                    ROW LETTERS (a-e and f-j)
                ==================================================== */}
                {ROWS_UPPER.map((r) => (
                    <g key={`row-u-${r}`}>
                        <text x="30" y={Y_UPPER_ROWS[r] + 3} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="monospace" textAnchor="middle">{r}</text>
                        <text x="530" y={Y_UPPER_ROWS[r] + 3} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="monospace" textAnchor="middle">{r}</text>
                    </g>
                ))}

                {/* Center DIP Valley Trough */}
                <rect x="14" y="140" width="532" height="8" rx="2" fill="#d8dee6" stroke="#b4beca" strokeWidth="0.8" />

                {ROWS_LOWER.map((r) => (
                    <g key={`row-l-${r}`}>
                        <text x="30" y={Y_LOWER_ROWS[r] + 3} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="monospace" textAnchor="middle">{r}</text>
                        <text x="530" y={Y_LOWER_ROWS[r] + 3} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="monospace" textAnchor="middle">{r}</text>
                    </g>
                ))}

                {/* ====================================================
                    INTERACTIVE TIE POINTS (WITH TINKERCAD/EDA HIGHLIGHTING)
                ==================================================== */}

                {/* TOP POWER RAIL HOLES */}
                {[...Array(COLUMNS)].map((_, c) => {
                    const cx = X_START + c * GRID_STEP;
                    const colNum = c + 1;

                    return (
                        <g key={`top-rail-holes-${c}`}>
                            {/* Rail Top (+) */}
                            {renderHole(
                                `rt-plus-${colNum}`,
                                cx,
                                Y_RAIL_TOP_PLUS,
                                `Top Rail (+) Pin ${colNum}`,
                                "railTopPlus",
                                colNum
                            )}

                            {/* Rail Top (-) */}
                            {renderHole(
                                `rt-minus-${colNum}`,
                                cx,
                                Y_RAIL_TOP_MINUS,
                                `Top Rail (-) Pin ${colNum}`,
                                "railTopMinus",
                                colNum
                            )}
                        </g>
                    );
                })}

                {/* UPPER TERMINAL STRIP (Rows a - e) */}
                {ROWS_UPPER.map((row, rIdx) => (
                    <g key={`upper-row-${row}`}>
                        {[...Array(COLUMNS)].map((_, c) => {
                            const colNum = c + 1;
                            const cx = X_START + c * GRID_STEP;
                            const cy = Y_UPPER_ROWS[row];

                            return renderHole(
                                `u-${row}-${colNum}`,
                                cx,
                                cy,
                                `Terminal ${colNum}${row.toUpperCase()}`,
                                "bankUpper",
                                colNum,
                                row,
                                rIdx
                            );
                        })}
                    </g>
                ))}

                {/* LOWER TERMINAL STRIP (Rows f - j) */}
                {ROWS_LOWER.map((row, rIdx) => (
                    <g key={`lower-row-${row}`}>
                        {[...Array(COLUMNS)].map((_, c) => {
                            const colNum = c + 1;
                            const cx = X_START + c * GRID_STEP;
                            const cy = Y_LOWER_ROWS[row];

                            return renderHole(
                                `l-${row}-${colNum}`,
                                cx,
                                cy,
                                `Terminal ${colNum}${row.toUpperCase()}`,
                                "bankLower",
                                colNum,
                                row,
                                rIdx
                            );
                        })}
                    </g>
                ))}

                {/* BOTTOM POWER RAIL HOLES */}
                {[...Array(COLUMNS)].map((_, c) => {
                    const cx = X_START + c * GRID_STEP;
                    const colNum = c + 1;

                    return (
                        <g key={`bot-rail-holes-${c}`}>
                            {/* Rail Bottom (-) */}
                            {renderHole(
                                `rb-minus-${colNum}`,
                                cx,
                                Y_RAIL_BOT_MINUS,
                                `Bottom Rail (-) Pin ${colNum}`,
                                "railBotMinus",
                                colNum
                            )}

                            {/* Rail Bottom (+) */}
                            {renderHole(
                                `rb-plus-${colNum}`,
                                cx,
                                Y_RAIL_BOT_PLUS,
                                `Bottom Rail (+) Pin ${colNum}`,
                                "railBotPlus",
                                colNum
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default Breadboard;
