import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import authService from "../../services/authService";
import { TwinLabLogo } from "../common/TwinLabLogo";
import "./LoginModal.css";

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
    const [tab, setTab] = useState("signin"); // "signin" | "signup" | "guest"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("Embedded Systems Dev");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

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

    const handleSignIn = async (e) => {
        e && e.preventDefault();
        setErrorMsg("");
        if (!email) {
            setErrorMsg("Please enter your email address");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const user = authService.login(email, password);
            setIsLoading(false);
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        }, 200);
    };

    const handleSignUp = async (e) => {
        e && e.preventDefault();
        setErrorMsg("");
        if (!email || !name) {
            setErrorMsg("Please enter your name and email");
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const user = authService.signup({ name, email, password, role });
            setIsLoading(false);
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        }, 200);
    };

    const handleDemoLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            const user = authService.loginDemo();
            setIsLoading(false);
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        }, 200);
    };

    const handleGuestLogin = () => {
        const user = authService.loginAsGuest();
        onLoginSuccess && onLoginSuccess(user);
        onClose && onClose();
    };

    return createPortal(
        <AnimatePresence>
            <div className="login-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="login-modal-card compact-clean-card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.18 }}
                >
                    {/* Header */}
                    <div className="login-modal-header">
                        <TwinLabLogo size={32} showSubtitle={false} />
                        <button 
                            className="login-close-btn" 
                            onClick={onClose} 
                            type="button"
                            title="Close"
                        >
                            <i className="ri-close-line" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="login-tabs">
                        <button 
                            type="button"
                            className={`login-tab ${tab === "signin" ? "active" : ""}`}
                            onClick={() => { setTab("signin"); setErrorMsg(""); }}
                        >
                            Sign In
                        </button>
                        <button 
                            type="button"
                            className={`login-tab ${tab === "signup" ? "active" : ""}`}
                            onClick={() => { setTab("signup"); setErrorMsg(""); }}
                        >
                            Create Account
                        </button>
                        <button 
                            type="button"
                            className={`login-tab ${tab === "guest" ? "active" : ""}`}
                            onClick={() => { setTab("guest"); setErrorMsg(""); }}
                        >
                            Guest Mode
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="login-error-banner">
                            <i className="ri-error-warning-line" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Tab 1: Sign In */}
                    {tab === "signin" && (
                        <form className="login-form" onSubmit={handleSignIn}>
                            <div className="login-field">
                                <label>Email</label>
                                <div className="login-input-wrap">
                                    <i className="ri-mail-line" />
                                    <input 
                                        type="email"
                                        placeholder="engineer@twinlab.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <div className="login-label-row">
                                    <label>Password</label>
                                    <span className="login-hint">Optional for demo</span>
                                </div>
                                <div className="login-input-wrap">
                                    <i className="ri-lock-2-line" />
                                    <input 
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                className="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                <span>{isLoading ? "Signing In..." : "Sign In with Cloud"}</span>
                                <i className="ri-arrow-right-line" />
                            </button>

                            <div className="login-divider">
                                <span>OR</span>
                            </div>

                            <button 
                                className="demo-account-btn"
                                type="button"
                                onClick={handleDemoLogin}
                                disabled={isLoading}
                            >
                                <i className="ri-flashlight-line" />
                                <span>⚡ Quick Demo Account Login (Alex Rivera)</span>
                            </button>
                        </form>
                    )}

                    {/* Tab 2: Create Account */}
                    {tab === "signup" && (
                        <form className="login-form" onSubmit={handleSignUp}>
                            <div className="login-field">
                                <label>Your Name</label>
                                <div className="login-input-wrap">
                                    <i className="ri-user-line" />
                                    <input 
                                        type="text"
                                        placeholder="Alex Rivera"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Work Email</label>
                                <div className="login-input-wrap">
                                    <i className="ri-mail-line" />
                                    <input 
                                        type="email"
                                        placeholder="alex@twinlab.io"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="login-field">
                                <label>Role</label>
                                <div className="login-input-wrap select-wrap">
                                    <i className="ri-shield-user-line" />
                                    <select value={role} onChange={(e) => setRole(e.target.value)}>
                                        <option value="Embedded Systems Dev">Embedded Systems Developer</option>
                                        <option value="IoT Firmware Engineer">IoT Firmware Engineer</option>
                                        <option value="Robotics Engineer">Robotics Engineer</option>
                                        <option value="Student / Hobbyist Maker">Student / Hobbyist Maker</option>
                                    </select>
                                </div>
                            </div>

                            <button 
                                className="login-submit-btn" 
                                type="submit" 
                                disabled={isLoading}
                            >
                                <span>{isLoading ? "Creating..." : "Create Free Account"}</span>
                                <i className="ri-user-add-line" />
                            </button>
                        </form>
                    )}

                    {/* Tab 3: Guest Mode */}
                    {tab === "guest" && (
                        <div className="guest-mode-pane">
                            <div className="guest-icon-badge">
                                <i className="ri-user-smile-line" />
                            </div>
                            <h4>Continue as Guest</h4>
                            <p>
                                Access all breadboards, microcontrollers, and real-time simulation without an account.
                            </p>
                            <button 
                                className="login-submit-btn guest-btn" 
                                type="button" 
                                onClick={handleGuestLogin}
                            >
                                <span>Continue in Guest Mode</span>
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
