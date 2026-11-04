import "./McuBoard.css";
import { useState, useRef } from "react";

// Exact 16px grid alignment constants
const GRID_STEP = 16;

// Arduino Uno R3 Header Pin Definitions (Exact 16px pitch layout)
const ARDUINO_PINS = {
    // Top Digital High Header (10 pins, starting at local x: 144, y: 16)
    digitalHigh: [
        { name: "SCL", x: 144, y: 16, pinNum: "SCL" },
        { name: "SDA", x: 160, y: 16, pinNum: "SDA" },
        { name: "AREF", x: 176, y: 16, pinNum: "AREF" },
        { name: "GND", x: 192, y: 16, isGnd: true, pinNum: "GND" },
        { name: "13", x: 208, y: 16, isGpio: true, isD13: true, pinNum: 13 },
        { name: "12", x: 224, y: 16, isGpio: true, pinNum: 12 },
        { name: "~11", x: 240, y: 16, isGpio: true, pinNum: 11 },
        { name: "~10", x: 256, y: 16, isGpio: true, pinNum: 10 },
        { name: "~9", x: 272, y: 16, isGpio: true, pinNum: 9 },
        { name: "8", x: 288, y: 16, isGpio: true, pinNum: 8 },
    ],
    // Top Digital Low Header (8 pins, starting at local x: 16, y: 16)
    digitalLow: [
        { name: "7", x: 16, y: 16, isGpio: true, pinNum: 7 },
        { name: "~6", x: 32, y: 16, isGpio: true, pinNum: 6 },
        { name: "~5", x: 48, y: 16, isGpio: true, pinNum: 5 },
        { name: "4", x: 64, y: 16, isGpio: true, pinNum: 4 },
        { name: "~3", x: 80, y: 16, isGpio: true, pinNum: 3 },
        { name: "2", x: 96, y: 16, isGpio: true, pinNum: 2 },
        { name: "TX>1", x: 112, y: 16, isGpio: true, pinNum: 1 },
        { name: "RX<0", x: 128, y: 16, isGpio: true, pinNum: 0 },
    ],
    // Bottom Power Header (8 pins, starting at local x: 48, y: 208)
    power: [
        { name: "NC", x: 48, y: 208, pinNum: "NC" },
        { name: "IOREF", x: 64, y: 208, is5V: true, pinNum: "IOREF" },
        { name: "RESET", x: 80, y: 208, pinNum: "RESET" },
        { name: "3.3V", x: 96, y: 208, is3V3: true, pinNum: "3.3V" },
        { name: "5V", x: 112, y: 208, is5V: true, pinNum: "5V" },
        { name: "GND", x: 128, y: 208, isGnd: true, pinNum: "GND" },
        { name: "GND", x: 144, y: 208, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 160, y: 208, is5V: true, pinNum: "VIN" },
    ],
    // Bottom Analog Header (6 pins, starting at local x: 192, y: 208)
    analog: [
        { name: "A0", x: 192, y: 208, isAnalog: true, pinNum: "A0" },
        { name: "A1", x: 208, y: 208, isAnalog: true, pinNum: "A1" },
        { name: "A2", x: 224, y: 208, isAnalog: true, pinNum: "A2" },
        { name: "A3", x: 240, y: 208, isAnalog: true, pinNum: "A3" },
        { name: "A4", x: 256, y: 208, isAnalog: true, pinNum: "A4" },
        { name: "A5", x: 272, y: 208, isAnalog: true, pinNum: "A5" },
    ]
};

