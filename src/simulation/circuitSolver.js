/**
 * Real-Time Physics-Accurate SPICE/EDA Circuit Solver
 * Evaluates breadboard tracks, jumper wires, 9V batteries, resistors, and LEDs in real time.
 */
import { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP32_PINS } from "../components/workspace/components/McuBoard";

// Breadboard geometry constants (matching Breadboard.jsx 1:1)
const COLUMNS = 30;
const X_START = 48;
const GRID_STEP = 16;
const Y_RAIL_TOP_PLUS = 16;
const Y_RAIL_TOP_MINUS = 32;
const Y_UPPER_ROWS = [64, 80, 96, 112, 128];
const Y_LOWER_ROWS = [160, 176, 192, 208, 224];
const Y_RAIL_BOT_MINUS = 256;
const Y_RAIL_BOT_PLUS = 272;

class DisjointSet {
    constructor() {
        this.parent = {};
    }

    find(i) {
        if (this.parent[i] === undefined) {
            this.parent[i] = i;
            return i;
        }
        if (this.parent[i] === i) return i;
        this.parent[i] = this.find(this.parent[i]);
        return this.parent[i];
    }

    union(i, j) {
        const rootI = this.find(i);
        const rootJ = this.find(j);
        if (rootI !== rootJ) {
            this.parent[rootI] = rootJ;
        }
    }
}

/**
 * Returns the breadboard tie-strip key for a world coordinate (wx, wy), or null if off-board
 */
function getBreadboardNodeAt(breadboard, wx, wy) {
    const isMini = breadboard.type === "breadboard-mini";
    const isFull = breadboard.type === "breadboard-full";
    const cols = isMini ? 17 : isFull ? 60 : 30;
    const boardW = isMini ? 352 : isFull ? 1040 : 560;
    const boardH = isMini ? 208 : 288;
    const hasRails = !isMini;

    const localX = wx - breadboard.x;
    const localY = wy - breadboard.y;

    if (localX < 0 || localX > boardW || localY < 0 || localY > boardH) return null;

    const bbId = breadboard.id;
    const tol = 6; // Strict 6px snap tolerance to prevent cross-row bleed

    // 1. Top Power Rails (Full & Half boards only)
    if (hasRails) {
        if (Math.abs(localY - Y_RAIL_TOP_PLUS) <= tol && localX >= X_START - tol && localX <= X_START + (cols - 1) * GRID_STEP + tol) {
            return `bb_${bbId}_rail_top_plus`;
        }
        if (Math.abs(localY - Y_RAIL_TOP_MINUS) <= tol && localX >= X_START - tol && localX <= X_START + (cols - 1) * GRID_STEP + tol) {
            return `bb_${bbId}_rail_top_minus`;
        }

        // 2. Bottom Power Rails
        if (Math.abs(localY - Y_RAIL_BOT_MINUS) <= tol && localX >= X_START - tol && localX <= X_START + (cols - 1) * GRID_STEP + tol) {
            return `bb_${bbId}_rail_bot_minus`;
        }
        if (Math.abs(localY - Y_RAIL_BOT_PLUS) <= tol && localX >= X_START - tol && localX <= X_START + (cols - 1) * GRID_STEP + tol) {
            return `bb_${bbId}_rail_bot_plus`;
        }
    }

    // 3. Terminal Strips: 5-hole vertical columns
    const colIdx = Math.round((localX - X_START) / GRID_STEP);
    if (colIdx >= 0 && colIdx < cols && Math.abs(localX - (X_START + colIdx * GRID_STEP)) <= tol) {
        const upperRows = isMini ? [16, 32, 48, 64, 80] : Y_UPPER_ROWS;
        const lowerRows = isMini ? [112, 128, 144, 160, 176] : Y_LOWER_ROWS;
        // Upper bank: rows a, b, c, d, e
        for (const ry of upperRows) {
            if (Math.abs(localY - ry) <= tol) {
                return `bb_${bbId}_upper_col_${colIdx}`;
            }
        }
        // Lower bank: rows f, g, h, i, j
        for (const ry of lowerRows) {
            if (Math.abs(localY - ry) <= tol) {
                return `bb_${bbId}_lower_col_${colIdx}`;
            }
        }
    }

    return null;
}

/**
 * Solves circuit connectivity and component operating points
 */
