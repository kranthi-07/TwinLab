import "./McuBoard.css";
import { useState, useRef } from "react";
import { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, RPI_PICO_PINS, ESP32_PINS } from "./mcuPins.js";

export { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, RPI_PICO_PINS, ESP32_PINS };

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
    // 4b. PHOTO-ACCURATE CUSTOM DEVELOPMENT BOARDS
    // (ESP8266, Pico 2, STM32 Nucleo, Blue/Black Pill, LPC1768, Tiva C, MSP430, PIC18, nRF52840, Teensy 4.1, ATtiny85)
    // ==========================================
    const BOARD_IMAGE_MAP = {
        "esp8266-nodemcu": { img: "/images/boards/esp8266-nodemcu.jpg", name: "ESP8266 NodeMCU", w: 200, h: 120 },
        "rpi-pico-2": { img: "/images/boards/rpi-pico-2.jpg", name: "Raspberry Pi Pico 2", w: 176, h: 80 },
        "stm32-nucleo": { img: "/images/boards/stm32-nucleo.jpg", name: "STM32 Nucleo", w: 240, h: 160 },
        "stm32-blue-pill": { img: "/images/boards/stm32-blue-pill.jpg", name: "STM32 Blue Pill", w: 176, h: 80 },
        "stm32-bluepill": { img: "/images/boards/stm32-blue-pill.jpg", name: "STM32 Blue Pill", w: 176, h: 80 },
        "stm32-black-pill": { img: "/images/boards/stm32-black-pill.jpg", name: "STM32 Black Pill", w: 176, h: 80 },
        "nxp-lpc1768": { img: "/images/boards/nxp-lpc1768.jpg", name: "NXP LPC1768", w: 176, h: 80 },
        "ti-tiva-c": { img: "/images/boards/ti-tiva-c.jpg", name: "TI Tiva C LaunchPad", w: 220, h: 140 },
        "ti-msp430": { img: "/images/boards/ti-msp430.jpg", name: "TI MSP430 LaunchPad", w: 180, h: 120 },
        "pic18f4550": { img: "/images/boards/pic18f4550.jpg", name: "PIC18F4550", w: 160, h: 100 },
        "nordic-nrf52840": { img: "/images/boards/nordic-nrf52840.jpg", name: "Nordic nRF52840", w: 180, h: 90 },
        "attiny85": { img: "/images/boards/attiny85.jpg", name: "ATtiny85", w: 64, h: 64 },
        "teensy-41": { img: "/images/boards/teensy-41.jpg", name: "Teensy 4.1", w: 192, h: 72 }
    };

    if (BOARD_IMAGE_MAP[type]) {
        const boardMeta = BOARD_IMAGE_MAP[type];
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
                <div className="custom-board-surface" style={{ width: "100%", height: "100%", position: "relative", borderRadius: 8, overflow: "hidden", background: "#0f172a", border: "1.5px solid #334155", boxShadow: "0 6px 16px rgba(0,0,0,0.4)" }}>
                    <img 
                        src={boardMeta.img} 
                        alt={boardMeta.name} 
                        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} 
                    />
                    <div style={{ position: "absolute", bottom: 4, left: 6, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.75)", padding: "2px 6px", borderRadius: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: isPowered ? "#22c55e" : "#ef4444", boxShadow: isPowered ? "0 0 6px #22c55e" : "none" }}></span>
                        <span style={{ color: "#e2e8f0", fontSize: 9, fontWeight: 700, letterSpacing: "0.03em" }}>{name || boardMeta.name}</span>
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
