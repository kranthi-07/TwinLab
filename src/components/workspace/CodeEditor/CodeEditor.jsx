import "./CodeEditor.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_SKETCHES } from "../../../simulation/mcuRuntime";

/**
 * High-performance C++ / Arduino Syntax Tokenizer & Highlighter
 */
export function highlightArduinoCpp(code) {
    if (!code) return "";

    // Escape HTML characters safely
    const escaped = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Order matters: comments and strings must take precedence so keywords inside them aren't tokenized
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

/**
 * 100% Custom Dropdown Component - Zero Browser Native Elements
 */
function CustomIdeDropdown({
    label,
    icon,
    value,
    options = [],
    onChange,
    className = "",
    title = "",
    alignRight = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(o => String(o.value) === String(value)) || options[0];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className={`custom-ide-dropdown-wrapper ${className}`} ref={containerRef} title={title}>
            <button
                type="button"
                className={`custom-ide-dropdown-trigger ${isOpen ? "active" : ""}`}
                onClick={() => setIsOpen(prev => !prev)}
            >
                {icon && <i className={`${icon} ide-dropdown-icon`} />}
                {label && <span className="ide-dropdown-label">{label}</span>}
                <span className="ide-dropdown-value-text">{selectedOption ? selectedOption.label : value}</span>
                <i className={`ri-arrow-down-s-line ide-dropdown-chevron ${isOpen ? "rotate" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`custom-ide-dropdown-menu ${alignRight ? "align-right" : ""}`}
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                    >
                        {options.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    className={`custom-ide-dropdown-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                        onChange && onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="item-text-group">
                                        <span className="item-label">{opt.label}</span>
                                        {opt.desc && <span className="item-desc">{opt.desc}</span>}
                                    </div>
                                    {isSelected && <i className="ri-check-line item-check-icon" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CodeEditor({
    isOpen = false,
    onClose,
    targetBoard, // { id, type, name }
    availableBoards = [],
    onSelectTargetBoard,
    onUploadAndRun,
    onStopExecution,
    isExecuting = false,
    onToggleSerialMonitor,
    isSerialOpen = false,
    baudRate = 9600,
    onChangeBaudRate,
    serialLogs = [],
    onClearSerialLogs,
    onSendSerialInput
}) {
    const [selectedPreset, setSelectedPreset] = useState("blink");
    const [code, setCode] = useState(DEFAULT_SKETCHES.blink);
    const [uploadStatus, setUploadStatus] = useState("Ready");
    const [uploadProgress, setUploadProgress] = useState(null); // null or number 0-100
    const [errorMsg, setErrorMsg] = useState(null);

    // Inbuilt Serial Monitor State
    const [isInbuiltSerialOpen, setIsInbuiltSerialOpen] = useState(true);
    const [serialInputText, setSerialInputText] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [showTimestamps, setShowTimestamps] = useState(true);

    const textareaRef = useRef(null);
    const overlayRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const serialOutputRef = useRef(null);

    // Compute syntax highlighted HTML
    const highlightedCode = useMemo(() => highlightArduinoCpp(code), [code]);

    // Sync line numbers count with code lines
    const lineCount = Math.max(1, code.split("\n").length);
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Auto-scroll serial output
    useEffect(() => {
        if (autoScroll && serialOutputRef.current && isInbuiltSerialOpen) {
            serialOutputRef.current.scrollTop = serialOutputRef.current.scrollHeight;
        }
    }, [serialLogs, autoScroll, isInbuiltSerialOpen]);

    // Sync scroll between textarea, syntax overlay, and line numbers
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

    // Switch preset
    const handlePresetChange = (presetKey) => {
        setSelectedPreset(presetKey);
        if (DEFAULT_SKETCHES[presetKey]) {
            setCode(DEFAULT_SKETCHES[presetKey]);
            setErrorMsg(null);
            setUploadStatus(`Loaded example: ${presetKey}`);
        }
    };

    // Smart Tab and Enter handling
    const handleKeyDown = (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newCode = code.substring(0, start) + "  " + code.substring(end);
            setCode(newCode);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
            }, 0);
        } else if (e.key === "Enter") {
            const start = textareaRef.current.selectionStart;
            const lineStart = code.lastIndexOf("\n", start - 1) + 1;
            const currentLine = code.substring(lineStart, start);
            const matchIndent = currentLine.match(/^\s*/);
            const indent = matchIndent ? matchIndent[0] : "";
            const extraIndent = currentLine.trim().endsWith("{") ? "  " : "";
            
            e.preventDefault();
            const insert = "\n" + indent + extraIndent;
            const newCode = code.substring(0, start) + insert + code.substring(start);
            setCode(newCode);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + insert.length;
                    handleScroll();
                }
            }, 0);
        }
    };

    // Upload & Run handler
    const handleUpload = () => {
        setErrorMsg(null);
        setUploadProgress(15);
        setUploadStatus("Compiling C++ sketch...");

        setTimeout(() => {
            setUploadProgress(65);
            setUploadStatus("Flashing firmware to MCU via USB...");

            setTimeout(() => {
                setUploadProgress(100);
                setUploadStatus("Uploaded successfully • Running");

                setTimeout(() => setUploadProgress(null), 800);

                if (onUploadAndRun) {
                    onUploadAndRun(code, (err) => {
                        if (err) {
                            setErrorMsg(err);
                            setUploadStatus("Compilation error");
                        }
                    });
                }
            }, 300);
        }, 250);
    };

    // Serial Input Form Submit
    const handleSendSerial = (e) => {
        e && e.preventDefault();
        const text = serialInputText.trim();
        if (!text) return;
        if (onSendSerialInput) {
            onSendSerialInput(text);
        }
        setSerialInputText("");
    };

    if (!isOpen) return null;

    const getBoardInfo = (board) => {
        if (!board) return { name: "Arduino Uno R3", type: "arduino-uno", port: "COM3", arch: "ATmega328P 16MHz" };
        switch (board.type) {
            case "arduino-mega":
                return { name: board.name || "Arduino Mega 2560", type: "arduino-mega", port: "COM4", arch: "ATmega2560 16MHz" };
            case "arduino-nano":
                return { name: board.name || "Arduino Nano V3", type: "arduino-nano", port: "COM5", arch: "ATmega328P DIP-30" };
            case "esp32":
            case "esp32-devkit":
            case "esp32-s3":
                return { name: board.name || "ESP32-S3 DevKit", type: "esp32", port: "COM8", arch: "Xtensa Dual-Core 240MHz" };
            case "arduino-uno":
            default:
                return { name: board.name || "Arduino Uno R3", type: "arduino-uno", port: "COM3", arch: "ATmega328P 16MHz" };
        }
    };

    const currentBoard = getBoardInfo(targetBoard);

    // Preset Options for Custom Dropdown
    const PRESET_OPTIONS = [
        { value: "blink", label: "Blink (1s)", desc: "Standard built-in LED cycle" },
        { value: "strobe", label: "Fast Strobe (100ms)", desc: "High-frequency visual pulse" },
        { value: "counter", label: "Serial Counter", desc: "Streams loop telemetry to serial" },
        { value: "dual_pins", label: "Dual Pins (13 & 12)", desc: "Alternating dual channel phase" },
        { value: "analog_serial", label: "Analog Monitor (A0)", desc: "ADC voltage telemetry loop" }
    ];

    // Baud Rate Options for Custom Dropdown
    const BAUD_OPTIONS = [
        { value: 9600, label: "9600 Baud", desc: "Standard Arduino default" },
        { value: 19200, label: "19200 Baud", desc: "Medium speed serial" },
        { value: 38400, label: "38400 Baud", desc: "Fast data link" },
        { value: 57600, label: "57600 Baud", desc: "High throughput" },
        { value: 115200, label: "115200 Baud", desc: "ESP32 native high-speed" }
    ];

    // Target Board Options for Custom Dropdown
    const BOARD_OPTIONS = availableBoards.map(b => {
        const info = getBoardInfo(b);
        return {
            value: b.id,
            label: info.name,
            desc: `${info.port} • ${info.arch}`
        };
    });

    return (
        <motion.div 
            className="code-editor-dock studio-dark-theme"
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
            {/* TIER 1: Window Title Bar (Mac-style dots, title, board pill, and clean close button) */}
            <div className="code-editor-header">
                <div className="header-left">
                    {/* IDE Window Controls */}
                    <div className="ide-window-dots">
                        <span className="window-dot dot-close" onClick={onClose} title="Close Editor"></span>
                        <span className="window-dot dot-min" onClick={() => setIsInbuiltSerialOpen(prev => !prev)} title="Toggle Serial Monitor"></span>
                        <span className="window-dot dot-max" title="Ready"></span>
                    </div>

                    <div className="editor-title-wrap">
                        <i className="ri-code-s-slash-fill code-icon"></i>
                        <span className="editor-title">Firmware Studio</span>
                        <span className="lang-tag font-mono">C++ / INO</span>
                    </div>

                    {/* Target Board Custom Dropdown */}
                    {availableBoards.length > 1 ? (
                        <CustomIdeDropdown 
                            icon="ri-cpu-line"
                            value={targetBoard?.id || availableBoards[0]?.id}
                            options={BOARD_OPTIONS}
                            onChange={(id) => onSelectTargetBoard && onSelectTargetBoard(id)}
                            title="Select Target Microcontroller Board"
                            className="board-custom-dropdown"
                        />
                    ) : (
                        <div className="board-badge" title={`Active Target: ${currentBoard.name} (${currentBoard.arch})`}>
                            <span className="board-status-dot pulse"></span>
                            <i className="ri-cpu-line"></i>
                            <span>{currentBoard.name}</span>
                            <small className="board-port-chip font-mono">{currentBoard.port}</small>
                        </div>
                    )}
                </div>

                {/* Right Header Control */}
                <div className="header-right">
                    <button 
                        className="close-panel-btn" 
                        onClick={onClose}
                        title="Close Code Editor (Ctrl+D)"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* TIER 2: Action Toolbar (Tabs, Starter Presets, and Spacious Upload & Run Button) */}
            <div className="editor-action-toolbar">
                <div className="toolbar-left">
                    <div className="active-file-tab">
                        <span className="tab-ino-icon font-mono">ino</span>
                        <span className="tab-filename">sketch.ino</span>
                        <span className="tab-clean-dot"></span>
                    </div>

                    {/* 100% Custom Preset Examples Dropdown */}
                    <CustomIdeDropdown 
                        label="Example:"
                        icon="ri-folder-code-line"
                        value={selectedPreset}
                        options={PRESET_OPTIONS}
                        onChange={handlePresetChange}
                        title="Load Starter Firmware Sketch"
                        className="preset-custom-dropdown"
                    />

                    <div className="tab-board-info font-mono">
                        <i className="ri-speed-line"></i>
                        <span>{currentBoard.arch}</span>
                    </div>
                </div>

                <div className="toolbar-right">
                    {/* Compile & Upload Button */}
                    <button 
                        className={`action-btn upload-btn ${isExecuting ? "active" : ""}`}
                        onClick={handleUpload}
                        title="Compile C++ Sketch and Flash to Microcontroller"
                    >
                        <i className={isExecuting ? "ri-restart-line" : "ri-play-circle-fill"}></i>
                        <span>{isExecuting ? "Re-Flash" : "Upload & Run"}</span>
                    </button>

                    {/* Stop Button */}
                    {isExecuting && (
                        <button 
                            className="action-btn stop-btn"
                            onClick={onStopExecution}
                            title="Halt Microcontroller Firmware Execution"
                        >
                            <i className="ri-stop-circle-fill"></i>
                            <span>Stop</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Flash upload progress bar */}
            {uploadProgress !== null && (
                <div className="upload-progress-track">
                    <div 
                        className="upload-progress-fill" 
                        style={{ width: `${uploadProgress}%` }}
                    ></div>
                </div>
            )}

            {/* Editor Workspace with Line Numbers & Real-Time Syntax Highlighting */}
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
                        onChange={(e) => setCode(e.target.value)}
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

            {/* Error banner if compile error */}
            {errorMsg && (
                <div className="compile-error-banner font-mono">
                    <i className="ri-error-warning-fill"></i>
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* ============================================================
               INBUILT INTEGRATED SERIAL MONITOR (NESTED INSIDE CODE WINDOW)
            ============================================================ */}
            <AnimatePresence>
                {isInbuiltSerialOpen && (
                    <motion.div 
                        className="code-inbuilt-serial-pane"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 210, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Serial Header */}
                        <div className="inbuilt-serial-header">
                            <div className="serial-header-left">
                                <span className="serial-title">
                                    <i className="ri-terminal-box-line"></i>
                                    <span>Serial Monitor</span>
                                </span>
                                <span className="serial-port-chip font-mono">
                                    USB {currentBoard.port} @ {baudRate} Baud
                                </span>
                                <span className={`serial-live-pill ${isExecuting ? "online" : "idle"}`}>
                                    <span className="live-dot pulse"></span>
                                    {isExecuting ? "ONLINE" : "STANDBY"}
                                </span>
                            </div>

                            <div className="serial-header-right">
                                <button
                                    type="button"
                                    className={`serial-icon-btn ${showTimestamps ? "active" : ""}`}
                                    onClick={() => setShowTimestamps(!showTimestamps)}
                                    title={showTimestamps ? "Hide Timestamps" : "Show Timestamps"}
                                >
                                    <i className="ri-time-line"></i>
                                </button>
                                <button
                                    type="button"
                                    className={`serial-icon-btn ${autoScroll ? "active" : ""}`}
                                    onClick={() => setAutoScroll(!autoScroll)}
                                    title={autoScroll ? "Disable Auto-Scroll" : "Enable Auto-Scroll"}
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
                                <button
                                    type="button"
                                    className="serial-icon-btn collapse-btn"
                                    onClick={() => setIsInbuiltSerialOpen(false)}
                                    title="Minimize Serial Monitor"
                                >
                                    <i className="ri-arrow-down-s-line"></i>
                                </button>
                            </div>
                        </div>

                        {/* Terminal Logs Output */}
                        <div className="inbuilt-serial-output font-mono" ref={serialOutputRef}>
                            {serialLogs.length === 0 ? (
                                <div className="serial-placeholder-banner">
                                    <span className="banner-line">// TwinLab Integrated Serial Monitor v2.5</span>
                                    <span className="banner-line">// Listening on {currentBoard.port} at {baudRate} baud rate.</span>
                                    <span className="banner-line sub">// Outputs from Serial.print() &amp; Serial.println() will stream here in real-time.</span>
                                </div>
                            ) : (
                                serialLogs.map((log, idx) => (
                                    <div key={log.id || idx} className={`serial-log-entry ${log.type || "output"}`}>
                                        {showTimestamps && log.timestamp && (
                                            <span className="entry-time">[{log.timestamp}]</span>
                                        )}
                                        {log.source && (
                                            <span className={`entry-source ${log.source.toLowerCase()}`}>
                                                [{log.source}]
                                            </span>
                                        )}
                                        <span className="entry-text">{log.text || log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Serial Input Command Row */}
                        <form className="inbuilt-serial-input-form" onSubmit={handleSendSerial}>
                            <span className="input-prompt font-mono">&gt;</span>
                            <input
                                type="text"
                                className="serial-input-field font-mono"
                                placeholder="Send message or command to MCU (e.g. 1, 0, PING)..."
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

            {/* Footer status bar with 100% Custom Baud Selector and Inbuilt Serial Monitor Toggle */}
            <div className="code-editor-footer">
                <div className="footer-status-left">
                    <span className={`status-indicator-dot ${isExecuting ? "running" : "idle"}`}></span>
                    <span className="status-text">{uploadStatus}</span>
                    <span className="com-port-tag font-mono">USB {currentBoard.port}</span>
                </div>

                <div className="footer-status-right">
                    {/* 100% Custom Baud Rate Selector Dropdown */}
                    <CustomIdeDropdown 
                        icon="ri-wireless-charging-line"
                        value={baudRate}
                        options={BAUD_OPTIONS}
                        onChange={(val) => onChangeBaudRate && onChangeBaudRate(Number(val))}
                        title="Serial Communication Baud Rate"
                        alignRight={true}
                        className="baud-custom-dropdown"
                    />

                    {/* Quick Inbuilt Serial Monitor Toggle */}
                    <button 
                        className={`serial-toggle-btn ${isInbuiltSerialOpen ? "active" : ""}`}
                        onClick={() => setIsInbuiltSerialOpen(prev => !prev)}
                        title="Toggle Inbuilt Serial Monitor (Ctrl+M)"
                    >
                        <i className="ri-terminal-box-line"></i>
                        <span>Serial Monitor</span>
                        {serialLogs.length > 0 && (
                            <span className="serial-count-pill font-mono">{serialLogs.length}</span>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default CodeEditor;
