import "./RightSidebar.css";
import { useState, useRef, useEffect } from "react";
import breadboardImg from "../../../assets/twinlab/breadboard.webp";

// ============================================================
// VISUAL INSTRUMENT & COMPONENT ILLUSTRATION IMAGES
// ============================================================

function MultimeterIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Dark Bench Background */}
            <rect width="280" height="84" rx="8" fill="#090d16" />
            <path d="M 0 42 L 280 42" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            
            {/* Multimeter Body Case (Yellow Rubber Holster) */}
            <rect x="70" y="8" width="56" height="68" rx="6" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
            
            {/* LCD Screen */}
            <rect x="76" y="14" width="44" height="20" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <rect x="78" y="16" width="40" height="16" rx="2" fill="#14281d" />
            <text x="82" y="27" fill="#4ade80" fontSize="9" fontFamily="monospace" fontWeight="bold">9.00 V</text>
            <text x="108" y="22" fill="#4ade80" fontSize="5" fontFamily="sans-serif">AUTO</text>

            {/* Rotary Dial */}
            <circle cx="98" cy="46" r="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <line x1="98" y1="46" x2="98" y2="40" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />

            {/* Banana Jacks */}
            <circle cx="86" cy="64" r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <circle cx="110" cy="64" r="2.5" fill="#dc2626" stroke="#ef4444" strokeWidth="1" />

            {/* Flexible Probe Cables */}
            <path d="M 110 66 C 120 78, 145 74, 160 52" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 86 66 C 75 78, 45 74, 30 52" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Red Test Probe Pen */}
            <g transform="translate(160, 24) rotate(25)">
                <rect x="-3" y="10" width="6" height="22" rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </g>

            {/* Black Test Probe Pen */}
            <g transform="translate(30, 24) rotate(-25)">
                <rect x="-3" y="10" width="6" height="22" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#e2e8f0" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />
            </g>

            {/* Spec Badge */}
            <rect x="180" y="24" width="86" height="36" rx="4" fill="rgba(234, 179, 8, 0.08)" stroke="rgba(234, 179, 8, 0.2)" strokeWidth="1" />
            <text x="188" y="38" fill="#facc15" fontSize="8" fontWeight="bold">DMM • True RMS</text>
            <text x="188" y="50" fill="#94a3b8" fontSize="7">0 - 500V DC • 10MΩ</text>
        </svg>
    );
}

function OscilloscopeIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Background Case */}
            <rect width="280" height="84" rx="8" fill="#090d16" />

            {/* CRT Screen Display */}
            <rect x="12" y="10" width="130" height="64" rx="5" fill="#02120e" stroke="#043226" strokeWidth="1.5" />
            
            {/* CRT Grid lines */}
            <path d="M 12 26 L 142 26 M 12 42 L 142 42 M 12 58 L 142 58" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.8" />
            <path d="M 44 10 L 44 74 M 77 10 L 77 74 M 110 10 L 110 74" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="0.8" />

            {/* CH1 Waveform (Amber Sine Wave) */}
            <path d="M 14 36 Q 30 18, 45 36 T 77 36 T 109 36 T 140 36" stroke="#facc15" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            
            {/* CH2 Waveform (Cyan Pulse Wave) */}
            <path d="M 14 54 H 28 V 46 H 50 V 54 H 74 V 46 H 96 V 54 H 120 V 46 H 140" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" fill="none" />

            {/* On-Screen Status */}
            <text x="18" y="21" fill="#34d399" fontSize="6.5" fontFamily="monospace" fontWeight="bold">● RUN</text>
            <text x="96" y="21" fill="#facc15" fontSize="6.5" fontFamily="monospace">1.00 kHz</text>

            {/* Oscilloscope Hardware Bench Controls */}
            <g transform="translate(154, 12)">
                {/* Knob 1 */}
                <circle cx="20" cy="18" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <line x1="20" y1="18" x2="25" y2="13" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                <text x="10" y="34" fill="#94a3b8" fontSize="6">TIME/DIV</text>

                {/* Knob 2 */}
                <circle cx="64" cy="18" r="9" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <line x1="64" y1="18" x2="68" y2="23" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
                <text x="54" y="34" fill="#94a3b8" fontSize="6">VOLTS/DIV</text>

                {/* Channel Jack BNC Connectors */}
                <circle cx="20" cy="48" r="5" fill="#334155" stroke="#facc15" strokeWidth="1.2" />
                <circle cx="64" cy="48" r="5" fill="#38bdf8" stroke="#38bdf8" strokeWidth="1.2" />
                <text x="14" y="58" fill="#facc15" fontSize="5.5" fontWeight="bold">CH1</text>
                <text x="58" y="58" fill="#38bdf8" fontSize="5.5" fontWeight="bold">CH2</text>
            </g>
        </svg>
    );
}

