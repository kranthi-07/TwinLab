import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMPONENTS_CATALOG } from "../../data/componentsCatalog";
import "./ComponentsPage.css";

const CATEGORIES = [
    { id: "all", label: "All Hardware", icon: "ri-apps-2-line" },
    { id: "mcu", label: "Microcontrollers", icon: "ri-cpu-line" },
    { id: "outputs", label: "Displays & Outputs", icon: "ri-tv-line" },
    { id: "power", label: "Power & Batteries", icon: "ri-battery-2-charge-line" },
    { id: "inputs", label: "Switches & Inputs", icon: "ri-toggle-line" },
    { id: "passives", label: "Passives & Sensors", icon: "ri-pulse-line" },
    { id: "boards", label: "Breadboards", icon: "ri-layout-grid-line" },
    { id: "instruments", label: "Lab Instruments", icon: "ri-speed-up-line" }
];

function getCategoryForComponent(comp) {
    if (comp.id?.startsWith("arduino") || comp.id?.startsWith("esp32") || comp.id?.startsWith("rpi")) return "mcu";
    if (comp.id?.startsWith("breadboard")) return "boards";
    if (comp.id === "lcd-1602" || comp.id?.startsWith("led") || comp.id === "buzzer") return "outputs";
    if (comp.id?.startsWith("battery")) return "power";
    if (comp.id?.startsWith("switch") || comp.id?.startsWith("push") || comp.id === "potentiometer" || comp.id === "slide-switch") return "inputs";
    if (comp.id === "multimeter" || comp.id === "oscilloscope") return "instruments";
    return "passives";
}

