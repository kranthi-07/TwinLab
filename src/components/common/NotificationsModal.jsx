import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./NotificationsModal.css";

const NOTIFICATIONS_STORAGE_KEY = "twinlab_read_notifications";

export const SESSION_UPDATES = [
    {
        id: "update-real-sim-preview",
        title: "Live Circuit Digital Twin Engine",
        tag: "ENGINE v2.5",
        date: "Today",
        unread: true,
        summary: "Active projects now render a real-time live interactive simulation preview directly beside the command deck.",
        details: "Live breadboard topologies, running current traces, illuminated LEDs, and actuator states display dynamically based on your actual project.",
        type: "simulation",
        color: "#10b981"
    },
    {
        id: "update-actuators-servo-sonar",
        title: "High-Precision Sensors & Actuators",
        tag: "HARDWARE",
        date: "Today",
        unread: true,
        summary: "SG90 Micro Servo (0°-180° rotation), HC-SR04 Ultrasonic (dual acoustic waves), and PIR Motion radar added with full realistic physics.",
        details: "Terminals align to standard breadboard pin pitches with complete component exterior highlight wrappers and instant component bar control.",
        type: "servo",
        color: "#00f0ff"
    },
    {
        id: "update-light-dark-themes",
        title: "Expanded Dark & Light Theme Suite",
        tag: "UI / UX",
        date: "Today",
        unread: true,
        summary: "Added crisp Nordic Daylight, Clean Laboratory, and Drafting Sand light themes alongside Cyber Neon and Tactical Matrix.",
        details: "Balanced contrast, removed excessive overglows, and ensured minimal floating islands in workspace without full-width bars.",
        type: "theme",
        color: "#ff8a00"
    },
    {
        id: "update-component-inspector",
        title: "Adaptive Multi-Row Component Bar",
        tag: "WORKSPACE",
        date: "Today",
        unread: true,
        summary: "16x2 and 20x4 LCD screens, battery packs, and sensors now wrap controls into clean multi-row layouts with zero clipping.",
        details: "Select any component by clicking directly on its realistic casing with immediate access to designator renaming and pin controls.",
        type: "inspector",
        color: "#a855f7"
    }
];

export function NotificationsModal({ isOpen, onClose, onUnreadChange }) {
    const [readIds, setReadIds] = useState(() => {
        try {
            const saved = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const markAllAsRead = () => {
        const allIds = SESSION_UPDATES.map(u => u.id);
        setReadIds(allIds);
        try {
            localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(allIds));
            window.dispatchEvent(new CustomEvent("twinlab:notifications_updated"));
        } catch (e) {}
        onUnreadChange && onUnreadChange(0);
    };

    const markSingleAsRead = (id) => {
        if (!readIds.includes(id)) {
            const updated = [...readIds, id];
            setReadIds(updated);
            try {
                localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
                window.dispatchEvent(new CustomEvent("twinlab:notifications_updated"));
            } catch (e) {}
            onUnreadChange && onUnreadChange(SESSION_UPDATES.length - updated.length);
        }
    };

    if (!isOpen) return null;

    const unreadCount = SESSION_UPDATES.filter(u => !readIds.includes(u.id)).length;

    return (
        <AnimatePresence>
            <div className="notif-dropdown-backdrop" onClick={onClose}>
                <motion.div 
                    className="notif-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.16 }}
                >
                    {/* Header */}
                    <div className="notif-header">
                        <div className="notif-header-title">
                            <i className="ri-notification-3-line" />
                            <span>System Updates & Changelog</span>
                            {unreadCount > 0 && (
                                <span className="notif-unread-pill font-mono">{unreadCount} New</span>
                            )}
                        </div>
                        <div className="notif-header-actions">
                            {unreadCount > 0 && (
                                <button type="button" className="notif-mark-all-btn" onClick={markAllAsRead}>
                                    Mark as read
                                </button>
                            )}
                            <button type="button" className="notif-close-btn" onClick={onClose}>
                                <i className="ri-close-line" />
                            </button>
                        </div>
                    </div>

                    {/* Updates List */}
                    <div className="notif-list">
                        {SESSION_UPDATES.map((item) => {
                            const isRead = readIds.includes(item.id);
                            return (
                                <div 
                                    key={item.id} 
                                    className={`notif-item ${isRead ? "read" : "unread"}`}
                                    onClick={() => markSingleAsRead(item.id)}
                                >
                                    <div className="notif-item-left">
                                        {/* Visual Simulation Thumbnail */}
                                        <div className="notif-sim-thumb" style={{ borderColor: `${item.color}40` }}>
                                            {item.type === "simulation" && (
                                                <svg viewBox="0 0 40 40" className="thumb-svg">
                                                    <rect x="6" y="10" width="28" height="20" rx="3" fill="#18181b" stroke="#3b82f6" strokeWidth="1.2" />
                                                    <circle cx="20" cy="20" r="5" fill="#10b981" />
                                                    <path d="M 6 20 L 15 20 M 25 20 L 34 20" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                                                </svg>
                                            )}
                                            {item.type === "servo" && (
                                                <svg viewBox="0 0 40 40" className="thumb-svg">
                                                    <rect x="8" y="12" width="24" height="20" rx="3" fill="#0284c7" />
                                                    <circle cx="20" cy="22" r="6" fill="#0369a1" />
                                                    <line x1="20" y1="22" x2="20" y2="8" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            )}
                                            {item.type === "theme" && (
                                                <svg viewBox="0 0 40 40" className="thumb-svg">
                                                    <circle cx="20" cy="20" r="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                                                    <path d="M 20 6 A 14 14 0 0 1 20 34 Z" fill="#0f172a" />
                                                </svg>
                                            )}
                                            {item.type === "inspector" && (
                                                <svg viewBox="0 0 40 40" className="thumb-svg">
                                                    <rect x="4" y="8" width="32" height="10" rx="2" fill="#1e293b" />
                                                    <rect x="4" y="22" width="32" height="10" rx="2" fill="#0284c7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>

                                    <div className="notif-item-content">
                                        <div className="notif-row-top">
                                            <span className="notif-tag font-mono" style={{ color: item.color }}>{item.tag}</span>
                                            <span className="notif-date">{item.date}</span>
                                        </div>
                                        <h4 className="notif-title">{item.title}</h4>
                                        <p className="notif-summary">{item.summary}</p>
                                        <p className="notif-details">{item.details}</p>
                                    </div>

                                    {!isRead && <span className="notif-unread-dot" />}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default NotificationsModal;
