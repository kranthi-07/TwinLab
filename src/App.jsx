import { useState, useEffect } from "react";
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
            {view === "workspace" ? (
                <WorkspaceLayout onBackToHome={() => navigateTo("home")} />
            ) : (
                <HomepageLayout onOpenWorkspace={() => navigateTo("workspace")} />
            )}
        </ErrorBoundary>
    );
}

export default App;
