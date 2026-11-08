import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import "./LearnPage.css";

const LESSONS = [
    {
        id: "lesson-led",
        title: "Breadboard & LED Fundamentals",
        level: "Beginner",
        levelColor: "#22c55e",
        duration: "5 min",
        icon: "ri-lightbulb-line",
        summary: "Understand how solderless breadboard internal tie-point rails work, LED polarity (anode vs cathode), and how to build a basic closed loop.",
        topics: ["Breadboard Internal Clips", "Forward Voltage (Vf)", "Polarity Orientation"],
        setup: {
            template: "starter-led-resistor",
            title: "Lesson: LED Basics"
        }
    },
    {
        id: "lesson-ohms-law",
        title: "Ohm's Law: Current-Limiting Resistors",
        level: "Beginner",
        levelColor: "#22c55e",
        duration: "8 min",
        icon: "ri-pulse-line",
        summary: "Calculate the exact resistance needed to prevent high-current LED burnout using V = I * R with 9V and 5V power rails.",
        topics: ["Ohm's Law Formula", "Resistor Color Bands", "Overcurrent Protection"],
        setup: {
            template: "starter-battery-led",
            title: "Lesson: Ohm's Law"
        }
    },
    {
        id: "lesson-arduino-blink",
        title: "Arduino 101: Firmware Blink & Digital I/O",
        level: "Beginner",
        levelColor: "#3b82f6",
        duration: "10 min",
        icon: "ri-router-line",
        summary: "Write and upload your first C++ sketch to the ATmega328P microcontroller. Toggle Pin 13, manage clock delays, and inspect serial output.",
        topics: ["pinMode() & digitalWrite()", "Firmware Compilation", "Virtual USB Flashing"],
        setup: {
            template: "arduino",
            title: "Lesson: Arduino Blink"
        }
    },
    {
        id: "lesson-potentiometer",
        title: "Analog Inputs: Voltage Divider & Potentiometer",
        level: "Intermediate",
        levelColor: "#f59e0b",
        duration: "12 min",
        icon: "ri-equalizer-line",
        summary: "Explore 3-terminal variable resistors. Connect a center wiper to an analog pin to continuously control LED brightness or sensor thresholds.",
        topics: ["Voltage Dividers", "Linear vs Log Taper", "Analog-to-Digital (ADC)"],
        setup: {
            template: "starter-pot-led",
            title: "Lesson: Analog Potentiometers"
        }
    },
    {
        id: "lesson-esp32-iot",
        title: "ESP32 Dual-Core & IoT Telemetry",
        level: "Advanced",
        levelColor: "#a855f7",
        duration: "15 min",
        icon: "ri-wifi-line",
        summary: "Harness the 240MHz Xtensa LX7 dual-core microcontroller. Configure GPIOs, Wi-Fi status indicators, and monitor live serial telemetry.",
        topics: ["Dual-Core 240MHz Clock", "3.3V Logic Level", "Serial Telemetry at 115200 Baud"],
        setup: {
            template: "esp32",
            title: "Lesson: ESP32 IoT Nodes"
        }
    },
    {
        id: "lesson-lcd-i2c",
        title: "16x2 Character LCD Interfacing (I2C)",
        level: "Intermediate",
        levelColor: "#06b6d4",
        duration: "12 min",
        icon: "ri-tv-line",
        summary: "Wire and control a HD44780 16x2 dot-matrix character display using the PCF8574 I2C 2-wire serial bus (SDA and SCL).",
        topics: ["I2C Bus Protocol", "Address 0x27 / 0x3F", "Backlight & Cursor Control"],
        setup: {
            template: "starter-led-resistor",
            title: "Lesson: 16x2 LCD Interfacing"
        }
    }
];

const LOGIC_GATES = [
    { id: "AND", name: "AND (74HC08)", fn: (a, b) => a && b, symbol: "&" },
    { id: "OR", name: "OR (74HC32)", fn: (a, b) => a || b, symbol: "≥1" },
    { id: "NAND", name: "NAND (74HC00)", fn: (a, b) => !(a && b), symbol: "&̅" },
    { id: "NOR", name: "NOR (74HC02)", fn: (a, b) => !(a || b), symbol: "≥̅1" },
    { id: "XOR", name: "XOR (74HC86)", fn: (a, b) => Boolean(a ^ b), symbol: "=1" },
    { id: "NOT", name: "NOT (74HC04)", fn: (a) => !a, symbol: "1" }
];

