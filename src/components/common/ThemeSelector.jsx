import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeSelector.css";

const THEME_OPTIONS = [
    {
        id: "dark",
        name: "Obsidian Dark",
        desc: "Titanium carbon & aerospace amber",
        icon: "ri-contrast-drop-2-line",
        category: "Dark",
        colors: ["#080a0f", "#ff8a00", "#3b9cff"]
    },
    {
        id: "cyberpunk",
        name: "Cyber Neon 2077",
        desc: "Synthwave neon cyan & hot magenta",
        icon: "ri-flashlight-line",
        category: "Dark",
        colors: ["#06020f", "#00f0ff", "#ff007f"]
    },
    {
        id: "emerald",
        name: "Tactical Matrix",
        desc: "Phosphor CRT radar green & mil-spec",
        icon: "ri-radar-line",
        category: "Dark",
        colors: ["#030d06", "#10b981", "#34d399"]
    },
    {
        id: "abyss",
        name: "Oceanic Abyss",
        desc: "Bioluminescent deep sea cyan & navy",
        icon: "ri-water-flash-line",
        category: "Dark",
        colors: ["#020914", "#06b6d4", "#38bdf8"]
    },
    {
        id: "solar",
        name: "Solar Industrial",
        desc: "Molten solar gold & charcoal gunmetal",
        icon: "ri-fire-line",
        category: "Dark",
        colors: ["#0d0b09", "#f59e0b", "#ef4444"]
    },
    {
        id: "light",
        name: "Nordic Daylight",
        desc: "Clean architectural white & blueprint blue",
        icon: "ri-sun-line",
        category: "Light",
        colors: ["#f8fafc", "#1d4ed8", "#ea580c"]
    },
    {
        id: "paper",
        name: "Laboratory Clean",
        desc: "Clinical pure white & circuit emerald",
        icon: "ri-flask-line",
        category: "Light",
        colors: ["#ffffff", "#059669", "#0284c7"]
    },
    {
        id: "solar-light",
        name: "Amber Blueprint",
        desc: "Technical drafting parchment & sepia",
        icon: "ri-draft-line",
        category: "Light",
        colors: ["#fdfbf7", "#b45309", "#c2410c"]
    },
    {
        id: "cyber-light",
        name: "Synthwave Day",
        desc: "High-key pastel violet & cyan neon",
        icon: "ri-sun-cloudy-line",
        category: "Light",
        colors: ["#f8f7ff", "#7c3aed", "#0284c7"]
    }
];

export function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const activeTheme = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
        <div className="theme-selector-wrapper" ref={dropdownRef}>
            <motion.button 
                className={`theme-selector-trigger ${isOpen ? "open" : ""}`}
                onClick={() => setIsOpen((prev) => !prev)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Select Platform Theme"
                type="button"
            >
                <div className="theme-trigger-swatch">
                    <span style={{ background: activeTheme.colors[0] }} className="swatch-dot dot-1" />
                    <span style={{ background: activeTheme.colors[1] }} className="swatch-dot dot-2" />
                </div>
                <span className="theme-trigger-label">{activeTheme.name}</span>
                <i className={`ri-arrow-down-s-line theme-trigger-chevron ${isOpen ? "rotate" : ""}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        className="theme-dropdown-menu"
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="theme-dropdown-header">
                            <span>PLATFORM THEME</span>
                        </div>
                        <div className="theme-options-list">
                            {THEME_OPTIONS.map((t) => {
                                const isSelected = t.id === theme;
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        className={`theme-option-item ${isSelected ? "selected" : ""}`}
                                        onClick={() => {
                                            setTheme(t.id);
                                            setIsOpen(false);
                                        }}
                                    >
                                        <div className="theme-item-left">
                                            <div className="theme-item-colors">
                                                {t.colors.map((c, i) => (
                                                    <span 
                                                        key={i} 
                                                        className="theme-mini-color" 
                                                        style={{ background: c }}
                                                    />
                                                ))}
                                            </div>
                                            <div className="theme-item-meta">
                                                <span className="theme-item-name">{t.name}</span>
                                                <span className="theme-item-desc">{t.desc}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <i className="ri-check-line theme-selected-check" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ThemeSelector;
