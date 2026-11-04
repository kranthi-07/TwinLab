import "./BottomConsole.css";
import { useState, useRef, useEffect } from "react";

function BottomConsole({ logs = [], isSimulating = false, supplyVoltage = 9, isOpen, onToggleOpen }) {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [userCleared, setUserCleared] = useState(false);
    const logContainerRef = useRef(null);

    // Sync with external isOpen prop (e.g. from Code Editor "Serial Monitor" button)
    useEffect(() => {
        if (typeof isOpen === "boolean") {
            setIsCollapsed(!isOpen);
        }
    }, [isOpen]);

    // Auto-scroll when new logs arrive
    useEffect(() => {
        if (!isCollapsed && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isCollapsed]);

    // Reset userCleared if isSimulating changes
    useEffect(() => {
        setUserCleared(false);
    }, [isSimulating]);

    const displayLogs = userCleared ? [] : logs;

    return (
        <div className={`bottom-console ${isCollapsed ? "collapsed" : ""}`}>
            <div 
                className="console-header" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand Console" : "Collapse Console"}
            >
                <div className="console-title">
                    <i className="ri-terminal-box-line"></i>
                    <span>Console & Serial Monitor</span>
                    {isSimulating ? (
                        <>
                            <span className="console-status-pill running">
                                <span className="dot"></span> {supplyVoltage}V DC ACTIVE
                            </span>
                            {displayLogs.some(l => l.type === "warn" || l.type === "error" || l.text?.includes("reverse-biased")) && isCollapsed && (
                                <span className="console-status-pill warning-pill" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.3)" }}>
                                    <i className="ri-alert-line"></i> Circuit Notice (Click to expand)
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="console-status-pill standby">STANDBY</span>
                    )}
                </div>

                <div className="console-actions">
                    {!isCollapsed && displayLogs.length > 0 && (
                        <button 
                            type="button" 
                            title="Clear Console"
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
                            <p>{isSimulating ? "Circuit active. No warnings or errors detected." : "Simulation standby. Click Play in the top bar to run real-time simulation."}</p>
                        </div>
                    ) : (
                        <div className="console-log-list">
                            {displayLogs.map((log, index) => (
                                <div key={index} className={`console-log-item log-${log.type || "info"}`}>
                                    <span className="log-time">{log.time || "0.00s"}</span>
                                    <span className="log-badge">{log.type?.toUpperCase() || "LOG"}</span>
                                    <span className="log-msg">{log.text}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default BottomConsole;
