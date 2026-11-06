import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import HomepageLayout from "./layouts/HomepageLayout";
import ErrorBoundary from "./components/common/ErrorBoundary";

const VIEW_STORAGE_KEY = "twinlab_active_view";

function App() {
    // Keep user in workspace on page refresh if they were in workspace!
    const [view, setView] = useState(() => {
        if (window.location.hash === "#workspace" || window.location.hash === "#/workspace") {
            return "workspace";
        }
        const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
        return savedView === "workspace" ? "workspace" : "home";
    });

    // Sync hash and storage whenever view changes
    const navigateTo = (nextView) => {
        setView(nextView);
        localStorage.setItem(VIEW_STORAGE_KEY, nextView);
        window.location.hash = nextView === "workspace" ? "workspace" : "";
    };

    // Listen to hash changes (e.g. forward/back in browser)
    useEffect(() => {
        const handleHashChange = () => {
            const isWorkspace = window.location.hash === "#workspace" || window.location.hash === "#/workspace";
            const targetView = isWorkspace ? "workspace" : "home";
            setView(targetView);
            localStorage.setItem(VIEW_STORAGE_KEY, targetView);
        };

        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    return (
        <ErrorBoundary>
            <AnimatePresence mode="wait">
                {view === "workspace" ? (
                    <motion.div
                        key="workspace-view"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: "100%", height: "100%", overflow: "hidden" }}
                    >
                        <WorkspaceLayout onBackToHome={() => navigateTo("home")} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="home-view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                        style={{ width: "100%", height: "100%", overflow: "hidden" }}
                    >
                        <HomepageLayout onOpenWorkspace={() => navigateTo("workspace")} />
                    </motion.div>
                )}
            </AnimatePresence>
        </ErrorBoundary>
    );
}

export default App;
