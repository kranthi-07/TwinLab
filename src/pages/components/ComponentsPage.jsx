import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMPONENTS_CATALOG } from "../../data/componentsCatalog";
import { ComponentArt } from "../../components/common/ComponentArt";
import { soundManager } from "../../utils/audioManager";
import "./ComponentsPage.css";

const CATEGORIES = [
    { id: "all", label: "All Hardware", icon: "ri-apps-2-line" },
    { id: "mcu", label: "Microcontrollers", icon: "ri-cpu-line" },
    { id: "outputs", label: "Displays & Actuators", icon: "ri-tv-line" },
    { id: "sensors", label: "Sensors & Input", icon: "ri-radar-line" },
    { id: "power", label: "Power & Supplies", icon: "ri-battery-2-charge-line" },
    { id: "passives", label: "Passives & ICs", icon: "ri-pulse-line" },
    { id: "boards", label: "Breadboards", icon: "ri-layout-grid-line" }
];

function getCategoryForComponent(comp) {
    const id = comp.id?.toLowerCase() || "";
    if (id.startsWith("arduino") || id.startsWith("esp32") || id.startsWith("rpi") || id.startsWith("stm32") || id.startsWith("attiny")) return "mcu";
    if (id.startsWith("breadboard")) return "boards";
    if (id.includes("lcd") || id.startsWith("led") || id === "buzzer" || id.includes("motor") || id.includes("servo")) return "outputs";
    if (id.startsWith("battery") || id.includes("voltage") || id.includes("power")) return "power";
    if (id.includes("sensor") || id.includes("pir") || id.includes("ultrasonic") || id.includes("photo") || id.includes("switch") || id.includes("button") || id === "potentiometer") return "sensors";
    return "passives";
}

function getComponentSpecs(comp) {
    const id = comp.id?.toLowerCase() || "";
    if (id.includes("arduino-uno")) {
        return {
            mcu: "ATmega328P (8-bit AVR)",
            voltage: "5.0V TTL Logic (7-12V Vin)",
            clock: "16.0 MHz Crystal",
            io: "14 Digital (6 PWM), 6 Analog (10-bit ADC)",
            pins: ["D0 (RX)", "D1 (TX)", "D2", "D3~", "D4", "D5~", "D6~", "D7", "D8", "D9~", "D10~", "D11~", "D12", "D13 (LED)", "A0", "A1", "A2", "A3", "A4 (SDA)", "A5 (SCL)", "5V", "3.3V", "GND", "VIN", "RESET"]
        };
    }
    if (id.includes("esp32")) {
        return {
            mcu: "ESP32-S3 Dual-Core Xtensa LX7",
            voltage: "3.3V CMOS Logic (5V via USB)",
            clock: "240.0 MHz",
            io: "36 Programmable GPIOs, Wi-Fi 4 + BLE 5.0",
            pins: ["GPIO 0 (BOOT)", "GPIO 1 (TX0)", "GPIO 2", "GPIO 3 (RX0)", "GPIO 4", "GPIO 5", "GPIO 18 (SCK)", "GPIO 19 (MISO)", "GPIO 21 (SDA)", "GPIO 22 (SCL)", "GPIO 23 (MOSI)", "3.3V", "5V", "GND"]
        };
    }
    if (id.includes("servo")) {
        return {
            mcu: "Analog Micro Servo Core",
            voltage: "4.8V - 6.0V DC",
            torque: "1.8 kgf·cm (4.8V)",
            speed: "0.10 s / 60°",
            pins: ["GND (Brown)", "VCC 5V (Red)", "PWM Signal (Orange)"]
        };
    }
    if (id.includes("ultrasonic")) {
        return {
            mcu: "Dual Piezo Sonic Transducer (40 kHz)",
            voltage: "5.0V DC Regulated",
            range: "2 cm - 400 cm (Accuracy: 3 mm)",
            current: "15 mA Active Ping",
            pins: ["VCC (5V)", "Trig (Trigger Input)", "Echo (Pulse Output)", "GND"]
        };
    }
    if (id.includes("pir")) {
        return {
            mcu: "Pyroelectric Infrared Sensor (BISS0001)",
            voltage: "3.3V - 5.0V DC",
            range: "3 - 7 Meters (110° Cone Angle)",
            delay: "0.3s - 18s Adjustable Hold",
            pins: ["VCC (5V)", "OUT (Digital High/Low)", "GND"]
        };
    }
    if (id.includes("lcd")) {
        return {
            mcu: "HD44780 + PCF8574 I2C Backpack",
            voltage: "5.0V DC",
            bus: "I2C 2-Wire (Address 0x27 / 0x3F)",
            format: id.includes("2004") ? "20 Columns x 4 Rows" : "16 Columns x 2 Rows",
            pins: ["GND", "VCC (5V)", "SDA (Serial Data)", "SCL (Serial Clock)"]
        };
    }
    if (id.includes("resistor")) {
        return {
            type: "Carbon Film 1/4W Through-Hole",
            tolerance: "±5% (Gold 4th Band)",
            power: "0.25 W Dissipation",
            pins: ["Terminal 1", "Terminal 2"]
        };
    }
    if (id.includes("led")) {
        return {
            type: "5mm Round Diffused Through-Hole",
            forwardV: "1.8V - 2.2V (Red/Yellow), 3.0V - 3.4V (Blue/Green)",
            maxCurrent: "20 mA Continuous",
            pins: ["Anode (+) Long Lead", "Cathode (-) Short Flat Lead"]
        };
    }
    return {
        voltage: "3.3V - 5.0V Standard Rail",
        package: "Standard Through-Hole Breadboard Pitch (2.54mm / 0.1\")",
        pins: ["Pin 1", "Pin 2"]
    };
}

