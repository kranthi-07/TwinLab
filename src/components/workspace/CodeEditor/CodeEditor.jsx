import "./CodeEditor.css";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_SKETCHES } from "../../../simulation/mcuRuntime";

/**
 * High-performance C++ / Arduino Syntax Tokenizer & Highlighter
 */
export function highlightArduinoCpp(code) {
    if (!code) return "";

    const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const tokenRegex = new RegExp(
        [
            "(?<comment>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
            "(?<preproc>#[a-zA-Z_]+(?:\\s+&lt;[^&>\\n]+&gt;|\\s+\"[^\"\\n]+\"|\\s+[a-zA-Z0-9_]+)?)",
            "(?<string>\"(?:\\\\.|[^\"\\\\])*\")",
            "(?<char>'(?:\\\\.|[^'\\\\])*')",
            "(?<number>\\b(?:0x[0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:f|UL|U|L)?)\\b)",
            "(?<constant>\\b(?:HIGH|LOW|INPUT|OUTPUT|INPUT_PULLUP|LED_BUILTIN|true|false|NULL|HEX|BIN|DEC|OCT)\\b)",
            "(?<keyword>\\b(?:void|int|float|double|bool|boolean|char|byte|word|long|short|unsigned|const|static|volatile|return|if|else|for|while|do|switch|case|break|continue|default|class|struct|new|delete|sizeof|typedef)\\b)",
            "(?<builtin>\\b(?:setup|loop|pinMode|digitalWrite|digitalRead|analogRead|analogWrite|analogReference|delay|delayMicroseconds|millis|micros|map|constrain|min|max|abs|random|randomSeed|tone|noTone|pulseIn|shiftOut|shiftIn|Serial|Wire|SPI)\\b)",
            "(?<type>\\b(?:String|HardwareSerial|TwoWire|SPIClass|IPAddress|WiFi|BleDevice|WebServer)\\b)",
            "(?<func>\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\s*\\())"
        ].join("|"),
        "g"
    );

    return escaped.replace(tokenRegex, (match, ...args) => {
        const groups = args[args.length - 1];
        if (!groups) return match;

        if (groups.comment) return `<span class="syn-comment">${match}</span>`;
        if (groups.preproc) return `<span class="syn-preproc">${match}</span>`;
        if (groups.string || groups.char) return `<span class="syn-string">${match}</span>`;
        if (groups.number) return `<span class="syn-num">${match}</span>`;
        if (groups.constant) return `<span class="syn-const">${match}</span>`;
        if (groups.keyword) return `<span class="syn-keyword">${match}</span>`;
        if (groups.builtin) return `<span class="syn-builtin">${match}</span>`;
        if (groups.type) return `<span class="syn-type">${match}</span>`;
        if (groups.func) return `<span class="syn-func">${match}</span>`;
        return match;
    });
}

const DEFAULT_BLANK_TEMPLATE = `// TwinLab MCU Firmware
void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("MCU Initialized");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`;

