import "./McuBoard.css";
import { useState, useRef } from "react";

// Exact 16px grid alignment constants
const GRID_STEP = 16;

// Arduino Uno R3 Header Pin Definitions (Exact 16px pitch layout)
export const ARDUINO_PINS = {
    // Top Digital High Header (10 pins from local x: 32 to 176 on 16px pitch)
    digitalHigh: [
        { name: "SCL", x: 32, y: 16, pinNum: "SCL" },
        { name: "SDA", x: 48, y: 16, pinNum: "SDA" },
        { name: "AREF", x: 64, y: 16, pinNum: "AREF" },
        { name: "GND", x: 80, y: 16, isGnd: true, pinNum: "GND" },
        { name: "13", x: 96, y: 16, isGpio: true, isD13: true, pinNum: 13 },
        { name: "12", x: 112, y: 16, isGpio: true, pinNum: 12 },
        { name: "~11", x: 128, y: 16, isGpio: true, pinNum: 11 },
        { name: "~10", x: 144, y: 16, isGpio: true, pinNum: 10 },
        { name: "~9", x: 160, y: 16, isGpio: true, pinNum: 9 },
        { name: "8", x: 176, y: 16, isGpio: true, pinNum: 8 },
    ],
    // Top Digital Low Header (8 pins from local x: 192 to 304 on 16px pitch, after 16px gap)
    digitalLow: [
        { name: "7", x: 192, y: 16, isGpio: true, pinNum: 7 },
        { name: "~6", x: 208, y: 16, isGpio: true, pinNum: 6 },
        { name: "~5", x: 224, y: 16, isGpio: true, pinNum: 5 },
        { name: "4", x: 240, y: 16, isGpio: true, pinNum: 4 },
        { name: "~3", x: 256, y: 16, isGpio: true, pinNum: 3 },
        { name: "2", x: 272, y: 16, isGpio: true, pinNum: 2 },
        { name: "TX>1", x: 288, y: 16, isGpio: true, pinNum: 1 },
        { name: "RX<0", x: 304, y: 16, isGpio: true, pinNum: 0 },
    ],
    // Bottom Power Header (8 pins from local x: 64 to 176 on 16px pitch)
    power: [
        { name: "NC", x: 64, y: 208, pinNum: "NC" },
        { name: "IOREF", x: 80, y: 208, is5V: true, pinNum: "IOREF" },
        { name: "RESET", x: 96, y: 208, pinNum: "RESET" },
        { name: "3.3V", x: 112, y: 208, is3V3: true, pinNum: "3.3V" },
        { name: "5V", x: 128, y: 208, is5V: true, pinNum: "5V" },
        { name: "GND", x: 144, y: 208, isGnd: true, pinNum: "GND" },
        { name: "GND", x: 160, y: 208, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 176, y: 208, is5V: true, pinNum: "VIN" },
    ],
    // Bottom Analog Header (6 pins from local x: 208 to 288 on 16px pitch)
    analog: [
        { name: "A0", x: 208, y: 208, isAnalog: true, pinNum: "A0" },
        { name: "A1", x: 224, y: 208, isAnalog: true, pinNum: "A1" },
        { name: "A2", x: 240, y: 208, isAnalog: true, pinNum: "A2" },
        { name: "A3", x: 256, y: 208, isAnalog: true, pinNum: "A3" },
        { name: "A4", x: 272, y: 208, isAnalog: true, pinNum: "A4" },
        { name: "A5", x: 288, y: 208, isAnalog: true, pinNum: "A5" },
    ]
};

