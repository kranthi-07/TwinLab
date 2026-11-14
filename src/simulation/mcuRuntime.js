// Embedded MCU Firmware Execution Engine & C++ Transpiler
// Supports Arduino Uno R3 (ATmega328P) & ESP32 DevKit V1 (ESP-WROOM-32)
import { soundManager } from "../utils/audioManager";

export const DEFAULT_SKETCHES = {
    blank: `// Clean Empty Arduino Sketch\nvoid setup() {\n  // put your setup code here, to run once:\n\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n\n}`,

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
}`,

    ultrasonic: `// HC-SR04 Ultrasonic Distance Sensor Demo
// TRIG -> Pin 9, ECHO -> Pin 10
#define TRIG_PIN 9
#define ECHO_PIN 10

void setup() {
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("HC-SR04 Sonar Radar Active");
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH);
  long distance = duration * 0.034 / 2;

  Serial.print("Target Distance: ");
  Serial.print(distance);
  Serial.println(" cm");

  if (distance < 20) {
    digitalWrite(LED_BUILTIN, HIGH);
  } else {
    digitalWrite(LED_BUILTIN, LOW);
  }
  delay(300);
}`,

    pir: `// HC-SR501 PIR Motion Sensor Alarm
// OUT -> Pin 2
#define PIR_PIN 2

void setup() {
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("PIR Motion Security System Armed");
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  if (motion == HIGH) {
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("🚨 MOTION DETECTED! Sensor OUT is HIGH");
  } else {
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("Zone Clear • Standby Scanning");
  }
  delay(500);
}`,

    servo: `// SG90 Micro Servo 0°-180° Sweep
// PWM Signal -> Pin 9
#include <Servo.h>

Servo myservo;

void setup() {
  myservo.attach(9);
  Serial.begin(9600);
  Serial.println("SG90 Micro Servo Sweep Initialized");
}

void loop() {
  for (int pos = 0; pos <= 180; pos += 30) {
    myservo.write(pos);
    Serial.print("Servo Horn Position: ");
    Serial.println(pos);
    delay(200);
  }
  for (int pos = 180; pos >= 0; pos -= 30) {
    myservo.write(pos);
    Serial.print("Servo Horn Position: ");
    Serial.println(pos);
    delay(200);
  }
}`,

    lcd: `// TwinLab X 16x2 / 20x4 I2C Character LCD
// SDA -> Pin A4, SCL -> Pin A5, VCC -> 5V, GND -> GND
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

int counter = 0;

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("TwinLab X 1602");
  lcd.setCursor(0, 1);
  lcd.print("Counter: 0");
  Serial.begin(9600);
  Serial.println("LCD I2C Display Initialized (0x27)");
}

void loop() {
  delay(1000);
  counter++;
  lcd.setCursor(9, 1);
  lcd.print(counter);
  lcd.print("   ");
  Serial.print("LCD Telemetry Value: ");
  Serial.println(counter);
}`,

    pico_c_blink: `// Raspberry Pi Pico C++ (Arduino) Blink
// Built-in LED on GP25

void setup() {
  pinMode(25, OUTPUT);
  Serial.begin(115200);
  Serial.println("Raspberry Pi Pico (C++) Ready!");
}

void loop() {
  digitalWrite(25, HIGH);
  Serial.println("GP25 LED: ON");
  delay(500);

  digitalWrite(25, LOW);
  Serial.println("GP25 LED: OFF");
  delay(500);
}`,

    pico_py_blink: `# Raspberry Pi Pico MicroPython Blink
from machine import Pin
import time

# Built-in LED on GP25
led = Pin(25, Pin.OUT)
print("Raspberry Pi Pico MicroPython Ready!")

while True:
    led.value(1)
    print("GP25 LED: ON")
    time.sleep(0.5)

    led.value(0)
    print("GP25 LED: OFF")
    time.sleep(0.5)
`,

    pico_py_ultrasonic: `# Raspberry Pi Pico MicroPython Ultrasonic Sonar
from machine import Pin, time_pulse_us
import time

trig = Pin(9, Pin.OUT)
echo = Pin(10, Pin.IN)
print("Pico Ultrasonic Sensor Active")

while True:
    trig.value(0)
    time.sleep_us(2)
    trig.value(1)
    time.sleep_us(10)
    trig.value(0)

    duration = time_pulse_us(echo, 1, 30000)
    distance = (duration * 0.034) / 2
    print("Distance:", distance, "cm")
    time.sleep(0.2)
