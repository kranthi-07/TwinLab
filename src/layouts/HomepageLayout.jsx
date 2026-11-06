import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./HomepageLayout.css";

import Sidebar from "../components/sidebar/sidebar";
import Topbar from "../components/topbar/topbar";
import Dashboard from "../pages/dashboard/dashboard";
import ComponentsPage from "../pages/components/ComponentsPage";
import LearnPage from "../pages/learn/LearnPage";
import SettingsPage from "../pages/settings/SettingsPage";

function HomepageLayout({ onOpenWorkspace }) {
    const [activeTab, setActiveTab] = useState("Dashboard");

    const pageVariants = {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.16 } }
    };

    return (
        <div className="layout">
            <Topbar onOpenWorkspace={onOpenWorkspace} />

            <div className="body">
                <Sidebar 
                    onOpenWorkspace={onOpenWorkspace} 
                    activeTab={activeTab} 
                    onSelectTab={setActiveTab} 
                />

                <main className="page">
                    <AnimatePresence mode="wait">
                        {activeTab === "Dashboard" && (
                            <motion.div
                                key="page-dashboard"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                style={{ width: "100%", height: "100%" }}
                            >
                                <Dashboard onOpenWorkspace={onOpenWorkspace} />
                            </motion.div>
                        )}

                        {activeTab === "Components" && (
                            <motion.div
                                key="page-components"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                style={{ width: "100%", height: "100%" }}
                            >
                                <ComponentsPage onOpenWorkspace={onOpenWorkspace} />
                            </motion.div>
                        )}

                        {activeTab === "Learn" && (
                            <motion.div
                                key="page-learn"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                style={{ width: "100%", height: "100%" }}
                            >
                                <LearnPage onOpenWorkspace={onOpenWorkspace} />
                            </motion.div>
                        )}

                        {activeTab === "Settings" && (
                            <motion.div
                                key="page-settings"
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                style={{ width: "100%", height: "100%" }}
                            >
                                <SettingsPage />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default HomepageLayout;
