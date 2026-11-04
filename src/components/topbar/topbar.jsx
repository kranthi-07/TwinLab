import "./topbar.css";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

function Topbar({ onOpenWorkspace }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className="topbar">
            {/* Brand Logo & Title */}
            <div className="brand">
                <div className="brand-logo">
                    <span className="node blue"></span>
                    <span className="bridge"></span>
                    <span className="node orange"></span>
                </div>
                <div className="brand-text">
                    <h2>Twin<span>Lab</span></h2>
                    <p>Digital Twin Studio</p>
                </div>
            </div>

            {/* Clean Center Action / Status */}
            <div className="topbar-center">
                <div className="status-pill">
                    <span className="status-dot"></span>
                    <span>Simulation Engine Ready</span>
                </div>
            </div>

            {/* Right Quick Controls */}
            <div className="topbar-actions">
                {/* Theme Toggle */}
                <motion.button 
                    className="action-btn theme-toggle-btn" 
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.06 }} 
                    whileTap={{ scale: 0.94 }}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
                </motion.button>

                <motion.button 
                    className="action-btn" 
                    whileHover={{ scale: 1.06 }} 
                    whileTap={{ scale: 0.94 }}
                    title="Notifications"
                >
                    <i className="ri-notification-3-line"></i>
                </motion.button>

                {onOpenWorkspace && (
                    <motion.button 
                        className="launch-btn" 
                        onClick={onOpenWorkspace}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        <i className="ri-play-circle-line"></i>
                        <span>Workspace</span>
                    </motion.button>
                )}

                <motion.div 
                    className="profile-btn" 
                    title="User Profile"
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                >
                    <i className="ri-user-3-line"></i>
                </motion.div>
            </div>
        </header>
    );
}

export default Topbar;
