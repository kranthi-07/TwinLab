import "./WireLayer.css";

function WireLayer({
    wires = [],
    activeWire = null,
    selectedWireId = null,
    routingMode = "curved", // "curved" | "manhattan" | "straight"
    onSelectWire,
    onDeleteWire,
    onStartWireAtPoint
}) {
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

    return (
        <svg className={`canvas-wires-layer ${activeWire ? "routing-active" : ""}`}>
            {/* Placed Wires */}
            {wires.map((wire) => {
                const isSelected = selectedWireId === wire.id;
                const wireMode = wire.routingMode || routingMode;
                const pathStr = pointsToPath(wire.points, wireMode);

                return (
                    <g 
                        key={wire.id} 
                        className={`wire-group ${isSelected ? "selected" : ""}`}
                        style={{ "--wire-color": wire.color || "#10b981" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectWire && onSelectWire(wire.id);
                        }}
                    >
                        {/* 1. Generous transparent hit-detection area */}
                        <path 
                            d={pathStr}
                            stroke="transparent"
                            strokeWidth="18"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="wire-click-target"
                        >
                            <title>{`Wire (${wire.color || "#10b981"}) • Click to select, Backspace/Del to remove`}</title>
                        </path>

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

                        {/* 4. Terminal Endpoints & Waypoint Dots */}
                        {wire.points && wire.points.map((pt, idx) => {
                            const isEndpoint = idx === 0 || idx === wire.points.length - 1;
                            return (
                                <circle 
                                    key={`pt-${idx}`}
                                    cx={pt.x} 
                                    cy={pt.y} 
                                    r={isEndpoint ? "5" : "3"} 
                                    fill={isEndpoint ? "#ffffff" : (isSelected ? "#FF8A00" : (wire.color || "#10b981"))} 
                                    stroke={isSelected ? "#FF8A00" : (wire.color || "#10b981")}
                                    strokeWidth={isEndpoint ? "2" : "1.5"}
                                    className={`wire-point-dot ${isEndpoint ? "is-endpoint" : ""}`}
                                    onClick={(e) => {
                                        if (isEndpoint && onStartWireAtPoint) {
                                            e.stopPropagation();
                                            onStartWireAtPoint({ x: pt.x, y: pt.y });
                                        }
                                    }}
                                    onDoubleClick={(e) => {
                                        if (isEndpoint && onStartWireAtPoint) {
                                            e.stopPropagation();
                                            onStartWireAtPoint({ x: pt.x, y: pt.y });
                                        }
                                    }}
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
