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

    // Default seed project: Project - 1
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
        components: [],
        wires: []
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
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
};

function Dashboard({ onOpenWorkspace }) {
    const [projects, setProjects] = useState(getInitialProjects);
    const [openModal, setOpenModal] = useState(false);
    const [selectedTemplateForModal, setSelectedTemplateForModal] = useState("esp32");

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

    // Calculate next project number: Project - 1, Project - 2, Project - 3...
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

    // Active project for hero card preview
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
            const espId = `esp32-${now}`;
            const bbId = `breadboard-${now + 1}`;
            const resId = `res-${now + 2}`;
            const ledId = `led-${now + 3}`;

            initialComponents = [
                {
                    id: espId,
                    type: "esp32-devkit",
                    name: "ESP32 DevKit V1",
                    x: 160,
                    y: 160,
                    rotation: 0
                },
                {
                    id: bbId,
                    type: "breadboard-half",
                    name: "Breadboard (Half-Size)",
                    x: 480,
                    y: 160,
                    rotation: 0
                },
                {
                    id: resId,
                    type: "resistor",
                    name: "Resistor (220Ω)",
                    resistance: 220,
                    x: 672,
                    y: 272,
                    rotation: 0
                },
                {
                    id: ledId,
                    type: "led",
                    name: "5mm LED (Blue)",
                    color: "#3b82f6",
                    x: 736,
                    y: 288,
                    rotation: 0
                }
            ];

            initialWires = [
                {
                    id: `wire-${now + 4}`,
                    color: "#3b82f6",
                    points: [{ x: 304, y: 320 }, { x: 672, y: 240 }], // D2 to Resistor
                    routingMode: "curved"
                },
                {
                    id: `wire-${now + 5}`,
                    color: "#0f172a",
                    points: [{ x: 304, y: 368 }, { x: 752, y: 240 }], // GND to LED Cathode
                    routingMode: "curved"
                }
            ];
        } else if (template === "arduino") {
            const ardId = `arduino-${now}`;
            const bbId = `breadboard-${now + 1}`;
            const ledId = `led-${now + 2}`;
            const resId = `res-${now + 3}`;

            initialComponents = [
                {
                    id: ardId,
                    type: "arduino-uno",
                    name: "Arduino Uno R3",
                    x: 144,
                    y: 160,
                    rotation: 0
                },
                {
                    id: bbId,
                    type: "breadboard-half",
                    name: "Breadboard (Half-Size)",
                    x: 512,
                    y: 160,
                    rotation: 0
                },
                {
                    id: resId,
                    type: "resistor",
                    name: "Resistor (220Ω)",
                    resistance: 220,
                    x: 704,
                    y: 272,
                    rotation: 0
                },
                {
                    id: ledId,
                    type: "led",
                    name: "5mm LED (Red)",
                    color: "#ef4444",
                    x: 768,
                    y: 288,
                    rotation: 0
                }
            ];

            initialWires = [
                {
                    id: `wire-${now + 4}`,
                    color: "#ef4444",
                    points: [{ x: 352, y: 176 }, { x: 704, y: 240 }], // Arduino Pin 13 to Col 10 Row b
                    routingMode: "curved"
                },
                {
                    id: `wire-${now + 5}`,
                    color: "#0f172a",
                    points: [{ x: 336, y: 176 }, { x: 784, y: 240 }], // Arduino GND to Col 15 Row b
                    routingMode: "curved"
                }
            ];
        } else if (template === "pi") {
            initialComponents = [
                {
                    id: `breadboard-${now}`,
                    type: "breadboard-full",
                    name: "Breadboard (Full-Size)",
                    x: 180,
                    y: 200,
                    rotation: 0
                }
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

    return (
        <>
            <motion.div 
                className="dashboard"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* ================= HERO ================= */}
                <motion.section className="hero" variants={itemVariants}>
                    <div className="hero-content">
                        <span className="hero-pill">
                            <span className="dot"></span>
                            Digital Twin Platform
                        </span>

                        <h1>
                            Build your next <br />
                            <span className="hero-accent">hardware simulation.</span>
                        </h1>

                        <p className="hero-subtext">
                            Create circuits, mount breadboards, wire components, and simulate firmware in real-time with zero physical hardware required.
                        </p>

                        <div className="hero-buttons">
                            <motion.button 
                                className="btn-primary"
                                onClick={() => {
                                    setSelectedTemplateForModal("esp32");
                                    setOpenModal(true);
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <i className="ri-add-line"></i>
                                <span>New Project</span>
                            </motion.button>

                            <motion.button 
                                className="btn-secondary"
                                onClick={() => handleOpenProject(activeProject)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>Open Workspace</span>
                                <i className="ri-arrow-right-line"></i>
                            </motion.button>
                        </div>
                    </div>

                    {/* Dynamic Real Active Twin Preview Card */}
                    <motion.div 
                        className="hero-preview-card"
                        whileHover={{ y: -3 }}
                        onClick={() => handleOpenProject(activeProject)}
                    >
                        <div className="preview-top">
                            <span className="preview-badge">Active Twin</span>
                            <div className="preview-pulse"></div>
                        </div>

                        <div className="preview-body">
                            <div className="preview-icon" style={{ color: activeProject.accent || "#FF8A00" }}>
                                <i className={activeProject.icon || "ri-cpu-line"}></i>
                            </div>
                            <h3>{activeProject.name}</h3>
                            <p>{activeProject.chip || "ESP32-S3"} • {activeProject.components?.length || 0} Components • Real-time ready</p>
                        </div>

                        <div className="preview-action">
                            <span>Resume Simulation</span>
                            <i className="ri-arrow-right-line"></i>
                        </div>
                    </motion.div>
                </motion.section>

                {/* ================= RECENT REAL PROJECTS ================= */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <h2>Recent Projects</h2>
                            <span className="section-meta">Your active simulated circuits and digital twins</span>
                        </div>
                    </div>

                    <div className="projects-grid">
                        {projects.map((p) => (
                            <motion.div
                                key={p.id}
                                className="project-card"
                                whileHover={{ y: -4, borderColor: p.accent || "#FF8A00" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleOpenProject(p)}
                            >
                                <div className="card-top">
                                    <div className="card-icon" style={{ color: p.accent || "#FF8A00" }}>
                                        <i className={p.icon || "ri-cpu-line"}></i>
                                    </div>
                                    <div className="card-badges">
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
                                        <span className="chip-badge">{p.chip || "Modular"}</span>
                                        <span className="comp-count-badge">
                                            {p.components?.length || 0} {p.components?.length === 1 ? "component" : "components"}
                                        </span>
                                    </div>
                                    <p className="card-meta">Edited {p.lastEdited || "Recently"}</p>
                                </div>

                                <div className="card-action">
                                    <span>Launch Workspace</span>
                                    <i className="ri-arrow-right-up-line"></i>
                                </div>
                            </motion.div>
                        ))}

                        {/* Minimalist Create Project Slot */}
                        <motion.div 
                            className="new-card-slot"
                            whileHover={{ y: -4, borderColor: "#FF8A00" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                setSelectedTemplateForModal("esp32");
                                setOpenModal(true);
                            }}
                        >
                            <div className="new-slot-icon">
                                <i className="ri-add-line"></i>
                            </div>
                            <span className="new-slot-title">Create Project</span>
                            <span className="new-slot-sub">{suggestedName}</span>
                        </motion.div>
                    </div>
                </motion.section>

                {/* ================= PREMIUM STARTER TEMPLATES ================= */}
                <motion.section className="section" variants={itemVariants}>
                    <div className="section-head">
                        <div>
                            <h2>Starter Templates</h2>
                            <span className="section-meta">Select a hardware base to bootstrap your digital twin</span>
                        </div>
                    </div>

                    <div className="templates-grid">
                        {STARTER_TEMPLATES.map((t) => (
                            <motion.div
                                key={t.id}
                                className="template-card"
                                style={{ "--card-accent": t.accent }}
                                whileHover={{ y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleTemplateClick(t)}
                            >
                                <div className="template-card-glow"></div>
                                <div className="template-preview-banner">
                                    {t.id === "esp32" && (
                                        <svg viewBox="0 0 160 70" className="template-card-art">
                                            <rect x="15" y="10" width="45" height="50" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1" />
                                            <rect x="23" y="20" width="29" height="26" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                                            <text x="37" y="36" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">ESP32</text>
                                            <rect x="75" y="14" width="70" height="42" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                            <line x1="78" y1="18" x2="142" y2="18" stroke="#ef4444" strokeWidth="0.8" />
                                            <circle cx="110" cy="35" r="5" fill="#3b82f6" />
                                            <path d="M 60 30 Q 75 25 105 35" fill="none" stroke="#3b82f6" strokeWidth="1.2" />
                                        </svg>
                                    )}
                                    {t.id === "arduino" && (
                                        <svg viewBox="0 0 160 70" className="template-card-art">
                                            <rect x="10" y="12" width="55" height="46" rx="4" fill="#008784" stroke="#004d40" strokeWidth="1" />
                                            <rect x="8" y="18" width="8" height="12" rx="1" fill="#cbd5e1" />
                                            <rect x="25" y="32" width="25" height="10" rx="1" fill="#09090b" />
                                            <rect x="75" y="12" width="75" height="46" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                            <rect x="90" y="30" width="18" height="5" rx="1" fill="#d97706" />
                                            <circle cx="120" cy="33" r="5" fill="#ef4444" />
                                            <path d="M 50 16 Q 70 8 90 30" fill="none" stroke="#ef4444" strokeWidth="1.2" />
                                            <path d="M 45 16 Q 70 20 120 40" fill="none" stroke="#09090b" strokeWidth="1.2" />
                                        </svg>
                                    )}
                                    {t.id === "pi" && (
                                        <svg viewBox="0 0 160 70" className="template-card-art">
                                            <rect x="15" y="15" width="40" height="40" rx="3" fill="#15803d" stroke="#166534" strokeWidth="1" />
                                            <rect x="25" y="25" width="20" height="20" rx="2" fill="#09090b" />
                                            <text x="35" y="37" fill="#86efac" fontSize="5" fontWeight="bold" textAnchor="middle">RP2040</text>
                                            <rect x="65" y="10" width="85" height="50" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                                            <line x1="70" y1="16" x2="145" y2="16" stroke="#ef4444" strokeWidth="1" />
                                            <line x1="70" y1="54" x2="145" y2="54" stroke="#3b82f6" strokeWidth="1" />
                                        </svg>
                                    )}
                                    {t.id === "blank" && (
                                        <svg viewBox="0 0 160 70" className="template-card-art">
                                            <pattern id="dashGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                                                <circle cx="5" cy="5" r="0.8" fill="#475569" />
                                            </pattern>
                                            <rect x="10" y="10" width="140" height="50" rx="4" fill="url(#dashGrid)" stroke="rgba(255,255,255,0.08)" />
                                            <circle cx="50" cy="35" r="4" fill="#10b981" />
                                            <circle cx="110" cy="35" r="4" fill="#10b981" />
                                            <path d="M 50 35 Q 80 15 110 35" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 2" />
                                        </svg>
                                    )}
                                </div>
                                <div className="template-top-row">
                                    <div className="template-icon" style={{ color: t.accent }}>
                                        <i className={t.icon}></i>
                                    </div>
                                    <span className="template-arch-badge">{t.badge}</span>
                                </div>

                                <div className="template-content">
                                    <div className="template-title-wrap">
                                        <h3>{t.name}</h3>
                                        <span className="template-chip-pill" style={{ borderColor: `${t.accent}40`, color: t.accent }}>
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
                                    <span>Create {t.name} Project</span>
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
