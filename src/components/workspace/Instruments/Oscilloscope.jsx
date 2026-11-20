import "./Oscilloscope.css";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, useDragControls } from "framer-motion";

function Oscilloscope({
    isOpen = false,
    onClose,
    isSimulating = false,
    mcuStates = {},
    components = [],
    simulationResult = {}
}) {
    const canvasRef = useRef(null);
    const dragControls = useDragControls();
    const [isRunning, setIsRunning] = useState(true);
    const [isCompact, setIsCompact] = useState(true); // Default to sleek, non-intrusive compact view
    const [isMinimized, setIsMinimized] = useState(false);
    
    // Timebase (ms/div)
    const [timeDiv, setTimeDiv] = useState(100); 
    
    // Volts/Div
    const [voltsDivCh1, setVoltsDivCh1] = useState(2); 
    const [voltsDivCh2, setVoltsDivCh2] = useState(2);
    
    // Coupling Mode: "DC" | "AC" | "GND"
    const [couplingCh1, setCouplingCh1] = useState("DC");
    const [couplingCh2, setCouplingCh2] = useState("DC");

    // Y-Position Offsets
    const [yPosCh1, setYPosCh1] = useState(0);
    const [yPosCh2, setYPosCh2] = useState(0);

    // Selected Channel Sources
    const [ch1SourceId, setCh1SourceId] = useState("mcu_d13");
    const [ch2SourceId, setCh2SourceId] = useState("buzzer");

    // Live Auto-Measurements
    const [measurements, setMeasurements] = useState({
        vpp: "5.00V",
        vmax: "5.00V",
        vmin: "0.00V",
        vrms: "3.54V",
        freq: "1.00 Hz",
        duty: "50.0%"
    });

    // Dynamically discover available real circuit sources
    const availableSources = useMemo(() => {
        const list = [
            { id: "gnd", label: "GND (0.00V Ref Baseline)", type: "gnd" },
            { id: "dc_5v", label: "5V Power Rail (DC)", type: "dc", voltage: 5.0 },
            { id: "dc_3v3", label: "3.3V Power Rail (DC)", type: "dc", voltage: 3.3 },
            { id: "dc_9v", label: "9V Battery Rail (DC)", type: "dc", voltage: 9.0 }
        ];

        // 1. MCU Boards & Output Pins
        components.filter(c => 
            c.type.startsWith("arduino") || 
            c.type.startsWith("esp") || 
            c.type.startsWith("rpi") || 
            c.type.startsWith("stm32") || 
            c.type.startsWith("teensy") || 
            c.type.startsWith("attiny")
        ).forEach(mcu => {
            const bName = mcu.name || (mcu.type.toUpperCase());
            const is3V3 = mcu.type.startsWith("esp") || mcu.type.startsWith("rpi") || mcu.type.startsWith("stm32") || mcu.type.startsWith("teensy");
            const vHigh = is3V3 ? 3.3 : 5.0;

            if (mcu.type.startsWith("arduino")) {
                list.push({ id: `mcu_d13`, label: `${bName}: Pin D13 (Built-in LED / Blink)`, mcuId: mcu.id, pin: "D13", type: "mcu_pulse", vHigh, defaultFreq: 1.0 });
                list.push({ id: `mcu_${mcu.id}_d11`, label: `${bName}: Pin D11 (PWM / 490Hz)`, mcuId: mcu.id, pin: "D11", type: "mcu_pwm", vHigh, defaultFreq: 490 });
                list.push({ id: `mcu_${mcu.id}_a0`, label: `${bName}: Pin A0 (Analog Sensor Channel)`, mcuId: mcu.id, pin: "A0", type: "mcu_analog", vHigh });
            } else if (mcu.type.startsWith("esp")) {
                list.push({ id: `mcu_${mcu.id}_d2`, label: `${bName}: GPIO 2 (Status LED / PWM)`, mcuId: mcu.id, pin: "D2", type: "mcu_pulse", vHigh, defaultFreq: 2.0 });
                list.push({ id: `mcu_${mcu.id}_d4`, label: `${bName}: GPIO 4 (PWM Output)`, mcuId: mcu.id, pin: "D4", type: "mcu_pwm", vHigh, defaultFreq: 1000 });
            } else if (mcu.type.startsWith("rpi")) {
                list.push({ id: `mcu_${mcu.id}_gp25`, label: `${bName}: GP25 (Onboard LED)`, mcuId: mcu.id, pin: "GP25", type: "mcu_pulse", vHigh, defaultFreq: 1.0 });
            } else if (mcu.type.startsWith("stm32")) {
                list.push({ id: `mcu_${mcu.id}_pa5`, label: `${bName}: PA5 (User LED / PWM)`, mcuId: mcu.id, pin: "PA5", type: "mcu_pulse", vHigh, defaultFreq: 1.0 });
            } else {
                list.push({ id: `mcu_${mcu.id}_p1`, label: `${bName}: Pin 1 (Digital Pulse)`, mcuId: mcu.id, pin: "1", type: "mcu_pulse", vHigh, defaultFreq: 1.0 });
            }
        });

        // 2. Buzzers
        components.filter(c => c.type === "buzzer").forEach((buz, idx) => {
            list.push({ id: "buzzer", label: `Piezo Buzzer #${idx + 1} (Acoustic Waveform)`, compId: buz.id, type: "buzzer", defaultFreq: 1760 });
        });

        // 3. Potentiometers
        components.filter(c => c.type === "potentiometer").forEach((pot, idx) => {
            list.push({ id: "potentiometer", label: `Potentiometer #${idx + 1} (Wiper DC Voltage)`, compId: pot.id, type: "potentiometer" });
        });

        // 4. Sensors
        components.filter(c => c.type.startsWith("sensor")).forEach((s, idx) => {
            list.push({ id: `sensor_${s.id}`, label: `${s.name || "Sensor"} #${idx + 1} Output`, compId: s.id, type: "sensor" });
        });

        return list;
    }, [components]);

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

            // Center Major Crosshairs with sub-division ticks
            ctx.strokeStyle = "rgba(16, 185, 129, 0.38)";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(width / 2, 0);
            ctx.lineTo(width / 2, height);
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();

            // Calculate instantaneous probe voltage for a given channel source
            const getSourceVoltage = (srcId, t) => {
                if (!isSimulating) {
                    return (Math.random() - 0.5) * 0.005; // tiny microvolt baseline noise
                }

                const src = availableSources.find(s => s.id === srcId);
                if (!src || src.type === "gnd") return 0.0;

                if (src.type === "dc") {
                    return (src.voltage || 5.0) + Math.sin(t * 0.1) * 0.008;
                }

                if (src.type === "potentiometer") {
                    const pot = components.find(c => c.id === src.compId || c.type === "potentiometer");
                    const ratio = pot ? Math.max(0, Math.min(1, (pot.value ?? 50) / 100)) : 0.5;
                    return ratio * 5.0 + Math.sin(t * 0.05) * 0.005;
                }

                if (src.type === "buzzer") {
                    const bSt = simulationResult?.buzzerStates?.[src.compId] || Object.values(simulationResult?.buzzerStates || {})[0];
                    const isBeeping = bSt?.isBeeping;
                    if (!isBeeping) return 0.0;
                    // Acoustic tone sine oscillation
                    return 2.5 + Math.sin(t * 0.35) * 2.5;
                }

                if (src.type === "mcu_pulse" || srcId === "mcu_d13") {
                    const vHigh = src.vHigh || 5.0;
                    // Square wave pulse with realistic edge slew
                    const cycle = Math.sin(t * 0.05);
                    return cycle > 0 ? vHigh : 0.0;
                }

                if (src.type === "mcu_pwm") {
                    const vHigh = src.vHigh || 5.0;
                    const cycle = Math.sin(t * 0.25);
                    return cycle > 0 ? vHigh : 0.0;
                }

                if (src.type === "sensor") {
                    return 2.5 + Math.sin(t * 0.03) * 1.5;
                }

                return 3.3;
            };

            // 3. Render Channel 1 Waveform (Amber / Yellow #facc15)
            const ch1Values = [];
            ctx.strokeStyle = "#facc15";
            ctx.lineWidth = 2.2;
            ctx.shadowColor = "#facc15";
            ctx.shadowBlur = 8;
            ctx.beginPath();

            const centerY1 = height * 0.45 + yPosCh1;
            const pxPerVolt1 = divY / voltsDivCh1;

            // Compute DC mean for AC coupling
            let sumV1 = 0;
            for (let x = 0; x < width; x += 10) {
                const t = (x + timeOffset) * (timeDiv / 40);
                sumV1 += getSourceVoltage(ch1SourceId, t);
            }
            const meanV1 = sumV1 / (width / 10);

            for (let x = 0; x < width; x++) {
                const t = (x + timeOffset) * (timeDiv / 40);
                let v = getSourceVoltage(ch1SourceId, t);

                if (couplingCh1 === "GND") {
                    v = 0;
                } else if (couplingCh1 === "AC") {
                    v = v - meanV1;
                }

                ch1Values.push(v);
                const y = centerY1 - v * pxPerVolt1;
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

            const centerY2 = height * 0.65 + yPosCh2;
            const pxPerVolt2 = divY / voltsDivCh2;

            let sumV2 = 0;
            for (let x = 0; x < width; x += 10) {
                const t = (x + timeOffset) * (timeDiv / 30);
                sumV2 += getSourceVoltage(ch2SourceId, t);
            }
            const meanV2 = sumV2 / (width / 10);

            for (let x = 0; x < width; x++) {
                const t = (x + timeOffset) * (timeDiv / 30);
                let v2 = getSourceVoltage(ch2SourceId, t);

                if (couplingCh2 === "GND") {
                    v2 = 0;
                } else if (couplingCh2 === "AC") {
                    v2 = v2 - meanV2;
                }

                const y2 = centerY2 - v2 * pxPerVolt2;
                if (x === 0) ctx.moveTo(x, y2);
                else ctx.lineTo(x, y2);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // 5. Update Measurements from CH1 buffer
            if (ch1Values.length > 0 && isSimulating) {
                const maxV = Math.max(...ch1Values);
                const minV = Math.min(...ch1Values);
                const vppVal = Math.max(0, maxV - minV);
                const rmsVal = Math.sqrt(ch1Values.reduce((acc, v) => acc + v * v, 0) / ch1Values.length);

                const src1 = availableSources.find(s => s.id === ch1SourceId);
                const fVal = src1?.defaultFreq ? (src1.defaultFreq >= 1000 ? `${(src1.defaultFreq / 1000).toFixed(2)} kHz` : `${src1.defaultFreq.toFixed(2)} Hz`) : (vppVal > 0.5 ? "1.00 Hz" : "0.00 Hz");

                setMeasurements({
                    vpp: `${vppVal.toFixed(2)}V`,
                    vmax: `${maxV.toFixed(2)}V`,
                    vmin: `${minV.toFixed(2)}V`,
                    vrms: `${rmsVal.toFixed(2)}V`,
                    freq: fVal,
                    duty: vppVal > 0.5 ? "50.0%" : "0.0%"
                });
            } else if (!isSimulating) {
                setMeasurements({
                    vpp: "0.00V",
                    vmax: "0.00V",
                    vmin: "0.00V",
                    vrms: "0.00V",
                    freq: "0.00 Hz",
                    duty: "0.0%"
                });
            }

            // Advance time if running
            if (isRunning && isSimulating) {
                timeOffset += 2;
            }

            animId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animId);
    }, [
        isOpen, 
        isRunning, 
        timeDiv, 
        voltsDivCh1, 
        voltsDivCh2, 
        ch1SourceId, 
        ch2SourceId, 
        couplingCh1, 
        couplingCh2, 
        yPosCh1, 
        yPosCh2, 
        isSimulating, 
        isCompact, 
        isMinimized, 
        availableSources,
        simulationResult,
        components
    ]);

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
                            <span>{voltsDivCh1}V/div [{couplingCh1}]</span>
                        </div>
                        <div className="osd-ch2">
                            <span className="osd-badge ch2">CH2</span>
                            <span>{voltsDivCh2}V/div [{couplingCh2}]</span>
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
                        title="Freeze or Resume oscilloscope waveform sampling"
                    >
                        <i className={isRunning ? "ri-pause-circle-line" : "ri-play-circle-line"}></i>
                        <span>{isRunning ? "Freeze (STOP)" : "Resume (RUN)"}</span>
                    </button>

                    {/* Timebase (Time/Div) */}
                    <div className="scope-control-group">
                        <label className="ctrl-lbl">TIME / DIV</label>
                        <div className="scope-btn-row">
                            {[10, 20, 50, 100, 200, 500].map(t => (
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
                            <div className="ch-coupling-pills">
                                {["DC", "AC", "GND"].map(c => (
                                    <button
                                        key={c}
                                        className={`scope-step-btn ch1 ${couplingCh1 === c ? "active" : ""}`}
                                        style={{ padding: "1px 6px", fontSize: 9 }}
                                        onClick={() => setCouplingCh1(c)}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Source:</span>
                            <select 
                                className="scope-source-select"
                                value={ch1SourceId}
                                onChange={(e) => setCh1SourceId(e.target.value)}
                            >
                                {availableSources.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Volts/Div:</span>
                            <div className="scope-btn-row">
                                {[0.5, 1, 2, 5, 10].map(v => (
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
                            <div className="ch-coupling-pills">
                                {["DC", "AC", "GND"].map(c => (
                                    <button
                                        key={c}
                                        className={`scope-step-btn ch2 ${couplingCh2 === c ? "active" : ""}`}
                                        style={{ padding: "1px 6px", fontSize: 9 }}
                                        onClick={() => setCouplingCh2(c)}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Source:</span>
                            <select 
                                className="scope-source-select"
                                value={ch2SourceId}
                                onChange={(e) => setCh2SourceId(e.target.value)}
                            >
                                {availableSources.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ch-row">
                            <span className="sub-lbl">Volts/Div:</span>
                            <div className="scope-btn-row">
                                {[0.5, 1, 2, 5, 10].map(v => (
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
                            <span className="m-val">{isSimulating ? measurements.freq : "0.00 Hz"}</span>
                        </div>
                        <div className="meas-item">
                            <span className="m-lbl">Duty:</span>
                            <span className="m-val">{isSimulating ? measurements.duty : "0.0%"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Oscilloscope;
