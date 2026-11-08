import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMPONENTS_CATALOG } from "../../data/componentsCatalog";
import { ComponentArt } from "../../components/common/ComponentArt";
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
    if (comp.id?.startsWith("arduino") || comp.id?.startsWith("esp32") || comp.id?.startsWith("rpi") || comp.id?.startsWith("stm32") || comp.id?.startsWith("attiny")) return "mcu";
    if (comp.id?.startsWith("breadboard")) return "boards";
    if (comp.id === "lcd-1602" || comp.id?.startsWith("led") || comp.id === "buzzer") return "outputs";
    if (comp.id?.startsWith("battery")) return "power";
    if (comp.id?.startsWith("switch") || comp.id?.startsWith("push") || comp.id === "potentiometer" || comp.id === "slide-switch") return "inputs";
    if (comp.id === "multimeter" || comp.id === "oscilloscope") return "instruments";
    return "passives";
}

function ComponentCardArt({ type, color = "#ef4444" }) {
    return <ComponentArt type={type} color={color} />;
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
