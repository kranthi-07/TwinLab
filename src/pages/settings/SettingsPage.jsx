import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import "./SettingsPage.css";

const ACCENT_OPTIONS = [
    { name: "Solar Orange", hex: "#FF8A00" },
    { name: "Electric Blue", hex: "#3B82F6" },
    { name: "Emerald Green", hex: "#10B981" },
    { name: "Royal Purple", hex: "#A855F7" },
    { name: "Ruby Crimson", hex: "#EF4444" }
];

function SettingsPage() {
    const { theme, setTheme, isDark, toggleTheme } = useTheme();

    const [accent, setAccent] = useState(() => {
        return localStorage.getItem("twinlab_pref_accent") || "#FF8A00";
    });

    const [gridSnap, setGridSnap] = useState(() => {
        return localStorage.getItem("twinlab_pref_gridsnap") || "16";
    });

    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("twinlab_pref_sound") !== "false";
    });

    const [autoSaveInterval, setAutoSaveInterval] = useState(() => {
        return localStorage.getItem("twinlab_pref_autosave") || "300";
    });

    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);

    const handleAccentChange = (hex) => {
        setAccent(hex);
        localStorage.setItem("twinlab_pref_accent", hex);
        document.documentElement.style.setProperty("--project-accent", hex);
        showNotice();
    };

    const handleGridChange = (val) => {
        setGridSnap(val);
        localStorage.setItem("twinlab_pref_gridsnap", val);
        showNotice();
    };

    const handleSoundToggle = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem("twinlab_pref_sound", String(next));
        showNotice();
    };

    const handleAutoSaveChange = (val) => {
        setAutoSaveInterval(val);
        localStorage.setItem("twinlab_pref_autosave", val);
        showNotice();
    };

    const showNotice = () => {
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2000);
    };

    const handleClearStorage = () => {
        try {
            localStorage.removeItem("twinlab_workspace_draft");
            localStorage.removeItem("twinlab_projects");
            setShowResetConfirm(false);
            showNotice();
            window.location.reload();
        } catch (e) {
            console.error("Storage reset error:", e);
        }
    };

    return (
        <div className="settings-page-container">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-badge">
                    <i className="ri-settings-3-line"></i>
                    <span>System Preferences</span>
                </div>
                <h1>TwinLab X Studio Settings</h1>
                <p>Customize your digital twin environment, visual presentation, simulation tolerances, and storage preferences.</p>
                {savedNotice && (
                    <div className="settings-toast-pill">
                        <i className="ri-check-line"></i>
                        <span>Preferences saved</span>
                    </div>
                )}
            </div>

            <div className="settings-sections-list">
                {/* 1. THEME & APPEARANCE */}
                <div className="settings-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-palette-line icon-accent"></i>
                            <div>
                                <h3>Platform Theme & Styling</h3>
                                <p>Select your interface theme, glassmorphic effects, or high-contrast dark modes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="theme-options-grid">
                        {[
                            { id: "dark", label: "Obsidian Dark", desc: "Matte black with studio contrast", icon: "ri-moon-line" },
                            { id: "glassmorphism", label: "Frost Glass", desc: "Frosted blur translucency", icon: "ri-contrast-drop-2-line" },
                            { id: "cyberpunk", label: "Cyber Neon", desc: "Vivid high-energy glowing accents", icon: "ri-flashlight-line" },
                            { id: "light", label: "Minimal Light", desc: "Daylight clean white canvas", icon: "ri-sun-line" }
                        ].map((t) => (
                            <div
                                key={t.id}
                                className={`theme-choice-box ${theme === t.id ? "selected" : ""}`}
                                onClick={() => {
                                    setTheme(t.id);
                                    showNotice();
                                }}
                            >
                                <div className="theme-choice-icon">
                                    <i className={t.icon}></i>
                                </div>
                                <div className="theme-choice-text">
                                    <h4>{t.label}</h4>
                                    <span>{t.desc}</span>
                                </div>
                                {theme === t.id && <i className="ri-check-line check-badge"></i>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. ACCENT COLOR */}
                <div className="settings-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-paint-brush-line icon-accent"></i>
                            <div>
                                <h3>Studio Accent Color</h3>
                                <p>Dynamic accent tint applied to interactive controls, borders, and system badges.</p>
                            </div>
                        </div>
                    </div>

                    <div className="accent-swatches-row">
                        {ACCENT_OPTIONS.map((opt) => (
                            <div
                                key={opt.hex}
                                className={`accent-swatch-item ${accent === opt.hex ? "active" : ""}`}
                                onClick={() => handleAccentChange(opt.hex)}
                            >
                                <span className="swatch-circle" style={{ backgroundColor: opt.hex }}></span>
                                <span className="swatch-label">{opt.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. SIMULATION & INTERACTION */}
                <div className="settings-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-cpu-line icon-accent"></i>
                            <div>
                                <h3>Workspace Grid & Physics Engine</h3>
                                <p>Configure snapping resolution and audio feedback for buzzer transducers.</p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-controls-stack">
                        {/* Grid Snap */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Breadboard Dot-Grid Snapping</h4>
                                <span>Component magnetic pin alignment pitch</span>
                            </div>
                            <div className="segment-pills">
                                <button className={gridSnap === "16" ? "active" : ""} onClick={() => handleGridChange("16")}>16px (Standard)</button>
                                <button className={gridSnap === "8" ? "active" : ""} onClick={() => handleGridChange("8")}>8px (Fine)</button>
                                <button className={gridSnap === "0" ? "active" : ""} onClick={() => handleGridChange("0")}>Freeform</button>
                            </div>
                        </div>

                        {/* Sound Effects */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Audio Synthesis (Piezo Buzzer & Tone)</h4>
                                <span>Emit Web Audio synthesized chime tones during buzzer simulation</span>
                            </div>
                            <button className={`toggle-switch ${soundEnabled ? "on" : "off"}`} onClick={handleSoundToggle}>
                                <span className="toggle-thumb"></span>
                            </button>
                        </div>

                        {/* Auto-Save Interval */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Local Storage Auto-Save</h4>
                                <span>Frequency of background project state backup</span>
                            </div>
                            <div className="segment-pills">
                                <button className={autoSaveInterval === "60" ? "active" : ""} onClick={() => handleAutoSaveChange("60")}>1 min</button>
                                <button className={autoSaveInterval === "300" ? "active" : ""} onClick={() => handleAutoSaveChange("300")}>5 min</button>
                                <button className={autoSaveInterval === "manual" ? "active" : ""} onClick={() => handleAutoSaveChange("manual")}>Manual Only</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. DANGER ZONE / CACHE MANAGEMENT */}
                <div className="settings-card danger-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-delete-bin-line icon-danger"></i>
                            <div>
                                <h3>Data & Local Storage Cache</h3>
                                <p>Clear cached drafts and reset projects to default factory state.</p>
                            </div>
                        </div>
                        <button className="danger-btn" onClick={() => setShowResetConfirm(true)}>
                            Reset All Data
                        </button>
                    </div>

                    {showResetConfirm && (
                        <div className="reset-confirm-box">
                            <p>Are you sure you want to reset all projects and clear localStorage? This cannot be undone.</p>
                            <div className="reset-actions">
                                <button className="confirm-btn" onClick={handleClearStorage}>Yes, Reset Storage</button>
                                <button className="cancel-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;