// Arduino Mega 2560 Header Pin Definitions (Exact 16px pitch layout)
export const ARDUINO_MEGA_PINS = {
    digitalHigh: [
        { name: "SCL", x: 32, y: 16, pinNum: "SCL" },
        { name: "SDA", x: 48, y: 16, pinNum: "SDA" },
        { name: "AREF", x: 64, y: 16, pinNum: "AREF" },
        { name: "GND", x: 80, y: 16, isGnd: true, pinNum: "GND" },
        { name: "13", x: 96, y: 16, isGpio: true, isD13: true, pinNum: 13 },
        { name: "~12", x: 112, y: 16, isGpio: true, pinNum: 12 },
        { name: "~11", x: 128, y: 16, isGpio: true, pinNum: 11 },
        { name: "~10", x: 144, y: 16, isGpio: true, pinNum: 10 },
        { name: "~9", x: 160, y: 16, isGpio: true, pinNum: 9 },
        { name: "~8", x: 176, y: 16, isGpio: true, pinNum: 8 },
    ],
    digitalLow: [
        { name: "~7", x: 192, y: 16, isGpio: true, pinNum: 7 },
        { name: "~6", x: 208, y: 16, isGpio: true, pinNum: 6 },
        { name: "~5", x: 224, y: 16, isGpio: true, pinNum: 5 },
        { name: "~4", x: 240, y: 16, isGpio: true, pinNum: 4 },
        { name: "~3", x: 256, y: 16, isGpio: true, pinNum: 3 },
        { name: "~2", x: 272, y: 16, isGpio: true, pinNum: 2 },
        { name: "TX>1", x: 288, y: 16, isGpio: true, pinNum: 1 },
        { name: "RX<0", x: 304, y: 16, isGpio: true, pinNum: 0 },
    ],
    communication: [
        { name: "TX1>18", x: 320, y: 16, isGpio: true, pinNum: 18 },
        { name: "RX1<19", x: 336, y: 16, isGpio: true, pinNum: 19 },
        { name: "TX2>16", x: 352, y: 16, isGpio: true, pinNum: 16 },
        { name: "RX2<17", x: 368, y: 16, isGpio: true, pinNum: 17 },
        { name: "TX3>14", x: 384, y: 16, isGpio: true, pinNum: 14 },
        { name: "RX3<15", x: 400, y: 16, isGpio: true, pinNum: 15 },
        { name: "SDA>20", x: 416, y: 16, isGpio: true, pinNum: 20 },
        { name: "SCL>21", x: 432, y: 16, isGpio: true, pinNum: 21 },
    ],
    power: [
        { name: "NC", x: 64, y: 208, pinNum: "NC" },
        { name: "IOREF", x: 80, y: 208, is5V: true, pinNum: "IOREF" },
        { name: "RESET", x: 96, y: 208, pinNum: "RESET" },
        { name: "3.3V", x: 112, y: 208, is3V3: true, pinNum: "3.3V" },
        { name: "5V", x: 128, y: 208, is5V: true, pinNum: "5V" },
        { name: "GND", x: 144, y: 208, isGnd: true, pinNum: "GND" },
        { name: "GND", x: 160, y: 208, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 176, y: 208, is5V: true, pinNum: "VIN" },
    ],
    analog: [
        { name: "A0", x: 192, y: 208, isAnalog: true, pinNum: "A0" },
        { name: "A1", x: 208, y: 208, isAnalog: true, pinNum: "A1" },
        { name: "A2", x: 224, y: 208, isAnalog: true, pinNum: "A2" },
        { name: "A3", x: 240, y: 208, isAnalog: true, pinNum: "A3" },
        { name: "A4", x: 256, y: 208, isAnalog: true, pinNum: "A4" },
        { name: "A5", x: 272, y: 208, isAnalog: true, pinNum: "A5" },
        { name: "A6", x: 288, y: 208, isAnalog: true, pinNum: "A6" },
        { name: "A7", x: 304, y: 208, isAnalog: true, pinNum: "A7" },
        { name: "A8", x: 320, y: 208, isAnalog: true, pinNum: "A8" },
        { name: "A9", x: 336, y: 208, isAnalog: true, pinNum: "A9" },
        { name: "A10", x: 348, y: 208, isAnalog: true, pinNum: "A10" },
        { name: "A11", x: 364, y: 208, isAnalog: true, pinNum: "A11" },
        { name: "A12", x: 380, y: 208, isAnalog: true, pinNum: "A12" },
        { name: "A13", x: 396, y: 208, isAnalog: true, pinNum: "A13" },
        { name: "A14", x: 412, y: 208, isAnalog: true, pinNum: "A14" },
        { name: "A15", x: 428, y: 208, isAnalog: true, pinNum: "A15" },
    ],
    dualDigital: [
        ...[23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51, 53].map((num, i) => ({
            name: `${num}`, x: 448, y: 32 + i * 11, pinNum: num, isGpio: true
        })),
        { name: "GND", x: 448, y: 32 + 16 * 11, isGnd: true, pinNum: "GND" },
        ...[22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52].map((num, i) => ({
            name: `${num}`, x: 464, y: 32 + i * 11, pinNum: num, isGpio: true
        })),
        { name: "5V", x: 464, y: 32 + 16 * 11, is5V: true, pinNum: "5V" }
    ]
};

