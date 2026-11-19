import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import authService, { formatAuthError } from "../../services/authService";
import { isFirebaseConfigured } from "../../services/firebase";
import cloudProjectService from "../../services/cloudProjectService";
import { TwinLabLogo } from "../common/TwinLabLogo";
import "./LoginModal.css";

export function LoginModal({ isOpen, onClose, onLoginSuccess, guestProject = null, initialTab = "signin" }) {
    const [tab, setTab] = useState(initialTab || "signin"); // "signin" | "signup" | "guest"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("Embedded Systems Dev");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");
    const [saveGuestProject, setSaveGuestProject] = useState(true);

    const currentUser = authService.getCurrentUser();
    const isGuest = currentUser?.isGuest;
    const activeProject = (() => {
        if (guestProject && guestProject.name) return guestProject;
        try {
            const raw = localStorage.getItem("twinlab_active_project");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.name) return parsed;
            }
        } catch (_) {}
        return null;
    })();

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

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setErrorMsg("");
        setSuccessMsg("");
    };

    const handlePostLoginMigration = async (user) => {
        if (saveGuestProject && isGuest && user && !user.isGuest) {
            try {
                await cloudProjectService.migrateGuestProjectsToUser(user, activeProject);
            } catch (err) {
                console.warn("Guest project migration warning:", err);
            }
        }
    };

    const handleSignIn = async (e) => {
        e && e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!email.trim() || !password) {
            setErrorMsg("Please enter both your email and password.");
            return;
        }

        setIsLoading(true);
        try {
            const user = await authService.login(email, password);
            await handlePostLoginMigration(user);
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent("twinlab:welcome_user", { 
                detail: { name: user.name || user.email?.split("@")[0] || "Engineer" } 
            }));
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        } catch (err) {
            setIsLoading(false);
            setErrorMsg(formatAuthError(err));
        }
    };

    const handleSignUp = async (e) => {
        e && e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");

        if (!name.trim() || !email.trim() || !password) {
            setErrorMsg("Please fill in your name, email, and password.");
            return;
        }

        if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("Passwords do not match. Please re-enter.");
            return;
        }

        setIsLoading(true);
        try {
            const user = await authService.signup({ name, email, password, role });
            await handlePostLoginMigration(user);
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent("twinlab:welcome_user", { 
                detail: { name: user.name || user.email?.split("@")[0] || "Engineer" } 
            }));
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        } catch (err) {
            setIsLoading(false);
            setErrorMsg(formatAuthError(err));
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMsg("");
        setSuccessMsg("");
        setIsLoading(true);
        try {
            const user = await authService.loginWithGoogle();
            await handlePostLoginMigration(user);
            setIsLoading(false);
            window.dispatchEvent(new CustomEvent("twinlab:welcome_user", { 
                detail: { name: user.name || user.email?.split("@")[0] || "Engineer" } 
            }));
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        } catch (err) {
            setIsLoading(false);
            setErrorMsg(formatAuthError(err));
        }
    };

    const handleGuestLogin = async () => {
        setErrorMsg("");
        setIsLoading(true);
        try {
            const user = await authService.loginAsGuest();
            setIsLoading(false);
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        } catch (err) {
            setIsLoading(false);
            setErrorMsg("Failed to initialize guest session.");
        }
    };

    return createPortal(
        <AnimatePresence>
            <div className="login-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="login-modal-card compact-clean-card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Header */}
                    <div className="login-modal-header">
                        <TwinLabLogo size={32} showSubtitle={false} />
                        <div className="login-header-right">
                            {isFirebaseConfigured ? (
                                <span className="db-badge online" title="Cloud Firestore & Auth Active">
                                    <span className="db-pulse" />
                                    Cloud DB
                                </span>
                            ) : (
                                <span className="db-badge local" title="Running in Local Offline Mode">
                                    Local
                                </span>
                            )}
                            <button 
                                className="login-close-btn" 
                                onClick={onClose} 
                                type="button"
                                title="Close"
                            >
                                <i className="ri-close-line" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="login-tabs">
                        <button 
                            type="button"
                            className={`login-tab ${tab === "signin" ? "active" : ""}`}
                            onClick={() => { setTab("signin"); resetForm(); }}
                        >
                            <i className="ri-login-box-line" />
                            Sign In
                        </button>
                        <button 
                            type="button"
                            className={`login-tab ${tab === "signup" ? "active" : ""}`}
                            onClick={() => { setTab("signup"); resetForm(); }}
                        >
                            <i className="ri-user-add-line" />
                            Create Account
                        </button>
                        <button 
                            type="button"
                            className={`login-tab ${tab === "guest" ? "active" : ""}`}
                            onClick={() => { setTab("guest"); resetForm(); }}
                        >
                            <i className="ri-user-smile-line" />
                            Guest Account
                        </button>
                    </div>

                    {/* Guest Project Save Notice */}
                    {isGuest && activeProject?.name && tab !== "guest" && (
                        <div className="guest-project-save-banner">
                            <div className="guest-save-banner-icon">
                                <i className="ri-folder-shared-line" />
                            </div>
                            <div className="guest-save-banner-body">
                                <span className="guest-save-banner-title">
                                    Save Guest Project: <strong>"{activeProject.name}"</strong>
                                </span>
                                <span className="guest-save-banner-desc">
                                    Sign in or create an account to transfer this circuit to your permanent cloud vault.
                                </span>
                                <label className="guest-save-banner-toggle">
                                    <input 
                                        type="checkbox" 
                                        checked={saveGuestProject} 
                                        onChange={(e) => setSaveGuestProject(e.target.checked)} 
                                    />
                                    <span>Sync guest projects to my new account</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Feedback Messages */}
                    {errorMsg && (
                        <div className="login-feedback-banner error">
                            <i className="ri-error-warning-line" />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                    {successMsg && (
                        <div className="login-feedback-banner success">
                            <i className="ri-checkbox-circle-line" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {/* Tab 1: Sign In */}
                    {tab === "signin" && (
                        <form className="login-form" onSubmit={handleSignIn}>
                            <div className="login-field">
                                <label>Email Address</label>
                                <div className="login-input-wrap">
                                    <i className="ri-mail-line" />
                                    <input 
                                        type="email"
                                        placeholder="engineer@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Password</label>
                                <div className="login-input-wrap">
                                    <i className="ri-lock-2-line" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                                    </button>
                                </div>
                            </div>

                            <button 
                                className="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="ri-loader-4-line spin" />
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In to TwinLab</span>
                                        <i className="ri-arrow-right-line" />
                                    </>
                                )}
                            </button>

                            {isFirebaseConfigured && (
                                <>
                                    <div className="login-divider">
                                        <span>OR</span>
                                    </div>

                                    <button 
                                        className="google-auth-btn"
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                    >
                                        <i className="ri-google-fill" />
                                        <span>Continue with Google</span>
                                    </button>
                                </>
                            )}

                            <div className="login-switch-prompt">
                                <span>Don't have an account?</span>
                                <button type="button" onClick={() => { setTab("signup"); resetForm(); }}>
                                    Create Account
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 2: Create Account */}
                    {tab === "signup" && (
                        <form className="login-form" onSubmit={handleSignUp}>
                            <div className="login-field">
                                <label>Full Name</label>
                                <div className="login-input-wrap">
                                    <i className="ri-user-line" />
                                    <input 
                                        type="text"
                                        placeholder="Your Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Email Address</label>
                                <div className="login-input-wrap">
                                    <i className="ri-mail-line" />
                                    <input 
                                        type="email"
                                        placeholder="engineer@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Role / Specialization</label>
                                <div className="login-input-wrap select-wrap">
                                    <i className="ri-shield-user-line" />
                                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                                        <option value="Embedded Systems Dev">Embedded Systems Developer</option>
                                        <option value="IoT Firmware Engineer">IoT Firmware Engineer</option>
                                        <option value="Robotics Engineer">Robotics Engineer</option>
                                        <option value="Student / Hobbyist Maker">Student / Hobbyist Maker</option>
                                        <option value="Hardware Designer">Hardware Designer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Create Password</label>
                                <div className="login-input-wrap">
                                    <i className="ri-lock-2-line" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="At least 6 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button 
                                        type="button" 
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
                                    </button>
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Confirm Password</label>
                                <div className="login-input-wrap">
                                    <i className="ri-lock-password-line" />
                                    <input 
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Re-enter password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                className="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <i className="ri-loader-4-line spin" />
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account & Connect DB</span>
                                        <i className="ri-user-add-line" />
                                    </>
                                )}
                            </button>

                            <div className="login-switch-prompt">
                                <span>Already have an account?</span>
                                <button type="button" onClick={() => { setTab("signin"); resetForm(); }}>
                                    Sign In
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tab 3: Guest Account */}
                    {tab === "guest" && (
                        <div className="guest-mode-pane">
                            <div className="guest-icon-badge">
                                <i className="ri-user-smile-line" />
                            </div>
                            <h4>Continue as Guest</h4>
                            <p>
                                Access all breadboards, microcontrollers, components, and real-time physics simulations immediately. No registration or credentials required.
                            </p>
                            <div className="guest-feature-list">
                                <div className="guest-feature-item">
                                    <i className="ri-check-line" />
                                    <span>Full interactive hardware simulation</span>
                                </div>
                                <div className="guest-feature-item">
                                    <i className="ri-check-line" />
                                    <span>All MCUs (Arduino, ESP32, Pico) & Sensors</span>
                                </div>
                                <div className="guest-feature-item">
                                    <i className="ri-check-line" />
                                    <span>Export projects locally anytime</span>
                                </div>
                            </div>
                            <button 
                                className="login-submit-btn guest-btn" 
                                type="button" 
                                onClick={handleGuestLogin}
                                disabled={isLoading}
                            >
                                <span>Enter Workspace as Guest</span>
                                <i className="ri-arrow-right-line" />
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

export default LoginModal;
