import "./workspace.css";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { solveCircuit } from "../../simulation/circuitSolver";
import { getNextComponentDesignator, formatComponentName } from "../../utils/componentNaming";
import { motion, AnimatePresence } from "framer-motion";
import Canvas from "../../components/workspace/Canvas/Canvas";
import TopFloatingBar from "../../components/workspace/TopFloatingBar/TopFloatingBar";
import LeftSidebar from "../../components/workspace/LeftSidebar/LeftSidebar";
import RightSidebar from "../../components/workspace/RightSidebar/RightSidebar";
import BottomConsole from "../../components/code/BottomConsole/BottomConsole";
import CodeEditor from "../../components/workspace/CodeEditor/CodeEditor";
import Minimap from "../../components/workspace/Minimap/Minimap";
import SchematicView from "../../components/workspace/SchematicView/SchematicView";
import Oscilloscope from "../../components/workspace/Instruments/Oscilloscope";
import ComponentSearchModal from "../../components/workspace/SearchModal/ComponentSearchModal";
import { McuExecutionSession, DEFAULT_SKETCHES } from "../../simulation/mcuRuntime";

const STORAGE_KEY = "twinlab_active_project";
const DRAFT_KEY = "twinlab_workspace_draft";

function Workspace({ onBackToHome }) {
    // Load initial project: check saved project or draft on reload
    const [components, setComponents] = useState(() => {
        try {
            const draft = sessionStorage.getItem(DRAFT_KEY);
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                if (parsedDraft.components && Array.isArray(parsedDraft.components)) {
                    return parsedDraft.components.filter(c => c.id !== "breadboard-default");
                }
            }
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.components && Array.isArray(parsed.components)) {
                    return parsed.components.filter(c => c.id !== "breadboard-default");
                }
            }
        } catch (e) {
            console.error("Storage load error:", e);
        }
        return [];
    });

    const [wires, setWires] = useState(() => {
        try {
            const draft = sessionStorage.getItem(DRAFT_KEY);
            if (draft) {
                const parsedDraft = JSON.parse(draft);
                if (parsedDraft.wires && Array.isArray(parsedDraft.wires)) return parsedDraft.wires;
            }
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.wires && Array.isArray(parsed.wires)) return parsed.wires;
            }
        } catch (e) {
            console.error("Storage load error:", e);
        }
        return [];
    });

    const [selectedId, setSelectedId] = useState(null);
    const [selectedWireId, setSelectedWireId] = useState(null);

    // Active project metadata
    const [projectMeta, setProjectMeta] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.name) return parsed;
            }
        } catch (e) {
            console.error("Meta load error:", e);
        }
        return {
            id: "proj-1",
            name: "Project - 1",
            chip: "ESP32-S3",
            accent: "#FF8A00"
        };
    });

    // Save & Unsaved State
    const [isUnsaved, setIsUnsaved] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);
    const [showExitModal, setShowExitModal] = useState(false);
    const [placingComponent, setPlacingComponent] = useState(null);

    // Wire Tool State
    const [isWireMode, setIsWireMode] = useState(false);
    const [wireColor, setWireColor] = useState("#10b981");
    const [routingMode, setRoutingMode] = useState("curved"); // "curved" | "manhattan" | "straight"

    // Infinite Workspace Viewport, Zoom, Lock & Focus Mode
    const [viewport, setViewport] = useState({ pan: { x: 0, y: 0 }, zoom: 1 });
    const [isZoomLocked, setIsZoomLocked] = useState(false);
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [viewMode, setViewMode] = useState("simulation"); // "simulation" | "schematic"
    const [isOscilloscopeOpen, setIsOscilloscopeOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // MCU Boards & Firmware Execution
    const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
    const [isSerialOpen, setIsSerialOpen] = useState(false);
    const [baudRate, setBaudRate] = useState(9600);
    const [targetMcuId, setTargetMcuId] = useState(null);
    const [mcuRuntimeStates, setMcuRuntimeStates] = useState({});
    const [serialLogs, setSerialLogs] = useState([]);
    const [isFirmwareExecuting, setIsFirmwareExecuting] = useState(false);
    const mcuSessionsRef = useRef({});

    // Available MCU boards on canvas
    const availableMcuBoards = useMemo(() => {
        return components.filter(c => ["arduino-uno", "arduino-mega", "arduino-nano", "esp32-devkit", "esp32", "esp32-s3"].includes(c.type));
    }, [components]);

    const activeTargetBoard = availableMcuBoards.find(b => b.id === targetMcuId) || availableMcuBoards[0] || null;

    // Real-Time SPICE/EDA Circuit Simulation
    const simulationResult = useMemo(() => {
        return solveCircuit({ components, wires, isSimulating, mcuStates: mcuRuntimeStates });
    }, [components, wires, isSimulating, mcuRuntimeStates]);

    const combinedLogs = useMemo(() => {
        const simLogs = simulationResult.logs || [];
        return [...simLogs, ...serialLogs];
    }, [simulationResult.logs, serialLogs]);

    // Sync MCU runtime when simulation starts or stops
    useEffect(() => {
        if (!isSimulating) {
            // Stop all MCU execution sessions
            Object.values(mcuSessionsRef.current).forEach(session => session.stop && session.stop());
            mcuSessionsRef.current = {};
            setMcuRuntimeStates({});
            setIsFirmwareExecuting(false);
            return;
        }

        // When simulation is active, ensure all MCU boards have an active session running
        availableMcuBoards.forEach(board => {
            if (!mcuSessionsRef.current[board.id]) {
                const session = new McuExecutionSession(board.id, board.type, {
                    onPinStateChange: (bId, pins, d13High, d2High) => {
                        setMcuRuntimeStates(prev => ({
                            ...prev,
                            [bId]: {
                                ...prev[bId],
                                pins,
                                d13High,
                                d2High,
                                isPowered: true
                            }
                        }));
                    },
                    onSerialLog: (logItem) => {
                        setSerialLogs(prev => [...prev.slice(-150), logItem]);
                    },
                    onTxPulse: () => {
                        setMcuRuntimeStates(prev => ({
                            ...prev,
                            [board.id]: {
                                ...prev[board.id],
                                txrxActive: true
                            }
                        }));
                        setTimeout(() => {
                            setMcuRuntimeStates(prev => ({
                                ...prev,
                                [board.id]: {
                                    ...prev[board.id],
                                    txrxActive: false
                                }
                            }));
                        }, 80);
                    }
                });

                mcuSessionsRef.current[board.id] = session;
                session.startDefaultBlink();
            }
        });
    }, [isSimulating, availableMcuBoards]);

    const handleUploadAndRunSketch = useCallback((sketchCode, cb) => {
        let boardId = activeTargetBoard?.id || availableMcuBoards[0]?.id;
        let boardType = activeTargetBoard?.type || availableMcuBoards[0]?.type || "arduino-uno";

        if (!boardId) {
            // Auto-create Arduino Uno if sketch uploaded with no board on canvas
            boardId = `arduino-${Date.now()}`;
            const newBoard = {
                id: boardId,
                type: "arduino-uno",
                name: "Arduino Uno R3",
                designator: "ARD1",
                x: 80,
                y: 380,
                rotation: 0
            };
            setComponents(prev => [...prev, newBoard]);
            setTargetMcuId(boardId);
        }

        if (!isSimulating) {
            setIsSimulating(true);
        }

        if (mcuSessionsRef.current[boardId]) {
            mcuSessionsRef.current[boardId].stop();
        }

        const session = new McuExecutionSession(boardId, boardType, {
            onPinStateChange: (bId, pins, d13High, d2High) => {
                setMcuRuntimeStates(prev => ({
                    ...prev,
                    [bId]: {
                        ...prev[bId],
                        pins,
                        d13High,
                        d2High,
                        isPowered: true
                    }
                }));
            },
            onSerialLog: (logItem) => {
                setSerialLogs(prev => [...prev.slice(-150), logItem]);
            },
            onTxPulse: () => {
                setMcuRuntimeStates(prev => ({
                    ...prev,
                    [boardId]: {
                        ...prev[boardId],
                        txrxActive: true
                    }
                }));
                setTimeout(() => {
                    setMcuRuntimeStates(prev => ({
                        ...prev,
                        [boardId]: {
                            ...prev[boardId],
                            txrxActive: false
                        }
                    }));
                }, 80);
            },
            onCompileError: (err) => {
                cb && cb(err);
            }
        });

        mcuSessionsRef.current[boardId] = session;
        const result = session.compileAndRun(sketchCode);
        setIsFirmwareExecuting(true);
        cb && cb(result.success ? null : result.error);

        setToastMessage(`⚡ Firmware Uploaded to ${boardType === "esp32" || boardType === "esp32-devkit" ? "ESP32 DevKit" : "Arduino Uno"}`);
        setTimeout(() => setToastMessage(""), 2200);
    }, [activeTargetBoard, availableMcuBoards, isSimulating]);

    const handleStopFirmware = useCallback(() => {
        const boardId = activeTargetBoard?.id || availableMcuBoards[0]?.id;
        if (boardId && mcuSessionsRef.current[boardId]) {
            mcuSessionsRef.current[boardId].stop();
        }
        setIsFirmwareExecuting(false);
        setToastMessage("⏹ Firmware Execution Halted");
        setTimeout(() => setToastMessage(""), 2000);
    }, [activeTargetBoard, availableMcuBoards]);

    const selectedComponent = components.find(c => c.id === selectedId);

    // Keep draft updated in session storage so page reloads never lose in-progress work
    useEffect(() => {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ components, wires }));
        } catch (e) {
            // ignore
        }
    }, [components, wires]);

    // Save Project handler
    
    const handleRenameProject = useCallback((newName) => {
        if (!newName || !newName.trim()) return;
        const trimmed = newName.trim();
        setProjectMeta(prev => {
            const updated = { ...prev, name: trimmed };
            try {
                const savedList = JSON.parse(localStorage.getItem("twinlab_projects") || "[]");
                const idx = savedList.findIndex(p => p.id === updated.id);
                if (idx >= 0) {
                    savedList[idx] = { ...savedList[idx], name: trimmed };
                    localStorage.setItem("twinlab_projects", JSON.stringify(savedList));
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...updated, components, wires }));
            } catch (e) {
                console.error("Rename storage error", e);
            }
            return updated;
        });
        setToastMessage(`Project renamed to "${trimmed}"`);
        setTimeout(() => setToastMessage(""), 2200);
    }, [components, wires]);

    const handleSaveProject = useCallback(() => {
        const projectData = {
            ...projectMeta,
            components,
            wires,
            status: "Saved",
            lastEdited: "Just now",
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify(projectData));

        try {
            const listStr = localStorage.getItem("twinlab_user_projects");
            let list = listStr ? JSON.parse(listStr) : [];
            const idx = list.findIndex(p => p.id === projectData.id);
            if (idx >= 0) {
                list[idx] = projectData;
            } else {
                list.unshift(projectData);
            }
            localStorage.setItem("twinlab_user_projects", JSON.stringify(list));
        } catch (e) {
            console.error("Project sync error:", e);
        }

        setIsUnsaved(false);
        setToastMessage(`Project "${projectData.name}" saved (Ctrl+S)`);
        setTimeout(() => setToastMessage(null), 2500);
    }, [components, wires, projectMeta]);

    // ==========================================
    // UNDO / REDO & CLIPBOARD STATE
    // ==========================================
    const historyRef = useRef({ past: [], future: [] });
    const clipboardRef = useRef(null);
    const [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0 });

    // Record snapshot to history stack before changes
    const recordSnapshot = useCallback(() => {
        historyRef.current.past.push({
            components: JSON.parse(JSON.stringify(components)),
            wires: JSON.parse(JSON.stringify(wires)),
            selectedId,
            selectedWireId
        });
        if (historyRef.current.past.length > 40) {
            historyRef.current.past.shift();
        }
        historyRef.current.future = [];
        setHistoryCounts({ past: historyRef.current.past.length, future: 0 });
    }, [components, wires, selectedId, selectedWireId]);

    // Undo action (Ctrl+Z)
    const handleUndo = useCallback(() => {
        if (historyRef.current.past.length === 0) {
            setToastMessage("Nothing to undo");
            setTimeout(() => setToastMessage(""), 1600);
            return;
        }
        historyRef.current.future.push({
            components: JSON.parse(JSON.stringify(components)),
            wires: JSON.parse(JSON.stringify(wires)),
            selectedId,
            selectedWireId
        });
        const prev = historyRef.current.past.pop();
        setComponents(prev.components);
        setWires(prev.wires);
        setSelectedId(prev.selectedId);
        setSelectedWireId(prev.selectedWireId);
        setIsUnsaved(true);
        setHistoryCounts({ past: historyRef.current.past.length, future: historyRef.current.future.length });
        setToastMessage("↩ Undo (Ctrl+Z)");
        setTimeout(() => setToastMessage(""), 1600);
    }, [components, wires, selectedId, selectedWireId]);

    // Redo action (Ctrl+Y or Ctrl+Shift+Z)
    const handleRedo = useCallback(() => {
        if (historyRef.current.future.length === 0) {
            setToastMessage("Nothing to redo");
            setTimeout(() => setToastMessage(""), 1600);
            return;
        }
        historyRef.current.past.push({
            components: JSON.parse(JSON.stringify(components)),
            wires: JSON.parse(JSON.stringify(wires)),
            selectedId,
            selectedWireId
        });
        const next = historyRef.current.future.pop();
        setComponents(next.components);
        setWires(next.wires);
        setSelectedId(next.selectedId);
        setSelectedWireId(next.selectedWireId);
        setIsUnsaved(true);
        setHistoryCounts({ past: historyRef.current.past.length, future: historyRef.current.future.length });
        setToastMessage("↪ Redo (Ctrl+Y)");
        setTimeout(() => setToastMessage(""), 1600);
    }, [components, wires, selectedId, selectedWireId]);

    // Copy action (Ctrl+C)
    const handleCopy = useCallback(() => {
        if (selectedId === "all" || selectedWireId === "all") {
            clipboardRef.current = {
                type: "all",
                data: {
                    components: JSON.parse(JSON.stringify(components)),
                    wires: JSON.parse(JSON.stringify(wires))
                }
            };
            setToastMessage(`📋 Copied All ${components.length} Components & ${wires.length} Wires (Ctrl+C)`);
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (selectedComponent) {
            clipboardRef.current = { type: "component", data: JSON.parse(JSON.stringify(selectedComponent)) };
            setToastMessage(`📋 Copied "${selectedComponent.name || 'Component'}" (Ctrl+C)`);
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (selectedWireId) {
            const wire = wires.find(w => w.id === selectedWireId);
            if (wire) {
                clipboardRef.current = { type: "wire", data: JSON.parse(JSON.stringify(wire)) };
                setToastMessage("📋 Copied Wire (Ctrl+C)");
                setTimeout(() => setToastMessage(""), 1800);
            }
        }
    }, [selectedComponent, selectedWireId, selectedId, components, wires]);

    // Cut action (Ctrl+X)
    const handleCut = useCallback(() => {
        if (selectedId === "all" || selectedWireId === "all") {
            recordSnapshot();
            clipboardRef.current = {
                type: "all",
                data: {
                    components: JSON.parse(JSON.stringify(components)),
                    wires: JSON.parse(JSON.stringify(wires))
                }
            };
            setComponents([]);
            setWires([]);
            setSelectedId(null);
            setSelectedWireId(null);
            setIsUnsaved(true);
            setToastMessage("✂ Cut All (Ctrl+X)");
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (selectedComponent) {
            recordSnapshot();
            clipboardRef.current = { type: "component", data: JSON.parse(JSON.stringify(selectedComponent)) };
            const compId = selectedId;
            setComponents(prev => prev.filter(c => c.id !== compId));
            setSelectedId(null);
            setIsUnsaved(true);
            setToastMessage(`✂ Cut "${selectedComponent.name || 'Component'}" (Ctrl+X)`);
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (selectedWireId) {
            const wire = wires.find(w => w.id === selectedWireId);
            if (wire) {
                recordSnapshot();
                clipboardRef.current = { type: "wire", data: JSON.parse(JSON.stringify(wire)) };
                const wireId = selectedWireId;
                setWires(prev => prev.filter(w => w.id !== wireId));
                setSelectedWireId(null);
                setIsUnsaved(true);
                setToastMessage("✂ Cut Wire (Ctrl+X)");
                setTimeout(() => setToastMessage(""), 1800);
            }
        }
    }, [selectedComponent, selectedWireId, selectedId, components, wires, recordSnapshot]);

    // Paste action (Ctrl+V)
    const handlePaste = useCallback(() => {
        if (!clipboardRef.current) {
            setToastMessage("Clipboard is empty");
            setTimeout(() => setToastMessage(""), 1600);
            return;
        }
        recordSnapshot();
        const offset = 32;
        if (clipboardRef.current.type === "all") {
            const data = clipboardRef.current.data;
            const pastedComps = (data.components || []).map(c => ({
                ...c,
                id: `${c.type}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                x: (c.x || 100) + offset,
                y: (c.y || 100) + offset
            }));
            const pastedWires = (data.wires || []).map(w => ({
                ...w,
                id: `wire-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                points: w.points ? w.points.map(p => ({ x: p.x + offset, y: p.y + offset })) : []
            }));
            setComponents(prev => [...prev, ...pastedComps]);
            setWires(prev => [...prev, ...pastedWires]);
            setSelectedId("all");
            setSelectedWireId("all");
            setIsUnsaved(true);
            setToastMessage("📋 Pasted All (Ctrl+V)");
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (clipboardRef.current.type === "component") {
            const original = clipboardRef.current.data;
            const newId = `${original.type}-${Date.now()}`;
            const newComp = {
                ...original,
                id: newId,
                x: (original.x || 320) + offset,
                y: (original.y || 112) + offset
            };
            setComponents(prev => [...prev, newComp]);
            setSelectedId(newId);
            setIsUnsaved(true);
            setToastMessage(`📋 Pasted "${newComp.name}" (Ctrl+V)`);
            setTimeout(() => setToastMessage(""), 1800);
        } else if (clipboardRef.current.type === "wire") {
            const original = clipboardRef.current.data;
            const newId = `wire-${Date.now()}`;
            const newWire = {
                ...original,
                id: newId,
                points: original.points.map(p => ({ x: p.x + 16, y: p.y + 16 }))
            };
            setWires(prev => [...prev, newWire]);
            setSelectedWireId(newId);
            setIsUnsaved(true);
            setToastMessage("📋 Pasted Wire (Ctrl+V)");
            setTimeout(() => setToastMessage(""), 1800);
        }
    }, [recordSnapshot]);

    // Duplicate action (Ctrl+D)
    const handleDuplicate = useCallback(() => {
        if (selectedComponent) {
            recordSnapshot();
            const offset = 32;
            const newId = `${selectedComponent.type}-${Date.now()}`;
            const cloned = {
                ...selectedComponent,
                id: newId,
                x: (selectedComponent.x || 320) + offset,
                y: (selectedComponent.y || 112) + offset
            };
            setComponents(prev => [...prev, cloned]);
            setSelectedId(newId);
            setIsUnsaved(true);
            setToastMessage(`Duplicate: "${cloned.name}" (Ctrl+D)`);
            setTimeout(() => setToastMessage(""), 1800);
            return;
        }
        if (selectedWireId) {
            const wire = wires.find(w => w.id === selectedWireId);
            if (wire) {
                recordSnapshot();
                const newId = `wire-${Date.now()}`;
                const cloned = {
                    ...wire,
                    id: newId,
                    points: wire.points.map(p => ({ x: p.x + 16, y: p.y + 16 }))
                };
                setWires(prev => [...prev, cloned]);
                setSelectedWireId(newId);
                setIsUnsaved(true);
                setToastMessage("Duplicate Wire (Ctrl+D)");
                setTimeout(() => setToastMessage(""), 1800);
            }
        }
    }, [selectedComponent, selectedWireId, wires, recordSnapshot]);

    // Global Keybindings: Undo, Redo, Save, Copy, Cut, Paste, Duplicate, Delete, Rotate
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if active element is an input, textarea or contentEditable
            const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable;
            if (isInput) return;

            const isCtrl = e.ctrlKey || e.metaKey;

            // 1. SAVE: Ctrl+S / Cmd+S
            if (isCtrl && (e.key === "s" || e.key === "S")) {
                e.preventDefault();
                handleSaveProject();
                return;
            }

            // SEARCH: Ctrl+F / Cmd+F
            if (isCtrl && (e.key === "f" || e.key === "F")) {
                e.preventDefault();
                setIsSearchOpen(true);
                return;
            }

            // SELECT ALL: Ctrl+A / Cmd+A
            if (isCtrl && (e.key === "a" || e.key === "A")) {
                e.preventDefault();
                setSelectedId("all");
                setSelectedWireId("all");
                setToastMessage(`✓ Selected All (${components.length} components, ${wires.length} wires)`);
                setTimeout(() => setToastMessage(""), 1600);
                return;
            }

            // 2. UNDO: Ctrl+Z / Cmd+Z (without Shift)
            if (isCtrl && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
                e.preventDefault();
                handleUndo();
                return;
            }

            // 3. REDO: Ctrl+Y or Ctrl+Shift+Z / Cmd+Shift+Z
            if ((isCtrl && (e.key === "y" || e.key === "Y")) || (isCtrl && e.shiftKey && (e.key === "z" || e.key === "Z"))) {
                e.preventDefault();
                handleRedo();
                return;
            }

            // 4. COPY: Ctrl+C / Cmd+C
            if (isCtrl && (e.key === "c" || e.key === "C")) {
                e.preventDefault();
                handleCopy();
                return;
            }

            // 5. CUT: Ctrl+X / Cmd+X
            if (isCtrl && (e.key === "x" || e.key === "X")) {
                e.preventDefault();
                handleCut();
                return;
            }

            // 6. PASTE: Ctrl+V / Cmd+V
            if (isCtrl && (e.key === "v" || e.key === "V")) {
                e.preventDefault();
                handlePaste();
                return;
            }

            // 7. DUPLICATE: Ctrl+D / Cmd+D
            if (isCtrl && (e.key === "d" || e.key === "D")) {
                e.preventDefault();
                handleDuplicate();
                return;
            }

            // 8. DELETE: Delete or Backspace
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedId === "all" || selectedWireId === "all") {
                    e.preventDefault();
                    recordSnapshot();
                    setComponents([]);
                    setWires([]);
                    setSelectedId(null);
                    setSelectedWireId(null);
                    setIsUnsaved(true);
                    setToastMessage("Deleted All (Del)");
                    setTimeout(() => setToastMessage(""), 1600);
                    return;
                }
                if (selectedId) {
                    e.preventDefault();
                    recordSnapshot();
                    setComponents(prev => prev.filter(c => c.id !== selectedId));
                    setSelectedId(null);
                    setIsUnsaved(true);
                    setToastMessage("Deleted Component (Del)");
                    setTimeout(() => setToastMessage(""), 1600);
                    return;
                }
                if (selectedWireId) {
                    e.preventDefault();
                    recordSnapshot();
                    setWires(prev => prev.filter(w => w.id !== selectedWireId));
                    setSelectedWireId(null);
                    setIsUnsaved(true);
                    setToastMessage("Deleted Wire (Del)");
                    setTimeout(() => setToastMessage(""), 1600);
                    return;
                }
            }

            // 9. ROTATE: 'R' or 'r'
            if (!isCtrl && (e.key === "r" || e.key === "R")) {
                if (selectedId && selectedComponent) {
                    e.preventDefault();
                    recordSnapshot();
                    setComponents(prev => prev.map(c => c.id === selectedId ? {
                        ...c,
                        rotation: ((c.rotation || 0) + 90) % 360
                    } : c));
                    setIsUnsaved(true);
                    setToastMessage("Rotated 90° (R)");
                    setTimeout(() => setToastMessage(""), 1400);
                    return;
                }
            }

            // 10. DESELECT: Escape
            if (e.key === "Escape") {
                if (selectedId || selectedWireId) {
                    setSelectedId(null);
                    setSelectedWireId(null);
                }
            }

            // 11. WIRE COLOR SHORTCUTS: '1' through '9'
            const wireKeyMap = {
                "1": { name: "Green", color: "#10b981" },
                "2": { name: "Red", color: "#ef4444" },
                "3": { name: "Black", color: "#1e293b" },
                "4": { name: "Blue", color: "#3b82f6" },
                "5": { name: "Yellow", color: "#eab308" },
                "6": { name: "Orange", color: "#f97316" },
                "7": { name: "White", color: "#f8fafc" },
                "8": { name: "Purple", color: "#8b5cf6" },
                "9": { name: "Brown", color: "#78350f" }
            };

            if (!isCtrl && wireKeyMap[e.key]) {
                const chosen = wireKeyMap[e.key];
                setWireColor(chosen.color);
                if (selectedWireId) {
                    recordSnapshot();
                    setWires(prev => prev.map(w => w.id === selectedWireId ? { ...w, color: chosen.color } : w));
                    setIsUnsaved(true);
                    setToastMessage(`Wire recolored: ${chosen.name} (Key ${e.key})`);
                } else {
                    setToastMessage(`Wire color: ${chosen.name} (Key ${e.key})`);
                }
                setTimeout(() => setToastMessage(""), 1400);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        handleSaveProject, 
        handleUndo, 
        handleRedo, 
        handleCopy, 
        handleCut, 
        handlePaste, 
        handleDuplicate, 
        selectedId, 
        selectedWireId, 
        selectedComponent, 
        recordSnapshot
    ]);

    // Browser back button / popstate handling: Shows in-app popup modal instead of native alert
    useEffect(() => {
        const handlePopState = () => {
            if (isUnsaved) {
                window.history.pushState(null, "", window.location.href);
                setShowExitModal(true);
            }
        };

        window.history.pushState(null, "", window.location.href);
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isUnsaved]);

    // Mutually exclusive selection and mode handlers to prevent UI collisions
    const handleSelectComponent = useCallback((id) => {
        setSelectedId(id);
        if (id) {
            setSelectedWireId(null);
            setIsWireMode(false);
        }
    }, []);

    const handleSelectWire = useCallback((id) => {
        setSelectedWireId(id);
        if (id) {
            setSelectedId(null);
        }
    }, []);

    const handleToggleWireMode = useCallback((val) => {
        setIsWireMode((prev) => {
            const nextVal = typeof val === "boolean" ? val : !prev;
            if (nextVal) {
                setSelectedId(null);
                setSelectedWireId(null);
            }
            return nextVal;
        });
    }, []);

    // Component modification handlers
    const handleAddComponent = (newComp) => {
        setIsWireMode(false);
        setSelectedWireId(null);

        if (newComp.type === "starter-led-resistor") {
            const resId = `resistor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const ledId = `led-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`;
            const res = { id: resId, type: "resistor", name: "Resistor (220Ω)", x: 320, y: 112, rotation: 0 };
            const led = { id: ledId, type: "led", name: "5mm LED (Red)", color: "#ef4444", x: 400, y: 112, rotation: 0 };
            setComponents(prev => [...prev, res, led]);
            setSelectedId(led.id);
            setIsUnsaved(true);
            setToastMessage("Added Starter: LED + Resistor");
            setTimeout(() => setToastMessage(""), 2000);
            return;
        }
        if (newComp.type === "starter-battery-led") {
            const batId = `battery-9v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const resId = `resistor-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`;
            const ledId = `led-${Date.now() + 2}-${Math.random().toString(36).substring(2, 6)}`;
            const bat = { id: batId, type: "battery-9v", name: "9V Battery", x: 192, y: 80, rotation: 0 };
            const res = { id: resId, type: "resistor", name: "Resistor (1kΩ)", x: 336, y: 112, rotation: 0 };
            const led = { id: ledId, type: "led", name: "5mm LED (Red)", color: "#ef4444", x: 416, y: 112, rotation: 0 };
            setComponents(prev => [...prev, bat, res, led]);
            setSelectedId(led.id);
            setIsUnsaved(true);
            setToastMessage("Added Starter: 9V Battery + Circuit");
            setTimeout(() => setToastMessage(""), 2000);
            return;
        }
        if (newComp.type === "starter-pot-led") {
            const potId = `potentiometer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const ledId = `led-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`;
            const pot = { id: potId, type: "potentiometer", name: "Potentiometer (10k)", x: 320, y: 112, rotation: 0 };
            const led = { id: ledId, type: "led", name: "5mm LED (Red)", color: "#ef4444", x: 384, y: 112, rotation: 0 };
            setComponents(prev => [...prev, pot, led]);
            setSelectedId(led.id);
            setIsUnsaved(true);
            setToastMessage("Added Starter: Potentiometer + LED");
            setTimeout(() => setToastMessage(""), 2000);
            return;
        }
        if (newComp.type === "starter-button-buzzer") {
            const btnId = `button-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const buzId = `buzzer-${Date.now() + 1}-${Math.random().toString(36).substring(2, 6)}`;
            const btn = { id: btnId, type: "button", name: "Tactile Pushbutton", x: 320, y: 112, rotation: 0 };
            const buz = { id: buzId, type: "buzzer", name: "Piezo Buzzer", x: 384, y: 112, rotation: 0 };
            setComponents(prev => [...prev, btn, buz]);
            setSelectedId(buz.id);
            setIsUnsaved(true);
            setToastMessage("Added Starter: Pushbutton + Buzzer");
            setTimeout(() => setToastMessage(""), 2000);
            return;
        }

        // Automatic reference designator (R1, R2, LED1, C1, BAT1, etc.)
        const designator = newComp.designator || getNextComponentDesignator(newComp.type, components);
        const name = newComp.name || formatComponentName(newComp.type, designator, newComp);

        const compPrepared = {
            id: newComp.id || `${newComp.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            type: newComp.type,
            designator,
            name,
            color: newComp.color,
            resistance: newComp.resistance != null ? newComp.resistance : (newComp.type === "resistor" ? 220 : undefined),
            capacitance: newComp.capacitance,
            voltage: newComp.voltage != null ? newComp.voltage : (newComp.type === "battery-9v" ? 9 : (newComp.type === "battery-coin" ? 3 : undefined)),
            rotation: 0,
            mountedBoardId: newComp.mountedBoardId || null
        };

        // If explicit coordinates were passed (e.g. from Drag & Drop directly onto canvas):
        if (newComp.x != null && newComp.y != null) {
            recordSnapshot();
            const placed = { ...compPrepared, x: newComp.x, y: newComp.y };
            setComponents(prev => [...prev, placed]);
            setSelectedId(placed.id);
            setIsUnsaved(true);
            return;
        }

        // Interactive cursor-following placement mode for all components:
        setPlacingComponent(compPrepared);
        setToastMessage(`Positioning ${designator}: Move cursor and click to place • [R] Rotate • [Esc] Cancel`);
        setTimeout(() => setToastMessage(""), 3500);
    };

    const handleOpenMultimeter = useCallback(() => {
        const dmm = components.find(c => c.type === "multimeter");
        if (dmm) {
            handleSelectComponent(dmm.id);
        } else {
            handleAddComponent({ type: "multimeter", x: 260, y: 320 });
        }
    }, [components, handleSelectComponent]);

    const handleCommitPlacingComponent = (placedComp) => {
        recordSnapshot();
        setComponents(prev => [...prev, placedComp]);
        setSelectedId(placedComp.id);
        setPlacingComponent(null);
        setIsUnsaved(true);
        setToastMessage(`Placed ${placedComp.designator || placedComp.name}`);
        setTimeout(() => setToastMessage(""), 2000);
    };

    const handleCancelPlacingComponent = () => {
        setPlacingComponent(null);
    };

    const handleUpdateComponent = (id, updates) => {
        recordSnapshot();
        setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleDeleteComponent = (id, record = true) => {
        if (record) recordSnapshot();
        setComponents(prev => prev.filter(c => c.id !== id));
        if (selectedId === id) setSelectedId(null);
        setIsUnsaved(true);
    };

    const handleRotateSelected = () => {
        if (!selectedId || !selectedComponent) return;
        handleUpdateComponent(selectedId, {
            rotation: ((selectedComponent.rotation || 0) + 90) % 360
        });
        setIsUnsaved(true);
    };

    // Wire handlers
    const handleAddWire = (wire) => {
        recordSnapshot();
        setWires(prev => [...prev, wire]);
        setIsUnsaved(true);
    };

    const handleDeleteWire = (id, record = true) => {
        const targetId = id || selectedWireId;
        if (!targetId) return;
        if (record) recordSnapshot();
        setWires(prev => prev.filter(w => w.id !== targetId));
        if (selectedWireId === targetId) setSelectedWireId(null);
        setIsUnsaved(true);
        setToastMessage("🗑 Deleted Wire (Del)");
        setTimeout(() => setToastMessage(""), 1600);
    };

    // Batch update wires when breadboard is dragged (extends connected wires)
    const handleBatchUpdateWires = useCallback((attachedPoints, deltaX, deltaY) => {
        setWires(prevWires => {
            const pointMap = new Map();
            attachedPoints.forEach(ap => {
                const key = `${ap.wireId}-${ap.ptIndex}`;
                pointMap.set(key, { initialX: ap.initialX, initialY: ap.initialY });
            });

            return prevWires.map(w => {
                const newPoints = w.points.map((pt, idx) => {
                    const key = `${w.id}-${idx}`;
                    if (pointMap.has(key)) {
                        const init = pointMap.get(key);
                        return { x: init.initialX + deltaX, y: init.initialY + deltaY };
                    }
                    return pt;
                });
                return { ...w, points: newPoints };
            });
        });
        setIsUnsaved(true);
    }, []);

    // Double tap move all components and wires
    const handleUpdateAllComponentsAndWires = useCallback((newComps, newWires) => {
        setComponents(newComps);
        setWires(newWires);
        setIsUnsaved(true);
    }, []);

    // Zoom & Viewport Actions
    const handleZoomIn = () => {
        if (isZoomLocked) return;
        setViewport(prev => ({
            ...prev,
            zoom: Math.min(3, +(prev.zoom + 0.15).toFixed(2))
        }));
    };

    const handleZoomOut = () => {
        if (isZoomLocked) return;
        setViewport(prev => ({
            ...prev,
            zoom: Math.max(0.25, +(prev.zoom - 0.15).toFixed(2))
        }));
    };

    const handleResetZoom = () => {
        setViewport(prev => ({ ...prev, zoom: 1 }));
    };

    const handleResetView = () => {
        if (components.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            components.forEach(c => {
                minX = Math.min(minX, c.x);
                maxX = Math.max(maxX, c.x + (c.type?.startsWith("breadboard") ? 560 : 80));
                minY = Math.min(minY, c.y);
                maxY = Math.max(maxY, c.y + (c.type?.startsWith("breadboard") ? 288 : 80));
            });
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const viewW = window.innerWidth || 1200;
            const viewH = window.innerHeight || 800;
            setViewport({
                zoom: 1,
                pan: {
                    x: Math.round(viewW / 2 - centerX),
                    y: Math.round(viewH / 2 - centerY)
                }
            });
        } else {
            setViewport({ pan: { x: 0, y: 0 }, zoom: 1 });
        }
    };

    const handlePanTo = ({ x, y }) => {
        setViewport(prev => ({ ...prev, pan: { x, y } }));
    };

    // Exit flow
    const handleBackClick = () => {
        if (isUnsaved) {
            setShowExitModal(true);
        } else {
            onBackToHome && onBackToHome();
        }
    };

    return (
        <section 
            className={`workspace ${isFocusMode ? "focus-active" : ""}`}
            style={{
                "--project-accent": projectMeta.accent || "#FF8A00",
                "--project-accent-glow": `${projectMeta.accent || "#FF8A00"}40`,
                "--project-accent-subtle": `${projectMeta.accent || "#FF8A00"}15`,
                "--project-accent-border": `${projectMeta.accent || "#FF8A00"}45`
            }}
        >
            {/* View Mode Toggle: Interactive Canvas vs IEEE Schematic Diagram */}
            {viewMode === "schematic" ? (
                <SchematicView
                    components={components}
                    wires={wires}
                    simulationResult={simulationResult}
                    selectedId={selectedId}
                    onSelectComponent={handleSelectComponent}
                    projectName={projectMeta.name || "Project - 1"}
                    zoom={viewport.zoom}
                    onUpdateZoom={(newZoom) => setViewport(prev => ({ ...prev, zoom: newZoom }))}
                    onClose={() => setViewMode("simulation")}
                />
            ) : (
                <Canvas
                    components={components}
                    wires={wires}
                    simulationResult={simulationResult}
                    onAddComponent={handleAddComponent}
                    onUpdateComponent={handleUpdateComponent}
                    onDeleteComponent={handleDeleteComponent}
                    onAddWire={handleAddWire}
                    onDeleteWire={handleDeleteWire}
                    onBatchUpdateWires={handleBatchUpdateWires}
                    onUpdateAllComponentsAndWires={handleUpdateAllComponentsAndWires}
                    selectedId={selectedId}
                    onSelectComponent={handleSelectComponent}
                    selectedWireId={selectedWireId}
                    onSelectWire={handleSelectWire}
                    isWireMode={isWireMode}
                    onDeactivateWireMode={() => setIsWireMode(false)}
                    wireColor={wireColor}
                    routingMode={routingMode}
                    onNotifyChange={() => setIsUnsaved(true)}
                    viewport={viewport}
                    onUpdateViewport={setViewport}
                    placingComponent={placingComponent}
                    onCommitPlacingComponent={handleCommitPlacingComponent}
                    onCancelPlacingComponent={handleCancelPlacingComponent}
                    isZoomLocked={isZoomLocked}
                    isFocusMode={isFocusMode}
                    onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                />
            )}

            {/* Minimap (Smoothly animated in Focus Mode per user request) */}
            <AnimatePresence>
                {isFocusMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                        <Minimap
                            components={components}
                            wires={wires}
                            viewport={viewport}
                            canvasSize={{ width: window.innerWidth, height: window.innerHeight }}
                            onPanTo={handlePanTo}
                            onResetView={handleResetView}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACTIVATED FOCUS BUTTON (Minimalist top center icon button) */}
            <AnimatePresence>
                {isFocusMode && (
                    <motion.div 
                        className="focus-mode-floating-control"
                        initial={{ opacity: 0, y: -16, scale: 0.88 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.88 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <button
                            type="button"
                            className="focus-exit-minimal-btn"
                            onClick={() => setIsFocusMode(false)}
                            title="Exit Focus Mode (F or Esc)"
                            aria-label="Exit Focus Mode"
                        >
                            <i className="ri-fullscreen-exit-line"></i>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Controls: Seamlessly fades out & in via CSS transitions */}
            <TopFloatingBar 
                projectName={projectMeta.name}
                projectAccent={projectMeta.accent || "#FF8A00"}
                onRenameProject={handleRenameProject}
                onBackToHome={handleBackClick} 
                onOpenSearch={() => setIsSearchOpen(true)}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={historyCounts.past > 0}
                canRedo={historyCounts.future > 0}
                selectedComponent={selectedComponent}
                onUpdateComponent={handleUpdateComponent}
                selectedWire={wires.find(w => w.id === selectedWireId)}
                onUpdateWire={(id, upd) => setWires(prev => prev.map(w => w.id === id ? { ...w, ...upd } : w))}
                onDeleteWire={handleDeleteWire}
                onRotate={handleRotateSelected}
                onDelete={() => selectedId && handleDeleteComponent(selectedId)}
                onAddComponent={handleAddComponent}
                isWireMode={isWireMode}
                onToggleWireMode={handleToggleWireMode}
                wireColor={wireColor}
                onChangeWireColor={setWireColor}
                routingMode={routingMode}
                onChangeRoutingMode={setRoutingMode}
                zoom={viewport.zoom}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onResetZoom={handleResetZoom}
                onResetView={handleResetView}
                isZoomLocked={isZoomLocked}
                onToggleZoomLock={() => setIsZoomLocked(!isZoomLocked)}
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
                isSimulating={isSimulating}
                onStartSimulation={() => {
                    setIsSimulating(true);
                    setToastMessage("⚡ Real-Time Circuit Simulation Started");
                    setTimeout(() => setToastMessage(""), 2200);
                }}
                onStopSimulation={() => {
                    setIsSimulating(false);
                    setToastMessage("⏹ Circuit Simulation Stopped");
                    setTimeout(() => setToastMessage(""), 2200);
                }}
                isCodeOpen={isCodeEditorOpen}
                onToggleCodeEditor={() => setIsCodeEditorOpen(prev => !prev)}
                viewMode={viewMode}
                onChangeViewMode={(mode) => setViewMode(mode)}
            />

            {/* Left Sidebar: Seamlessly fades out & in via CSS transitions */}
            <LeftSidebar onAddComponent={handleAddComponent} />

            {/* Right Sidebar: Seamlessly fades out & in via CSS transitions */}
            <RightSidebar 
                onOpenOscilloscope={() => setIsOscilloscopeOpen(true)}
                onOpenSerial={() => setIsSerialOpen(prev => !prev)}
                onOpenMultimeter={handleOpenMultimeter}
                selectedComponent={selectedComponent}
                components={components}
                onSelectComponent={handleSelectComponent}
                onUpdateComponent={handleUpdateComponent}
                onDeleteComponent={handleDeleteComponent}
                onRotateComponent={handleRotateSelected}
                onAddComponent={handleAddComponent}
                simulationResult={simulationResult}
            />

            {/* Bottom Console: Seamlessly fades out & in via CSS transitions */}
            <BottomConsole 
                logs={combinedLogs} 
                isSimulating={isSimulating} 
                supplyVoltage={simulationResult.supplyVoltage}
                isOpen={isSerialOpen}
                onToggleOpen={() => setIsSerialOpen(prev => !prev)}
            />

            {/* Embedded MCU Firmware Code Studio */}
            <AnimatePresence>
                {isCodeEditorOpen && (
                    <CodeEditor
                        isOpen={isCodeEditorOpen}
                        onClose={() => setIsCodeEditorOpen(false)}
                        targetBoard={activeTargetBoard}
                        availableBoards={availableMcuBoards}
                        onSelectTargetBoard={(id) => setTargetMcuId(id)}
                        onUploadAndRun={handleUploadAndRunSketch}
                        onStopExecution={handleStopFirmware}
                        isExecuting={isFirmwareExecuting}
                        onToggleSerialMonitor={() => setIsSerialOpen(prev => !prev)}
                        isSerialOpen={isSerialOpen}
                        baudRate={baudRate}
                        onChangeBaudRate={setBaudRate}
                    />
                )}
            </AnimatePresence>

            {/* Dual-Trace Digital Oscilloscope Virtual Instrument */}
            <AnimatePresence>
                {isOscilloscopeOpen && (
                    <Oscilloscope
                        isOpen={isOscilloscopeOpen}
                        onClose={() => setIsOscilloscopeOpen(false)}
                        isSimulating={isSimulating}
                        mcuStates={mcuRuntimeStates}
                        components={components}
                    />
                )}
            </AnimatePresence>

            {/* Component Search Spotlight Modal (Ctrl+F) */}
            <ComponentSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAddComponent={handleAddComponent}
                onOpenInstrument={(inst) => {
                    if (inst === "oscilloscope") setIsOscilloscopeOpen(true);
                    else if (inst === "multimeter") handleOpenMultimeter();
                }}
            />

            {/* Smooth In-App Animated Toast (Ctrl+S / Save feedback) */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        className="save-toast"
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.94 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                        <i className="ri-checkbox-circle-fill"></i>
                        <span>{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Smooth In-App Animated Save Project Modal (No native browser alerts) */}
            <AnimatePresence>
                {showExitModal && (
                    <motion.div 
                        className="exit-modal-overlay" 
                        onClick={() => setShowExitModal(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <motion.div 
                            className="exit-modal" 
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            <div className="exit-modal-icon">
                                <i className="ri-alert-line"></i>
                            </div>
                            <h3>Save your project?</h3>
                            <p>You have unsaved changes in your workspace. Do you want to save before leaving?</p>

                            <div className="exit-modal-actions">
                                <button 
                                    className="exit-btn cancel"
                                    onClick={() => setShowExitModal(false)}
                                >
                                    Keep Editing
                                </button>
                                <button 
                                    className="exit-btn discard"
                                    onClick={() => {
                                        setShowExitModal(false);
                                        setIsUnsaved(false);
                                        sessionStorage.removeItem(DRAFT_KEY);
                                        onBackToHome && onBackToHome();
                                    }}
                                >
                                    Discard & Exit
                                </button>
                                <button 
                                    className="exit-btn save"
                                    onClick={() => {
                                        handleSaveProject();
                                        setShowExitModal(false);
                                        onBackToHome && onBackToHome();
                                    }}
                                >
                                    Save & Exit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}

export default Workspace;
