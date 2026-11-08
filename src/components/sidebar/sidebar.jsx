import { useState } from "react";
import { motion } from "framer-motion";
import "./sidebar.css";

const MENU_ITEMS = [
    {
        id: "Dashboard",
        icon: "ri-home-5-line",
        title: "Cockpit",
        desc: "Overview & Real-time Twins",
        badge: "LIVE",
        shortcut: "1",
        color: "#ff8a00"
    },
    {
        id: "Workspace",
        icon: "ri-cpu-line",
        title: "Workspace",
        desc: "Full Simulation Canvas",
        badge: "SPICE",
        shortcut: "2",
        color: "#00f0ff"
    },
    {
        id: "Components",
        icon: "ri-apps-2-line",
        title: "Silicon",
        desc: "50+ ICs, Sensors & Gates",
        badge: "50+",
        shortcut: "3",
        color: "#10b981"
    },
    {
        id: "Learn",
        icon: "ri-book-open-line",
        title: "Guides",
        desc: "Pinouts & Logic Tutorials",
        badge: "DOCS",
        shortcut: "4",
        color: "#a855f7"
    },
    {
        id: "Settings",
        icon: "ri-settings-3-line",
        title: "System",
        desc: "Themes & Engine Latency",
        badge: "CFG",
        shortcut: "5",
        color: "#94a3b8"
    }
];

const VOLTAGE_RAILS = [
    { v: "3.3V", label: "CMOS", color: "#00f0ff" },
    { v: "5.0V", label: "TTL", color: "#10b981" },
    { v: "9.0V", label: "VIN", color: "#ff8a00" }
];

function Sidebar({ onOpenWorkspace, activeTab = "Dashboard", onSelectTab }) {
    const [activeRailIndex, setActiveRailIndex] = useState(0);

    const handleItemClick = (id) => {
        if (id === "Workspace") {
            onOpenWorkspace && onOpenWorkspace();
            return;
        }
        onSelectTab && onSelectTab(id);
    };

    const cycleVoltageRail = () => {
        setActiveRailIndex((prev) => (prev + 1) % VOLTAGE_RAILS.length);
    };

    const currentRail = VOLTAGE_RAILS[activeRailIndex];

    return (
        <aside className="nav-rail tech-nav-dock">
            {/* Dock Corner Decorators */}
            <div className="dock-corner-decor tl"></div>
            <div className="dock-corner-decor tr"></div>
            <div className="dock-corner-decor bl"></div>
            <div className="dock-corner-decor br"></div>

            {/* Top Indicator */}
            <div className="dock-top-beacon" title="Quantum SPICE Bus Synchronized">
                <span className="beacon-ring"></span>
                <span className="beacon-dot"></span>
            </div>

            {/* Nav Items */}
            <div className="dock-items-group">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <motion.button
                            key={item.id}
                            className={`rail-item tech-rail-item ${isActive ? "active" : ""}`}
                            style={{ "--item-accent": item.color }}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => handleItemClick(item.id)}
                            type="button"
                        >
                            <div className="icon-box">
                                <i className={item.icon}></i>
                            </div>

                            {/* Floating Rich Tooltip */}
                            <div className="dock-tooltip">
                                <div className="tooltip-header">
                                    <span className="tooltip-title">{item.title}</span>
                                    <span className="tooltip-key font-mono">{item.shortcut}</span>
                                </div>
                                <span className="tooltip-desc">{item.desc}</span>
                                <span className="tooltip-badge font-mono">{item.badge}</span>
                            </div>

                            {isActive && (
                                <motion.div 
                                    className="rail-active-indicator" 
                                    layoutId="dock-active-glow" 
                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Interactive Bottom Voltage Rail Module */}
            <div className="dock-bottom-widget">
                <button 
                    type="button" 
                    className="voltage-rail-toggle"
                    onClick={cycleVoltageRail}
                    title="Click to switch global hardware bus simulation rail"
                >
                    <span 
                        className="rail-led" 
                        style={{ background: currentRail.color, boxShadow: `0 0 10px ${currentRail.color}` }}
                    />
                    <span className="rail-voltage font-mono" style={{ color: currentRail.color }}>{currentRail.v}</span>
                    <span className="rail-type font-mono">{currentRail.label}</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
