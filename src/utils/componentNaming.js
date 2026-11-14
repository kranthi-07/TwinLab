// Comprehensive Component Reference Designator & Naming Engine
// Supports IEEE 315 / IPC standard reference designators (R1, LED1, C1, BAT1, etc.)
// and custom user-defined naming.

export const DESIGNATOR_PREFIXES = {
    "resistor": "R",
    "photoresistor": "LDR",
    "led": "LED",
    "capacitor-ceramic": "C",
    "capacitor-electrolytic": "C",
    "capacitor": "C",
    "battery-9v": "BAT",
    "battery-aa": "BAT",
    "battery-aaa": "BAT",
    "battery-coin": "BAT",
    "battery": "BAT",
    "button": "SW",
    "pushbutton": "SW",
    "slide-switch": "SW",
    "switch-spdt": "SW",
    "switch-spst": "SW",
    "transistor": "Q",
    "transistor-npn": "Q",
    "transistor-pnp": "Q",
    "mosfet-n": "Q",
    "lcd-1602": "LCD",
    "lcd-2004": "LCD",
    "servo-sg90": "SRV",
    "motor-dc": "M",
    "sensor-ultrasonic": "US",
    "sensor-pir": "PIR",
    "sensor-tmp36": "U",
    "sensor-soil": "SOIL",
    "potentiometer": "POT",
    "buzzer": "BZ",
    "breadboard-half": "BB",
    "breadboard-full": "BB",
    "breadboard-mini": "BB",
    "breadboard": "BB",
    "multimeter": "DMM",
    "arduino-uno": "ARD",
    "arduino-mega": "MEGA",
    "arduino-nano": "NANO",
    "esp32": "ESP",
    "esp32-devkit": "ESP",
    "esp32-s3": "ESP",
    "ic-74hc08": "U",
    "ic-74hc00": "U",
    "ic-74hc32": "U",
    "ic-74hc04": "U",
    "ic-74hc02": "U",
    "ic-74hc86": "U",
    "ic-74hc132": "U",
    "ic-l293d": "U",
    "ic-555": "U"
};

/**
 * Returns the next available designator for a component type, e.g. R1, R2, LED1, C1...
 */
export function getNextComponentDesignator(type, existingComponents = []) {
    const prefix = DESIGNATOR_PREFIXES[type] || "U";
    const regex = new RegExp(`^${prefix}(\\d+)`, "i");
    const usedNums = new Set();

    existingComponents.forEach(c => {
        // Check designator field
        if (c.designator) {
            const m = String(c.designator).trim().match(regex);
            if (m) usedNums.add(parseInt(m[1], 10));
        }
        // Check name field (e.g. "R1", "R1 (220Ω)", etc.)
        if (c.name) {
            const m = String(c.name).trim().match(regex);
            if (m) usedNums.add(parseInt(m[1], 10));
        }
    });

    let nextNum = 1;
    while (usedNums.has(nextNum)) {
        nextNum++;
    }

    return `${prefix}${nextNum}`;
}

/**
 * Generates formatted component display name with designator and parameters
 */
export function formatComponentName(type, designator, extra = {}) {
    const des = designator || getNextComponentDesignator(type);
    
    if (type === "resistor") {
        const r = extra.resistance != null ? extra.resistance : 220;
        const rStr = r >= 1000000 ? `${+(r / 1000000).toFixed(2)}MΩ` : r >= 1000 ? `${+(r / 1000).toFixed(2)}kΩ` : `${r}Ω`;
        return `${des} (${rStr})`;
    }
    if (type === "photoresistor") {
        return `${des} (LDR)`;
    }
    if (type === "transistor" || type === "transistor-npn") {
        return `${des} (2N2222)`;
    }
    if (type === "transistor-pnp") {
        return `${des} (2N3906)`;
    }
    if (type === "mosfet-n") {
        return `${des} (IRF540N)`;
    }
    if (type === "lcd-1602") {
        return `${des} (16x2 LCD)`;
    }
    if (type === "lcd-2004") {
        return `${des} (20x4 LCD)`;
    }
    if (type === "servo-sg90") {
        return `${des} (SG90 Servo)`;
    }
    if (type === "motor-dc") {
        return `${des} (DC Motor)`;
    }
    if (type === "sensor-ultrasonic") {
        return `${des} (HC-SR04)`;
    }
    if (type === "sensor-pir") {
        return `${des} (PIR Motion)`;
    }
    if (type === "sensor-tmp36") {
        return `${des} (TMP36)`;
    }
    if (type?.startsWith("ic-74hc")) {
        const num = type.replace("ic-", "").toUpperCase();
        return `${des} (${num})`;
    }
    if (type === "ic-l293d") {
        return `${des} (L293D)`;
    }
    if (type === "ic-555") {
        return `${des} (NE555)`;
    }
    if (type === "switch-spst") {
        return `${des} (SPST)`;
    }
    if (type === "battery-aa" || type === "battery-aaa") {
        const cellCount = extra.cells || 2;
        return `${des} (${cellCount}x ${type === "battery-aaa" ? "AAA" : "AA"})`;
    }
    if (type === "battery-coin") {
        return `${des} (CR2032 3V)`;
    }
    if (type === "led") {
        const colorName = extra.colorName || (extra.color === "#10b981" ? "Green" : extra.color === "#3b82f6" ? "Blue" : extra.color === "#eab308" ? "Yellow" : extra.color === "#f97316" ? "Orange" : extra.color === "#ffffff" ? "White" : "Red");
        return `${des} (${colorName})`;
    }
    if (type === "battery-9v" || type === "battery") {
        const v = extra.voltage != null ? extra.voltage : 9;
        return `${des} (${v}V)`;
    }
    if (type === "capacitor-ceramic" || type === "capacitor") {
        const cap = extra.capacitance || "100nF";
        return `${des} (${cap})`;
    }
    if (type === "potentiometer") {
        return `${des} (10kΩ)`;
    }
    if (type === "buzzer") {
        return `${des} (Buzzer)`;
    }
    if (type === "button" || type === "pushbutton") {
        return `${des} (Pushbutton)`;
    }
    if (type === "slide-switch" || type === "switch-spdt") {
        return `${des} (Switch)`;
    }
    if (type === "multimeter") {
        return `${des} (DMM)`;
    }
    if (type === "arduino-uno") {
        return `${des} (Uno R3)`;
    }
    if (type === "esp32" || type === "esp32-devkit") {
        return `${des} (NodeMCU)`;
    }
    if (type?.startsWith("breadboard")) {
        return `${des} (Breadboard)`;
    }
    return `${des}`;
}