function ComponentCardArt({ type, color = "#ef4444" }) {
    if (type?.startsWith("arduino-uno")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="10" y="8" width="80" height="52" rx="4" fill="#008784" stroke="#004d40" strokeWidth="1.5" />
                <rect x="6" y="16" width="10" height="14" rx="1.5" fill="#cbd5e1" />
                <rect x="6" y="38" width="12" height="16" rx="1.5" fill="#09090b" />
                <rect x="36" y="34" width="36" height="12" rx="1" fill="#09090b" />
                <rect x="20" y="10" width="65" height="5" rx="1" fill="#18181b" />
                <rect x="25" y="53" width="60" height="5" rx="1" fill="#18181b" />
                <circle cx="22" cy="24" r="3" fill="#ef4444" />
                <text x="54" y="27" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">ARDUINO UNO</text>
            </svg>
        );
    }
    if (type?.startsWith("arduino-mega")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="6" y="8" width="88" height="52" rx="4" fill="#005c5e" stroke="#00383a" strokeWidth="1.5" />
                <rect x="4" y="14" width="10" height="14" rx="1.5" fill="#cbd5e1" />
                <rect x="4" y="38" width="12" height="16" rx="1.5" fill="#09090b" />
                <rect x="42" y="24" width="16" height="16" rx="1" fill="#09090b" transform="rotate(45 50 32)" />
                <rect x="86" y="14" width="6" height="40" rx="1" fill="#18181b" />
                <text x="50" y="54" fill="#bae6fd" fontSize="5.5" fontWeight="bold" textAnchor="middle">MEGA 2560</text>
            </svg>
        );
    }
    if (type?.startsWith("arduino-nano")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="14" y="18" width="72" height="32" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <rect x="10" y="27" width="8" height="14" rx="1" fill="#cbd5e1" />
                <rect x="30" y="28" width="12" height="12" rx="1" fill="#09090b" transform="rotate(45 36 34)" />
                <rect x="22" y="19" width="58" height="4" rx="0.8" fill="#18181b" />
                <rect x="22" y="45" width="58" height="4" rx="0.8" fill="#18181b" />
                <text x="64" y="36" fill="#ffffff" fontSize="6" fontWeight="bold">NANO</text>
            </svg>
        );
    }
    if (type?.startsWith("esp32")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="22" y="6" width="56" height="56" rx="4" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="30" y="18" width="40" height="30" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
                <text x="50" y="35" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">ESP-WROOM-32</text>
                <path d="M 36 10 L 40 10 L 40 14 L 44 14 L 44 10 L 48 10 L 48 14 L 52 14 L 52 10 L 56 10 L 56 14 L 60 14 L 60 10" fill="none" stroke="#eab308" strokeWidth="1.5" />
                <rect x="23" y="10" width="5" height="48" rx="1" fill="#0f172a" />
                <rect x="72" y="10" width="5" height="48" rx="1" fill="#0f172a" />
            </svg>
        );
    }
    if (type === "lcd-1602") {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="10" y="12" width="80" height="44" rx="3.5" fill="#006644" stroke="#004d33" strokeWidth="1.5" />
                <rect x="16" y="18" width="68" height="32" rx="2" fill="#0f172a" />
                <rect x="20" y="22" width="60" height="24" rx="1" fill="#0284c7" fillOpacity="0.3" />
                <text x="24" y="33" fill="#38bdf8" fontSize="6" fontFamily="monospace" fontWeight="bold">TwinLab 16x2</text>
                <text x="24" y="42" fill="#38bdf8" fontSize="5.5" fontFamily="monospace">LCD Active OK</text>
                <circle cx="8" cy="24" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="30" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="36" r="1.5" fill="#ca8a04" />
                <circle cx="8" cy="42" r="1.5" fill="#ca8a04" />
            </svg>
        );
    }
    if (type?.startsWith("battery-aa") || type?.startsWith("battery-aaa")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="18" y="12" width="64" height="44" rx="3" fill="#18181b" stroke="#27272a" strokeWidth="1.5" />
                <rect x="24" y="17" width="52" height="15" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <rect x="72" y="20" width="3" height="9" rx="0.5" fill="#cbd5e1" />
                <rect x="24" y="36" width="52" height="15" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <rect x="21" y="39" width="3" height="9" rx="0.5" fill="#cbd5e1" />
                <path d="M 82 22 Q 92 18 92 28" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <path d="M 82 46 Q 92 50 92 40" fill="none" stroke="#09090b" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }
    if (type === "battery-9v") {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="32" y="14" width="36" height="48" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                <rect x="32" y="14" width="36" height="13" rx="1" fill="#f97316" />
                <rect x="38" y="8" width="7" height="6" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <circle cx="60" cy="11" r="3.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
                <text x="50" y="44" fill="#e2e8f0" fontSize="10" fontWeight="bold" textAnchor="middle">9V</text>
            </svg>
        );
    }
    if (type === "switch-spst") {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="25" y="18" width="50" height="32" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                <circle cx="50" cy="34" r="10" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <line x1="50" y1="34" x2="60" y2="20" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                <circle cx="60" cy="20" r="3" fill="#94a3b8" />
                <rect x="18" y="32" width="7" height="4" rx="1" fill="#94a3b8" />
                <rect x="75" y="32" width="7" height="4" rx="1" fill="#94a3b8" />
            </svg>
        );
    }
    if (type?.startsWith("led")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <line x1="44" y1="42" x2="44" y2="60" stroke="#94a3b8" strokeWidth="2.5" />
                <line x1="56" y1="42" x2="56" y2="60" stroke="#94a3b8" strokeWidth="2.5" />
                <rect x="38" y="40" width="24" height="5" rx="1.5" fill={color} stroke="#000" strokeOpacity="0.2" />
                <path d="M 40 40 C 40 16, 60 16, 60 40 Z" fill={color} />
                <circle cx="47" cy="28" r="4" fill="#ffffff" fillOpacity="0.45" />
            </svg>
        );
    }
    if (type === "resistor") {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <line x1="10" y1="34" x2="30" y2="34" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                <line x1="70" y1="34" x2="90" y2="34" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                <rect x="30" y="24" width="40" height="20" rx="5" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
                <rect x="37" y="24" width="4" height="20" fill="#dc2626" />
                <rect x="45" y="24" width="4" height="20" fill="#dc2626" />
                <rect x="53" y="24" width="4" height="20" fill="#78350f" />
                <rect x="63" y="24" width="4" height="20" fill="#fbbf24" />
            </svg>
        );
    }
    if (type?.startsWith("breadboard")) {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <rect x="8" y="14" width="84" height="40" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <line x1="12" y1="20" x2="88" y2="20" stroke="#ef4444" strokeWidth="1" />
                <line x1="12" y1="48" x2="88" y2="48" stroke="#3b82f6" strokeWidth="1" />
                <text x="50" y="36" fill="#64748b" fontSize="6.5" fontWeight="bold" textAnchor="middle">SOLDERLESS BREADBOARD</text>
            </svg>
        );
    }
    if (type === "buzzer") {
        return (
            <svg viewBox="0 0 100 68" className="comp-art-svg">
                <line x1="42" y1="48" x2="42" y2="60" stroke="#dc2626" strokeWidth="2.5" />
                <line x1="58" y1="48" x2="58" y2="60" stroke="#0f172a" strokeWidth="2.5" />
                <circle cx="50" cy="32" r="20" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <circle cx="50" cy="32" r="7" fill="#1e293b" />
                <path d="M 74 24 A 10 10 0 0 1 74 40" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            </svg>
        );
    }
    // Generic IC fallback
    return (
        <svg viewBox="0 0 100 68" className="comp-art-svg">
            <rect x="28" y="14" width="44" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="36" cy="22" r="2.5" fill="#475569" />
            <text x="50" y="38" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">IC</text>
            {[...Array(4)].map((_, i) => (
                <g key={i}>
                    <line x1="20" y1="22 + i * 9" x2="28" y2="22 + i * 9" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="72" y1="22 + i * 9" x2="80" y2="22 + i * 9" stroke="#94a3b8" strokeWidth="2" />
                </g>
            ))}
        </svg>
    );
}

