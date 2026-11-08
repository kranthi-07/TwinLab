import "./topbar.css";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { TwinLabLogo } from "../common/TwinLabLogo";
import { ThemeSelector } from "../common/ThemeSelector";
import { LoginModal } from "../auth/LoginModal";
import { NotificationsModal, SESSION_UPDATES } from "../common/NotificationsModal";
import authService from "../../services/authService";

const WAVE_MODES = [
    { id: "sine", name: "10 kHz SINE", formula: "sin", icon: "ri-pulse-line", color: "#10b981" },
    { id: "square", name: "1 kHz SQUARE", formula: "sq", icon: "ri-square-line", color: "#00f0ff" },
    { id: "pwm", name: "PWM 64% (3.3V)", formula: "pwm", icon: "ri-bar-chart-2-line", color: "#ff8a00" },
    { id: "spi", name: "SPI CLK 40MHz", formula: "spi", icon: "ri-flashlight-line", color: "#a855f7" }
];

function Topbar({ onOpenWorkspace }) {
    const { isDark, toggleTheme } = useTheme();
    const [user, setUser] = useState(authService.getCurrentUser());
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifModal, setShowNotifModal] = useState(false);
    const [waveIndex, setWaveIndex] = useState(0);

    const currentWave = WAVE_MODES[waveIndex];

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

    const cycleWaveMode = () => {
        setWaveIndex((prev) => (prev + 1) % WAVE_MODES.length);
    };

    return (
        <header className="topbar">
            {/* High-Tech Corner Decorators */}
            <div className="topbar-corner-decor tl"></div>
            <div className="topbar-corner-decor tr"></div>
            <div className="topbar-corner-decor bl"></div>
            <div className="topbar-corner-decor br"></div>

            {/* Brand Logo & Title */}
            <div className="brand">
                <TwinLabLogo size={36} />
                <span className="brand-build-tag font-mono">v2.5 // CORE</span>
            </div>

            {/* Interactive Center Signal Generator & Telemetry Scope */}
            <div className="topbar-center">
                <motion.button 
                    className="topbar-interactive-scope"
                    onClick={cycleWaveMode}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title="Click to cycle real-time simulation signal waveform"
                    type="button"
                >
                    <div className="scope-wave-box">
                        <svg className="scope-svg" viewBox="0 0 48 20">
                            {currentWave.id === "sine" && (
                                <path 
                                    d="M 0 10 Q 6 2, 12 10 T 24 10 T 36 10 T 48 10" 
                                    className="scope-path sine" 
                                    style={{ stroke: currentWave.color }}
                                />
                            )}
                            {currentWave.id === "square" && (
                                <path 
                                    d="M 0 16 L 8 16 L 8 4 L 16 4 L 16 16 L 24 16 L 24 4 L 32 4 L 32 16 L 40 16 L 40 4 L 48 4" 
                                    className="scope-path square" 
                                    style={{ stroke: currentWave.color }}
                                />
                            )}
                            {currentWave.id === "pwm" && (
                                <path 
                                    d="M 0 16 L 4 16 L 4 4 L 14 4 L 14 16 L 18 16 L 18 4 L 28 4 L 28 16 L 32 16 L 32 4 L 42 4 L 42 16 L 48 16" 
                                    className="scope-path pwm" 
                                    style={{ stroke: currentWave.color }}
                                />
                            )}
                            {currentWave.id === "spi" && (
                                <path 
                                    d="M 0 10 L 6 3 L 12 17 L 18 4 L 24 16 L 30 5 L 36 15 L 42 6 L 48 10" 
                                    className="scope-path spi" 
                                    style={{ stroke: currentWave.color }}
                                />
                            )}
                        </svg>
                    </div>

                    <div className="scope-info">
                        <div className="scope-title-row">
                            <span className="scope-dot" style={{ background: currentWave.color, boxShadow: `0 0 8px ${currentWave.color}` }}></span>
                            <span className="scope-mode font-mono" style={{ color: currentWave.color }}>{currentWave.name}</span>
                        </div>
                        <span className="scope-telemetry-sub font-mono">SPICE 120 FPS • 0.04ms LATENCY</span>
                    </div>

                    <div className="scope-click-hint font-mono">
                        <i className="ri-refresh-line"></i>
                        <span>SWITCH</span>
                    </div>
                </motion.button>
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

                {/* Notifications & System Updates Drawer */}
                <div className="topbar-notif-container">
                    <motion.button 
                        className="action-btn notif-btn" 
                        onClick={() => setShowNotifModal(prev => !prev)}
                        whileHover={{ scale: 1.06 }} 
                        whileTap={{ scale: 0.94 }}
                        title="Recent Updates & System Changelog"
                        type="button"
                    >
                        <i className="ri-notification-3-line"></i>
                        <span className="notif-badge-dot" />
                    </motion.button>

                    <NotificationsModal 
                        isOpen={showNotifModal} 
                        onClose={() => setShowNotifModal(false)} 
                    />
                </div>

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
                        <span className="hotkey-hint font-mono">⌘W</span>
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