function LearnPage({ onOpenWorkspace }) {
    const [selectedLevel, setSelectedLevel] = useState("all");

    // Interactive Ohm's Law State
    const [ohmsVoltage, setOhmsVoltage] = useState(5.0);
    const [ohmsResistance, setOhmsResistance] = useState(220);

    // Interactive Logic Gate State
    const [selectedGate, setSelectedGate] = useState("AND");
    const [gateInputA, setGateInputA] = useState(1);
    const [gateInputB, setGateInputB] = useState(1);

    // Compute Ohm's Law values
    const currentAmps = ohmsVoltage / ohmsResistance;
    const currentMilliAmps = currentAmps * 1000;
    const powerMilliWatts = ohmsVoltage * currentMilliAmps;
    const isOverload = currentMilliAmps > 30;
    const isDim = currentMilliAmps < 5;

    // Compute Logic Gate output
    const activeGate = LOGIC_GATES.find(g => g.id === selectedGate) || LOGIC_GATES[0];
    const gateOutput = activeGate.fn(gateInputA, gateInputB) ? 1 : 0;

    const filteredLessons = LESSONS.filter(l => {
        if (selectedLevel === "all") return true;
        return l.level.toLowerCase() === selectedLevel.toLowerCase();
    });

    const handleLaunchLesson = (lesson) => {
        const now = Date.now();
        const draft = {
            components: [
                {
                    id: `breadboard-${now}`,
                    type: "breadboard-half",
                    name: "Breadboard (Half)",
                    x: 320,
                    y: 160,
                    rotation: 0
                },
                {
                    id: `battery-9v-${now + 1}`,
                    type: "battery-9v",
                    name: "9V Battery",
                    x: 160,
                    y: 208,
                    rotation: 0,
                    voltage: 9
                },
                {
                    id: `resistor-${now + 2}`,
                    type: "resistor",
                    name: "Resistor (220Ω)",
                    resistance: 220,
                    x: 512,
                    y: 272,
                    rotation: 0
                },
                {
                    id: `led-${now + 3}`,
                    type: "led",
                    name: "5mm LED (Red)",
                    color: "#ef4444",
                    x: 576,
                    y: 288,
                    rotation: 0
                }
            ],
            wires: [
                {
                    id: `wire-${now + 4}`,
                    color: "#ef4444",
                    points: [{ x: 176, y: 208 }, { x: 512, y: 240 }],
                    routingMode: "curved"
                },
                {
                    id: `wire-${now + 5}`,
                    color: "#0f172a",
                    points: [{ x: 208, y: 208 }, { x: 592, y: 240 }],
                    routingMode: "curved"
                }
            ]
        };
        try {
            localStorage.setItem("twinlab_workspace_draft", JSON.stringify(draft));
        } catch (e) {
            console.error("Failed to save draft:", e);
        }
        onOpenWorkspace && onOpenWorkspace();
    };

    return (
        <div className="learn-page-container">
            {/* Header */}
            <div className="learn-header">
                <div className="learn-badge">
                    <i className="ri-book-open-line"></i>
                    <span>Interactive Engineering Academy</span>
                </div>
                <h1>Hardware Engineering Tutorials</h1>
                <p>
                    Interactive circuit workbench and real-time electronic physics solvers. Experiment with Ohm&apos;s law calculations, silicon logic truth tables, and hands-on guided lessons.
                </p>
            </div>

            {/* ============================================================
               INTERACTIVE CIRCUIT WORKBENCH: OHM'S LAW & LOGIC GATES
            ============================================================ */}
            <div className="interactive-workbench-grid">
                {/* 1. OHM'S LAW SOLVER */}
                <div className="workbench-card">
                    <div className="workbench-card-head">
                        <div className="workbench-icon-badge">
                            <i className="ri-pulse-line"></i>
                        </div>
                        <div>
                            <h3>Ohm&apos;s Law Dynamic Circuit Simulator</h3>
                            <span className="font-mono workbench-sub">V = I · R  //  P = V · I</span>
                        </div>
                    </div>

                    {/* Circuit Schematic Display */}
                    <div className="schematic-visual-box">
                        <svg className="schematic-svg" viewBox="0 0 340 100">
                            {/* Circuit Loop Wires */}
                            <path d="M 50 50 L 50 20 L 290 20 L 290 50" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                            <path d="M 50 50 L 50 80 L 290 80 L 290 50" fill="none" stroke="#334155" strokeWidth="2.5" />

                            {/* Voltage Source Symbol */}
                            <circle cx="50" cy="50" r="16" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                            <text x="50" y="47" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
                            <text x="50" y="60" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle">-</text>
                            <text x="50" y="30" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">{ohmsVoltage.toFixed(1)}V</text>

                            {/* Resistor Symbol (Zigzag) */}
                            <path d="M 130 20 L 140 12 L 150 28 L 160 12 L 170 28 L 180 12 L 190 20" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
                            <text x="160" y="40" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">{ohmsResistance}Ω</text>

                            {/* LED Symbol */}
                            <circle cx="290" cy="50" r="14" fill={isOverload ? "#ef4444" : isDim ? "#475569" : "#22c55e"} stroke="#ffffff" strokeWidth="1.5" />
                            <text x="290" y="54" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">LED</text>

                            {/* Animated Current Electron Particles */}
                            <circle cx="90" cy="20" r="2.5" fill="#38bdf8">
                                <animate attributeName="cx" from="50" to="290" dur={`${Math.max(0.3, Math.min(3, 40 / (currentMilliAmps || 1)))}s`} repeatCount="indefinite" />
                            </circle>
                            <circle cx="210" cy="80" r="2.5" fill="#38bdf8">
                                <animate attributeName="cx" from="290" to="50" dur={`${Math.max(0.3, Math.min(3, 40 / (currentMilliAmps || 1)))}s`} repeatCount="indefinite" />
                            </circle>
                        </svg>

                        {/* Status readout strip */}
                        <div className="schematic-status-strip">
                            <span className={`status-pill ${isOverload ? "danger" : isDim ? "dim" : "optimal"}`}>
                                {isOverload ? "⚠️ Burnout Risk (> 30mA)" : isDim ? "Dim (Undercurrent)" : "✓ Optimal LED Bias (20mA)"}
                            </span>
                            <span className="power-readout font-mono">P = {powerMilliWatts.toFixed(1)} mW</span>
                        </div>
                    </div>

                    {/* Sliders */}
                    <div className="workbench-sliders">
                        <div className="slider-item">
                            <div className="slider-meta">
                                <span>Supply Voltage (V)</span>
                                <span className="font-mono val-highlight">{ohmsVoltage.toFixed(1)} V</span>
                            </div>
                            <input 
                                type="range" 
                                min="1.0" 
                                max="12.0" 
                                step="0.5" 
                                value={ohmsVoltage} 
                                onChange={(e) => setOhmsVoltage(Number(e.target.value))}
                                className="workbench-range"
                            />
                        </div>

                        <div className="slider-item">
                            <div className="slider-meta">
                                <span>Resistance (R)</span>
                                <span className="font-mono val-highlight">{ohmsResistance} Ω</span>
                            </div>
                            <input 
                                type="range" 
                                min="20" 
                                max="2000" 
                                step="10" 
                                value={ohmsResistance} 
                                onChange={(e) => setOhmsResistance(Number(e.target.value))}
                                className="workbench-range"
                            />
                        </div>
                    </div>

                    {/* Computed Current Result */}
                    <div className="calculated-result-box">
                        <span className="calc-k">COMPUTED CURRENT (I = V / R)</span>
                        <span className="calc-v font-mono">{currentMilliAmps.toFixed(2)} mA</span>
                    </div>
                </div>

                {/* 2. LOGIC GATE TRUTH TABLE SIMULATOR */}
                <div className="workbench-card">
                    <div className="workbench-card-head">
                        <div className="workbench-icon-badge">
                            <i className="ri-cpu-line"></i>
                        </div>
                        <div>
                            <h3>Digital Silicon Logic Simulator</h3>
                            <span className="font-mono workbench-sub">TTL 74HC IC Series // Real-Time Truth Table</span>
                        </div>
                    </div>

                    {/* Gate Selector Pills */}
                    <div className="gate-selector-row">
                        {LOGIC_GATES.map((g) => (
                            <button
                                key={g.id}
                                type="button"
                                className={`gate-btn ${selectedGate === g.id ? "active" : ""}`}
                                onClick={() => setSelectedGate(g.id)}
                            >
                                {g.id}
                            </button>
                        ))}
                    </div>

                    {/* Interactive Gate Schematic */}
                    <div className="gate-circuit-box">
                        <div className="gate-inputs-col">
                            <button 
                                type="button" 
                                className={`gate-input-toggle ${gateInputA ? "high" : "low"}`}
                                onClick={() => setGateInputA(gateInputA ? 0 : 1)}
                            >
                                <span>IN A</span>
                                <strong>{gateInputA}</strong>
                            </button>

                            {selectedGate !== "NOT" && (
                                <button 
                                    type="button" 
                                    className={`gate-input-toggle ${gateInputB ? "high" : "low"}`}
                                    onClick={() => setGateInputB(gateInputB ? 0 : 1)}
                                >
                                    <span>IN B</span>
                                    <strong>{gateInputB}</strong>
                                </button>
                            )}
                        </div>

                        {/* Gate Icon Center */}
                        <div className="gate-icon-center">
                            <div className="gate-core-badge">
                                <span>{activeGate.name}</span>
                            </div>
                            <i className="ri-arrow-right-line gate-arrow"></i>
                        </div>

                        {/* Gate Output Display */}
                        <div className="gate-output-col">
                            <div className={`gate-output-lamp ${gateOutput ? "lit" : "dark"}`}>
                                <span>OUT</span>
                                <strong>{gateOutput}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Truth Table */}
                    <div className="truth-table-wrap">
                        <table className="mini-truth-table font-mono">
                            <thead>
                                <tr>
                                    <th>A</th>
                                    {selectedGate !== "NOT" && <th>B</th>}
                                    <th>OUT ({activeGate.id})</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedGate === "NOT" ? (
                                    [0, 1].map((a) => {
                                        const out = activeGate.fn(a) ? 1 : 0;
                                        const isCurr = gateInputA === a;
                                        return (
                                            <tr key={a} className={isCurr ? "active-row" : ""}>
                                                <td>{a}</td>
                                                <td className={out ? "out-high" : "out-low"}>{out}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => {
                                        const out = activeGate.fn(a, b) ? 1 : 0;
                                        const isCurr = gateInputA === a && gateInputB === b;
                                        return (
                                            <tr key={`${a}-${b}`} className={isCurr ? "active-row" : ""}>
                                                <td>{a}</td>
                                                <td>{b}</td>
                                                <td className={out ? "out-high" : "out-low"}>{out}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Filter Tabs for Lessons */}
            <div className="lessons-section-head">
                <h2>Guided Engineering Curricula</h2>
                <div className="learn-filters">
                    {["all", "beginner", "intermediate", "advanced"].map(lvl => (
                        <button
                            key={lvl}
                            className={`level-filter-btn ${selectedLevel === lvl ? "active" : ""}`}
                            onClick={() => setSelectedLevel(lvl)}
                        >
                            {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lesson Cards Grid */}
            <div className="lessons-grid">
                {filteredLessons.map((lesson) => (
                    <motion.div
                        key={lesson.id}
                        className="lesson-card"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="lesson-top">
                            <div className="lesson-icon-box">
                                <i className={lesson.icon}></i>
                            </div>
                            <div className="lesson-meta-badges">
                                <span className="level-badge" style={{ color: lesson.levelColor, borderColor: `${lesson.levelColor}40`, backgroundColor: `${lesson.levelColor}15` }}>
                                    {lesson.level}
                                </span>
                                <span className="time-badge">
                                    <i className="ri-time-line"></i>
                                    {lesson.duration}
                                </span>
                            </div>
                        </div>

                        <div className="lesson-content">
                            <h3>{lesson.title}</h3>
                            <p>{lesson.summary}</p>

                            <div className="lesson-topics-list">
                                {lesson.topics.map(t => (
                                    <span key={t} className="topic-chip">
                                        <i className="ri-check-line"></i>
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="lesson-action-row">
                            <button
                                className="launch-lesson-btn"
                                onClick={() => handleLaunchLesson(lesson)}
                            >
                                <span>Launch Interactive Lab</span>
                                <i className="ri-arrow-right-line"></i>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default LearnPage;
