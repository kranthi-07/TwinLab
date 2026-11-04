import "./LeftSidebar.css";
import { useState, useRef, useEffect } from "react";
import { COMPONENTS_CATALOG } from "../../../data/componentsCatalog";

function LeftSidebar({ onAddComponent }) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem("twinlab_sidebar_view_mode") || "list";
        } catch {
            return "list";
        }
    });
    const [showTip, setShowTip] = useState(true);

    const sidebarRef = useRef(null);

    // Auto-expire drag-hint after 2 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowTip(false);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    // Close sidebar on click outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const tabs = [
        {
            id: "all",
            title: "All Components",
            icon: "ri-apps-2-line",
            color: "#A855F7"
        },
        {
            id: "boards",
            title: "Boards & ICs",
            icon: "ri-cpu-line",
            color: "#FF8A00"
        },
        {
            id: "devices",
            title: "Sensors & Modules",
            icon: "ri-hard-drive-3-line",
            color: "#00D28F"
        },
        {
            id: "favorites",
            title: "Favorites",
            icon: "ri-star-line",
            color: "#FFD54A"
        }
    ];

    const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

    const handleTabClick = (tabId) => {
        if (open && activeTab === tabId) {
            setOpen(false);
            return;
        }
        setActiveTab(tabId);
        setOpen(true);
    };

    const setViewModePref = (mode) => {
        setViewMode(mode);
        try {
            localStorage.setItem("twinlab_sidebar_view_mode", mode);
        } catch {}
    };

    // Filter out basic passives that are already in the top-left components bar palette
    const BASIC_PALETTE_TYPES = new Set([
        "resistor",
        "led",
        "capacitor-ceramic",
        "button",
        "potentiometer",
        "battery-9v",
        "battery-coin",
        "buzzer",
        "wire"
    ]);

    const filteredComponents = COMPONENTS_CATALOG.filter((comp) => {
        if (BASIC_PALETTE_TYPES.has(comp.type) || BASIC_PALETTE_TYPES.has(comp.id)) {
            return false;
        }
        const matchesTab = activeTab === "all" ? true : comp.category === activeTab;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
                              comp.name.toLowerCase().includes(q) ||
                              (comp.desc && comp.desc.toLowerCase().includes(q)) ||
                              (comp.tag && comp.tag.toLowerCase().includes(q));
        return matchesTab && matchesSearch;
    });

    const handleDragStart = (e, component) => {
        e.dataTransfer.setData("application/twinlab-component", JSON.stringify(component));
        e.dataTransfer.effectAllowed = "copy";
    };

    return (
        <aside
            ref={sidebarRef}
            className={`left-sidebar ${open ? "open" : ""}`}
            style={{
                "--accent": currentTab.color
            }}
        >
            {/* ==========================================
                ICON RAIL (Always left-pinned inside container)
            ========================================== */}
            <div className="sidebar-icons">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`sidebar-icon ${isActive && open ? "active" : ""}`}
                            onClick={() => handleTabClick(tab.id)}
                            style={{
                                "--icon-color": tab.color
                            }}
                        >
                            <i className={tab.icon}></i>
                            <span className="tooltip">
                                {tab.title}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ==========================================
                PANEL (Unveils smoothly as container widens)
            ========================================== */}
            <div className="sidebar-panel">
                <div className="sidebar-header">
                    <div className="header-title-wrap">
                        <h3>{currentTab.title}</h3>
                        <span className="component-count">{filteredComponents.length} items</span>
                    </div>

                    <div className="header-actions">
                        {/* Segmented switch: Blocks vs List */}
                        <div className="view-mode-segmented">
                            <button
                                type="button"
                                className={`mode-seg-btn ${viewMode === "block" ? "active" : ""}`}
                                onClick={() => setViewModePref("block")}
                                title="Grid View"
                            >
                                <i className="ri-layout-grid-fill"></i>
                            </button>
                            <button
                                type="button"
                                className={`mode-seg-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewModePref("list")}
                                title="List View"
                            >
                                <i className="ri-list-check"></i>
                            </button>
                        </div>

                        {/* Close Cross Button */}
                        <button
                            type="button"
                            className="close-sidebar-btn"
                            onClick={() => setOpen(false)}
                            title="Close Sidebar"
                        >
                            <i className="ri-close-line"></i>
                        </button>
                    </div>
                </div>

                {/* Search Bar with Instant Clear */}
                <div className="sidebar-search">
                    <i className="ri-search-line"></i>
                    <input
                        type="text"
                        placeholder="Search boards, sensors, modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="clear-search" onClick={() => setSearchQuery("")} title="Clear search">
                            <i className="ri-close-circle-fill"></i>
                        </button>
                    )}
                </div>

                {/* Quick Hint Banner (Expires in 2s) */}
                {showTip && (
                    <div className="drag-hint">
                        <i className="ri-drag-move-fill"></i>
                        <span>Drag & drop onto workspace or click to add</span>
                    </div>
                )}

                {/* Component List / Grid */}
                <div className={`sidebar-content view-${viewMode}`}>
                    {filteredComponents.length > 0 ? (
                        filteredComponents.map((component) => (
                            <div
                                key={component.id}
                                className={`component-card card-${viewMode}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, component)}
                                onClick={() => onAddComponent && onAddComponent(component)}
                                title={`Click or drag to add ${component.name}`}
                            >
                                <div className="component-preview">
                                    {component.image ? (
                                        <img 
                                            src={component.image} 
                                            alt={component.name} 
                                            className="component-img"
                                            draggable={false}
                                        />
                                    ) : (
                                        <div className="component-icon-placeholder">
                                            <i className={component.icon || "ri-cpu-line"}></i>
                                        </div>
                                    )}
                                    <span className="drag-pill">Drag</span>
                                </div>

                                <div className="component-info">
                                    <div className="component-title-row">
                                        <h4>{component.name}</h4>
                                        {component.tag && (
                                            <span className="component-tag">{component.tag}</span>
                                        )}
                                    </div>
                                    {viewMode === "list" && component.desc && (
                                        <p>{component.desc}</p>
                                    )}
                                </div>

                                {viewMode === "list" && (
                                    <button 
                                        className="quick-add-btn" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddComponent && onAddComponent(component);
                                        }}
                                        title="Quick Add"
                                    >
                                        <i className="ri-add-line"></i>
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <i className="ri-search-eye-line"></i>
                            <p>No components found</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}

export default LeftSidebar;
