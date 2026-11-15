import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { TwinLabMark } from "./TwinLabLogo";
import "./IntroLoadingAnimation.css";

export default function IntroLoadingAnimation({ onComplete }) {
    // phase: "intro" (big logo) -> "sliding" (continuous slide out of Lab & Twin) -> "docking" (gliding to top-left) -> "done"
    const [phase, setPhase] = useState("intro");
    const [dockDeltas, setDockDeltas] = useState({ x: -400, y: -250, scale: 0.72 });
    const containerRef = useRef(null);

    // Calculate exact (deltaX, deltaY) from viewport center to top-left brand header
    const calculateDockTarget = () => {
        const brandEl = document.querySelector(".topbar .brand") || document.querySelector(".brand");
        const startCenterX = window.innerWidth * 0.5;
        const startCenterY = window.innerHeight * 0.44;

        if (brandEl) {
            const rect = brandEl.getBoundingClientRect();
            const targetCenterX = rect.left + rect.width / 2;
            const targetCenterY = rect.top + rect.height / 2;

            setDockDeltas({
                x: targetCenterX - startCenterX,
                y: targetCenterY - startCenterY,
                scale: 0.72
            });
        } else {
            setDockDeltas({
                x: -(startCenterX - 110),
                y: -(startCenterY - 44),
                scale: 0.72
            });
        }
    };

    useEffect(() => {
        document.body.classList.add("twinlab-intro-active");
        calculateDockTarget();
        window.addEventListener("resize", calculateDockTarget);

        return () => {
            document.body.classList.remove("twinlab-intro-active");
            window.removeEventListener("resize", calculateDockTarget);
        };
    }, []);

    // Continuous, Fluid Cinematic Timeline (No stopping between words)
    useEffect(() => {
        // 0.45s: Big logo presence -> Begin continuous outward slide of Lab and Twin
        const t1 = setTimeout(() => {
            setPhase("sliding");
        }, 450);

        // 2.5s: After full brand has smoothly assembled, glide to top-left header logo
        const t2 = setTimeout(() => {
            calculateDockTarget();
            setPhase("docking");
            // Reveal header logo right as the flying brand docks
            setTimeout(() => {
                document.body.classList.remove("twinlab-intro-active");
            }, 450);
        }, 2500);

        // 3.3s: Completed
        const t3 = setTimeout(() => {
            setPhase("done");
            if (onComplete) onComplete();
        }, 3300);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [onComplete]);

    // Skip on user click or keypress
    const handleSkip = () => {
        document.body.classList.remove("twinlab-intro-active");
        setPhase("done");
        if (onComplete) onComplete();
    };

    if (phase === "done") return null;

    const isSlidingOrLater = phase === "sliding" || phase === "docking";
    const isDocking = phase === "docking";

    return (
        <div 
            ref={containerRef}
            className={`twinlab-intro-overlay ${isDocking ? "docking-active" : ""}`}
            onClick={handleSkip}
            title="Click anywhere to skip intro"
        >
            {/* Clean, Premium Futuristic Backdrop (No loading bar) */}
            <div className="intro-backdrop">
                <div className="intro-grid-pattern" />
                <div className="intro-vignette" />
            </div>

            {/* Minimalist Futuristic Corner Crosshairs */}
            <div className="intro-simple-hud">
                <div className="hud-corner-mark top-left font-mono">
                    <span className="hud-plus">+</span>
                    <span>TWINLAB-X // CORE v2.5</span>
                </div>
                <div className="hud-corner-mark top-right font-mono">
                    <span>40.00 MHz // BUS READY</span>
                    <span className="hud-plus">+</span>
                </div>
                <div className="hud-corner-mark bottom-left font-mono">
                    <span className="hud-plus">+</span>
                    <span>SPICE // HARDWARE TWIN</span>
                </div>
                <div className="hud-corner-mark bottom-right font-mono">
                    <span>RP2040 • ESP32 • AVR</span>
                    <span className="hud-plus">+</span>
                </div>
            </div>

            {/* Statically Centered Stage */}
            <div className="intro-center-stage">
                {/* Flying Brand Container: Translates linearly to top-left when docking */}
                <motion.div
                    className="intro-flying-brand"
                    initial={{ x: 0, y: 0, scale: 1, opacity: 0 }}
                    animate={
                        isDocking
                            ? {
                                  x: dockDeltas.x,
                                  y: dockDeltas.y,
                                  scale: dockDeltas.scale,
                                  opacity: 0,
                                  transition: {
                                      duration: 0.72,
                                      ease: [0.16, 1, 0.3, 1]
                                  }
                              }
                            : {
                                  x: 0,
                                  y: 0,
                                  scale: 1,
                                  opacity: 1,
                                  transition: {
                                      duration: 0.5,
                                      ease: "easeOut"
                                  }
                              }
                    }
                >
                    <div className="intro-brand-wrapper">
                        {/* 1. "Twin": Slides smoothly out to the left from behind "Lab" */}
                        <motion.div
                            className="intro-word-slide word-twin"
                            initial={{ maxWidth: 0, opacity: 0, x: 45, filter: "blur(4px)" }}
                            animate={{
                                maxWidth: isSlidingOrLater ? 130 : 0,
                                opacity: isSlidingOrLater ? 1 : 0,
                                x: isSlidingOrLater ? 0 : 45,
                                filter: isSlidingOrLater ? "blur(0px)" : "blur(4px)"
                            }}
                            transition={{ 
                                duration: 1.35,
                                delay: 0.22, // Cascades smoothly right as Lab slides out
                                ease: [0.16, 1, 0.3, 1] 
                            }}
                        >
                            <span className="brand-twin">Twin</span>
                        </motion.div>

                        {/* 2. "Lab": Slides smoothly out to the left from behind the Logo */}
                        <motion.div
                            className="intro-word-slide word-lab"
                            initial={{ maxWidth: 0, opacity: 0, x: 35, filter: "blur(3px)" }}
                            animate={{
                                maxWidth: isSlidingOrLater ? 115 : 0,
                                opacity: isSlidingOrLater ? 1 : 0,
                                x: isSlidingOrLater ? 0 : 35,
                                filter: isSlidingOrLater ? "blur(0px)" : "blur(3px)"
                            }}
                            transition={{ 
                                duration: 1.25,
                                delay: 0.04, // Starts sliding out immediately
                                ease: [0.16, 1, 0.3, 1] 
                            }}
                        >
                            <span className="brand-lab">Lab</span>
                        </motion.div>

                        {/* 3. Logo Mark: Starts BIG (scale 2.2), smoothly scales down and anchors as X */}
                        <motion.div
                            className={`intro-logo-slot ${isSlidingOrLater ? "locked-as-x" : ""}`}
                            initial={{ scale: 2.2, opacity: 0, filter: "blur(6px)" }}
                            animate={{ 
                                scale: isSlidingOrLater ? 1.0 : 2.2, 
                                opacity: 1, 
                                filter: "blur(0px)" 
                            }}
                            transition={{ 
                                duration: 1.45, 
                                ease: [0.16, 1, 0.3, 1] 
                            }}
                        >
                            <div className="intro-mark-glow-pulse" />
                            <div className="intro-mark-core-spark" />
                            <TwinLabMark 
                                size={52} 
                                className="intro-twinlab-mark" 
                            />
                        </motion.div>
                    </div>

                    {/* Simple Futuristic Subtitle (fades in as brand completes) */}
                    <motion.div 
                        className="intro-simple-badge font-mono"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ 
                            opacity: isSlidingOrLater && !isDocking ? 1 : 0,
                            y: isSlidingOrLater && !isDocking ? 0 : 6
                        }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        DIGITAL TWIN HARDWARE PLATFORM
                    </motion.div>
                </motion.div>
            </div>

            {/* Click to Skip Hint */}
            <div className="intro-skip-hint font-mono">
                CLICK TO SKIP
            </div>
        </div>
    );
}
