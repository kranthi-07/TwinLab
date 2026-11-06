import "./WireLayer.css";
import { useRef } from "react";

// Helper function to calculate distance from point (px, py) to line segment (ax, ay) -> (bx, by)
function distToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return Math.hypot(px - projX, py - projY);
}

function WireLayer({
    wires = [],
    activeWire = null,
    selectedWireId = null,
    routingMode = "curved", // "curved" | "manhattan" | "straight"
    isSimulating = false,
    simulationResult = null,
    onSelectWire,
    onDeleteWire,
    onStartWireAtPoint,
    onUpdateWire,
    onStartDragWirePoint,
    screenToWorld
}) {
    const lastClickMapRef = useRef({});
    const lastNodeClickRef = useRef({});

    // Helper to generate SVG path string for array of points supporting Curved, Manhattan 90°, and Straight routing
    const pointsToPath = (points, mode = "curved") => {
        if (!points || points.length === 0) return "";
        if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

        if (mode === "straight") {
            return points.reduce((acc, pt, idx) => {
                if (idx === 0) return `M ${pt.x} ${pt.y}`;
                return `${acc} L ${pt.x} ${pt.y}`;
            }, "");
        }

        if (mode === "manhattan") {
            let d = `M ${points[0].x} ${points[0].y}`;
            for (let i = 1; i < points.length; i++) {
                const p0 = points[i - 1];
                const p1 = points[i];
                // Clean 90-degree orthogonal trace
                const midX = p1.x;
                const midY = p0.y;
                d += ` L ${midX} ${midY} L ${p1.x} ${p1.y}`;
            }
            return d;
        }

        // Default: "curved" (Realistic saggy jumper wire bezier)
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const p0 = points[i - 1];
            const p1 = points[i];
            const dx = p1.x - p0.x;
            const dy = p1.y - p0.y;
            const dist = Math.hypot(dx, dy);
            // Subtle natural sag proportional to wire span
            const sag = Math.min(36, Math.max(10, dist * 0.12));
            const cx1 = p0.x + dx * 0.25;
            const cy1 = p0.y + dy * 0.25 + sag;
            const cx2 = p0.x + dx * 0.75;
            const cy2 = p0.y + dy * 0.75 + sag;
            d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
        }
        return d;
    };

    // Double-click on wire body inserts a new draggable bend waypoint
    const handleWireBodyDoubleClick = (wire, e) => {
        e && e.stopPropagation && e.stopPropagation();
        if (!wire || !wire.points || wire.points.length < 2 || !screenToWorld) return;
        const { snappedX, snappedY, worldX, worldY } = screenToWorld(e.clientX, e.clientY);

        // Find the closest line segment
        let bestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < wire.points.length - 1; i++) {
            const p1 = wire.points[i];
            const p2 = wire.points[i + 1];
            const d = distToSegment(worldX, worldY, p1.x, p1.y, p2.x, p2.y);
            if (d < minDist) {
                minDist = d;
                bestIdx = i;
            }
        }

        const newPoint = { x: snappedX, y: snappedY };
        const newPoints = [
            ...wire.points.slice(0, bestIdx + 1),
            newPoint,
            ...wire.points.slice(bestIdx + 1)
        ];

        onUpdateWire && onUpdateWire(wire.id, { points: newPoints });
        onStartDragWirePoint && onStartDragWirePoint({
            wireId: wire.id,
            pointIndex: bestIdx + 1,
            initialWirePoints: newPoints,
            initialMouseX: e.clientX,
            initialMouseY: e.clientY
        });
    };

    return (
        <svg className={`canvas-wires-layer ${activeWire ? "routing-active" : ""}`}>
            {/* Placed Wires */}
            {wires.map((wire) => {
                const isSelected = selectedWireId === wire.id || selectedWireId === "all";
                const wireMode = wire.routingMode || routingMode;
                const pathStr = pointsToPath(wire.points, wireMode);
                const hasCurrent = Boolean(simulationResult?.wireStates?.[wire.id]?.hasCurrent);

                return (
                    <g 
                        key={wire.id} 
                        className={`wire-group ${isSelected ? "selected" : ""}`}
                        style={{ "--wire-color": wire.color || "#10b981" }}
                    >
                        {/* 1. Generous 32px transparent hit-detection area with fast double-click support to bend wire */}
                        <path 
                            d={pathStr}
                            stroke="transparent"
                            strokeWidth="32"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="wire-click-target"
                            onClick={(e) => {
                                e.stopPropagation();
                                const now = Date.now();
                                const lastClick = lastClickMapRef.current[wire.id] || 0;
                                lastClickMapRef.current[wire.id] = now;
                                if (now - lastClick < 450) {
                                    handleWireBodyDoubleClick(wire, e);
                                } else {
                                    onSelectWire && onSelectWire(wire.id);
                                }
                            }}
                            onDoubleClick={(e) => handleWireBodyDoubleClick(wire, e)}
                        />

                        {/* 2. Soft depth shadow beneath wire */}
                        <path 
                            d={pathStr}
                            stroke="#000000"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.3"
                            className="wire-shadow-base"
                        />

                        {/* 3. Core Wire */}
                        <path 
                            d={pathStr}
                            stroke={isSelected ? "#FF8A00" : (wire.color || "#10b981")}
                            strokeWidth={isSelected ? "4.5" : "3.5"}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="wire-core"
                        />

                        {/* 4. Glowing Yellow Electron / Current Flow Dots (ONLY shown when real current is flowing!) */}
                        {isSimulating && hasCurrent && (
                            <path 
                                d={pathStr}
                                stroke="#fde047"
                                strokeWidth="2.8"
                                strokeDasharray="3 14"
                                strokeLinecap="round"
                                fill="none"
                                className="wire-electron-flow"
                            />
                        )}

                        {/* 5. Terminal Endpoints & Draggable Intermediate Waypoint Nodes */}
                        {wire.points && wire.points.map((pt, idx) => {
                            const isEndpoint = idx === 0 || idx === wire.points.length - 1;
                            return (
                                <circle 
                                    key={`pt-${idx}`}
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r={isEndpoint ? "5.5" : "4.5"} 
                                    fill={isEndpoint ? "#ffffff" : (isSelected ? "#FF8A00" : (wire.color || "#10b981"))} 
                                    stroke={isSelected ? "#FF8A00" : (wire.color || "#10b981")}
                                    strokeWidth={isEndpoint ? "2" : "2"}
                                    className={`wire-point-dot ${isEndpoint ? "is-endpoint" : "is-waypoint"}`}
                                    onMouseDown={(e) => {
                                        // Allow dragging existing bend waypoints
                                        if (!isEndpoint) {
                                            e.stopPropagation();
                                            onStartDragWirePoint && onStartDragWirePoint({
                                                wireId: wire.id,
                                                pointIndex: idx,
                                                initialWirePoints: wire.points,
                                                initialMouseX: e.clientX,
                                                initialMouseY: e.clientY
                                            });
                                        }
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const nodeKey = `${wire.id}_${idx}`;
                                        const now = Date.now();
                                        const lastClick = lastNodeClickRef.current[nodeKey] || 0;
                                        lastNodeClickRef.current[nodeKey] = now;
                                        if (now - lastClick < 450 || isEndpoint) {
                                            onStartWireAtPoint && onStartWireAtPoint({ x: pt.x, y: pt.y });
                                        }
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onStartWireAtPoint && onStartWireAtPoint({ x: pt.x, y: pt.y });
                                    }}
                                    title={isEndpoint ? "Wire Terminal (Click/Double-click to branch wire)" : "Bend Waypoint (Drag to move, Double-click to branch wire)"}
                                />
                            );
                        })}
                    </g>
                );
            })}

            {/* Currently Active / In-Progress Wire Drawing */}
            {activeWire && activeWire.points && activeWire.points.length > 0 && (() => {
                const activePathStr = pointsToPath(activeWire.points, activeWire.routingMode || routingMode);
                return (
                    <g className="active-wire-drawing">
                        <path 
                            d={activePathStr}
                            stroke="#000000"
                            strokeWidth="5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.5"
                        />
                        <path 
                            d={activePathStr}
                            stroke={activeWire.color || "#FF8A00"}
                            strokeWidth="3.5"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="6 3"
                            className="active-wire-line"
                        />
                        {activeWire.points.map((pt, idx) => (
                            <circle 
                                key={`act-pt-${idx}`} 
                                cx={pt.x} 
                                cy={pt.y} 
                                r="4.5" 
                                fill={activeWire.color || "#FF8A00"} 
                                stroke="#ffffff"
                                strokeWidth="1.5"
                            />
                        ))}
                    </g>
                );
            })()}
        </svg>
    );
}

export default WireLayer;