function SerialMonitorIllustration() {
    return (
        <svg viewBox="0 0 280 84" className="sidebar-instrument-svg" fill="none">
            {/* Terminal Window Case */}
            <rect width="280" height="84" rx="8" fill="#070a13" stroke="#1e293b" strokeWidth="1.2" />

            {/* Window Title Bar */}
            <rect width="280" height="22" rx="8" fill="#0f172a" />
            <circle cx="16" cy="11" r="3" fill="#ef4444" />
            <circle cx="26" cy="11" r="3" fill="#f59e0b" />
            <circle cx="36" cy="11" r="3" fill="#10b981" />
            <text x="52" y="14" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">UART Serial Monitor • COM3 (115200 baud)</text>

            {/* Terminal Monospace Logs */}
            <text x="14" y="36" fill="#34d399" fontSize="7" fontFamily="monospace">&gt; [0.00s] Firmware initialized (16MHz ATmega328P)</text>
            <text x="14" y="48" fill="#38bdf8" fontSize="7" fontFamily="monospace">&gt; [0.05s] Serial.begin(115200); [SUCCESS]</text>
            <text x="14" y="60" fill="#e2e8f0" fontSize="7" fontFamily="monospace">&gt; [1.20s] ADC Channel A0 reading = 1023 (5.00V)</text>
            <text x="14" y="72" fill="#facc15" fontSize="7" fontFamily="monospace">&gt; [2.40s] Ready for commands _</text>
        </svg>
    );
}

