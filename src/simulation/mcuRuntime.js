// Embedded MCU Firmware Execution Engine & C++ Transpiler
// Supports Arduino Uno R3 (ATmega328P) & ESP32 DevKit V1 (ESP-WROOM-32)

export const DEFAULT_SKETCHES = {
    blink: `// TwinLab X Arduino / ESP32 Blink Sketch
// Onboard LED is Pin 13 (Arduino Uno) or Pin 2 (ESP32 DevKit)

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("System Initialized: Blink Active");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED State: HIGH (ON)");
  delay(1000);

  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED State: LOW (OFF)");
  delay(1000);
}`,

    strobe: `// TwinLab X High-Speed Strobe Test (100ms)
// Fast switching test for visual responsiveness

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("High-Speed Strobe Test Running");
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(100);
  digitalWrite(LED_BUILTIN, LOW);
  delay(100);
}`,

    counter: `// TwinLab X Serial Telemetry Counter
// Prints telemetry counter to the Serial Monitor every 500ms

int counter = 0;

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Serial Telemetry Online");
}

void loop() {
  counter++;
  digitalWrite(LED_BUILTIN, counter % 2 == 0 ? HIGH : LOW);
  Serial.print("Telemetry Ping #");
  Serial.print(counter);
  Serial.println(" - System Operational");
  delay(500);
}`,

    dual_pins: `// TwinLab X Dual Alternating Outputs (Pins 13 & 12)
// Useful for flip-flop LED indicators and relay switching

void setup() {
  pinMode(13, OUTPUT);
  pinMode(12, OUTPUT);
  Serial.begin(9600);
  Serial.println("Dual Channel Phase Alternator Active");
}

void loop() {
  digitalWrite(13, HIGH);
  digitalWrite(12, LOW);
  Serial.println("Phase A: Pin 13 HIGH, Pin 12 LOW");
  delay(800);

  digitalWrite(13, LOW);
  digitalWrite(12, HIGH);
  Serial.println("Phase B: Pin 13 LOW, Pin 12 HIGH");
  delay(800);
}`,

    analog_serial: `// TwinLab X Analog Voltage Monitor (Pin A0)
// Reads sensor voltage from potentiometer / divider

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("Analog Voltage Monitor Ready (Pin A0)");
}

void loop() {
  int sensorValue = analogRead(A0);
  float voltage = sensorValue * (5.0 / 1023.0);
  
  Serial.print("Analog A0: ");
  Serial.print(sensorValue);
  Serial.print(" raw | Calculated: ");
  Serial.print(voltage);
  Serial.println(" V");
  
  digitalWrite(LED_BUILTIN, HIGH);
  delay(150);
  digitalWrite(LED_BUILTIN, LOW);
  delay(850);
}`
};

export class McuExecutionSession {
    constructor(boardId, boardType = "arduino-uno", callbacks = {}) {
        this.boardId = boardId;
        this.boardType = boardType;
        this.callbacks = callbacks; // onPinStateChange, onSerialLog, onTxPulse, onCompileError
        this.isRunning = false;
        this.runningRef = { current: false };
        this.pinStates = {}; // { 13: 1, 2: 0, ... }
        this.activeTimeouts = new Set();
        this.simStartTime = Date.now();
    }

    getBuiltinLedPin() {
        return (this.boardType === "esp32" || this.boardType === "esp32-devkit") ? 2 : 13;
    }

    stop() {
        this.isRunning = false;
        this.runningRef.current = false;
        this.activeTimeouts.forEach(t => clearTimeout(t));
        this.activeTimeouts.clear();
        this.pinStates = {};
        if (this.callbacks.onPinStateChange) {
            this.callbacks.onPinStateChange(this.boardId, this.pinStates, false, false);
        }
    }

    startDefaultBlink() {
        this.stop();
        this.isRunning = true;
        this.runningRef.current = true;
        const builtinPin = this.getBuiltinLedPin();
        let state = 0;

        const tick = () => {
            if (!this.runningRef.current) return;
            state = state ? 0 : 1;
            this.pinStates[builtinPin] = state;
            const isD13 = builtinPin === 13 ? Boolean(state) : false;
            const isD2 = builtinPin === 2 ? Boolean(state) : false;

            if (this.callbacks.onPinStateChange) {
                this.callbacks.onPinStateChange(this.boardId, { ...this.pinStates }, isD13, isD2);
            }

            const t = setTimeout(tick, 1000);
            this.activeTimeouts.add(t);
        };

        tick();
    }

