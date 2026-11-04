// Comprehensive Component Reference Designator & Naming Engine
// Supports IEEE 315 / IPC standard reference designators (R1, LED1, C1, BAT1, etc.)
// and custom user-defined naming.

export const DESIGNATOR_PREFIXES = {
    "resistor": "R",
    "led": "LED",
    "capacitor-ceramic": "C",
    "capacitor": "C",
    "battery-9v": "BAT",
    "battery-coin": "BAT",
    "battery": "BAT",
    "button": "SW",
    "pushbutton": "SW",
    "slide-switch": "SW",
    "switch-spdt": "SW",
    "potentiometer": "POT",
    "buzzer": "BZ",
    "breadboard-half": "BB",
    "breadboard-full": "BB",
    "breadboard-mini": "BB",
    "breadboard": "BB",
    "multimeter": "DMM",
    "arduino-uno": "ARD",
    "esp32": "ESP",
    "esp32-devkit": "ESP"
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
