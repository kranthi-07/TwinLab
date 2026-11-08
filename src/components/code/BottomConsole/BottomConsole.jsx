import "./BottomConsole.css";
import { useState, useRef, useEffect, useMemo } from "react";

function formatLogMessage(text) {
    if (!text || typeof text !== "string") return text;
    const parts = text.split(/(\b\d+(?:\.\d+)?(?:V|mV|mA|A|Ω|kΩ|MΩ|Hz|kHz|baud|ms|s|%)\b|\b(?:TX|RX)\b|\b(?:HIGH|LOW)\b|\b(?:D\d+|A\d+)\b)/g);
    return parts.map((part, idx) => {
        if (/^\d+(?:\.\d+)?(?:V|mV|mA|A|Ω|kΩ|MΩ|Hz|kHz|baud|ms|s|%)$/.test(part)) {
            return <span key={idx} className="token-highlight token-val">{part}</span>;
        }
        if (/^(?:TX|RX)$/.test(part)) {
            return <span key={idx} className={`token-highlight token-${part.toLowerCase()}`}>{part}</span>;
        }
        if (/^(?:HIGH|LOW)$/.test(part)) {
            return <span key={idx} className={`token-highlight token-logic-${part.toLowerCase()}`}>{part}</span>;
        }
        if (/^(?:D\d+|A\d+)$/.test(part)) {
            return <span key={idx} className="token-highlight token-pin">{part}</span>;
        }
        return part;
    });
}

function BottomConsole({ logs = [], isSimulating = false, supplyVoltage = 9, isOpen, onToggleOpen }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [userCleared, setUserCleared] = useState(false);
    const [filterCategory, setFilterCategory] = useState("all");
    const [searchFilter, setSearchFilter] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const logContainerRef = useRef(null);

    // Sync with external isOpen prop (e.g. from Code Editor "Serial Monitor" button)
    useEffect(() => {
        if (typeof isOpen === "boolean") {
            setIsCollapsed(!isOpen);
        }
    }, [isOpen]);

    // Auto-scroll when new logs arrive
    useEffect(() => {
        if (!isCollapsed && autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isCollapsed, autoScroll]);

    // Reset userCleared if isSimulating changes
    useEffect(() => {
        setUserCleared(false);
    }, [isSimulating]);

    const displayLogs = useMemo(() => {
        if (userCleared) return [];
        return logs.filter((l) => {
            if (filterCategory === "serial" && l.source !== "serial" && !l.text?.includes("Serial")) return false;
            if (filterCategory === "spice" && l.source === "serial") return false;
            if (filterCategory === "alerts" && l.type !== "warn" && l.type !== "error") return false;
            if (searchFilter.trim()) {
                const q = searchFilter.toLowerCase();
                return l.text && l.text.toLowerCase().includes(q);
            }
            return true;
        });
    }, [logs, userCleared, filterCategory, searchFilter]);

    return (
        <div className={`bottom-console ${isCollapsed ? "collapsed" : ""}`}>
            <div 
                className="console-header" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Console & Serial Monitor" : "Collapse Console"}
            >
                <div className="console-title">
                    <i className="ri-terminal-box-line"></i>
                    <span>Console & Serial Monitor</span>
                    {isSimulating ? (
                        <>
                            <span className="console-status-pill running">
                                <span className="dot"></span> {supplyVoltage}V DC ACTIVE
                            </span>
                            {logs.some(l => l.type === "warn" || l.type === "error" || l.text?.includes("short")) && isCollapsed && (
                                <span className="console-status-pill warning-pill" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                                    <i className="ri-alert-line"></i> Circuit Alert
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="console-status-pill standby">STANDBY</span>
                    )}
                </div>

                <div className="console-actions">
                    {!isCollapsed && (
                        <div className="console-nav-tabs" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={`console-tab-btn ${filterCategory === "all" ? "active" : ""}`}
                                onClick={() => setFilterCategory("all")}
                            >
                                All ({logs.length})
                            </button>
                            <button
                                type="button"
                                className={`console-tab-btn ${filterCategory === "serial" ? "active" : ""}`}
                                onClick={() => setFilterCategory("serial")}
                            >
                                Serial (UART)
                            </button>
                            <button
                                type="button"
                                className={`console-tab-btn ${filterCategory === "spice" ? "active" : ""}`}
                                onClick={() => setFilterCategory("spice")}
                            >
                                SPICE EDA
                            </button>
                            <button
                                type="button"
                                className={`console-tab-btn alerts-tab ${filterCategory === "alerts" ? "active" : ""}`}
                                onClick={() => setFilterCategory("alerts")}
                            >
                                Alerts
                            </button>
                        </div>
                    )}

                    {!isCollapsed && (
                        <button 
                            type="button" 
                            title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
                            className={`console-icon-btn ${autoScroll ? "active-tool" : ""}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setAutoScroll(!autoScroll);
                            }}
                        >
                            <i className="ri-arrow-down-double-line"></i>
                        </button>
                    )}

                    {!isCollapsed && (
                        <button 
                            type="button" 
                            title="Clear Console Output"
                            className="console-icon-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setUserCleared(true);
                            }}
                        >
                            <i className="ri-delete-bin-line"></i>
                        </button>
                    )}

                    <button 
                        type="button" 
                        className="console-icon-btn expand-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCollapsed(!isCollapsed);
                        }}
                    >
                        <i className={isCollapsed ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}></i>
                    </button>
                </div>
            </div>

            {!isCollapsed && (
                <div className="console-body" ref={logContainerRef}>
                    {displayLogs.length === 0 ? (
                        <div className="console-empty">
                            <i className="ri-terminal-line"></i>
                            <p>{isSimulating ? "Circuit active. Ready for Serial Monitor and SPICE EDA messages." : "Simulation standby. Click Play in the top bar to run real-time hardware simulation."}</p>
                        </div>
                    ) : (
                        <div className="console-log-list">
                            {displayLogs.map((log, index) => {
                                const isErr = log.type === "error" || log.text?.includes("Error") || log.text?.includes("Short");
                                const isWarn = log.type === "warn" || log.text?.includes("Notice") || log.text?.includes("Heating");
                                const isSerial = log.source === "serial" || log.type === "serial";

                                return (
                                    <div key={index} className={`console-log-item log-${log.type || "info"} ${isErr ? "is-error" : isWarn ? "is-warn" : isSerial ? "is-serial" : ""}`}>
                                        <span className="log-time">{log.time || "0.00s"}</span>
                                        <span className={`log-badge badge-${log.type || "info"}`}>
                                            {isErr ? "ERR" : isWarn ? "WARN" : isSerial ? "UART" : (log.type?.toUpperCase() || "OK")}
                                        </span>
                                        <span className="log-msg">
                                            {formatLogMessage(log.text)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default BottomConsole;