// Arduino Nano Header Pin Definitions (DIP-30 layout on 16px pitch)
export const ARDUINO_NANO_PINS = {
    topRow: [
        { name: "TX1", x: 16, y: 16, isGpio: true, pinNum: 1 },
        { name: "RX0", x: 32, y: 16, isGpio: true, pinNum: 0 },
        { name: "RST", x: 48, y: 16, pinNum: "RST" },
        { name: "GND", x: 64, y: 16, isGnd: true, pinNum: "GND" },
        { name: "D2", x: 80, y: 16, isGpio: true, pinNum: 2 },
        { name: "~D3", x: 96, y: 16, isGpio: true, pinNum: 3 },
        { name: "D4", x: 112, y: 16, isGpio: true, pinNum: 4 },
        { name: "~D5", x: 128, y: 16, isGpio: true, pinNum: 5 },
        { name: "~D6", x: 144, y: 16, isGpio: true, pinNum: 6 },
        { name: "D7", x: 160, y: 16, isGpio: true, pinNum: 7 },
        { name: "D8", x: 176, y: 16, isGpio: true, pinNum: 8 },
        { name: "~D9", x: 192, y: 16, isGpio: true, pinNum: 9 },
        { name: "~D10", x: 208, y: 16, isGpio: true, pinNum: 10 },
        { name: "~D11", x: 224, y: 16, isGpio: true, pinNum: 11 },
        { name: "D12", x: 240, y: 16, isGpio: true, pinNum: 12 },
    ],
    botRow: [
        { name: "D13", x: 16, y: 80, isGpio: true, isD13: true, pinNum: 13 },
        { name: "3V3", x: 32, y: 80, is3V3: true, pinNum: "3.3V" },
        { name: "REF", x: 48, y: 80, pinNum: "AREF" },
        { name: "A0", x: 64, y: 80, isAnalog: true, pinNum: "A0" },
        { name: "A1", x: 80, y: 80, isAnalog: true, pinNum: "A1" },
        { name: "A2", x: 96, y: 80, isAnalog: true, pinNum: "A2" },
        { name: "A3", x: 112, y: 80, isAnalog: true, pinNum: "A3" },
        { name: "A4", x: 128, y: 80, isAnalog: true, pinNum: "A4" },
        { name: "A5", x: 144, y: 80, isAnalog: true, pinNum: "A5" },
        { name: "A6", x: 160, y: 80, isAnalog: true, pinNum: "A6" },
        { name: "A7", x: 176, y: 80, isAnalog: true, pinNum: "A7" },
        { name: "5V", x: 192, y: 80, is5V: true, pinNum: "5V" },
        { name: "RST", x: 208, y: 80, pinNum: "RST" },
        { name: "GND", x: 224, y: 80, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 240, y: 80, is5V: true, pinNum: "VIN" },
    ]
};

