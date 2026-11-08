import { useState } from "react";
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
        }, 300);
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
        }, 300);
    };

    const handleDemoLogin = () => {
        setIsLoading(true);
        setTimeout(() => {
            const user = authService.loginDemo();
            setIsLoading(false);
            onLoginSuccess && onLoginSuccess(user);
            onClose && onClose();
        }, 250);
    };

    const handleGuestLogin = () => {
        const user = authService.loginAsGuest();
        onLoginSuccess && onLoginSuccess(user);
        onClose && onClose();
    };

    return (
        <AnimatePresence>
            <div className="login-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="login-modal-card"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Header */}
                    <div className="login-modal-header">
                        <TwinLabLogo size={36} showSubtitle={false} />
                        <button className="login-close-btn" onClick={onClose} type="button">
                            <i className="ri-close-line" />
                        </button>
                    </div>

                    {/* Subtitle */}
                    <div className="login-title-wrap">
                        <h3>Welcome to TwinLab X</h3>
                        <p>Simulate hardware circuits and save projects to the cloud</p>
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
                                <label>Email Address</label>
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
                                {isLoading ? (
                                    <span>Connecting to Cloud...</span>
                                ) : (
                                    <>
                                        <span>Sign In with Cloud</span>
                                        <i className="ri-arrow-right-line" />
                                    </>
                                )}
                            </button>

                            <div className="login-divider">
                                <span>OR</span>
                            </div>

                            {/* One-click Demo Button */}
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
                                <label>Email Address</label>
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
                                <label>Developer Role</label>
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
                                {isLoading ? (
                                    <span>Creating Account...</span>
                                ) : (
                                    <>
                                        <span>Create Free Cloud Account</span>
                                        <i className="ri-user-add-line" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Tab 3: Guest Mode */}
                    {tab === "guest" && (
                        <div className="guest-mode-pane">
                            <div className="guest-icon-badge">
                                <i className="ri-user-smile-line" />
                            </div>
                            <h4>Continue as Guest Engineer</h4>
                            <p>
                                Access all breadboards, microcontrollers, real-time circuit simulation, 
                                and code editing without creating an account.
                            </p>
                            <div className="guest-perks">
                                <div className="perk-item">
                                    <i className="ri-check-line" />
                                    <span>Instant simulation access with zero wait</span>
                                </div>
                                <div className="perk-item">
                                    <i className="ri-check-line" />
                                    <span>Local browser storage for projects</span>
                                </div>
                                <div className="perk-item">
                                    <i className="ri-check-line" />
                                    <span>Upgrade to Cloud Account anytime with one click</span>
                                </div>
                            </div>
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
        </AnimatePresence>
    );
}

export default LoginModal;