function CodeEditor({
    isOpen = false,
    onClose,
    code: externalCode,
    onCodeChange,
    targetBoard,
    availableBoards = [],
    onSelectTargetBoard,
    onUploadAndRun,
    onStopExecution,
    isExecuting = false,
    serialLogs = [],
    onClearSerialLogs,
    onSendSerialInput,
    baudRate = 9600,
    onChangeBaudRate
}) {
    // -------------------------------------------------------------
    // 1. ACTIVE CODE & PERSISTENCE
    // -------------------------------------------------------------
    const [code, setCode] = useState(() => {
        try {
            const savedActive = localStorage.getItem("twinlab_active_code");
            if (savedActive) return savedActive;
            const persistent = localStorage.getItem("twinlab_user_code");
            if (persistent) return persistent;
        } catch (_) {}
        if (externalCode !== undefined && externalCode !== null) return externalCode;
        return DEFAULT_SKETCHES?.blank || DEFAULT_BLANK_TEMPLATE;
    });

    const [activeFileName, setActiveFileName] = useState(() => {
        try {
            return localStorage.getItem("twinlab_active_filename") || "sketch.ino";
        } catch (_) {
            return "sketch.ino";
        }
    });

    // Baseline code when last saved or opened, used for the '.' dirty indication
    const [savedCodeBaseline, setSavedCodeBaseline] = useState(() => {
        try {
            return localStorage.getItem("twinlab_saved_code_baseline") || null;
        } catch (_) {
            return null;
        }
    });

    // Whether the current sketch has unsaved modifications
    const isDirty = useMemo(() => {
        if (!code || code.trim().length === 0) return false;
        if (savedCodeBaseline === null) return true; // Never saved yet
        return code !== savedCodeBaseline;
    }, [code, savedCodeBaseline]);

    // Synchronize if external code is injected from parent (e.g. project load)
    useEffect(() => {
        if (externalCode !== undefined && externalCode !== null && externalCode !== code) {
            setCode(externalCode);
        }
    }, [externalCode]);

    // Update code helper that preserves immediately into localStorage
    const handleCodeTextChange = (newCode) => {
        setCode(newCode);
        try {
            localStorage.setItem("twinlab_active_code", newCode);
            localStorage.setItem("twinlab_user_code", newCode);
            localStorage.setItem("twinlab_code_is_custom", "true");
        } catch (_) {}
        if (onCodeChange) {
            onCodeChange(newCode);
        }
    };

    // Close handler that guarantees persistence
    const handleClose = () => {
        try {
            localStorage.setItem("twinlab_active_code", code);
            localStorage.setItem("twinlab_user_code", code);
            localStorage.setItem("twinlab_active_filename", activeFileName);
        } catch (_) {}
        if (onCodeChange) onCodeChange(code);
        if (onClose) onClose();
    };

    // -------------------------------------------------------------
    // 2. SAVED FILES LIBRARY (Local Storage Database)
    // -------------------------------------------------------------
    const [savedFiles, setSavedFiles] = useState(() => {
        try {
            const list = localStorage.getItem("twinlab_saved_files");
            if (list) {
                const parsed = JSON.parse(list);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (_) {}
        return [];
    });

    const persistSavedFiles = (newList) => {
        setSavedFiles(newList);
        try {
            localStorage.setItem("twinlab_saved_files", JSON.stringify(newList));
        } catch (_) {}
    };

    // -------------------------------------------------------------
    // 3. MODALS (Save Modal & Saved Files Library Modal)
    // -------------------------------------------------------------
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [saveFileNameInput, setSaveFileNameInput] = useState(activeFileName);
    const [isSavedFilesOpen, setIsSavedFilesOpen] = useState(false);
    const [editorToast, setEditorToast] = useState(null);

    const showToast = (msg) => {
        setEditorToast(msg);
        setTimeout(() => setEditorToast(null), 2400);
    };

    // Save File logic
    const handleCommitSaveFile = (e) => {
        if (e) e.preventDefault();
        let name = (saveFileNameInput || "").trim();
        if (!name) name = "sketch.ino";
        if (!name.endsWith(".ino") && !name.endsWith(".cpp")) {
            name += ".ino";
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

        const newFileRecord = {
            id: `sketch_${Date.now()}`,
            name,
            code,
            board: targetBoard?.name || "Arduino Uno R3",
            updatedAt: dateStr,
            timestamp: Date.now()
        };

        const existingIdx = savedFiles.findIndex(f => f.name.toLowerCase() === name.toLowerCase());
        let updatedList = [];
        if (existingIdx >= 0) {
            updatedList = [...savedFiles];
            updatedList[existingIdx] = newFileRecord;
        } else {
            updatedList = [newFileRecord, ...savedFiles];
        }

        persistSavedFiles(updatedList);
        setActiveFileName(name);
        setSavedCodeBaseline(code);
        try {
            localStorage.setItem("twinlab_active_filename", name);
            localStorage.setItem("twinlab_saved_code_baseline", code);
        } catch (_) {}

        setIsSaveModalOpen(false);
        showToast(`Saved "${name}" successfully`);
    };

    // Open an existing saved file
    const handleOpenSavedFile = (file) => {
        setCode(file.code);
        setActiveFileName(file.name);
        setSavedCodeBaseline(file.code);
        try {
            localStorage.setItem("twinlab_active_code", file.code);
            localStorage.setItem("twinlab_user_code", file.code);
            localStorage.setItem("twinlab_active_filename", file.name);
            localStorage.setItem("twinlab_saved_code_baseline", file.code);
        } catch (_) {}
        if (onCodeChange) onCodeChange(file.code);
        setIsSavedFilesOpen(false);
        showToast(`Loaded "${file.name}"`);
    };

    // Delete a saved file
    const handleDeleteSavedFile = (fileId, e) => {
        e.stopPropagation();
        const updated = savedFiles.filter(f => f.id !== fileId);
        persistSavedFiles(updated);
        showToast("File deleted from library");
    };

    // New Blank Sketch (+)
    const handleNewSketch = () => {
        const blank = DEFAULT_BLANK_TEMPLATE;
        setCode(blank);
        setActiveFileName("sketch.ino");
        setSavedCodeBaseline(null);
        try {
            localStorage.setItem("twinlab_active_code", blank);
            localStorage.setItem("twinlab_user_code", blank);
            localStorage.setItem("twinlab_active_filename", "sketch.ino");
            localStorage.removeItem("twinlab_saved_code_baseline");
        } catch (_) {}
        if (onCodeChange) onCodeChange(blank);
        showToast("Created new sketch");
    };

    // -------------------------------------------------------------
    // 4. SERIAL MONITOR STATE
    // (Closed by default, automatically opens on simulation run)
    // -------------------------------------------------------------
    const [isInbuiltSerialOpen, setIsInbuiltSerialOpen] = useState(false);
    const [serialInputText, setSerialInputText] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(true);

    useEffect(() => {
        if (isExecuting) {
            setIsInbuiltSerialOpen(true);
        }
    }, [isExecuting]);

    // -------------------------------------------------------------
    // 5. EDITOR REFS & SCROLL SYNC
    // -------------------------------------------------------------
    const textareaRef = useRef(null);
    const overlayRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const serialOutputRef = useRef(null);

    const highlightedCode = useMemo(() => highlightArduinoCpp(code), [code]);
    const lineCount = Math.max(1, code.split("\n").length);
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    useEffect(() => {
        if (autoScroll && serialOutputRef.current && isInbuiltSerialOpen) {
            serialOutputRef.current.scrollTop = serialOutputRef.current.scrollHeight;
        }
    }, [serialLogs, autoScroll, isInbuiltSerialOpen]);

    const handleScroll = () => {
        if (textareaRef.current) {
            const { scrollTop, scrollLeft } = textareaRef.current;
            if (overlayRef.current) {
                overlayRef.current.scrollTop = scrollTop;
                overlayRef.current.scrollLeft = scrollLeft;
            }
            if (lineNumbersRef.current) {
                lineNumbersRef.current.scrollTop = scrollTop;
            }
        }
    };

    // Upload & Run handler
    const handleUpload = () => {
        setIsInbuiltSerialOpen(true);
        if (onUploadAndRun) {
            onUploadAndRun(code);
        }
    };

    // Keyboard Shortcuts: Ctrl+S to save, Ctrl+Enter to upload, Tab indentation
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            setSaveFileNameInput(activeFileName);
            setIsSaveModalOpen(true);
            return;
        }

        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleUpload();
            return;
        }

        if (e.key === "Tab") {
            e.preventDefault();
            const textarea = textareaRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const tabSpaces = "  ";

            const newCode = code.substring(0, start) + tabSpaces + code.substring(end);
            handleCodeTextChange(newCode);

            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + tabSpaces.length;
            }, 0);
        }
    };

    // Serial Send input
    const handleSendSerial = (e) => {
        e.preventDefault();
        const trimmed = serialInputText.trim();
        if (trimmed && onSendSerialInput) {
            onSendSerialInput(trimmed);
            setSerialInputText("");
        }
    };

    // Target Board Display
    const currentBoard = useMemo(() => {
        if (targetBoard) {
            return {
                id: targetBoard.id,
                name: targetBoard.name || "Arduino Uno R3",
                port: "COM3"
            };
        }
        return {
            id: "arduino-default",
            name: "Arduino Uno R3",
            port: "COM3"
        };
    }, [targetBoard]);

    const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);

    return (
        <motion.div 
            className="code-editor-dock"
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
        >
            {/* ============================================================
               1. TOPBAR: Strictly Board Name & Upload / Stop Controls
               (Everything else removed per user requirement)
            ============================================================ */}
            <div className="code-editor-topbar">
                {/* Left: Selected Board Name Badge */}
                <div className="topbar-board-section">
                    {availableBoards.length > 1 ? (
                        <div className="board-selector-wrap">
                            <button
                                type="button"
                                className="board-pill-btn interactive"
                                onClick={() => setIsBoardDropdownOpen(prev => !prev)}
                                title="Switch Active Target Board"
                            >
                                <span className={`board-status-dot ${isExecuting ? "executing" : "idle"}`}></span>
                                <i className="ri-cpu-line board-icon"></i>
                                <span className="board-name">{currentBoard.name}</span>
                                <span className="board-com-chip font-mono">USB {currentBoard.port}</span>
                                <i className="ri-arrow-down-s-line board-chevron"></i>
                            </button>

                            <AnimatePresence>
                                {isBoardDropdownOpen && (
                                    <motion.div 
                                        className="board-dropdown-menu"
                                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                        transition={{ duration: 0.14 }}
                                    >
                                        {availableBoards.map(b => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                className={`board-dropdown-item ${b.id === currentBoard.id ? "active" : ""}`}
                                                onClick={() => {
                                                    onSelectTargetBoard && onSelectTargetBoard(b.id);
                                                    setIsBoardDropdownOpen(false);
                                                }}
                                            >
                                                <i className="ri-cpu-line"></i>
                                                <span>{b.name || "Microcontroller"}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="board-pill-btn">
                            <span className={`board-status-dot ${isExecuting ? "executing" : "idle"}`}></span>
                            <i className="ri-cpu-line board-icon"></i>
                            <span className="board-name">{currentBoard.name}</span>
                            <span className="board-com-chip font-mono">USB {currentBoard.port}</span>
                        </div>
                    )}
                </div>

                {/* Center / Right: Upload & Run OR Stop + Re-Upload */}
                <div className="topbar-actions-section">
                    {!isExecuting ? (
                        <button
                            type="button"
                            className="ide-topbar-action-btn run-btn"
                            onClick={handleUpload}
                            title="Compile & Flash Sketch to Board (Ctrl+Enter)"
                        >
                            <i className="ri-play-fill"></i>
                            <span>Upload & Run</span>
                        </button>
                    ) : (
                        <div className="running-controls-cluster">
                            <button
                                type="button"
                                className="ide-topbar-action-btn stop-btn"
                                onClick={onStopExecution}
                                title="Stop Firmware Execution"
                            >
                                <i className="ri-stop-fill"></i>
                                <span>Stop</span>
                            </button>
                            <button
                                type="button"
                                className="ide-topbar-action-btn reupload-btn"
                                onClick={handleUpload}
                                title="Hot-Reload / Re-Upload Firmware (Ctrl+Enter)"
                            >
                                <i className="ri-restart-line"></i>
                                <span>Re-Upload</span>
                            </button>
                        </div>
                    )}

                    {/* Clean Close Button */}
                    <button
                        type="button"
                        className="ide-topbar-close-btn"
                        onClick={handleClose}
                        title="Close Code Editor (Esc)"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* ============================================================
               2. SUB-TOPBAR: File Tab, Unsaved Indicator '.', '+', Saved Files
            ============================================================ */}
            <div className="code-editor-filebar">
                <div className="filebar-left">
                    {/* Active File Tab */}
                    <div className="active-sketch-tab">
                        <i className="ri-file-code-line sketch-tab-icon"></i>
                        <span className="sketch-tab-name font-mono">{activeFileName}</span>
                        {/* Dot indicator: Appears when file is unsaved */}
                        {isDirty && (
                            <span 
                                className="unsaved-dot-indicator" 
                                title="Unsaved changes (Press Ctrl+S to save)"
                            >
                                ●
                            </span>
                        )}
                    </div>

                    {/* '+' Symbol beside file tab to create/clear new sketch */}
                    <button
                        type="button"
                        className="filebar-icon-btn add-sketch-btn"
                        onClick={handleNewSketch}
                        title="New Blank Sketch (+)"
                    >
                        <i className="ri-add-line"></i>
                    </button>

                    {/* 'Saved Files' button */}
                    <button
                        type="button"
                        className={`filebar-pill-btn saved-files-btn ${isSavedFilesOpen ? "active" : ""}`}
                        onClick={() => setIsSavedFilesOpen(prev => !prev)}
                        title="View Saved Files Library"
                    >
                        <i className="ri-folder-open-line"></i>
                        <span>Saved Files</span>
                        {savedFiles.length > 0 && (
                            <span className="saved-count-chip font-mono">{savedFiles.length}</span>
                        )}
                    </button>
                </div>

                <div className="filebar-right">
                    {/* Save Button (Ctrl+S popup trigger) */}
                    <button
                        type="button"
                        className="filebar-pill-btn save-sketch-btn"
                        onClick={() => {
                            setSaveFileNameInput(activeFileName);
                            setIsSaveModalOpen(true);
                        }}
                        title="Save Sketch to Website Library (Ctrl+S)"
                    >
                        <i className="ri-save-3-line"></i>
                        <span>Save</span>
                        <kbd className="save-kbd-badge font-mono">Ctrl+S</kbd>
                    </button>

                    {/* Serial Monitor Toggle */}
                    <button
                        type="button"
                        className={`filebar-pill-btn serial-pill-btn ${isInbuiltSerialOpen ? "active" : ""}`}
                        onClick={() => setIsInbuiltSerialOpen(prev => !prev)}
                        title="Toggle Built-in Serial Monitor"
                    >
                        <i className="ri-terminal-box-line"></i>
                        <span>Serial</span>
                    </button>
                </div>
            </div>

            {/* ============================================================
               3. EDITOR WORKSPACE (Line Numbers & Syntax Overlay)
            ============================================================ */}
            <div className={`code-editor-body ${isInbuiltSerialOpen ? "with-serial-split" : ""}`}>
                {/* Line numbers gutter */}
                <div className="line-numbers-gutter" ref={lineNumbersRef}>
                    {lineNumbers.map(n => (
                        <div key={n} className="line-num font-mono">{n}</div>
                    ))}
                </div>

                {/* Main Code Input Container with Syntax Highlighting Overlay */}
                <div className="code-input-container">
                    <pre 
                        ref={overlayRef}
                        className="code-syntax-overlay font-mono" 
                        aria-hidden="true"
                    >
                        <code dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }} />
                    </pre>

                    <textarea
                        ref={textareaRef}
                        className="code-textarea font-mono"
                        value={code}
                        onChange={(e) => handleCodeTextChange(e.target.value)}
                        onScroll={handleScroll}
                        onKeyDown={handleKeyDown}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                        placeholder="// Enter your C++ / Arduino sketch here..."
                    />
                </div>
            </div>

            {/* ============================================================
               4. INBUILT SERIAL MONITOR (Opened on simulation or toggle)
            ============================================================ */}
            <AnimatePresence>
                {isInbuiltSerialOpen && (
                    <motion.div 
                        className="code-inbuilt-serial-pane"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 210, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                        <div className="inbuilt-serial-header">
                            <div className="serial-header-left">
                                <span className="serial-title">
                                    <i className="ri-terminal-box-line"></i>
                                    <span>Serial Monitor</span>
                                </span>
                                <span className="serial-port-chip font-mono">
                                    USB {currentBoard.port} @ {baudRate} Baud
                                </span>
                                <span className="serial-status-tag online">● ONLINE</span>
                            </div>

                            <div className="serial-header-right">
                                <button
                                    type="button"
                                    className={`serial-icon-btn ${showTimestamps ? "active" : ""}`}
                                    onClick={() => setShowTimestamps(!showTimestamps)}
                                    title="Toggle Timestamps"
                                >
                                    <i className="ri-time-line"></i>
                                </button>
                                <button
                                    type="button"
                                    className={`serial-icon-btn ${autoScroll ? "active" : ""}`}
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    title="Auto-scroll"
                                >
                                    <i className="ri-arrow-down-double-line"></i>
                                </button>
                                <button
                                    type="button"
                                    className="serial-icon-btn"
                                    onClick={onClearSerialLogs}
                                    title="Clear Terminal Output"
                                >
                                    <i className="ri-delete-bin-line"></i>
                                </button>
                            </div>
                        </div>

                        <div className="inbuilt-serial-output font-mono" ref={serialOutputRef}>
                            {serialLogs.length === 0 ? (
                                <div className="serial-empty-placeholder">
                                    <i className="ri-terminal-line"></i>
                                    <span>Serial interface active. Listening for Serial.print() telemetry...</span>
                                </div>
                            ) : (
                                serialLogs.map((log, idx) => (
                                    <div key={log.id || idx} className={`serial-log-entry ${log.type || "output"}`}>
                                        {showTimestamps && log.timestamp && (
                                            <span className="entry-time">[{log.timestamp}]</span>
                                        )}
                                        <span className="entry-text">{log.text || log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="inbuilt-serial-input-form" onSubmit={handleSendSerial}>
                            <span className="input-prompt font-mono">&gt;</span>
                            <input
                                type="text"
                                className="serial-input-field font-mono"
                                placeholder="Send message or command to MCU..."
                                value={serialInputText}
                                onChange={(e) => setSerialInputText(e.target.value)}
                            />
                            <button type="submit" className="serial-send-btn font-mono" title="Send (Enter)">
                                <i className="ri-send-plane-2-fill"></i>
                                <span>Send</span>
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================================
               5. POPUP MODAL: SAVE SKETCH TO WEBSITE (Ctrl+S)
            ============================================================ */}
            <AnimatePresence>
                {isSaveModalOpen && (
                    <div className="ide-modal-backdrop" onClick={() => setIsSaveModalOpen(false)}>
                        <motion.div 
                            className="ide-modal-card"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 10 }}
                            transition={{ duration: 0.18 }}
                        >
                            <div className="ide-modal-header">
                                <div className="modal-title-wrap">
                                    <i className="ri-save-3-line modal-icon"></i>
                                    <h3>Save Sketch to TwinLab</h3>
                                </div>
                                <button 
                                    type="button" 
                                    className="modal-close-btn"
                                    onClick={() => setIsSaveModalOpen(false)}
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </div>

                            <form onSubmit={handleCommitSaveFile} className="ide-modal-form">
                                <p className="modal-desc">
                                    Choose a file name for this sketch. It will be saved into your website library.
                                </p>

                                <div className="modal-field-group">
                                    <label className="modal-field-label">File Name</label>
                                    <div className="modal-input-wrap">
                                        <input
                                            type="text"
                                            className="modal-text-input font-mono"
                                            value={saveFileNameInput}
                                            onChange={(e) => setSaveFileNameInput(e.target.value)}
                                            placeholder="my_sketch.ino"
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="modal-btn secondary"
                                        onClick={() => setIsSaveModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="modal-btn primary"
                                    >
                                        <i className="ri-check-line"></i>
                                        <span>Save File</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ============================================================
               6. POPUP MODAL: SAVED FILES LIBRARY
            ============================================================ */}
            <AnimatePresence>
                {isSavedFilesOpen && (
                    <div className="ide-modal-backdrop" onClick={() => setIsSavedFilesOpen(false)}>
                        <motion.div 
                            className="ide-modal-card saved-files-modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 10 }}
                            transition={{ duration: 0.18 }}
                        >
                            <div className="ide-modal-header">
                                <div className="modal-title-wrap">
                                    <i className="ri-folder-open-line modal-icon"></i>
                                    <h3>Saved Sketches Library</h3>
                                    <span className="saved-library-chip font-mono">{savedFiles.length} files</span>
                                </div>
                                <button 
                                    type="button" 
                                    className="modal-close-btn"
                                    onClick={() => setIsSavedFilesOpen(false)}
                                >
                                    <i className="ri-close-line"></i>
                                </button>
                            </div>

                            <div className="saved-files-list">
                                {savedFiles.length === 0 ? (
                                    <div className="saved-files-empty">
                                        <i className="ri-file-code-line empty-icon"></i>
                                        <h4>No Saved Files Yet</h4>
                                        <p>Save your active sketch with <kbd>Ctrl+S</kbd> to access it here anytime.</p>
                                    </div>
                                ) : (
                                    savedFiles.map((file) => (
                                        <div 
                                            key={file.id} 
                                            className={`saved-file-row ${file.name === activeFileName ? "current-active" : ""}`}
                                            onClick={() => handleOpenSavedFile(file)}
                                        >
                                            <div className="file-info-group">
                                                <i className="ri-file-code-fill file-row-icon"></i>
                                                <div className="file-texts">
                                                    <span className="file-name font-mono">{file.name}</span>
                                                    <span className="file-meta font-mono">
                                                        {file.board} • {file.updatedAt || "Saved"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="file-actions-group">
                                                <button
                                                    type="button"
                                                    className="file-open-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenSavedFile(file);
                                                    }}
                                                    title="Open in Code Editor"
                                                >
                                                    <i className="ri-folder-open-fill"></i>
                                                    <span>Open</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="file-delete-btn"
                                                    onClick={(e) => handleDeleteSavedFile(file.id, e)}
                                                    title="Delete File"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="modal-footer-row">
                                <button
                                    type="button"
                                    className="modal-btn secondary"
                                    onClick={() => setIsSavedFilesOpen(false)}
                                >
                                    Close Library
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Inline Editor Toast Notification */}
            <AnimatePresence>
                {editorToast && (
                    <motion.div 
                        className="editor-inline-toast font-mono"
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.16 }}
                    >
                        <i className="ri-checkbox-circle-fill"></i>
                        <span>{editorToast}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default CodeEditor;
