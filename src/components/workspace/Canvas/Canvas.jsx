import "./Canvas.css";
import { useState, useRef, useEffect, useCallback } from "react";
import Breadboard from "../components/Breadboard";
import SmallComponent from "../components/SmallComponent";
import Multimeter from "../components/Multimeter";
import McuBoard, { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP32_PINS } from "../components/McuBoard";
import WireLayer from "../components/WireLayer";
import { ECE_MOTIVATIONAL_QUOTES } from "../../../data/motivationalQuotes";

const GRID_STEP = 16;
const snapToGrid = (val) => Math.round(val / GRID_STEP) * GRID_STEP;

function Canvas({ 
    components = [], 
    wires = [],
    onAddComponent, 
    onUpdateComponent, 
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
                const snappedX = snapToGrid(worldX);
                const snappedY = snapToGrid(worldY);

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
    }, [placingComponent, screenToWorld]);

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
            let targetX = snapToGrid(worldX);
            let targetY = snapToGrid(worldY);

            // Smart Breadboard Center Trough Snapping for DIP ICs (Row e at Y=128, Row f at Y=160)
            if (placingComponent.type?.startsWith("ic-")) {
                const targetBB = componentsRef.current?.find(b => 
                    b.type?.startsWith("breadboard") &&
                    targetX >= b.x - 32 && targetX <= b.x + (b.width || 560) + 32 &&
                    targetY >= b.y + 48 && targetY <= b.y + (b.height || 288) - 48
                );
                if (targetBB) {
                    const rowEY = targetBB.y + 128;
                    if (Math.abs(targetY - rowEY) <= 40) {
                        targetY = rowEY;
                    }
                }
            }

            onCommitPlacingComponent && onCommitPlacingComponent({
                ...placingComponent,
                x: targetX,
                y: targetY,
                rotation: placingRotation
            });
            setPlacingPos(null);
        };

        // Capture phase catches click BEFORE any breadboard or component element can stop propagation
        window.addEventListener("click", handleGlobalClickToPlace, true);
        return () => window.removeEventListener("click", handleGlobalClickToPlace, true);
    }, [placingComponent, placingRotation, screenToWorld, onCommitPlacingComponent]);

    // High-Precision Magnetic Connection Finder: Snaps active wire to ANY terminal, hole, or existing wire endpoint
    const findNearestConnectionTarget = useCallback((wx, wy, maxDist = 24) => {
        let bestTarget = null;
        let minD = maxDist;

        // 1. Check all existing wire endpoints (Allows unlimited wires to wrap cleanly to the exact same terminal/node!)
        wiresRef.current.forEach(w => {
            if (!w.points || w.points.length === 0) return;
            const pStart = w.points[0];
            const pEnd = w.points[w.points.length - 1];
            [pStart, pEnd].forEach(p => {
                const d = Math.hypot(wx - p.x, wy - p.y);
                if (d < minD) {
                    minD = d;
                    bestTarget = { x: p.x, y: p.y };
                }
            });
        });

        // 2. Check all placed components and their geometric terminal pins
        componentsRef.current.forEach(c => {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);
            const toWorld = (lx, ly) => ({
                x: Math.round(c.x + lx * cos - ly * sin),
                y: Math.round(c.y + lx * sin + ly * cos)
            });

            // Battery (Negative 24,-14 and Positive 72,-14)
            if (c.type === "battery-9v") {
                [toWorld(24, -14), toWorld(72, -14)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // 5mm LED (Anode 0,0 and Cathode 16,0)
            else if (c.type === "led") {
                [toWorld(0, 0), toWorld(16, 0)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Axial Resistor (0,0 and 64,0)
            else if (c.type === "resistor") {
                [toWorld(0, 0), toWorld(64, 0)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Ceramic Capacitor (0,16 and 16,16)
            else if (c.type === "capacitor-ceramic") {
                [toWorld(0, 16), toWorld(16, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Pushbutton (0,0, 32,0, 0,32, 32,32)
            else if (c.type === "button") {
                [toWorld(0, 0), toWorld(32, 0), toWorld(0, 32), toWorld(32, 32)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Potentiometer (0,48, 16,48, 32,48)
            else if (c.type === "potentiometer") {
                [toWorld(0, 48), toWorld(16, 48), toWorld(32, 48)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Slide Switch (0,16, 16,16, 32,16)
            else if (c.type === "slide-switch" || c.type === "switch-spdt") {
                [toWorld(0, 16), toWorld(16, 16), toWorld(32, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Buzzer (0,32, 16,32)
            else if (c.type === "buzzer") {
                [toWorld(0, 32), toWorld(16, 32)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // AA & AAA Battery Packs (Negative 16,-12 and Positive posLeadX,-12)
            else if (c.type === "battery-aa" || c.type === "battery-aaa") {
                const cellCount = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : 2);
                const totalWidth = cellCount === 1 ? 52 : cellCount === 4 ? 132 : 76;
                const posLeadX = totalWidth - 16;
                [toWorld(16, -12), toWorld(posLeadX, -12)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Coin Cell Battery CR2032 3V (Negative 16,32 and Positive 48,32)
            else if (c.type === "battery-coin") {
                [toWorld(16, 32), toWorld(48, 32)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // 16x2 Character LCD (I2C: GND 16,-10, VCC 32,-10, SDA 48,-10, SCL 64,-10)
            else if (c.type === "lcd-1602") {
                [toWorld(16, -10), toWorld(32, -10), toWorld(48, -10), toWorld(64, -10)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // SPST Toggle Switch (0,16 and 32,16)
            else if (c.type === "switch-spst") {
                [toWorld(0, 16), toWorld(32, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Photoresistor / LDR (0,16 and 32,16)
            else if (c.type === "photoresistor") {
                [toWorld(0, 16), toWorld(32, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // NPN Transistor 2N2222 (Collector: 0,16, Base: 16,16, Emitter: 32,16)
            else if (c.type === "transistor" || c.type === "transistor-npn") {
                [toWorld(0, 16), toWorld(16, 16), toWorld(32, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Electrolytic Capacitor (Anode: 0,16, Cathode: 16,16)
            else if (c.type === "capacitor-electrolytic") {
                [toWorld(0, 16), toWorld(16, 16)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // DC Hobby Motor (Pos: 0,48, Neg: 48,48)
            else if (c.type === "motor-dc") {
                [toWorld(0, 48), toWorld(48, 48)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Micro Servo SG90 (GND: 0,48, 5V: 16,48, PWM: 32,48)
            else if (c.type === "servo-sg90") {
                [toWorld(0, 48), toWorld(16, 48), toWorld(32, 48)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // HC-SR04 Ultrasonic Distance Sensor (VCC: 0,48, Trig: 16,48, Echo: 32,48, GND: 48,48)
            else if (c.type === "sensor-ultrasonic") {
                [toWorld(0, 48), toWorld(16, 48), toWorld(32, 48), toWorld(48, 48)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // PIR Motion Sensor (VCC: 0,48, OUT: 16,48, GND: 32,48)
            else if (c.type === "sensor-pir") {
                [toWorld(0, 48), toWorld(16, 48), toWorld(32, 48)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // DIP-14 Logic Gates (Top: 0 to 96 at Y=0, Bottom: 0 to 96 at Y=32)
            else if (c.type?.startsWith("ic-")) {
                const dipCols = [0, 16, 32, 48, 64, 80, 96];
                [...dipCols.map(px => toWorld(px, 0)), ...dipCols.map(px => toWorld(px, 32))].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // 20x4 Character LCD (I2C: GND 16,-10, VCC 32,-10, SDA 48,-10, SCL 64,-10)
            else if (c.type === "lcd-2004") {
                [toWorld(16, -10), toWorld(32, -10), toWorld(48, -10), toWorld(64, -10)].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Arduino Uno R3 Header Pins (Full 32 pins)
            else if (c.type === "arduino-uno") {
                const allArdPins = [
                    ...(ARDUINO_PINS?.digitalHigh || []),
                    ...(ARDUINO_PINS?.digitalLow || []),
                    ...(ARDUINO_PINS?.power || []),
                    ...(ARDUINO_PINS?.analog || [])
                ];
                allArdPins.forEach(pin => {
                    const pt = toWorld(pin.x, pin.y);
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Arduino Mega 2560 Header Pins (Full 70+ pins)
            else if (c.type === "arduino-mega") {
                const allMegaPins = [
                    ...(ARDUINO_MEGA_PINS?.digitalHigh || []),
                    ...(ARDUINO_MEGA_PINS?.digitalLow || []),
                    ...(ARDUINO_MEGA_PINS?.communication || []),
                    ...(ARDUINO_MEGA_PINS?.power || []),
                    ...(ARDUINO_MEGA_PINS?.analog || []),
                    ...(ARDUINO_MEGA_PINS?.dualDigital || [])
                ];
                allMegaPins.forEach(pin => {
                    const pt = toWorld(pin.x, pin.y);
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Arduino Nano Header Pins (DIP-30 pins)
            else if (c.type === "arduino-nano") {
                const allNanoPins = [
                    ...(ARDUINO_NANO_PINS?.topRow || []),
                    ...(ARDUINO_NANO_PINS?.botRow || [])
                ];
                allNanoPins.forEach(pin => {
                    const pt = toWorld(pin.x, pin.y);
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // ESP32 DevKit V1 Header Pins (Full 30 pins)
            else if (c.type === "esp32" || c.type === "esp32-devkit" || c.type === "esp32-s3") {
                const allEspPins = [
                    ...(ESP32_PINS?.leftCol || []),
                    ...(ESP32_PINS?.rightCol || [])
                ];
                allEspPins.forEach(pin => {
                    const pt = toWorld(pin.x, pin.y);
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Multimeter Probes
            else if (c.type === "multimeter") {
                const pRed = c.probeRed || { x: c.x + 160, y: c.y + 48 };
                const pBlack = c.probeBlack || { x: c.x + 160, y: c.y + 112 };
                [pRed, pBlack].forEach(pt => {
                    const d = Math.hypot(wx - pt.x, wy - pt.y);
                    if (d < minD) { minD = d; bestTarget = pt; }
                });
            }
            // Breadboard (Holes on 16px grid: Mini 17-col, Half 30-col, Full 60-col)
            else if (c.type?.startsWith("breadboard")) {
                const isMini = c.type === "breadboard-mini";
                const isFull = c.type === "breadboard-full";
                const cols = isMini ? 17 : isFull ? 60 : 30;
                const maxW = isMini ? 336 : isFull ? 1024 : 524;
                const maxH = isMini ? 200 : 280;
                const localX = wx - c.x;
                const localY = wy - c.y;
                if (localX >= 36 && localX <= maxW && localY >= 8 && localY <= maxH) {
                    const snapCol = Math.round((localX - 48) / 16);
                    if (snapCol >= 0 && snapCol < cols) {
                        const holeX = c.x + 48 + snapCol * 16;
                        const validYs = isMini 
                            ? [16, 32, 48, 64, 80, 112, 128, 144, 160, 176]
                            : [16, 32, 64, 80, 96, 112, 128, 160, 176, 192, 208, 224, 256, 272];
                        let closestY = validYs[0];
                        let minYDist = 999;
                        validYs.forEach(vy => {
                            const dy = Math.abs(localY - vy);
                            if (dy < minYDist) {
                                minYDist = dy;
                                closestY = vy;
                            }
                        });
                        const holeY = c.y + closestY;
                        const d = Math.hypot(wx - holeX, wy - holeY);
                        if (d < minD) {
                            minD = d;
                            bestTarget = { x: holeX, y: holeY };
                        }
                    }
                }
            }
        });

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

                scheduleViewportCommit();
            } else {
                // NORMAL PANNING: Smooth trackpad/mouse scroll
                const newPanX = currentPan.x - e.deltaX;
                const newPanY = currentPan.y - e.deltaY;

                pendingViewportRef.current = {
                    zoom: currentZoom,
                    pan: { x: newPanX, y: newPanY }
                };

                if (viewportLayerRef.current) {
                    viewportLayerRef.current.style.transform = `translate3d(${newPanX}px, ${newPanY}px, 0) scale(${currentZoom})`;
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
                const magneticTarget = findNearestConnectionTarget(worldX, worldY, 20);
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

            // B. Double-tap & drag on empty space: Move ALL components and wires together!
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
                            x: Math.max(0, c.x + deltaX),
                            y: Math.max(0, c.y + deltaY)
                        })),
                        initialWires.map(w => ({
                            ...w,
                            points: w.points ? w.points.map(pt => ({ x: pt.x + deltaX, y: pt.y + deltaY })) : []
                        }))
                    );
                } else {
                    initialComps.forEach(c => {
                        onUpdateComponent(c.id, { x: Math.max(0, c.x + deltaX), y: Math.max(0, c.y + deltaY) });
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

            if (dragData.mode === "breadboard") {
                // 1. Move breadboard
                onUpdateComponent(dragData.id, { x: Math.max(0, snappedX), y: Math.max(0, snappedY) });

                // 2. Move all components mounted on this breadboard
                dragData.mountedComponents?.forEach(m => {
                    onUpdateComponent(m.id, { 
                        x: Math.max(0, m.initialX + deltaX), 
                        y: Math.max(0, m.initialY + deltaY) 
                    });
                });

                // 3. Move attached wire endpoints! If one end is on external board, that end stays fixed, extending the wire!
                if (dragData.attachedWirePoints?.length > 0 && onBatchUpdateWires) {
                    onBatchUpdateWires(dragData.attachedWirePoints, deltaX, deltaY);
                }
            } else {
                // Single component drag
                let finalCompY = snappedY;
                const comp = componentsRef.current?.find(c => c.id === dragData.id);
                if (comp?.type?.startsWith("ic-")) {
                    const targetBB = componentsRef.current?.find(b => 
                        b.type?.startsWith("breadboard") &&
                        snappedX >= b.x - 32 && snappedX <= b.x + (b.width || 560) + 32 &&
                        snappedY >= b.y + 48 && snappedY <= b.y + (b.height || 288) - 48
                    );
                    if (targetBB) {
                        const rowEY = targetBB.y + 128;
                        if (Math.abs(snappedY - rowEY) <= 40) {
                            finalCompY = rowEY;
                        }
                    }
                }
                onUpdateComponent(dragData.id, { x: Math.max(0, snappedX), y: Math.max(0, finalCompY) });
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
                if (selectedId) {
                    const comp = components.find(c => c.id === selectedId);
                    if (comp) {
                        onUpdateComponent(selectedId, { rotation: ((comp.rotation || 0) + 90) % 360 });
                        onNotifyChange && onNotifyChange();
                    }
                }
            }

            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedWireId) {
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

    // Canvas Mouse Down: Detect double-tap on empty space to move all components
    const handleCanvasMouseDown = (e) => {
        if (activeWireRef.current || isWireModeRef.current) return;

        const isBackground = e.target === canvasRef.current || 
                             e.target.classList.contains("dot-grid") || 
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
            }
            lastEmptyClickTimeRef.current = now;
        }
    };

    // Canvas Click: Handle wire node placement, placing component commit, or selection clearing
    const handleCanvasClick = (e) => {
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
            const magneticTarget = findNearestConnectionTarget(worldX, worldY, 22);
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
            const { snappedX, snappedY } = screenToWorld(e.clientX, e.clientY);

            const isBreadboard = componentData.type?.startsWith("breadboard");

            // For small components: detect if dropped on an existing breadboard
            let mountedBoardId = null;
            let dropFinalY = snappedY;
            if (!isBreadboard) {
                const targetBB = (componentsRef.current || components).find(c => 
                    c.type?.startsWith("breadboard") &&
                    snappedX >= c.x - 16 && snappedX <= c.x + (c.width || 560) + 16 &&
                    snappedY >= c.y - 16 && snappedY <= c.y + (c.height || 288) + 16
                );
                if (targetBB) {
                    mountedBoardId = targetBB.id;
                    if (componentData.type?.startsWith("ic-")) {
                        const rowEY = targetBB.y + 128;
                        if (Math.abs(snappedY - rowEY) <= 40) {
                            dropFinalY = rowEY;
                        }
                    }
                }
            }

            const uniqueId = `${componentData.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const newPlaced = {
                id: uniqueId,
                type: componentData.type,
                name: componentData.name,
                color: componentData.color,
                x: snappedX,
                y: dropFinalY,
                rotation: 0,
                mountedBoardId: mountedBoardId
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

        // Automatically select the clicked component and deselect wire & wire mode
        onSelectComponent && onSelectComponent(id);
        onSelectWire && onSelectWire(null);
        if (isWireModeRef.current) {
            onDeactivateWireMode && onDeactivateWireMode();
        }

        const currentComps = componentsRef.current || components;
        const currentWires = wiresRef.current || wires;

        const comp = currentComps.find(c => c.id === id);
        if (!comp) return;

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
            // Standard single component drag
            draggingRef.current = {
                mode: "single",
                id,
                initialMouseX: e.clientX,
                initialMouseY: e.clientY,
                initialCompX: comp.x,
                initialCompY: comp.y
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
            {/* Move All Circuit Active HUD Indicator */}
            {isMoveAllActive && (
                <div className="move-all-hud-badge">
                    <i className="ri-drag-move-2-line"></i>
                    <span>Move Entire Circuit Active — Drag mouse to reposition all parts & wires</span>
                </div>
            )}

            {/* TRANSFORMED INFINITE WORKSPACE VIEWPORT LAYER */}
            <div 
                ref={viewportLayerRef}
                className="canvas-viewport-layer"
                style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                    transformOrigin: "0 0"
                }}
            >
                {/* 16px Infinite Engineering Grid Background */}
                <div className="dot-grid"></div>

                {/* Wire Layer (Vector wires connecting grid points) */}
                <WireLayer 
                    wires={wires}
                    activeWire={activeWire}
                    selectedWireId={selectedWireId}
                    routingMode={routingMode}
                    isSimulating={isSimulating}
                    simulationResult={simulationResult}
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
                        <span>Click to add waypoint • Double-tap terminal or breadboard hole to connect • Esc to cancel</span>
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
                {components.map((comp) => {
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
                                isSelected={selectedId === comp.id || selectedId === "all"}
                                isWireMode={isWireMode}
                                activeWire={activeWire}
                                onStartWireAtPoint={handleConnectOrStartWire}
                                onSelect={(id) => {
                                    onSelectComponent(id);
                                    onSelectWire(null);
                                    onDeactivateWireMode && onDeactivateWireMode();
                                }}
                                onDelete={onDeleteComponent}
                                onRotate={(id) => {
                                    onUpdateComponent(id, { 
                                        rotation: ((comp.rotation || 0) + 90) % 360 
                                    });
                                    onNotifyChange && onNotifyChange();
                                }}
                                onMouseDown={handleStartDragPlaced}
                            />
                        );
                    }

                    if (["arduino-uno", "arduino-mega", "arduino-nano", "esp32", "esp32-devkit", "esp32-s3"].includes(comp.type)) {
                        return (
                            <McuBoard
                                key={comp.id}
                                id={comp.id}
                                type={comp.type}
                                name={comp.name}
                                x={comp.x}
                                y={comp.y}
                                rotation={comp.rotation || 0}
                                isSelected={selectedId === comp.id || selectedId === "all"}
                                onSelect={(id) => {
                                    onSelectComponent(id);
                                    onSelectWire(null);
                                    onDeactivateWireMode && onDeactivateWireMode();
                                }}
                                onDelete={onDeleteComponent}
                                onRotate={(id) => {
                                    onUpdateComponent(id, { 
                                        rotation: ((comp.rotation || 0) + 90) % 360 
                                    });
                                    onNotifyChange && onNotifyChange();
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
                                isSelected={selectedId === comp.id || selectedId === "all"}
                                onSelect={(id) => {
                                    onSelectComponent(id);
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
                            angle={comp.angle}
                            distanceCm={comp.distanceCm}
                            onUpdate={(updates) => {
                                onUpdateComponent(comp.id, updates);
                                onNotifyChange && onNotifyChange();
                            }}
                            simState={
                                comp.type?.startsWith("battery") ? simulationResult?.batteryStates?.[comp.id] :
                                comp.type === "buzzer" ? simulationResult?.buzzerStates?.[comp.id] :
                                comp.type === "motor-dc" ? simulationResult?.motorStates?.[comp.id] :
                                comp.type?.startsWith("lcd") ? simulationResult?.lcdStates?.[comp.id] :
                                simulationResult?.ledStates?.[comp.id]
                            }
                            isSimulating={isSimulating}
                            isSelected={selectedId === comp.id || selectedId === "all"}
                            isWireMode={isWireMode}
                            activeWire={activeWire}
                            onStartWireAtPoint={handleConnectOrStartWire}
                            onSelect={(id) => {
                                onSelectComponent(id);
                                onSelectWire(null);
                                onDeactivateWireMode && onDeactivateWireMode();
                            }}
                            onDelete={onDeleteComponent}
                            onRotate={(id) => {
                                onUpdateComponent(id, { 
                                    rotation: ((comp.rotation || 0) + 90) % 360 
                                });
                                onNotifyChange && onNotifyChange();
                            }}
                            onMouseDown={handleStartDragPlaced}
                        />
                    );
                })}

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
                        {!placingComponent.type?.startsWith("breadboard") && 
                         !placingComponent.type?.startsWith("arduino") && 
                         !placingComponent.type?.startsWith("esp32") && 
                         placingComponent.type !== "multimeter" && (
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
                                x={0}
                                y={0}
                                rotation={0}
                                isSelected={true}
                            />
                        )}
                        {placingComponent.type?.startsWith("breadboard") && (
                            <Breadboard
                                id="placing-ghost-preview"
                                type={placingComponent.type}
                                name={placingComponent.name}
                                x={0}
                                y={0}
                                rotation={0}
                                isSelected={true}
                            />
                        )}
                        {placingComponent.type === "multimeter" && (
                            <Multimeter
                                id="placing-ghost-preview"
                                x={0}
                                y={0}
                                rotation={0}
                                isSelected={true}
                            />
                        )}
                        {["arduino-uno", "arduino-mega", "arduino-nano", "esp32", "esp32-devkit", "esp32-s3"].includes(placingComponent.type) && (
                            <McuBoard
                                id="placing-ghost-preview"
                                type={placingComponent.type}
                                x={0}
                                y={0}
                                rotation={0}
                                isSelected={true}
                            />
                        )}
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
