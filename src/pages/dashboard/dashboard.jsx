import "./dashboard.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NewProjectModal from "../../components/NewProjectModal/NewProjectModal";

const PROJECTS_STORAGE_KEY = "twinlab_user_projects";
const ACTIVE_STORAGE_KEY = "twinlab_active_project";
const DRAFT_STORAGE_KEY = "twinlab_workspace_draft";

export const STARTER_TEMPLATES = [
    {
        id: "esp32",
        name: "ESP32 IoT Node",
        chip: "ESP32-S3",
        badge: "Dual-Core 240MHz",
        desc: "Integrated Wi-Fi 4 & BLE 5.0 microcontroller with rich GPIO breakouts for IoT nodes.",
        specs: ["Wi-Fi & Bluetooth", "44 GPIO Pins", "Hardware Crypto"],
        icon: "ri-cpu-line",
        accent: "#FF8A00"
    },
    {
        id: "arduino",
        name: "Arduino Uno R3",
        chip: "ATmega328P",
        badge: "8-Bit AVR 16MHz",
        desc: "The world's standard hardware prototyping base with 5V logic and solderless breadboard integration.",
        specs: ["14 Digital I/O", "6 PWM Outputs", "5V Tolerant"],
        icon: "ri-router-line",
        accent: "#3B9CFF"
    },
    {
        id: "pi",
        name: "Raspberry Pi Pico",
        chip: "RP2040",
        badge: "Dual Cortex-M0+",
        desc: "Ultra-fast silicon with programmable I/O (PIO), dual ARM cores, and flexible pin multiplexing.",
        specs: ["Dual 133MHz Cores", "8 PIO State Machines", "264KB SRAM"],
        icon: "ri-computer-line",
        accent: "#A855F7"
    },
    {
        id: "blank",
        name: "Blank Canvas",
        chip: "Modular",
        badge: "Open Prototyping",
        desc: "Completely clean solderless workspace ready for custom ICs, sensors, and freeform routing.",
        specs: ["Freeform Routing", "Multi-voltage Rails", "Custom Schematics"],
        icon: "ri-layout-grid-line",
        accent: "#10B981"
    }
];