    compileAndRun(sketchCode) {
        this.stop();
        this.isRunning = true;
        this.runningRef.current = true;
        this.simStartTime = Date.now();

        try {
            const builtinPin = this.getBuiltinLedPin();

            // 1. Preprocess & Transpile Arduino C++ to safe async JavaScript
            let code = sketchCode || DEFAULT_SKETCHES.blink;

            // Normalize line endings
            code = code.replace(/\r\n/g, "\n");

            // Strip single-line comments for clean regex handling
            const sanitizedCode = code
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/.*$/gm, "");

            // Transform #define NAME VALUE
            const defines = {};
            const defineRegex = /#define\s+([A-Za-z0-9_]+)\s+([^\n]+)/g;
            let defMatch;
            while ((defMatch = defineRegex.exec(sanitizedCode)) !== null) {
                defines[defMatch[1]] = defMatch[2].trim();
            }

            // Extract variable declarations outside setup/loop
            // E.g. int counter = 0; float val = 1.0;
            const globalVarLines = [];
            const varRegex = /(?:(?:const\s+)?(?:int|float|double|long|unsigned\s+int|byte|bool|boolean|char|String|auto)\s+([A-Za-z0-9_]+)(?:\s*=\s*([^;]+))?;)/g;
            let vMatch;
            while ((vMatch = varRegex.exec(sanitizedCode)) !== null) {
                const varName = vMatch[1];
                const initVal = vMatch[2] ? vMatch[2].trim() : "0";
                globalVarLines.push(`let ${varName} = ${initVal};`);
            }

            // Extract setup() body
            const setupMatch = sanitizedCode.match(/void\s+setup\s*\(\s*\)\s*\{([\s\S]*?)\}(?=\s*(?:void\s+loop|\n\s*void|$))/);
            const setupBody = setupMatch ? setupMatch[1] : "";

            // Extract loop() body
            const loopMatch = sanitizedCode.match(/void\s+loop\s*\(\s*\)\s*\{([\s\S]*?)\}(?=\s*$|\n\s*void|$)/);
            const loopBody = loopMatch ? loopMatch[1] : "";

            // Helper to clean statements inside function bodies
            const cleanBody = (bodyStr) => {
                let s = bodyStr;

                // Replace C++ types inside functions
                s = s.replace(/\b(?:const\s+)?(?:int|float|double|long|unsigned\s+int|byte|bool|boolean|char|String|auto)\s+/g, "let ");

                // Replace constants
                s = s.replace(/\bLED_BUILTIN\b/g, String(builtinPin));
                s = s.replace(/\bHIGH\b/g, "1");
                s = s.replace(/\bLOW\b/g, "0");
                s = s.replace(/\bOUTPUT\b/g, '"OUTPUT"');
                s = s.replace(/\bINPUT\b/g, '"INPUT"');
                s = s.replace(/\bINPUT_PULLUP\b/g, '"INPUT_PULLUP"');

                // Replace defines
                for (const [k, v] of Object.entries(defines)) {
                    s = s.replace(new RegExp(`\\b${k}\\b`, "g"), v);
                }

                // Replace delay(ms) with await __delay(ms)
                s = s.replace(/\bdelay\s*\(\s*([^)]+)\s*\)/g, "await __delay($1)");

                // Replace Serial.println(...) with await __serialPrintln(...)
                s = s.replace(/Serial\.println\s*\(\s*([^)]*)\s*\)/g, "await __serialPrintln($1)");