// Visual Component Preview Artwork for the Inspector Tab
function ComponentPreviewArtwork({ component }) {
    if (!component) return null;

    if (component.type?.startsWith("breadboard")) {
        return (
            <div className="inspector-img-box">
                <img src={breadboardImg} alt="Breadboard" className="inspector-real-img" />
            </div>
        );
    }

    if (component.type === "resistor") {
        return (
            <svg viewBox="0 0 160 50" className="inspector-svg-artwork">
                {/* Leads */}
                <line x1="10" y1="25" x2="45" y2="25" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                <line x1="115" y1="25" x2="150" y2="25" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                {/* Resistor Body */}
                <rect x="42" y="14" width="76" height="22" rx="6" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
                {/* Bands */}
                <rect x="52" y="14" width="5" height="22" fill="#dc2626" />
                <rect x="64" y="14" width="5" height="22" fill="#dc2626" />
                <rect x="76" y="14" width="5" height="22" fill="#a16207" />
                <rect x="100" y="14" width="5" height="22" fill="#fbbf24" />
            </svg>
        );
    }

    if (component.type === "led") {
        const color = component.color || "#ef4444";
        return (
            <svg viewBox="0 0 120 70" className="inspector-svg-artwork">
                {/* Pins */}
                <line x1="50" y1="46" x2="50" y2="68" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="70" y1="46" x2="70" y2="64" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                {/* Collar */}
                <rect x="42" y="42" width="36" height="6" rx="2" fill={color} filter="brightness(0.8)" />
                {/* Dome */}
                <path d="M 44 42 C 44 14, 76 14, 76 42 Z" fill={color} />
                {/* Emission glow */}
                <circle cx="60" cy="28" r="16" fill={color} opacity="0.35" filter="blur(4px)" />
            </svg>
        );
    }

    if (component.type === "battery-9v") {
        return (
            <svg viewBox="0 0 100 80" className="inspector-svg-artwork">
                {/* Terminals */}
                <rect x="32" y="4" width="10" height="8" rx="2" fill="#94a3b8" />
                <circle cx="68" cy="8" r="5" fill="#cbd5e1" />
                {/* Shoulder (Copper Band) */}
                <rect x="20" y="12" width="60" height="16" rx="3" fill="#b45309" />
                {/* Body */}
                <rect x="20" y="28" width="60" height="48" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="36" y="56" fill="#10b981" fontSize="11" fontWeight="bold">9V</text>
            </svg>
        );
    }

    if (component.type === "arduino-uno") {
        return (
            <svg viewBox="0 0 160 90" className="inspector-svg-artwork">
                {/* PCB Surface */}
                <rect x="15" y="8" width="130" height="74" rx="8" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
                {/* USB Port */}
                <rect x="10" y="16" width="24" height="20" rx="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
                {/* ATmega328P DIP IC */}
                <rect x="65" y="48" width="52" height="16" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="70" y="60" fill="#94a3b8" fontSize="7" fontFamily="monospace">ATmega328P</text>
                {/* Header Sockets */}
                <rect x="42" y="12" width="94" height="8" rx="1.5" fill="#1e293b" />
                <rect x="42" y="70" width="94" height="8" rx="1.5" fill="#1e293b" />
                <text x="44" y="42" fill="#f8fafc" fontSize="10" fontWeight="bold">ARDUINO UNO</text>
            </svg>
        );
    }

    if (component.type === "esp32" || component.type === "esp32-devkit") {
        return (
            <svg viewBox="0 0 150 90" className="inspector-svg-artwork">
                {/* Black PCB */}
                <rect x="20" y="10" width="110" height="70" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                {/* Metal Wi-Fi Shield */}
                <rect x="45" y="22" width="60" height="42" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="56" y="46" fill="#0f172a" fontSize="8" fontWeight="bold">ESP-WROOM-32</text>
                {/* Dual Pin Headers */}
                <rect x="24" y="12" width="6" height="66" rx="1" fill="#1e293b" />
                <rect x="120" y="12" width="6" height="66" rx="1" fill="#1e293b" />
            </svg>
        );
    }

    if (component.type === "multimeter") {
        return <MultimeterIllustration />;
    }

    // Generic passive icon
    return (
        <div className="inspector-generic-icon">
            <i className="ri-cpu-line"></i>
        </div>
    );
}

// ============================================================
// MAIN RIGHT SIDEBAR COMPONENT
// ============================================================