const ARCHITECTURE_CORES = [
    {
        id: "esp32",
        name: "ESP32-S3 Pro",
        family: "Espressif Xtensa LX7",
        clock: "240 MHz",
        cores: "Dual-Core 32-bit",
        sram: "512 KB",
        flash: "8 MB QSPI",
        gpio: "44 Pins",
        protocols: ["Wi-Fi 4", "BLE 5.0", "I2C", "SPI", "UART", "I2S"],
        accent: "#FF8A00",
        desc: "High-performance IoT powerhouse with dedicated vector instructions for AI edge acceleration and integrated wireless PHY.",
        status: "ONLINE • OPTIMIZED",
        pins: [
            { pin: "GPIO 1", type: "ADC / TOUCH", state: "HIGH 3.3V" },
            { pin: "GPIO 2", type: "BOOT / PWM", state: "PWM 64%" },
            { pin: "GPIO 19", type: "USB D-", state: "SYNC" },
            { pin: "GPIO 20", type: "USB D+", state: "SYNC" },
            { pin: "GPIO 43", type: "U0TXD", state: "ACTIVE" },
            { pin: "GPIO 44", type: "U0RXD", state: "LISTENING" }
        ]
    },
    {
        id: "arduino",
        name: "ATmega328P AVR",
        family: "Microchip 8-bit RISC",
        clock: "16 MHz",
        cores: "Single-Core 8-bit",
        sram: "2 KB",
        flash: "32 KB ISP",
        gpio: "14 Digital + 6 Analog",
        protocols: ["UART", "SPI", "I2C (TWI)"],
        accent: "#3B9CFF",
        desc: "The timeless embedded standard. Rugged 5V TTL logic with cycle-accurate opcode execution and hardware timer interrupts.",
        status: "ACTIVE • 5.0V LOGIC",
        pins: [
            { pin: "PIN D13", type: "SCK / LED", state: "CLK 1Hz" },
            { pin: "PIN D11", type: "MOSI / PWM", state: "READY" },
            { pin: "PIN D10", type: "SS / PWM", state: "HIGH 5V" },
            { pin: "PIN A0", type: "10-bit ADC", state: "2.54V IN" },
            { pin: "PIN A4", type: "I2C SDA", state: "PULLUP" },
            { pin: "PIN A5", type: "I2C SCL", state: "100 kHz" }
        ]
    },
    {
        id: "pi",
        name: "RP2040 Dual ARM",
        family: "Raspberry Pi Silicon",
        clock: "133 MHz",
        cores: "Dual Cortex-M0+",
        sram: "264 KB Striped",
        flash: "16 MB External",
        gpio: "30 Multi-Function",
        protocols: ["8x PIO State Machines", "Dual UART", "Dual SPI", "Dual I2C"],
        accent: "#A855F7",
        desc: "Modern silicon innovation with 8 programmable PIO state machines capable of synthesizing custom DVI, WS2812, and high-speed buses.",
        status: "RUNNING • PIO SYNC",
        pins: [
            { pin: "GP0", type: "UART0 TX", state: "115200" },
            { pin: "GP1", type: "UART0 RX", state: "LISTENING" },
            { pin: "GP2", type: "PIO0 SM0", state: "SYNTH" },
            { pin: "GP16", type: "SPI0 RX", state: "IDLE" },
            { pin: "GP18", type: "SPI0 SCK", state: "HIGH" },
            { pin: "GP25", type: "ONBOARD LED", state: "PULSE" }
        ]
    },
    {
        id: "logic",
        name: "74HC CMOS Matrix",
        family: "Discrete High-Speed Logic",
        clock: "50 MHz Max",
        cores: "Quad / Hex Gates",
        sram: "Flip-Flop Latches",
        flash: "Combinatorial",
        gpio: "Multi-gate DIP-14",
        protocols: ["TTL / CMOS", "74HC08 AND", "74HC32 OR", "74HC04 NOT", "74HC00 NAND"],
        accent: "#10B981",
        desc: "Hardware-level combinatorial and sequential logic building blocks. Zero latency sub-nanosecond gate response for pure silicon synthesis.",
        status: "BUS STEADY • CMOS",
        pins: [
            { pin: "GATE 1A", type: "INPUT", state: "HIGH" },
            { pin: "GATE 1B", type: "INPUT", state: "HIGH" },
            { pin: "GATE 1Y", type: "OUTPUT (AND)", state: "LOGIC 1" },
            { pin: "GATE 2A", type: "INPUT", state: "LOW" },
            { pin: "GATE 2B", type: "INPUT", state: "HIGH" },
            { pin: "GATE 2Y", type: "OUTPUT (AND)", state: "LOGIC 0" }
        ]
    }
];

function getInitialProjects() {
    try {
        const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Storage error:", e);
    }

    const defaultProject = {
        id: "proj-1",
        name: "Project - 1",
        template: "esp32",
        chip: "ESP32-S3",
        accent: "#FF8A00",
        icon: "ri-cpu-line",
        status: "Active",
        lastEdited: "Just now",
        updatedAt: new Date().toISOString(),
        components: [
            { id: "esp32-1", type: "esp32-devkit", name: "ESP32 DevKit V1", x: 60, y: 40 },
            { id: "bb-1", type: "breadboard-half", name: "Breadboard", x: 200, y: 40 },
            { id: "res-1", type: "resistor", name: "Resistor", x: 260, y: 70 },
            { id: "led-1", type: "led", name: "LED Blue", color: "#3b82f6", x: 300, y: 70 }
        ],
        wires: [
            { id: "w1", color: "#3b82f6", points: [{ x: 130, y: 70 }, { x: 260, y: 70 }] },
            { id: "w2", color: "#0f172a", points: [{ x: 130, y: 90 }, { x: 300, y: 90 }] }
        ]
    };

    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify([defaultProject]));
        localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(defaultProject));
    } catch (e) {}

    return [defaultProject];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } }
};

