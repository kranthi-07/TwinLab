import { ARDUINO_PINS, ARDUINO_MEGA_PINS, ARDUINO_NANO_PINS, ESP32_PINS, RPI_PICO_PINS } from "../components/workspace/components/mcuPins.js";

/**
 * Returns precise world-space coordinates for all terminals/pins of ANY component.
 * Compatible with both Canvas (placement/snapping/rotation) and Circuit Solver (physics/DSU).
 */
export function getComponentTerminalPoints(c) {
    if (!c) return [];
    const rotRad = ((c.rotation || 0) * Math.PI) / 180;
    const cos = Math.cos(rotRad);
    const sin = Math.sin(rotRad);
    const toWorld = (lx, ly, term = "") => ({
        x: Math.round(c.x + lx * cos - ly * sin),
        y: Math.round(c.y + lx * sin + ly * cos),
        term,
        compId: c.id
    });

    const pts = [];

    // 1. Batteries (9V, AA packs, AAA packs, Coin Cells)
    if (c.type === "battery-9v" || c.type === "battery") {
        pts.push(toWorld(24, -14, "batNeg"), toWorld(72, -14, "batPos"));
    } else if (c.type === "battery-aa" || c.type === "battery-aaa") {
        const cellCount = c.cells || (c.voltage === 1.5 ? 1 : c.voltage === 6 ? 4 : c.voltage === 4.5 ? 3 : 2);
        const totalWidth = cellCount === 1 ? 64 : cellCount === 4 ? 176 : cellCount === 3 ? 140 : 96;
        const posLeadX = totalWidth - 20;
        pts.push(toWorld(20, -14, "batNeg"), toWorld(posLeadX, -14, "batPos"));
    } else if (c.type === "battery-coin") {
        pts.push(toWorld(16, 32, "batNeg"), toWorld(48, 32, "batPos"));
    }
    // 2. LED (Anode at (0, 0) and Cathode at (16, 0))
    else if (c.type === "led") {
        pts.push(toWorld(0, 0, "anode"), toWorld(16, 0, "cathode"));
    }
    // 3. Axial Resistor (0,0 and 64,0)
    else if (c.type === "resistor") {
        pts.push(toWorld(0, 0, "r1"), toWorld(64, 0, "r2"));
    }
    // 4. Ceramic Capacitor
    else if (c.type === "capacitor-ceramic" || c.type === "capacitor") {
        pts.push(toWorld(0, 0, "c1"), toWorld(16, 0, "c2"), toWorld(0, 16, "c1_alt"), toWorld(16, 16, "c2_alt"));
    }
    // 5. Electrolytic Capacitor (Anode 0,0 and Cathode 16,0)
    else if (c.type === "capacitor-electrolytic" || c.type === "capacitor-elec") {
        pts.push(toWorld(0, 0, "anode"), toWorld(16, 0, "cathode"));
    }
    // 6. Pushbutton (0,0, 32,0, 0,32, 32,32)
    else if (c.type === "button" || c.type === "pushbutton") {
        pts.push(toWorld(0, 0, "btn1"), toWorld(32, 0, "btn2"), toWorld(0, 32, "btn3"), toWorld(32, 32, "btn4"));
    }
    // 7. Potentiometer (0,48, 16,48, 32,48)
    else if (c.type === "potentiometer") {
        pts.push(toWorld(0, 48, "t1"), toWorld(16, 48, "wiper"), toWorld(32, 48, "t2"));
    }
    // 8. Slide Switch & SPDT Switch (0,16, 16,16, 32,16)
    else if (c.type === "slide-switch" || c.type === "switch-slide" || c.type === "switch-spdt") {
        pts.push(toWorld(0, 16, "sw1"), toWorld(16, 16, "com"), toWorld(32, 16, "sw2"));
    }
    // 9. SPST Toggle Switch (0,16 and 32,16)
    else if (c.type === "switch-spst") {
        pts.push(toWorld(0, 16, "sw1"), toWorld(32, 16, "sw2"));
    }
    // 10. Buzzer (0,32 and 16,32)
    else if (c.type === "buzzer") {
        pts.push(toWorld(0, 32, "pos"), toWorld(16, 32, "neg"));
    }
    // 11. Photoresistor / LDR (0,16 and 32,16)
    else if (c.type === "photoresistor" || c.type === "ldr") {
        pts.push(toWorld(0, 16, "ldr1"), toWorld(32, 16, "ldr2"));
    }
    // 12. NPN / PNP Transistors (0,0, 16,0, 32,0)
    else if (c.type === "transistor" || c.type === "transistor-npn" || c.type === "transistor-pnp") {
        pts.push(toWorld(0, 0, "trE"), toWorld(16, 0, "trB"), toWorld(32, 0, "trC"));
    }
    // 13. Power MOSFET TO-220 (0,0, 16,0, 32,0)
    else if (c.type === "mosfet-n" || c.type === "mosfet-p" || c.type === "mosfet") {
        pts.push(toWorld(0, 0, "mosG"), toWorld(16, 0, "mosD"), toWorld(32, 0, "mosS"));
    }
    // 14. TMP36 Precision Temperature Sensor (0,0, 16,0, 32,0)
    else if (c.type === "sensor-temp" || c.type === "sensor-temperature" || c.type === "sensor-tmp36") {
        pts.push(toWorld(0, 0, "tmpVcc"), toWorld(16, 0, "tmpVout"), toWorld(32, 0, "tmpGnd"));
    }
    // 15. Soil Moisture Sensor (VCC 0,0, GND 16,0, SIG 32,0)
    else if (c.type === "sensor-soil" || c.type === "sensor-soil-moisture") {
        pts.push(toWorld(0, 0, "soil_vcc"), toWorld(16, 0, "soil_gnd"), toWorld(32, 0, "soil_sig"));
    }
    // 16. DC Hobby Motor & Yellow Geared BO Motor (Pos: 0,0, Neg: 48,0, plus alternate pins 16,-6, 32,-6)
    else if (c.type === "motor-dc" || c.type === "motor-geared" || c.type === "motor-bo") {
        pts.push(toWorld(0, 0, "motPos"), toWorld(48, 0, "motNeg"), toWorld(16, -6, "motPosAlt"), toWorld(32, -6, "motNegAlt"));
    }
    // 17. Micro Servo SG90 (GND: 0,0, 5V: 16,0, PWM: 32,0)
    else if (c.type === "servo-sg90" || c.type === "servo") {
        pts.push(toWorld(0, 0, "srvGnd"), toWorld(16, 0, "srv5V"), toWorld(32, 0, "srvSig"));
    }
    // 18. HC-SR04 Ultrasonic Distance Sensor (VCC: 0,0, Trig: 16,0, Echo: 32,0, GND: 48,0)
    else if (c.type === "sensor-ultrasonic" || c.type === "ultrasonic" || c.type === "sonar") {
        pts.push(toWorld(0, 0, "snrVcc"), toWorld(16, 0, "snrTrig"), toWorld(32, 0, "snrEcho"), toWorld(48, 0, "snrGnd"));
    }
    // 19. PIR Motion Sensor (VCC: 0,0, OUT: 16,0, GND: 32,0)
    else if (c.type === "sensor-pir" || c.type === "pir") {
        pts.push(toWorld(0, 0, "pirVcc"), toWorld(16, 0, "pirOut"), toWorld(32, 0, "pirGnd"));
    }
    // 20. 16x2 / 20x4 Character LCD
    else if (c.type === "lcd-1602" || c.type === "lcd-2004" || c.type === "lcd") {
        for (let i = 0; i < 16; i++) {
            pts.push(toWorld(24 + i * 16, 0, `lcd_pin_${i + 1}`));
        }
        pts.push(toWorld(16, -10, "lcd_1"), toWorld(32, -10, "lcd_2"), toWorld(48, -10, "lcd_3"), toWorld(64, -10, "lcd_4"));
    }
    // 21. DIP Logic ICs (Dual-in-line 14/16 pins: top row at Y=0, bot row at Y=32)
    else if (c.type?.startsWith("ic-")) {
        const is16 = c.type === "ic-l293d" || (c.modelNumber || "").includes("L293") || (c.name || "").includes("L293");
        const dipCols = is16 ? [0, 16, 32, 48, 64, 80, 96, 112] : [0, 16, 32, 48, 64, 80, 96];
        dipCols.forEach((px, idx) => {
            const topPin = is16 ? (16 - idx) : (14 - idx);
            const botPin = idx + 1;
            pts.push(toWorld(px, 0, `ic_${topPin}`));
            pts.push(toWorld(px, 32, `ic_${botPin}`));
        });
    }
    // 22. Arduino Uno R3 Header Pins
    else if (c.type === "arduino-uno") {
        const allArdPins = [
            ...(ARDUINO_PINS?.digitalHigh || []),
            ...(ARDUINO_PINS?.digitalLow || []),
            ...(ARDUINO_PINS?.power || []),
            ...(ARDUINO_PINS?.analog || [])
        ];
        allArdPins.forEach(p => pts.push(toWorld(p.x, p.y, `ard_${p.name}`)));
    }
    // 23. Arduino Mega 2560 Header Pins
    else if (c.type === "arduino-mega") {
        const allMegaPins = [
            ...(ARDUINO_MEGA_PINS?.digitalHigh || []),
            ...(ARDUINO_MEGA_PINS?.digitalLow || []),
            ...(ARDUINO_MEGA_PINS?.communication || []),
            ...(ARDUINO_MEGA_PINS?.power || []),
            ...(ARDUINO_MEGA_PINS?.analog || []),
            ...(ARDUINO_MEGA_PINS?.dualDigital || [])
        ];
        allMegaPins.forEach(p => pts.push(toWorld(p.x, p.y, `mega_${p.name}`)));
    }
    // 24. Arduino Nano Header Pins
    else if (c.type === "arduino-nano") {
        const allNanoPins = [
            ...(ARDUINO_NANO_PINS?.topRow || []),
            ...(ARDUINO_NANO_PINS?.botRow || [])
        ];
        allNanoPins.forEach(p => pts.push(toWorld(p.x, p.y, `nano_${p.name}`)));
    }
    // 25. ESP32 DevKit Header Pins
    else if (c.type === "esp32" || c.type === "esp32-devkit" || c.type === "esp32-s3") {
        const allEspPins = [
            ...(ESP32_PINS?.leftCol || []),
            ...(ESP32_PINS?.rightCol || [])
        ];
        allEspPins.forEach(p => pts.push(toWorld(p.x, p.y, `esp_${p.name}`)));
    }
    // 26. Raspberry Pi Pico Header Pins
    else if (c.type === "rpi-pico" || c.type === "raspberry-pi" || c.type === "rpi-pico-2") {
        const allPicoPins = [
            ...(RPI_PICO_PINS?.leftCol || []),
            ...(RPI_PICO_PINS?.rightCol || [])
        ];
        allPicoPins.forEach(p => pts.push(toWorld(p.x, p.y, `pico_${p.name}`)));
    }
    // 27. Multimeter Probes
    else if (c.type === "multimeter") {
        const pRed = c.probeRed || { x: c.x + 160, y: c.y + 48 };
        const pBlack = c.probeBlack || { x: c.x + 160, y: c.y + 112 };
        pts.push(
            { x: pRed.x, y: pRed.y, term: "dmmRed", compId: c.id },
            { x: pBlack.x, y: pBlack.y, term: "dmmBlack", compId: c.id }
        );
    }

    if (pts.length === 0) {
        pts.push({ x: c.x, y: c.y, term: "origin", compId: c.id });
    }

    return pts;
}
