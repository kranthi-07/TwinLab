import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import "./NewProjectModal.css";

const HARDWARE_TEMPLATES = [
    {
        id: "esp32",
        name: "ESP32-S3",
        chip: "Dual-Core 240MHz",
        desc: "Wi-Fi & Bluetooth",
        icon: "ri-cpu-line"
    },
    {
        id: "arduino",
        name: "Arduino Uno",
        chip: "ATmega328P 16MHz",
        desc: "5V Logic Standard",
        icon: "ri-router-line"
    },
    {
        id: "pi",
        name: "Raspberry Pi",
        chip: "RP2040 Dual-Core",
        desc: "Programmable I/O",
        icon: "ri-computer-line"
    },
    {
        id: "blank",
        name: "Blank Canvas",
        chip: "Modular Circuit",
        desc: "Custom Schematics",
        icon: "ri-layout-grid-line"
    }
];

const ACCENT_COLORS = [
    { name: "Solar Orange", color: "#FF8A00" },
    { name: "Electric Blue", color: "#3B82F6" },
    { name: "Emerald Green", color: "#10B981" },
    { name: "Neon Purple", color: "#A855F7" },
    { name: "Ruby Red", color: "#EF4444" }
];

function NewProjectModal({ 
    open, 
    onClose, 
    onCreateProject, 
    suggestedName = "Project - 1", 
    initialTemplate = "esp32" 
}) {
    const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
    const [selectedColor, setSelectedColor] = useState("#FF8A00");
    const [projectName, setProjectName] = useState("");

    useEffect(() => {
        if (initialTemplate) {
            setSelectedTemplate(initialTemplate);
            const tmplObj = HARDWARE_TEMPLATES.find(t => t.id === initialTemplate);
            if (initialTemplate === "arduino") setSelectedColor("#3B82F6");
            else if (initialTemplate === "pi") setSelectedColor("#A855F7");
            else if (initialTemplate === "blank") setSelectedColor("#10B981");
            else setSelectedColor("#FF8A00");
        }
    }, [initialTemplate]);

    // Reset or set initial values when modal opens
    useEffect(() => {
        if (open) {
            setProjectName("");
        }
    }, [open]);

    const handleCreate = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (onCreateProject) {
            onCreateProject({
                name: projectName.trim() || suggestedName,
                template: selectedTemplate,
                color: selectedColor
            });
        }
    };

    if (!open) return null;

    const activeColorObj = ACCENT_COLORS.find(c => c.color === selectedColor) || ACCENT_COLORS[0];

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="new-project-modal"
                    style={{
                        "--accent": selectedColor,
                        "--accent-subtle": `${selectedColor}18`,
                        "--accent-border": `${selectedColor}45`,
                        "--accent-glow": `${selectedColor}35`
                    }}
                    initial={{ opacity: 0, scale: 0.93, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.93, y: 20 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Ambient Glow matching selected accent */}
                    <div className="modal-ambient-glow"></div>

                    {/* Header */}
                    <div className="modal-top">
                        <div className="modal-title-group">
                            <div className="modal-badge-icon">
                                <i className="ri-folder-add-line"></i>
                            </div>
                            <div>
                                <h2>Create Project</h2>
                                <p>Set up your hardware base and workspace accent identity</p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            className="modal-close-btn"
                            onClick={onClose}
                            title="Close (Esc)"
                        >
                            <i className="ri-close-line"></i>
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body">
                        {/* 1. Project Name */}
                        <div className="modal-field">
                            <label className="field-label">
                                <span>Project Name</span>
                                <span className="field-hint">Optional • Defaults to auto-sequence</span>
                            </label>
                            <div className="field-input-wrap">
                                <i className="ri-edit-2-line input-icon"></i>
                                <input
                                    type="text"
                                    className="modal-project-name-input"
                                    placeholder={`e.g. ${suggestedName}`}
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleCreate(e);
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* 2. Hardware Base Platform */}
                        <div className="modal-field">
                            <label className="field-label">
                                <span>Hardware Base</span>
                                <span className="field-hint">Select your target microcontroller</span>
                            </label>
                            <div className="hardware-cards-grid">
                                {HARDWARE_TEMPLATES.map((tmpl) => {
                                    const isSelected = selectedTemplate === tmpl.id;
                                    return (
                                        <div
                                            key={tmpl.id}
                                            className={`hw-card ${isSelected ? "selected" : ""}`}
                                            onClick={() => setSelectedTemplate(tmpl.id)}
                                        >
                                            <div className="hw-card-top">
                                                <div className="hw-icon-box">
                                                    <i className={tmpl.icon}></i>
                                                </div>
                                                <span className="hw-chip-tag">{tmpl.chip}</span>
                                            </div>

                                            <div className="hw-card-info">
                                                <h4>{tmpl.name}</h4>
                                                <p>{tmpl.desc}</p>
                                            </div>

                                            {isSelected && (
                                                <div className="hw-selected-check">
                                                    <i className="ri-check-line"></i>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 3. Workspace Accent Color */}
                        <div className="modal-field">
                            <div className="accent-label-row">
                                <label className="field-label">
                                    <span>Workspace Accent Color</span>
                                    <span className="field-hint">Minimal, premium accents across workspace tools & indicators</span>
                                </label>
                                <span className="active-color-name" style={{ color: selectedColor }}>
                                    {activeColorObj.name}
                                </span>
                            </div>

                            <div className="color-swatches-row">
                                {ACCENT_COLORS.map((c) => {
                                    const isActive = selectedColor === c.color;
                                    return (
                                        <button
                                            key={c.color}
                                            type="button"
                                            className={`swatch-btn ${isActive ? "active" : ""}`}
                                            onClick={() => setSelectedColor(c.color)}
                                            title={c.name}
                                        >
                                            <span 
                                                className="swatch-circle"
                                                style={{ background: c.color }}
                                            ></span>
                                            {isActive && <span className="swatch-ring" style={{ borderColor: c.color }}></span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn-modal-cancel"
                            onClick={onClose}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn-modal-create"
                            style={{ background: selectedColor }}
                            onClick={handleCreate}
                        >
                            <i className="ri-add-line"></i>
                            <span>Create {projectName.trim() || suggestedName}</span>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default NewProjectModal;
