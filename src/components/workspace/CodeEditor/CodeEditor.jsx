import "./CodeEditor.css";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { DEFAULT_SKETCHES } from "../../../simulation/mcuRuntime";

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
    const lineNumbersRef = useRef(null);

    // Sync line numbers count with code lines
    const lineCount = Math.max(1, code.split("\n").length);
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

    // Sync scroll between line numbers and code textarea
    const handleScroll = () => {
        if (textareaRef.current && lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
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

    // Handle Tab key inside textarea
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
            {/* Header bar */}
            <div className="code-editor-header">
                <div className="header-left">
                    <div className="editor-title-wrap">
                        <i className="ri-code-s-slash-fill code-icon"></i>
                        <span className="editor-title">Firmware Studio</span>
                        <span className="lang-tag">C++ / INO</span>
                    </div>

                    {/* Target Board Badge / Selector */}
                    {availableBoards.length > 1 ? (
                        <div className="board-selector-wrap">
                            <i className="ri-cpu-line board-sel-icon"></i>
                            <select 
                                className="board-selector-dropdown"
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

                {/* Right controls */}
                <div className="header-right">
                    {/* Preset examples dropdown */}
                    <div className="preset-select-wrap">
                        <label className="preset-label">Example:</label>
                        <select 
                            className="preset-dropdown"
                            value={selectedPreset}
                            onChange={(e) => handlePresetChange(e.target.value)}
                        >
                            <option value="blink">Blink (1s)</option>
                            <option value="strobe">Fast Strobe (100ms)</option>
                            <option value="counter">Serial Counter</option>
                            <option value="dual_pins">Dual Pins (13 & 12)</option>
                            <option value="analog_serial">Analog Monitor (A0)</option>
                        </select>
                    </div>

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

                    {/* Close Panel Button */}
                    <button 
                        className="close-panel-btn" 
                        onClick={onClose}
                        title="Close Code Editor"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* IDE File Tab Bar */}
            <div className="editor-tabs-bar">
                <div className="active-file-tab">
                    <span className="tab-ino-icon">ino</span>
                    <span className="tab-filename">sketch.ino</span>
                    <span className="tab-clean-dot"></span>
                </div>
                <div className="tab-board-info">
                    <span>{currentBoard.arch}</span>
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

            {/* Editor Workspace with Line Numbers */}
            <div className="code-editor-body">
                {/* Line numbers gutter */}
                <div className="line-numbers-gutter" ref={lineNumbersRef}>
                    {lineNumbers.map(n => (
                        <div key={n} className="line-num">{n}</div>
                    ))}
                </div>

                {/* Main Code Textarea */}
                <div className="code-input-container">
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

            {/* Footer status bar */}
            <div className="code-editor-footer">
                <div className="footer-status-left">
                    <span className={`status-indicator-dot ${isExecuting ? "running" : "idle"}`}></span>
                    <span className="status-text">{uploadStatus}</span>
                    <span className="com-port-tag">USB {currentBoard.port}</span>
                </div>

                <div className="footer-status-right">
                    {/* Baud Rate selector */}
                    <div className="baud-selector-wrap">
                        <i className="ri-wireless-charging-line"></i>
                        <select 
                            className="baud-select" 
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
