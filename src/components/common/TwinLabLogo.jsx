import React from "react";
import "./TwinLabLogo.css";

export function TwinLabMark({ size = 38, className = "" }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 48 48" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`twinlab-logo-mark ${className}`}
        >
            <defs>
                <linearGradient id="twinCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
                <linearGradient id="twinOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffb020" />
                    <stop offset="100%" stopColor="#ff5500" />
                </linearGradient>
                <filter id="twinGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Hexagon Cyber Frame */}
            <path 
                d="M 24 4 L 41 14 L 41 34 L 24 44 L 7 34 L 7 14 Z" 
                fill="#0b111c" 
                stroke="rgba(255, 255, 255, 0.12)" 
                strokeWidth="1.5" 
            />

            {/* Left Hardware Node & Trace (Cyan) */}
            <path 
                d="M 12 18 L 18 24 L 12 30" 
                stroke="url(#twinCyan)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <circle cx="12" cy="18" r="2.5" fill="#38bdf8" filter="url(#twinGlow)" />
            <circle cx="12" cy="30" r="2.5" fill="#38bdf8" filter="url(#twinGlow)" />

            {/* Central Synchronized Digital Twin Nexus */}
            <path 
                d="M 18 24 Q 24 20 30 24" 
                stroke="url(#twinCyan)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeDasharray="2 2"
            />
            <path 
                d="M 18 24 Q 24 28 30 24" 
                stroke="url(#twinOrange)" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeDasharray="2 2"
            />

            {/* Glowing Core Quantum Dot */}
            <circle cx="24" cy="24" r="3.2" fill="#ffffff" filter="url(#twinGlow)" />
            <circle cx="24" cy="24" r="1.8" fill="#ff8a00" />

            {/* Right Digital Twin Node & Trace (Orange) */}
            <path 
                d="M 36 18 L 30 24 L 36 30" 
                stroke="url(#twinOrange)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
            />
            <circle cx="36" cy="18" r="2.5" fill="#ff8a00" filter="url(#twinGlow)" />
            <circle cx="36" cy="30" r="2.5" fill="#ff8a00" filter="url(#twinGlow)" />
        </svg>
    );
}

export function TwinLabLogo({ 
    size = 38, 
    showSubtitle = true, 
    className = "",
    onClick 
}) {
    return (
        <div 
            className={`twinlab-brand-container ${className}`} 
            onClick={onClick}
            style={{ cursor: onClick ? "pointer" : "default" }}
        >
            <TwinLabMark size={size} />
            <div className="twinlab-brand-text">
                <div className="twinlab-brand-title">
                    <span className="brand-twin">Twin</span>
                    <span className="brand-lab">Lab</span>
                    <span className="brand-x">X</span>
                </div>
                {showSubtitle && (
                    <span className="twinlab-brand-subtitle">Digital Twin Studio</span>
                )}
            </div>
        </div>
    );
}

export default TwinLabLogo;