// ESP32 DevKit V1 30-pin Header Definitions (15 pins per side, 16px pitch layout)
const ESP32_PINS = {
    // Left column (local x: 16, y: 16 to 240)
    leftCol: [
        { name: "EN", x: 16, y: 16, pinNum: "EN" },
        { name: "VP", x: 16, y: 32, pinNum: 36, isGpio: true },
        { name: "VN", x: 16, y: 48, pinNum: 39, isGpio: true },
        { name: "D34", x: 16, y: 64, pinNum: 34, isGpio: true },
        { name: "D35", x: 16, y: 80, pinNum: 35, isGpio: true },
        { name: "D32", x: 16, y: 96, pinNum: 32, isGpio: true },
        { name: "D33", x: 16, y: 112, pinNum: 33, isGpio: true },
        { name: "D25", x: 16, y: 128, pinNum: 25, isGpio: true },
        { name: "D26", x: 16, y: 144, pinNum: 26, isGpio: true },
        { name: "D27", x: 16, y: 160, pinNum: 27, isGpio: true },
        { name: "D14", x: 16, y: 176, pinNum: 14, isGpio: true },
        { name: "D12", x: 16, y: 192, pinNum: 12, isGpio: true },
        { name: "D13", x: 16, y: 208, pinNum: 13, isGpio: true },
        { name: "GND", x: 16, y: 224, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 16, y: 240, is5V: true, pinNum: "VIN" },
    ],
    // Right column (local x: 144, y: 16 to 240)
    rightCol: [
        { name: "D23", x: 144, y: 16, pinNum: 23, isGpio: true },
        { name: "D22", x: 144, y: 32, pinNum: 22, isGpio: true },
        { name: "TX0", x: 144, y: 48, pinNum: 1, isGpio: true },
        { name: "RX0", x: 144, y: 64, pinNum: 3, isGpio: true },
        { name: "D21", x: 144, y: 80, pinNum: 21, isGpio: true },
        { name: "D19", x: 144, y: 96, pinNum: 19, isGpio: true },
        { name: "D18", x: 144, y: 112, pinNum: 18, isGpio: true },
        { name: "D5", x: 144, y: 128, pinNum: 5, isGpio: true },
        { name: "D17", x: 144, y: 144, pinNum: 17, isGpio: true },
        { name: "D16", x: 144, y: 160, pinNum: 16, isGpio: true },
        { name: "D4", x: 144, y: 176, pinNum: 4, isGpio: true },
        { name: "D0", x: 144, y: 192, pinNum: 0, isGpio: true },
        { name: "D2", x: 144, y: 208, isGpio: true, isD2: true, pinNum: 2 },
        { name: "D15", x: 144, y: 224, pinNum: 15, isGpio: true },
        { name: "3V3", x: 144, y: 240, is3V3: true, pinNum: "3.3V" },
    ]
};

