import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../../services/authService";
import cloudProjectService from "../../services/cloudProjectService";
import "./ProfileModal.css";

export function ProfileModal({ isOpen, onClose, onOpenLogin, onOpenWorkspace }) {
    const [user, setUser] = useState(authService.getCurrentUser());
    const [projects, setProjects] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    // Keep user state in sync
    useEffect(() => {
        const unsubscribe = authService.subscribe((u) => setUser(u));
        return () => unsubscribe();
    }, []);

    // Load saved projects whenever modal opens
    useEffect(() => {
        if (!isOpen) return;

        const loadProjects = async () => {
            setIsLoadingProjects(true);
            try {
                const cloudProjs = await cloudProjectService.getCloudProjects();
                let localProjs = [];
                try {
                    const localData = localStorage.getItem("twinlab_user_projects");
                    if (localData) localProjs = JSON.parse(localData);
                } catch (e) {}

                // Merge unique projects by id
                const map = new Map();
                (Array.isArray(cloudProjs) ? cloudProjs : []).forEach(p => p && p.id && map.set(p.id, p));
                (Array.isArray(localProjs) ? localProjs : []).forEach(p => p && p.id && map.set(p.id, p));
                setProjects(Array.from(map.values()));
            } catch (err) {
                console.warn("Failed to load projects for profile:", err);
            } finally {
                setIsLoadingProjects(false);
            }
        };

        loadProjects();
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose && onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const initialLetter = (user.name || user.email || "U").trim().charAt(0).toUpperCase();

    const handleCopyEmail = () => {
        if (user.email) {
            navigator.clipboard.writeText(user.email);
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        }
    };

    const handleOpenProject = (proj) => {
        try {
            localStorage.setItem("twinlab_active_project", JSON.stringify(proj));
            window.dispatchEvent(new CustomEvent("twinlab:load_project", { detail: proj }));
        } catch (e) {}

        if (onOpenWorkspace) {
            onOpenWorkspace();
        } else {
            window.location.hash = "workspace";
        }
        onClose && onClose();
    };

    const handleDeleteProject = async (e, projId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to remove this project?")) return;
        try {
            await cloudProjectService.deleteFromCloud(projId);
            setProjects(prev => prev.filter(p => p.id !== projId));
            
            // Also clean from local projects cache
            try {
                const localData = localStorage.getItem("twinlab_user_projects");
                if (localData) {
                    const parsed = JSON.parse(localData);
                    const filtered = parsed.filter(p => p.id !== projId);
                    localStorage.setItem("twinlab_user_projects", JSON.stringify(filtered));
                }
            } catch (_) {}
        } catch (err) {
            console.error("Failed to delete project:", err);
        }
    };

    const handleLogout = async () => {
        await authService.logout();
        onClose && onClose();
    };

    return (
        <div className="simple-profile-overlay" onClick={onClose}>
            <motion.div 
                className="simple-profile-card"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
                {/* Header */}
                <div className="simple-profile-header">
                    <div className="simple-header-title">
                        <i className="ri-user-settings-line"></i>
                        <span>Profile & Account</span>
                    </div>
                    <button 
                        type="button" 
                        className="simple-profile-close-btn" 
                        onClick={onClose}
                        title="Close profile"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>

                {/* Profile Identity Bar */}
                <div className="simple-user-summary">
                    <div className="simple-avatar-circle">
                        <span>{initialLetter}</span>
                        <div className="simple-avatar-dot" />
                    </div>
                    <div className="simple-user-details">
                        <div className="simple-user-name">
                            {user.name || "Hardware Engineer"}
                        </div>
                        <div className="simple-user-badge">
                            <i className="ri-shield-check-line"></i>
                            <span>{user.isGuest ? "Guest Mode" : "Cloud Account"}</span>
                        </div>
                    </div>
                </div>

                {/* Credentials Section */}
                <div className="simple-info-group">
                    {/* Email Row */}
                    <div className="simple-info-row">
                        <span className="simple-info-label">
                            <i className="ri-mail-line"></i> Email
                        </span>
                        <div className="simple-info-value-wrap">
                            <span className="simple-info-value font-mono">
                                {user.email || "No email registered (Guest)"}
                            </span>
                            {user.email && (
                                <button 
                                    type="button" 
                                    className="simple-copy-btn" 
                                    onClick={handleCopyEmail}
                                    title="Copy email"
                                >
                                    <i className={copiedEmail ? "ri-check-line" : "ri-file-copy-line"}></i>
                                    <span>{copiedEmail ? "Copied" : "Copy"}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Password Row */}
                    <div className="simple-info-row">
                        <span className="simple-info-label">
                            <i className="ri-lock-line"></i> Password
                        </span>
                        <div className="simple-info-value-wrap">
                            {user.savedPassword ? (
                                <>
                                    <span className="simple-info-value font-mono">
                                        {showPassword ? user.savedPassword : "••••••••••••"}
                                    </span>
                                    <button 
                                        type="button" 
                                        className="simple-copy-btn" 
                                        onClick={() => setShowPassword(prev => !prev)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
                                        <span>{showPassword ? "Hide" : "Show"}</span>
                                    </button>
                                </>
                            ) : (
                                <span className="simple-info-value muted font-mono">
                                    {user.email ? "Google OAuth (Protected)" : "None (Guest Session)"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Saved Projects Section */}
                <div className="simple-projects-section">
                    <div className="simple-projects-header">
                        <div className="simple-projects-title">
                            <i className="ri-folder-open-line"></i>
                            <span>Saved Projects</span>
                            <span className="simple-projects-count font-mono">({projects.length})</span>
                        </div>
                    </div>

                    <div className="simple-projects-list">
                        {isLoadingProjects ? (
                            <div className="simple-projects-empty font-mono">
                                Loading saved projects...
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="simple-projects-empty">
                                <i className="ri-inbox-line"></i>
                                <span>No saved projects found. Create circuits in the workspace to save them here!</span>
                            </div>
                        ) : (
                            projects.map((proj) => (
                                <div 
                                    key={proj.id} 
                                    className="simple-project-item"
                                    onClick={() => handleOpenProject(proj)}
                                    title="Click to open this project in Workspace"
                                >
                                    <div className="simple-project-icon">
                                        <i className="ri-cpu-line"></i>
                                    </div>
                                    <div className="simple-project-text">
                                        <span className="simple-project-name">{proj.name || "Untitled Circuit"}</span>
                                        <span className="simple-project-meta font-mono">
                                            {proj.chip || "Generic MCU"} • {proj.components?.length || 0} parts
                                        </span>
                                    </div>
                                    <div className="simple-project-actions">
                                        <button 
                                            type="button" 
                                            className="simple-proj-open-btn"
                                            title="Open project"
                                        >
                                            <i className="ri-arrow-right-line"></i>
                                            <span>Open</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            className="simple-proj-delete-btn"
                                            onClick={(e) => handleDeleteProject(e, proj.id)}
                                            title="Delete project"
                                        >
                                            <i className="ri-delete-bin-line"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bottom Footer Actions */}
                <div className="simple-profile-footer">
                    {user.isGuest ? (
                        <button 
                            type="button" 
                            className="simple-action-btn primary"
                            onClick={() => {
                                onClose && onClose();
                                onOpenLogin && onOpenLogin();
                            }}
                        >
                            <i className="ri-login-box-line"></i>
                            <span>Sign In / Create Account</span>
                        </button>
                    ) : (
                        <button 
                            type="button" 
                            className="simple-action-btn logout"
                            onClick={handleLogout}
                        >
                            <i className="ri-logout-box-r-line"></i>
                            <span>Sign Out</span>
                        </button>
                    )}

                    <button 
                        type="button" 
                        className="simple-action-btn close"
                        onClick={onClose}
                    >
                        <span>Close</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default ProfileModal;