                // Replace Serial.print(...) with await __serialPrint(...)
                s = s.replace(/Serial\.print\s*\(\s*([^)]*)\s*\)/g, "await __serialPrint($1)");

                // Replace digitalWrite(...) with __digitalWrite(...)
                s = s.replace(/digitalWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "__digitalWrite($1, $2)");

                // Replace digitalRead(...) with __digitalRead(...)
                s = s.replace(/digitalRead\s*\(\s*([^)]+)\s*\)/g, "__digitalRead($1)");

                // Replace analogRead(...) with __analogRead(...)
                s = s.replace(/analogRead\s*\(\s*([^)]+)\s*\)/g, "__analogRead($1)");

                // Replace pinMode(...) with __pinMode(...)
                s = s.replace(/pinMode\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "__pinMode($1, $2)");

                // Replace Serial.begin(...) with __serialBegin(...)
                s = s.replace(/Serial\.begin\s*\(\s*([^)]+)\s*\)/g, "__serialBegin($1)");

                return s;
            };

            const transformedSetup = cleanBody(setupBody);
            const transformedLoop = cleanBody(loopBody);

            // Construct sandbox execution function
            const runtimeRunner = new Function(
                "__context",
                `
                return (async function() {
                    const {
                        __delay,
                        __digitalWrite,
                        __digitalRead,
                        __analogRead,
                        __pinMode,
                        __serialBegin,
                        __serialPrint,
                        __serialPrintln,
                        __runningRef,
                        millis,
                        A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15
                    } = __context;

                    ${globalVarLines.join("\n")}

                    async function setup() {
                        ${transformedSetup}
                    }

                    async function loop() {
                        ${transformedLoop}
                    }

                    // Execute setup once
                    await setup();

                    // Repeatedly loop until cancelled
                    while (__runningRef.current) {
                        await loop();
                        await __delay(10); // cooperative yield to keep 60fps UI
                    }
                })();
                `
            );

            // Context APIs exposed to the sketch
            const context = {
                __delay: (ms) => {
                    const duration = Math.max(1, Number(ms) || 0);
                    return new Promise((resolve) => {
                        const t = setTimeout(() => {
                            this.activeTimeouts.delete(t);
                            resolve();
                        }, duration);
                        this.activeTimeouts.add(t);
                    });
                },
                __digitalWrite: (pin, val) => {
                    const p = String(pin).trim();
                    const v = val === 1 || val === "1" || val === true ? 1 : 0;
                    this.pinStates[p] = v;

                    const isD13 = this.pinStates["13"] === 1;
                    const isD2 = this.pinStates["2"] === 1;

                    if (this.callbacks.onPinStateChange) {
                        this.callbacks.onPinStateChange(this.boardId, { ...this.pinStates }, isD13, isD2);
                    }
                },
                __digitalRead: (pin) => {
                    return this.pinStates[String(pin).trim()] || 0;
                },
                __analogRead: (pin) => {
                    // Simulates analog readings (e.g. 512 mid-rail or 1023 if connected)
                    return 512;
                },
                __pinMode: (pin, mode) => {
                    // Recorded for reference
                },
                __serialBegin: (baud) => {
                    const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                    if (this.callbacks.onSerialLog) {
                        this.callbacks.onSerialLog({
                            time: `${elapsed}s`,
                            type: "serial",
                            text: `[UART] Serial interface opened at ${baud} baud`
                        });
                    }
                },
                __serialPrint: (msg) => {
                    const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                    if (this.callbacks.onSerialLog) {
                        this.callbacks.onSerialLog({
                            time: `${elapsed}s`,
                            type: "serial",
                            text: String(msg != null ? msg : "")
                        });
                    }
                    if (this.callbacks.onTxPulse) this.callbacks.onTxPulse();
                },
                __serialPrintln: (msg) => {
                    const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                    if (this.callbacks.onSerialLog) {
                        this.callbacks.onSerialLog({
                            time: `${elapsed}s`,
                            type: "serial",
                            text: String(msg != null ? msg : "")
                        });
                    }
                    if (this.callbacks.onTxPulse) this.callbacks.onTxPulse();
                },
                __runningRef: this.runningRef,
                millis: () => Date.now() - this.simStartTime,
                A0: "A0", A1: "A1", A2: "A2", A3: "A3", A4: "A4", A5: "A5",
                A6: "A6", A7: "A7", A8: "A8", A9: "A9", A10: "A10",
                A11: "A11", A12: "A12", A13: "A13", A14: "A14", A15: "A15"
            };

            // Launch execution
            runtimeRunner(context).catch((err) => {
                if (this.runningRef.current) {
                    console.warn("MCU Runtime execution stopped:", err.message);
                    if (this.callbacks.onSerialLog) {
                        this.callbacks.onSerialLog({
                            time: "ERR",
                            type: "warn",
                            text: `Runtime exception: ${err.message}`
                        });
                    }
                }
            });

            return { success: true, message: "Sketch compiled & uploaded successfully!" };

        } catch (compileErr) {
            console.error("Compilation error in sketch:", compileErr);
            if (this.callbacks.onCompileError) {
                this.callbacks.onCompileError(compileErr.message);
            }
            if (this.callbacks.onSerialLog) {
                this.callbacks.onSerialLog({
                    time: "ERR",
                    type: "warn",
                    text: `Compilation error: ${compileErr.message}`
                });
            }
            // Fall back to default blink so hardware doesn't freeze
            this.startDefaultBlink();
            return { success: false, error: compileErr.message };
        }
    }
}