function ComponentsPage({ onOpenWorkspace }) {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [inspectedComp, setInspectedComp] = useState(null);

    // Interactive Preview Controls State
    const [previewLedColor, setPreviewLedColor] = useState("#ef4444");
    const [previewLedOn, setPreviewLedOn] = useState(true);
    const [previewServoAngle, setPreviewServoAngle] = useState(90);
    const [previewSonarDist, setPreviewSonarDist] = useState(25);
    const [previewResistance, setPreviewResistance] = useState(220);
    const [copyNotice, setCopyNotice] = useState(false);

    const filteredComponents = useMemo(() => {
        return COMPONENTS_CATALOG.filter((comp) => {
            if (comp.id?.startsWith("starter")) return false;
            const compCat = getCategoryForComponent(comp);
            const matchesCat = selectedCategory === "all" || compCat === selectedCategory;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery = !q ||
                comp.name.toLowerCase().includes(q) ||
                (comp.desc && comp.desc.toLowerCase().includes(q)) ||
                (comp.tag && comp.tag.toLowerCase().includes(q));
            return matchesCat && matchesQuery;
        });
    }, [selectedCategory, searchQuery]);

    const handleLaunchInWorkspace = (comp) => {
        try {
            // Append target component directly to active project
            const activeRaw = localStorage.getItem("twinlab_active_project");
            let project = null;
            if (activeRaw) {
                try { project = JSON.parse(activeRaw); } catch (e) {}
            }

            const newComp = {
                id: `${comp.type || comp.id}-${Date.now()}`,
                type: comp.type || comp.id,
                name: comp.name,
                x: 320,
                y: 192,
                rotation: 0
            };

            if (project) {
                project.components = [...(project.components || []), newComp];
                localStorage.setItem("twinlab_active_project", JSON.stringify(project));
                
                // Update projects list
                const listRaw = localStorage.getItem("twinlab_user_projects");
                if (listRaw) {
                    try {
                        const list = JSON.parse(listRaw);
                        const updated = list.map(p => p.id === project.id ? project : p);
                        localStorage.setItem("twinlab_user_projects", JSON.stringify(updated));
                    } catch (e) {}
                }
            } else {
                localStorage.setItem("twinlab_workspace_draft", JSON.stringify({
                    components: [newComp],
                    wires: []
                }));
            }
        } catch (e) {
            console.error("Insert error:", e);
        }
        setInspectedComp(null);
        onOpenWorkspace && onOpenWorkspace();
    };

    const handleCopyNetlist = (comp) => {
        const text = `* TwinLab SPICE Netlist Model: ${comp.name}\n.SUBCKT ${comp.id?.toUpperCase() || "DEV"} 1 2\n* Param: V_OP=5.0V R_INT=10\n.ENDS`;
        navigator.clipboard?.writeText(text);
        setCopyNotice(true);
        setTimeout(() => setCopyNotice(false), 2200);
    };

    const specs = inspectedComp ? getComponentSpecs(inspectedComp) : null;

    return (
        <div className="components-page-container">
            {/* Header Section */}
            <div className="components-header">
                <div className="header-info">
                    <div className="header-badge">
                        <i className="ri-cpu-line"></i>
                        <span>Hardware Library // v2.5</span>
                    </div>
                    <h1>Component Ecosystem</h1>
                    <p>
                        High-precision microcontrollers, discrete silicon, sensors, and actuators modeled with cycle-accurate logic and SPICE simulation. Click any card to inspect pinouts and test live interactive parameters.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="components-search-wrap">
                    <i className="ri-search-2-line"></i>
                    <input
                        type="text"
                        className="components-search-input"
                        placeholder="Search by part number, name, logic level..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear-btn" onClick={() => setSearchQuery("")}>
                            <i className="ri-close-line"></i>
                        </button>
                    )}
                </div>
            </div>

            {/* Category Navigation Pills */}
            <div className="components-cat-bar">
                {CATEGORIES.map((cat) => {
                    const count = cat.id === "all" 
                        ? COMPONENTS_CATALOG.filter(c => !c.id?.startsWith("starter")).length
                        : COMPONENTS_CATALOG.filter(c => !c.id?.startsWith("starter") && getCategoryForComponent(c) === cat.id).length;

                    return (
                        <button
                            key={cat.id}
                            className={`cat-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            <i className={cat.icon}></i>
                            <span>{cat.label}</span>
                            <span className="cat-count-pill font-mono">{count}</span>
                        </button>
                    );
                })}
            </div>

            {/* Components Grid */}
            <motion.div className="components-grid" layout>
                <AnimatePresence>
                    {filteredComponents.map((comp) => (
                        <motion.div
                            key={comp.id}
                            className="catalog-component-card"
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            whileHover={{ y: -4 }}
                            onClick={() => setInspectedComp(comp)}
                        >
                            <div className="comp-card-art-stage">
                                <ComponentArt type={comp.type || comp.id} color={comp.color} />
                            </div>

                            <div className="comp-card-body">
                                <div className="comp-card-tag-row">
                                    <span className="comp-tag-badge">{comp.tag || "Module"}</span>
                                    <span className="comp-cat-label font-mono">{getCategoryForComponent(comp).toUpperCase()}</span>
                                </div>
                                <h3 className="comp-card-title">{comp.name}</h3>
                                <p className="comp-card-desc">{comp.desc}</p>
                            </div>

                            <div className="comp-card-footer">
                                <button
                                    type="button"
                                    className="inspect-card-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setInspectedComp(comp);
                                    }}
                                >
                                    <i className="ri-eye-line"></i>
                                    <span>Inspect Pinout</span>
                                </button>
                                <button
                                    type="button"
                                    className="insert-workspace-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLaunchInWorkspace(comp);
                                    }}
                                    title="Open and insert into active workspace"
                                >
                                    <i className="ri-add-line"></i>
                                    <span>Use</span>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* ============================================================
               INTERACTIVE COMPONENT INSPECTOR DRAWER / MODAL
            ============================================================ */}
            <AnimatePresence>
                {inspectedComp && (
                    <div className="component-inspector-overlay" onClick={() => setInspectedComp(null)}>
                        <motion.div 
                            className="component-inspector-modal"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Modal Header */}
                            <div className="inspector-modal-header">
                                <div className="modal-title-group">
                                    <span className="inspector-tag-pill font-mono">{inspectedComp.tag || "COMPONENT"}</span>
                                    <h2>{inspectedComp.name}</h2>
                                    <span className="inspector-part-code font-mono">PART ID // {inspectedComp.id}</span>
                                </div>
                                <button className="inspector-close-btn" onClick={() => setInspectedComp(null)}>
                                    <i className="ri-close-line"></i>
                                </button>
                            </div>

                            <div className="inspector-modal-body">
                                {/* Left: Interactive Visual Simulation Sandbox */}
                                <div className="inspector-interactive-sandbox">
                                    <div className="sandbox-stage">
                                        <div className="sandbox-visual-wrap">
                                            <ComponentArt 
                                                type={inspectedComp.type || inspectedComp.id} 
                                                color={previewLedColor}
                                            />
                                        </div>
                                    </div>

                                    {/* Live Interactive Component Controls */}
                                    <div className="sandbox-controls-box">
                                        <span className="sandbox-controls-title">
                                            <i className="ri-equalizer-line"></i>
                                            LIVE INTERACTIVE TESTBENCH
                                        </span>

                                        {/* LED Color & Brightness Controller */}
                                        {inspectedComp.id?.includes("led") && (
                                            <div className="sandbox-control-group">
                                                <label>Lens Emission Color</label>
                                                <div className="led-color-picker-row">
                                                    {["#ef4444", "#3b82f6", "#10b981", "#eab308", "#ffffff"].map((c) => (
                                                        <button 
                                                            key={c}
                                                            type="button"
                                                            className={`color-dot-btn ${previewLedColor === c ? "active" : ""}`}
                                                            style={{ backgroundColor: c }}
                                                            onClick={() => setPreviewLedColor(c)}
                                                        />
                                                    ))}
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className={`test-toggle-btn ${previewLedOn ? "on" : ""}`}
                                                    onClick={() => setPreviewLedOn(!previewLedOn)}
                                                >
                                                    <i className="ri-flashlight-line"></i>
                                                    <span>{previewLedOn ? "Simulate Forward Bias (20mA)" : "Reverse Bias (0mA)"}</span>
                                                </button>
                                            </div>
                                        )}

                                        {/* Servo Horn Angle Slider */}
                                        {inspectedComp.id?.includes("servo") && (
                                            <div className="sandbox-control-group">
                                                <div className="slider-label-row">
                                                    <span>Horn Shaft Angle</span>
                                                    <span className="slider-val font-mono">{previewServoAngle}°</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="0" 
                                                    max="180" 
                                                    value={previewServoAngle} 
                                                    onChange={(e) => setPreviewServoAngle(Number(e.target.value))}
                                                    className="inspector-slider"
                                                />
                                                <div className="slider-presets-row">
                                                    {[0, 45, 90, 135, 180].map(deg => (
                                                        <button 
                                                            key={deg} 
                                                            type="button" 
                                                            className={`preset-btn ${previewServoAngle === deg ? "active" : ""}`}
                                                            onClick={() => setPreviewServoAngle(deg)}
                                                        >
                                                            {deg}°
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Ultrasonic Distance Slider */}
                                        {inspectedComp.id?.includes("ultrasonic") && (
                                            <div className="sandbox-control-group">
                                                <div className="slider-label-row">
                                                    <span>Obstacle Distance</span>
                                                    <span className="slider-val font-mono">{previewSonarDist} cm</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="2" 
                                                    max="400" 
                                                    value={previewSonarDist} 
                                                    onChange={(e) => setPreviewSonarDist(Number(e.target.value))}
                                                    className="inspector-slider"
                                                />
                                                <span className="calc-time-tag font-mono">
                                                    Echo Flight Time: {Math.round((previewSonarDist * 2 / 0.0343))} µs
                                                </span>
                                            </div>
                                        )}

                                        {/* Resistor Ohm Slider */}
                                        {inspectedComp.id?.includes("resistor") && (
                                            <div className="sandbox-control-group">
                                                <div className="slider-label-row">
                                                    <span>Resistance Rating</span>
                                                    <span className="slider-val font-mono">{previewResistance} Ω</span>
                                                </div>
                                                <input 
                                                    type="range" 
                                                    min="10" 
                                                    max="10000" 
                                                    step="10"
                                                    value={previewResistance} 
                                                    onChange={(e) => setPreviewResistance(Number(e.target.value))}
                                                    className="inspector-slider"
                                                />
                                                <span className="calc-time-tag font-mono">
                                                    Current @ 5V: {(5 / previewResistance * 1000).toFixed(1)} mA • Power: {(5 * 5 / previewResistance * 1000).toFixed(1)} mW
                                                </span>
                                            </div>
                                        )}

                                        {/* Buzzer Chime Button */}
                                        {inspectedComp.id?.includes("buzzer") && (
                                            <div className="sandbox-control-group">
                                                <button 
                                                    type="button" 
                                                    className="test-toggle-btn on"
                                                    onClick={() => soundManager.playTone(880, 0.25)}
                                                >
                                                    <i className="ri-volume-up-line"></i>
                                                    <span>Emit 880 Hz Piezo Tone</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Pinout Breakdown & Electrical Datasheet */}
                                <div className="inspector-specs-pane">
                                    <div className="specs-section">
                                        <h4>// HARDWARE SPECIFICATIONS</h4>
                                        <div className="specs-table">
                                            {specs && Object.entries(specs).filter(([k]) => k !== "pins").map(([key, val]) => (
                                                <div key={key} className="specs-row">
                                                    <span className="spec-k font-mono">{key.toUpperCase()}</span>
                                                    <span className="spec-v">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Terminal Pinout Map */}
                                    {specs?.pins && (
                                        <div className="specs-section">
                                            <h4>// PIN BREAKOUT MAPPING</h4>
                                            <div className="pins-badges-grid">
                                                {specs.pins.map((pin, i) => (
                                                    <div key={i} className="pin-badge font-mono">
                                                        <span className="pin-num">{i + 1}</span>
                                                        <span className="pin-name">{pin}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Overview Description */}
                                    <div className="specs-section">
                                        <h4>// ARCHITECTURE SUMMARY</h4>
                                        <p className="specs-desc-text">{inspectedComp.desc}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="inspector-modal-footer">
                                <div className="footer-left-actions">
                                    <button 
                                        type="button" 
                                        className="btn-modal-action"
                                        onClick={() => handleCopyNetlist(inspectedComp)}
                                    >
                                        <i className="ri-file-copy-line"></i>
                                        <span>{copyNotice ? "Copied Netlist!" : "Copy Netlist"}</span>
                                    </button>
                                </div>

                                <div className="footer-right-actions">
                                    <button 
                                        type="button" 
                                        className="btn-modal-cancel" 
                                        onClick={() => setInspectedComp(null)}
                                    >
                                        Close
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-modal-insert"
                                        onClick={() => handleLaunchInWorkspace(inspectedComp)}
                                    >
                                        <i className="ri-add-line"></i>
                                        <span>Insert into Active Project</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ComponentsPage;