function ComponentsPage({ onOpenWorkspace }) {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredComponents = useMemo(() => {
        return COMPONENTS_CATALOG.filter((comp) => {
            if (comp.id?.startsWith("starter")) return false; // Starters shown in templates
            const compCat = getCategoryForComponent(comp);
            const matchesCat = selectedCategory === "all" || compCat === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery = !q ||
                comp.name.toLowerCase().includes(q) ||
                (comp.desc && comp.desc.toLowerCase().includes(q)) ||
                (comp.tag && comp.tag.toLowerCase().includes(q));
            return matchesCat && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    const handleLaunchInWorkspace = (comp) => {
        try {
            // Store target component into draft storage so workspace loads with it centered
            const draft = {
                components: [
                    {
                        id: `${comp.type || comp.id}-${Date.now()}`,
                        type: comp.type || comp.id,
                        name: comp.name,
                        x: 320,
                        y: 192,
                        rotation: 0
                    }
                ],
                wires: []
            };
            localStorage.setItem("twinlab_workspace_draft", JSON.stringify(draft));
        } catch (e) {
            console.error("Draft save error:", e);
        }
        onOpenWorkspace && onOpenWorkspace();
    };

    return (
        <div className="components-page-container">
            {/* Header Section */}
            <div className="components-header">
                <div className="header-info">
                    <div className="header-badge">
                        <i className="ri-cpu-line"></i>
                        <span>Hardware Library</span>
                    </div>
                    <h1>Component Ecosystem</h1>
                    <p>
                        High-fidelity microcontrollers, sensors, passive networks, and lab bench instrumentation modeled with real-time SPICE physics.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="components-search-wrap">
                    <i className="ri-search-2-line"></i>
                    <input
                        type="text"
                        className="components-search-input"
                        placeholder="Search components by name, part number, specs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
                            <i className="ri-close-line"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="components-cat-bar">
                {CATEGORIES.map((cat) => {
                    const count = cat.id === "all" 
                        ? COMPONENTS_CATALOG.filter(c => !c.id?.startsWith("starter")).length
                        : COMPONENTS_CATALOG.filter(c => !c.id?.startsWith("starter") && getCategoryForComponent(c) === cat.id).length;

                    return (
                        <button
                            key={cat.id}
                            className={`cat-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            <i className={cat.icon}></i>
                            <span>{cat.label}</span>
                            <span className="cat-count-pill">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Components Grid */}
            <motion.div 
                className="components-grid"
                layout
            >
                <AnimatePresence>
                    {filteredComponents.map((comp) => (
                        <motion.div
                            key={comp.id}
                            className="catalog-component-card"
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ y: -4 }}
                        >
                            <div className="comp-card-art-stage">
                                <ComponentCardArt type={comp.type || comp.id} color={comp.color} />
                            </div>

                            <div className="comp-card-body">
                                <div className="comp-card-tag-row">
                                    <span className="comp-tag-badge">{comp.tag || "Module"}</span>
                                    <span className="comp-cat-label">{getCategoryForComponent(comp).toUpperCase()}</span>
                                </div>
                                <h3 className="comp-card-title">{comp.name}</h3>
                                <p className="comp-card-desc">{comp.desc}</p>
                            </div>

                            <div className="comp-card-footer">
                                <button
                                    className="insert-workspace-btn"
                                    onClick={() => handleLaunchInWorkspace(comp)}
                                >
                                    <i className="ri-add-line"></i>
                                    <span>Open in Workspace</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

export default ComponentsPage;
