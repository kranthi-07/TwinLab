import "./Oscilloscope.css";
import { useState, useRef, useEffect } from "react";
import { motion, useDragControls } from "framer-motion";

function Oscilloscope({
    isOpen = false,
    onClose,
    isSimulating = false,
    mcuStates = {},
    components = []
}) {
    const canvasRef = useRef(null);
    const dragControls = useDragControls();
    const [isRunning, setIsRunning] = useState(true);
    const [isCompact, setIsCompact] = useState(true); // Default to sleek, non-intrusive compact view
    const [isMinimized, setIsMinimized] = useState(false);
    const [timeDiv, setTimeDiv] = useState(100); // ms per division (e.g. 100ms)
    const [voltsDivCh1, setVoltsDivCh1] = useState(2); // 2V per division
    const [voltsDivCh2, setVoltsDivCh2] = useState(2);
    const [ch1Source, setCh1Source] = useState("mcu_d13");
    const [ch2Source, setCh2Source] = useState("buzzer");

    const [measurements, setMeasurements] = useState({
        vpp: "5.00V",
        vmax: "5.00V",
        freq: "1.00 Hz",
        duty: "50.0%"
    });

    // Real-time Waveform Canvas Loop
    useEffect(() => {
        if (!isOpen || isMinimized) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const cw = isCompact ? 380 : 540;
        const ch = isCompact ? 280 : 380;
        canvas.width = cw;
        canvas.height = ch;

        const ctx = canvas.getContext("2d");
        let animId;
        let timeOffset = 0;

        const render = () => {
            const width = canvas.width;
            const height = canvas.height;

            // 1. Dark phosphor CRT grid background
            ctx.fillStyle = "#02120e";
            ctx.fillRect(0, 0, width, height);

            // 2. Reticle Grid (10 horizontal divisions, 8 vertical divisions)
            ctx.strokeStyle = "rgba(16, 185, 129, 0.18)";
            ctx.lineWidth = 1;
            const divX = width / 10;
            const divY = height / 8;

            ctx.beginPath();
            for (let x = 0; x <= width; x += divX) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }
            for (let y = 0; y <= height; y += divY) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();

            // Center Major Crosshairs
            ctx.strokeStyle = "rgba(16, 185, 129, 0.38)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // 3. Render Channel 1 Waveform (Amber / Yellow #facc15)
            const ch1Values = [];
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 2.2;
            ctx.shadowColor = "#facc15";
            ctx.shadowBlur = 8;
            ctx.beginPath();

            const centerY = height * 0.45;
            const pxPerVolt1 = divY / voltsDivCh1;

            for (let x = 0; x < width; x++) {
                const t = (x + timeOffset) * (timeDiv / 40);
                let v = 0;

                if (isSimulating) {
                    if (ch1Source === "mcu_d13") {
                        // Square wave from Arduino Pin 13
                        v = Math.sin(t * 0.05) > 0 ? 5.0 : 0.0;
                    } else if (ch1Source === "strobe") {
                        v = Math.sin(t * 0.3) > 0 ? 5.0 : 0.0;
                    } else if (ch1Source === "dc_supply") {
                        v = 9.0;
                    } else {
                        v = 3.3;
                    }
                } else {
                    v = 0;
                }

                ch1Values.push(v);
                const y = centerY - v * pxPerVolt1;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 4. Render Channel 2 Waveform (Cyan #38bdf8)
            ctx.strokeStyle = "#38bdf8";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#38bdf8";
            ctx.shadowBlur = 6;
            ctx.beginPath();

            const centerY2 = height * 0.65;
            const pxPerVolt2 = divY / voltsDivCh2;

            for (let x = 0; x < width; x++) {
                const t = (x + timeOffset) * (timeDiv / 30);
                let v2 = 0;

                if (isSimulating) {
                    if (ch2Source === "buzzer") {
                        v2 = Math.sin(t * 0.15) * 2.5; // Audio acoustic waveform
                    } else if (ch2Source === "potentiometer") {
                        v2 = 2.5 + Math.sin(t * 0.02) * 1.5;
                    } else {
                        v2 = Math.sin(t * 0.05) > 0 ? 3.3 : 0.0;
                    }
                }

                const y2 = centerY2 - v2 * pxPerVolt2;
                if (x === 0) ctx.moveTo(x, y2);
                else ctx.lineTo(x, y2);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Advance time if running
            if (isRunning && isSimulating) {
                timeOffset += 2;
            }

            animId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animId);
    }, [isOpen, isRunning, timeDiv, voltsDivCh1, voltsDivCh2, ch1Source, ch2Source, isSimulating, isCompact, isMinimized]);

    if (!isOpen) return null;

    // 1. Minimized floating dock pill for distraction-free workspace
    if (isMinimized) {
        return (
            <motion.div 
                className="scope-minimized-pill"
                drag
                dragMomentum={false}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
            >
                <div className="pill-drag-grip" title="Drag to move">
                    <i className="ri-drag-move-fill"></i>
                </div>
                <i className="ri-line-chart-line scope-icon"></i>
                <span className="pill-title">DSO-200MHz</span>
                <span className={`pill-run-badge ${isRunning ? "run" : "stop"}`}>
                    {isRunning ? "RUN" : "STOP"}
                </span>
                <span className="pill-measurement">CH1: {measurements.vmax} • {measurements.freq}</span>
                <button 
                    className="scope-head-btn" 
                    onClick={() => setIsMinimized(false)}
                    title="Expand Oscilloscope"
                >
                    <i className="ri-fullscreen-line"></i>
                </button>
                <button 
                    className="scope-head-btn close" 
                    onClick={onClose}
                    title="Close Oscilloscope"
                >
                    <i className="ri-close-line"></i>
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div 
            className={`oscilloscope-floating-modal ${isCompact ? "compact-mode" : "expanded-mode"}`}
            drag
            dragControls={dragControls}
            dragListener={false}
            dragMomentum={false}
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
            {/* Scope Header (Draggable Handle) */}
            <div 
                className="scope-header"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="scope-title-wrap">
                    <div className="scope-drag-grip" title="Click and drag header to move scope">
                        <i className="ri-drag-move-fill"></i>
                    </div>
                    <i className="ri-line-chart-line scope-icon"></i>
                    <span className="scope-title">Oscilloscope</span>
                    <span className="scope-model">DSO-200MHz</span>
                </div>

                <div className="scope-header-actions">
                    {/* Minimize Button */}
                    <button 
                        className="scope-head-btn" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(true);
                        }}
                        title="Minimize to Floating Bar"
                    >
                        <i className="ri-subtract-line"></i>
                    </button>

                    {/* Compact / Expand Toggle */}
                    <button 
                        className="scope-head-btn" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsCompact(!isCompact);
                        }}
                        title={isCompact ? "Expand to Full Size" : "Compact Mode"}
                    >
                        <i className={isCompact ? "ri-expand-diagonal-line" : "ri-collapse-diagonal-line"}></i>
                    </button>

                    {/* Close Button */}
                    <button 
                        className="scope-head-btn close" 
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose && onClose();
                        }}
                        title="Close Scope"
                    >
                        <i className="ri-close-line"></i>
                    </button>
                </div>
            </div>

            {/* Scope Main Body: CRT Screen + Right Control Bench */}
            <div className="scope-body">
                {/* 1. CRT Waveform Display Screen */}
                <div className="scope-screen-bench">
                    <canvas 
                        ref={canvasRef} 
                        className="scope-crt-canvas" 
                    />
                    
                    {/* Screen On-Screen Display (OSD) Legend */}
                    <div className="scope-osd-overlay">
                        <div className="osd-ch1">
                            <span className="osd-badge ch1">CH1</span>
                            <span>{voltsDivCh1}V/div</span>
                        </div>
                        <div className="osd-ch2">
                            <span className="osd-badge ch2">CH2</span>
                            <span>{voltsDivCh2}V/div</span>
                        </div>
                        <div className="osd-time">
                            <span>M: {timeDiv}ms/div</span>
                        </div>
                        <div className={`osd-status ${isRunning ? "run" : "stop"}`}>
                            {isRunning ? "● RUN" : "❚❚ STOP"}
                        </div>
                    </div>
                </div>

                {/* 2. Side Control Bench */}
                <div className="scope-controls-bench">
                    {/* Run / Stop Button */}
                    <button 
                        className={`scope-run-btn ${isRunning ? "active" : "paused"}`}
                        onClick={() => setIsRunning(!isRunning)}
                    >
                        <i className={isRunning ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
                        <span>{isRunning ? "Freeze (STOP)" : "Resume (RUN)"}</span>
                    </button>

                    {/* Timebase (Time/Div) */}
                    <div className="scope-control-group">
                        <label className="ctrl-lbl">TIME / DIV</label>
                        <div className="scope-btn-row">
                            {[20, 50, 100, 200, 500].map(t => (
                                <button
                                    key={t}
                                    className={`scope-step-btn ${timeDiv === t ? "active" : ""}`}
                                    onClick={() => setTimeDiv(t)}
                                >
                                    {t >= 1000 ? `${t / 1000}s` : `${t}ms`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Channel 1 Controls */}
                    <div className="scope-channel-box ch1-box">
                        <div className="ch-header">
                            <span className="ch-tag ch1">CH1 Probe (Yellow)</span>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Source:</span>
                            <select 
                                className="scope-source-select"
                                value={ch1Source}
                                onChange={(e) => setCh1Source(e.target.value)}
                            >
                                <option value="mcu_d13">Arduino Pin 13 (PWM / Blink)</option>
                                <option value="strobe">Fast Strobe Clock</option>
                                <option value="dc_supply">9V Power Rail</option>
                            </select>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Volts/Div:</span>
                            <div className="scope-btn-row">
                                {[1, 2, 5].map(v => (
                                    <button
                                        key={v}
                                        className={`scope-step-btn ch1 ${voltsDivCh1 === v ? "active" : ""}`}
                                        onClick={() => setVoltsDivCh1(v)}
                                    >
                                        {v}V
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Channel 2 Controls */}
                    <div className="scope-channel-box ch2-box">
                        <div className="ch-header">
                            <span className="ch-tag ch2">CH2 Probe (Cyan)</span>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Source:</span>
                            <select 
                                className="scope-source-select"
                                value={ch2Source}
                                onChange={(e) => setCh2Source(e.target.value)}
                            >
                                <option value="buzzer">Piezo Buzzer (Acoustic)</option>
                                <option value="potentiometer">Potentiometer Wiper</option>
                                <option value="esp_d2">ESP32 Pin D2</option>
                            </select>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Volts/Div:</span>
                            <div className="scope-btn-row">
                                {[1, 2, 5].map(v => (
                                    <button
                                        key={v}
                                        className={`scope-step-btn ch2 ${voltsDivCh2 === v ? "active" : ""}`}
                                        onClick={() => setVoltsDivCh2(v)}
                                    >
                                        {v}V
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Real-Time Measurements Readout Bench */}
                    <div className="scope-measurements-bench">
                        <div className="meas-item">
                            <span className="m-lbl">Vpp:</span>
                            <span className="m-val">{isSimulating ? measurements.vpp : "0.00V"}</span>
                        </div>
                        <div className="meas-item">
                            <span className="m-lbl">Vmax:</span>
                            <span className="m-val">{isSimulating ? measurements.vmax : "0.00V"}</span>
                        </div>
                        <div className="meas-item">
                            <span className="m-lbl">Freq:</span>
                            <span className="m-val">{isSimulating ? (ch1Source === "strobe" ? "10.0 Hz" : "1.00 Hz") : "0.00 Hz"}</span>
                        </div>
                        <div className="meas-item">
                            <span className="m-lbl">Duty:</span>
                            <span className="m-val">{isSimulating ? "50.0%" : "0.0%"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Oscilloscope;
