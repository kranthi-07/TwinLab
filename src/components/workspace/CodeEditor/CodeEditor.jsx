import "./CodeEditor.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
    onChangeBaudRate
}) {
    const [selectedPreset, setSelectedPreset] = useState("blink");
    const [code, setCode] = useState(DEFAULT_SKETCHES.blink);
    const [uploadStatus, setUploadStatus] = useState("Ready");
    const [uploadProgress, setUploadProgress] = useState(null); // null or number 0-100
    const [errorMsg, setErrorMsg] = useState(null);
    const textareaRef = useRef(null);
    const overlayRef = useRef(null);
    const lineNumbersRef = useRef(null);

    // Compute syntax highlighted HTML
    const highlightedCode = useMemo(() => highlightArduinoCpp(code), [code]);

    // Sync line numbers count with code lines
    const lineCount = Math.max(1, code.split("\n").length);
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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
            // Auto indentation
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
                        <span className="window-dot dot-min" title="Minimize"></span>
                        <span className="window-dot dot-max" title="Full View"></span>
                    </div>

                    <div className="editor-title-wrap">
                        <i className="ri-code-s-slash-fill code-icon"></i>
                        <span className="editor-title">Firmware Studio</span>
                        <span className="lang-tag">C++ / INO</span>
                    </div>

                    {/* Target Board Dropdown with Professional Dark Styling */}
                    {availableBoards.length > 1 ? (
                        <div className="custom-ide-select-container board-selector-container">
                            <i className="ri-cpu-line ide-select-icon board-icon"></i>
                            <select 
                                className="custom-ide-select board-select"
                                value={targetBoard?.id || ""}
                                onChange={(e) => onSelectTargetBoard && onSelectTargetBoard(e.target.value)}
                                title="Switch target microcontroller"
                            >
                                {availableBoards.map(b => {
                                    const info = getBoardInfo(b);
                                    return (
                                        <option key={b.id} value={b.id}>
                                            {info.name} ({info.port})
                                        </option>
                                    );
                                })}
                            </select>
                            <i className="ri-arrow-down-s-line ide-select-chevron"></i>
                        </div>
                    ) : (
                        <div className="board-badge" title={`Active Target: ${currentBoard.name} (${currentBoard.arch})`}>
                            <span className="board-status-dot pulse"></span>
                            <i className="ri-cpu-line"></i>
                            <span>{currentBoard.name}</span>
                            <small className="board-port-chip">{currentBoard.port}</small>
                        </div>
                    )}
                </div>

                {/* Right Header Control */}
                <div className="header-right">
                    <button 
                        className="close-panel-btn" 
                        onClick={onClose}
                        title="Close Code Editor"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* TIER 2: Action Toolbar (Tabs, Starter Presets, and Spacious Upload & Run Button) */}
            <div className="editor-action-toolbar">
                <div className="toolbar-left">
                    <div className="active-file-tab">
                        <span className="tab-ino-icon">ino</span>
                        <span className="tab-filename">sketch.ino</span>
                        <span className="tab-clean-dot"></span>
                    </div>

                    {/* Professional Preset Examples Dropdown */}
                    <div className="custom-ide-select-container preset-select-container">
                        <i className="ri-folder-code-line ide-select-icon"></i>
                        <span className="preset-prefix-label">Example:</span>
                        <select 
                            className="custom-ide-select preset-select"
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            title="Load starter firmware sketch"
                        >
                            <option value="blink">Blink (1s)</option>
                            <option value="strobe">Fast Strobe (100ms)</option>
                            <option value="counter">Serial Counter</option>
                            <option value="dual_pins">Dual Pins (13 & 12)</option>
                            <option value="analog_serial">Analog Monitor (A0)</option>
                        </select>
                        <i className="ri-arrow-down-s-line ide-select-chevron"></i>
                    </div>

                    <div className="tab-board-info">
                        <i className="ri-speed-line"></i>
                        <span>{currentBoard.arch}</span>
                    </div>
                </div>

                <div className="toolbar-right">
                    {/* Compile & Upload Button (Spacious, prominent, zero overflow) */}
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
            <div className="code-editor-body">
                {/* Line numbers gutter */}
                <div className="line-numbers-gutter" ref={lineNumbersRef}>
                    {lineNumbers.map(n => (
                        <div key={n} className="line-num">{n}</div>
                    ))}
                </div>

                {/* Main Code Input Container with Syntax Highlighting Overlay */}
                <div className="code-input-container">
                    {/* Underlying Syntax Colored Overlay */}
                    <pre 
                        ref={overlayRef}
                        className="code-syntax-overlay" 
                        aria-hidden="true"
                    >
                        <code dangerouslySetInnerHTML={{ __html: highlightedCode + "\n" }} />
                    </pre>

                    {/* Transparent Editable Textarea */}
                    <textarea
                        ref={textareaRef}
                        className="code-textarea"
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
                <div className="compile-error-banner">
                    <i className="ri-error-warning-fill"></i>
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Footer status bar with Baud Selector and Serial Monitor Drawer Link */}
            <div className="code-editor-footer">
                <div className="footer-status-left">
                    <span className={`status-indicator-dot ${isExecuting ? "running" : "idle"}`}></span>
                    <span className="status-text">{uploadStatus}</span>
                    <span className="com-port-tag">USB {currentBoard.port}</span>
                </div>

                <div className="footer-status-right">
                    {/* Professional Baud Rate Selector */}
                    <div className="custom-ide-select-container baud-select-container">
                        <i className="ri-wireless-charging-line ide-select-icon"></i>
                        <select 
                            className="custom-ide-select baud-select" 
                            value={baudRate}
                            onChange={(e) => onChangeBaudRate && onChangeBaudRate(Number(e.target.value))}
                            title="Serial Communication Baud Rate"
                        >
                            <option value={9600}>9600 Baud</option>
                            <option value={19200}>19200 Baud</option>
                            <option value={38400}>38400 Baud</option>
                            <option value={57600}>57600 Baud</option>
                            <option value={115200}>115200 Baud</option>
                        </select>
                        <i className="ri-arrow-down-s-line ide-select-chevron"></i>
                    </div>

                    {/* Quick Serial Monitor Toggle */}
                    <button 
                        className={`serial-toggle-btn ${isSerialOpen ? "active" : ""}`}
                        onClick={onToggleSerialMonitor}
                        title="Toggle Serial Monitor Drawer"
                    >
                        <i className="ri-terminal-box-line"></i>
                        <span>Serial Monitor</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

export default CodeEditor;
