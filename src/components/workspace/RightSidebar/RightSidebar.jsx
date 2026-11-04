import "./RightSidebar.css";
import { useState, useRef, useEffect } from "react";

function RightSidebar() {

    const [activeTab, setActiveTab] = useState(null);
    const rightSidebarRef = useRef(null);

    // Close panel on outside click on the screen
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (rightSidebarRef.current && !rightSidebarRef.current.contains(e.target)) {
                setActiveTab(null);
            }
        };
        window.addEventListener("mousedown", handleOutsideClick);
        return () => window.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const tabs = [
        {
            id: "instruments",
            title: "Instruments",
            icon: "ri-flask-line",
            color: "#FF8A00"
        },
        {
            id: "inspector",
            title: "Inspector",
            icon: "ri-focus-3-line",
            color: "#3B9CFF"
        },
        {
            id: "connections",
            title: "Connections",
            icon: "ri-node-tree",
            color: "#00D28F"
        },
        {
            id: "pinned",
            title: "Pinned",
            icon: "ri-pushpin-line",
            color: "#C779FF"
        }
    ];

    const currentTab = tabs.find(
        tab => tab.id === activeTab
    );

    const handleClick = (id) => {

        setActiveTab(
            activeTab === id ? null : id
        );

    };

    return (

        <aside ref={rightSidebarRef}
            className={`right-sidebar ${activeTab ? "open" : ""
                }`}
            style={{
                "--accent":
                    currentTab?.color || "#FF8A00"
            }}
        >

            {/* =================================
                SIDEBAR PANEL
            ================================= */}

            <div className="right-panel">

                {currentTab && (

                    <>
                        <div className="right-panel-header">

                            <div className="right-panel-title">

                                <div
                                    className="right-heading-icon"
                                    style={{
                                        color:
                                            currentTab.color
                                    }}
                                >
                                    <i
                                        className={
                                            currentTab.icon
                                        }
                                    ></i>
                                </div>

                                <div>

                                    <h3>
                                        {currentTab.title}
                                    </h3>

                                    <span>
                                        TwinLab
                                    </span>

                                </div>

                            </div>

                            <button
                                className="right-close"
                                onClick={() =>
                                    setActiveTab(null)
                                }
                            >
                                <i className="ri-close-line"></i>
                            </button>

                        </div>


                        <div
                            className="right-panel-content"
                            key={activeTab}
                        >

                            {activeTab === "instruments" && (

                                <>
                                    <Tool
                                        icon="ri-flashlight-line"
                                        color="#FFD54A"
                                        title="Voltmeter"
                                        description="Measure voltage"
                                    />

                                    <Tool
                                        icon="ri-line-chart-line"
                                        color="#3B9CFF"
                                        title="Oscilloscope"
                                        description="View waveforms"
                                    />

                                    <Tool
                                        icon="ri-terminal-box-line"
                                        color="#00D28F"
                                        title="Serial Monitor"
                                        description="Monitor serial data"
                                    />
                                </>

                            )}

                            {activeTab === "inspector" && (
                                <Empty
                                    icon="ri-focus-3-line"
                                    title="Inspector"
                                    text="Select a component to inspect."
                                />
                            )}

                            {activeTab === "connections" && (
                                <Empty
                                    icon="ri-node-tree"
                                    title="Connections"
                                    text="Component connections appear here."
                                />
                            )}

                            {activeTab === "pinned" && (
                                <Empty
                                    icon="ri-pushpin-line"
                                    title="Pinned"
                                    text="Your pinned tools appear here."
                                />
                            )}

                        </div>
                    </>

                )}

            </div>


            {/* =================================
                FLOATING ICONS
            ================================= */}

            <div className="right-icons">

                {tabs.map((tab) => {

                    const isActive =
                        activeTab === tab.id;

                    return (

                        <button
                            key={tab.id}

                            className={`right-icon ${isActive ? "active" : ""
                                }`}

                            style={{
                                "--icon-color":
                                    tab.color
                            }}

                            onClick={() =>
                                handleClick(tab.id)
                            }
                        >

                            <i
                                className={tab.icon}
                            ></i>

                            <span className="right-tooltip">
                                {tab.title}
                            </span>

                        </button>

                    );

                })}

            </div>

        </aside>

    );
}


/* ==========================================
   TOOL
========================================== */

function Tool({
    icon,
    color,
    title,
    description
}) {

    return (

        <div className="instrument-card">

            <div
                className="instrument-icon"
                style={{
                    color,
                    background:
                        `${color}15`
                }}
            >
                <i className={icon}></i>
            </div>

            <div className="instrument-info">

                <strong>
                    {title}
                </strong>

                <span>
                    {description}
                </span>

            </div>

            <button className="instrument-open">
                Open
            </button>

        </div>

    );
}


/* ==========================================
   EMPTY
========================================== */

function Empty({
    icon,
    title,
    text
}) {

    return (

        <div className="right-empty">

            <i className={icon}></i>

            <strong>
                {title}
            </strong>

            <span>
                {text}
            </span>

        </div>

    );
}


export default RightSidebar;