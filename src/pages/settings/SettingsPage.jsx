import { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { soundManager } from "../../utils/audioManager";
import "./SettingsPage.css";

const THEME_CARDS = [
    // Dark Themes
    { id: "dark", label: "Obsidian Dark", desc: "Matte black with high-contrast amber accents", type: "Dark", swatch: ["#0f172a", "#1e293b", "#ff8a00"] },
    { id: "cyberpunk", label: "Cyber Neon 2077", desc: "Vivid high-energy glowing cyan and orange", type: "Dark", swatch: ["#060814", "#00f0ff", "#ff0055"] },
    { id: "glassmorphism", label: "Frost Glass", desc: "Frosted blur translucency with deep navy", type: "Dark", swatch: ["#0a0f1d", "#3b82f6", "#60a5fa"] },
    { id: "monokai", label: "Monokai Pro", desc: "Classic code editor contrast with warm yellow", type: "Dark", swatch: ["#2d2a2e", "#ffd866", "#a9dc76"] },
    { id: "dracula", label: "Dracula Midnight", desc: "Gothic purple with vibrant magenta highlights", type: "Dark", swatch: ["#282a36", "#bd93f9", "#ff79c6"] },
    { id: "nord", label: "Nordic Arctic", desc: "Cool slate and frosty Scandinavian blue", type: "Dark", swatch: ["#2e3440", "#88c0d0", "#81a1c1"] },

    // Light Themes
    { id: "light", label: "Clean Daylight", desc: "Pure high-clarity daylight white canvas", type: "Light", swatch: ["#ffffff", "#f1f5f9", "#ff8a00"] },
    { id: "paper", label: "Laboratory Clean", desc: "Crisp engineering graph paper with navy lines", type: "Light", swatch: ["#fcfcfd", "#e2e8f0", "#2563eb"] },
    { id: "solar-light", label: "Amber Blueprint", desc: "Warm amber engineering tracing parchment", type: "Light", swatch: ["#fffbeb", "#fde68a", "#d97706"] },
    { id: "cyber-light", label: "Synthwave Day", desc: "Pastel futuristic sunrise with magenta tones", type: "Light", swatch: ["#faf5ff", "#f3e8ff", "#9333ea"] }
];

const ACCENT_OPTIONS = [
    { name: "Solar Orange", hex: "#FF8A00" },
    { name: "Electric Blue", hex: "#3B82F6" },
    { name: "Emerald Green", hex: "#10B981" },
    { name: "Royal Purple", hex: "#A855F7" },
    { name: "Ruby Crimson", hex: "#EF4444" }
];

function SettingsPage() {
    const { theme, setTheme } = useTheme();

    const [accent, setAccent] = useState(() => {
        return localStorage.getItem("twinlab_pref_accent") || "#FF8A00";
    });

    const [gridSnap, setGridSnap] = useState(() => {
        return localStorage.getItem("twinlab_pref_gridsnap") || "16";
    });

    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem("twinlab_pref_sound") !== "false";
    });

    const [fpsMode, setFpsMode] = useState(() => {
        return localStorage.getItem("twinlab_pref_fps") || "120";
    });

    const [autoSaveInterval, setAutoSaveInterval] = useState(() => {
        return localStorage.getItem("twinlab_pref_autosave") || "300";
    });

    const [storageUsageKb, setStorageUsageKb] = useState(0);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [savedNotice, setSavedNotice] = useState(false);

    // Calculate localStorage footprint
    useEffect(() => {
        try {
            let total = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k) {
                    total += (k.length + (localStorage.getItem(k)?.length || 0)) * 2;
                }
            }
            setStorageUsageKb(Math.round(total / 1024));
        } catch (e) {}
    }, []);

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

    const handleFpsChange = (val) => {
        setFpsMode(val);
        localStorage.setItem("twinlab_pref_fps", val);
        showNotice();
    };

    const handleSoundToggle = () => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        localStorage.setItem("twinlab_pref_sound", String(next));
        showNotice();
    };

    const handleTestTone = (freq = 880) => {
        try {
            soundManager.playTone(freq, 0.2);
        } catch (e) {}
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
            localStorage.removeItem("twinlab_user_projects");
            localStorage.removeItem("twinlab_active_project");
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
                    <span>System Preferences // v2.5</span>
                </div>
                <h1>TwinLab X Studio Settings</h1>
                <p>Customize your digital twin environment, dark &amp; light theme visual palettes, simulation tolerances, audio feedback, and project storage.</p>
                {savedNotice && (
                    <div className="settings-toast-pill">
                        <i className="ri-check-line"></i>
                        <span>Preferences saved</span>
                    </div>
                )}
            </div>

            <div className="settings-sections-list">
                {/* 1. COMPLETE THEME PALETTE SUITE (DARK & LIGHT) */}
                <div className="settings-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-palette-line icon-accent"></i>
                            <div>
                                <h3>Visual Theme &amp; Workspace Styling</h3>
                                <p>Select from dark high-energy studio modes or laboratory light blueprint themes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="theme-options-grid">
                        {THEME_CARDS.map((t) => (
                            <div
                                key={t.id}
                                className={`theme-choice-box ${theme === t.id ? "selected" : ""}`}
                                onClick={() => {
                                    setTheme(t.id);
                                    showNotice();
                                }}
                            >
                                <div className="theme-card-top">
                                    <div className="theme-swatch-pills">
                                        {t.swatch.map((c, i) => (
                                            <span key={i} className="swatch-mini-dot" style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                    <span className={`theme-type-tag ${t.type.toLowerCase()}`}>{t.type}</span>
                                </div>
                                <div className="theme-choice-text">
                                    <h4>{t.label}</h4>
                                    <span>{t.desc}</span>
                                </div>
                                {theme === t.id && (
                                    <div className="theme-active-badge">
                                        <i className="ri-check-line"></i>
                                        <span>ACTIVE</span>
                                    </div>
                                )}
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
                                <h3>Dynamic Accent Tint</h3>
                                <p>Interactive controls, pin selection indicators, and status badges will inherit this tint.</p>
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
                                <h3>SPICE Engine Physics &amp; Workspace Precision</h3>
                                <p>Configure target refresh rate, grid snapping, and audio synthesis feedback.</p>
                            </div>
                        </div>
                    </div>

                    <div className="settings-controls-stack">
                        {/* Frame Rate / Engine Speed */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Simulation Engine Frame Rate</h4>
                                <span>Cycle update rate for real-time oscilloscope &amp; logic solver</span>
                            </div>
                            <div className="segment-pills font-mono">
                                <button className={fpsMode === "30" ? "active" : ""} onClick={() => handleFpsChange("30")}>30 FPS</button>
                                <button className={fpsMode === "60" ? "active" : ""} onClick={() => handleFpsChange("60")}>60 FPS</button>
                                <button className={fpsMode === "120" ? "active" : ""} onClick={() => handleFpsChange("120")}>120 FPS Native</button>
                            </div>
                        </div>

                        {/* Grid Snap */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Breadboard Dot-Grid Snapping</h4>
                                <span>Component magnetic pin alignment pitch</span>
                            </div>
                            <div className="segment-pills font-mono">
                                <button className={gridSnap === "16" ? "active" : ""} onClick={() => handleGridChange("16")}>16px (Standard)</button>
                                <button className={gridSnap === "8" ? "active" : ""} onClick={() => handleGridChange("8")}>8px (Fine)</button>
                                <button className={gridSnap === "0" ? "active" : ""} onClick={() => handleGridChange("0")}>Freeform</button>
                            </div>
                        </div>

                        {/* Sound Effects & Test Tone */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Piezo Buzzer &amp; Audio Synthesis</h4>
                                <span>Synthesize authentic frequency tones for active buzzers</span>
                            </div>
                            <div className="audio-control-cluster">
                                <button 
                                    type="button" 
                                    className="test-sound-btn"
                                    onClick={() => handleTestTone(880)}
                                    title="Click to test buzzer tone"
                                >
                                    <i className="ri-volume-up-line"></i>
                                    <span>Test Tone</span>
                                </button>
                                <button className={`toggle-switch ${soundEnabled ? "on" : "off"}`} onClick={handleSoundToggle}>
                                    <span className="toggle-thumb"></span>
                                </button>
                            </div>
                        </div>

                        {/* Auto-Save Interval */}
                        <div className="settings-row-item">
                            <div>
                                <h4>Local Storage Auto-Save Interval</h4>
                                <span>Frequency of background project circuit state backup</span>
                            </div>
                            <div className="segment-pills font-mono">
                                <button className={autoSaveInterval === "60" ? "active" : ""} onClick={() => handleAutoSaveChange("60")}>1 min</button>
                                <button className={autoSaveInterval === "300" ? "active" : ""} onClick={() => handleAutoSaveChange("300")}>5 min</button>
                                <button className={autoSaveInterval === "manual" ? "active" : ""} onClick={() => handleAutoSaveChange("manual")}>Manual Only</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. DANGER ZONE / STORAGE FOOTPRINT */}
                <div className="settings-card danger-card">
                    <div className="card-header-row">
                        <div className="card-title-group">
                            <i className="ri-database-2-line icon-danger"></i>
                            <div>
                                <h3>Project Storage &amp; Cache Telemetry</h3>
                                <p>Used footprint: <strong className="font-mono">{storageUsageKb} KB</strong> in local browser storage.</p>
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
