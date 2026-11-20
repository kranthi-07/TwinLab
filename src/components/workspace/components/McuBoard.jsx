import "./McuBoard.css";
import { useState, useRef } from "react";
import { 
    ARDUINO_PINS, 
    ARDUINO_MEGA_PINS, 
    ARDUINO_NANO_PINS, 
    RPI_PICO_PINS, 
    ESP32_PINS,
    ESP8266_NODEMCU_PINS,
    STM32_NUCLEO_PINS,
    TEENSY41_PINS,
    STM32_BLUEPILL_PINS,
    ATTINY85_PINS
} from "./mcuPins.js";

export { 
    ARDUINO_PINS, 
    ARDUINO_MEGA_PINS, 
    ARDUINO_NANO_PINS, 
    RPI_PICO_PINS, 
    ESP32_PINS,
    ESP8266_NODEMCU_PINS,
    STM32_NUCLEO_PINS,
    TEENSY41_PINS,
    STM32_BLUEPILL_PINS,
    ATTINY85_PINS
};

// Exact 16px grid alignment constants
const GRID_STEP = 16;

function McuBoard({
    id,
    type, // "arduino-uno" | "arduino-mega" | "arduino-nano" | "esp32-devkit" | "esp32" | "esp32-s3"
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
    simState,
    isSimulating = false
}) {
    const [hoveredPin, setHoveredPin] = useState(null);

    const getPinWorldCoords = (localX, localY) => {
        const rad = ((rotation || 0) * Math.PI) / 180;
        const worldX = Math.round(x + localX * Math.cos(rad) - localY * Math.sin(rad));
        const worldY = Math.round(y + localX * Math.sin(rad) + localY * Math.cos(rad));
        return { worldX, worldY, x: worldX, y: worldY };
    };

    // Instant wire start from any board pin on click, mousedown or double-click
    const handlePinAction = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        const pt = getPinWorldCoords(localX, localY);
        onStartWireAtPoint && onStartWireAtPoint({ x: pt.x, y: pt.y });
    };

    const handlePinMouseUp = (e, localX, localY) => {
        e && e.stopPropagation && e.stopPropagation();
        if (activeWire && onStartWireAtPoint) {
            const pt = getPinWorldCoords(localX, localY);
            const startPt = activeWire.points?.[0];
            if (startPt && (startPt.x !== pt.worldX || startPt.y !== pt.worldY)) {
                onStartWireAtPoint({ x: pt.x, y: pt.y });
            }
        }
    };

    /**
     * Renders an individual pin header hole with permanent crisp silkscreen text label
     */
    const renderPinSocket = (pin, keyPrefix, labelPos = "auto") => {
        const pinKey = `${keyPrefix}_${pin.name}_${pin.x}_${pin.y}`;
        const isHovered = hoveredPin === pinKey;

        // Position label cleanly beside the hole
        let labelClass = "pin-label-bot";
        if (labelPos === "top" || (labelPos === "auto" && pin.y > 100)) {
            labelClass = "pin-label-top";
        } else if (labelPos === "espLeft") {
            labelClass = "pin-label-esp-left";
        } else if (labelPos === "espRight") {
            labelClass = "pin-label-esp-right";
        } else if (labelPos === "right") {
            labelClass = "pin-label-right";
        } else if (labelPos === "left") {
            labelClass = "pin-label-left";
        }

        return (
            <div
                key={pinKey}
                className={`mcu-socket-hole ${pin.isGnd ? "socket-gnd" : pin.is5V ? "socket-5v" : pin.is3V3 ? "socket-3v3" : "socket-gpio"} ${isHovered ? "targeted" : ""}`}
                style={{ left: pin.x - 7, top: pin.y - 7 }}
                onMouseEnter={() => setHoveredPin(pinKey)}
                onMouseLeave={() => setHoveredPin(null)}
                onMouseDown={(e) => handlePinAction(e, pin.x, pin.y)}
                onMouseUp={(e) => handlePinMouseUp(e, pin.x, pin.y)}
                onClick={(e) => handlePinAction(e, pin.x, pin.y)}
                onDoubleClick={(e) => handlePinAction(e, pin.x, pin.y)}
            >
                <div className="socket-inner-metal"></div>
                {/* Permanent Silkscreen Pin Label directly beside the hole */}
                <span className={`mcu-silkscreen-pin-label ${labelClass}`}>
                    {pin.name}
                </span>
                {isHovered && (
                    <div className="mcu-pin-hover-badge">
                        {pin.isGnd ? "GND (Ground)" : pin.is5V ? "5V (VCC)" : pin.is3V3 ? "3.3V (VCC)" : pin.isAnalog ? `${pin.name} (ADC)` : pin.name}
                    </div>
                )}
            </div>
        );
    };

    // ==========================================
    // 1. ARDUINO UNO R3 RENDERER
    // ==========================================
    if (type === "arduino-uno") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
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
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Tinkercad-Style Animated USB Module Plug-In (No awkward tail wire) */}
                <div className={`tinkercad-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell">
                        <div className="usb-plug-hole hole-1"></div>
                        <div className="usb-plug-hole hole-2"></div>
                    </div>
                </div>

                {/* Ultra-Realistic Italian Arduino Teal PCB */}
                <div className="arduino-pcb-surface">
                    {/* Metallic Silver USB-B Port */}
                    <div className="arduino-usb-port">
                        <div className="usb-shield-metallic">
                            <div className="usb-socket-opening"></div>
                        </div>
                    </div>

                    {/* DC Power Barrel Jack (Black with center pin) */}
                    <div className="arduino-dc-jack">
                        <div className="barrel-inner-hole">
                            <div className="barrel-pin-metal"></div>
                        </div>
                    </div>

                    {/* Reset Button (Top left) with red plunger & brass collar - Tinkercad exact */}
                    <div className="arduino-reset-btn" title="Reset Button">
                        <div className="reset-brass-ring">
                            <div className="reset-actuator"></div>
                        </div>
                    </div>

                    {/* 16MHz Crystal Oscillator (SPK 16.000 silver can) */}
                    <div className="arduino-crystal" title="16.000 MHz Crystal Oscillator">
                        <span className="crystal-text">SPK 16.000</span>
                    </div>

                    {/* AMS1117 Voltage Regulator with heatsink tab */}
                    <div className="arduino-voltage-regulator" title="AMS1117 5.0V Regulator">
                        <div className="regulator-heat-tab"></div>
                        <div className="regulator-body">
                            <span className="regulator-text">AMS1117</span>
                        </div>
                        <div className="regulator-pins">
                            <span></span><span></span><span></span>
                        </div>
                    </div>

                    {/* Dual Aluminum Electrolytic Filter Capacitors */}
                    <div className="arduino-capacitors-pair">
                        <div className="arduino-elec-cap cap-1" title="47µF Power Filter Capacitor">
                            <div className="cap-silver-top">
                                <div className="cap-negative-stripe"></div>
                            </div>
                        </div>
                        <div className="arduino-elec-cap cap-2" title="47µF Power Filter Capacitor">
                            <div className="cap-silver-top">
                                <div className="cap-negative-stripe"></div>
                            </div>
                        </div>
                    </div>

                    {/* ATmega16U2 USB-Serial Chip */}
                    <div className="atmega16u2-chip" title="ATmega16U2 USB Bridge"></div>

                    {/* ATmega328P DIP-28 Main Microcontroller IC */}
                    <div className="arduino-atmega-ic">
                        <div className="ic-notch"></div>
                        <span className="ic-label">ATMEGA328P-PU</span>
                        <div className="ic-pins-row top-pins"></div>
                        <div className="ic-pins-row bot-pins"></div>
                    </div>

                    {/* 6-Pin ICSP Header */}
                    <div className="arduino-icsp-header" title="ICSP Header">
                        <span className="icsp-dot"></span><span className="icsp-dot"></span>
                        <span className="icsp-dot"></span><span className="icsp-dot"></span>
                        <span className="icsp-dot"></span><span className="icsp-dot"></span>
                    </div>

                    {/* Gold Ground Rings / Mounting Holes */}
                    <div className="mcu-mount-hole hole-tl"></div>
                    <div className="mcu-mount-hole hole-tr"></div>
                    <div className="mcu-mount-hole hole-bl"></div>
                    <div className="mcu-mount-hole hole-br"></div>

                    {/* Silkscreen Arduino Uno + X Branding (Tinkercad Exact) */}
                    <div className="arduino-silkscreen-labels">
                        <div className="arduino-brand-row">
                            <div className="infinity-logo-svg">
                                <span className="inf-sign">∞</span>
                            </div>
                            <span className="board-title">ARDUINO</span>
                            <div className="uno-bubble-badge">
                                <span className="uno-bubble-text">UNO</span>
                                <span className="uno-x-badge">X</span>
                            </div>
                        </div>
                    </div>

                    {/* Onboard Status SMD LEDs */}
                    <div className="arduino-leds-cluster">
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-pwr ${isPowered ? "lit" : ""}`}></span>
                            <span className="smd-label">ON</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-d13 ${isD13Lit ? "lit" : ""}`}></span>
                            <span className="smd-label">L</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-tx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">TX</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-rx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">RX</span>
                        </div>
                    </div>

                    {/* Silkscreen Section Header Brackets */}
                    <div className="header-legend digital-high-legend">DIGITAL (PWM ~)</div>
                    <div className="header-legend power-legend">POWER</div>
                    <div className="header-legend analog-legend">ANALOG IN</div>
                </div>

                {/* Female Header Strips & Holes with permanent silkscreen labels */}
                <div className="mcu-pin-sockets-layer">
                    {/* Header Plastic Shroud Bases */}
                    <div className="header-strip-shroud shroud-top-right"></div>
                    <div className="header-strip-shroud shroud-top-left"></div>
                    <div className="header-strip-shroud shroud-bot-left"></div>
                    <div className="header-strip-shroud shroud-bot-right"></div>

                    {ARDUINO_PINS.digitalHigh.map((p) => renderPinSocket(p, "digHigh", "bot"))}
                    {ARDUINO_PINS.digitalLow.map((p) => renderPinSocket(p, "digLow", "bot"))}
                    {ARDUINO_PINS.power.map((p) => renderPinSocket(p, "pwr", "top"))}
                    {ARDUINO_PINS.analog.map((p) => renderPinSocket(p, "ana", "top"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 2. ARDUINO MEGA 2560 RENDERER
    // ==========================================
    if (type === "arduino-mega") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isD13Lit = Boolean(isPowered && simState?.d13High);
        const isTxRxActive = Boolean(isPowered && (simState?.txrxActive || simState?.serialActive));

        return (
            <div
                className={`mcu-board-container arduino-mega-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0"
                }}
                onMouseDown={(e) => {
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Tinkercad USB Plug Module */}
                <div className={`tinkercad-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell"></div>
                </div>

                <div className="arduino-pcb-surface mega-pcb-surface">
                    <div className="arduino-usb-port">
                        <div className="usb-shield-metallic"></div>
                    </div>
                    <div className="arduino-dc-jack">
                        <div className="barrel-inner-hole"></div>
                    </div>
                    <div className="arduino-reset-btn" title="Reset Button">
                        <div className="reset-actuator"></div>
                    </div>
                    <div className="arduino-crystal">
                        <span className="crystal-text">16.000</span>
                    </div>

                    {/* ATmega2560 Quad Flat Pack 45° Main IC */}
                    <div className="arduino-mega-ic">
                        <span className="mega-ic-label">MEGA 2560</span>
                    </div>

                    <div className="arduino-silkscreen-labels" style={{ left: 160, top: 52 }}>
                        <div className="arduino-brand-row">
                            <span className="board-title">ARDUINO</span>
                            <div className="uno-bubble-badge" style={{ marginTop: 0 }}>
                                <span className="uno-bubble-text">MEGA 2560</span>
                                <span className="uno-x-badge">X</span>
                            </div>
                        </div>
                    </div>

                    <div className="arduino-leds-cluster" style={{ left: 240, top: 54 }}>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-pwr ${isPowered ? "lit" : ""}`}></span>
                            <span className="smd-label">ON</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-d13 ${isD13Lit ? "lit" : ""}`}></span>
                            <span className="smd-label">L</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-tx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">TX</span>
                        </div>
                        <div className="status-led-item">
                            <span className={`micro-smd-led led-rx ${isTxRxActive ? "pulse" : ""}`}></span>
                            <span className="smd-label">RX</span>
                        </div>
                    </div>

                    <div className="header-legend digital-high-legend">DIGITAL (PWM ~)</div>
                    <div className="header-legend mega-comm-legend">COMMUNICATION (14-21)</div>
                    <div className="header-legend power-legend">POWER</div>
                    <div className="header-legend mega-analog-legend">ANALOG IN (A0-A15)</div>
                </div>

                <div className="mcu-pin-sockets-layer">
                    {ARDUINO_MEGA_PINS.digitalHigh.map((p) => renderPinSocket(p, "megaDigHigh", "bot"))}
                    {ARDUINO_MEGA_PINS.digitalLow.map((p) => renderPinSocket(p, "megaDigLow", "bot"))}
                    {ARDUINO_MEGA_PINS.communication.map((p) => renderPinSocket(p, "megaComm", "bot"))}
                    {ARDUINO_MEGA_PINS.power.map((p) => renderPinSocket(p, "megaPwr", "top"))}
                    {ARDUINO_MEGA_PINS.analog.map((p) => renderPinSocket(p, "megaAna", "top"))}
                    {ARDUINO_MEGA_PINS.dualDigital.map((p) => renderPinSocket(p, "megaDual", "left"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 3. ARDUINO NANO RENDERER
    // ==========================================
    if (type === "arduino-nano") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isD13Lit = Boolean(isPowered && simState?.d13High);
        const isTxRxActive = Boolean(isPowered && (simState?.txrxActive || simState?.serialActive));

        return (
            <div
                className={`mcu-board-container arduino-nano-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0"
                }}
                onMouseDown={(e) => {
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Tinkercad USB Plug Module */}
                <div className={`tinkercad-usb-cable nano-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell mini-shell"></div>
                </div>

                <div className="nano-pcb-surface">
                    <div className="nano-usb-port">
                        <div className="usb-shield-metallic"></div>
                    </div>
                    <div className="nano-reset-btn" title="Reset Button">
                        <div className="reset-actuator"></div>
                    </div>
                    <div className="nano-atmega-ic"></div>
                    <div className="nano-branding">
                        <span className="nano-title">ARDUINO</span>
                        <span className="nano-subtitle">NANO</span>
                    </div>

                    <div className="nano-leds-cluster">
                        <span className={`micro-smd-led led-pwr ${isPowered ? "lit" : ""}`} title="PWR"></span>
                        <span className={`micro-smd-led led-d13 ${isD13Lit ? "lit" : ""}`} title="Pin 13"></span>
                        <span className={`micro-smd-led led-tx ${isTxRxActive ? "pulse" : ""}`} title="TX"></span>
                        <span className={`micro-smd-led led-rx ${isTxRxActive ? "pulse" : ""}`} title="RX"></span>
                    </div>
                </div>

                <div className="mcu-pin-sockets-layer">
                    {ARDUINO_NANO_PINS.topRow.map((p) => renderPinSocket(p, "nanoTop", "bot"))}
                    {ARDUINO_NANO_PINS.botRow.map((p) => renderPinSocket(p, "nanoBot", "top"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4. RASPBERRY PI PICO (RP2040 40-PIN)
    // ==========================================
    if (type === "rpi-pico" || type === "raspberry-pi") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isLedLit = Boolean(isPowered && (simState?.pins?.["25"] === 1 || simState?.gp25High));

        return (
            <div
                className={`mcu-board-container rpi-pico-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 128,
                    height: 368
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* USB Cable Plug inserting from Top */}
                <div className={`tinkercad-usb-cable pico-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell micro-shell"></div>
                </div>

                {/* Raspberry Pi Signature Green PCB Surface */}
                <div className="pico-pcb-surface">
                    {/* Micro-USB B Receptacle (Top Center) */}
                    <div className="pico-usb-port" title="Micro-USB Power & Data Port">
                        <div className="pico-usb-metal-shell"></div>
                    </div>

                    {/* RP2040 Dual-Core ARM Cortex-M0+ SoC */}
                    <div className="pico-rp2040-chip" title="RP2040 Microcontroller (Dual ARM Cortex-M0+ @ 133MHz)">
                        <div className="rp2040-die-square"></div>
                        <span className="rp2040-label">RP2-B2</span>
                        <span className="rp2040-sub">21/04</span>
                    </div>

                    {/* 2MB QSPI Flash Memory */}
                    <div className="pico-flash-chip" title="2MB QSPI Flash (W25Q16JV)">
                        <span className="flash-label">WINBOND</span>
                    </div>

                    {/* 12.000 MHz Crystal Oscillator */}
                    <div className="pico-crystal" title="12.000 MHz Crystal">
                        <span className="crystal-text">12.000</span>
                    </div>

                    {/* Tactile BOOTSEL Push Button */}
                    <div className="pico-bootsel-btn" title="BOOTSEL (USB Mass Storage Boot)">
                        <div className="bootsel-cap"></div>
                        <span className="bootsel-label">BOOTSEL</span>
                    </div>

                    {/* User Onboard Green LED (GP25) */}
                    <div className="pico-led-item" title="User LED (GP25)">
                        <span className={`micro-smd-led led-gp25 ${isLedLit ? "lit" : ""}`}></span>
                        <span className="smd-label">LED</span>
                    </div>

                    {/* Silkscreen Raspberry Pi Pico Branding */}
                    <div className="pico-silkscreen-branding">
                        <div className="pico-raspberry-logo">🍇</div>
                        <div className="pico-brand-text">
                            <span className="pico-title">Raspberry Pi</span>
                            <span className="pico-model">Pico</span>
                        </div>
                        <span className="pico-tw-badge">TWINLAB X</span>
                    </div>

                    {/* Castellated Gold Edge Pads */}
                    <div className="pico-castellated-edge left-edge"></div>
                    <div className="pico-castellated-edge right-edge"></div>
                </div>

                {/* Dual 20-Pin Pin Sockets (Left: GP0-GP15, Right: VBUS-GP16) */}
                <div className="mcu-pin-sockets-layer">
                    {RPI_PICO_PINS.leftCol.map((p) => renderPinSocket(p, "picoL", "espLeft"))}
                    {RPI_PICO_PINS.rightCol.map((p) => renderPinSocket(p, "picoR", "espRight"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4b. ESP8266 NODEMCU (12-E / 30-PIN)
    // ==========================================
    if (type === "esp8266-nodemcu" || type === "esp8266") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isD4Lit = Boolean(isPowered && (simState?.d4High || simState?.pins?.["2"] === 1 || simState?.pins?.["D4"] === 1));

        return (
            <div
                className={`mcu-board-container esp8266-nodemcu-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 304,
                    height: 144
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* USB Cable Plug from Right */}
                <div className={`tinkercad-usb-cable nodemcu-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell micro-shell"></div>
                </div>

                <div className="nodemcu-pcb-surface">
                    {/* Mounting Holes */}
                    <div className="nodemcu-mount-hole" style={{ top: 8, left: 8 }}></div>
                    <div className="nodemcu-mount-hole" style={{ bottom: 8, left: 8 }}></div>
                    <div className="nodemcu-mount-hole" style={{ top: 8, right: 8 }}></div>
                    <div className="nodemcu-mount-hole" style={{ bottom: 8, right: 8 }}></div>

                    {/* Gold Serpentine Trace WiFi Antenna */}
                    <div className="nodemcu-wifi-antenna">
                        <svg width="40" height="96" viewBox="0 0 40 96">
                            <path
                                d="M 5 8 L 32 8 L 32 20 L 8 20 L 8 32 L 32 32 L 32 44 L 8 44 L 8 56 L 32 56 L 32 68 L 8 68 L 8 80 L 32 80 L 32 90 L 5 90"
                                fill="none"
                                stroke="#eab308"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    {/* ESP-12E / ESP8266MOD Silver Metal RF Shield */}
                    <div className="nodemcu-rf-can">
                        <div className="nodemcu-rf-header">
                            <span className="nodemcu-wifi-icon">📶</span>
                            <span className="nodemcu-wifi-text">Wi-Fi</span>
                        </div>
                        <span className="nodemcu-mod-label">ESP8266MOD</span>
                        <div className="nodemcu-fcc-row">
                            <span className="nodemcu-fcc-logo">FC</span>
                            <div className="nodemcu-specs">
                                <span>ISM 2.4GHz</span>
                                <span>PA +25dBm</span>
                                <span>802.11 b/g/n</span>
                            </div>
                        </div>
                    </div>

                    {/* Micro-USB Port on Right */}
                    <div className="nodemcu-usb-port">
                        <div className="nodemcu-usb-metal">
                            <div className="nodemcu-usb-slot"></div>
                        </div>
                    </div>

                    {/* Tactile Buttons: RST & FLASH */}
                    <div 
                        className="nodemcu-btn nodemcu-btn-rst" 
                        title="RST (Reset)"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="nodemcu-btn-cap"></div>
                        <span className="nodemcu-btn-label">RST</span>
                    </div>

                    <div 
                        className="nodemcu-btn nodemcu-btn-flash" 
                        title="FLASH (GPIO 0 Bootloader)"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="nodemcu-btn-cap"></div>
                        <span className="nodemcu-btn-label">FLASH</span>
                    </div>

                    {/* CP2102 USB Bridge IC & Voltage Regulator */}
                    <div className="nodemcu-ic-bridge" title="USB-UART CP2102 Bridge"></div>
                    <div className="nodemcu-regulator" title="AMS1117 3.3V LDO Voltage Regulator">
                        <div className="nodemcu-regulator-tab"></div>
                    </div>
                    <div className="nodemcu-tantalum-cap"></div>

                    {/* SMD Status LEDs: D4 (GPIO 2, Blue) and Power (Red) */}
                    <span 
                        className={`nodemcu-led-d4 ${isD4Lit ? "lit" : ""}`} 
                        title="Built-in User LED (GPIO 2 / D4)"
                    ></span>
                    <span 
                        className={`nodemcu-led-pwr ${isPowered ? "lit" : ""}`} 
                        title="Power 3.3V LED"
                    ></span>
                </div>

                {/* Dual 15-Pin Sockets with Pin labels */}
                <div className="mcu-pin-sockets-layer">
                    {ESP8266_NODEMCU_PINS.topRow.map((p) => renderPinSocket(p, "nodemcuTop", "bot"))}
                    {ESP8266_NODEMCU_PINS.botRow.map((p) => renderPinSocket(p, "nodemcuBot", "top"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4c. STM32 NUCLEO-64 (NUCLEO-F401RE)
    // ==========================================
    if (type === "stm32-nucleo" || type === "stm32-f401re") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isLD2Lit = Boolean(isPowered && (simState?.d13High || simState?.pins?.["13"] === 1 || simState?.pins?.["PA5"] === 1));

        return (
            <div
                className={`mcu-board-container stm32-nucleo-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 384,
                    height: 240
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* USB Cable Plug from Left (ST-LINK) */}
                <div className={`tinkercad-usb-cable nucleo-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell mini-shell"></div>
                </div>

                <div className="nucleo-pcb-surface">
                    {/* Mounting Holes with Gold Washers */}
                    <div className="nucleo-mount-hole" style={{ top: 12, left: 12 }}></div>
                    <div className="nucleo-mount-hole" style={{ bottom: 12, left: 12 }}></div>
                    <div className="nucleo-mount-hole" style={{ top: 12, right: 12 }}></div>
                    <div className="nucleo-mount-hole" style={{ bottom: 12, right: 12 }}></div>

                    {/* Morpho Headers Background Rails */}
                    <div className="nucleo-morpho-top"></div>
                    <div className="nucleo-morpho-bot"></div>
                    <div className="nucleo-arduino-right"></div>

                    {/* ST Logo (Top Left) */}
                    <div className="nucleo-st-logo">
                        <svg width="34" height="26" viewBox="0 0 34 26">
                            <path d="M 4 20 L 14 6 L 24 6 L 14 20 Z" fill="#0284c7" />
                            <path d="M 18 20 L 26 8 L 32 8 L 24 20 Z" fill="#0284c7" />
                        </svg>
                    </div>

                    {/* Mini-USB Port on Left (ST-LINK V2-1) */}
                    <div className="nucleo-usb-port" title="ST-LINK Debug & USB Power Port"></div>

                    {/* Central STM32F401RET6 LQFP64 ARM Cortex-M4 MCU */}
                    <div className="nucleo-mcu-chip" title="STM32F401RET6 ARM Cortex-M4 @ 84MHz">
                        <div className="nucleo-chip-brand">ST</div>
                        <div className="nucleo-chip-model">STM32F401RE</div>
                        <div className="nucleo-chip-details">VGT6 7B442</div>
                    </div>

                    {/* 8.000 MHz Metal Can Crystal */}
                    <div className="nucleo-crystal" title="8.000 MHz Crystal Oscillator">
                        8.000
                    </div>

                    {/* Blue USER Button (PC13) */}
                    <div 
                        className="nucleo-btn-user" 
                        title="USER Button (PC13)"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="nucleo-btn-user-cap"></div>
                        <span className="nucleo-btn-user-label">USER</span>
                    </div>

                    {/* Black/Blue RESET Button */}
                    <div 
                        className="nucleo-btn-reset" 
                        title="RESET Button (NRST)"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="nucleo-btn-reset-cap"></div>
                        <span className="nucleo-btn-reset-label">RESET</span>
                    </div>

                    {/* Status LEDs: LD2 (PA5/D13 Green) and LD3 (PWR Red) */}
                    <span 
                        className={`nucleo-led-ld2 ${isLD2Lit ? "lit" : ""}`} 
                        title="User LED LD2 (PA5 / Arduino D13)"
                    ></span>
                    <span 
                        className={`nucleo-led-pwr ${isPowered ? "lit" : ""}`} 
                        title="PWR 5V LED (LD3)"
                    ></span>

                    {/* Large ST Nucleo Silkscreen Branding */}
                    <div className="nucleo-big-logo">
                        <div className="nucleo-title">NUCLEO</div>
                        <div className="nucleo-subtitle">F401RE</div>
                    </div>
                </div>

                {/* Arduino Uno-compatible Header Sockets */}
                <div className="mcu-pin-sockets-layer">
                    {STM32_NUCLEO_PINS.topDigital.map((p) => renderPinSocket(p, "nucleoTop", "bot"))}
                    {STM32_NUCLEO_PINS.botAnalogPower.map((p) => renderPinSocket(p, "nucleoBot", "top"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4d. TEENSY 4.1 (ARM CORTEX-M7 @ 600MHz)
    // ==========================================
    if (type === "teensy-41" || type === "teensy41") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isPin13Lit = Boolean(isPowered && (simState?.d13High || simState?.pins?.["13"] === 1));

        return (
            <div
                className={`mcu-board-container teensy41-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 416,
                    height: 112
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                {/* Micro-USB Cable Plug from Left */}
                <div className={`tinkercad-usb-cable teensy-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell micro-shell"></div>
                </div>

                <div className="teensy41-pcb-surface">
                    {/* Micro-USB Connector on Left */}
                    <div className="teensy41-usb-port" title="Micro-USB 480 Mbit/sec High Speed">
                        <div className="teensy41-usb-tongue"></div>
                    </div>

                    {/* NXP i.MX RT1062 ARM Cortex-M7 @ 600 MHz Processor */}
                    <div className="teensy41-nxp-chip" title="NXP i.MX RT1062 ARM Cortex-M7 @ 600 MHz">
                        <div className="teensy41-chip-logo">NXP</div>
                        <div className="teensy41-chip-text">
                            MIMXRT1062<br />DVJ6A
                        </div>
                    </div>

                    {/* Winbond 8MB QSPI Flash Memory */}
                    <div className="teensy41-flash-chip" title="8MB QSPI Flash Memory"></div>

                    {/* Gold Tactile Program Button */}
                    <div 
                        className="teensy41-btn-prog" 
                        title="Program Button (HalfKay Bootloader)"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="teensy41-btn-prog-cap"></div>
                    </div>

                    {/* Micro-SD Push-Push Socket on Right */}
                    <div className="teensy41-sd-slot" title="Micro-SD Card Slot (4-bit SDIO)">
                        <div className="teensy41-sd-notch"></div>
                    </div>

                    {/* Amber/Orange LED on Pin 13 */}
                    <span 
                        className={`teensy41-led-13 ${isPin13Lit ? "lit" : ""}`} 
                        title="User LED (Pin 13)"
                    ></span>
                </div>

                {/* 48-Pin DIP Layout: 24 pins top, 24 pins bottom */}
                <div className="mcu-pin-sockets-layer">
                    {TEENSY41_PINS.topRow.map((p) => renderPinSocket(p, "teensyTop", "bot"))}
                    {TEENSY41_PINS.botRow.map((p) => renderPinSocket(p, "teensyBot", "top"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4e. RASPBERRY PI PICO 2 (RP2350 ARM/RISC-V)
    // ==========================================
    if (type === "rpi-pico-2") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isLedLit = Boolean(isPowered && (simState?.pins?.["25"] === 1 || simState?.gp25High));

        return (
            <div
                className={`mcu-board-container rpi-pico-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 128,
                    height: 368
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                <div className={`tinkercad-usb-cable pico-usb-cable ${isPowered ? "connected" : "unplugged"}`}>
                    <div className="usb-plug-strain-relief"></div>
                    <div className="usb-plug-metal-shell micro-shell"></div>
                </div>

                <div className="pico-pcb-surface">
                    <div className="pico-usb-port" title="Micro-USB Power & Data Port">
                        <div className="pico-usb-metal-shell"></div>
                    </div>
                    <div className="pico-rp2040-chip" title="RP2350 Microcontroller (Dual ARM Cortex-M33 / Hazard3 RISC-V @ 150MHz)">
                        <div className="rp2040-die-square"></div>
                        <span className="rp2040-label">RP2350</span>
                        <span className="rp2040-sub">24/16</span>
                    </div>
                    <div className="pico-flash-chip" title="4MB QSPI Flash (W25Q32JV)">
                        <span className="flash-label">WINBOND</span>
                    </div>
                    <div className="pico-crystal" title="12.000 MHz Crystal">
                        <span className="crystal-text">12.000</span>
                    </div>
                    <div className="pico-bootsel-btn" title="BOOTSEL (USB Bootloader)">
                        <div className="bootsel-cap"></div>
                        <span className="bootsel-label">BOOTSEL</span>
                    </div>
                    <div className="pico-led-item" title="User LED (GP25)">
                        <span className={`micro-smd-led led-gp25 ${isLedLit ? "lit" : ""}`}></span>
                        <span className="smd-label">LED</span>
                    </div>
                    <div className="pico-silkscreen-branding">
                        <div className="pico-raspberry-logo">🍇</div>
                        <div className="pico-brand-text">
                            <span className="pico-title">Raspberry Pi</span>
                            <span className="pico-model">Pico 2</span>
                        </div>
                        <span className="pico-tw-badge">TWINLAB X</span>
                    </div>
                    <div className="pico-castellated-edge left-edge"></div>
                    <div className="pico-castellated-edge right-edge"></div>
                </div>

                <div className="mcu-pin-sockets-layer">
                    {RPI_PICO_PINS.leftCol.map((p) => renderPinSocket(p, "picoL", "espLeft"))}
                    {RPI_PICO_PINS.rightCol.map((p) => renderPinSocket(p, "picoR", "espRight"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4f. STM32 BLUE PILL & BLACK PILL (Cortex-M3/M4)
    // ==========================================
    if (type === "stm32-blue-pill" || type === "stm32-bluepill" || type === "stm32-black-pill") {
        const isBlackPill = type === "stm32-black-pill";
        const isPowered = Boolean(isSimulating || simState?.isPowered);
        const isPC13Lit = Boolean(isPowered && (simState?.pins?.["13"] === 1 || simState?.d13High));

        return (
            <div
                className={`mcu-board-container custom-mcu-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 128,
                    height: 352
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                <div 
                    className="stm32-bluepill-pcb"
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        background: isBlackPill ? "#18181b" : "#1d4ed8",
                        borderRadius: 6,
                        border: isBlackPill ? "1.5px solid #27272a" : "1.5px solid #1e40af",
                        boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                        overflow: "hidden"
                    }}
                >
                    {/* Micro-USB Port on Top */}
                    <div style={{ position: "absolute", top: -2, left: 44, width: 40, height: 22, background: "linear-gradient(180deg, #cbd5e1, #94a3b8)", borderRadius: 3, border: "1px solid #64748b" }}></div>

                    {/* Reset Button */}
                    <div style={{ position: "absolute", top: 32, left: 52, width: 24, height: 24, background: "#1e293b", borderRadius: "50%", border: "1.5px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444" }}></div>
                    </div>

                    {/* Yellow BOOT0 and BOOT1 Jumpers */}
                    <div style={{ position: "absolute", top: 66, left: 38, display: "flex", gap: 12 }}>
                        <div style={{ width: 18, height: 12, background: "#eab308", borderRadius: 2, border: "1px solid #a16207" }}></div>
                        <div style={{ width: 18, height: 12, background: "#eab308", borderRadius: 2, border: "1px solid #a16207" }}></div>
                    </div>

                    {/* Center STM32F103 / STM32F401 LQFP-48 Chip */}
                    <div 
                        style={{
                            position: "absolute",
                            top: 130,
                            left: 36,
                            width: 56,
                            height: 56,
                            background: "#09090b",
                            borderRadius: 3,
                            border: "1px solid #27272a",
                            transform: "rotate(45deg)",
                            boxShadow: "0 3px 8px rgba(0,0,0,0.6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <span style={{ transform: "rotate(-45deg)", color: "#cbd5e1", fontSize: 6.5, fontWeight: 900, fontFamily: "monospace", textAlign: "center", lineHeight: 1.1 }}>
                            {isBlackPill ? "STM32F401\nCCU6" : "STM32F103\nC8T6"}
                        </span>
                    </div>

                    {/* 8.000 MHz Crystal Oscillator */}
                    <div style={{ position: "absolute", top: 210, left: 44, width: 40, height: 16, background: "linear-gradient(135deg, #e2e8f0, #cbd5e1)", borderRadius: 8, border: "1px solid #94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6.5, fontWeight: 800, color: "#334155", fontFamily: "monospace" }}>
                        8.000
                    </div>

                    {/* LEDs: Red PWR & Green User PC13 */}
                    <div style={{ position: "absolute", bottom: 44, left: 36, display: "flex", gap: 32 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 1, background: isPowered ? "#ef4444" : "#475569", boxShadow: isPowered ? "0 0 6px #ef4444" : "none" }}></div>
                        <div style={{ width: 6, height: 6, borderRadius: 1, background: isPC13Lit ? "#22c55e" : "#475569", boxShadow: isPC13Lit ? "0 0 6px #22c55e" : "none" }}></div>
                    </div>

                    {/* Silkscreen text */}
                    <div style={{ position: "absolute", bottom: 12, left: 0, width: "100%", textAlign: "center", color: "#ffffff", fontSize: 8, fontWeight: 900, letterSpacing: "0.06em" }}>
                        {isBlackPill ? "STM32 BLACK PILL" : "STM32 BLUE PILL"}
                    </div>
                </div>

                {/* Dual 20-Pin Pin Sockets */}
                <div className="mcu-pin-sockets-layer">
                    {STM32_BLUEPILL_PINS.leftCol.map((p) => renderPinSocket(p, "bpL", "espLeft"))}
                    {STM32_BLUEPILL_PINS.rightCol.map((p) => renderPinSocket(p, "bpR", "espRight"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4g. ATTINY85 (DIP-8 Microcontroller)
    // ==========================================
    if (type === "attiny85") {
        const isPowered = Boolean(isSimulating || simState?.isPowered);

        return (
            <div
                className={`mcu-board-container custom-mcu-board ${isSelected ? "selected" : ""}`}
                style={{
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0",
                    width: 64,
                    height: 80
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                <div 
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        background: "#09090b",
                        borderRadius: 4,
                        border: "1.5px solid #27272a",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                >
                    {/* Top Notch */}
                    <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 14, height: 6, borderRadius: "0 0 7px 7px", background: "#18181b", border: "1px solid #27272a" }}></div>
                    {/* Pin 1 Dot */}
                    <div style={{ position: "absolute", top: 12, left: 10, width: 4, height: 4, borderRadius: "50%", background: "#3f3f46" }}></div>
                    <span style={{ color: "#f8fafc", fontSize: 6.5, fontWeight: 900, fontFamily: "monospace", letterSpacing: "0.02em" }}>ATTINY85</span>
                    <span style={{ color: "#94a3b8", fontSize: 5, fontFamily: "monospace" }}>20PU 8MHz</span>
                    <div style={{ position: "absolute", bottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: isPowered ? "#22c55e" : "#ef4444" }}></span>
                        <span style={{ color: "#64748b", fontSize: 5, fontWeight: 700 }}>8-BIT</span>
                    </div>
                </div>

                <div className="mcu-pin-sockets-layer">
                    {ATTINY85_PINS.leftCol.map((p) => renderPinSocket(p, "atL", "espLeft"))}
                    {ATTINY85_PINS.rightCol.map((p) => renderPinSocket(p, "atR", "espRight"))}
                </div>
            </div>
        );
    }

    // ==========================================
    // 4h. NXP LPC1768, TI TIVA C, TI MSP430, PIC18F4550, NORDIC NRF52840
    // Vector Hardware Development Boards (Zero image dependencies)
    // ==========================================
    const VECTOR_DEV_BOARDS = {
        "nxp-lpc1768": { name: "NXP LPC1768", chip: "LPC1768", arch: "Cortex-M3 96MHz", w: 176, h: 80, bg: "#1e3a8a", border: "#1d4ed8" },
        "ti-tiva-c": { name: "TI Tiva C", chip: "TM4C123G", arch: "Cortex-M4F 80MHz", w: 220, h: 120, bg: "#7f1d1d", border: "#991b1b" },
        "ti-msp430": { name: "TI MSP430", chip: "MSP430G2553", arch: "16-Bit Ultra-Low", w: 180, h: 110, bg: "#7f1d1d", border: "#991b1b" },
        "pic18f4550": { name: "PIC18F4550", chip: "PIC18F4550", arch: "Microchip USB MCU", w: 160, h: 90, bg: "#0f172a", border: "#334155" },
        "nordic-nrf52840": { name: "Nordic nRF52840", chip: "nRF52840", arch: "BLE 5.4 / 2.4GHz", w: 180, h: 90, bg: "#0369a1", border: "#0284c7" }
    };

    if (VECTOR_DEV_BOARDS[type]) {
        const boardMeta = VECTOR_DEV_BOARDS[type];
        const isPowered = Boolean(isSimulating || simState?.isPowered);

        return (
            <div
                className={`mcu-board-container custom-mcu-board ${isSelected ? "selected" : ""}`}
                style={{
                    width: boardMeta.w,
                    height: boardMeta.h,
                    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                    transformOrigin: "0 0"
                }}
                onMouseDown={(e) => {
                    if (isWireMode) return;
                    onSelect && onSelect(id, e);
                    onMouseDown && onMouseDown(e, id);
                }}
            >
                <div 
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        background: boardMeta.bg,
                        borderRadius: 8,
                        border: `2px solid ${boardMeta.border}`,
                        boxShadow: "0 6px 16px rgba(0,0,0,0.5)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: 8
                    }}
                >
                    {/* Metal USB Jack */}
                    <div style={{ position: "absolute", top: 4, left: 4, width: 24, height: 18, background: "linear-gradient(90deg, #cbd5e1, #94a3b8)", borderRadius: 3, border: "1px solid #64748b" }}></div>

                    {/* Central Processor */}
                    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 52, height: 52, background: "#09090b", borderRadius: 3, border: "1px solid #27272a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 2 }}>
                        <span style={{ color: "#f8fafc", fontSize: 6.5, fontWeight: 900, fontFamily: "monospace" }}>{boardMeta.chip}</span>
                        <span style={{ color: "#94a3b8", fontSize: 5, fontFamily: "monospace", textAlign: "center" }}>{boardMeta.arch}</span>
                    </div>

                    {/* Top and Bottom Pin Header Tracks */}
                    <div style={{ position: "absolute", top: 4, left: 34, right: 8, height: 6, background: "#0f172a", borderRadius: 2 }}></div>
                    <div style={{ position: "absolute", bottom: 4, left: 8, right: 8, height: 6, background: "#0f172a", borderRadius: 2 }}></div>

                    {/* Bottom Info Bar with Power Indicator */}
                    <div style={{ position: "absolute", bottom: 12, left: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.75)", padding: "2px 6px", borderRadius: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isPowered ? "#22c55e" : "#ef4444", boxShadow: isPowered ? "0 0 6px #22c55e" : "none" }}></span>
                        <span style={{ color: "#e2e8f0", fontSize: 8, fontWeight: 800, letterSpacing: "0.03em" }}>{name || boardMeta.name}</span>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 5. ESP32 DEVKIT V1 (30-PIN DUAL-ROW)
    // ==========================================
    const isPowered = Boolean(isSimulating || simState?.isPowered);
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
                onSelect && onSelect(id, e);
                onMouseDown && onMouseDown(e, id);
            }}
        >
            {/* Tinkercad USB Type-C Plug Module inserting from Bottom */}
            <div className={`tinkercad-usb-cable esp32-typec-cable ${isPowered ? "connected" : "unplugged"}`}>
                <div className="typec-plug-strain-relief"></div>
                <div className="typec-plug-metal-shell"></div>
            </div>

            {/* Matte Dark PCB Surface with Gold Traces */}
            <div className="esp32-pcb-surface">
                {/* ESP-WROOM-32 Metal RF Shielding Can with Meandered Antenna */}
                <div className="esp32-metal-can">
                    <div className="pcb-antenna-trace"></div>
                    <div className="metal-can-plate">
                        <span className="can-brand">ESPRESSIF</span>
                        <span className="can-model">ESP-WROOM-32</span>
                        <span className="can-fcc">FCC ID: 2AC7Z-ESPWROOM32</span>
                        <div className="esp32-x-badge">TWINLAB X</div>
                    </div>
                </div>

                {/* CP2102 USB-to-UART Bridge IC */}
                <div className="esp32-uart-ic">
                    <span className="uart-label">CP2102</span>
                </div>

                {/* Modern USB Type-C Receptacle Hub at bottom */}
                <div className="esp32-typec-hub" title="USB Type-C Connector">
                    <div className="typec-slot-inner">
                        <div className="typec-center-tongue"></div>
                    </div>
                </div>

                {/* Tactile Push Buttons: EN and BOOT */}
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

            {/* Dual 15-pin Headers with Permanent Silkscreen Labels positioned on the outer board margin (never covering the middle chip) */}
            <div className="mcu-pin-sockets-layer">
                {ESP32_PINS.leftCol.map((p) => renderPinSocket(p, "espL", "espLeft"))}
                {ESP32_PINS.rightCol.map((p) => renderPinSocket(p, "espR", "espRight"))}
            </div>
        </div>
    );
}

export default McuBoard;