// Raspberry Pi Pico Header Pin Definitions (Standard 40-Pin DIP-like layout on 16px pitch)
export const RPI_PICO_PINS = {
    leftCol: [
        { name: "GP0", x: 16, y: 32, pinNum: 0, isGpio: true },
        { name: "GP1", x: 16, y: 48, pinNum: 1, isGpio: true },
        { name: "GND", x: 16, y: 64, isGnd: true, pinNum: "GND" },
        { name: "GP2", x: 16, y: 80, pinNum: 2, isGpio: true },
        { name: "GP3", x: 16, y: 96, pinNum: 3, isGpio: true },
        { name: "GP4", x: 16, y: 112, pinNum: 4, isGpio: true },
        { name: "GP5", x: 16, y: 128, pinNum: 5, isGpio: true },
        { name: "GND", x: 16, y: 144, isGnd: true, pinNum: "GND" },
        { name: "GP6", x: 16, y: 160, pinNum: 6, isGpio: true },
        { name: "GP7", x: 16, y: 176, pinNum: 7, isGpio: true },
        { name: "GP8", x: 16, y: 192, pinNum: 8, isGpio: true },
        { name: "GP9", x: 16, y: 208, pinNum: 9, isGpio: true },
        { name: "GND", x: 16, y: 224, isGnd: true, pinNum: "GND" },
        { name: "GP10", x: 16, y: 240, pinNum: 10, isGpio: true },
        { name: "GP11", x: 16, y: 256, pinNum: 11, isGpio: true },
        { name: "GP12", x: 16, y: 272, pinNum: 12, isGpio: true },
        { name: "GP13", x: 16, y: 288, pinNum: 13, isGpio: true },
        { name: "GND", x: 16, y: 304, isGnd: true, pinNum: "GND" },
        { name: "GP14", x: 16, y: 320, pinNum: 14, isGpio: true },
        { name: "GP15", x: 16, y: 336, pinNum: 15, isGpio: true }
    ],
    rightCol: [
        { name: "VBUS", x: 112, y: 32, is5V: true, pinNum: "VBUS" },
        { name: "VSYS", x: 112, y: 48, is5V: true, pinNum: "VSYS" },
        { name: "GND", x: 112, y: 64, isGnd: true, pinNum: "GND" },
        { name: "3V3_EN", x: 112, y: 80, pinNum: "3V3_EN" },
        { name: "3V3", x: 112, y: 96, is3V3: true, pinNum: "3.3V" },
        { name: "ADC_REF", x: 112, y: 112, pinNum: "ADC_REF" },
        { name: "GP28", x: 112, y: 128, pinNum: 28, isGpio: true, isAnalog: true },
        { name: "GND", x: 112, y: 144, isGnd: true, pinNum: "GND" },
        { name: "GP27", x: 112, y: 160, pinNum: 27, isGpio: true, isAnalog: true },
        { name: "GP26", x: 112, y: 176, pinNum: 26, isGpio: true, isAnalog: true },
        { name: "RUN", x: 112, y: 192, pinNum: "RUN" },
        { name: "GP22", x: 112, y: 208, pinNum: 22, isGpio: true },
        { name: "GND", x: 112, y: 224, isGnd: true, pinNum: "GND" },
        { name: "GP21", x: 112, y: 240, pinNum: 21, isGpio: true },
        { name: "GP20", x: 112, y: 256, pinNum: 20, isGpio: true },
        { name: "GP19", x: 112, y: 272, pinNum: 19, isGpio: true },
        { name: "GP18", x: 112, y: 288, pinNum: 18, isGpio: true },
        { name: "GND", x: 112, y: 304, isGnd: true, pinNum: "GND" },
        { name: "GP17", x: 112, y: 320, pinNum: 17, isGpio: true },
        { name: "GP16", x: 112, y: 336, pinNum: 16, isGpio: true }
    ]
};

// ESP32 DevKit V1 30-pin Header Definitions (15 pins per side, 16px pitch layout)
// Board width 210px: Left pins at x: 16, Right pins at x: 192.
// Labels are placed cleanly inside the board between pins and central metal RF can.
export const ESP32_PINS = {
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
    // Right column (local x: 192, y: 16 to 240)
    rightCol: [
        { name: "D23", x: 192, y: 16, pinNum: 23, isGpio: true },
        { name: "D22", x: 192, y: 32, pinNum: 22, isGpio: true },
        { name: "TX0", x: 192, y: 48, pinNum: 1, isGpio: true },
        { name: "RX0", x: 192, y: 64, pinNum: 3, isGpio: true },
        { name: "D21", x: 192, y: 80, pinNum: 21, isGpio: true },
        { name: "D19", x: 192, y: 96, pinNum: 19, isGpio: true },
        { name: "D18", x: 192, y: 112, pinNum: 18, isGpio: true },
        { name: "D5", x: 192, y: 128, pinNum: 5, isGpio: true },
        { name: "D17", x: 192, y: 144, pinNum: 17, isGpio: true },
        { name: "D16", x: 192, y: 160, pinNum: 16, isGpio: true },
        { name: "D4", x: 192, y: 176, pinNum: 4, isGpio: true },
        { name: "D0", x: 192, y: 192, pinNum: 0, isGpio: true },
        { name: "D2", x: 192, y: 208, isGpio: true, isD2: true, pinNum: 2 },
        { name: "D15", x: 192, y: 224, pinNum: 15, isGpio: true },
        { name: "3V3", x: 192, y: 240, is3V3: true, pinNum: "3.3V" },
    ]
};

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
        const isLedLit = Boolean(isPowered && (simState?.gp25High ?? true));

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
