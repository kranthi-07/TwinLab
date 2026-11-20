import "./Canvas.css";
import { useState, useRef, useEffect, useCallback } from "react";
import Breadboard from "../components/Breadboard";
import SmallComponent from "../components/SmallComponent";
import Multimeter from "../components/Multimeter";
import McuBoard, { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP32_PINS, RPI_PICO_PINS } from "../components/McuBoard";
import WireLayer from "../components/WireLayer";
import { ECE_MOTIVATIONAL_QUOTES } from "../../../data/motivationalQuotes";
import { getComponentTerminalPoints } from "../../../utils/componentGeometry";

export { getComponentTerminalPoints };

const GRID_STEP = 16;
const snapToGrid = (val) => Math.round(val / GRID_STEP) * GRID_STEP;

// Smart Breadboard Hole & Terminal Snapper: Locks small components & ICs to valid breadboard hole coordinates or snaps terminals to adjacent components
export function getSmartComponentPlacementPos(compType, rawWorldX, rawWorldY, rotation = 0, breadboards = [], otherComponents = [], movingCompId = null) {
    const targetX = snapToGrid(rawWorldX);
    const targetY = snapToGrid(rawWorldY);

    if (!compType || compType.startsWith("breadboard")) {
        return { x: targetX, y: targetY, targetBB: null };
    }

    // 1. Check for Magnetic Terminal-to-Terminal Snapping against any placed components
    // (Resistor-to-LED, Resistor-to-Arduino pin, Sensor-to-Breadboard pin, etc.)
    let terminalSnapResult = null;
    if (otherComponents && otherComponents.length > 0) {
        const dummyComp = {
            id: movingCompId || "temp_moving",
            type: compType,
            x: targetX,
            y: targetY,
            rotation
        };
        const movingTerms = getComponentTerminalPoints(dummyComp);
        let bestDist = 24; // 24px magnetic capture radius

        for (const targetComp of otherComponents) {
            if (targetComp.id === movingCompId || targetComp.type?.startsWith("breadboard")) continue;
            const targetTerms = getComponentTerminalPoints(targetComp);
            for (const mt of movingTerms) {
                for (const tt of targetTerms) {
                    const dist = Math.hypot(mt.x - tt.x, mt.y - tt.y);
                    if (dist < bestDist) {
                        bestDist = dist;
                        terminalSnapResult = {
                            x: targetX + (tt.x - mt.x),
                            y: targetY + (tt.y - mt.y),
                            targetBB: null
                        };
                    }
                }
            }
        }
    }

    // Check if target is over or near any placed breadboard
    for (const bb of breadboards) {
        if (!bb || !bb.type?.startsWith("breadboard")) continue;

        const isMini = bb.type === "breadboard-mini";
        const isFull = bb.type === "breadboard-full";
        const cols = isMini ? 17 : isFull ? 60 : 30;
        const bbW = isMini ? 352 : isFull ? 1040 : 560;
        const bbH = isMini ? 224 : 288;
        const hasRails = !isMini;

        // Breadboard bounds with margin
        if (rawWorldX >= bb.x - 32 && rawWorldX <= bb.x + bbW + 32 &&
            rawWorldY >= bb.y - 32 && rawWorldY <= bb.y + bbH + 32) {

            // Valid hole rows (matching Breadboard.jsx 1:1)
            const validUpperRows = isMini ? [16, 32, 48, 64, 80] : [64, 80, 96, 112, 128];
            const validLowerRows = isMini ? [112, 128, 144, 160, 176] : [160, 176, 192, 208, 224];
            const validRailRows = hasRails ? [16, 32, 256, 272] : [];
            const allValidRows = [...validRailRows, ...validUpperRows, ...validLowerRows];

            // 1. DIP ICs snap across center divider trough
            if (compType.startsWith("ic-")) {
                const troughTopRow = isMini ? 80 : 128;
                const colIdx = Math.max(0, Math.min(cols - 7, Math.round((rawWorldX - (bb.x + 48)) / 16)));
                return {
                    x: bb.x + 48 + colIdx * 16,
                    y: bb.y + troughTopRow,
                    targetBB: bb
                };
            }

            // 2. Tactile Pushbutton (32px x 32px) spans center divider trough
            if (compType === "button") {
                const troughTopRow = isMini ? 80 : 128;
                const colIdx = Math.max(0, Math.min(cols - 3, Math.round((rawWorldX - (bb.x + 48)) / 16)));
                return {
                    x: bb.x + 48 + colIdx * 16,
                    y: bb.y + troughTopRow,
                    targetBB: bb
                };
            }

            // 3. Resistor (64px span = 4 holes)
            if (compType === "resistor") {
                const normRot = (((Math.round(rotation) % 360) + 360) % 360);
                const isVertical = normRot === 90 || normRot === 270;

                if (!isVertical) {
                    // Horizontal resistor: Pin 1 at col, Pin 2 at col + 4
                    const colIdx = Math.max(0, Math.min(cols - 5, Math.round((rawWorldX - (bb.x + 48)) / 16)));
                    const localY = rawWorldY - bb.y;
                    let bestRy = allValidRows[0];
                    let minDiff = Math.abs(localY - bestRy);
                    for (const ry of allValidRows) {
                        const diff = Math.abs(localY - ry);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestRy = ry;
                        }
                    }
                    return {
                        x: bb.x + 48 + colIdx * 16,
                        y: bb.y + bestRy,
                        targetBB: bb
                    };
                } else {
                    // Vertical resistor: span is 64px along Y
                    const colIdx = Math.max(0, Math.min(cols - 1, Math.round((rawWorldX - (bb.x + 48)) / 16)));
                    const localY = rawWorldY - bb.y;
                    // Filter to rows where (ry + 64) is also a valid hole row
                    const validVertRows = allValidRows.filter(ry => allValidRows.includes(ry + 64));
                    const candidateRows = validVertRows.length > 0 ? validVertRows : allValidRows;
                    let bestRy = candidateRows[0];
                    let minDiff = Math.abs(localY - bestRy);
                    for (const ry of candidateRows) {
                        const diff = Math.abs(localY - ry);
                        if (diff < minDiff) {
                            minDiff = diff;
                            bestRy = ry;
                        }
                    }
                    return {
                        x: bb.x + 48 + colIdx * 16,
                        y: bb.y + bestRy,
                        targetBB: bb
                    };
                }
            }

            // 4. General small components (LED, capacitors, sensors, buzzer, pots, switches, transistors)
            const colIdx = Math.max(0, Math.min(cols - 1, Math.round((rawWorldX - (bb.x + 48)) / 16)));
            const localY = rawWorldY - bb.y;
            let bestRy = allValidRows[0];
            let minDiff = Math.abs(localY - bestRy);
            for (const ry of allValidRows) {
                const diff = Math.abs(localY - ry);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestRy = ry;
                }
            }
            return {
                x: bb.x + 48 + colIdx * 16,
                y: bb.y + bestRy,
                targetBB: bb
            };
        }
    }

    if (terminalSnapResult) {
        return terminalSnapResult;
    }

    return { x: targetX, y: targetY, targetBB: null };
}