function RightSidebar({
    onOpenOscilloscope,
    onOpenSerial,
    onOpenMultimeter,
    selectedComponent,
    components = [],
    onSelectComponent,
    onUpdateComponent,
    onDeleteComponent,
    onRotateComponent,
    onAddComponent,
    simulationResult
}) {
    const [activeTab, setActiveTab] = useState(null);
    const rightSidebarRef = useRef(null);

    // Close panel on outside click on the screen
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (rightSidebarRef.current && !rightSidebarRef.current.contains(e.target)) {
                setActiveTab(null);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const tabs = [
        {
            id: "instruments",
            title: "Instruments",
            icon: "ri-flask-line",
            color: "#FF8A00"
        },
        {
            id: "inspector",
            title: "Inspector",
            icon: "ri-focus-3-line",
            color: "#3B9CFF"
        },
        {
            id: "connections",
            title: "Connections",
            icon: "ri-node-tree",
            color: "#00D28F"
        },
        {
            id: "pinned",
            title: "Pinned",
            icon: "ri-pushpin-line",
            color: "#C779FF"
        }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab);

    const handleClick = (id) => {
        setActiveTab(activeTab === id ? null : id);
    };

    return (
        <aside 
            ref={rightSidebarRef}
            className={`right-sidebar ${activeTab ? "open" : ""}`}
            style={{ "--accent": currentTab?.color || "#FF8A00" }}
        >
            {/* =================================
                SIDEBAR EXPANDED PANEL
            ================================= */}
            <div className="right-panel">
                {currentTab && (
                    <>
                        <div className="right-panel-header">
                            <div className="right-panel-title">
                                <div className="right-heading-icon" style={{ color: currentTab.color }}>
                                    <i className={currentTab.icon}></i>
                                </div>
                                <div>
                                    <h3>{currentTab.title}</h3>
                                    <span>TwinLab Virtual Bench</span>
                                </div>
                            </div>
                            <button className="right-close" onClick={() => setActiveTab(null)} title="Close Panel">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="right-panel-content" key={activeTab}>
                            {/* 1. INSTRUMENTS TAB WITH REAL VISUAL PREVIEW IMAGES */}
                            {activeTab === "instruments" && (
                                <div className="instruments-gallery">
                                    {/* Voltmeter / DMM Card */}
                                    <div className="instrument-feature-card" onClick={onOpenMultimeter}>
                                        <div className="instrument-art-container">
                                            <MultimeterIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>Digital Multimeter</strong>
                                                <span className="inst-badge badge-dmm">TL-890D</span>
                                            </div>
                                            <p>Precision DC Voltage, Current, Resistance & Continuity beeper.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn primary" onClick={onOpenMultimeter}>
                                                    <i className="ri-dashboard-3-line"></i> Open Meter
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Oscilloscope Card */}
                                    <div className="instrument-feature-card" onClick={onOpenOscilloscope}>
                                        <div className="instrument-art-container">
                                            <OscilloscopeIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>Dual-Trace Oscilloscope</strong>
                                                <span className="inst-badge badge-cro">200 MHz</span>
                                            </div>
                                            <p>Real-time waveform signal analyzer with live frequency & Vpp.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn primary" onClick={onOpenOscilloscope}>
                                                    <i className="ri-line-chart-line"></i> Launch Scope
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Serial Monitor Card */}
                                    <div className="instrument-feature-card" onClick={onOpenSerial}>
                                        <div className="instrument-art-container">
                                            <SerialMonitorIllustration />
                                        </div>
                                        <div className="instrument-card-body">
                                            <div className="instrument-title-row">
                                                <strong>UART Serial Monitor</strong>
                                                <span className="inst-badge badge-uart">115200</span>
                                            </div>
                                            <p>Real-time hardware UART serial communication logger for MCU.</p>
                                            <div className="instrument-actions">
                                                <button className="inst-action-btn" onClick={onOpenSerial}>
                                                    <i className="ri-terminal-box-line"></i> Open Console
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. INSPECTOR TAB WITH COMPONENT IMAGE AND LIVE STATS */}
                            {activeTab === "inspector" && (
                                <div className="inspector-panel-view">
                                    {selectedComponent ? (
                                        <div className="inspector-active-card">
                                            {/* Visual Image / Graphic Banner */}
                                            <div className="inspector-banner">
                                                <ComponentPreviewArtwork component={selectedComponent} />
                                            </div>

                                            {/* Component Name & Type */}
                                            <div className="inspector-meta-row">
                                                <div>
                                                    <h4 className="comp-name-title">{selectedComponent.name || selectedComponent.type}</h4>
                                                    <span className="comp-type-tag">{selectedComponent.type}</span>
                                                </div>
                                                <div className="comp-quick-actions">
                                                    <button 
                                                        className="meta-action-btn" 
                                                        onClick={onRotateComponent}
                                                        title="Rotate 90° (R)"
                                                    >
                                                        <i className="ri-anticlockwise-line"></i>
                                                    </button>
                                                    <button 
                                                        className="meta-action-btn delete" 
                                                        onClick={() => onDeleteComponent && onDeleteComponent(selectedComponent.id)}
                                                        title="Delete (Del)"
                                                    >
                                                        <i className="ri-delete-bin-line"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Live Simulation Measurements */}
                                            <div className="inspector-stats-box">
                                                <span className="stats-box-title">ELECTRICAL STATUS</span>
                                                <div className="stats-grid">
                                                    <div className="stat-pill">
                                                        <span className="stat-label">Position</span>
                                                        <span className="stat-val">X: {selectedComponent.x}, Y: {selectedComponent.y}</span>
                                                    </div>
                                                    <div className="stat-pill">
                                                        <span className="stat-label">Rotation</span>
                                                        <span className="stat-val">{selectedComponent.rotation || 0}°</span>
                                                    </div>
                                                    {selectedComponent.resistance != null && (
                                                        <div className="stat-pill highlight">
                                                            <span className="stat-label">Resistance</span>
                                                            <span className="stat-val">{selectedComponent.resistance >= 1000 ? `${selectedComponent.resistance / 1000} kΩ` : `${selectedComponent.resistance} Ω`}</span>
                                                        </div>
                                                    )}
                                                    {selectedComponent.voltage != null && (
                                                        <div className="stat-pill highlight">
                                                            <span className="stat-label">Voltage</span>
                                                            <span className="stat-val">{selectedComponent.voltage} V</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Renaming Input */}
                                            <div className="inspector-field-group">
                                                <label>Custom Label</label>
                                                <input 
                                                    type="text"
                                                    className="inspector-text-input"
                                                    value={selectedComponent.name || ""}
                                                    onChange={(e) => onUpdateComponent && onUpdateComponent(selectedComponent.id, { name: e.target.value })}
                                                    placeholder="Enter component name..."
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="inspector-empty-gallery">
                                            <div className="inspector-placeholder-lead">
                                                <i className="ri-focus-3-line"></i>
                                                <p>Select any component on your canvas to inspect its properties.</p>
                                            </div>

                                            {/* Quick-Add Components with Images */}
                                            <div className="quick-add-section">
                                                <span className="section-label">WORKSPACE COMPONENTS ({components.length})</span>
                                                <div className="placed-components-list">
                                                    {components.map((c) => (
                                                        <div 
                                                            key={c.id} 
                                                            className="placed-item-chip"
                                                            onClick={() => onSelectComponent && onSelectComponent(c.id)}
                                                        >
                                                            <span className="chip-name">{c.name || c.type}</span>
                                                            <span className="chip-pos">({c.x}, {c.y})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 3. CONNECTIONS TAB */}
                            {activeTab === "connections" && (
                                <Empty
                                    icon="ri-node-tree"
                                    title="Circuit Connections"
                                    text="Live topological netlist and solder nodes appear here."
                                />
                            )}

                            {/* 4. PINNED TAB */}
                            {activeTab === "pinned" && (
                                <Empty
                                    icon="ri-pushpin-line"
                                    title="Pinned Benchmarks"
                                    text="Pin frequently used probe needles or reference voltages."
                                />
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* =================================
                FLOATING ICON RAIL
            ================================= */}
            <div className="right-icons">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            className={`right-icon ${isActive ? "active" : ""}`}
                            style={{ "--icon-color": tab.color }}
                            onClick={() => handleClick(tab.id)}
                        >
                            <i className={tab.icon}></i>
                            <span className="right-tooltip">{tab.title}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function Empty({ icon, title, text }) {
    return (
        <div className="right-empty">
            <i className={icon}></i>
            <strong>{title}</strong>
            <span>{text}</span>
        </div>
    );
}

export default RightSidebar;
