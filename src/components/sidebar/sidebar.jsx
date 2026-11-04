import { useState } from "react";
import { motion } from "framer-motion";
import "./sidebar.css";

const menu = [
    {
        icon: "ri-home-5-line",
        title: "Dashboard",
        color: "#4DA3FF"
    },
    {
        icon: "ri-cpu-line",
        title: "Workspace",
        color: "#FF8A00"
    },
    {
        icon: "ri-apps-2-line",
        title: "Components",
        color: "#A855F7"
    },
    {
        icon: "ri-book-open-line",
        title: "Learn",
        color: "#22C55E"
    },
    {
        icon: "ri-settings-3-line",
        title: "Settings",
        color: "#94A3B8"
    }
];

function Sidebar({ onOpenWorkspace }) {

    const [active, setActive] = useState("Dashboard");

    return (

        <aside className="nav-rail">

            {menu.map((item) => (

                <motion.button

                    key={item.title}

                    layout

                    whileHover={{
                        scale: 1.05
                    }}

                    whileTap={{
                        scale: 0.96
                    }}

                    transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 28
                    }}

                    className={`rail-item ${active === item.title ? "active" : ""}`}

                    style={{
                        "--accent": item.color
                    }}

                    onClick={() => {
                        setActive(item.title);
                        if (item.title === "Workspace" && onOpenWorkspace) {
                            onOpenWorkspace();
                        }
                    }}

                >

                    <div className="icon-box">

                        <i className={item.icon}></i>

                    </div>

                    <span>{item.title}</span>

                </motion.button>

            ))}

        </aside>

    );

}

export default Sidebar;