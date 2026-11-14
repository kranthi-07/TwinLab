import "./Minimap.css";
import { useState, useMemo, useRef } from "react";

function Minimap({
    components = [],
    wires = [],
    viewport = { pan: { x: 0, y: 0 }, zoom: 1 },
    canvasSize = { width: 1200, height: 800 },
    onPanTo,
    onResetView
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const mapBodyRef = useRef(null);
    const isDraggingRef = useRef(false);
    const isMovingHeaderRef = useRef(false);
    const startHeaderDragRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

    const handleHeaderDown = (e) => {
        if (e.target.closest(".minimap-btn")) return;
        e.stopPropagation();
        isMovingHeaderRef.current = true;
        startHeaderDragRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: dragOffset.x,
            startY: dragOffset.y
        };

        const handlePointerMove = (ev) => {
            if (!isMovingHeaderRef.current) return;
            const dx = ev.clientX - startHeaderDragRef.current.mouseX;
            const dy = ev.clientY - startHeaderDragRef.current.mouseY;
            setDragOffset({
                x: startHeaderDragRef.current.startX + dx,
                y: startHeaderDragRef.current.startY + dy
            });
        };

        const handlePointerUp = () => {
            isMovingHeaderRef.current = false;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    };

    // Compute bounding box of all items with padding
    const bounds = useMemo(() => {
        let minX = 0;
        let minY = 0;
        let maxX = 1200;
        let maxY = 800;

        components.forEach((c) => {
            const w = c.type?.startsWith("breadboard") ? 560 : 80;
            const h = c.type?.startsWith("breadboard") ? 288 : 60;
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x + w);
            maxY = Math.max(maxY, c.y + h);
        });

        wires.forEach((w) => {
            w.points?.forEach((pt) => {
                minX = Math.min(minX, pt.x);
                minY = Math.min(minY, pt.y);
                maxX = Math.max(maxX, pt.x);
                maxY = Math.max(maxY, pt.y);
            });
        });

        // Add padding
        const pad = 200;
        return {
            minX: minX - pad,
            minY: minY - pad,
            maxX: maxX + pad,
            maxY: maxY + pad,
            width: Math.max(1200, (maxX - minX) + pad * 2),
            height: Math.max(800, (maxY - minY) + pad * 2)
        };
    }, [components, wires]);

    const MAP_WIDTH = 220;
    const MAP_HEIGHT = 135;

    // Scale factors from world coords to minimap SVG coords
    const scaleX = MAP_WIDTH / bounds.width;
    const scaleY = MAP_HEIGHT / bounds.height;
    const mapScale = Math.min(scaleX, scaleY);

    const worldToMap = (wx, wy) => ({
        x: (wx - bounds.minX) * mapScale + (MAP_WIDTH - bounds.width * mapScale) / 2,
        y: (wy - bounds.minY) * mapScale + (MAP_HEIGHT - bounds.height * mapScale) / 2
    });

    // Visible viewport box in world coordinates
    const viewWorldLeft = -viewport.pan.x / viewport.zoom;
    const viewWorldTop = -viewport.pan.y / viewport.zoom;
    const viewWorldWidth = canvasSize.width / viewport.zoom;
    const viewWorldHeight = canvasSize.height / viewport.zoom;

    const viewMapTopLeft = worldToMap(viewWorldLeft, viewWorldTop);
    const viewMapWidth = Math.max(16, viewWorldWidth * mapScale);
    const viewMapHeight = Math.max(12, viewWorldHeight * mapScale);

    // Is the project currently offscreen?
    const isOffscreen = useMemo(() => {
        if (components.length === 0) return false;
        const viewRight = viewWorldLeft + viewWorldWidth;
        const viewBottom = viewWorldTop + viewWorldHeight;

        // Check if ANY component is visible in view
        const hasVisible = components.some((c) => {
            const w = c.type?.startsWith("breadboard") ? 560 : 80;
            const h = c.type?.startsWith("breadboard") ? 288 : 60;
            return !(c.x + w < viewWorldLeft || c.x > viewRight || c.y + h < viewWorldTop || c.y > viewBottom);
        });

        return !hasVisible;
    }, [components, viewWorldLeft, viewWorldTop, viewWorldWidth, viewWorldHeight]);

    // Pan to point on minimap (circuit immediately follows cursor)
    const panToMapClient = (clientX, clientY) => {
        if (!mapBodyRef.current) return;
        const rect = mapBodyRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(MAP_WIDTH, clientX - rect.left));
        const clickY = Math.max(0, Math.min(MAP_HEIGHT, clientY - rect.top));

        // Convert map coord back to world coords
        const offsetX = (MAP_WIDTH - bounds.width * mapScale) / 2;
        const offsetY = (MAP_HEIGHT - bounds.height * mapScale) / 2;

        const targetWorldX = (clickX - offsetX) / mapScale + bounds.minX;
        const targetWorldY = (clickY - offsetY) / mapScale + bounds.minY;

        onPanTo && onPanTo({
            x: -(targetWorldX * viewport.zoom - canvasSize.width / 2),
            y: -(targetWorldY * viewport.zoom - canvasSize.height / 2)
        });
    };

    const handlePointerDown = (e) => {
        isDraggingRef.current = true;
        panToMapClient(e.clientX, e.clientY);

        const handlePointerMove = (ev) => {
            if (isDraggingRef.current) {
                panToMapClient(ev.clientX, ev.clientY);
            }
        };

        const handlePointerUp = () => {
            isDraggingRef.current = false;
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    };

    return (
        <aside 
            className={`workspace-minimap ${collapsed ? "collapsed" : ""} ${isOffscreen ? "offscreen-alert" : ""}`}
            style={{ 
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                cursor: "default"
            }}
        >
            <div 
                className="minimap-header"
                onPointerDown={handleHeaderDown}
                title="Drag header to move Minimap"
                style={{ cursor: "default" }}
            >
                <div className="minimap-title">
                    <i className="ri-drag-move-fill minimap-drag-handle" style={{ fontSize: 13, color: "#64748b" }}></i>
                    <i className="ri-map-2-line"></i>
                    <span>Minimap</span>
                    {isOffscreen && <span className="offscreen-pill">Offscreen</span>}
                </div>

                <div className="minimap-actions">
                    {onResetView && (
                        <button 
                            type="button" 
                            className="minimap-btn recenter" 
                            onClick={onResetView}
                            title="Recenter View to Project"
                        >
                            <i className="ri-focus-3-line"></i>
                        </button>
                    )}
                    <button 
                        type="button" 
                        className="minimap-btn collapse" 
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? "Expand Minimap" : "Collapse Minimap"}
                    >
                        <i className={collapsed ? "ri-arrow-down-s-line" : "ri-arrow-up-s-line"}></i>
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div 
                    ref={mapBodyRef}
                    className="minimap-body" 
                    onPointerDown={handlePointerDown} 
                    title="Click or drag to navigate workspace"
                    style={{ cursor: "pointer" }}
                >
                    <svg width={MAP_WIDTH} height={MAP_HEIGHT} className="minimap-svg">
                        {/* Dot Grid representation */}
                        <defs>
                            <pattern id="minimap-dots" width="8" height="8" patternUnits="userSpaceOnUse">
                                <circle cx="4" cy="4" r="0.6" fill="rgba(255,255,255,0.12)" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#minimap-dots)" />

                        {/* Wires */}
                        {wires.map((w) => {
                            if (!w.points || w.points.length < 2) return null;
                            const ptsStr = w.points.map((pt) => {
                                const m = worldToMap(pt.x, pt.y);
                                return `${m.x},${m.y}`;
                            }).join(" ");
                            return (
                                <polyline
                                    key={w.id}
                                    points={ptsStr}
                                    fill="none"
                                    stroke={w.color || "#10b981"}
                                    strokeWidth="1.2"
                                    opacity="0.85"
                                />
                            );
                        })}

                        {/* Placed Components */}
                        {components.map((c) => {
                            const isBreadboard = c.type?.startsWith("breadboard");
                            const w = isBreadboard ? 560 : (c.type === "resistor" ? 64 : 36);
                            const h = isBreadboard ? 288 : 28;
                            const m = worldToMap(c.x, c.y);

                            if (isBreadboard) {
                                return (
                                    <rect
                                        key={c.id}
                                        x={m.x}
                                        y={m.y}
                                        width={Math.max(10, w * mapScale)}
                                        height={Math.max(6, h * mapScale)}
                                        rx="2"
                                        fill="#e2e8f0"
                                        stroke="#94a3b8"
                                        strokeWidth="0.8"
                                        opacity="0.9"
                                    />
                                );
                            }

                            return (
                                <rect
                                    key={c.id}
                                    x={m.x}
                                    y={m.y}
                                    width={Math.max(3, w * mapScale)}
                                    height={Math.max(3, h * mapScale)}
                                    rx="1"
                                    fill={c.color || "#FF8A00"}
                                    stroke="#ffffff"
                                    strokeWidth="0.5"
                                    opacity="0.9"
                                />
                            );
                        })}

                        {/* Current Viewport Camera Rect */}
                        <rect
                            x={viewMapTopLeft.x}
                            y={viewMapTopLeft.y}
                            width={viewMapWidth}
                            height={viewMapHeight}
                            rx="3"
                            fill="rgba(255, 138, 0, 0.12)"
                            stroke="#FF8A00"
                            strokeWidth="1.5"
                            className="minimap-viewport-rect"
                        />
                    </svg>

                    {/* Quick Recenter Prompt if offscreen */}
                    {isOffscreen && (
                        <div 
                            className="minimap-offscreen-badge"
                            onClick={(e) => {
                                e.stopPropagation();
                                onResetView && onResetView();
                            }}
                            title="Click to jump back to your circuit"
                        >
                            <i className="ri-navigation-line"></i>
                            <span>Jump to Circuit</span>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
}

export default Minimap;
