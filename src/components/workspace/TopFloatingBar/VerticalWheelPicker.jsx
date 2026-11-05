import "./VerticalWheelPicker.css";
import { useRef, useEffect, useState, useCallback } from "react";

const ITEM_HEIGHT = 24; // 24px per row
const VISIBLE_COUNT = 3; // 3 visible items (top faded, center active, bottom faded)

function VerticalWheelPicker({
    items = [],
    value,
    onChange,
    label
}) {
    const viewportRef = useRef(null);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    // Find current index matching value
    const normalizeVal = (v) => String(v ?? "").toLowerCase().replace(/[^0-9a-z.]/g, "");
    const targetNorm = normalizeVal(value);

    let currentIndex = items.findIndex((it) => normalizeVal(it) === targetNorm);
    if (currentIndex < 0) currentIndex = 0;

    const [activeIndex, setActiveIndex] = useState(currentIndex);

    // Sync scroll position when value changes from outside
    useEffect(() => {
        if (!isUserScrollingRef.current && viewportRef.current) {
            setActiveIndex(currentIndex);
            viewportRef.current.scrollTop = currentIndex * ITEM_HEIGHT;
        }
    }, [currentIndex]);

    // Handle scroll snapping & center detection
    const handleScroll = useCallback(() => {
        if (!viewportRef.current) return;
        isUserScrollingRef.current = true;

        const scrollTop = viewportRef.current.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, index));

        if (clampedIndex !== activeIndex) {
            setActiveIndex(clampedIndex);
            onChange && onChange(items[clampedIndex]);
        }

        // Reset user scrolling flag after debounce
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            // Snap cleanly to nearest integer row
            if (viewportRef.current) {
                viewportRef.current.scrollTo({
                    top: clampedIndex * ITEM_HEIGHT,
                    behavior: "smooth"
                });
            }
        }, 120);
    }, [items, activeIndex, onChange]);

    // Click item to center & select
    const handleItemClick = (idx) => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({
                top: idx * ITEM_HEIGHT,
                behavior: "smooth"
            });
        }
        setActiveIndex(idx);
        onChange && onChange(items[idx]);
    };

    return (
        <div className="wheel-picker-wrapper">
            {label && <span className="wheel-picker-label">{label}</span>}
            
            <div className="wheel-picker-box">
                {/* Center selection indicator highlight bar */}
                <div className="wheel-center-glass-bar"></div>

                {/* Vertical scrolling drum list */}
                <div 
                    className="wheel-viewport" 
                    ref={viewportRef} 
                    onScroll={handleScroll}
                >
                    {/* Top spacer (1 item height so first item can land in center) */}
                    <div className="wheel-spacer" style={{ height: ITEM_HEIGHT }}></div>

                    {items.map((item, idx) => {
                        const dist = Math.abs(idx - activeIndex);
                        const isCenter = dist === 0;

                        return (
                            <div
                                key={String(item) + idx}
                                className={`wheel-item ${isCenter ? "active-center" : dist === 1 ? "faded-near" : "faded-far"}`}
                                style={{ height: ITEM_HEIGHT }}
                                onClick={() => handleItemClick(idx)}
                            >
                                <span className="wheel-item-text">{item}</span>
                            </div>
                        );
                    })}

                    {/* Bottom spacer (1 item height so last item can land in center) */}
                    <div className="wheel-spacer" style={{ height: ITEM_HEIGHT }}></div>
                </div>
            </div>
        </div>
    );
}

export default VerticalWheelPicker;
