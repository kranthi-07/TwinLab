import { useState } from "react";
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

function LearnPage({ onOpenWorkspace }) {
    const [selectedLevel, setSelectedLevel] = useState("all");

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
                    Step-by-step interactive courses designed to bridge electronic theory with virtual hardware simulation. Every lesson launches directly into a working digital twin.
                </p>

                {/* Filter Tabs */}
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
