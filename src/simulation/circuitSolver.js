/**
 * Real-Time Physics-Accurate SPICE/EDA Circuit Solver
 * Evaluates breadboard tracks, jumper wires, 9V batteries, resistors, and LEDs in real time.
 */
import { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP32_PINS, RPI_PICO_PINS } from "../components/workspace/components/McuBoard";

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
    const isBattery = (c) => ["battery-9v", "battery-aa", "battery-aaa", "battery-coin"].includes(c.type);
    const batteries = components.filter(isBattery);
    const arduinoBoards = components.filter(c => ["arduino-uno", "arduino-mega", "arduino-nano"].includes(c.type));
    const esp32Boards = components.filter(c => c.type === "esp32-devkit" || c.type === "esp32" || c.type === "esp32-s3");
    const rpiPicoBoards = components.filter(c => c.type === "rpi-pico" || c.type === "raspberry-pi");

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

        // 2. Check if touches battery snap terminals (taking rotation and cell count into account)
        for (const b of batteries) {
            const rot = ((b.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            let posLocalX = 72, posLocalY = -14;
            let negLocalX = 24, negLocalY = -14;

            if (b.type === "battery-aa" || b.type === "battery-aaa") {
                const cellCount = b.cells || (b.voltage === 1.5 ? 1 : b.voltage === 6 ? 4 : 2);
                const isAAA = b.type === "battery-aaa";
                const totalWidth = cellCount === 1 ? 56 : cellCount === 4 ? 144 : 84;
                posLocalX = totalWidth - 18;
                posLocalY = -14;
                negLocalX = 18;
                negLocalY = -14;
            } else if (b.type === "battery-coin") {
                posLocalX = 48;
                posLocalY = 32;
                negLocalX = 16;
                negLocalY = 32;
            }

            // 2. Battery terminals are connected specifically via wires or breadboard holes (no direct proximity auto-shorting)
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

        // 5. Check if touches Raspberry Pi Pico pins (40 pins on Left & Right)
        for (const b of rpiPicoBoards) {
            const rot = ((b.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rot);
            const sin = Math.sin(rot);

            const allPicoPins = [
                ...RPI_PICO_PINS.leftCol,
                ...RPI_PICO_PINS.rightCol
            ];

            for (const pin of allPicoPins) {
                const wx = b.x + pin.x * cos - pin.y * sin;
                const wy = b.y + pin.x * sin + pin.y * cos;
                if (Math.hypot(x - wx, y - wy) <= 10) {
                    let pinId;
                    if (pin.isGnd) {
                        pinId = `POWER_SOURCE_GND_pico_${b.id}`;
                    } else if (pin.name === "VBUS" || pin.name === "VSYS") {
                        pinId = `POWER_SOURCE_POS_pico5V_${b.id}`;
                    } else if (pin.name === "3V3" || pin.is3V3) {
                        pinId = `POWER_SOURCE_POS_pico3V3_${b.id}`;
                    } else if (pin.isGpio) {
                        const pinNum = String(pin.pinNum);
                        const isPinHigh = mcuStates?.[b.id]?.pins?.[pinNum] === 1;
                        pinId = isPinHigh ? `POWER_SOURCE_POS_pico_${b.id}_${pinNum}` : `PICO_PIN_${b.id}_${pinNum}`;
                    } else {
                        pinId = `PICO_PIN_${b.id}_${pin.name}`;
                    }
                    const ptKey = `pt_${Math.round(x / 4) * 4}_${Math.round(y / 4) * 4}`;
                    dsu.union(ptKey, pinId);
                    return dsu.find(pinId);
                }
            }
        }

        return pointToNode({ x, y });
    };

    // 1. Connect Wire Endpoints & Register Wire End IDs
    wires.forEach((w) => {
        if (!w.points || w.points.length < 2) return;
        const pStart = w.points[0];
        const pEnd = w.points[w.points.length - 1];

        const nodeStart = getElectricalNode(pStart.x, pStart.y);
        const nodeEnd = getElectricalNode(pEnd.x, pEnd.y);
        dsu.union(nodeStart, nodeEnd);
        dsu.union(`WIRE_${w.id}_START`, nodeStart);
        dsu.union(`WIRE_${w.id}_END`, nodeEnd);
    });

    // 2. Identify Power Sources (Batteries, Arduino Uno, ESP32 DevKit)
    let posNodes = [];
    let gndNodes = [];
    const powerSources = [];

    batteries.forEach((c) => {
        const rot = ((c.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);

        let posLocalX = 72, posLocalY = -14;
        let negLocalX = 24, negLocalY = -14;

        if (c.type === "battery-aa" || c.type === "battery-aaa") {
            const cellCount = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : c.voltage === 4.5 ? 3 : 2);
            const totalWidth = cellCount === 1 ? 64 : cellCount === 4 ? 176 : cellCount === 3 ? 140 : 96;
            posLocalX = totalWidth - 20;
            posLocalY = -14;
            negLocalX = 20;
            negLocalY = -14;
        } else if (c.type === "battery-coin") {
            posLocalX = 48;
            posLocalY = 32;
            negLocalX = 16;
            negLocalY = 32;
        }

        const posWorldX = c.x + posLocalX * cos - posLocalY * sin;
        const posWorldY = c.y + posLocalX * sin + posLocalY * cos;
        const negWorldX = c.x + negLocalX * cos - negLocalY * sin;
        const negWorldY = c.y + negLocalX * sin + negLocalY * cos;

        // Auto-link wire endpoints directly on terminals (precise snap <= 10px)
        wires.forEach(w => {
            if (!w.points || w.points.length < 2) return;
            const p1 = w.points[0];
            const p2 = w.points[w.points.length - 1];
            if (Math.hypot(p1.x - posWorldX, p1.y - posWorldY) <= 10) {
                dsu.union(getElectricalNode(p1.x, p1.y), dsu.find(`POWER_SOURCE_POS_${c.id}`));
            }
            if (Math.hypot(p2.x - posWorldX, p2.y - posWorldY) <= 10) {
                dsu.union(getElectricalNode(p2.x, p2.y), dsu.find(`POWER_SOURCE_POS_${c.id}`));
            }
            if (Math.hypot(p1.x - negWorldX, p1.y - negWorldY) <= 10) {
                dsu.union(getElectricalNode(p1.x, p1.y), dsu.find(`POWER_SOURCE_GND_${c.id}`));
            }
            if (Math.hypot(p2.x - negWorldX, p2.y - negWorldY) <= 10) {
                dsu.union(getElectricalNode(p2.x, p2.y), dsu.find(`POWER_SOURCE_GND_${c.id}`));
            }
        });

        const posNode = dsu.find(`POWER_SOURCE_POS_${c.id}`);
        const gndNode = dsu.find(`POWER_SOURCE_GND_${c.id}`);
        posNodes.push(posNode);
        gndNodes.push(gndNode);

        let v = 9.0;
        if (c.type === "battery-coin") {
            v = 3.0;
        } else if (c.type === "battery-aa" || c.type === "battery-aaa") {
            const cellCount = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : c.voltage === 4.5 ? 3 : 2);
            v = cellCount * 1.5;
        } else if (c.voltage != null) {
            v = Number(c.voltage);
        }

        // Optional User Switch: If switch is configured on the holder and switched OFF, supply 0V
        let isSwitchOn = true;
        if (c.hasSwitch) {
            isSwitchOn = c.switchState !== false && c.isOn !== false;
        }
        if (!isSwitchOn) {
            v = 0;
        }

        powerSources.push({
            id: `battery_${c.id}`,
            sourceType: "battery",
            sourceId: c.id,
            name: c.name || "Battery",
            posNode,
            gndNode,
            voltage: v,
            isSwitchOn
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
            sourceType: "arduino",
            sourceId: b.id,
            name: "Arduino 5V",
            posNode: pos5V,
            gndNode,
            voltage: 5.0
        });
        powerSources.push({
            id: `ard_3v3_${b.id}`,
            sourceType: "arduino",
            sourceId: b.id,
            name: "Arduino 3.3V",
            posNode: pos3V3,
            gndNode,
            voltage: 3.3
        });
        if (mcuStates?.[b.id]?.d13High ?? true) {
            powerSources.push({
                id: `ard_d13_${b.id}`,
                sourceType: "arduino",
                sourceId: b.id,
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
                        sourceType: "arduino",
                        sourceId: b.id,
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
            sourceType: "esp32",
            sourceId: b.id,
            name: "ESP32 3.3V",
            posNode: pos3V3,
            gndNode,
            voltage: 3.3
        });
        powerSources.push({
            id: `esp_5v_${b.id}`,
            sourceType: "esp32",
            sourceId: b.id,
            name: "ESP32 VIN (5V)",
            posNode: pos5V,
            gndNode,
            voltage: 5.0
        });
        if (mcuStates?.[b.id]?.d2High ?? true) {
            powerSources.push({
                id: `esp_d2_${b.id}`,
                sourceType: "esp32",
                sourceId: b.id,
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
                        sourceType: "esp32",
                        sourceId: b.id,
                        name: `ESP32 Pin D${pinNum}`,
                        posNode: pinPos,
                        gndNode,
                        voltage: 3.3
                    });
                }
            }
        }
    });

    rpiPicoBoards.forEach((b) => {
        const gndNode = dsu.find(`POWER_SOURCE_GND_pico_${b.id}`);
        const pos5V = dsu.find(`POWER_SOURCE_POS_pico5V_${b.id}`);
        const pos3V3 = dsu.find(`POWER_SOURCE_POS_pico3V3_${b.id}`);

        posNodes.push(pos5V, pos3V3);
        gndNodes.push(gndNode);

        powerSources.push({
            id: `pico_vbus_${b.id}`,
            sourceType: "rpi-pico",
            sourceId: b.id,
            name: "Raspberry Pi Pico VBUS (5V)",
            posNode: pos5V,
            gndNode,
            voltage: 5.0
        });
        powerSources.push({
            id: `pico_3v3_${b.id}`,
            sourceType: "rpi-pico",
            sourceId: b.id,
            name: "Raspberry Pi Pico 3V3",
            posNode: pos3V3,
            gndNode,
            voltage: 3.3
        });
        if (mcuStates?.[b.id]?.pins) {
            for (const pinNum in mcuStates[b.id].pins) {
                if (mcuStates[b.id].pins[pinNum] === 1) {
                    const pinPos = dsu.find(`POWER_SOURCE_POS_pico_${b.id}_${pinNum}`);
                    posNodes.push(pinPos);
                    powerSources.push({
                        id: `pico_pin_${pinNum}_${b.id}`,
                        sourceType: "rpi-pico",
                        sourceId: b.id,
                        name: `Raspberry Pi Pico GP${pinNum}`,
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

            // Connect nearby wire endpoints (precise 10px snap directly on terminal leads)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    if (Math.hypot(p.x - c.x, p.y - c.y) <= 10) dsu.union(getElectricalNode(p.x, p.y), n1);
                    if (Math.hypot(p.x - (c.x + dx), p.y - (c.y + dy)) <= 10) dsu.union(getElectricalNode(p.x, p.y), n2);
                });
            });

            resistors.push({
                id: c.id,
                node1: n1,
                node2: n2,
                resistance: c.resistance || 220
            });
        }

        if (c.type === "photoresistor") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);
            const p1 = { x: Math.round(c.x), y: Math.round(c.y + 16 * cos) };
            const p2 = { x: Math.round(c.x + 32 * cos), y: Math.round(c.y + 32 * sin + 16 * cos) };
            const n1 = getElectricalNode(p1.x, p1.y);
            const n2 = getElectricalNode(p2.x, p2.y);
            const lux = c.lux != null ? c.lux : 50;
            const r = c.resistance || Math.round(1000000 * Math.pow(10, -(lux / 25)));
            resistors.push({
                id: c.id,
                node1: n1,
                node2: n2,
                resistance: Math.max(50, r)
            });
        }

        if (c.type === "switch-spst") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);
            const p1 = { x: Math.round(c.x), y: Math.round(c.y + 16 * cos) };
            const p2 = { x: Math.round(c.x + 32 * cos), y: Math.round(c.y + 32 * sin + 16 * cos) };
            const n1 = getElectricalNode(p1.x, p1.y);
            const n2 = getElectricalNode(p2.x, p2.y);
            const isClosed = Boolean(c.isOn != null ? c.isOn : c.switchState === "closed");
            resistors.push({
                id: c.id,
                node1: n1,
                node2: n2,
                resistance: isClosed ? 0.05 : 10000000
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

    // Helper to find electrical paths through the resistor network
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

    // Helper to find any active power source forming a closed circuit across nodeA and nodeB
    const findActivePowerSourceForLoad = (nodeA, nodeB) => {
        const rootA = dsu.find(nodeA);
        const rootB = dsu.find(nodeB);
        if (rootA === rootB) return null;

        for (const ps of powerSources) {
            if (!ps.voltage || ps.voltage <= 0) continue;
            const pPos = dsu.find(ps.posNode);
            const pGnd = dsu.find(ps.gndNode);
            if (pPos === pGnd) continue; // dead shorted source

            // Forward polarity: (+) connected to nodeA, (-) connected to nodeB
            const pathFwdPos = findPathToNode(pPos, rootA);
            const pathFwdGnd = findPathToNode(rootB, pGnd);
            if (pathFwdPos.connected && pathFwdGnd.connected) {
                return {
                    powerSource: ps,
                    polarity: "forward",
                    voltage: ps.voltage,
                    seriesR: pathFwdPos.totalR + pathFwdGnd.totalR
                };
            }

            // Reverse polarity: (+) connected to nodeB, (-) connected to nodeA
            const pathRevPos = findPathToNode(pPos, rootB);
            const pathRevGnd = findPathToNode(rootA, pGnd);
            if (pathRevPos.connected && pathRevGnd.connected) {
                return {
                    powerSource: ps,
                    polarity: "reverse",
                    voltage: ps.voltage,
                    seriesR: pathRevPos.totalR + pathRevGnd.totalR
                };
            }
        }
        return null;
    };

    // 4. Solve LEDs
    const leds = [];
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

            // Connect nearby wire endpoints (precise 10px snap directly on terminal leads)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dAnode = Math.hypot(p.x - c.x, p.y - c.y);
                    const dCathode = Math.hypot(p.x - (c.x + dx), p.y - (c.y + dy));
                    if (dAnode <= 10 && dAnode < dCathode) {
                        dsu.union(getElectricalNode(p.x, p.y), anodeNode);
                    } else if (dCathode <= 10 && dCathode < dAnode) {
                        dsu.union(getElectricalNode(p.x, p.y), cathodeNode);
                    }
                });
            });

            anodeNode = dsu.find(anodeNode);
            cathodeNode = dsu.find(cathodeNode);
            leds.push({ id: c.id, nodeAnode: anodeNode, nodeCathode: cathodeNode });

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

            const powerConn = findActivePowerSourceForLoad(anodeNode, cathodeNode);
            if (!powerConn) {
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

            if (powerConn.polarity === "forward") {
                const vSupply = powerConn.voltage;
                const ledColor = (c.color || "red").toLowerCase();
                const vForward = (ledColor.includes("blue") || ledColor.includes("white")) ? 2.9 :
                                 (ledColor.includes("green")) ? 2.1 :
                                 (ledColor.includes("yellow") || ledColor.includes("orange")) ? 2.0 : 1.8;

                const totalSeriesR = powerConn.seriesR;
                const rInternal = 2.0;
                const rTotal = totalSeriesR + rInternal;

                if (vSupply < 1.4) {
                    ledStates[c.id] = {
                        isOn: false,
                        isDim: false,
                        isOverloaded: false,
                        voltage: vSupply,
                        currentMa: 0,
                        brightness: 0,
                        status: "low_voltage",
                        powerSourceId: powerConn.powerSource.id
                    };
                } else if (totalSeriesR < 25 && vSupply >= 2.8) {
                    const currentAmps = (vSupply - vForward) / rTotal;
                    const currentMa = currentAmps * 1000;
                    ledStates[c.id] = {
                        isOn: false,
                        isDim: false,
                        isOverloaded: true,
                        voltage: vSupply,
                        currentMa: Math.round(currentMa),
                        brightness: 0,
                        status: "burned",
                        powerSourceId: powerConn.powerSource.id
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "warn",
                        text: `💥 [OVERLOAD BURNOUT] LED destroyed: ${vSupply.toFixed(1)}V applied directly without current-limiting resistor! Current reached ${Math.round(currentMa)}mA.`
                    });
                } else {
                    let currentMa;
                    let isDim = false;
                    let brightness = 0;

                    if (vSupply <= vForward + 0.1 && totalSeriesR < 40) {
                        currentMa = (vSupply >= 1.5) ? Math.max(0.8, (vSupply - 1.3) * 6.0) : 0.4;
                        isDim = true;
                        brightness = Math.min(0.42, 0.22 + (currentMa / 6.0) * 0.20);
                    } else {
                        const effectiveDrop = Math.min(vForward, vSupply - 0.2);
                        const currentAmps = Math.max(0, (vSupply - effectiveDrop) / rTotal);
                        currentMa = currentAmps * 1000;

                        if (currentMa > 28) {
                            ledStates[c.id] = {
                                isOn: false,
                                isDim: false,
                                isOverloaded: true,
                                voltage: vSupply,
                                currentMa: Math.round(currentMa),
                                brightness: 0,
                                status: "burned",
                                powerSourceId: powerConn.powerSource.id
                            };
                            return;
                        } else if (currentMa < 5.0 && currentMa >= 0.4) {
                            isDim = true;
                            brightness = Math.min(0.45, 0.20 + (currentMa / 5.0) * 0.22);
                        } else if (currentMa >= 5.0) {
                            isDim = false;
                            brightness = Math.min(1.0, 0.65 + ((currentMa - 5.0) / 20.0) * 0.35);
                        } else {
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
                            status: isDim ? "dim" : "bright",
                            powerSourceId: powerConn.powerSource.id
                        };
                    } else {
                        ledStates[c.id] = {
                            isOn: false,
                            isDim: false,
                            isOverloaded: false,
                            voltage: vSupply,
                            currentMa: Math.round(currentMa * 10) / 10,
                            brightness: 0,
                            status: "insufficient_current",
                            powerSourceId: powerConn.powerSource.id
                        };
                    }
                }
            } else {
                // Reverse biased
                ledStates[c.id] = {
                    isOn: false,
                    isDim: false,
                    isOverloaded: false,
                    voltage: powerConn.voltage,
                    currentMa: 0,
                    brightness: 0,
                    status: "reverse_biased",
                    powerSourceId: powerConn.powerSource.id
                };
            }
        }
    });

    // 4b. Solve Piezo Buzzers
    const buzzers = [];
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
                    if (Math.hypot(p.x - pPos.x, p.y - pPos.y) <= 12) dsu.union(getElectricalNode(p.x, p.y), posNode);
                    if (Math.hypot(p.x - pNeg.x, p.y - pNeg.y) <= 12) dsu.union(getElectricalNode(p.x, p.y), negNode);
                });
            });

            posNode = dsu.find(posNode);
            negNode = dsu.find(negNode);
            buzzers.push({ id: c.id, nodePos: posNode, nodeNeg: negNode });

            if (posNode === negNode) {
                buzzerStates[c.id] = { isBeeping: false, voltage: 0, currentMa: 0 };
                return;
            }

            const powerConn = findActivePowerSourceForLoad(posNode, negNode);

            if (powerConn && powerConn.polarity === "forward") {
                const vSupply = powerConn.voltage;
                if (vSupply >= 2.5) {
                    const currentMa = Math.round((vSupply / (120 + powerConn.seriesR)) * 1000);
                    buzzerStates[c.id] = {
                        isBeeping: true,
                        voltage: vSupply,
                        currentMa,
                        powerSourceId: powerConn.powerSource.id
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

    // 4c. Solve DC Motors (130 DC Motor & TT BO Geared Motor)
    const motorStates = {};
    components.forEach((c) => {
        if (c.type === "motor-dc" || c.type === "motor-geared" || c.type === "motor-bo") {
            const rotRad = ((c.rotation || 0) * Math.PI) / 180;
            const cos = Math.cos(rotRad);
            const sin = Math.sin(rotRad);

            // Terminal 1 (Pos, Red lead): local (0, 0) -> world (c.x, c.y)
            // Terminal 2 (Neg, Black lead): local (48, 0) -> world (c.x + 48*cos, c.y + 48*sin)
            const pPos = { x: c.x, y: c.y };
            const pNeg = { x: Math.round(c.x + 48 * cos), y: Math.round(c.y + 48 * sin) };

            let posNode = getElectricalNode(pPos.x, pPos.y);
            let negNode = getElectricalNode(pNeg.x, pNeg.y);

            // Connect nearby wire endpoints (precise 10px snap directly on solder eyelets)
            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dPos = Math.hypot(p.x - pPos.x, p.y - pPos.y);
                    const dNeg = Math.hypot(p.x - pNeg.x, p.y - pNeg.y);
                    if (dPos <= 10 && dPos < dNeg) {
                        dsu.union(getElectricalNode(p.x, p.y), posNode);
                    } else if (dNeg <= 10 && dNeg < dPos) {
                        dsu.union(getElectricalNode(p.x, p.y), negNode);
                    }
                });
            });

            posNode = dsu.find(posNode);
            negNode = dsu.find(negNode);

            if (posNode === negNode) {
                motorStates[c.id] = { isSpinning: false, rpm: 0, voltage: 0, currentMa: 0, direction: "cw" };
                return;
            }

            const powerConn = findActivePowerSourceForLoad(posNode, negNode);

            if (!powerConn) {
                motorStates[c.id] = { isSpinning: false, rpm: 0, voltage: 0, currentMa: 0, direction: "cw" };
                return;
            }

            const isFwd = powerConn.polarity === "forward";
            const vRaw = powerConn.voltage;
            const seriesR = powerConn.seriesR;
            const isGeared = c.type === "motor-geared" || c.type === "motor-bo";
            const motorInternalR = isGeared ? 18.0 : 12.0;
            const totalR = motorInternalR + seriesR;

            const effectiveVoltage = Math.max(0, vRaw * (motorInternalR / totalR));
            const currentMa = Math.round((vRaw / totalR) * 1000);

            if (effectiveVoltage >= 1.0) {
                const ratio = c.gearRatio || "1:48";
                const baseRpm = ratio === "1:220" ? 45 : ratio === "1:120" ? 90 : 220;

                let calculatedRpm = 0;
                if (isGeared) {
                    calculatedRpm = Math.round((effectiveVoltage / 6.0) * baseRpm);
                } else {
                    calculatedRpm = Math.round((effectiveVoltage / 6.0) * 12500);
                }

                calculatedRpm = Math.max(10, Math.min(30000, calculatedRpm));
                const rotDir = isFwd ? "cw" : "ccw";

                motorStates[c.id] = {
                    isSpinning: true,
                    rpm: calculatedRpm,
                    voltage: Math.round(effectiveVoltage * 10) / 10,
                    currentMa,
                    direction: rotDir,
                    powerSourceId: powerConn.powerSource.id
                };

                simLogs.push({
                    time: "0.02s",
                    type: "info",
                    text: `⚡ [MOTOR RUNNING] ${isGeared ? `TT BO Geared Motor (${ratio})` : "130 DC Motor"} rotating ${rotDir.toUpperCase()} at ${calculatedRpm.toLocaleString()} RPM (${effectiveVoltage.toFixed(1)}V, ${currentMa}mA drawn from ${powerConn.powerSource.name}).`
                });
            } else {
                motorStates[c.id] = { isSpinning: false, rpm: 0, voltage: effectiveVoltage, currentMa: 0, direction: "cw" };
            }
        }
    });

    // 4d. Solve Active Sensors, Modules, ICs, LCDs & Servos
    const sensorStates = {};
    const icStates = {};
    const lcdStates = {};
    const servoStates = {};

    components.forEach((c) => {
        const rotRad = ((c.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);

        // PIR Motion Sensor (HC-SR501): VCC (0,0), OUT (16,0), GND (32,0)
        if (c.type === "sensor-pir") {
            const pVcc = { x: c.x, y: c.y };
            const pGnd = { x: Math.round(c.x + 32 * cos), y: Math.round(c.y + 32 * sin) };
            let vccNode = getElectricalNode(pVcc.x, pVcc.y);
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dV = Math.hypot(p.x - pVcc.x, p.y - pVcc.y);
                    const dG = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dV <= 10 && dV < dG) dsu.union(getElectricalNode(p.x, p.y), vccNode);
                    else if (dG <= 10 && dG < dV) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            vccNode = dsu.find(vccNode);
            gndNode = dsu.find(gndNode);

            if (vccNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(vccNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 3.0) {
                    sensorStates[c.id] = {
                        isPowered: true,
                        isScanning: true,
                        voltage: powerConn.voltage,
                        currentMa: 15,
                        powerSourceId: powerConn.powerSource.id
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "info",
                        text: `📡 [PIR ACTIVE] HC-SR501 Motion Sensor powered (${powerConn.voltage.toFixed(1)}V) from ${powerConn.powerSource.name}. Radar sweep active.`
                    });
                } else {
                    sensorStates[c.id] = { isPowered: false, isScanning: false, voltage: 0, currentMa: 0 };
                }
            } else {
                sensorStates[c.id] = { isPowered: false, isScanning: false, voltage: 0, currentMa: 0 };
            }
        }

        // Ultrasonic Distance Sensor (HC-SR04): VCC (0,0), TRIG (16,0), ECHO (32,0), GND (48,0)
        if (c.type === "sensor-ultrasonic") {
            const pVcc = { x: c.x, y: c.y };
            const pGnd = { x: Math.round(c.x + 48 * cos), y: Math.round(c.y + 48 * sin) };
            let vccNode = getElectricalNode(pVcc.x, pVcc.y);
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dV = Math.hypot(p.x - pVcc.x, p.y - pVcc.y);
                    const dG = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dV <= 10 && dV < dG) dsu.union(getElectricalNode(p.x, p.y), vccNode);
                    else if (dG <= 10 && dG < dV) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            vccNode = dsu.find(vccNode);
            gndNode = dsu.find(gndNode);

            if (vccNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(vccNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 3.0) {
                    sensorStates[c.id] = {
                        isPowered: true,
                        isPinging: true,
                        voltage: powerConn.voltage,
                        currentMa: 15,
                        powerSourceId: powerConn.powerSource.id
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "info",
                        text: `🔊 [ULTRASONIC ACTIVE] HC-SR04 Sonar Transducer powered (${powerConn.voltage.toFixed(1)}V) from ${powerConn.powerSource.name}. Sonar ping active.`
                    });
                } else {
                    sensorStates[c.id] = { isPowered: false, isPinging: false, voltage: 0, currentMa: 0 };
                }
            } else {
                sensorStates[c.id] = { isPowered: false, isPinging: false, voltage: 0, currentMa: 0 };
            }
        }

        // Precision Temperature Sensor (TMP36): Pin 1 VCC (0,0), Pin 2 VOUT (16,0), Pin 3 GND (32,0)
        if (c.type === "sensor-temp") {
            const pVcc = { x: c.x, y: c.y };
            const pVout = { x: Math.round(c.x + 16 * cos), y: Math.round(c.y + 16 * sin) };
            const pGnd = { x: Math.round(c.x + 32 * cos), y: Math.round(c.y + 32 * sin) };
            let vccNode = getElectricalNode(pVcc.x, pVcc.y);
            let voutNode = getElectricalNode(pVout.x, pVout.y);
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dV = Math.hypot(p.x - pVcc.x, p.y - pVcc.y);
                    const dVo = Math.hypot(p.x - pVout.x, p.y - pVout.y);
                    const dG = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dV <= 10 && dV < dVo && dV < dG) dsu.union(getElectricalNode(p.x, p.y), vccNode);
                    else if (dVo <= 10 && dVo < dV && dVo < dG) dsu.union(getElectricalNode(p.x, p.y), voutNode);
                    else if (dG <= 10 && dG < dV && dG < dVo) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            vccNode = dsu.find(vccNode);
            gndNode = dsu.find(gndNode);
            voutNode = dsu.find(voutNode);

            if (vccNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(vccNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 2.7) {
                    const tempC = c.temperature != null ? Number(c.temperature) : 25;
                    const voutVal = Math.min(powerConn.voltage, Math.max(0.1, 0.5 + (tempC * 0.01)));
                    sensorStates[c.id] = {
                        isPowered: true,
                        temperature: tempC,
                        voltageOut: voutVal,
                        supplyVoltage: powerConn.voltage,
                        currentMa: 0.05,
                        powerSourceId: powerConn.powerSource.id
                    };
                    simLogs.push({
                        time: "0.02s",
                        type: "info",
                        text: `🌡️ [TMP36 ACTIVE] Precision Temperature Sensor (${tempC}°C) powered (${powerConn.voltage.toFixed(1)}V). VOUT = ${(voutVal * 1000).toFixed(0)}mV.`
                    });
                } else {
                    sensorStates[c.id] = { isPowered: false, temperature: c.temperature || 25, voltageOut: 0, currentMa: 0 };
                }
            } else {
                sensorStates[c.id] = { isPowered: false, temperature: c.temperature || 25, voltageOut: 0, currentMa: 0 };
            }
        }

        // DIP Logic ICs (74HCxx & 555): Pin 14 VCC (0, 0), Pin 7 GND (96, 32)
        if (c.type?.startsWith("ic-")) {
            const pVcc = { x: c.x, y: c.y };
            const pGnd = { x: Math.round(c.x + 96 * cos - 32 * sin), y: Math.round(c.y + 96 * sin + 32 * cos) };
            let vccNode = getElectricalNode(pVcc.x, pVcc.y);
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dV = Math.hypot(p.x - pVcc.x, p.y - pVcc.y);
                    const dG = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dV <= 10 && dV < dG) dsu.union(getElectricalNode(p.x, p.y), vccNode);
                    else if (dG <= 10 && dG < dV) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            vccNode = dsu.find(vccNode);
            gndNode = dsu.find(gndNode);

            if (vccNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(vccNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 2.0) {
                    icStates[c.id] = {
                        isPowered: true,
                        voltage: powerConn.voltage,
                        currentMa: 5,
                        powerSourceId: powerConn.powerSource.id
                    };
                } else {
                    icStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
                }
            } else {
                icStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
            }
        }

        // Character LCD Modules (1602 / 2004): GND (16, -10), VCC (32, -10)
        if (c.type?.startsWith("lcd")) {
            const pGnd = { x: Math.round(c.x + 16 * cos - (-10) * sin), y: Math.round(c.y + 16 * sin + (-10) * cos) };
            const pVcc = { x: Math.round(c.x + 32 * cos - (-10) * sin), y: Math.round(c.y + 32 * sin + (-10) * cos) };
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);
            let vccNode = getElectricalNode(pVcc.x, pVcc.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dV = Math.hypot(p.x - pVcc.x, p.y - pVcc.y);
                    const dG = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dV <= 10 && dV < dG) dsu.union(getElectricalNode(p.x, p.y), vccNode);
                    else if (dG <= 10 && dG < dV) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            vccNode = dsu.find(vccNode);
            gndNode = dsu.find(gndNode);

            if (vccNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(vccNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 3.0) {
                    lcdStates[c.id] = {
                        isPowered: true,
                        voltage: powerConn.voltage,
                        currentMa: 25,
                        powerSourceId: powerConn.powerSource.id
                    };
                } else {
                    lcdStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
                }
            } else {
                lcdStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
            }
        }

        // SG90 Micro Servo: GND (0, 0), 5V (16, 0), PWM (32, 0)
        if (c.type === "servo-sg90") {
            const pGnd = { x: c.x, y: c.y };
            const pPos = { x: Math.round(c.x + 16 * cos), y: Math.round(c.y + 16 * sin) };
            let gndNode = getElectricalNode(pGnd.x, pGnd.y);
            let posNode = getElectricalNode(pPos.x, pPos.y);

            wires.forEach(w => {
                if (!w.points || w.points.length < 2) return;
                [w.points[0], w.points[w.points.length - 1]].forEach(p => {
                    const dPos = Math.hypot(p.x - pPos.x, p.y - pPos.y);
                    const dGnd = Math.hypot(p.x - pGnd.x, p.y - pGnd.y);
                    if (dPos <= 24 && dPos < dGnd) dsu.union(getElectricalNode(p.x, p.y), posNode);
                    else if (dGnd <= 24 && dGnd < dPos) dsu.union(getElectricalNode(p.x, p.y), gndNode);
                });
            });

            posNode = dsu.find(posNode);
            gndNode = dsu.find(gndNode);

            if (posNode !== gndNode) {
                const powerConn = findActivePowerSourceForLoad(posNode, gndNode);
                if (powerConn && powerConn.polarity === "forward" && powerConn.voltage >= 3.0) {
                    servoStates[c.id] = {
                        isPowered: true,
                        voltage: powerConn.voltage,
                        currentMa: 60,
                        powerSourceId: powerConn.powerSource.id
                    };
                } else {
                    servoStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
                }
            } else {
                servoStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
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
            // Sum current drawn by any conducting loads connected to this specific battery
            components.forEach((c) => {
                if (c.type === "led") {
                    const st = ledStates[c.id];
                    if (st && st.isOn && st.currentMa > 0 && st.powerSourceId === b.id) {
                        totalDrawnCurrentMa += st.currentMa;
                    }
                }
                if (c.type === "buzzer") {
                    const bz = buzzerStates[c.id];
                    if (bz && bz.isBeeping && bz.currentMa > 0 && bz.powerSourceId === b.id) {
                        totalDrawnCurrentMa += bz.currentMa;
                    }
                }
                if (c.type === "motor-dc" || c.type === "motor-geared" || c.type === "motor-bo") {
                    const mot = motorStates[c.id];
                    if (mot && mot.isSpinning && mot.currentMa > 0 && mot.powerSourceId === b.id) {
                        totalDrawnCurrentMa += mot.currentMa;
                    }
                }
                if (c.type === "sensor-pir" || c.type === "sensor-ultrasonic") {
                    const sen = sensorStates[c.id];
                    if (sen && sen.isPowered && sen.powerSourceId === b.id) {
                        totalDrawnCurrentMa += sen.currentMa || 15;
                    }
                }
                if (c.type?.startsWith("ic-")) {
                    const ic = icStates[c.id];
                    if (ic && ic.isPowered && ic.powerSourceId === b.id) {
                        totalDrawnCurrentMa += ic.currentMa || 5;
                    }
                }
                if (c.type?.startsWith("lcd")) {
                    const lcd = lcdStates[c.id];
                    if (lcd && lcd.isPowered && lcd.powerSourceId === b.id) {
                        totalDrawnCurrentMa += lcd.currentMa || 25;
                    }
                }
                if (c.type === "servo-sg90") {
                    const srv = servoStates[c.id];
                    if (srv && srv.isPowered && srv.powerSourceId === b.id) {
                        totalDrawnCurrentMa += srv.currentMa || 60;
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
                } else if (comp.type === "motor-dc" || comp.type === "motor-geared" || comp.type === "motor-bo") {
                    const p1 = toWorld(0, 0);
                    const p2 = toWorld(48, 0);
                    if (Math.hypot(p1.x - probeRed.x, p1.y - probeRed.y) <= 24) dsu.union(getElectricalNode(p1.x, p1.y), nodeRed);
                    if (Math.hypot(p2.x - probeRed.x, p2.y - probeRed.y) <= 24) dsu.union(getElectricalNode(p2.x, p2.y), nodeRed);
                    if (Math.hypot(p1.x - probeBlack.x, p1.y - probeBlack.y) <= 24) dsu.union(getElectricalNode(p1.x, p1.y), nodeBlack);
                    if (Math.hypot(p2.x - probeBlack.x, p2.y - probeBlack.y) <= 24) dsu.union(getElectricalNode(p2.x, p2.y), nodeBlack);
                }
            });

            nodeRed = dsu.find(nodeRed);
            nodeBlack = dsu.find(nodeBlack);

            const mode = c.mode || "voltage";

            if (mode === "voltage") {
                if (nodeRed === nodeBlack) {
                    dmmStates[c.id] = { readout: "0.00", unit: "V", isContinuityBeep: false };
                    return;
                }

                // Check direct connection to any active power source
                let measuredV = null;
                for (const ps of powerSources) {
                    if (!ps.voltage || ps.voltage <= 0) continue;
                    const pPos = dsu.find(ps.posNode);
                    const pGnd = dsu.find(ps.gndNode);
                    if (nodeRed === pPos && nodeBlack === pGnd) {
                        dmmStates[c.id] = { readout: ps.voltage.toFixed(2), unit: "V", isContinuityBeep: false };
                        measuredV = ps.voltage;
                        break;
                    } else if (nodeBlack === pPos && nodeRed === pGnd) {
                        dmmStates[c.id] = { readout: `-${ps.voltage.toFixed(2)}`, unit: "V", isContinuityBeep: false };
                        measuredV = -ps.voltage;
                        break;
                    }
                }

                if (measuredV != null) return;

                // 3. Measuring across an LED
                for (const led of leds) {
                    const anRoot = dsu.find(led.nodeAnode);
                    const caRoot = dsu.find(led.nodeCathode);
                    if ((nodeRed === anRoot && nodeBlack === caRoot) || (nodeRed === caRoot && nodeBlack === anRoot)) {
                        const sign = (nodeRed === anRoot) ? 1 : -1;
                        const st = ledStates[led.id];
                        const vf = (st && st.isOn) ? (st.isOverloaded ? 9.0 : 2.05) : 0;
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

                    // Relative to Ground or Supply fallback
                    if (measuredV == null) {
                        measuredV = 0.00;
                    }

                    dmmStates[c.id] = { readout: measuredV.toFixed(2), unit: "V", isContinuityBeep: false };
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

    // When simulator is not running (!isSimulating), ALL components MUST be OFF and in STANDBY
    if (!isSimulating) {
        const standbyLedStates = {};
        components.filter(c => c.type === "led").forEach(c => {
            standbyLedStates[c.id] = { isOn: false, isDim: false, isOverloaded: false, voltage: 0, currentMa: 0, brightness: 0, status: "off" };
        });

        const standbyBuzzerStates = {};
        components.filter(c => c.type === "buzzer").forEach(c => {
            standbyBuzzerStates[c.id] = { isBeeping: false, voltage: 0, currentMa: 0 };
        });

        const standbyMotorStates = {};
        components.filter(c => c.type === "motor-dc" || c.type === "motor-geared" || c.type === "motor-bo").forEach(c => {
            standbyMotorStates[c.id] = { isSpinning: false, rpm: 0, voltage: 0, currentMa: 0, direction: "cw" };
        });

        const standbyBatteryStates = {};
        batteries.forEach(b => {
            standbyBatteryStates[b.id] = { isDischarging: false, currentMa: 0, isShortCircuit: false, voltage: b.voltage != null ? Number(b.voltage) : 9.0 };
        });

        const standbySensorStates = {};
        components.filter(c => c.type === "sensor-pir" || c.type === "sensor-ultrasonic").forEach(c => {
            standbySensorStates[c.id] = { isPowered: false, isScanning: false, isPinging: false, voltage: 0, currentMa: 0 };
        });

        const standbyIcStates = {};
        components.filter(c => c.type?.startsWith("ic-")).forEach(c => {
            standbyIcStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
        });

        const standbyLcdStates = {};
        components.filter(c => c.type?.startsWith("lcd")).forEach(c => {
            standbyLcdStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
        });

        const standbyServoStates = {};
        components.filter(c => c.type === "servo-sg90").forEach(c => {
            standbyServoStates[c.id] = { isPowered: false, voltage: 0, currentMa: 0 };
        });

        const standbyMcuStates = {};
        arduinoBoards.forEach(b => { standbyMcuStates[b.id] = { isPowered: false, d13High: false, pins: {} }; });
        esp32Boards.forEach(b => { standbyMcuStates[b.id] = { isPowered: false, d2High: false, pins: {} }; });

        const standbyWireStates = {};
        wires.forEach(w => {
            standbyWireStates[w.id] = { hasCurrent: false };
        });

        return {
            isSimulating: false,
            supplyVoltage: batteries[0]?.voltage || 0,
            ledStates: standbyLedStates,
            batteryStates: standbyBatteryStates,
            buzzerStates: standbyBuzzerStates,
            motorStates: standbyMotorStates,
            sensorStates: standbySensorStates,
            icStates: standbyIcStates,
            lcdStates: standbyLcdStates,
            servoStates: standbyServoStates,
            dmmStates,
            wireStates: standbyWireStates,
            mcuStates: standbyMcuStates,
            logs: [{ time: "0.00s", type: "info", text: "Simulation standby. Press Play to start simulation." }]
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

    // 8. Calculate Real Wire Currents (Only animate when real current is flowing!)
    const conductingNodes = new Set();

    // A. Active Batteries (discharging through load or short-circuited)
    batteries.forEach(b => {
        const state = batteryStates[b.id];
        if (state && (state.isDischarging || state.isShortCircuit || (state.currentMa > 0.05))) {
            const posRoot = dsu.find(`POWER_SOURCE_POS_${b.id}`);
            const gndRoot = dsu.find(`POWER_SOURCE_GND_${b.id}`);
            conductingNodes.add(posRoot);
            conductingNodes.add(gndRoot);
        }
    });

    // B. Active MCU Power Rails & Output GPIOs
    arduinoBoards.forEach(b => {
        const gndRoot = dsu.find(`POWER_SOURCE_GND_ard_${b.id}`);
        const pos5V = dsu.find(`POWER_SOURCE_POS_ard5V_${b.id}`);
        const posD13 = dsu.find(`POWER_SOURCE_POS_ardD13_${b.id}`);
        conductingNodes.add(gndRoot);
        conductingNodes.add(pos5V);
        if (resolvedMcuStates[b.id]?.d13High) conductingNodes.add(posD13);
    });

    esp32Boards.forEach(b => {
        const gndRoot = dsu.find(`POWER_SOURCE_GND_esp_${b.id}`);
        const pos3V3 = dsu.find(`POWER_SOURCE_POS_esp3V3_${b.id}`);
        const posD2 = dsu.find(`POWER_SOURCE_POS_espD2_${b.id}`);
        conductingNodes.add(gndRoot);
        conductingNodes.add(pos3V3);
        if (resolvedMcuStates[b.id]?.d2High) conductingNodes.add(posD2);
    });

    // C. Active LEDs
    Object.entries(ledStates).forEach(([ledId, state]) => {
        if (state.isOn && state.currentMa > 0) {
            conductingNodes.add(dsu.find(state.nodeAnode));
            conductingNodes.add(dsu.find(state.nodeCathode));
        }
    });

    // D. Active Buzzers
    Object.entries(buzzerStates).forEach(([buzId, state]) => {
        if (state.isBeeping) {
            conductingNodes.add(dsu.find(`BUZZER_${buzId}_POS`));
            conductingNodes.add(dsu.find(`BUZZER_${buzId}_NEG`));
        }
    });

    // D2. Active Motors
    Object.entries(motorStates).forEach(([motId, state]) => {
        if (state.isSpinning) {
            const mComp = components.find(c => c.id === motId);
            if (mComp) {
                conductingNodes.add(dsu.find(getElectricalNode(mComp.x, mComp.y)));
                const rotRad = ((mComp.rotation || 0) * Math.PI) / 180;
                const pNegX = Math.round(mComp.x + 48 * Math.cos(rotRad));
                const pNegY = Math.round(mComp.y + 48 * Math.sin(rotRad));
                conductingNodes.add(dsu.find(getElectricalNode(pNegX, pNegY)));
            }
        }
    });

    // D3. Active Sensors & Modules
    Object.entries(sensorStates).forEach(([sId, state]) => {
        if (state.isPowered) {
            const comp = components.find(c => c.id === sId);
            if (comp) {
                conductingNodes.add(dsu.find(getElectricalNode(comp.x, comp.y)));
                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                const gndDist = comp.type === "sensor-pir" ? 32 : 48;
                const gndX = Math.round(comp.x + gndDist * Math.cos(rotRad));
                const gndY = Math.round(comp.y + gndDist * Math.sin(rotRad));
                conductingNodes.add(dsu.find(getElectricalNode(gndX, gndY)));
            }
        }
    });

    // D4. Active DIP Logic ICs
    Object.entries(icStates).forEach(([icId, state]) => {
        if (state.isPowered) {
            const comp = components.find(c => c.id === icId);
            if (comp) {
                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                conductingNodes.add(dsu.find(getElectricalNode(comp.x, comp.y)));
                const gndX = Math.round(comp.x + 96 * Math.cos(rotRad) - 32 * Math.sin(rotRad));
                const gndY = Math.round(comp.y + 96 * Math.sin(rotRad) + 32 * Math.cos(rotRad));
                conductingNodes.add(dsu.find(getElectricalNode(gndX, gndY)));
            }
        }
    });

    // D5. Active LCDs
    Object.entries(lcdStates).forEach(([lcdId, state]) => {
        if (state.isPowered) {
            const comp = components.find(c => c.id === lcdId);
            if (comp) {
                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                const gndX = Math.round(comp.x + 16 * Math.cos(rotRad) - (-10) * Math.sin(rotRad));
                const gndY = Math.round(comp.y + 16 * Math.sin(rotRad) + (-10) * Math.cos(rotRad));
                const vccX = Math.round(comp.x + 32 * Math.cos(rotRad) - (-10) * Math.sin(rotRad));
                const vccY = Math.round(comp.y + 32 * Math.sin(rotRad) + (-10) * Math.cos(rotRad));
                conductingNodes.add(dsu.find(getElectricalNode(gndX, gndY)));
                conductingNodes.add(dsu.find(getElectricalNode(vccX, vccY)));
            }
        }
    });

    // D6. Active Servos
    Object.entries(servoStates).forEach(([srvId, state]) => {
        if (state.isPowered) {
            const comp = components.find(c => c.id === srvId);
            if (comp) {
                const rotRad = ((comp.rotation || 0) * Math.PI) / 180;
                conductingNodes.add(dsu.find(getElectricalNode(comp.x, comp.y)));
                const pos5X = Math.round(comp.x + 16 * Math.cos(rotRad));
                const pos5Y = Math.round(comp.y + 16 * Math.sin(rotRad));
                conductingNodes.add(dsu.find(getElectricalNode(pos5X, pos5Y)));
            }
        }
    });

    // E. Resistors carrying current in series loops
    resistors.forEach(r => {
        const r1 = dsu.find(r.node1);
        const r2 = dsu.find(r.node2);
        if (conductingNodes.has(r1) || conductingNodes.has(r2)) {
            conductingNodes.add(r1);
            conductingNodes.add(r2);
        }
    });

    const wireStates = {};
    wires.forEach(w => {
        if (!w.points || w.points.length < 2) return;
        const startRoot = dsu.find(`WIRE_${w.id}_START`);
        const endRoot = dsu.find(`WIRE_${w.id}_END`);
        const isConducting = isSimulating && conductingNodes.size > 0 && 
            (conductingNodes.has(startRoot) || conductingNodes.has(endRoot));
        wireStates[w.id] = {
            hasCurrent: Boolean(isConducting)
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
        motorStates,
        sensorStates,
        icStates,
        lcdStates,
        servoStates,
        dmmStates,
        wireStates,
        mcuStates: resolvedMcuStates,
        logs: simLogs
    };
}