export function solveCircuit({ components = [], wires = [], isSimulating = false, mcuStates = {} }) {
    const dsu = new DisjointSet();
    const pointToNode = (pt) => {
        const key = `pt_${Math.round(pt.x / 4) * 4}_${Math.round(pt.y / 4) * 4}`;
        return dsu.find(key);
    };

    const breadboards = components.filter(c => c.type?.startsWith("breadboard"));
    const batteries = components.filter(c => c.type === "battery-9v");
    const arduinoBoards = components.filter(c => ["arduino-uno", "arduino-mega", "arduino-nano"].includes(c.type));
    const esp32Boards = components.filter(c => c.type === "esp32-devkit" || c.type === "esp32" || c.type === "esp32-s3");

    // Function to get the electrical node for a physical point
    const getElectricalNode = (x, y) => {
        // 1. Check if touches a breadboard tie-strip
        for (const bb of breadboards) {
            const bbNode = getBreadboardNodeAt(bb, x, y);
            if (bbNode) {
                const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                dsu.union(ptKey, bbNode);
                return dsu.find(bbNode);
            }
        }

        // 2. Check if touches battery snap terminals (taking rotation into account)
        for (const b of batteries) {
            const rot = ((b.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            // Positive terminal center (72, -14)
            const posWorldX = b.x + 72 * cos - (-14) * sin;
            const posWorldY = b.y + 72 * sin + (-14) * cos;
            const dPos = Math.hypot(x - posWorldX, y - posWorldY);
            if (dPos <= 14) {
                const posId = `POWER_SOURCE_POS_${b.id}`;
                const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                dsu.union(ptKey, posId);
                return dsu.find(posId);
            }

            // Negative terminal center (24, -14)
            const negWorldX = b.x + 24 * cos - (-14) * sin;
            const negWorldY = b.y + 24 * sin + (-14) * cos;
            const dNeg = Math.hypot(x - negWorldX, y - negWorldY);
            if (dNeg <= 14) {
                const negId = `POWER_SOURCE_GND_${b.id}`;
                const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                dsu.union(ptKey, negId);
                return dsu.find(negId);
            }
        }

        // 3. Check if touches Arduino Uno pins (Digital High, Digital Low, Power, Analog)
        for (const b of arduinoBoards) {
            const rot = ((b.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            const allArdPins = b.type === "arduino-mega" ? [
                ...ARDUINO_MEGA_PINS.digitalHigh,
                ...ARDUINO_MEGA_PINS.digitalLow,
                ...ARDUINO_MEGA_PINS.communication,
                ...ARDUINO_MEGA_PINS.power,
                ...ARDUINO_MEGA_PINS.analog,
                ...ARDUINO_MEGA_PINS.dualDigital
            ] : b.type === "arduino-nano" ? [
                ...ARDUINO_NANO_PINS.topRow,
                ...ARDUINO_NANO_PINS.botRow
            ] : [
                ...ARDUINO_PINS.digitalHigh,
                ...ARDUINO_PINS.digitalLow,
                ...ARDUINO_PINS.power,
                ...ARDUINO_PINS.analog
            ];

            for (const pin of allArdPins) {
                const wx = b.x + pin.x * cos - pin.y * sin;
                const wy = b.y + pin.x * sin + pin.y * cos;
                if (Math.hypot(x - wx, y - wy) <= 12) {
                    let pinId;
                    if (pin.isGnd) {
                        pinId = `POWER_SOURCE_GND_ard_${b.id}`;
                    } else if (pin.is5V || pin.name === "5V" || pin.name === "IOREF" || pin.name === "VIN") {
                        pinId = `POWER_SOURCE_POS_ard5V_${b.id}`;
                    } else if (pin.is3V3 || pin.name === "3.3V") {
                        pinId = `POWER_SOURCE_POS_ard3V3_${b.id}`;
                    } else if (pin.isD13 || pin.pinNum === 13) {
                        const isD13High = mcuStates?.[b.id]?.d13High ?? true;
                        pinId = isD13High ? `POWER_SOURCE_POS_ardD13_${b.id}` : `ARD_PIN_${b.id}_13_LOW`;
                    } else if (pin.isGpio) {
                        const pinNum = String(pin.pinNum);
                        const isPinHigh = mcuStates?.[b.id]?.pins?.[pinNum] === 1;
                        pinId = isPinHigh ? `POWER_SOURCE_POS_ard_${b.id}_${pinNum}` : `ARD_PIN_${b.id}_${pinNum}`;
                    } else {
                        pinId = `ARD_PIN_${b.id}_${pin.name}`;
                    }
                    const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                    dsu.union(ptKey, pinId);
                    return dsu.find(pinId);
                }
            }
        }

        // 4. Check if touches ESP32 DevKit pins (Left & Right 15-pin columns)
        for (const b of esp32Boards) {
            const rot = ((b.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            const allEspPins = [
                ...ESP32_PINS.leftCol,
                ...ESP32_PINS.rightCol
            ];

            for (const pin of allEspPins) {
                const wx = b.x + pin.x * cos - pin.y * sin;
                const wy = b.y + pin.x * sin + pin.y * cos;
                if (Math.hypot(x - wx, y - wy) <= 12) {
                    let pinId;
                    if (pin.isGnd) {
                        pinId = `POWER_SOURCE_GND_esp_${b.id}`;
                    } else if (pin.name === "VIN" || pin.is5V) {
                        pinId = `POWER_SOURCE_POS_esp5V_${b.id}`;
                    } else if (pin.name === "3V3" || pin.is3V3) {
                        pinId = `POWER_SOURCE_POS_esp3V3_${b.id}`;
                    } else if (pin.isD2 || pin.pinNum === 2) {
                        const isD2High = mcuStates?.[b.id]?.d2High ?? true;
                        pinId = isD2High ? `POWER_SOURCE_POS_espD2_${b.id}` : `ESP_PIN_${b.id}_2_LOW`;
                    } else if (pin.isGpio) {
                        const pinNum = String(pin.pinNum);
                        const isPinHigh = mcuStates?.[b.id]?.pins?.[pinNum] === 1;
                        pinId = isPinHigh ? `POWER_SOURCE_POS_esp_${b.id}_${pinNum}` : `ESP_PIN_${b.id}_${pinNum}`;
                    } else {
                        pinId = `ESP_PIN_${b.id}_${pin.name}`;
                    }
                    const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                    dsu.union(ptKey, pinId);
                    return dsu.find(pinId);
                }
            }
        }

        return pointToNode({ x, y });
    };

    // 1. Connect Wire Endpoints
    wires.forEach((w) => {
        if (!w.points || w.points.length < 2) return;
        const pStart = w.points[0];
        const pEnd = w.points[w.points.length - 1];

        const nodeStart = getElectricalNode(pStart.x, pStart.y);
        const nodeEnd = getElectricalNode(pEnd.x, pEnd.y);
        dsu.union(nodeStart, nodeEnd);
    });

    // 2. Identify Power Sources (9V Battery, Arduino Uno, ESP32 DevKit)
    let posNodes = [];
    let gndNodes = [];
    const powerSources = [];

    batteries.forEach((c) => {
        const rot = ((c.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        const posWorldX = c.x + 72 * cos - (-14) * sin;
        const posWorldY = c.y + 72 * sin + (-14) * cos;
        const negWorldX = c.x + 24 * cos - (-14) * sin;
        const negWorldY = c.y + 24 * sin + (-14) * cos;

        // Auto-link wire endpoints near terminals (exact snap within 14px)
        wires.forEach(w => {
            if (!w.points || w.points.length < 2) return;
            const p1 = w.points[0];
            const p2 = w.points[w.points.length - 1];
            if (Math.hypot(p1.x - posWorldX, p1.y - posWorldY) <= 14) {
                dsu.union(getElectricalNode(p1.x, p1.y), dsu.find(`POWER_SOURCE_POS_${c.id}`));
            }
            if (Math.hypot(p2.x - posWorldX, p2.y - posWorldY) <= 14) {
                dsu.union(getElectricalNode(p2.x, p2.y), dsu.find(`POWER_SOURCE_POS_${c.id}`));
            }
            if (Math.hypot(p1.x - negWorldX, p1.y - negWorldY) <= 14) {
                dsu.union(getElectricalNode(p1.x, p1.y), dsu.find(`POWER_SOURCE_GND_${c.id}`));
            }
            if (Math.hypot(p2.x - negWorldX, p2.y - negWorldY) <= 14) {
                dsu.union(getElectricalNode(p2.x, p2.y), dsu.find(`POWER_SOURCE_GND_${c.id}`));
            }
        });

        const posNode = dsu.find(`POWER_SOURCE_POS_${c.id}`);
        const gndNode = dsu.find(`POWER_SOURCE_GND_${c.id}`);
        posNodes.push(posNode);
        gndNodes.push(gndNode);

        powerSources.push({
            id: `battery_${c.id}`,
            name: c.name || "9V Battery",
            posNode,
            gndNode,
            voltage: c.voltage != null ? Number(c.voltage) : 9.0
        });
    });

    // 2b. Add MCU Board Power Rails (Arduino Uno & ESP32 DevKit)
    arduinoBoards.forEach((b) => {
        const gndNode = dsu.find(`POWER_SOURCE_GND_ard_${b.id}`);
        const pos5V = dsu.find(`POWER_SOURCE_POS_ard5V_${b.id}`);
        const pos3V3 = dsu.find(`POWER_SOURCE_POS_ard3V3_${b.id}`);
        const posD13 = dsu.find(`POWER_SOURCE_POS_ardD13_${b.id}`);

        posNodes.push(pos5V, pos3V3, posD13);
        gndNodes.push(gndNode);

        powerSources.push({
            id: `ard_5v_${b.id}`,
            name: "Arduino 5V",
            posNode: pos5V,
            gndNode,
            voltage: 5.0
        });
        powerSources.push({
            id: `ard_3v3_${b.id}`,
            name: "Arduino 3.3V",
            posNode: pos3V3,
            gndNode,
            voltage: 3.3
        });
        if (mcuStates?.[b.id]?.d13High ?? true) {
            powerSources.push({
                id: `ard_d13_${b.id}`,
                name: "Arduino Pin 13",
                posNode: posD13,
                gndNode,
                voltage: 5.0
            });
        }
        if (mcuStates?.[b.id]?.pins) {
            for (const pinNum in mcuStates[b.id].pins) {
                if (mcuStates[b.id].pins[pinNum] === 1 && String(pinNum) !== "13") {
                    const pinPos = dsu.find(`POWER_SOURCE_POS_ard_${b.id}_${pinNum}`);
                    posNodes.push(pinPos);
                    powerSources.push({
                        id: `ard_pin_${pinNum}_${b.id}`,
                        name: `Arduino Pin ${pinNum}`,
                        posNode: pinPos,
                        gndNode,
                        voltage: 5.0
                    });
                }
            }
        }
    });

    esp32Boards.forEach((b) => {
        const gndNode = dsu.find(`POWER_SOURCE_GND_esp_${b.id}`);
        const pos3V3 = dsu.find(`POWER_SOURCE_POS_esp3V3_${b.id}`);
        const pos5V = dsu.find(`POWER_SOURCE_POS_esp5V_${b.id}`);
        const posD2 = dsu.find(`POWER_SOURCE_POS_espD2_${b.id}`);

        posNodes.push(pos3V3, pos5V, posD2);
        gndNodes.push(gndNode);

        powerSources.push({
            id: `esp_3v3_${b.id}`,
            name: "ESP32 3.3V",
            posNode: pos3V3,
            gndNode,
            voltage: 3.3
        });
        powerSources.push({
            id: `esp_5v_${b.id}`,
            name: "ESP32 VIN (5V)",
            posNode: pos5V,
            gndNode,
            voltage: 5.0
        });
        if (mcuStates?.[b.id]?.d2High ?? true) {
            powerSources.push({
                id: `esp_d2_${b.id}`,
                name: "ESP32 Pin D2",
                posNode: posD2,
                gndNode,
                voltage: 3.3
            });
        }
        if (mcuStates?.[b.id]?.pins) {
            for (const pinNum in mcuStates[b.id].pins) {
                if (mcuStates[b.id].pins[pinNum] === 1 && String(pinNum) !== "2" && String(pinNum) !== "D2") {
                    const pinPos = dsu.find(`POWER_SOURCE_POS_esp_${b.id}_${pinNum}`);
                    posNodes.push(pinPos);
                    powerSources.push({
                        id: `esp_pin_${pinNum}_${b.id}`,
                        name: `ESP32 Pin D${pinNum}`,
                        posNode: pinPos,
                        gndNode,
                        voltage: 3.3
                    });
                }
            }
        }
    });

    // 3. Map Resistors
    const resistors = [];
    components.forEach((c) => {
        if (c.type === "resistor") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const dx = Math.round(Math.cos(rotRad) * 64);
            const dy = Math.round(Math.sin(rotRad) * 64);

            const n1 = getElectricalNode(c.x, c.y);
            const n2 = getElectricalNode(c.x + dx, c.y + dy);

            // Connect any nearby wire endpoints (precision snap 8px)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                const p1 = w.points[0];
                const p2 = w.points[w.points.length - 1];
                if (Math.hypot(p1.x - c.x, p1.y - c.y) <= 8) dsu.union(getElectricalNode(p1.x, p1.y), n1);
                if (Math.hypot(p2.x - c.x, p2.y - c.y) <= 8) dsu.union(getElectricalNode(p2.x, p2.y), n1);
                if (Math.hypot(p1.x - (c.x + dx), p1.y - (c.y + dy)) <= 8) dsu.union(getElectricalNode(p1.x, p1.y), n2);
                if (Math.hypot(p2.x - (c.x + dx), p2.y - (c.y + dy)) <= 8) dsu.union(getElectricalNode(p2.x, p2.y), n2);
            });

            resistors.push({
                id: c.id,
                node1: n1,
                node2: n2,
                resistance: c.resistance || 220
            });
        }
    });

    // 3b. Map Pushbuttons (Tactile Switch: 4 pins)
    components.forEach((c) => {
        if (c.type === "button") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            // Pin 1a (0, 0), Pin 1b (32, 0), Pin 2a (0, 32), Pin 2b (32, 32)
            const p1a = { x: Math.round(c.x), y: Math.round(c.y) };
            const p1b = { x: Math.round(c.x + 32 * cos), y: Math.round(c.y + 32 * sin) };
            const p2a = { x: Math.round(c.x - 32 * sin), y: Math.round(c.y + 32 * cos) };
            const p2b = { x: Math.round(c.x + 32 * cos - 32 * sin), y: Math.round(c.y + 32 * sin + 32 * cos) };

            const n1a = getElectricalNode(p1a.x, p1a.y);
            const n1b = getElectricalNode(p1b.x, p1b.y);
            const n2a = getElectricalNode(p2a.x, p2a.y);
            const n2b = getElectricalNode(p2b.x, p2b.y);

            // Connect nearby wire endpoints (precision snap 8px)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - p1a.x, p.y - p1a.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n1a);
                    if (Math.hypot(p.x - p1b.x, p.y - p1b.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n1b);
                    if (Math.hypot(p.x - p2a.x, p.y - p2a.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n2a);
                    if (Math.hypot(p.x - p2b.x, p.y - p2b.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n2b);
                });
            });

            // Internal bus: 1a is permanently connected to 1b, 2a is permanently connected to 2b
            dsu.union(n1a, n1b);
            dsu.union(n2a, n2b);

            // When pressed, bridge side 1 and side 2!
            if (c.isPressed) {
                dsu.union(n1a, n2a);
            }
        }
    });

    // 3c. Map Slide Switches (SPDT: 3 pins)
    components.forEach((c) => {
        if (c.type === "slide-switch") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            // Pin 1 (0, 16), Common (16, 16), Pin 2 (32, 16)
            const p1 = { x: Math.round(c.x - 16 * sin), y: Math.round(c.y + 16 * cos) };
            const pCom = { x: Math.round(c.x + 16 * cos - 16 * sin), y: Math.round(c.y + 16 * sin + 16 * cos) };
            const p2 = { x: Math.round(c.x + 32 * cos - 16 * sin), y: Math.round(c.y + 32 * sin + 16 * cos) };

            const n1 = getElectricalNode(p1.x, p1.y);
            const nCom = getElectricalNode(pCom.x, pCom.y);
            const n2 = getElectricalNode(p2.x, p2.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - p1.x, p.y - p1.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n1);
                    if (Math.hypot(p.x - pCom.x, p.y - pCom.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), nCom);
                    if (Math.hypot(p.x - p2.x, p.y - p2.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n2);
                });
            });

            const switchPos = c.switchState || "left";
            if (switchPos === "left") {
                dsu.union(nCom, n1);
            } else {
                dsu.union(nCom, n2);
            }
        }
    });

    // 3d. Map Potentiometers (3 terminals: 0, 16, 32 at Y=48)
    components.forEach((c) => {
        if (c.type === "potentiometer") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            const p1 = { x: Math.round(c.x - 48 * sin), y: Math.round(c.y + 48 * cos) };
            const pW = { x: Math.round(c.x + 16 * cos - 48 * sin), y: Math.round(c.y + 16 * sin + 48 * cos) };
            const p2 = { x: Math.round(c.x + 32 * cos - 48 * sin), y: Math.round(c.y + 32 * sin + 48 * cos) };

            const n1 = getElectricalNode(p1.x, p1.y);
            const nW = getElectricalNode(pW.x, pW.y);
            const n2 = getElectricalNode(p2.x, p2.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - p1.x, p.y - p1.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n1);
                    if (Math.hypot(p.x - pW.x, p.y - pW.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), nW);
                    if (Math.hypot(p.x - p2.x, p.y - p2.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), n2);
                });
            });

            const wiper = c.wiperValue != null ? c.wiperValue : 0.5;
            const totalR = c.resistance || 10000;
            const r1 = Math.max(2, Math.round(wiper * totalR));
            const r2 = Math.max(2, Math.round((1 - wiper) * totalR));

            resistors.push({
                id: `${c.id}_r1`,
                node1: n1,
                node2: nW,
                resistance: r1
            });
            resistors.push({
                id: `${c.id}_r2`,
                node1: nW,
                node2: n2,
                resistance: r2
            });
        }
    });

    // 4. Solve LEDs
    const ledStates = {};
    const simLogs = [];

    simLogs.push({ time: "0.01s", type: "info", text: "Simulation running: Real-time SPICE engine active." });

    components.forEach((c) => {
        if (c.type === "led") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const dx = Math.round(Math.cos(rotRad) * 16);
            const dy = Math.round(Math.sin(rotRad) * 16);

            let anodeNode = getElectricalNode(c.x, c.y);
            let cathodeNode = getElectricalNode(c.x + dx, c.y + dy);

            // Connect nearby wire endpoints (MUST be <= 7px so 16px pin spacing is NEVER bridged!)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                const p1 = w.points[0];
                const p2 = w.points[w.points.length - 1];
                if (Math.hypot(p1.x - c.x, p1.y - c.y) <= 7) dsu.union(getElectricalNode(p1.x, p1.y), anodeNode);
                if (Math.hypot(p2.x - c.x, p2.y - c.y) <= 7) dsu.union(getElectricalNode(p2.x, p2.y), anodeNode);
                if (Math.hypot(p1.x - (c.x + dx), p1.y - (c.y + dy)) <= 7) dsu.union(getElectricalNode(p1.x, p1.y), cathodeNode);
                if (Math.hypot(p2.x - (c.x + dx), p2.y - (c.y + dy)) <= 7) dsu.union(getElectricalNode(p2.x, p2.y), cathodeNode);
            });

            anodeNode = dsu.find(anodeNode);
            cathodeNode = dsu.find(cathodeNode);

            // A. Check if both terminals are shorted together (same node)
            if (anodeNode === cathodeNode) {
                ledStates[c.id] = {
                    isOn: false,
                    isDim: false,
                    isOverloaded: false,
                    voltage: 0,
                    currentMa: 0,
                    brightness: 0,
                    status: "shorted_pins"
                };
                return;
            }

            // B. Check if any battery exists
            if (posNodes.length === 0 || gndNodes.length === 0) {
                ledStates[c.id] = {
                    isOn: false,
                    isDim: false,
                    isOverloaded: false,
                    voltage: 0,
                    currentMa: 0,
                    brightness: 0,
                    status: "unpowered"
                };
                return;
            }

            const activePosRoot = dsu.find(posNodes[0]);
            const activeGndRoot = dsu.find(gndNodes[0]);

            // C. Check if the battery itself is shorted
            if (activePosRoot === activeGndRoot) {
                ledStates[c.id] = {
                    isOn: false,
                    isDim: false,
                    isOverloaded: false,
                    voltage: 0,
                    currentMa: 0,
                    brightness: 0,
                    status: "power_shorted"
                };
                return;
            }

            // Helper to check path through resistors
            const findPathToNode = (startNode, targetNode) => {
                const s = dsu.find(startNode);
                const t = dsu.find(targetNode);
                if (s === t) return { connected: true, totalR: 0 };

                // BFS through resistor network
                const queue = [{ node: s, r: 0 }];
                const visited = new Set([s]);

                while (queue.length > 0) {
                    const curr = queue.shift();
                    if (curr.node === t) {
                        return { connected: true, totalR: curr.r };
                    }

                    for (const res of resistors) {
                        const rN1 = dsu.find(res.node1);
                        const rN2 = dsu.find(res.node2);

                        if (rN1 === curr.node && !visited.has(rN2)) {
                            visited.add(rN2);
                            queue.push({ node: rN2, r: curr.r + res.resistance });
                        } else if (rN2 === curr.node && !visited.has(rN1)) {
                            visited.add(rN1);
                            queue.push({ node: rN1, r: curr.r + res.resistance });
                        }
                    }
                }

                return { connected: false, totalR: 0 };
            };

            const pathFromPosToAnode = findPathToNode(activePosRoot, anodeNode);
            const pathToGndFromCathode = findPathToNode(cathodeNode, activeGndRoot);

            // Also check reverse polarity (Anode to GND, Cathode to POS)
            const pathFromPosToCathode = findPathToNode(activePosRoot, cathodeNode);
            const pathToGndFromAnode = findPathToNode(anodeNode, activeGndRoot);

            if (pathFromPosToAnode.connected && pathToGndFromCathode.connected) {
                // FORWARD BIASED!
                const activeBattery = batteries.find(b => {
                    const pN = dsu.find(`POWER_SOURCE_POS_${b.id}`);
                    const gN = dsu.find(`POWER_SOURCE_GND_${b.id}`);
                    return (pN === activePosRoot && gN === activeGndRoot);
                }) || batteries[0];

                const vSupply = activeBattery?.voltage != null ? Number(activeBattery.voltage) : 9.0;
                const ledColor = (c.color || "red").toLowerCase();
                // Diode forward drop Vf based on semiconductor bandgap
                const vForward = (ledColor.includes("blue") || ledColor.includes("white")) ? 2.9 :
                                 (ledColor.includes("green")) ? 2.1 :
                                 (ledColor.includes("yellow") || ledColor.includes("orange")) ? 2.0 : 1.8;

                const totalSeriesR = pathFromPosToAnode.totalR + pathToGndFromCathode.totalR;
                const rInternal = 2.0; // Battery internal ESR
                const rTotal = totalSeriesR + rInternal;

                // SCENARIO 1: Sub-threshold / Very Low Voltage (< 1.4V)
                if (vSupply < 1.4) {
                    ledStates[c.id] = {
                        isOn: false,
                        isDim: false,
                        isOverloaded: false,
                        voltage: vSupply,
                        currentMa: 0,
                        brightness: 0,
                        status: "low_voltage"
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "info",
                        text: `ℹ️ [LOW VOLTAGE] Battery voltage is ${vSupply.toFixed(1)}V, below conduction threshold (~1.5V). Current is 0.0mA. Increase voltage to light the LED.`
                    });
                }
                // SCENARIO 2: Direct connection with high voltage (>= 2.8V) without resistor -> BLAST!
                else if (totalSeriesR < 25 && vSupply >= 2.8) {
                    const currentAmps = (vSupply - vForward) / rTotal;
                    const currentMa = currentAmps * 1000;
                    ledStates[c.id] = {
                        isOn: false,
                        isDim: false,
                        isOverloaded: true,
                        voltage: vSupply,
                        currentMa: Math.round(currentMa),
                        brightness: 0,
                        status: "burned"
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "warn",
                        text: `💥 [OVERLOAD BURNOUT] LED destroyed: ${vSupply.toFixed(1)}V applied directly without current-limiting resistor! Current reached ${Math.round(currentMa)}mA (Safe max: 25mA). Add a 220Ω - 1kΩ resistor.`
                    });
                }
                else {
                    // Conducting circuit with series resistance OR small voltage (1.5V - 2.2V)
                    let currentMa;
                    let isDim = false;
                    let brightness = 0;

                    // If low supply voltage (e.g. 1.5V to 2.2V)
                    if (vSupply <= vForward + 0.1 && totalSeriesR < 40) {
                        // Small voltage mode (sub-threshold diode exponential conduction)
                        currentMa = (vSupply >= 1.5) ? Math.max(0.8, (vSupply - 1.3) * 6.0) : 0.4;
                        isDim = true;
                        brightness = Math.min(0.42, 0.22 + (currentMa / 6.0) * 0.20);
                    } else {
                        // Standard Ohm's Law / Shockley forward conduction
                        const effectiveDrop = Math.min(vForward, vSupply - 0.2);
                        const currentAmps = Math.max(0, (vSupply - effectiveDrop) / rTotal);
                        currentMa = currentAmps * 1000;

                        if (currentMa > 28) {
                            // Current exceeds rated threshold -> OVERLOAD BURNOUT!
                            ledStates[c.id] = {
                                isOn: false,
                                isDim: false,
                                isOverloaded: true,
                                voltage: vSupply,
                                currentMa: Math.round(currentMa),
                                brightness: 0,
                                status: "burned"
                            };
                            simLogs.push({
                                time: "0.02s",
                                type: "warn",
                                text: `💥 [OVERLOAD BURNOUT] LED destroyed: Current (${Math.round(currentMa)}mA) exceeded safe maximum (25mA)! Resistor (${totalSeriesR}Ω) is too small.`
                            });
                            return;
                        } else if (currentMa < 5.0 && currentMa >= 0.4) {
                            // Low current due to high series resistance (e.g. 1k, 2.2k, 10k) -> DIM LIGHT!
                            isDim = true;
                            brightness = Math.min(0.45, 0.20 + (currentMa / 5.0) * 0.22);
                        } else if (currentMa >= 5.0) {
                            // Nominal operating current -> BRIGHT LIGHT!
                            isDim = false;
                            brightness = Math.min(1.0, 0.65 + ((currentMa - 5.0) / 20.0) * 0.35);
                        } else {
                            // Current < 0.4mA -> barely any emission
                            isDim = false;
                            brightness = 0;
                        }
                    }

                    if (brightness > 0) {
                        ledStates[c.id] = {
                            isOn: true,
                            isDim,
                            isOverloaded: false,
                            voltage: vSupply <= vForward ? vSupply : vForward,
                            currentMa: Math.round(currentMa * 10) / 10,
                            brightness: Math.round(brightness * 100) / 100,
                            status: isDim ? "dim" : "bright"
                        };

                        if (isDim) {
                            simLogs.push({
                                time: "0.02s",
                                type: "info",
                                text: `💡 [DIM ILLUMINATION] LED receiving low voltage/current (Supply: ${vSupply.toFixed(1)}V, Current: ${currentMa.toFixed(1)}mA). Emitting soft dim light.`
                            });
                        } else {
                            simLogs.push({
                                time: "0.02s",
                                type: "success",
                                text: `✨ [BRIGHT ILLUMINATION] LED illuminated bright: Supply = ${vSupply.toFixed(1)}V, Current = ${currentMa.toFixed(1)}mA, R_series = ${totalSeriesR}Ω.`
                            });
                        }
                    } else {
                        ledStates[c.id] = {
                            isOn: false,
                            isDim: false,
                            isOverloaded: false,
                            voltage: vSupply,
                            currentMa: Math.round(currentMa * 10) / 10,
                            brightness: 0,
                            status: "insufficient_current"
                        };
                        simLogs.push({
                            time: "0.02s",
                            type: "info",
                            text: `ℹ️ [LOW CURRENT] Current (${currentMa.toFixed(2)}mA) is insufficient to illuminate LED. Reduce series resistance (${totalSeriesR}Ω).`
                        });
                    }
                }
            } else if (pathFromPosToCathode.connected && pathToGndFromAnode.connected) {
                // REVERSE BIASED
                ledStates[c.id] = {
                    isOn: false,
                    isOverloaded: false,
                    voltage: 0,
                    currentMa: 0,
                    brightness: 0,
                    status: "reverse_biased"
                };
                simLogs.push({
                    time: "0.02s",
                    type: "info",
                    text: `ℹ️ [DIODE] LED reverse-biased (Cathode to +, Anode to -). No forward current flows.`
                });
            } else {
                // Open circuit
                ledStates[c.id] = {
                    isOn: false,
                    isOverloaded: false,
                    voltage: 0,
                    currentMa: 0,
                    brightness: 0,
                    status: "open_circuit"
                };
            }
        }
    });

    // 4b. Solve Piezo Buzzers
    const buzzerStates = {};
    components.forEach((c) => {
        if (c.type === "buzzer") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            // Positive Pin (0, 32), Negative Pin (16, 32)
            const pPos = { x: Math.round(c.x - 32 * sin), y: Math.round(c.y + 32 * cos) };
            const pNeg = { x: Math.round(c.x + 16 * cos - 32 * sin), y: Math.round(c.y + 16 * sin + 32 * cos) };

            let posNode = getElectricalNode(pPos.x, pPos.y);
            let negNode = getElectricalNode(pNeg.x, pNeg.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - pPos.x, p.y - pPos.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), posNode);
                    if (Math.hypot(p.x - pNeg.x, p.y - pNeg.y) <= 8) dsu.union(getElectricalNode(p.x, p.y), negNode);
                });
            });

            posNode = dsu.find(posNode);
            negNode = dsu.find(negNode);

            if (posNode === negNode || posNodes.length === 0 || gndNodes.length === 0) {
                buzzerStates[c.id] = { isBeeping: false, voltage: 0, currentMa: 0 };
                return;
            }

            const activePosRoot = dsu.find(posNodes[0]);
            const activeGndRoot = dsu.find(gndNodes[0]);

            if (activePosRoot === activeGndRoot) {
                buzzerStates[c.id] = { isBeeping: false, voltage: 0, currentMa: 0 };
                return;
            }

            // Helper to check path through resistors
            const findPathToNode = (startNode, targetNode) => {
                const s = dsu.find(startNode);
                const t = dsu.find(targetNode);
                if (s === t) return { connected: true, totalR: 0 };
                const queue = [{ node: s, r: 0 }];
                const visited = new Set([s]);
                while (queue.length > 0) {
                    const curr = queue.shift();
                    if (curr.node === t) return { connected: true, totalR: curr.r };
                    for (const res of resistors) {
                        const rN1 = dsu.find(res.node1);
                        const rN2 = dsu.find(res.node2);
                        if (rN1 === curr.node && !visited.has(rN2)) {
                            visited.add(rN2);
                            queue.push({ node: rN2, r: curr.r + res.resistance });
                        } else if (rN2 === curr.node && !visited.has(rN1)) {
                            visited.add(rN1);
                            queue.push({ node: rN1, r: curr.r + res.resistance });
                        }
                    }
                }
                return { connected: false, totalR: 0 };
            };

            const pathPos = findPathToNode(activePosRoot, posNode);
            const pathGnd = findPathToNode(negNode, activeGndRoot);

            if (pathPos.connected && pathGnd.connected) {
                const vSupply = batteries[0]?.voltage != null ? Number(batteries[0].voltage) : 9.0;
                if (vSupply >= 2.5) {
                    const currentMa = Math.round((vSupply / (120 + pathPos.totalR + pathGnd.totalR)) * 1000);
                    buzzerStates[c.id] = {
                        isBeeping: true,
                        voltage: vSupply,
                        currentMa
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "info",
                        text: `🔊 [BUZZER ACTIVE] Piezo buzzer sounding at 880Hz (${vSupply.toFixed(1)}V, ${currentMa}mA).`
                    });
                } else {
                    buzzerStates[c.id] = { isBeeping: false, voltage: vSupply, currentMa: 0 };
                }
            } else {
                buzzerStates[c.id] = { isBeeping: false, voltage: 0, currentMa: 0 };
            }
        }
    });

    // 5. Calculate Battery Operating Points & Discharging States
    const batteryStates = {};
    batteries.forEach((b) => {
        const bPosNode = dsu.find(`POWER_SOURCE_POS_${b.id}`);
        const bGndNode = dsu.find(`POWER_SOURCE_GND_${b.id}`);
        const isDeadShort = bPosNode === bGndNode;

        let totalDrawnCurrentMa = 0;

        if (isDeadShort) {
            totalDrawnCurrentMa = 4500;
            simLogs.push({
                time: "0.01s",
                type: "warn",
                text: `⚠️ [SHORT CIRCUIT] Battery ${b.voltage != null ? b.voltage : 9}V terminals are directly shorted! High discharge current (> 4.5A). Disconnect immediate short.`
            });
        } else {
            // Sum current drawn by any conducting LEDs connected to this battery
            components.forEach((c) => {
                if (c.type === "led") {
                    const st = ledStates[c.id];
                    if (st && st.isOn && st.currentMa > 0) {
                        totalDrawnCurrentMa += st.currentMa;
                    }
                }
                if (c.type === "buzzer") {
                    const bz = buzzerStates[c.id];
                    if (bz && bz.isBeeping && bz.currentMa > 0) {
                        totalDrawnCurrentMa += bz.currentMa;
                    }
                }
            });

            // Check if any resistors are directly connected across this battery
            resistors.forEach((res) => {
                const rN1 = dsu.find(res.node1);
                const rN2 = dsu.find(res.node2);
                if ((rN1 === bPosNode && rN2 === bGndNode) || (rN2 === bPosNode && rN1 === bGndNode)) {
                    const vSupply = b.voltage != null ? Number(b.voltage) : 9.0;
                    const iResMa = (vSupply / Math.max(res.resistance, 1)) * 1000;
                    totalDrawnCurrentMa += iResMa;
                }
            });
        }

        batteryStates[b.id] = {
            isDischarging: totalDrawnCurrentMa > 0.2,
            currentMa: Math.round(totalDrawnCurrentMa * 10) / 10,
            isShortCircuit: isDeadShort,
            voltage: b.voltage != null ? Number(b.voltage) : 9.0
        };
    });

    // 6. Solve Digital Multimeters (DMM)
    const dmmStates = {};
    components.forEach((c) => {
        if (c.type === "multimeter") {
            const probeRed = c.probeRed || { x: c.x + 160, y: c.y + 48 };
            const probeBlack = c.probeBlack || { x: c.x + 160, y: c.y + 112 };

            let nodeRed = getElectricalNode(probeRed.x, probeRed.y);
            let nodeBlack = getElectricalNode(probeBlack.x, probeBlack.y);

            // Connect nearby wire endpoints if any wire terminates at probe tips (20px snap)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - probeRed.x, p.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p.x, p.y), nodeRed);
                    if (Math.hypot(p.x - probeBlack.x, p.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p.x, p.y), nodeBlack);
                });
            });

            // Connect directly to component terminal leads within 20px
            components.forEach(comp => {
                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                const cos = Math.cos(rotRad);
                const sin = Math.sin(rotRad);
                const toWorld = (lx, ly) => ({
                    x: Math.round(comp.x + lx * cos - ly * sin),
                    y: Math.round(comp.y + lx * sin + ly * cos)
                });

                if (comp.type === "resistor") {
                    const p1 = toWorld(0, 0);
                    const p2 = toWorld(64, 0);
                    if (Math.hypot(p1.x - probeRed.x, p1.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p1.x, p1.y), nodeRed);
                    if (Math.hypot(p2.x - probeRed.x, p2.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p2.x, p2.y), nodeRed);
                    if (Math.hypot(p1.x - probeBlack.x, p1.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p1.x, p1.y), nodeBlack);
                    if (Math.hypot(p2.x - probeBlack.x, p2.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p2.x, p2.y), nodeBlack);
                } else if (comp.type === "led") {
                    const p1 = toWorld(0, 0);
                    const p2 = toWorld(16, 0);
                    if (Math.hypot(p1.x - probeRed.x, p1.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p1.x, p1.y), nodeRed);
                    if (Math.hypot(p2.x - probeRed.x, p2.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p2.x, p2.y), nodeRed);
                    if (Math.hypot(p1.x - probeBlack.x, p1.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p1.x, p1.y), nodeBlack);
                    if (Math.hypot(p2.x - probeBlack.x, p2.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p2.x, p2.y), nodeBlack);
                } else if (comp.type === "potentiometer") {
                    const p1 = toWorld(0, 48);
                    const pW = toWorld(16, 48);
                    const p2 = toWorld(32, 48);
                    [p1, pW, p2].forEach(p => {
                        if (Math.hypot(p.x - probeRed.x, p.y - probeRed.y) <= 20) dsu.union(getElectricalNode(p.x, p.y), nodeRed);
                        if (Math.hypot(p.x - probeBlack.x, p.y - probeBlack.y) <= 20) dsu.union(getElectricalNode(p.x, p.y), nodeBlack);
                    });
                }
            });

            nodeRed = dsu.find(nodeRed);
            nodeBlack = dsu.find(nodeBlack);

            const mode = c.mode || "voltage";

            if (mode === "voltage") {
                if (!isSimulating) {
                    dmmStates[c.id] = { readout: "0.00", unit: "V", isContinuityBeep: false };
                    return;
                }

                const activePosRoot = posNodes.length > 0 ? dsu.find(posNodes[0]) : null;
                const activeGndRoot = gndNodes.length > 0 ? dsu.find(gndNodes[0]) : null;
                const vSupply = batteries[0]?.voltage != null 
                    ? Number(batteries[0].voltage) 
                    : (arduinoBoards.length > 0 ? 5.0 : (esp32Boards.length > 0 ? 3.3 : 9.0));

                if (!activePosRoot || !activeGndRoot || nodeRed === nodeBlack) {
                    dmmStates[c.id] = { readout: "0.00", unit: "V", isContinuityBeep: false };
                    return;
                }

                // 1. Red on Supply (+), Black on Ground (-)
                if (nodeRed === activePosRoot && nodeBlack === activeGndRoot) {
                    dmmStates[c.id] = { readout: vSupply.toFixed(2), unit: "V", isContinuityBeep: false };
                }
                // 2. Reversed polarity (Black on +, Red on -)
                else if (nodeBlack === activePosRoot && nodeRed === activeGndRoot) {
                    dmmStates[c.id] = { readout: `-${vSupply.toFixed(2)}`, unit: "V", isContinuityBeep: false };
                }
                // 3. Measuring across an LED
                else {
                    let measuredV = null;

                    // Check LED forward drops
                    for (const led of leds) {
                        const anRoot = dsu.find(led.nodeAnode);
                        const caRoot = dsu.find(led.nodeCathode);
                        if ((nodeRed === anRoot && nodeBlack === caRoot) || (nodeRed === caRoot && nodeBlack === anRoot)) {
                            const sign = (nodeRed === anRoot) ? 1 : -1;
                            const st = ledStates[led.id];
                            const vf = (st && st.isOn) ? (st.isOverloaded ? vSupply : 2.05) : 0;
                            measuredV = sign * vf;
                            break;
                        }
                    }

                    // Check Resistor drops
                    if (measuredV == null) {
                        for (const res of resistors) {
                            const rN1 = dsu.find(res.node1);
                            const rN2 = dsu.find(res.node2);
                            if ((nodeRed === rN1 && nodeBlack === rN2) || (nodeRed === rN2 && nodeBlack === rN1)) {
                                const sign = (nodeRed === rN1) ? 1 : -1;
                                let vDrop = 0;
                                // Check if in active conducting circuit with LED
                                for (const lId in ledStates) {
                                    const st = ledStates[lId];
                                    if (st && st.isOn && st.currentMa > 0) {
                                        vDrop = (st.currentMa / 1000) * res.resistance;
                                        break;
                                    }
                                }
                                // If direct connection across battery (no LED)
                                if (vDrop === 0 && ((rN1 === activePosRoot && rN2 === activeGndRoot) || (rN2 === activePosRoot && rN1 === activeGndRoot))) {
                                    vDrop = vSupply;
                                }
                                measuredV = sign * vDrop;
                                break;
                            }
                        }
                    }

                    // Check Buzzer drops
                    if (measuredV == null) {
                        for (const buz of buzzers) {
                            const bPos = dsu.find(buz.nodePos);
                            const bNeg = dsu.find(buz.nodeNeg);
                            if ((nodeRed === bPos && nodeBlack === bNeg) || (nodeRed === bNeg && nodeBlack === bPos)) {
                                const sign = (nodeRed === bPos) ? 1 : -1;
                                const st = buzzerStates[buz.id];
                                measuredV = sign * ((st && st.isBeeping) ? (st.voltage || vSupply) : 0);
                                break;
                            }
                        }
                    }

                    // Relative to Ground or Supply
                    if (measuredV == null) {
                        if (nodeRed === activePosRoot && nodeBlack !== activeGndRoot) {
                            measuredV = vSupply;
                        } else if (nodeRed === activeGndRoot && nodeBlack !== activePosRoot) {
                            measuredV = 0.00;
                        } else {
                            measuredV = 0.00;
                        }
                    }

                    dmmStates[c.id] = { readout: measuredV.toFixed(2), unit: "V", isContinuityBeep: false };
                }
            } else if (mode === "resistance" || mode === "continuity") {
                if (nodeRed === nodeBlack && nodeRed != null) {
                    dmmStates[c.id] = { readout: "0.0", unit: "Ω", isContinuityBeep: mode === "continuity" };
                } else {
                    // 1. Direct Resistor check (works even when unpowered / simulator paused!)
                    let directR = null;
                    for (const r of resistors) {
                        const r1 = dsu.find(r.node1);
                        const r2 = dsu.find(r.node2);
                        if ((nodeRed === r1 && nodeBlack === r2) || (nodeRed === r2 && nodeBlack === r1)) {
                            directR = r.resistance;
                            break;
                        }
                    }

                    // Direct proximity fallback across resistor terminals
                    if (directR == null) {
                        for (const comp of components) {
                            if (comp.type === "resistor") {
                                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                                const cos = Math.cos(rotRad);
                                const sin = Math.sin(rotRad);
                                const p1 = { x: Math.round(comp.x), y: Math.round(comp.y) };
                                const p2 = { x: Math.round(comp.x + 64 * cos), y: Math.round(comp.y + 64 * sin) };

                                const dRed1 = Math.hypot(p1.x - probeRed.x, p1.y - probeRed.y);
                                const dBlack2 = Math.hypot(p2.x - probeBlack.x, p2.y - probeBlack.y);
                                const dRed2 = Math.hypot(p2.x - probeRed.x, p2.y - probeRed.y);
                                const dBlack1 = Math.hypot(p1.x - probeBlack.x, p1.y - probeBlack.y);

                                if ((dRed1 <= 24 && dBlack2 <= 24) || (dRed2 <= 24 && dBlack1 <= 24)) {
                                    directR = comp.resistance || 220;
                                    break;
                                }
                            }
                        }
                    }

                    // Helper to check resistor path between nodes
                    const findDmmPath = (startNode, targetNode) => {
                        const s = dsu.find(startNode);
                        const t = dsu.find(targetNode);
                        if (!s || !t) return { connected: false, totalR: 0 };
                        if (s === t) return { connected: true, totalR: 0 };

                        const queue = [{ node: s, r: 0 }];
                        const visited = new Set([s]);

                        while (queue.length > 0) {
                            const curr = queue.shift();
                            if (curr.node === t) {
                                return { connected: true, totalR: curr.r };
                            }

                            for (const res of resistors) {
                                const rN1 = dsu.find(res.node1);
                                const rN2 = dsu.find(res.node2);

                                if (rN1 === curr.node && !visited.has(rN2)) {
                                    visited.add(rN2);
                                    queue.push({ node: rN2, r: curr.r + res.resistance });
                                } else if (rN2 === curr.node && !visited.has(rN1)) {
                                    visited.add(rN1);
                                    queue.push({ node: rN1, r: curr.r + res.resistance });
                                }
                            }
                        }
                        return { connected: false, totalR: 0 };
                    };

                    const path = directR == null ? findDmmPath(nodeRed, nodeBlack) : { connected: true, totalR: directR };
                    const measuredR = directR != null ? directR : (path.connected && path.totalR > 0 ? path.totalR : null);

                    if (measuredR != null) {
                        const isBeep = mode === "continuity" && measuredR < 25;
                        if (measuredR >= 1000000) {
                            dmmStates[c.id] = { readout: (measuredR / 1000000).toFixed(2), unit: "MΩ", isContinuityBeep: false };
                        } else if (measuredR >= 1000) {
                            dmmStates[c.id] = { readout: (measuredR / 1000).toFixed(2), unit: "kΩ", isContinuityBeep: isBeep };
                        } else {
                            dmmStates[c.id] = { readout: measuredR.toFixed(1), unit: "Ω", isContinuityBeep: isBeep };
                        }
                    } else {
                        dmmStates[c.id] = { readout: "0.L", unit: "Ω", isContinuityBeep: false };
                    }
                }
            } else if (mode === "current") {
                if (!isSimulating) {
                    dmmStates[c.id] = { readout: "0.00", unit: "mA", isContinuityBeep: false };
                } else {
                    let totalI = 0;
                    for (const lId in ledStates) {
                        if (ledStates[lId]?.isOn) totalI += ledStates[lId].currentMa;
                    }
                    for (const bId in buzzerStates) {
                        if (buzzerStates[bId]?.isBeeping) totalI += buzzerStates[bId].currentMa;
                    }
                    dmmStates[c.id] = { readout: totalI > 0 ? totalI.toFixed(1) : "0.00", unit: "mA", isContinuityBeep: false };
                }
            }
        }
    });

    // When simulator is not running: turn off output indicators, but preserve DMM readings
    if (!isSimulating) {
        Object.keys(ledStates).forEach(k => {
            ledStates[k] = { isOn: false, isDim: false, isOverloaded: false, voltage: 0, currentMa: 0, brightness: 0, status: "off" };
        });
        Object.keys(buzzerStates).forEach(k => {
            buzzerStates[k] = { isBeeping: false, voltage: 0, currentMa: 0 };
        });
        batteries.forEach(b => {
            batteryStates[b.id] = { isDischarging: false, currentMa: 0, isShortCircuit: false, voltage: b.voltage != null ? Number(b.voltage) : 9.0 };
        });
        const standbyMcuStates = {};
        arduinoBoards.forEach(b => { standbyMcuStates[b.id] = { isPowered: false, d13High: false, pins: {} }; });
        esp32Boards.forEach(b => { standbyMcuStates[b.id] = { isPowered: false, d2High: false, pins: {} }; });

        return {
            isSimulating: false,
            supplyVoltage: 0,
            ledStates,
            batteryStates,
            buzzerStates,
            dmmStates,
            mcuStates: standbyMcuStates,
            logs: [{ time: "0.00s", type: "info", text: "Simulation standby. Click Play in the topbar to run simulation." }]
        };
    }

    // 7. Solve MCU Boards (Arduino Uno & ESP32 DevKit)
    const resolvedMcuStates = {};
    arduinoBoards.forEach((b) => {
        resolvedMcuStates[b.id] = {
            isPowered: true,
            d13High: mcuStates?.[b.id]?.d13High ?? true,
            pins: mcuStates?.[b.id]?.pins || { 13: 1 },
            txrxActive: Boolean(mcuStates?.[b.id]?.txrxActive || mcuStates?.[b.id]?.serialActive)
        };
    });
    esp32Boards.forEach((b) => {
        resolvedMcuStates[b.id] = {
            isPowered: true,
            d2High: mcuStates?.[b.id]?.d2High ?? true,
            pins: mcuStates?.[b.id]?.pins || { 2: 1 },
            txrxActive: Boolean(mcuStates?.[b.id]?.txrxActive || mcuStates?.[b.id]?.serialActive)
        };
    });

    const activeSupplyVoltage = powerSources.length > 0 
        ? powerSources[0].voltage 
        : (batteries.length > 0 && batteries[0].voltage != null ? Number(batteries[0].voltage) : 5.0);

    return {
        isSimulating: true,
        supplyVoltage: activeSupplyVoltage,
        ledStates,
        batteryStates,
        buzzerStates,
        dmmStates,
        mcuStates: resolvedMcuStates,
        logs: simLogs
    };
}