// Rotates any connected wire endpoints and mounted components with the rotating component
export function calculateRotatedWiresAndComponents(comp, newRot, currentWires = [], currentComps = []) {
    const oldRot = comp.rotation || 0;
    const deltaAngle = (newRot - oldRot);
    if (deltaAngle === 0) return { updatedWires: currentWires, updatedComps: currentComps };

    const rad = (deltaAngle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatePointAroundOrigin = (pt) => {
        const dx = pt.x - comp.x;
        const dy = pt.y - comp.y;
        return {
            x: Math.round(comp.x + dx * cos - dy * sin),
            y: Math.round(comp.y + dx * sin + dy * cos)
        };
    };

    const isBreadboard = comp.type?.startsWith("breadboard");

    if (isBreadboard) {
        const bbWidth = comp.width || (comp.type === "breadboard-full" ? 960 : comp.type === "breadboard-mini" ? 272 : 560);
        const bbHeight = comp.height || (comp.type === "breadboard-mini" ? 192 : 288);
        const radOld = (-oldRot * Math.PI) / 180;
        const cosOld = Math.cos(radOld);
        const sinOld = Math.sin(radOld);

        const isPointInBreadboard = (pt) => {
            const lx = (pt.x - comp.x) * cosOld - (pt.y - comp.y) * sinOld;
            const ly = (pt.x - comp.x) * sinOld + (pt.y - comp.y) * cosOld;
            return lx >= -16 && lx <= bbWidth + 16 && ly >= -16 && ly <= bbHeight + 16;
        };

        // Any wire points located on this breadboard
        const updatedWires = currentWires.map(w => {
            if (!w.points || w.points.length === 0) return w;
            let wireChanged = false;
            const newPoints = w.points.map(pt => {
                if (isPointInBreadboard(pt)) {
                    wireChanged = true;
                    return rotatePointAroundOrigin(pt);
                }
                return pt;
            });
            return wireChanged ? { ...w, points: newPoints } : w;
        });

        // Any components mounted on this breadboard
        const updatedComps = currentComps.map(c => {
            if (c.id === comp.id) {
                return { ...c, rotation: newRot };
            }
            const isMounted = c.mountedBoardId === comp.id || (
                !c.type?.startsWith("breadboard") &&
                isPointInBreadboard({ x: c.x, y: c.y })
            );
            if (isMounted) {
                const newPos = rotatePointAroundOrigin({ x: c.x, y: c.y });
                return {
                    ...c,
                    x: newPos.x,
                    y: newPos.y,
                    rotation: (((c.rotation || 0) + deltaAngle) % 360 + 360) % 360
                };
            }
            return c;
        });

        return { updatedWires, updatedComps };
    }

    // Standard component (Battery, Resistor, LED, Pushbutton, IC, MCU, etc.)
    const termPtsOld = getComponentTerminalPoints({ ...comp, rotation: oldRot });
    const termPtsNew = getComponentTerminalPoints({ ...comp, rotation: newRot });

    const updatedWires = currentWires.map(w => {
        if (!w.points || w.points.length === 0) return w;
        let wireChanged = false;
        const newPoints = w.points.map(pt => {
            // Find if this point was attached to one of the component's terminals
            let matchedIdx = -1;
            let minDistance = 36; // Snap tolerance threshold

            termPtsOld.forEach((tp, idx) => {
                const dist = Math.hypot(pt.x - tp.x, pt.y - tp.y);
                if (dist <= minDistance) {
                    minDistance = dist;
                    matchedIdx = idx;
                }
            });

            if (matchedIdx !== -1 && termPtsNew[matchedIdx]) {
                wireChanged = true;
                const tpOld = termPtsOld[matchedIdx];
                const tpNew = termPtsNew[matchedIdx];
                const offX = pt.x - tpOld.x;
                const offY = pt.y - tpOld.y;
                const rotOffX = offX * cos - offY * sin;
                const rotOffY = offX * sin + offY * cos;
                return {
                    x: Math.round(tpNew.x + rotOffX),
                    y: Math.round(tpNew.y + rotOffY)
                };
            }

            return pt;
        });

        return wireChanged ? { ...w, points: newPoints } : w;
    });

    const updatedComps = currentComps.map(c => c.id === comp.id ? { ...c, rotation: newRot } : c);

    return { updatedWires, updatedComps };
}

function Canvas({ 
    components = [], 
    wires = [],
    onAddComponent, 
    onUpdateComponent, 
    onRotateComponent,
    onDeleteComponent,
    onAddWire,
    onDeleteWire,
    onUpdateWire,
    onBatchUpdateWires,
    onUpdateAllComponentsAndWires,
    selectedId,
    onSelectComponent,
    selectedWireId,
    onSelectWire,
    isWireMode,
    onToggleWireMode,
    onDeactivateWireMode,
    wireColor,
    routingMode = "curved",
    simulationResult,
    isSimulating = false,
    onNotifyChange,
    viewport = { pan: { x: 0, y: 0 }, zoom: 1 },
    onUpdateViewport,
    placingComponent = null,
    onCommitPlacingComponent,
    onCancelPlacingComponent,
    isZoomLocked = false,
    isFocusMode = false,
    onToggleFocusMode
}) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [activeWire, setActiveWire] = useState(null);
    const [isMoveAllActive, setIsMoveAllActive] = useState(false);
    const isMoveAllActiveRef = useRef(false);
    useEffect(() => {
        isMoveAllActiveRef.current = isMoveAllActive;
    }, [isMoveAllActive]);
    const [placingPos, setPlacingPos] = useState(null);
    const [placingRotation, setPlacingRotation] = useState(0);

    const placingComponentRef = useRef(placingComponent);
    placingComponentRef.current = placingComponent;

    const [quoteIndex, setQuoteIndex] = useState(() => 
        Math.floor(Math.random() * ECE_MOTIVATIONAL_QUOTES.length)
    );
    const activeQuote = ECE_MOTIVATIONAL_QUOTES[quoteIndex] || ECE_MOTIVATIONAL_QUOTES[0];

    const cycleQuote = (e) => {
        e.stopPropagation();
        setQuoteIndex((prev) => (prev + 1) % ECE_MOTIVATIONAL_QUOTES.length);
    };

    const canvasRef = useRef(null);
    const draggingRef = useRef(null);
    const draggingWirePointRef = useRef(null);
    const lastEmptyClickTimeRef = useRef(0);
    const lastWireFinishTimeRef = useRef(0);
    const doubleTapDragRef = useRef(null);

    const componentsRef = useRef(components);
    componentsRef.current = components;

    const wiresRef = useRef(wires);
    wiresRef.current = wires;

    const activeWireRef = useRef(activeWire);
    activeWireRef.current = activeWire;

    const isWireModeRef = useRef(isWireMode);
    isWireModeRef.current = isWireMode;

    const handleStartDragWirePoint = useCallback((dragData) => {
        draggingRef.current = null;
        doubleTapDragRef.current = null;
        draggingWirePointRef.current = dragData;
    }, []);

    const { pan, zoom } = viewport;

    // Convert Screen Client Coordinates to World Canvas Coordinates (accounting for pan & zoom)
    const screenToWorld = useCallback((clientX, clientY) => {
        if (!canvasRef.current) return { worldX: 0, worldY: 0, snappedX: 0, snappedY: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const screenX = clientX - rect.left;
        const screenY = clientY - rect.top;
        const worldX = (screenX - pan.x) / zoom;
        const worldY = (screenY - pan.y) / zoom;
        return {
            worldX,
            worldY,
            snappedX: snapToGrid(worldX),
            snappedY: snapToGrid(worldY)
        };
    }, [pan, zoom]);

    // Initialize placement position & rotation when entering placement mode
    useEffect(() => {
        if (placingComponent) {
            setPlacingRotation(placingComponent.rotation || 0);
            const centerWorldX = snapToGrid(-pan.x / zoom + (window.innerWidth / 2) / zoom);
            const centerWorldY = snapToGrid(-pan.y / zoom + (window.innerHeight / 2) / zoom);
            setPlacingPos({ x: centerWorldX, y: centerWorldY });
        } else {
            setPlacingPos(null);
            setPlacingRotation(0);
        }
    }, [placingComponent, pan.x, pan.y, zoom]);

    // Real-Time High-FPS Mouse Tracker for Component Placement Preview
    useEffect(() => {
        if (!placingComponent) return;

        let rafId = null;
        let lastX = null;
        let lastY = null;

        const handlePlacingMouseMove = (e) => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
                const bbs = (componentsRef.current || []).filter(c => c.type?.startsWith("breadboard"));
                const otherComps = (componentsRef.current || []).filter(c => !c.type?.startsWith("breadboard"));
                const { x: snappedX, y: snappedY } = getSmartComponentPlacementPos(
                    placingComponent?.type, worldX, worldY, placingRotation, bbs, otherComps
                );

                if (snappedX !== lastX || snappedY !== lastY) {
                    lastX = snappedX;
                    lastY = snappedY;
                    setPlacingPos({ x: snappedX, y: snappedY });
                }
            });
        };

        window.addEventListener("mousemove", handlePlacingMouseMove, { passive: true });
        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener("mousemove", handlePlacingMouseMove);
        };
    }, [placingComponent, placingRotation, screenToWorld]);

    // Global Click-to-Place capture handler: Allows placing component freely anywhere on canvas or breadboard
    useEffect(() => {
        if (!placingComponent) return;

        const handleGlobalClickToPlace = (e) => {
            // Do not commit placement if clicking inside UI bars (TopFloatingBar, Sidebars, Console)
            if (e.target.closest(".top-floating-bar-wrapper, .left-sidebar, .right-sidebar, .bottom-console-wrapper, .context-property-bar")) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
            const bbs = (componentsRef.current || []).filter(c => c.type?.startsWith("breadboard"));
            const otherComps = (componentsRef.current || []).filter(c => !c.type?.startsWith("breadboard"));
            const { x: targetX, y: targetY, targetBB } = getSmartComponentPlacementPos(
                placingComponent?.type, worldX, worldY, placingRotation, bbs, otherComps
            );

            onCommitPlacingComponent && onCommitPlacingComponent({
                ...placingComponent,
                x: targetX,
                y: targetY,
                rotation: placingRotation,
                mountedBoardId: targetBB ? targetBB.id : null
            });
            setPlacingPos(null);
        };

        // Capture phase catches click BEFORE any breadboard or component element can stop propagation
        window.addEventListener("click", handleGlobalClickToPlace, true);
        return () => window.removeEventListener("click", handleGlobalClickToPlace, true);
    }, [placingComponent, placingRotation, screenToWorld, onCommitPlacingComponent]);

    // High-Precision Magnetic Connection Finder: Snaps active wire to ANY terminal, hole, or existing wire endpoint
    const findNearestConnectionTarget = useCallback((wx, wy, maxDist = 12) => {
        let bestTarget = null;
        let minD = maxDist;

        // 1. Check all placed components and their geometric terminal pins FIRST (Physical pins & holes have absolute priority)
        componentsRef.current.forEach(c => {
            if (c.type?.startsWith("breadboard")) {
                const rotRad = ((c.rotation || 0) * Math.PI) / 180;
                const cos = Math.cos(rotRad);
                const sin = Math.sin(rotRad);
                const isMini = c.type === "breadboard-mini";
                const isFull = c.type === "breadboard-full";
                const cols = isMini ? 17 : isFull ? 60 : 30;
                const maxW = isMini ? 336 : isFull ? 1024 : 524;
                const maxH = isMini ? 200 : 280;
                const dx = wx - c.x;
                const dy = wy - c.y;
                const localX = dx * cos + dy * sin;
                const localY = -dx * sin + dy * cos;
                if (localX >= 36 && localX <= maxW && localY >= 8 && localY <= maxH) {
                    const snapCol = Math.round((localX - 48) / 16);
                    if (snapCol >= 0 && snapCol < cols) {
                        const holeLocalX = 48 + snapCol * 16;
                        const validYs = isMini 
                            ? [16, 32, 48, 64, 80, 112, 128, 144, 160, 176]
                            : [16, 32, 64, 80, 96, 112, 128, 160, 176, 192, 208, 224, 256, 272];
                        let closestY = validYs[0];
                        let minYDist = 999;
                        validYs.forEach(vy => {
                            const distY = Math.abs(localY - vy);
                            if (distY < minYDist) {
                                minYDist = distY;
                                closestY = vy;
                            }
                        });
                        const holeWorldX = Math.round(c.x + holeLocalX * cos - closestY * sin);
                        const holeWorldY = Math.round(c.y + holeLocalX * sin + closestY * cos);
                        const d = Math.hypot(wx - holeWorldX, wy - holeWorldY);
                        if (d < minD) {
                            minD = d;
                            bestTarget = { x: holeWorldX, y: holeWorldY };
                        }
                    }
                }
            } else {
                const termPts = getComponentTerminalPoints(c);
                termPts.forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) {
                        minD = d;
                        bestTarget = pt;
                    }
                });
            }
        });

        // 2. Only check wire endpoints if no physical terminal/pin/hole was found within 8px
        // Tightly constrained to 8px max to strictly prevent hijacking adjacent pins (16px pitch)
        if (minD > 8) {
            let wireMinD = Math.min(minD, 8);
            wiresRef.current.forEach(w => {
                if (!w.points || w.points.length === 0) return;
                const pStart = w.points[0];
                const pEnd = w.points[w.points.length - 1];
                [pStart, pEnd].forEach(p => {
                    const d = Math.hypot(wx - p.x, wy - p.y);
                    if (d < wireMinD) {
                        wireMinD = d;
                        minD = d;
                        bestTarget = { x: p.x, y: p.y };
                    }
                });
            });
        }

        return bestTarget;
    }, []);

    // Auto-start or connect wire when double-clicking on any terminal, breadboard hole, or pin
    const handleConnectOrStartWire = useCallback((pt) => {
        // If placing component, clicking a terminal or hole places it directly!
        if (placingComponentRef.current) {
            onCommitPlacingComponent && onCommitPlacingComponent({
                ...placingComponentRef.current,
                x: pt.x,
                y: pt.y,
                rotation: placingRotation
            });
            setPlacingPos(null);
            return;
        }

        const now = Date.now();
        // Cooldown prevents double-click second event from immediately starting a new wire
        if (now - lastWireFinishTimeRef.current < 450) {
            return;
        }

        // Disarm any component or canvas drag immediately
        draggingRef.current = null;
        doubleTapDragRef.current = null;
        onSelectComponent && onSelectComponent(null);
        onSelectWire && onSelectWire(null);

        if (!activeWireRef.current) {
            onToggleWireMode && onToggleWireMode(true);
            const newWire = {
                color: wireColor || "#10b981",
                points: [{ x: pt.x, y: pt.y }, { x: pt.x, y: pt.y }]
            };
            activeWireRef.current = newWire;
            setActiveWire(newWire);
        } else {
            const startPt = activeWireRef.current.points[0];
            // If the user clicks or double-taps on the same starting pin/hole, keep routing (do not self-cancel)
            if (startPt && startPt.x === pt.x && startPt.y === pt.y) {
                return;
            }

            // Already routing wire - finish wire cleanly at this valid connection point!
            const prevPoints = activeWireRef.current.points.slice(0, -1);
            const finalPoints = [...prevPoints, { x: pt.x, y: pt.y }].filter((p, i, arr) =>
                i === 0 || p.x !== arr[i - 1].x || p.y !== arr[i - 1].y
            );
            if (finalPoints.length >= 2) {
                onAddWire({
                    id: `wire-${Date.now()}`,
                    color: activeWireRef.current.color,
                    points: finalPoints
                });
                onNotifyChange && onNotifyChange();
            }

            // Record finish timestamp to prevent immediate re-entry from double-click
            lastWireFinishTimeRef.current = Date.now();

            activeWireRef.current = null;
            setActiveWire(null);
            onDeactivateWireMode && onDeactivateWireMode();
            onSelectComponent && onSelectComponent(null);
            onSelectWire && onSelectWire(null);
        }
    }, [wireColor, onToggleWireMode, onAddWire, onNotifyChange, onDeactivateWireMode, onSelectComponent, onSelectWire]);

    // HARDWARE-ACCELERATED ULTRA-SMOOTH INFINITE WORKSPACE (60-120fps)
    const viewportRef = useRef(viewport);
    viewportRef.current = viewport;

    const isZoomLockedRef = useRef(isZoomLocked);
    isZoomLockedRef.current = isZoomLocked;

    const onUpdateViewportRef = useRef(onUpdateViewport);
    onUpdateViewportRef.current = onUpdateViewport;

    const viewportLayerRef = useRef(null);
    const infiniteDotGridRef = useRef(null);
    const isCanvasPanningRef = useRef(null);
    const rafIdRef = useRef(null);
    const pendingViewportRef = useRef(null);

    useEffect(() => {
        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const scheduleViewportCommit = () => {
            if (rafIdRef.current) return;
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                if (pendingViewportRef.current) {
                    onUpdateViewportRef.current && onUpdateViewportRef.current(pendingViewportRef.current);
                    pendingViewportRef.current = null;
                }
            });
        };

        const handleWheel = (e) => {
            e.preventDefault();
            const currentVp = pendingViewportRef.current || viewportRef.current;
            const currentZoom = currentVp.zoom;
            const currentPan = currentVp.pan;

            if (e.ctrlKey) {
                // PINCH-TO-ZOOM / Ctrl+Wheel
                if (isZoomLockedRef.current) return;

                const rect = canvasEl.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                const worldX = (mouseX - currentPan.x) / currentZoom;
                const worldY = (mouseY - currentPan.y) / currentZoom;

                // High-precision smooth exponential scaling
                // Clamping delta to avoid wheel flick spikes while preserving continuous pinch
                const clampedDelta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 40);
                const factor = Math.exp(-clampedDelta * 0.007);
                const newZoom = Math.min(3.0, Math.max(0.25, currentZoom * factor));

                const newPanX = mouseX - worldX * newZoom;
                const newPanY = mouseY - worldY * newZoom;

                pendingViewportRef.current = {
                    zoom: newZoom,
                    pan: { x: newPanX, y: newPanY }
                };

                // Immediate GPU transform without waiting for React cycle!
                if (viewportLayerRef.current) {
                    viewportLayerRef.current.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${newZoom})`;
                }
                if (infiniteDotGridRef.current) {
                    infiniteDotGridRef.current.style.backgroundPosition = `${newPanX}px ${newPanY}px, ${newPanX}px ${newPanY}px`;
                    infiniteDotGridRef.current.style.backgroundSize = `${16 * newZoom}px ${16 * newZoom}px, ${80 * newZoom}px ${80 * newZoom}px`;
                }

                scheduleViewportCommit();
            } else {
                // NORMAL PANNING: Smooth trackpad/mouse scroll across infinite space
                const newPanX = currentPan.x - e.deltaX;
                const newPanY = currentPan.y - e.deltaY;

                pendingViewportRef.current = {
                    zoom: currentZoom,
                    pan: { x: newPanX, y: newPanY }
                };

                if (viewportLayerRef.current) {
                    viewportLayerRef.current.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${currentZoom})`;
                }
                if (infiniteDotGridRef.current) {
                    infiniteDotGridRef.current.style.backgroundPosition = `${newPanX}px ${newPanY}px, ${newPanX}px ${newPanY}px`;
                    infiniteDotGridRef.current.style.backgroundSize = `${16 * currentZoom}px ${16 * currentZoom}px, ${80 * currentZoom}px ${80 * currentZoom}px`;
                }

                scheduleViewportCommit();
            }
        };

        canvasEl.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            canvasEl.removeEventListener("wheel", handleWheel);
            if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        };
    }, []);

    // DRAGGING PLACED COMPONENTS & BREADBOARDS WITH HIGH-FRAMERATE rAF SMOOTHING
    useEffect(() => {
        let animFrameId = null;
        let latestMoveEvt = null;
        const lastPlacingPos = { x: null, y: null };

        const processMouseMove = () => {
            const e = latestMoveEvt;
            if (!e) return;

            // 0. Active Component Placement Mode: Cursor-Following
            if (placingComponentRef.current) {
                draggingRef.current = null;
                doubleTapDragRef.current = null;
                const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
                const snappedX = snapToGrid(worldX);
                const snappedY = snapToGrid(worldY);
                if (lastPlacingPos.x !== snappedX || lastPlacingPos.y !== snappedY) {
                    lastPlacingPos.x = snappedX;
                    lastPlacingPos.y = snappedY;
                    setPlacingPos({ x: snappedX, y: snappedY });
                }
                return;
            }

            // A. Live Wire Routing: Follow cursor ultra-smoothly & disarm any dragging
            if (activeWireRef.current) {
                draggingRef.current = null;
                doubleTapDragRef.current = null;

                const { worldX, worldY, snappedX, snappedY } = screenToWorld(e.clientX, e.clientY);
                const magneticTarget = findNearestConnectionTarget(worldX, worldY, 12);
                const targetX = magneticTarget ? magneticTarget.x : snappedX;
                const targetY = magneticTarget ? magneticTarget.y : snappedY;

                const current = activeWireRef.current;
                const currentPoints = [...current.points];
                if (currentPoints.length > 0) {
                    const last = currentPoints[currentPoints.length - 1];
                    if (last.x !== targetX || last.y !== targetY) {
                        currentPoints[currentPoints.length - 1] = { x: targetX, y: targetY };
                        const updated = { ...current, points: currentPoints };
                        activeWireRef.current = updated;
                        setActiveWire(updated);
                    }
                }
                return;
            }

            // A1. Live Wire Waypoint / Bend Point Dragging (Double-click in middle & drag)
            if (draggingWirePointRef.current) {
                draggingRef.current = null;
                doubleTapDragRef.current = null;
                const { wireId, pointIndex } = draggingWirePointRef.current;
                const { snappedX, snappedY } = screenToWorld(e.clientX, e.clientY);
                const wire = wiresRef.current.find(w => w.id === wireId);
                if (wire && wire.points && wire.points[pointIndex]) {
                    const currentPt = wire.points[pointIndex];
                    if (currentPt.x !== snappedX || currentPt.y !== snappedY) {
                        const updatedPoints = wire.points.map((pt, idx) => 
                            idx === pointIndex ? { x: snappedX, y: snappedY } : pt
                        );
                        onUpdateWire && onUpdateWire(wireId, { points: updatedPoints });
                        onNotifyChange && onNotifyChange();
                    }
                }
                return;
            }

            // B0. Canvas Drag-Pan across truly infinite workspace (middle-click, space+drag, or empty canvas drag)
            if (isCanvasPanningRef.current) {
                const dx = e.clientX - isCanvasPanningRef.current.startX;
                const dy = e.clientY - isCanvasPanningRef.current.startY;
                if (Math.hypot(dx, dy) > 3 || isCanvasPanningRef.current.hasMoved) {
                    isCanvasPanningRef.current.hasMoved = true;
                    const newPanX = isCanvasPanningRef.current.initialPanX + dx;
                    const newPanY = isCanvasPanningRef.current.initialPanY + dy;
                    if (viewportLayerRef.current) {
                        viewportLayerRef.current.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${zoom})`;
                    }
                    if (infiniteDotGridRef.current) {
                        infiniteDotGridRef.current.style.backgroundPosition = `${newPanX}px ${newPanY}px, ${newPanX}px ${newPanY}px`;
                    }
                    pendingViewportRef.current = { zoom, pan: { x: newPanX, y: newPanY } };
                    scheduleViewportCommit();
                    return;
                }
            }

            // B. Double-tap & drag on empty space: Move ALL components and wires together across infinite space!
            if (doubleTapDragRef.current) {
                const { initialMouseX, initialMouseY, initialComps, initialWires } = doubleTapDragRef.current;
                const dx = (e.clientX - initialMouseX) / zoom;
                const dy = (e.clientY - initialMouseY) / zoom;
                const deltaX = snapToGrid(dx);
                const deltaY = snapToGrid(dy);

                if (onUpdateAllComponentsAndWires) {
                    onUpdateAllComponentsAndWires(
                        initialComps.map(c => ({
                            ...c,
                            x: c.x + deltaX,
                            y: c.y + deltaY
                        })),
                        initialWires.map(w => ({
                            ...w,
                            points: w.points ? w.points.map(pt => ({ x: pt.x + deltaX, y: pt.y + deltaY })) : []
                        }))
                    );
                } else {
                    initialComps.forEach(c => {
                        onUpdateComponent(c.id, { x: c.x + deltaX, y: c.y + deltaY });
                    });
                }
                onNotifyChange && onNotifyChange();
                return;
            }

            // C. Single Component Drag or Breadboard + Mounted Components + Attached Wires Drag
            if (!draggingRef.current) return;

            const dragData = draggingRef.current;
            const dx = (e.clientX - dragData.initialMouseX) / zoom;
            const dy = (e.clientY - dragData.initialMouseY) / zoom;

            const snappedX = snapToGrid(dragData.initialCompX + dx);
            const snappedY = snapToGrid(dragData.initialCompY + dy);
            const deltaX = snappedX - dragData.initialCompX;
            const deltaY = snappedY - dragData.initialCompY;

            // Skip redundant re-renders if position within snap grid hasn't changed
            if (dragData.lastSnappedX === snappedX && dragData.lastSnappedY === snappedY) {
                return;
            }
            dragData.lastSnappedX = snappedX;
            dragData.lastSnappedY = snappedY;

            if (dragData.mode === "breadboard" || dragData.mode === "multiple") {
                // 1. Move breadboard or primary multi-selected component across infinite space
                onUpdateComponent(dragData.id, { x: snappedX, y: snappedY });

                // 2. Move all other components
                dragData.mountedComponents?.forEach(m => {
                    onUpdateComponent(m.id, { 
                        x: m.initialX + deltaX, 
                        y: m.initialY + deltaY 
                    });
                });

                // 3. Move attached wire endpoints! If one end is on external board, that end stays fixed, extending the wire!
                if (dragData.attachedWirePoints?.length > 0 && onBatchUpdateWires) {
                    onBatchUpdateWires(dragData.attachedWirePoints, deltaX, deltaY);
                }
            } else {
                // Single component drag across infinite space
                const rawX = dragData.initialCompX + dx;
                const rawY = dragData.initialCompY + dy;
                const comp = componentsRef.current?.find(c => c.id === dragData.id);
                const bbs = (componentsRef.current || []).filter(c => c.type?.startsWith("breadboard") && c.id !== dragData.id);
                const otherComps = (componentsRef.current || []).filter(c => c.id !== dragData.id);
                const { x: finalCompX, y: finalCompY, targetBB } = getSmartComponentPlacementPos(
                    comp?.type, rawX, rawY, comp?.rotation || 0, bbs, otherComps, dragData.id
                );

                onUpdateComponent(dragData.id, { x: finalCompX, y: finalCompY, mountedBoardId: targetBB ? targetBB.id : null });

                // Move attached wire endpoints! The other end stays fixed, expanding/stretching the wire dynamically!
                const compDeltaX = finalCompX - dragData.initialCompX;
                const compDeltaY = finalCompY - dragData.initialCompY;
                if (dragData.attachedWirePoints?.length > 0 && onBatchUpdateWires) {
                    onBatchUpdateWires(dragData.attachedWirePoints, compDeltaX, compDeltaY);
                }
            }

            onNotifyChange && onNotifyChange();
        };

        const handleMouseMove = (e) => {
            latestMoveEvt = e;
            if (!animFrameId) {
                animFrameId = requestAnimationFrame(() => {
                    animFrameId = null;
                    processMouseMove();
                });
            }
        };

        const handleMouseUp = () => {
            if (animFrameId) {
                cancelAnimationFrame(animFrameId);
                animFrameId = null;
            }
            if (isCanvasPanningRef.current) {
                if (isCanvasPanningRef.current.hasMoved && pendingViewportRef.current) {
                    onUpdateViewportRef.current && onUpdateViewportRef.current(pendingViewportRef.current);
                    pendingViewportRef.current = null;
                }
                isCanvasPanningRef.current = null;
            }
            if (draggingRef.current && draggingRef.current.mode === "single") {
                const draggedId = draggingRef.current.id;
                const comp = componentsRef.current?.find(c => c.id === draggedId);
                if (comp && !comp.type?.startsWith("breadboard")) {
                    const targetBB = componentsRef.current?.find(b => 
                        b.type?.startsWith("breadboard") &&
                        comp.x >= b.x - 16 && comp.x <= b.x + (b.width || 560) + 16 &&
                        comp.y >= b.y - 16 && comp.y <= b.y + (b.height || 288) + 16
                    );
                    const newBoardId = targetBB ? targetBB.id : null;
                    if (comp.mountedBoardId !== newBoardId) {
                        onUpdateComponent(draggedId, { mountedBoardId: newBoardId });
                    }
                }
            }
            draggingRef.current = null;
            draggingWirePointRef.current = null;
            if (!isMoveAllActiveRef.current) {
                doubleTapDragRef.current = null;
                setIsMoveAllActive(false);
            }
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [zoom, screenToWorld, onUpdateComponent, onBatchUpdateWires, onUpdateAllComponentsAndWires, onNotifyChange]);

    // Keyboard shortcuts: Delete/Backspace, R to rotate, Esc to cancel wire or placing component
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if active element is an input, textarea or contentEditable (so typing/backspace never deletes components!)
            if (["INPUT", "TEXTAREA"].includes(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            if (e.key === "Escape") {
                if (placingComponentRef.current) {
                    onCancelPlacingComponent && onCancelPlacingComponent();
                    setPlacingPos(null);
                    return;
                }
                if (activeWireRef.current) {
                    activeWireRef.current = null;
                    setActiveWire(null);
                    onDeactivateWireMode && onDeactivateWireMode();
                    return;
                }
                if (isFocusMode && onToggleFocusMode) {
                    onToggleFocusMode(false);
                    return;
                }
                activeWireRef.current = null;
                setActiveWire(null);
                onDeactivateWireMode && onDeactivateWireMode();
                return;
            }

            if (e.key === "r" || e.key === "R") {
                if (placingComponentRef.current) {
                    setPlacingRotation(prev => (prev + 90) % 360);
                    return;
                }
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId === "all" || selectedWireId === "all") {
                    onDeleteComponent && onDeleteComponent("all");
                    onNotifyChange && onNotifyChange();
                } else if (selectedWireId) {
                    onDeleteWire(selectedWireId);
                    onNotifyChange && onNotifyChange();
                } else if (selectedId) {
                    onDeleteComponent(selectedId);
                    onNotifyChange && onNotifyChange();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedId, selectedWireId, components, activeWire, onDeleteComponent, onDeleteWire, onUpdateComponent, onAddWire, onNotifyChange, onDeactivateWireMode, onSelectComponent, onSelectWire, onCancelPlacingComponent]);

    // Live Wire Cursor Following Points
    const handleCanvasMouseMove = (e) => {
        if (!activeWireRef.current) return;
        const { snappedX, snappedY } = screenToWorld(e.clientX, e.clientY);

        const current = activeWireRef.current;
        const currentPoints = [...current.points];
        if (currentPoints.length > 0) {
            currentPoints[currentPoints.length - 1] = { x: snappedX, y: snappedY };
            const updated = { ...current, points: currentPoints };
            activeWireRef.current = updated;
            setActiveWire(updated);
        }
    };

    // Canvas Mouse Down: Detect double-tap on empty space to move all components or drag-pan across infinite space
    const handleCanvasMouseDown = (e) => {
        if (activeWireRef.current || isWireModeRef.current) return;

        const isBackground = e.target === canvasRef.current || 
                             e.target.classList.contains("dot-grid") || 
                             e.target.classList.contains("infinite-dot-grid") || 
                             e.target.classList.contains("canvas-viewport-layer");

        if (isBackground) {
            if (isMoveAllActiveRef.current && components.length > 0) {
                // If Move All is already active, arm dragging immediately
                doubleTapDragRef.current = {
                    initialMouseX: e.clientX,
                    initialMouseY: e.clientY,
                    initialComps: components.map(c => ({ ...c })),
                    initialWires: wires.map(w => ({
                        ...w,
                        points: w.points ? w.points.map(p => ({ ...p })) : []
                    }))
                };
                return;
            }

            const now = Date.now();
            if (now - lastEmptyClickTimeRef.current < 450 && components.length > 0) {
                // DOUBLE TAP / DOUBLE CLICK DETECTED ON EMPTY SPACE (2 clicks!): Move all components & wires together
                isMoveAllActiveRef.current = true;
                setIsMoveAllActive(true);
                doubleTapDragRef.current = {
                    initialMouseX: e.clientX,
                    initialMouseY: e.clientY,
                    initialComps: components.map(c => ({ ...c })),
                    initialWires: wires.map(w => ({
                        ...w,
                        points: w.points ? w.points.map(p => ({ ...p })) : []
                    }))
                };
                return;
            }
            lastEmptyClickTimeRef.current = now;

            // Arm smooth background drag-pan across infinite workspace
            isCanvasPanningRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                initialPanX: pan.x,
                initialPanY: pan.y,
                hasMoved: false
            };
        }
    };

    // Canvas Click: Handle wire node placement, placing component commit, or selection clearing
    const handleCanvasClick = (e) => {
        // If a drag-pan just completed, don't clear selection or trigger click events
        if (isCanvasPanningRef.current?.hasMoved) {
            return;
        }

        // 1. Commit active placing component at clicked/cursor position
        if (placingComponentRef.current) {
            e.stopPropagation();
            const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
            const snappedX = snapToGrid(worldX);
            const snappedY = snapToGrid(worldY);
            onCommitPlacingComponent && onCommitPlacingComponent({
                ...placingComponentRef.current,
                x: snappedX,
                y: snappedY,
                rotation: placingRotation
            });
            setPlacingPos(null);
            return;
        }

        if (activeWireRef.current) {
            e.stopPropagation();
            const { worldX, worldY, snappedX, snappedY } = screenToWorld(e.clientX, e.clientY);
            
            // Check if clicking near ANY valid terminal or existing wire endpoint: Finish wire cleanly!
            const magneticTarget = findNearestConnectionTarget(worldX, worldY, 12);
            if (magneticTarget) {
                handleConnectOrStartWire(magneticTarget);
                return;
            }

            const current = activeWireRef.current;
            const prevPts = current.points.slice(0, -1);
            // Single-click adds waypoint node in space and keeps routing new segment
            const updated = {
                ...current,
                points: [...prevPts, { x: snappedX, y: snappedY }, { x: snappedX, y: snappedY }]
            };
            activeWireRef.current = updated;
            setActiveWire(updated);
            return;
        }

        const isBackground = e.target === canvasRef.current || 
                             e.target.classList.contains("dot-grid") || 
                             e.target.classList.contains("infinite-dot-grid") || 
                             e.target.classList.contains("canvas-viewport-layer");

        if (isBackground) {
            // A click without drag exits Move All mode
            if (isMoveAllActiveRef.current && (!doubleTapDragRef.current || Math.hypot(e.clientX - doubleTapDragRef.current.initialMouseX, e.clientY - doubleTapDragRef.current.initialMouseY) < 4)) {
                isMoveAllActiveRef.current = false;
                setIsMoveAllActive(false);
                doubleTapDragRef.current = null;
            }
            onSelectComponent(null);
            onSelectWire(null);
            if (!activeWire && isWireMode) {
                onDeactivateWireMode && onDeactivateWireMode();
            }
        }
    };

    // Canvas Double Click: Toggle Move All mode in 2 clicks on empty space
    const handleCanvasDoubleClick = (e) => {
        e.stopPropagation();
        const isBackground = e.target === canvasRef.current || 
                             e.target.classList.contains("dot-grid") || 
                             e.target.classList.contains("infinite-dot-grid") || 
                             e.target.classList.contains("canvas-viewport-layer");

        if (isBackground && components.length > 0) {
            // Instant 2-click toggle for Move All
            const nextMode = !isMoveAllActiveRef.current;
            isMoveAllActiveRef.current = nextMode;
            setIsMoveAllActive(nextMode);
            if (nextMode) {
                doubleTapDragRef.current = {
                    initialMouseX: e.clientX,
                    initialMouseY: e.clientY,
                    initialComps: components.map(c => ({ ...c })),
                    initialWires: wires.map(w => ({
                        ...w,
                        points: w.points ? w.points.map(p => ({ ...p })) : []
                    }))
                };
            }
            return;
        }

        draggingRef.current = null;
        if (!isMoveAllActiveRef.current) {
            doubleTapDragRef.current = null;
        }
        onSelectComponent && onSelectComponent(null);
        onSelectWire && onSelectWire(null);
    };

    // HTML5 Drag and Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);

        const dataStr = e.dataTransfer.getData("application/twinlab-component");
        if (!dataStr) return;

        try {
            const componentData = JSON.parse(dataStr);
            const { worldX, worldY } = screenToWorld(e.clientX, e.clientY);
            const isBreadboard = componentData.type?.startsWith("breadboard");

            const bbs = (componentsRef.current || components || []).filter(c => c.type?.startsWith("breadboard"));
            const otherComps = (componentsRef.current || components || []).filter(c => !c.type?.startsWith("breadboard"));
            const { x: finalDropX, y: finalDropY, targetBB } = getSmartComponentPlacementPos(
                componentData.type, worldX, worldY, 0, bbs, otherComps
            );

            const uniqueId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const newPlaced = {
                id: uniqueId,
                type: componentData.type,
                name: componentData.name,
                color: componentData.color,
                x: finalDropX,
                y: finalDropY,
                rotation: 0,
                mountedBoardId: (!isBreadboard && targetBB) ? targetBB.id : null
            };

            onAddComponent(newPlaced);
            onSelectComponent(uniqueId);
            onNotifyChange && onNotifyChange();
        } catch (err) {
            console.error("Drop error:", err);
        }
    };

    // Start dragging placed components (Detects breadboard to carry mounted components & stretch wires)
    const handleStartDragPlaced = (e, id) => {
        if (activeWireRef.current) return;

        // If Ctrl or Meta is held, handle multi-selection click
        if (e && (e.ctrlKey || e.metaKey)) {
            onSelectComponent && onSelectComponent(id, e);
            onSelectWire && onSelectWire(null);
            if (isWireModeRef.current) {
                onDeactivateWireMode && onDeactivateWireMode();
            }
            return;
        }

        // If clicked component is not already part of an active multi-selection, select it alone
        if (!Array.isArray(selectedId) || !selectedId.includes(id)) {
            onSelectComponent && onSelectComponent(id);
        }
        onSelectWire && onSelectWire(null);
        if (isWireModeRef.current) {
            onDeactivateWireMode && onDeactivateWireMode();
        }

        const currentComps = componentsRef.current || components;
        const currentWires = wiresRef.current || wires;

        const comp = currentComps.find(c => c.id === id);
        if (!comp) return;

        // If multiple components are selected and user drags one of them, move all selected together
        if (Array.isArray(selectedId) && selectedId.includes(id) && selectedId.length > 1) {
            const otherSelected = currentComps.filter(c => selectedId.includes(c.id) && c.id !== id).map(c => ({
                id: c.id,
                initialX: c.x,
                initialY: c.y
            }));
            draggingRef.current = {
                mode: "multiple",
                id,
                initialMouseX: e.clientX,
                initialMouseY: e.clientY,
                initialCompX: comp.x,
                initialCompY: comp.y,
                mountedComponents: otherSelected,
                attachedWirePoints: []
            };
            return;
        }

        const isBreadboard = comp.type?.startsWith("breadboard");

        if (isBreadboard) {
            const bbWidth = comp.width || (comp.type === "breadboard-full" ? 960 : comp.type === "breadboard-mini" ? 272 : 560);
            const bbHeight = comp.height || (comp.type === "breadboard-mini" ? 192 : 288);
            const bbLeft = comp.x;
            const bbRight = comp.x + bbWidth;
            const bbTop = comp.y;
            const bbBottom = comp.y + bbHeight;

            // Strictly ONLY components mounted on THIS breadboard!
            // Exclude other breadboards and components mounted on other boards
            const mountedComponents = currentComps.filter(c => {
                if (c.id === id || c.type?.startsWith("breadboard")) return false;

                // Explicit match
                if (c.mountedBoardId) {
                    return c.mountedBoardId === id;
                }

                // If no explicit mountedBoardId yet, check if inside this board's boundary
                // AND not closer to or inside another breadboard
                const isInThis = (
                    c.x >= bbLeft - 16 && c.x <= bbRight + 16 && 
                    c.y >= bbTop - 16 && c.y <= bbBottom + 16
                );
                if (!isInThis) return false;

                // Make sure another breadboard isn't also containing this component
                const otherBB = currentComps.find(other => 
                    other.id !== id && 
                    other.type?.startsWith("breadboard") &&
                    c.x >= other.x - 16 && c.x <= other.x + (other.width || 560) + 16 &&
                    c.y >= other.y - 16 && c.y <= other.y + (other.height || 288) + 16
                );
                if (otherBB) return false;

                return true;
            }).map(c => ({
                id: c.id,
                initialX: c.x,
                initialY: c.y
            }));

            // Find wire points attached specifically to this breadboard
            const attachedWirePoints = [];
            currentWires.forEach(w => {
                w.points?.forEach((pt, ptIdx) => {
                    const isInThis = (
                        pt.x >= bbLeft - 8 && pt.x <= bbRight + 8 && 
                        pt.y >= bbTop - 8 && pt.y <= bbBottom + 8
                    );
                    if (!isInThis) return;

                    // Exclude if it belongs to another breadboard
                    const otherBB = currentComps.find(other => 
                        other.id !== id && 
                        other.type?.startsWith("breadboard") &&
                        pt.x >= other.x - 8 && pt.x <= other.x + (other.width || 560) + 8 &&
                        pt.y >= other.y - 8 && pt.y <= other.y + (other.height || 288) + 8
                    );
                    if (otherBB) {
                        const distThis = Math.hypot(pt.x - (bbLeft + bbWidth / 2), pt.y - (bbTop + bbHeight / 2));
                        const otherW = otherBB.width || 560;
                        const otherH = otherBB.height || 288;
                        const distOther = Math.hypot(pt.x - (otherBB.x + otherW / 2), pt.y - (otherBB.y + otherH / 2));
                        if (distOther < distThis) return;
                    }

                    attachedWirePoints.push({
                        wireId: w.id,
                        ptIndex: ptIdx,
                        initialX: pt.x,
                        initialY: pt.y
                    });
                });
            });

            draggingRef.current = {
                mode: "breadboard",
                id,
                initialMouseX: e.clientX,
                initialMouseY: e.clientY,
                initialCompX: comp.x,
                initialCompY: comp.y,
                mountedComponents,
                attachedWirePoints
            };
        } else {
            // Standard single component drag with dynamic wire stretching for ALL components!
            const termPts = getComponentTerminalPoints(comp);
            const attachedWirePoints = [];
            currentWires.forEach(w => {
                if (!w.points || w.points.length === 0) return;
                w.points.forEach((pt, ptIdx) => {
                    const isNear = termPts.some(tp => Math.hypot(pt.x - tp.x, pt.y - tp.y) <= 30);
                    if (isNear) {
                        attachedWirePoints.push({
                            wireId: w.id,
                            ptIndex: ptIdx,
                            initialX: pt.x,
                            initialY: pt.y
                        });
                    }
                });
            });

            draggingRef.current = {
                mode: "single",
                id,
                initialMouseX: e.clientX,
                initialMouseY: e.clientY,
                initialCompX: comp.x,
                initialCompY: comp.y,
                attachedWirePoints
            };
        }
    };

    return (
        <section 
            ref={canvasRef}
            className={`canvas ${isDragOver ? "drag-over" : ""} ${isWireMode ? "wire-mode" : ""} ${isFocusMode ? "focus-mode" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
        >
            {/* TRULY INFINITE ENGINEERING GRID BACKGROUND (Zero edge / zero stopping space across all directions) */}
            <div 
                ref={infiniteDotGridRef}
                className="infinite-dot-grid"
                style={{
                    backgroundPosition: `${pan.x}px ${pan.y}px, ${pan.x}px ${pan.y}px`,
                    backgroundSize: `${16 * zoom}px ${16 * zoom}px, ${80 * zoom}px ${80 * zoom}px`
                }}
            />

            {/* TRANSFORMED INFINITE WORKSPACE VIEWPORT LAYER */}
            <div 
                ref={viewportLayerRef}
                className="canvas-viewport-layer"
                style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                    transformOrigin: "0 0"
                }}
            >

                {/* Wire Layer (Vector wires connecting grid points) */}
                <WireLayer 
                    wires={wires}
                    activeWire={activeWire}
                    selectedWireId={selectedWireId}
                    routingMode={routingMode}
                    isSimulating={isSimulating}
                    simulationResult={simulationResult}
                    isWireMode={isWireMode}
                    onSelectWire={(id) => {
                        onSelectWire(id);
                        onSelectComponent(null);
                    }}
                    onDeleteWire={onDeleteWire}
                    onStartWireAtPoint={handleConnectOrStartWire}
                    onUpdateWire={onUpdateWire}
                    onStartDragWirePoint={handleStartDragWirePoint}
                    screenToWorld={screenToWorld}
                />

                {/* Drop Target Indicator on hover */}
                {isDragOver && (
                    <div className="drop-target-hint">
                        <i className="ri-add-circle-line"></i>
                        <span>Drop to Place Component</span>
                    </div>
                )}

                {/* Wire Mode Guidance banner */}
                {isWireMode && !activeWire && (
                    <div className="wire-mode-guide">
                        <i className="ri-route-line"></i>
                        <span>Wire Tool: Click any point to start routing wire (Snaps to points)</span>
                    </div>
                )}

                {activeWire && (
                    <div className="wire-mode-guide active">
                        <i className="ri-pin-distance-line"></i>
                        <span>Click to add waypoint • Click terminal or hole to connect • Esc to cancel</span>
                    </div>
                )}

                {/* Inspiring ECE Motivational Quote for Empty Workspace */}
                {components.length === 0 && !isDragOver && (
                    <div className="canvas-quote-card" onClick={(e) => e.stopPropagation()}>
                        <div className="quote-top">
                            <div className="quote-icon">
                                <i className="ri-flashlight-line"></i>
                            </div>
                            <span className="quote-tag">{activeQuote.tag}</span>
                            <button 
                                type="button"
                                className="quote-cycle-btn" 
                                onClick={cycleQuote}
                                title="Another inspiring quote"
                            >
                                <i className="ri-refresh-line"></i>
                            </button>
                        </div>

                        <blockquote className="quote-text">
                            "{activeQuote.quote}"
                        </blockquote>

                        <div className="quote-footer">
                            <span className="quote-author">— {activeQuote.author}</span>
                        </div>
                    </div>
                )}

                {/* Render Placed Components: Breadboards always at z-index 5/8 (beneath small components) */}
                {(() => {
                    const isCompSelected = (id) => {
                        if (!selectedId) return false;
                        if (selectedId === "all") return true;
                        if (Array.isArray(selectedId)) return selectedId.includes(id);
                        return selectedId === id;
                    };

                    return components.map((comp) => {
                        const isBreadboard = comp.type?.startsWith("breadboard");

                        if (isBreadboard) {
                            return (
                                <Breadboard
                                    key={comp.id}
                                    id={comp.id}
                                    type={comp.type}
                                    color={comp.color}
                                    x={comp.x}
                                    y={comp.y}
                                    rotation={comp.rotation || 0}
                                    isSelected={isCompSelected(comp.id)}
                                    isWireMode={isWireMode}
                                    activeWire={activeWire}
                                    onStartWireAtPoint={handleConnectOrStartWire}
                                    onSelect={(id, evt) => {
                                        onSelectComponent(id, evt);
                                        onSelectWire(null);
                                        onDeactivateWireMode && onDeactivateWireMode();
                                    }}
                                    onDelete={onDeleteComponent}
                                    onRotate={(id) => {
                                        if (onRotateComponent) {
                                            onRotateComponent(id);
                                        } else {
                                            onUpdateComponent(id, { 
                                                rotation: ((comp.rotation || 0) + 90) % 360 
                                            });
                                            onNotifyChange && onNotifyChange();
                                        }
                                    }}
                                    onMouseDown={handleStartDragPlaced}
                                />
                            );
                        }

                        if ([
                            "arduino-uno", "arduino-mega", "arduino-nano", "esp32", "esp32-devkit", "esp32-s3", 
                            "rpi-pico", "raspberry-pi", "rpi-pico-2", "stm32-nucleo", "stm32-blue-pill", "stm32-bluepill", 
                            "stm32-black-pill", "nxp-lpc1768", "ti-tiva-c", "ti-msp430", "pic18f4550", "nordic-nrf52840", 
                            "attiny85", "teensy-41", "esp8266-nodemcu"
                        ].includes(comp.type)) {
                            return (
                                <McuBoard
                                    key={comp.id}
                                    id={comp.id}
                                    type={comp.type}
                                    name={comp.name}
                                    x={comp.x}
                                    y={comp.y}
                                    rotation={comp.rotation || 0}
                                    isSelected={isCompSelected(comp.id)}
                                    onSelect={(id, evt) => {
                                        onSelectComponent(id, evt);
                                        onSelectWire(null);
                                        onDeactivateWireMode && onDeactivateWireMode();
                                    }}
                                    onDelete={onDeleteComponent}
                                    onRotate={(id) => {
                                        if (onRotateComponent) {
                                            onRotateComponent(id);
                                        } else {
                                            onUpdateComponent(id, { 
                                                rotation: ((comp.rotation || 0) + 90) % 360 
                                            });
                                            onNotifyChange && onNotifyChange();
                                        }
                                    }}
                                    onMouseDown={handleStartDragPlaced}
                                    isWireMode={isWireMode}
                                    activeWire={activeWire}
                                    onStartWireAtPoint={handleConnectOrStartWire}
                                    simState={simulationResult?.mcuStates?.[comp.id]}
                                    isSimulating={isSimulating}
                                />
                            );
                        }

                        if (comp.type === "multimeter") {
                            return (
                                <Multimeter
                                    key={comp.id}
                                    id={comp.id}
                                    x={comp.x}
                                    y={comp.y}
                                    rotation={comp.rotation || 0}
                                    mode={comp.mode || "voltage"}
                                    probeRed={comp.probeRed}
                                    probeBlack={comp.probeBlack}
                                    zoom={zoom}
                                    findSnapTarget={findNearestConnectionTarget}
                                    onUpdate={(updates) => {
                                        onUpdateComponent(comp.id, updates);
                                        onNotifyChange && onNotifyChange();
                                    }}
                                    simState={simulationResult?.dmmStates?.[comp.id]}
                                    isSelected={isCompSelected(comp.id)}
                                    onSelect={(id, evt) => {
                                        onSelectComponent(id, evt);
                                        onSelectWire(null);
                                        onDeactivateWireMode && onDeactivateWireMode();
                                    }}
                                    onDelete={onDeleteComponent}
                                    onMouseDown={handleStartDragPlaced}
                                    isWireMode={isWireMode}
                                    activeWire={activeWire}
                                    onStartWireAtPoint={handleConnectOrStartWire}
                                />
                            );
                        }

                        // Render Small Components (Resistor, LED, Capacitor, Pushbutton, Potentiometer, Battery, Buzzer)
                        return (
                            <SmallComponent
                                key={comp.id}
                                id={comp.id}
                                type={comp.type}
                                name={comp.name}
                                designator={comp.designator}
                                color={comp.color}
                                voltage={comp.voltage != null ? comp.voltage : 9}
                                x={comp.x}
                                y={comp.y}
                                rotation={comp.rotation || 0}
                                isPressed={comp.isPressed}
                                resistance={comp.resistance}
                                capacitance={comp.capacitance}
                                wiperValue={comp.wiperValue}
                                switchState={comp.switchState}
                                isOn={comp.isOn}
                                cells={comp.cells}
                                lux={comp.lux}
                                backlightColor={comp.backlightColor}
                                lcdTextColor={comp.lcdTextColor}
                                textLines={comp.textLines || comp.lines}
                                contrast={comp.contrast}
                                backlightOn={comp.backlightOn}
                                i2cAddress={comp.i2cAddress}
                                cursorCol={comp.cursorCol}
                                cursorRow={comp.cursorRow}
                                showCursor={comp.showCursor}
                                blinkCursor={comp.blinkCursor}
                                displayOn={comp.displayOn}
                                angle={comp.angle}
                                distanceCm={comp.distanceCm}
                                rangeCm={comp.rangeCm}
                                maxRangeCm={comp.maxRangeCm}
                                rangeM={comp.rangeM}
                                targetAngle={comp.targetAngle}
                                targetBallX={comp.targetBallX}
                                targetBallY={comp.targetBallY}
                                pirBallX={comp.pirBallX}
                                pirBallY={comp.pirBallY}
                                measuredDistanceCm={comp.measuredDistanceCm}
                                inRange={comp.inRange}
                                is3D={comp.is3D}
                                viewMode={comp.viewMode}
                                rot3D={comp.rot3D}
                                pitch3D={comp.pitch3D}
                                speed={comp.speed}
                                accessory={comp.accessory}
                                gearRatio={comp.gearRatio}
                                direction={comp.direction}
                                modelNumber={comp.modelNumber}
                                icCode={comp.icCode}
                                motionActive={comp.motionActive}
                                component={comp}
                                onUpdate={(updates) => {
                                    onUpdateComponent(comp.id, updates);
                                    onNotifyChange && onNotifyChange();
                                }}
                                simState={
                                    comp.type?.startsWith("battery") ? simulationResult?.batteryStates?.[comp.id] :
                                    comp.type === "resistor" ? simulationResult?.resistorStates?.[comp.id] :
                                    comp.type?.startsWith("capacitor") ? simulationResult?.capacitorStates?.[comp.id] :
                                    comp.type === "buzzer" ? simulationResult?.buzzerStates?.[comp.id] :
                                    (comp.type === "motor-dc" || comp.type === "motor-geared" || comp.type === "motor-bo") ? simulationResult?.motorStates?.[comp.id] :
                                    comp.type?.startsWith("lcd") ? simulationResult?.lcdStates?.[comp.id] :
                                    (comp.type === "sensor-pir" || comp.type === "sensor-ultrasonic") ? simulationResult?.sensorStates?.[comp.id] :
                                    comp.type?.startsWith("ic-") ? simulationResult?.icStates?.[comp.id] :
                                    comp.type === "servo-sg90" ? simulationResult?.servoStates?.[comp.id] :
                                    simulationResult?.ledStates?.[comp.id]
                                }
                                isSimulating={isSimulating}
                                isSelected={isCompSelected(comp.id)}
                                isWireMode={isWireMode}
                                activeWire={activeWire}
                                onStartWireAtPoint={handleConnectOrStartWire}
                                onSelect={(id, evt) => {
                                    onSelectComponent(id, evt);
                                    onSelectWire(null);
                                    onDeactivateWireMode && onDeactivateWireMode();
                                }}
                                onDelete={onDeleteComponent}
                                onRotate={(id) => {
                                    if (onRotateComponent) {
                                        onRotateComponent(id);
                                    } else {
                                        onUpdateComponent(id, { 
                                            rotation: ((comp.rotation || 0) + 90) % 360 
                                        });
                                        onNotifyChange && onNotifyChange();
                                    }
                                }}
                                onMouseDown={handleStartDragPlaced}
                            />
                        );
                    });
                })()}

                {/* 5. Ghost Component Preview Accurately Following Cursor in Placement Mode */}
                {placingComponent && placingPos && (
                    <div 
                        className="placing-ghost-wrapper"
                        style={{
                            position: "absolute",
                            left: `${placingPos.x}px`,
                            top: `${placingPos.y}px`,
                            transform: `rotate(${placingRotation}deg)`,
                            transformOrigin: "0 0",
                            pointerEvents: "none",
                            zIndex: 85,
                            opacity: 0.9,
                            filter: "drop-shadow(0 0 16px rgba(255, 138, 0, 0.8))"
                        }}
                    >
                        {(() => {
                            const isBoard = placingComponent.category === "boards" || 
                                            placingComponent.type?.startsWith("arduino") || 
                                            placingComponent.type?.startsWith("esp") || 
                                            placingComponent.type?.startsWith("rpi") || 
                                            placingComponent.type?.includes("pico") || 
                                            placingComponent.type?.startsWith("stm32") || 
                                            placingComponent.type?.startsWith("teensy") || 
                                            placingComponent.type?.includes("nucleo") || 
                                            placingComponent.type?.startsWith("ti-") || 
                                            placingComponent.type?.startsWith("nxp-") || 
                                            placingComponent.type?.startsWith("pic") || 
                                            placingComponent.type?.startsWith("nordic") || 
                                            placingComponent.type === "attiny85" ||
                                            ["arduino-uno", "arduino-mega", "arduino-nano", "esp32", "esp32-devkit", "esp32-s3", "rpi-pico", "raspberry-pi", "esp8266-nodemcu", "stm32-nucleo", "teensy-41"].includes(placingComponent.type);

                            if (isBoard) {
                                return (
                                    <McuBoard
                                        id="placing-ghost-preview"
                                        type={placingComponent.type}
                                        name={placingComponent.name}
                                        x={0}
                                        y={0}
                                        rotation={0}
                                        isSelected={true}
                                    />
                                );
                            }

                            if (placingComponent.type?.startsWith("breadboard")) {
                                return (
                                    <Breadboard
                                        id="placing-ghost-preview"
                                        type={placingComponent.type}
                                        name={placingComponent.name}
                                        x={0}
                                        y={0}
                                        rotation={0}
                                        isSelected={true}
                                    />
                                );
                            }

                            if (placingComponent.type === "multimeter") {
                                return (
                                    <Multimeter
                                        id="placing-ghost-preview"
                                        x={0}
                                        y={0}
                                        rotation={0}
                                        isSelected={true}
                                    />
                                );
                            }

                            if (placingComponent.type === "oscilloscope") {
                                return (
                                    <div style={{ width: 160, height: 100, background: "#090d16", borderRadius: 8, border: "2px solid #334155", padding: 8, display: "flex", gap: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}>
                                        <div style={{ flex: 1, background: "#02120e", borderRadius: 4, border: "1px solid #043226", position: "relative", overflow: "hidden" }}>
                                            <svg width="100%" height="100%" viewBox="0 0 80 50">
                                                <line x1="0" y1="25" x2="80" y2="25" stroke="rgba(16,185,129,0.3)" strokeWidth="0.8" />
                                                <line x1="40" y1="0" x2="40" y2="50" stroke="rgba(16,185,129,0.3)" strokeWidth="0.8" />
                                                <path d="M 0 25 Q 20 8, 40 25 T 80 25" fill="none" stroke="#facc15" strokeWidth="1.8" />
                                            </svg>
                                        </div>
                                        <div style={{ width: 36, display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", alignItems: "center" }}>
                                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e293b", border: "1.5px solid #475569" }}></div>
                                            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#1e293b", border: "1.5px solid #475569" }}></div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <SmallComponent
                                    id="placing-ghost-preview"
                                    type={placingComponent.type}
                                    name={placingComponent.name}
                                    designator={placingComponent.designator}
                                    color={placingComponent.color}
                                    voltage={placingComponent.voltage}
                                    resistance={placingComponent.resistance}
                                    capacitance={placingComponent.capacitance}
                                    wiperValue={placingComponent.wiperValue}
                                    isOn={placingComponent.isOn}
                                    cells={placingComponent.cells}
                                    lux={placingComponent.lux}
                                    backlightColor={placingComponent.backlightColor}
                                    lcdTextColor={placingComponent.lcdTextColor}
                                    angle={placingComponent.angle}
                                    distanceCm={placingComponent.distanceCm}
                                    is3D={placingComponent.is3D}
                                    viewMode={placingComponent.viewMode}
                                    rot3D={placingComponent.rot3D}
                                    pitch3D={placingComponent.pitch3D}
                                    speed={placingComponent.speed}
                                    x={0}
                                    y={0}
                                    rotation={0}
                                    isSelected={true}
                                />
                            );
                        })()}
                    </div>
                )}
            </div>

            {/* Top HUD Guidance pill when moving/placing a component */}
            {placingComponent && (
                <div className="placing-hud-pill">
                    <i className="ri-drag-move-line"></i>
                    <span>Moving <strong>{placingComponent.designator || placingComponent.name}</strong></span>
                    <span className="hud-tip">• Click canvas to place • <strong>[R]</strong> Rotate ({placingRotation}°) • <strong>[Esc]</strong> Cancel</span>
                </div>
            )}
        </section>
    );
}

export default Canvas;
