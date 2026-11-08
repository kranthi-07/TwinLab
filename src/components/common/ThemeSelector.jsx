import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeSelector.css";

const THEME_OPTIONS = [
    {
        id: "dark",
        name: "Obsidian Dark",
        desc: "Default titanium carbon & warm amber",
        icon: "ri-contrast-drop-2-line",
        colors: ["#090c10", "#ff8a00", "#3b9cff"]
    },
    {
        id: "glassmorphism",
        name: "Frost Glass",
        desc: "Frosted aerospace glass & icy aurora",
        icon: "ri-water-flash-line",
        colors: ["#06101e", "#38bdf8", "#06b6d4"]
    },
    {
        id: "cyberpunk",
        name: "Cyber Neon",
        desc: "Synthwave matrix neon cyan & hot magenta",
        icon: "ri-flashlight-line",
        colors: ["#070312", "#00f5ff", "#ff007f"]
    },
    {
        id: "light",
        name: "Minimal Light",
        desc: "Clean Scandinavian daylight & slate",
        icon: "ri-sun-line",
        colors: ["#ffffff", "#2563eb", "#ea580c"]
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