// ============================================================
// DYNAMIC REAL PROJECT LIVE CIRCUIT MINI PREVIEW
// Accurately renders the user's actual saved components and wires!
// ============================================================
function ProjectCircuitMiniPreview({ project, onOpen }) {
    const comps = project.components || [];
    const wires = project.wires || [];
    const hasComps = comps.length > 0;

    // Calculate normalized bounding box
    let minX = 0, minY = 0, maxX = 360, maxY = 160;
    if (hasComps) {
        minX = Math.min(...comps.map(c => c.x || 0));
        minY = Math.min(...comps.map(c => c.y || 0));
        maxX = Math.max(...comps.map(c => (c.x || 0) + (c.width || 120)));
        maxY = Math.max(...comps.map(c => (c.y || 0) + (c.height || 90)));
    }
    const width = Math.max(300, maxX - minX + 60);
    const height = Math.max(140, maxY - minY + 60);
    const viewBox = `${minX - 25} ${minY - 25} ${width} ${height}`;

    return (
        <motion.div 
            className="hero-real-twin-preview"
            whileHover={{ y: -3, borderColor: project.accent || "#ff8a00" }}
            onClick={() => onOpen(project)}
            title="Click to open this simulated digital twin in workspace"
        >
            {/* Corner Decorators */}
            <div className="tech-corner-decor tl"></div>
            <div className="tech-corner-decor tr"></div>
            <div className="tech-corner-decor bl"></div>
            <div className="tech-corner-decor br"></div>

            {/* Top Status */}
            <div className="mini-preview-top">
                <div className="mini-badge-wrap">
                    <span className="live-pill">
                        <span className="live-dot pulse" />
                        ACTIVE TWIN SIMULATION
                    </span>
                    <span className="live-fps-tag font-mono">120 FPS</span>
                </div>
                <span className="mini-chip-tag font-mono">{project.chip || "Modular"}</span>
            </div>

            {/* Dynamic Mini Circuit Simulation Canvas */}
            <div className="mini-circuit-canvas">
                <svg className="mini-circuit-svg" viewBox={viewBox}>
                    <defs>
                        <pattern id="miniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="8" cy="8" r="0.6" fill="rgba(255,255,255,0.18)" />
                        </pattern>
                    </defs>
                    <rect x={minX - 25} y={minY - 25} width={width} height={height} fill="url(#miniGrid)" />

                    {/* Wires with Live Current Pulsing */}
                    {wires.map((w, idx) => {
                        const pts = w.points || [];
                        if (pts.length < 2) return null;
                        const d = `M ${pts[0].x} ${pts[0].y} Q ${(pts[0].x + pts[1].x) / 2} ${Math.min(pts[0].y, pts[1].y) - 15} ${pts[1].x} ${pts[1].y}`;
                        return (
                            <path
                                key={w.id || idx}
                                d={d}
                                stroke={w.color || "#10b981"}
                                strokeWidth="2.2"
                                fill="none"
                                strokeDasharray="5 3"
                                className="mini-signal-wire"
                            />
                        );
                    })}

                    {/* Components */}
                    {comps.map((c) => {
                        const cx = c.x || 0;
                        const cy = c.y || 0;

                        // 1. Breadboard
                        if (c.type?.startsWith("breadboard")) {
                            const bbW = c.type === "breadboard-full" ? 340 : 220;
                            const bbH = 90;
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <rect width={bbW} height={bbH} rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
                                    <line x1="8" y1="12" x2={bbW - 8} y2="12" stroke="#ef4444" strokeWidth="1.2" />
                                    <line x1="8" y1="20" x2={bbW - 8} y2="20" stroke="#3b82f6" strokeWidth="1.2" />
                                    <line x1="8" y1={bbH - 12} x2={bbW - 8} y2={bbH - 12} stroke="#3b82f6" strokeWidth="1.2" />
                                    <text x={bbW / 2} y={bbH / 2 + 3} fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">BREADBOARD</text>
                                </g>
                            );
                        }

                        // 2. Arduino Uno
                        if (c.type?.includes("arduino")) {
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <rect width="115" height="85" rx="5" fill="#008784" stroke="#004d40" strokeWidth="1.2" />
                                    <rect x="5" y="10" width="18" height="15" rx="2" fill="#cbd5e1" />
                                    <rect x="35" y="35" width="45" height="16" rx="2" fill="#09090b" />
                                    <text x="57" y="46" fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">ATmega328P</text>
                                    <circle cx="95" cy="20" r="3" fill="#10b981" className="mini-led-glow" />
                                    <text x="57" y="72" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">ARDUINO</text>
                                </g>
                            );
                        }

                        // 3. ESP32 DevKit
                        if (c.type?.includes("esp32")) {
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <rect width="80" height="105" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="1.2" />
                                    <rect x="15" y="20" width="50" height="45" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                                    <text x="40" y="46" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">ESP32-S3</text>
                                    <circle cx="20" cy="80" r="2.5" fill="#ef4444" className="mini-led-glow" />
                                    <circle cx="60" cy="80" r="2.5" fill="#3b82f6" className="mini-led-glow" />
                                </g>
                            );
                        }

                        // 4. 5mm LED
                        if (c.type === "led") {
                            const ledColor = c.color || "#ef4444";
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <circle cx="10" cy="10" r="8" fill={ledColor} filter="drop-shadow(0 0 8px currentColor)" />
                                    <circle cx="10" cy="10" r="4" fill="#ffffff" opacity="0.6" />
                                </g>
                            );
                        }

                        // 5. Resistor
                        if (c.type === "resistor") {
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <line x1="0" y1="5" x2="36" y2="5" stroke="#cbd5e1" strokeWidth="1.5" />
                                    <rect x="8" y="1" width="20" height="8" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="0.8" />
                                </g>
                            );
                        }

                        // 6. Micro Servo SG90
                        if (c.type === "servo-sg90") {
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <rect width="45" height="45" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                                    <circle cx="22" cy="22" r="10" fill="#0369a1" />
                                    <rect x="20" y="8" width="4" height="20" rx="2" fill="#ffffff" transform="rotate(45 22 22)" />
                                    <text x="22" y="39" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">SG90</text>
                                </g>
                            );
                        }

                        // 7. Ultrasonic Sensor
                        if (c.type === "sensor-ultrasonic") {
                            return (
                                <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                    <rect width="60" height="32" rx="4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                                    <circle cx="16" cy="16" r="10" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                                    <circle cx="44" cy="16" r="10" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                                    <text x="16" y="18" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">T</text>
                                    <text x="44" y="18" fill="#ffffff" fontSize="5" fontWeight="bold" textAnchor="middle">R</text>
                                </g>
                            );
                        }

                        // Default Generic Component
                        return (
                            <g key={c.id} transform={`translate(${cx}, ${cy})`}>
                                <rect width="28" height="20" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                                <text x="14" y="13" fill="#94a3b8" fontSize="5" textAnchor="middle">{c.name?.slice(0, 4) || "COMP"}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Bottom Meta Bar */}
            <div className="mini-preview-meta">
                <div className="mini-project-ident">
                    <i className={project.icon || "ri-cpu-line"} style={{ color: project.accent || "#ff8a00" }} />
                    <div className="mini-project-names">
                        <h4>{project.name}</h4>
                        <span>{comps.length} Elements • {wires.length} Wires • {project.lastEdited || "Active"}</span>
                    </div>
                </div>

                <div className="mini-preview-action font-mono">
                    <span>Open in Workspace</span>
                    <i className="ri-arrow-right-line" />
                </div>
            </div>
        </motion.div>
    );
}