`,

    pico_cpp_ultrasonic_lcd: `// Raspberry Pi Pico + HC-SR04 + 16x2 LCD
#include <LiquidCrystal.h>

LiquidCrystal lcd(12, 11, 5, 4, 3, 2);
const int trigPin = 9;
const int echoPin = 10;

void setup() {
  lcd.begin(16, 2);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  lcd.setCursor(0, 0);
  lcd.print("Distance:");
  Serial.begin(115200);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distanceCm = duration * 0.034 / 2.0;

  lcd.setCursor(0, 1);
  lcd.print(distanceCm, 1);
  lcd.print(" cm      ");

  delay(200);
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
        if (this.boardType?.includes("pico") || this.boardType === "raspberry-pi") return 25;
        return (this.boardType === "esp32" || this.boardType === "esp32-devkit" || this.boardType === "esp32-s3") ? 2 : 13;
    }

    stop() {
        this.isRunning = false;
        this.runningRef.current = false;
        this.activeTimeouts.forEach(t => clearTimeout(t));
        this.activeTimeouts.clear();
        this.pinStates = {};
        if (this.callbacks.onPinStateChange) {
            this.callbacks.onPinStateChange(this.boardId, this.pinStates, false, false, false);
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
            const isGP25 = builtinPin === 25 ? Boolean(state) : false;

            if (this.callbacks.onPinStateChange) {
                this.callbacks.onPinStateChange(this.boardId, { ...this.pinStates }, isD13, isD2, isGP25);
            }

            const t = setTimeout(tick, 1000);
            this.activeTimeouts.add(t);
        };

        tick();
    }

    transpilePython(pyCode, builtinPin) {
        const rawLines = pyCode.split("\n");
        const jsLines = [];
        const indentStack = [0];
        const declaredVars = new Set([
            "Pin", "time", "sleep", "sleep_ms", "sleep_us", "time_pulse_us", "I2cLcd", "machine", "print", "true", "false", "null"
        ]);

        for (let line of rawLines) {
            let stripped = line;
            let inQuote = false;
            let quoteChar = "";
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if ((ch === '"' || ch === "'") && (i === 0 || line[i - 1] !== "\\")) {
                    if (!inQuote) { inQuote = true; quoteChar = ch; }
                    else if (quoteChar === ch) { inQuote = false; }
                } else if (ch === "#" && !inQuote) {
                    stripped = line.substring(0, i);
                    break;
                }
            }

            const trimmed = stripped.trim();
            if (!trimmed) continue;

            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1].length : 0;

            while (indentStack.length > 1 && indent < indentStack[indentStack.length - 1]) {
                indentStack.pop();
                jsLines.push(" ".repeat(indentStack[indentStack.length - 1]) + "}");
            }

            let stmt = trimmed;
            let isBlock = false;
            if (stmt.endsWith(":")) {
                isBlock = true;
                stmt = stmt.slice(0, -1).trim();
            }

            // Skip pure python imports
            if (/^(?:from\s+[\w.]+\s+)?import\s+/.test(stmt)) {
                continue;
            }

            if (stmt === "while True") {
                stmt = "while (__runningRef.current)";
            } else if (stmt.startsWith("while ")) {
                const cond = stmt.substring(6).trim();
                stmt = `while (__runningRef.current && (${this.transformPyExpr(cond)}))`;
            } else if (stmt.startsWith("if ")) {
                stmt = `if (${this.transformPyExpr(stmt.substring(3).trim())})`;
            } else if (stmt.startsWith("elif ")) {
                stmt = `else if (${this.transformPyExpr(stmt.substring(5).trim())})`;
            } else if (stmt === "else") {
                stmt = "else";
            } else if (stmt.startsWith("for ") && stmt.includes(" in range(")) {
                const m = stmt.match(/for\s+([A-Za-z0-9_]+)\s+in\s+range\(([^)]+)\)/);
                if (m) {
                    const varName = m[1];
                    declaredVars.add(varName);
                    const parts = m[2].split(",").map(p => this.transformPyExpr(p.trim()));
                    if (parts.length === 1) {
                        stmt = `for (let ${varName} = 0; ${varName} < (${parts[0]}); ${varName}++)`;
                    } else {
                        stmt = `for (let ${varName} = (${parts[0]}); ${varName} < (${parts[1]}); ${varName} += (${parts[2] || 1}))`;
                    }
                }
            } else if (stmt.startsWith("def ")) {
                const fnMatch = stmt.match(/def\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/);
                if (fnMatch) {
                    declaredVars.add(fnMatch[1]);
                    stmt = `async function ${fnMatch[1]}(${fnMatch[2]})`;
                }
            } else {
                const assignMatch = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
                if (assignMatch) {
                    const varName = assignMatch[1];
                    const expr = this.transformPyExpr(assignMatch[2]);
                    if (!declaredVars.has(varName)) {
                        declaredVars.add(varName);
                        stmt = `let ${varName} = ${expr}`;
                    } else {
                        stmt = `${varName} = ${expr}`;
                    }
                } else {
                    stmt = this.transformPyExpr(stmt);
                }
            }

            if (isBlock) {
                jsLines.push(" ".repeat(indent) + stmt + " {");
                indentStack.push(indent + 4);
                if (stmt.startsWith("while ")) {
                    jsLines.push(" ".repeat(indent + 4) + "await __delay(5);");
                }
            } else {
                jsLines.push(" ".repeat(indent) + stmt + ";");
            }
        }

        while (indentStack.length > 1) {
            indentStack.pop();
            jsLines.push(" ".repeat(indentStack[indentStack.length - 1]) + "}");
        }

        return jsLines.join("\n");
    }

    transformPyExpr(expr) {
        let s = expr;
        s = s.replace(/\bTrue\b/g, "true");
        s = s.replace(/\bFalse\b/g, "false");
        s = s.replace(/\bNone\b/g, "null");
        s = s.replace(/\band\b/g, "&&");
        s = s.replace(/\bor\b/g, "||");
        s = s.replace(/\bnot\b/g, "!");

        // Pin instantiation: Pin(...) -> new Pin(...)
        s = s.replace(/\bPin\s*\(/g, "new Pin(");
        s = s.replace(/\bI2cLcd\s*\(/g, "new I2cLcd(");

        // Sleep calls
        s = s.replace(/\btime\.sleep\s*\(\s*([^)]+)\s*\)/g, "await time.sleep($1)");
        s = s.replace(/\btime\.sleep_ms\s*\(\s*([^)]+)\s*\)/g, "await time.sleep_ms($1)");
        s = s.replace(/\btime\.sleep_us\s*\(\s*([^)]+)\s*\)/g, "await time.sleep_us($1)");
        s = s.replace(/\bsleep\s*\(\s*([^)]+)\s*\)/g, "await sleep($1)");
        s = s.replace(/\bsleep_ms\s*\(\s*([^)]+)\s*\)/g, "await sleep_ms($1)");
        s = s.replace(/\bsleep_us\s*\(\s*([^)]+)\s*\)/g, "await sleep_us($1)");

        // Ultrasonic pulse
        s = s.replace(/\btime_pulse_us\s*\(\s*([^)]+)\s*\)/g, "await time_pulse_us($1)");

        // Print
        s = s.replace(/\bprint\s*\(\s*([^)]*)\s*\)/g, "await print($1)");

        // Python f-strings
        s = s.replace(/\bf"(.*?)"/g, (m, content) => {
            const parts = content.replace(/\{([^}]+)\}/g, '" + ($1) + "');
            return `"${parts}"`.replace(/"" \+ /g, "").replace(/ \+ ""/g, "");
        });

        return s;
    }

    compileAndRun(sketchCode) {
        this.stop();
        this.isRunning = true;
        this.runningRef.current = true;
        this.simStartTime = Date.now();

        try {
            const builtinPin = this.getBuiltinLedPin();

            let code = sketchCode != null ? String(sketchCode) : "";
            code = code.replace(/\r\n/g, "\n");

            // Check if code is MicroPython / Python
            const isPythonCode = (
                /^\s*(?:import\s+|from\s+|def\s+|while\s+True\s*:|led\s*=\s*Pin\b|#)/m.test(code) ||
                code.includes("from machine import") ||
                code.includes("import machine") ||
                code.includes("import time") ||
                code.includes("time_pulse_us") ||
                code.includes("Pin.OUT") ||
                code.includes("Pin.IN")
            ) && !code.includes("void setup") && !code.includes("void loop");

            if (isPythonCode) {
                const strippedPy = code.replace(/#.*$/gm, "").replace(/\s+/g, "");
                if (!strippedPy) return;

                const transpiledPyJs = this.transpilePython(code, builtinPin);
                const pyRunner = new Function(
                    "__context",
                    `
                    return (async function() {
                        const {
                            __delay,
                            __delayMicroseconds,
                            __pulseIn,
                            __digitalWrite,
                            __digitalRead,
                            __analogWrite,
                            __analogRead,
                            __pinMode,
                            __serialPrint,
                            __serialPrintln,
                            __runningRef,
                            Pin,
                            time,
                            sleep,
                            sleep_ms,
                            sleep_us,
                            time_pulse_us,
                            I2cLcd,
                            machine,
                            print
                        } = __context;

                        ${transpiledPyJs}
                    })();
                    `
                );

                const pyContext = this.createExecutionContext(builtinPin);
                pyRunner(pyContext).catch((err) => {
                    if (this.runningRef.current) {
                        console.warn("Python execution exception:", err.message);
                        if (this.callbacks.onSerialLog) {
                            this.callbacks.onSerialLog({
                                time: "ERR",
                                type: "warn",
                                text: `MicroPython error: ${err.message}`
                            });
                        }
                    }
                });

                return { success: true, message: "MicroPython script running!" };
            }

            // Normalize line endings
            code = code.replace(/\r\n/g, "\n");

            // Strip include directives and comments for clean transpilation
            const sanitizedCode = code
                .replace(/#include\s*<[^>]+>/g, "")
                .replace(/\/\*[\s\S]*?\*\//g, "")
                .replace(/\/\/.*$/gm, "")
                .trim();

            // If empty sketch or blank template with no instructions, stay in quiet standby
            const strippedBody = sanitizedCode.replace(/\s+/g, "");
            if (!sanitizedCode || strippedBody === "" || strippedBody === "voidsetup(){}voidloop(){}") {
                return;
            }

            // Transform #define NAME VALUE
            const defines = {};
            const defineRegex = /#define\s+([A-Za-z0-9_]+)\s+([^\n]+)/g;
            let defMatch;
            while ((defMatch = defineRegex.exec(sanitizedCode)) !== null) {
                defines[defMatch[1]] = defMatch[2].trim();
            }

            // Helper function to extract function bodies matching balanced braces { ... }
            const extractFunctionBody = (source, fnName) => {
                const regex = new RegExp(`(?:void|int|bool)\\s+${fnName}\\s*\\([^)]*\\)\\s*\\{`, "i");
                const match = regex.exec(source);
                if (!match) return { body: "", full: "" };

                const startIndex = match.index + match[0].length;
                let braceCount = 1;
                let i = startIndex;

                while (i < source.length && braceCount > 0) {
                    if (source[i] === '{') braceCount++;
                    else if (source[i] === '}') braceCount--;
                    i++;
                }

                const body = source.substring(startIndex, i - 1);
                const full = source.substring(match.index, i);
                return { body, full };
            };

            const setupInfo = extractFunctionBody(sanitizedCode, "setup");
            const loopInfo = extractFunctionBody(sanitizedCode, "loop");
            const setupBody = setupInfo.body;
            const loopBody = loopInfo.body;

            // Strip setup() and loop() to parse ONLY global variables outside functions
            let outsideCode = sanitizedCode;
            if (setupInfo.full) outsideCode = outsideCode.replace(setupInfo.full, "");
            if (loopInfo.full) outsideCode = outsideCode.replace(loopInfo.full, "");

            // Extract variable declarations outside setup/loop
            // E.g. int counter = 0; float val = 1.0; const int trigPin = 9;
            const globalVarLines = [];
            const varRegex = /(?:(?:const\s+)?(?:int|float|double|long|unsigned\s+int|byte|bool|boolean|char|String|auto)\s+([A-Za-z0-9_]+)(?:\s*=\s*([^;]+))?;)/g;
            let vMatch;
            while ((vMatch = varRegex.exec(outsideCode)) !== null) {
                const varName = vMatch[1];
                const initVal = vMatch[2] ? vMatch[2].trim() : "0";
                globalVarLines.push(`let ${varName} = ${initVal};`);
            }

            // Extract global Servo instances
            const servoRegex = /\bServo\s+([A-Za-z0-9_]+)\s*;/g;
            let srvMatch;
            while ((srvMatch = servoRegex.exec(outsideCode)) !== null) {
                globalVarLines.push(`let ${srvMatch[1]} = new __Servo();`);
            }

            // Extract global LiquidCrystal & LiquidCrystal_I2C instances
            const lcdRegex = /\b(?:LiquidCrystal_I2C|LiquidCrystal)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*;/g;
            let lcdMatch;
            while ((lcdMatch = lcdRegex.exec(outsideCode)) !== null) {
                const varName = lcdMatch[1];
                const args = lcdMatch[2] ? lcdMatch[2].trim() : "0x27, 16, 2";
                globalVarLines.push(`let ${varName} = new __LiquidCrystal(${args});`);
            }

            // Helper to clean statements inside function bodies
            const cleanBody = (bodyStr) => {
                let s = bodyStr;

                // Replace C++ types inside functions
                s = s.replace(/\b(?:const\s+)?(?:int|float|double|long|unsigned\s+int|byte|bool|boolean|char|String|auto)\s+/g, "let ");
                s = s.replace(/\bServo\s+([A-Za-z0-9_]+)\s*;/g, "let $1 = new __Servo();");
                s = s.replace(/\b(?:LiquidCrystal_I2C|LiquidCrystal)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*;/g, "let $1 = new __LiquidCrystal($2);");

                // Replace constants
                s = s.replace(/\bLED_BUILTIN\b/g, String(builtinPin));
                s = s.replace(/\bHIGH\b/g, "1");
                s = s.replace(/\bLOW\b/g, "0");
                s = s.replace(/\bOUTPUT\b/g, '"OUTPUT"');
                s = s.replace(/\bINPUT\b/g, '"INPUT"');
                s = s.replace(/\bINPUT_PULLUP\b/g, '"INPUT_PULLUP"');

                // Replace GP0..GP28 pins (Raspberry Pi Pico) e.g. GP25 -> 25
                s = s.replace(/\bGP([0-9]|1[0-9]|2[0-8])\b/gi, "$1");

                // Replace defines
                for (const [k, v] of Object.entries(defines)) {
                    s = s.replace(new RegExp(`\\b${k}\\b`, "g"), v);
                }

                // Replace delay(ms) with await __delay(ms)
                s = s.replace(/\bdelay\s*\(\s*([^)]+)\s*\)/g, "await __delay($1)");
                s = s.replace(/\bdelayMicroseconds\s*\(\s*([^)]+)\s*\)/g, "await __delayMicroseconds($1)");

                // Replace pulseIn(...) with await __pulseIn(...)
                s = s.replace(/\bpulseIn\s*\(\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/g, (match, p1, p2, p3) => {
                    return p3 && p3.trim() ? `await __pulseIn(${p1}, ${p2}, ${p3})` : `await __pulseIn(${p1}, ${p2})`;
                });

                // Replace Serial.println(...) with await __serialPrintln(...)
                s = s.replace(/Serial\.println\s*\(\s*([^)]*)\s*\)/g, "await __serialPrintln($1)");

                // Replace Serial.print(...) with await __serialPrint(...)
                s = s.replace(/Serial\.print\s*\(\s*([^)]*)\s*\)/g, "await __serialPrint($1)");

                // Replace digitalWrite(...) with __digitalWrite(...)
                s = s.replace(/digitalWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "__digitalWrite($1, $2)");

                // Replace digitalRead(...) with __digitalRead(...)
                s = s.replace(/digitalRead\s*\(\s*([^)]+)\s*\)/g, "__digitalRead($1)");

                // Replace analogWrite(...) with __analogWrite(...)
                s = s.replace(/analogWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g, "__analogWrite($1, $2)");

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
                        __delayMicroseconds,
                        __pulseIn,
                        __analogWrite,
                        __Servo,
                        __LiquidCrystal,
                        __digitalWrite,
                        __digitalRead,
                        __analogRead,
                        __pinMode,
                        __serialBegin,
                        __serialPrint,
                        __serialPrintln,
                        __runningRef,
                        millis,
                        A0, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15,
                        GP0, GP1, GP2, GP3, GP4, GP5, GP6, GP7, GP8, GP9, GP10, GP11, GP12, GP13, GP14, GP15, GP16, GP17, GP18, GP19, GP20, GP21, GP22, GP23, GP24, GP25, GP26, GP27, GP28
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
                __delayMicroseconds: (us) => {
                    const duration = Math.max(1, Math.round((Number(us) || 1) / 500));
                    return new Promise((resolve) => {
                        const t = setTimeout(() => {
                            this.activeTimeouts.delete(t);
                            resolve();
                        }, duration);
                        this.activeTimeouts.add(t);
                    });
                },
                __pulseIn: async (pin, val, timeout) => {
                    const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                    const ultrasonic = comps.find(c => c.type === "sensor-ultrasonic");
                    if (!ultrasonic) return 0;
                    let dist = null;
                    if (typeof window !== "undefined" && window.__twinlab_sensor_live?.[ultrasonic.id]?.measuredDistanceCm != null) {
                        dist = window.__twinlab_sensor_live[ultrasonic.id].measuredDistanceCm;
                    } else if (typeof window !== "undefined" && window.__twinlab_ultrasonic_distance != null) {
                        dist = window.__twinlab_ultrasonic_distance;
                    } else if (ultrasonic.inRange !== false && ultrasonic.measuredDistanceCm != null) {
                        dist = ultrasonic.measuredDistanceCm;
                    } else if (ultrasonic.inRange === false) {
                        dist = 400;
                    } else {
                        dist = ultrasonic.distanceCm != null ? ultrasonic.distanceCm : 25;
                    }
                    await new Promise(r => setTimeout(r, 4));
                    return Math.round(dist * 58.2);
                },
                __analogWrite: (pin, val) => {
                    const p = String(pin).trim();
                    const duty = Math.max(0, Math.min(255, Number(val) || 0));
                    this.pinStates[p] = duty;
                    const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                    const servos = comps.filter(c => c.type === "servo-sg90");
                    if (servos.length > 0) {
                        const angle = Math.round((duty / 255) * 180);
                        servos.forEach(srv => {
                            const prevAngle = srv.angle != null ? srv.angle : 90;
                            const delta = Math.abs(prevAngle - angle);
                            if (this.callbacks.onUpdateComponent) {
                                this.callbacks.onUpdateComponent(srv.id, { angle });
                            }
                            if (delta > 2) {
                                try { soundManager.playServoMovement(srv.id, delta); } catch (_) {}
                            }
                        });
                    }
                    if (this.callbacks.onPinStateChange) {
                        this.callbacks.onPinStateChange(
                            this.boardId, 
                            { ...this.pinStates }, 
                            this.pinStates["13"] === 1, 
                            this.pinStates["2"] === 1,
                            this.pinStates["25"] === 1
                        );
                    }
                },
                __Servo: class {
                    constructor() {
                        this.pin = null;
                        this.currentAngle = 90;
                    }
                    attach(p) {
                        this.pin = String(p).trim();
                    }
                    write(angle) {
                        const a = Math.max(0, Math.min(180, Math.round(Number(angle) || 0)));
                        this.currentAngle = a;
                        const comps = context.__getComponents ? context.__getComponents() : [];
                        const servos = comps.filter(c => c.type === "servo-sg90");
                        servos.forEach(srv => {
                            const prevAngle = srv.angle != null ? srv.angle : 90;
                            const delta = Math.abs(prevAngle - a);
                            if (context.__onUpdateComponent) {
                                context.__onUpdateComponent(srv.id, { angle: a });
                            }
                            if (delta > 2) {
                                try { soundManager.playServoMovement(srv.id, delta); } catch (_) {}
                            }
                        });
                    }
                    read() {
                        return this.currentAngle;
                    }
                },
                __LiquidCrystal: class {
                    constructor(...args) {
                        if (args.length >= 4) {
                            // Standard 4-bit / 8-bit parallel LiquidCrystal(rs, en, d4, d5, d6, d7)
                            this.address = 0x27;
                            this.cols = 16;
                            this.rows = 2;
                        } else {
                            const [addrOrRs = 0x27, colsOrEn = 16, rowsOrD4 = 2] = args;
                            this.address = typeof addrOrRs === "number" ? addrOrRs : 0x27;
                            this.cols = Number(colsOrEn) || 16;
                            this.rows = Number(rowsOrD4) || 2;
                        }
                        this.cursorCol = 0;
                        this.cursorRow = 0;
                        this.showCursor = false;
                        this.blinkCursor = false;
                        this.backlightOn = true;
                        this.displayOn = true;
                        this.contrast = 85;
                        this.lines = Array(this.rows).fill("").map(() => "".padEnd(this.cols, " "));
                        this.customChars = {};
                    }

                    _notify() {
                        const comps = context.__getComponents ? context.__getComponents() : [];
                        const lcds = comps.filter(c => c.type === "lcd-1602" || c.type === "lcd-2004" || c.type?.startsWith("lcd"));
                        lcds.forEach(lcd => {
                            if (context.__onUpdateComponent) {
                                context.__onUpdateComponent(lcd.id, {
                                    textLines: [...this.lines],
                                    lines: [...this.lines],
                                    backlightOn: this.backlightOn,
                                    displayOn: this.displayOn,
                                    cursorCol: this.cursorCol,
                                    cursorRow: this.cursorRow,
                                    showCursor: this.showCursor,
                                    blinkCursor: this.blinkCursor,
                                    contrast: this.contrast
                                });
                            }
                        });
                    }

                    init(cols, rows) {
                        this.begin(cols || this.cols, rows || this.rows);
                    }

                    begin(cols = 16, rows = 2) {
                        this.cols = Number(cols) || 16;
                        this.rows = Number(rows) || 2;
                        this.lines = Array(this.rows).fill("").map(() => "".padEnd(this.cols, " "));
                        this.cursorCol = 0;
                        this.cursorRow = 0;
                        this.backlightOn = true;
                        this.displayOn = true;
                        this._notify();
                    }

                    clear() {
                        this.lines = Array(this.rows).fill("").map(() => "".padEnd(this.cols, " "));
                        this.cursorCol = 0;
                        this.cursorRow = 0;
                        this._notify();
                    }

                    home() {
                        this.cursorCol = 0;
                        this.cursorRow = 0;
                        this._notify();
                    }

                    setCursor(col, row) {
                        this.cursorCol = Math.max(0, Math.min(this.cols - 1, Number(col) || 0));
                        this.cursorRow = Math.max(0, Math.min(this.rows - 1, Number(row) || 0));
                    }

                    print(val, precision) {
                        let str = "";
                        if (typeof val === "number" && typeof precision === "number") {
                            str = val.toFixed(precision);
                        } else {
                            str = String(val != null ? val : "");
                        }
                        if (!this.lines[this.cursorRow]) {
                            this.lines[this.cursorRow] = "".padEnd(this.cols, " ");
                        }
                        const rowChars = this.lines[this.cursorRow].padEnd(this.cols, " ").split("");
                        for (let i = 0; i < str.length; i++) {
                            const targetCol = this.cursorCol + i;
                            if (targetCol < this.cols) {
                                rowChars[targetCol] = str[i];
                            }
                        }
                        this.lines[this.cursorRow] = rowChars.join("").slice(0, this.cols);
                        this.cursorCol = Math.min(this.cols - 1, this.cursorCol + str.length);
                        this._notify();
                    }

                    println(val) {
                        this.print(val);
                        this.cursorCol = 0;
                        this.cursorRow = (this.cursorRow + 1) % this.rows;
                        this._notify();
                    }

                    write(charOrCode) {
                        let ch = "";
                        if (typeof charOrCode === "number") {
                            ch = String.fromCharCode(charOrCode);
                        } else {
                            ch = String(charOrCode || "");
                        }
                        this.print(ch);
                    }

                    cursor() {
                        this.showCursor = true;
                        this._notify();
                    }

                    noCursor() {
                        this.showCursor = false;
                        this._notify();
                    }

                    blink() {
                        this.blinkCursor = true;
                        this._notify();
                    }

                    noBlink() {
                        this.blinkCursor = false;
                        this._notify();
                    }

                    display() {
                        this.displayOn = true;
                        this._notify();
                    }

                    noDisplay() {
                        this.displayOn = false;
                        this._notify();
                    }

                    backlight() {
                        this.backlightOn = true;
                        this._notify();
                    }

                    noBacklight() {
                        this.backlightOn = false;
                        this._notify();
                    }

                    scrollDisplayLeft() {
                        this.lines = this.lines.map(row => {
                            const r = row.padEnd(this.cols, " ");
                            return r.slice(1) + r.slice(0, 1);
                        });
                        this._notify();
                    }

                    scrollDisplayRight() {
                        this.lines = this.lines.map(row => {
                            const r = row.padEnd(this.cols, " ");
                            return r.slice(-1) + r.slice(0, -1);
                        });
                        this._notify();
                    }

                    autoscroll() {}
                    noAutoscroll() {}

                    createChar(num, charmap) {
                        const idx = Math.max(0, Math.min(7, Number(num) || 0));
                        this.customChars[idx] = charmap;
                    }
                },
                __getComponents: () => (this.callbacks.getComponents ? this.callbacks.getComponents() : []),
                __onUpdateComponent: (id, updates) => {
                    if (this.callbacks.onUpdateComponent) {
                        this.callbacks.onUpdateComponent(id, updates);
                    }
                },
                __digitalWrite: (pin, val) => {
                    let p = String(pin).trim();
                    if (/^GP/i.test(p)) {
                        p = p.replace(/^GP/i, "");
                    }
                    const v = val === 1 || val === "1" || val === true ? 1 : 0;
                    this.pinStates[p] = v;

                    const isD13 = this.pinStates["13"] === 1;
                    const isD2 = this.pinStates["2"] === 1;
                    const isGP25 = this.pinStates["25"] === 1;

                    if (this.callbacks.onPinStateChange) {
                        this.callbacks.onPinStateChange(this.boardId, { ...this.pinStates }, isD13, isD2, isGP25);
                    }
                },
                __digitalRead: (pin) => {
                    let p = String(pin).trim();
                    if (/^GP/i.test(p)) {
                        p = p.replace(/^GP/i, "");
                    }
                    const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                    const pir = comps.find(c => c.type === "sensor-pir");
                    if (pir && (pir.motionActive || pir.isMotion)) {
                        return 1;
                    }
                    const btn = comps.find(c => c.type === "button" && c.isPressed);
                    if (btn) return 1;
                    const sw = comps.find(c => (c.type === "switch-spst" || c.type === "slide-switch") && (c.isOn || c.switchState === "closed"));
                    if (sw) return 1;
                    return this.pinStates[p] || 0;
                },
                __analogRead: (pin) => {
                    const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                    const pStr = String(pin).toUpperCase().trim();

                    // Check for specific sensors
                    const tempSen = comps.find(c => c.type === "sensor-temp" || c.type === "sensor-temperature" || c.type === "sensor-tmp36");
                    const photo = comps.find(c => c.type === "photoresistor");
                    const soil = comps.find(c => c.type === "sensor-soil" || c.type === "sensor-soil-moisture");
                    const pot = comps.find(c => c.type === "potentiometer");

                    // Priority based on requested pin or present sensors
                    if (tempSen && (pStr === "A0" || pStr === "0" || (!pot && !photo && !soil))) {
                        const temp = tempSen.temperature != null ? Number(tempSen.temperature) : 25;
                        const vOut = 0.5 + temp * 0.01;
                        return Math.min(1023, Math.max(0, Math.round((vOut / 5.0) * 1023)));
                    }
                    if (photo && (pStr === "A1" || pStr === "1" || (!pot && !soil))) {
                        const lux = photo.lux != null ? Number(photo.lux) : 50;
                        return Math.min(1023, Math.max(0, Math.round((lux / 100) * 960 + 25)));
                    }
                    if (soil && (pStr === "A2" || pStr === "2" || !pot)) {
                        const moisture = soil.moisture != null ? Number(soil.moisture) : 45;
                        return Math.min(1023, Math.max(0, Math.round((moisture / 100) * 1023)));
                    }
                    if (pot) {
                        const wiper = pot.wiperValue != null ? Number(pot.wiperValue) : 0.5;
                        return Math.round(wiper * 1023);
                    }
                    if (tempSen) {
                        const temp = tempSen.temperature != null ? Number(tempSen.temperature) : 25;
                        return Math.min(1023, Math.max(0, Math.round(((0.5 + temp * 0.01) / 5.0) * 1023)));
                    }
                    if (photo) {
                        const lux = photo.lux != null ? Number(photo.lux) : 50;
                        return Math.min(1023, Math.max(0, Math.round((lux / 100) * 960 + 25)));
                    }
                    if (soil) {
                        const moisture = soil.moisture != null ? Number(soil.moisture) : 45;
                        return Math.min(1023, Math.max(0, Math.round((moisture / 100) * 1023)));
                    }
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
                A11: "A11", A12: "A12", A13: "A13", A14: "A14", A15: "A15",
                GP0: 0, GP1: 1, GP2: 2, GP3: 3, GP4: 4, GP5: 5, GP6: 6, GP7: 7,
                GP8: 8, GP9: 9, GP10: 10, GP11: 11, GP12: 12, GP13: 13, GP14: 14,
                GP15: 15, GP16: 16, GP17: 17, GP18: 18, GP19: 19, GP20: 20, GP21: 21,
                GP22: 22, GP23: 23, GP24: 24, GP25: 25, GP26: 26, GP27: 27, GP28: 28
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
