import "./topbar.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { TwinLabLogo } from "../common/TwinLabLogo";
import { ThemeSelector } from "../common/ThemeSelector";
import { LoginModal } from "../auth/LoginModal";
import authService from "../../services/authService";

function Topbar({ onOpenWorkspace }) {
    const { isDark, toggleTheme } = useTheme();
    const [user, setUser] = useState(authService.getCurrentUser());
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        const unsubscribe = authService.subscribe((u) => setUser(u));
        return () => unsubscribe();
    }, []);

    const handleProfileClick = () => {
        if (user.isGuest) {
            setShowLoginModal(true);
        } else {
            setShowProfileMenu((prev) => !prev);
        }
    };

    const handleLogout = () => {
        authService.logout();
        setShowProfileMenu(false);
    };

    return (
        <header className="topbar">
            {/* Brand Logo & Title with transparent X and matched height */}
            <div className="brand">
                <TwinLabLogo size={38} />
            </div>

            {/* Clean Center Action / Status */}
            <div className="topbar-center">
                <div className="status-pill">
                    <span className="status-dot"></span>
                    <span>
                        {user.isGuest 
                            ? "Simulation Engine Ready • Local Mode" 
                            : `Cloud Active • ${user.name}`}
                    </span>
                </div>
            </div>

            {/* Right Quick Controls */}
            <div className="topbar-actions">
                {/* Platform Themes Custom Professional Dropdown */}
                <ThemeSelector />

                {/* Theme Toggle (Quick Sun/Moon) */}
                <motion.button 
                    className="action-btn theme-toggle-btn" 
                    onClick={toggleTheme}
                    whileHover={{ scale: 1.06 }} 
                    whileTap={{ scale: 0.94 }}
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    type="button"
                >
                    <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
                </motion.button>

                {onOpenWorkspace && (
                    <motion.button 
                        className="launch-btn" 
                        onClick={onOpenWorkspace}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                    >
                        <i className="ri-play-circle-line"></i>
                        <span>Workspace</span>
                    </motion.button>
                )}

                {/* User Profile / Login Button */}
                <div className="topbar-profile-container">
                    <motion.button 
                        className={`profile-btn ${!user.isGuest ? "logged-in" : ""}`} 
                        title={user.isGuest ? "Sign In / Guest Mode" : `Logged in as ${user.name}`}
                        onClick={handleProfileClick}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="button"
                    >
                        <i className={user.isGuest ? "ri-user-smile-line" : "ri-user-star-line"}></i>
                        {!user.isGuest && (
                            <span className="profile-cloud-badge" title="Cloud Sync Active">☁️</span>
                        )}
                    </motion.button>

                    {/* Profile Dropdown Drawer for Logged In User */}
                    <AnimatePresence>
                        {showProfileMenu && !user.isGuest && (
                            <motion.div 
                                className="profile-popover-menu"
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                                transition={{ duration: 0.16 }}
                            >
                                <div className="popover-user-info">
                                    <div className="user-avatar-badge">
                                        <i className="ri-user-star-line" />
                                    </div>
                                    <div className="user-meta-text">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                                <div className="popover-plan-badge">
                                    <i className="ri-shield-check-line" />
                                    <span>{user.plan || "TwinLab Cloud Pro"}</span>
                                </div>
                                <div className="popover-actions">
                                    <button 
                                        type="button"
                                        className="popover-action-item"
                                        onClick={() => { setShowLoginModal(true); setShowProfileMenu(false); }}
                                    >
                                        <i className="ri-switch-line" />
                                        <span>Switch Account</span>
                                    </button>
                                    <button 
                                        type="button"
                                        className="popover-action-item logout"
                                        onClick={handleLogout}
                                    >
                                        <i className="ri-logout-box-r-line" />
                                        <span>Log Out (Guest Mode)</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Login / Sign Up / Guest Modal */}
            <LoginModal 
                isOpen={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={(u) => setUser(u)}
            />
        </header>
    );
}

export default Topbar;