function McuBoard({
    id,
    type, // "arduino-uno" | "esp32-devkit"
    name,
    x,
    y,
    rotation = 0,
    isSelected,
    onSelect,
    onDelete,
    onRotate,
    onMouseDown,
    isWireMode,
    activeWire,
    onStartWireAtPoint,
    simState
}) {
    const [hoveredPin, setHoveredPin] = useState(null);
    const lastMouseDownRef = useRef({ time: 0, key: "" });

    const getPinWorldCoords = (localX, localY) => {
        const rad = ((rotation || 0) * Math.PI) / 180;
        const worldX = Math.round(x + localX * Math.cos(rad) - localY * Math.sin(rad));
        const worldY = Math.round(y + localX * Math.sin(rad) + localY * Math.cos(rad));
        return { worldX, worldY };
    };

    const handlePinAction = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const pt = getPinWorldCoords(localX, localY);
        onStartWireAtPoint && onStartWireAtPoint(pt);
    };

    const handlePinMouseDown = (e, pinKey, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const now = Date.now();
        const isDouble = (lastMouseDownRef.current.key === pinKey) && (now - lastMouseDownRef.current.time < 420);
        lastMouseDownRef.current = { time: now, key: pinKey };

        if (isDouble) {
            handlePinAction(e, localX, localY);
        }
    };

    const handlePinMouseUp = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        if (activeWire && onStartWireAtPoint) {
            const pt = getPinWorldCoords(localX, localY);
            const startPt = activeWire.points?.[0];
            if (startPt && (startPt.x !== pt.worldX || startPt.y !== pt.worldY)) {
                onStartWireAtPoint({ x: pt.worldX, y: pt.worldY });
            }
        }
    };

    const renderPinSocket = (pin, keyPrefix) => {
        const pinKey = `${keyPrefix}_${pin.name}_${pin.x}_${pin.y}`;
        const isHovered = hoveredPin === pinKey;

        return (
            <div
                key={pinKey}
                className={`mcu-socket-hole ${pin.isGnd ? "socket-gnd" : pin.is5V ? "socket-5v" : pin.is3V3 ? "socket-3v3" : "socket-gpio"} ${isHovered ? "targeted" : ""}`}
                style={{ left: pin.x - 6, top: pin.y - 6 }}
                title={`${pin.name} • Double-click or drag to wire`}
                onMouseEnter={() => setHoveredPin(pinKey)}
                onMouseLeave={() => setHoveredPin(null)}
                onMouseDown={(e) => handlePinMouseDown(e, pinKey, pin.x, pin.y)}
                onMouseUp={(e) => handlePinMouseUp(e, pin.x, pin.y)}
                onDoubleClick={(e) => handlePinAction(e, pin.x, pin.y)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (activeWire || isWireMode) handlePinAction(e, pin.x, pin.y);
                }}
            >
                <div className="socket-inner-metal"></div>
                {isHovered && (
                    <div className="mcu-pin-hover-badge">
                        {pin.name}
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // 1. ARDUINO UNO R3 RENDERER
    // ==========================================
    if (type === "arduino-uno") {
        const isPowered = Boolean(simState?.isPowered);
        const isD13Lit = Boolean(isPowered && simState?.d13High);
        const isTxRxActive = Boolean(isPowered && (simState?.txrxActive || simState?.serialActive));

        return (
            <div
                className={`mcu-board-container arduino-uno-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0"
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Board PCB Silkscreen Artwork */}
                <div className="arduino-pcb-surface">
                    {/* Metallic Silver USB-B Receptacle */}
                    <div className="arduino-usb-port">
                        <div className="usb-shield-metallic"></div>
                    </div>

                    {/* DC Power Barrel Jack (Black casing with center pin) */}
                    <div className="arduino-dc-jack">
                        <div className="barrel-inner-hole"></div>
                    </div>

                    {/* Reset Button (Top left) */}
                    <div className="arduino-reset-btn" title="Reset Button">
                        <div className="reset-actuator"></div>
                    </div>

                    {/* 16MHz Crystal Oscillator */}
                    <div className="arduino-crystal">
                        <span className="crystal-text">16.000</span>
                    </div>

                    {/* ATmega328P DIP-28 Main Microcontroller IC */}
                    <div className="arduino-atmega-ic">
                        <div className="ic-notch"></div>
                        <span className="ic-label">ATmega328P-PU</span>
                        <div className="ic-pins-row top-pins"></div>
                        <div className="ic-pins-row bot-pins"></div>
                    </div>

                    {/* Silkscreen Branding */}
                    <div className="arduino-silkscreen-labels">
                        <span className="board-title">ARDUINO</span>
                        <span className="board-subtitle">UNO</span>
                    </div>

                    {/* Onboard Status LEDs */}
                    <div className="arduino-leds-cluster">
                        {/* Power LED (ON) */}
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-pwr ${isPowered ? "lit" : ""}`}></span>
                            <span className="smd-label">ON</span>
                        </div>
                        {/* User Pin 13 LED (L) */}
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-d13 ${isD13Lit ? "lit" : ""}`}></span>
                            <span className="smd-label">L</span>
                        </div>
                        {/* TX / RX Activity LEDs */}
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-tx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">TX</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-rx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">RX</span>
                        </div>
                    </div>

                    {/* Silkscreen Header Labels */}
                    <div className="header-legend digital-low-legend">DIGITAL (0-7)</div>
                    <div className="header-legend digital-high-legend">DIGITAL (8-13, PWM)</div>
                    <div className="header-legend power-legend">POWER</div>
                    <div className="header-legend analog-legend">ANALOG IN</div>
                </div>

                {/* Pin Socket Headers (Exact 16px Grid) */}
                <div className="mcu-pin-sockets-layer">
                    {/* Top Digital High (Pins 8 to SCL) */}
                    {ARDUINO_PINS.digitalHigh.map((p) => renderPinSocket(p, "digHigh"))}
                    {/* Top Digital Low (Pins 0 to 7) */}
                    {ARDUINO_PINS.digitalLow.map((p) => renderPinSocket(p, "digLow"))}
                    {/* Bottom Power (IOREF, 3.3V, 5V, GND, VIN) */}
                    {ARDUINO_PINS.power.map((p) => renderPinSocket(p, "pwr"))}
                    {/* Bottom Analog (A0 to A5) */}
                    {ARDUINO_PINS.analog.map((p) => renderPinSocket(p, "ana"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 2. ESP32 DEVKIT V1 (30-PIN DUAL-ROW)
    // ==========================================
    const isPowered = Boolean(simState?.isPowered);
    const isD2Lit = Boolean(isPowered && simState?.d2High);
    const isTxRxActive = Boolean(isPowered && (simState?.txrxActive || simState?.serialActive));

    return (
        <div
            className={`mcu-board-container esp32-board ${isSelected ? "selected" : ""}`}
            style={{
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                transformOrigin: "0 0"
            }}
            onMouseDown={(e) => {
                if (isWireMode) return;
                onSelect && onSelect(id);
                onMouseDown && onMouseDown(e, id);
            }}
        >
            {/* Matte Dark PCB Surface */}
            <div className="esp32-pcb-surface">
                {/* ESP-WROOM-32 Metal RF Shielding Can with Meandered Antenna */}
                <div className="esp32-metal-can">
                    <div className="pcb-antenna-trace"></div>
                    <div className="metal-can-plate">
                        <span className="can-brand">ESPRESSIF</span>
                        <span className="can-model">ESP-WROOM-32</span>
                        <span className="can-fcc">FCC ID: 2AC7Z-ESPWROOM32</span>
                    </div>
                </div>

                {/* CP2102 USB-to-UART Bridge IC */}
                <div className="esp32-uart-ic">
                    <span className="uart-label">CP2102</span>
                </div>

                {/* Micro-USB Jack at bottom */}
                <div className="esp32-usb-port">
                    <div className="micro-usb-connector"></div>
                </div>

                {/* Push Buttons: EN and BOOT */}
                <div className="esp32-button-left" title="EN (Reset)">
                    <div className="esp-btn-cap"></div>
                    <span className="esp-btn-label">EN</span>
                </div>
                <div className="esp32-button-right" title="BOOT (GPIO 0)">
                    <div className="esp-btn-cap"></div>
                    <span className="esp-btn-label">BOOT</span>
                </div>

                {/* Onboard LEDs: Red PWR and Blue D2 */}
                <div className="esp32-leds">
                    <div className="esp-led-item">
                        <span className={`micro-smd-led led-pwr ${isPowered ? "lit" : ""}`}></span>
                        <span className="smd-label">PWR</span>
                    </div>
                    <div className="esp-led-item">
                        <span className={`micro-smd-led led-d2 ${isD2Lit ? "lit" : ""}`}></span>
                        <span className="smd-label">D2</span>
                    </div>
                </div>
            </div>

            {/* Dual 15-pin Headers (16px Pitch) */}
            <div className="mcu-pin-sockets-layer">
                {ESP32_PINS.leftCol.map((p) => renderPinSocket(p, "espL"))}
                {ESP32_PINS.rightCol.map((p) => renderPinSocket(p, "espR"))}
            </div>
        </div>
    );
}

export default McuBoard;
export { ARDUINO_PINS, ESP32_PINS };