function Dashboard({ onOpenWorkspace }) {
    const [projects, setProjects] = useState(getInitialProjects);
    const [openModal, setOpenModal] = useState(false);
    const [selectedTemplateForModal, setSelectedTemplateForModal] = useState("esp32");
    const [activeCoreTab, setActiveCoreTab] = useState("esp32");
    const [projectFilter, setProjectFilter] = useState("all");

    // Sync with localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setProjects(parsed);
                }
            }
        } catch (e) {}
    }, []);

    const getNextProjectName = () => {
        let maxNum = 0;
        projects.forEach(p => {
            const match = p.name && p.name.match(/^Project\s*-\s*(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `Project - ${maxNum + 1}`;
    };

    const suggestedName = getNextProjectName();

    const activeProject = projects[0] || {
        id: "proj-1",
        name: "Project - 1",
        chip: "ESP32-S3",
        accent: "#FF8A00",
        icon: "ri-cpu-line",
        components: []
    };

    const handleCreateProject = ({ name, template, color }) => {
        const templateObj = STARTER_TEMPLATES.find(t => t.id === template) || STARTER_TEMPLATES[0];
        const finalName = name?.trim() || suggestedName;
        const now = Date.now();

        let initialComponents = [];
        let initialWires = [];

        if (template === "esp32") {
            initialComponents = [
                { id: `esp32-${now}`, type: "esp32-devkit", name: "ESP32 DevKit V1", x: 160, y: 160 },
                { id: `bb-${now + 1}`, type: "breadboard-half", name: "Breadboard (Half)", x: 480, y: 160 },
                { id: `res-${now + 2}`, type: "resistor", name: "Resistor (220Ω)", resistance: 220, x: 672, y: 272 },
                { id: `led-${now + 3}`, type: "led", name: "5mm LED (Blue)", color: "#3b82f6", x: 736, y: 288 }
            ];
            initialWires = [
                { id: `wire-${now + 4}`, color: "#3b82f6", points: [{ x: 304, y: 320 }, { x: 672, y: 240 }] },
                { id: `wire-${now + 5}`, color: "#0f172a", points: [{ x: 304, y: 368 }, { x: 752, y: 240 }] }
            ];
        } else if (template === "arduino") {
            initialComponents = [
                { id: `ard-${now}`, type: "arduino-uno", name: "Arduino Uno R3", x: 144, y: 160 },
                { id: `bb-${now + 1}`, type: "breadboard-half", name: "Breadboard (Half)", x: 512, y: 160 },
                { id: `res-${now + 2}`, type: "resistor", name: "Resistor (220Ω)", resistance: 220, x: 704, y: 272 },
                { id: `led-${now + 3}`, type: "led", name: "5mm LED (Red)", color: "#ef4444", x: 768, y: 288 }
            ];
            initialWires = [
                { id: `wire-${now + 4}`, color: "#ef4444", points: [{ x: 352, y: 176 }, { x: 704, y: 240 }] },
                { id: `wire-${now + 5}`, color: "#0f172a", points: [{ x: 336, y: 176 }, { x: 784, y: 240 }] }
            ];
        }

        const newProject = {
            id: `proj-${now}`,
            name: finalName,
            template: templateObj.id,
            chip: templateObj.chip,
            accent: color || templateObj.accent,
            icon: templateObj.icon,
            status: "Active",
            lastEdited: "Just now",
            updatedAt: new Date().toISOString(),
            components: initialComponents,
            wires: initialWires
        };

        const updated = [newProject, ...projects];
        setProjects(updated);
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
            localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(newProject));
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {}

        setOpenModal(false);
        if (onOpenWorkspace) onOpenWorkspace();
    };

    const handleOpenProject = (project) => {
        try {
            localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(project));
            sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        } catch (e) {}
        if (onOpenWorkspace) onOpenWorkspace();
    };

    const handleDeleteProject = (e, id) => {
        e.stopPropagation();
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
            if (updated.length > 0) {
                localStorage.setItem(ACTIVE_STORAGE_KEY, JSON.stringify(updated[0]));
            } else {
                localStorage.removeItem(ACTIVE_STORAGE_KEY);
            }
        } catch (e) {}
    };

    const handleTemplateClick = (tmpl) => {
        setSelectedTemplateForModal(tmpl.id);
        setOpenModal(true);
    };

    const currentCore = ARCHITECTURE_CORES.find(c => c.id === activeCoreTab) || ARCHITECTURE_CORES[0];

    const filteredProjects = projects.filter(p => {
        if (projectFilter === "all") return true;
        if (projectFilter === "esp32") return p.chip?.includes("ESP32") || p.template === "esp32";
        if (projectFilter === "arduino") return p.chip?.includes("ATmega") || p.template === "arduino";
        if (projectFilter === "pi") return p.chip?.includes("RP2040") || p.template === "pi";
        return true;
    });

    return (
        <>
            <motion.div 
                className="dashboard advanced-tech-dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* ================= COMPACT HERO WITH REAL RECENT SIMULATION PREVIEW ================= */}
                <motion.section className="hero hero-cockpit-grid compact-hero" variants={itemVariants}>
                    {/* Left: Lead Card */}
                    <div className="hero-content cockpit-lead-card">
                        <div className="tech-corner-decor tl"></div>
                        <div className="tech-corner-decor tr"></div>
                        <div className="tech-corner-decor bl"></div>
                        <div className="tech-corner-decor br"></div>

                        <div className="hero-header-row">
                            <span className="hero-pill tech-pill">
                                <span className="dot pulse"></span>
                                DIGITAL TWIN PLATFORM
                            </span>
                            <span className="system-tag font-mono">SPICE_KERNEL // 120 FPS</span>
                        </div>

                        <h1 className="tech-hero-title">
                            Silicon-Accurate <br />
                            <span className="hero-accent">Hardware Simulation.</span>
                        </h1>

                        <p className="hero-subtext">
                            Simulate microcontrollers, discrete silicon, analog circuits, and sensor telemetry in real time. 
                            Zero physical hardware required with instant cloud synchronization.
                        </p>

                        <div className="hero-buttons">
                            <motion.button 
                                className="btn-primary tech-btn-primary"
                                onClick={() => {
                                    setSelectedTemplateForModal("esp32");
                                    setOpenModal(true);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="ri-add-line"></i>
                                <span>Initialize New Twin</span>
                            </motion.button>

                            <motion.button 
                                className="btn-secondary tech-btn-secondary"
                                onClick={() => handleOpenProject(activeProject)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="ri-terminal-box-line"></i>
                                <span>Open Full Workspace</span>
                                <i className="ri-arrow-right-line"></i>
                            </motion.button>
                        </div>

                        {/* Telemetry Gauge Strip */}
                        <div className="cockpit-gauge-row">
                            <div className="gauge-item">
                                <span className="gauge-k">CORE CLOCK</span>
                                <span className="gauge-v font-mono">240.0 MHz</span>
                            </div>
                            <div className="gauge-sep">/</div>
                            <div className="gauge-item">
                                <span className="gauge-k">SOLVER</span>
                                <span className="gauge-v highlight font-mono">&lt; 0.04 ms</span>
                            </div>
                            <div className="gauge-sep">/</div>
                            <div className="gauge-item">
                                <span className="gauge-k">RAILS</span>
                                <span className="gauge-v font-mono">3.3V / 5.0V</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: User's Actual Recent Project Live Simulation Preview */}
                    <ProjectCircuitMiniPreview 
                        project={activeProject} 
                        onOpen={handleOpenProject} 
                    />
                </motion.section>

                {/* ================= RECENT REAL PROJECTS (DIRECTLY BELOW HERO) ================= */}
                <motion.section className="section recent-projects-section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <span className="tech-section-kicker">// ACTIVE SILICON VAULT</span>
                            <h2>Active Digital Twins</h2>
                            <span className="section-meta">Your live simulated circuits and digital twins</span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="vault-filter-tabs">
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "all" ? "active" : ""}`}
                                onClick={() => setProjectFilter("all")}
                            >
                                All ({projects.length})
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "esp32" ? "active" : ""}`}
                                onClick={() => setProjectFilter("esp32")}
                            >
                                ESP32
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "arduino" ? "active" : ""}`}
                                onClick={() => setProjectFilter("arduino")}
                            >
                                Arduino
                            </button>
                            <button 
                                type="button" 
                                className={`filter-tab ${projectFilter === "pi" ? "active" : ""}`}
                                onClick={() => setProjectFilter("pi")}
                            >
                                RP2040
                            </button>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {filteredProjects.map((p) => (
                            <motion.div
                                key={p.id}
                                className="project-card tech-project-card"
                                whileHover={{ y: -4, borderColor: p.accent || "#FF8A00" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenProject(p)}
                            >
                                <div className="tech-corner-decor tl"></div>
                                <div className="tech-corner-decor tr"></div>
                                <div className="tech-corner-decor bl"></div>
                                <div className="tech-corner-decor br"></div>

                                <div className="card-top">
                                    <div className="card-icon" style={{ color: p.accent || "#FF8A00" }}>
                                        <i className={p.icon || "ri-cpu-line"}></i>
                                    </div>
                                    <div className="card-badges">
                                        <span className="cloud-sync-badge" title="Synced with TwinLab Cloud Vault">
                                            <i className="ri-cloud-line"></i> Cloud
                                        </span>
                                        <span className={`status-tag ${p.status?.toLowerCase() || "active"}`}>
                                            {p.status || "Active"}
                                        </span>
                                        {projects.length > 1 && (
                                            <button 
                                                className="project-delete-btn"
                                                onClick={(e) => handleDeleteProject(e, p.id)}
                                                title="Delete Project"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="card-content">
                                    <h3>{p.name}</h3>
                                    <div className="card-sub-info">
                                        <span className="chip-badge font-mono">{p.chip || "Modular"}</span>
                                        <span className="comp-count-badge">
                                            <i className="ri-layout-grid-line"></i>
                                            {p.components?.length || 0} {p.components?.length === 1 ? "component" : "components"}
                                        </span>
                                    </div>
                                    <p className="card-meta">Last synchronized {p.lastEdited || "Recently"}</p>
                                </div>

                                <div className="card-action">
                                    <span>Launch Workspace</span>
                                    <i className="ri-arrow-right-up-line"></i>
                                </div>
                            </motion.div>
                        ))}

                        {/* Minimalist Create Project Slot */}
                        <motion.div 
                            className="new-card-slot tech-new-slot"
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedTemplateForModal("esp32");
                                setOpenModal(true);
                            }}
                        >
                            <div className="tech-corner-decor tl"></div>
                            <div className="tech-corner-decor tr"></div>
                            <div className="tech-corner-decor bl"></div>
                            <div className="tech-corner-decor br"></div>

                            <div className="new-slot-icon">
                                <i className="ri-add-line"></i>
                            </div>
                            <span className="new-slot-title">Initialize Digital Twin</span>
                            <span className="new-slot-sub font-mono">{suggestedName}</span>
                        </motion.div>
                    </div>
                </motion.section>

                {/* ================= ARCHITECTURE BLUEPRINT EXPLORER ================= */}
                <motion.section className="section tech-arch-section" variants={itemVariants}>
                    <div className="section-head tech-section-head">
                        <div>
                            <span className="tech-section-kicker">// SILICON BLUEPRINT EXPLORER</span>
                            <h2>Hardware Architecture Cores</h2>
                            <span className="section-meta">Inspect instruction sets, bus pinouts, and physical specifications</span>
                        </div>
                        <div className="arch-tabs">
                            {ARCHITECTURE_CORES.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    className={`arch-tab-btn ${activeCoreTab === c.id ? "active" : ""}`}
                                    onClick={() => setActiveCoreTab(c.id)}
                                >
                                    <span className="tab-dot" style={{ background: c.accent }}></span>
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="arch-blueprint-card">
                        <div className="arch-card-left">
                            <div className="arch-header">
                                <div className="arch-title-wrap">
                                    <span className="arch-family-tag font-mono">{currentCore.family}</span>
                                    <h3>{currentCore.name}</h3>
                                </div>
                                <span className="arch-status-pill font-mono" style={{ borderColor: `${currentCore.accent}40`, color: currentCore.accent }}>
                                    <span className="pulse-dot" style={{ background: currentCore.accent }}></span>
                                    {currentCore.status}
                                </span>
                            </div>

                            <p className="arch-desc">{currentCore.desc}</p>

                            <div className="arch-specs-grid">
                                <div className="arch-spec-item">
                                    <span className="spec-label">CORE CLOCK</span>
                                    <span className="spec-value">{currentCore.clock}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">CPU ARCHITECTURE</span>
                                    <span className="spec-value">{currentCore.cores}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">ON-CHIP SRAM</span>
                                    <span className="spec-value">{currentCore.sram}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">FLASH STORAGE</span>
                                    <span className="spec-value">{currentCore.flash}</span>
                                </div>
                                <div className="arch-spec-item">
                                    <span className="spec-label">GPIO ALLOCATION</span>
                                    <span className="spec-value">{currentCore.gpio}</span>
                                </div>
                            </div>

                            <div className="arch-cta-wrap">
                                <motion.button
                                    className="btn-primary arch-deploy-btn"
                                    style={{ background: currentCore.accent }}
                                    onClick={() => {
                                        setSelectedTemplateForModal(currentCore.id === "logic" ? "blank" : currentCore.id);
                                        setOpenModal(true);
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <i className="ri-cpu-line"></i>
                                    <span>Deploy {currentCore.name} Twin</span>
                                    <i className="ri-arrow-right-line"></i>
                                </motion.button>
                            </div>
                        </div>

                        <div className="arch-card-right">
                            <div className="pinout-header">
                                <span className="pinout-title font-mono">// LIVE PINOUT BUS MATRIX</span>
                                <span className="pinout-status">POLLED REAL-TIME</span>
                            </div>
                            <div className="pinout-list">
                                {currentCore.pins.map((pin, pidx) => (
                                    <div key={pidx} className="pinout-row">
                                        <div className="pin-ident">
                                            <span className="pin-dot" style={{ background: currentCore.accent }}></span>
                                            <span className="pin-name font-mono">{pin.pin}</span>
                                        </div>
                                        <span className="pin-type font-mono">{pin.type}</span>
                                        <span className="pin-state font-mono">{pin.state}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ================= PLATFORM CAPABILITY MATRIX ================= */}
                <motion.section className="capability-strip" variants={itemVariants}>
                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-speed-line"></i>
                            </div>
                            <span className="cap-code font-mono">01 // KERNEL</span>
                        </div>
                        <h4>0.05ms SPICE Kernel</h4>
                        <p>Real-time mixed-signal circuit solver with sub-millisecond matrix convergence.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-cpu-line"></i>
                            </div>
                            <span className="cap-code font-mono">02 // ARCH</span>
                        </div>
                        <h4>Multi-Core Emulation</h4>
                        <p>Instruction execution for ESP32-S3, ATmega328P AVR, and RP2040.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-sound-module-line"></i>
                            </div>
                            <span className="cap-code font-mono">03 // SILICON</span>
                        </div>
                        <h4>50+ Verified Components</h4>
                        <p>Physical models for HC-SR04 Ultrasonic, PIR Radar, SG90 Servos, and 74HC Logic.</p>
                    </div>

                    <div className="cap-card">
                        <div className="cap-top">
                            <div className="cap-icon-box">
                                <i className="ri-cloud-line"></i>
                            </div>
                            <span className="cap-code font-mono">04 // VAULT</span>
                        </div>
                        <h4>Digital Twin Cloud Vault</h4>
                        <p>Encrypted state retention, snapshot rollbacks, and team branch sync.</p>
                    </div>
                </motion.section>

                {/* ================= STARTER TEMPLATES ================= */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <span className="tech-section-kicker">// BOOTSTRAP PRESETS</span>
                            <h2>Starter Silicon Blueprints</h2>
                            <span className="section-meta">Select a hardware base to bootstrap your digital twin</span>
                        </div>
                    </div>

                    <div className="templates-grid">
                        {STARTER_TEMPLATES.map((t) => (
                            <motion.div
                                key={t.id}
                                className="template-card tech-template-card"
                                style={{ "--card-accent": t.accent }}
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTemplateClick(t)}
                            >
                                <div className="tech-corner-decor tl"></div>
                                <div className="tech-corner-decor tr"></div>
                                <div className="tech-corner-decor bl"></div>
                                <div className="tech-corner-decor br"></div>

                                <div className="template-card-glow"></div>
                                <div className="template-top-row">
                                    <div className="template-icon" style={{ color: t.accent }}>
                                        <i className={t.icon}></i>
                                    </div>
                                    <span className="template-arch-badge font-mono">{t.badge}</span>
                                </div>

                                <div className="template-content">
                                    <div className="template-title-wrap">
                                        <h3>{t.name}</h3>
                                        <span className="template-chip-pill font-mono" style={{ borderColor: `${t.accent}40`, color: t.accent }}>
                                            {t.chip}
                                        </span>
                                    </div>
                                    <p>{t.desc}</p>
                                </div>

                                <div className="template-specs">
                                    {t.specs.map(spec => (
                                        <span key={spec} className="spec-tag">
                                            <i className="ri-check-line"></i>
                                            {spec}
                                        </span>
                                    ))}
                                </div>

                                <div className="template-action">
                                    <span>Initialize {t.name}</span>
                                    <div className="action-circle">
                                        <i className="ri-arrow-right-line"></i>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>
            </motion.div>

            <NewProjectModal
                open={openModal}
                suggestedName={suggestedName}
                initialTemplate={selectedTemplateForModal}
                onClose={() => setOpenModal(false)}
                onCreateProject={handleCreateProject}
            />
        </>
    );
}

export default Dashboard;
