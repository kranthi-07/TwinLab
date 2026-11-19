import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./WelcomeOverlay.css";

export default function WelcomeOverlay({ username = "Engineer", onComplete }) {
    const [isExiting, setIsExiting] = useState(false);
    const initialLetter = (username || "E").trim().charAt(0).toUpperCase();

    useEffect(() => {
        // Prevent background scrolling while welcome overlay is active
        document.body.classList.add("twinlab-welcome-active");

        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 1600);

        const doneTimer = setTimeout(() => {
            document.body.classList.remove("twinlab-welcome-active");
            if (onComplete) onComplete();
        }, 2100);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(doneTimer);
            document.body.classList.remove("twinlab-welcome-active");
        };
    }, [onComplete]);

    const handleSkip = () => {
        document.body.classList.remove("twinlab-welcome-active");
        if (onComplete) onComplete();
    };

    return (
        <AnimatePresence>
            {!isExiting && (
                <motion.div
                    className="twinlab-welcome-overlay"
                    onClick={handleSkip}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Futuristic Grid & Ambient Glow Backdrop */}
                    <div className="welcome-backdrop">
                        <div className="welcome-ambient-glow" />
                        <div className="welcome-grid-pattern" />
                        <div className="welcome-corner tl" />
                        <div className="welcome-corner tr" />
                        <div className="welcome-corner bl" />
                        <div className="welcome-corner br" />
                    </div>

                    {/* Central Welcome Card */}
                    <motion.div
                        className="welcome-card"
                        initial={{ opacity: 0, y: 24, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.04 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Glowing User Avatar Orb */}
                        <div className="welcome-orb-container">
                            <div className="welcome-orb-pulse" />
                            <div className="welcome-avatar-orb">
                                <span className="welcome-orb-letter">{initialLetter}</span>
                            </div>
                            <span className="welcome-status-dot" />
                        </div>

                        {/* Top Tech Tag */}
                        <div className="welcome-sys-tag font-mono">
                            <span className="tag-pulse" />
                            <span>SESSION AUTHENTICATED // TWINLAB X</span>
                        </div>

                        {/* Welcome Heading */}
                        <h1 className="welcome-heading">
                            Welcome, <span className="welcome-user-name">{username}</span>
                        </h1>

                        <p className="welcome-subtext">
                            Initializing workspace, telemetry engine & cloud vault...
                        </p>

                        {/* High-Tech Scanning Progress Bar */}
                        <div className="welcome-progress-track">
                            <motion.div 
                                className="welcome-progress-bar"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                            />
                        </div>

                        <span className="welcome-skip-hint font-mono">
                            CLICK ANYWHERE TO SKIP
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
