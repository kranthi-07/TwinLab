// Embedded MCU Firmware Execution Engine & C++ Transpiler
// Supports Arduino Uno R3 (ATmega328P) & ESP32 DevKit V1 (ESP-WROOM-32)
import { soundManager } from "../utils/audioManager.js";
import { 
    ARDUINO_PINS, 
    ARDUINO_MEGA_PINS, 
    ARDUINO_NANO_PINS, 
    ESP32_PINS, 
    RPI_PICO_PINS,
    ESP8266_NODEMCU_PINS,
    STM32_NUCLEO_PINS,
    TEENSY41_PINS
} from "../components/workspace/components/mcuPins.js";
import { solveCircuit } from "./circuitSolver.js";

export const DEFAULT_SKETCHES = {
    blank: `// Clean Empty Arduino Sketch\nvoid setup() {\n  // put your setup code here, to run once:\n\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n\n}`,

    button_led: `// TwinLab X Pushbutton + LED Sketch
// Pushbutton -> Pin 19 (ESP32) or Pin 2 (Arduino) to GND
// LED -> Pin 18 (ESP32) or Pin 13 (Arduino) through 220Ω resistor

#if defined(ESP32) || defined(ARDUINO_ARCH_ESP32)
  const int BUTTON_PIN = 19;
  const int LED_PIN = 18;
#else
  const int BUTTON_PIN = 2;
  const int LED_PIN = 13;
#endif

void setup() {
  pinMode(LED_PIN, OUTPUT);
  // Internal pullup: Pin reads HIGH when released, LOW when pressed
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(9600);
  Serial.println("Pushbutton Controller Online");
}

void loop() {
  int buttonState = digitalRead(BUTTON_PIN);

  if (buttonState == LOW) {
    // Button pressed (closed to GND)
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Button: PRESSED -> LED ON");
  } else {
    // Button released (pulled to HIGH)
    digitalWrite(LED_PIN, LOW);
  }
  delay(50);
}`,

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
// OUT -> Pin 2, LED -> Pin 13, Buzzer -> Pin 8
#define PIR_PIN 2
#define LED_PIN 13
#define BUZZER_PIN 8

void setup() {
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
  Serial.println("PIR Motion Security System Armed");
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  if (motion == HIGH) {
    digitalWrite(LED_PIN, HIGH);
    digitalWrite(LED_BUILTIN, HIGH);
    digitalWrite(BUZZER_PIN, HIGH);
    Serial.println("🚨 MOTION DETECTED! Sensor OUT is HIGH");
  } else {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(LED_BUILTIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("Zone Clear • Standby Scanning");
  }
  delay(150);
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
import utime

# Built-in LED on GP25
led = Pin(25, Pin.OUT)
print("Raspberry Pi Pico MicroPython Ready!")

while True:
    led.toggle()
    print("GP25 LED Toggled")
    utime.sleep(0.5)
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
        this.pinModes = {};  // { 19: "INPUT_PULLUP", 18: "OUTPUT", ... }
        this.activeTimeouts = new Set();
        this.simStartTime = Date.now();
        this.serialBuffer = "";
        this._serialFlushTimer = null;
    }

    getBuiltinLedPin() {
        if (this.boardType?.includes("pico") || this.boardType === "raspberry-pi") return 25;
        if (this.boardType === "esp8266-nodemcu" || this.boardType === "esp8266") return 2;
        if (this.boardType === "stm32-nucleo" || this.boardType === "stm32-f401re") return 13;
        if (this.boardType === "teensy-41" || this.boardType === "teensy41") return 13;
        return (this.boardType === "esp32" || this.boardType === "esp32-devkit" || this.boardType === "esp32-s3") ? 2 : 13;
    }

    stop() {
        this.isRunning = false;
        this.runningRef.current = false;
        this.activeTimeouts.forEach(t => clearTimeout(t));
        this.activeTimeouts.clear();
        if (this._serialFlushTimer) {
            clearTimeout(this._serialFlushTimer);
            this._serialFlushTimer = null;
        }
        this.serialBuffer = "";
        this.pinStates = {};
        this.pinModes = {};
        if (this.callbacks.onPinStateChange) {
            this.callbacks.onPinStateChange(this.boardId, this.pinStates, false, false, false, {});
        }
    }

    readPinHardwareLevel(pin) {
        let p = String(pin).trim();
        if (/^GP/i.test(p)) p = p.replace(/^GP/i, "");
        if (/^D/i.test(p)) p = p.replace(/^D/i, "");

        const mode = this.pinModes[p];
        if (mode === "OUTPUT") {
            return this.pinStates[p] != null ? this.pinStates[p] : 0;
        }

        const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
        const wires = this.callbacks.getWires ? this.callbacks.getWires() : [];

        // 1. Run full circuit solver to resolve truth tables, logic IC gates, pullups, and wire connections
        try {
            const solverResult = solveCircuit({
                components: comps,
                wires: wires,
                isSimulating: true,
                mcuStates: {
                    [this.boardId]: {
                        pins: { ...this.pinStates },
                        modes: { ...this.pinModes },
                        isPowered: true,
                        d13High: this.pinStates["13"] === 1,
                        d2High: this.pinStates["2"] === 1,
                        gp25High: this.pinStates["25"] === 1
                    }
                }
            });

            const boardState = solverResult?.mcuStates?.[this.boardId];
            if (boardState?.pinInputs && boardState.pinInputs[p] != null) {
                return boardState.pinInputs[p];
            }
        } catch (err) {
            console.warn("solveCircuit readPinHardwareLevel fallback:", err);
        }

        const board = comps.find(c => c.id === this.boardId);
        if (!board) {
            return (mode === "INPUT_PULLUP") ? 1 : (this.pinStates[p] != null ? this.pinStates[p] : 0);
        }

        const rotRad = ((board.rotation || 0) * Math.PI) / 180;
        const cos = Math.cos(rotRad);
        const sin = Math.sin(rotRad);

        // Find pin physical location on this MCU board
        let pinDef = null;
        if (this.boardType === "esp32" || this.boardType === "esp32-devkit" || this.boardType === "esp32-s3") {
            const allPins = [...(ESP32_PINS.leftCol || []), ...(ESP32_PINS.rightCol || [])];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else if (this.boardType === "arduino-mega") {
            const allPins = [
                ...(ARDUINO_MEGA_PINS.digitalHigh || []),
                ...(ARDUINO_MEGA_PINS.digitalLow || []),
                ...(ARDUINO_MEGA_PINS.communication || []),
                ...(ARDUINO_MEGA_PINS.dualDigital || []),
                ...(ARDUINO_MEGA_PINS.analog || []),
                ...(ARDUINO_MEGA_PINS.power || [])
            ];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else if (this.boardType === "arduino-nano") {
            const allPins = [
                ...(ARDUINO_NANO_PINS.topRow || []),
                ...(ARDUINO_NANO_PINS.botRow || [])
            ];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else if (this.boardType?.includes("pico") || this.boardType === "raspberry-pi") {
            const allPins = [...(RPI_PICO_PINS.leftCol || []), ...(RPI_PICO_PINS.rightCol || [])];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `GP${p}`);
        } else if (this.boardType === "esp8266-nodemcu" || this.boardType === "esp8266") {
            const allPins = [...(ESP8266_NODEMCU_PINS.topRow || []), ...(ESP8266_NODEMCU_PINS.botRow || [])];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else if (this.boardType === "stm32-nucleo" || this.boardType === "stm32-f401re") {
            const allPins = [...(STM32_NUCLEO_PINS.topDigital || []), ...(STM32_NUCLEO_PINS.botAnalogPower || [])];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else if (this.boardType === "teensy-41" || this.boardType === "teensy41") {
            const allPins = [...(TEENSY41_PINS.topRow || []), ...(TEENSY41_PINS.botRow || [])];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        } else {
            // Arduino Uno
            const allPins = [
                ...(ARDUINO_PINS.digitalHigh || []),
                ...(ARDUINO_PINS.digitalLow || []),
                ...(ARDUINO_PINS.analog || []),
                ...(ARDUINO_PINS.power || [])
            ];
            pinDef = allPins.find(pt => String(pt.pinNum) === p || pt.name === p || pt.name === `D${p}`);
        }

        if (!pinDef) {
            return (mode === "INPUT_PULLUP") ? 1 : (this.pinStates[p] != null ? this.pinStates[p] : 0);
        }

        const pinWx = Math.round(board.x + pinDef.x * cos - pinDef.y * sin);
        const pinWy = Math.round(board.y + pinDef.x * sin + pinDef.y * cos);

        // Find all connected wire endpoints connected to this pin (net traversal)
        const connectedPoints = [{ x: pinWx, y: pinWy }];
        const visitedWires = new Set();
        let changed = true;

        while (changed) {
            changed = false;
            wires.forEach(w => {
                if (visitedWires.has(w.id || w)) return;
                if (!w.points || w.points.length < 2) return;
                const p1 = w.points[0];
                const p2 = w.points[w.points.length - 1];

                const touches1 = connectedPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20);
                const touches2 = connectedPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20);

                if (touches1 || touches2) {
                    visitedWires.add(w.id || w);
                    if (touches1 && !connectedPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 8)) {
                        connectedPoints.push(p2);
                    }
                    if (touches2 && !connectedPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 8)) {
                        connectedPoints.push(p1);
                    }
                    changed = true;
                }
            });
        }

        // Trace board GND net
        let gndDef = null;
        if (this.boardType === "esp32" || this.boardType === "esp32-devkit" || this.boardType === "esp32-s3") {
            gndDef = (ESP32_PINS.leftCol || []).find(pt => pt.isGnd);
        } else if (this.boardType === "arduino-mega") {
            gndDef = (ARDUINO_MEGA_PINS.power || []).find(pt => pt.isGnd);
        } else if (this.boardType?.includes("pico")) {
            gndDef = (RPI_PICO_PINS.leftCol || []).find(pt => pt.isGnd);
        } else {
            gndDef = (ARDUINO_PINS.power || []).find(pt => pt.isGnd);
        }

        const gndPoints = [];
        if (gndDef) {
            const gWx = Math.round(board.x + gndDef.x * cos - gndDef.y * sin);
            const gWy = Math.round(board.y + gndDef.x * sin + gndDef.y * cos);
            gndPoints.push({ x: gWx, y: gWy });
            const visitedGndWires = new Set();
            let gChanged = true;
            while (gChanged) {
                gChanged = false;
                wires.forEach(w => {
                    if (visitedGndWires.has(w.id || w)) return;
                    if (!w.points || w.points.length < 2) return;
                    const p1 = w.points[0];
                    const p2 = w.points[w.points.length - 1];

                    const t1 = gndPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20);
                    const t2 = gndPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20);

                    if (t1 || t2) {
                        visitedGndWires.add(w.id || w);
                        if (t1) gndPoints.push(p2);
                        if (t2) gndPoints.push(p1);
                        gChanged = true;
                    }
                });
            }
        }

        // Trace VCC (3.3V / 5V) net
        let vccDef = null;
        if (this.boardType === "esp32" || this.boardType === "esp32-devkit" || this.boardType === "esp32-s3") {
            vccDef = (ESP32_PINS.rightCol || []).find(pt => pt.is3V3) || (ESP32_PINS.leftCol || []).find(pt => pt.is5V);
        } else if (this.boardType?.includes("pico")) {
            vccDef = (RPI_PICO_PINS.rightCol || []).find(pt => pt.is3V3);
        } else {
            vccDef = (ARDUINO_PINS.power || []).find(pt => pt.is5V);
        }

        const vccPoints = [];
        if (vccDef) {
            const vWx = Math.round(board.x + vccDef.x * cos - vccDef.y * sin);
            const vWy = Math.round(board.y + vccDef.x * sin + vccDef.y * cos);
            vccPoints.push({ x: vWx, y: vWy });
            const visitedVccWires = new Set();
            let vChanged = true;
            while (vChanged) {
                vChanged = false;
                wires.forEach(w => {
                    if (visitedVccWires.has(w.id || w)) return;
                    if (!w.points || w.points.length < 2) return;
                    const p1 = w.points[0];
                    const p2 = w.points[w.points.length - 1];
                    const t1 = vccPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20);
                    const t2 = vccPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20);
                    if (t1 || t2) {
                        visitedVccWires.add(w.id || w);
                        if (t1) vccPoints.push(p2);
                        if (t2) vccPoints.push(p1);
                        vChanged = true;
                    }
                });
            }
        }

        // 1. Check Pushbuttons
        const buttons = comps.filter(c => c.type === "button" || c.type === "pushbutton");
        for (const btn of buttons) {
            const bRot = ((btn.rotation || 0) * Math.PI) / 180;
            const bCos = Math.cos(bRot);
            const bSin = Math.sin(bRot);

            // Side 1: Top pins (1a at 0,0 and 1b at 32,0)
            const p1a = { x: Math.round(btn.x), y: Math.round(btn.y) };
            const p1b = { x: Math.round(btn.x + 32 * bCos), y: Math.round(btn.y + 32 * bSin) };
            // Side 2: Bottom pins (2a at 0,32 and 2b at 32,32)
            const p2a = { x: Math.round(btn.x - 32 * bSin), y: Math.round(btn.y + 32 * bCos) };
            const p2b = { x: Math.round(btn.x + 32 * bCos - 32 * bSin), y: Math.round(btn.y + 32 * bSin + 32 * bCos) };

            const netTouchesSide1 = connectedPoints.some(pt => Math.hypot(pt.x - p1a.x, pt.y - p1a.y) <= 20 || Math.hypot(pt.x - p1b.x, pt.y - p1b.y) <= 20);
            const netTouchesSide2 = connectedPoints.some(pt => Math.hypot(pt.x - p2a.x, pt.y - p2a.y) <= 20 || Math.hypot(pt.x - p2b.x, pt.y - p2b.y) <= 20);

            if (netTouchesSide1 || netTouchesSide2) {
                const gndTouchesSide1 = gndPoints.some(pt => Math.hypot(pt.x - p1a.x, pt.y - p1a.y) <= 20 || Math.hypot(pt.x - p1b.x, pt.y - p1b.y) <= 20);
                const gndTouchesSide2 = gndPoints.some(pt => Math.hypot(pt.x - p2a.x, pt.y - p2a.y) <= 20 || Math.hypot(pt.x - p2b.x, pt.y - p2b.y) <= 20);

                const vccTouchesSide1 = vccPoints.some(pt => Math.hypot(pt.x - p1a.x, pt.y - p1a.y) <= 20 || Math.hypot(pt.x - p1b.x, pt.y - p1b.y) <= 20);
                const vccTouchesSide2 = vccPoints.some(pt => Math.hypot(pt.x - p2a.x, pt.y - p2a.y) <= 20 || Math.hypot(pt.x - p2b.x, pt.y - p2b.y) <= 20);

                // Shorted case: User connected BOTH MCU pin and GND to the same side of the button!
                if ((netTouchesSide1 && gndTouchesSide1) || (netTouchesSide2 && gndTouchesSide2)) {
                    return 0; // Shorted directly to GND!
                }
                if ((netTouchesSide1 && vccTouchesSide1) || (netTouchesSide2 && vccTouchesSide2)) {
                    return 1; // Shorted directly to VCC!
                }

                // Standard Active-LOW (MCU pin on one side, GND on the opposite side)
                const isGndOpposite = (netTouchesSide1 && gndTouchesSide2) || (netTouchesSide2 && gndTouchesSide1);
                if (isGndOpposite) {
                    return btn.isPressed ? 0 : 1;
                }

                // Active-HIGH (MCU pin on one side, VCC on the opposite side)
                const isVccOpposite = (netTouchesSide1 && vccTouchesSide2) || (netTouchesSide2 && vccTouchesSide1);
                if (isVccOpposite) {
                    return btn.isPressed ? 1 : 0;
                }

                return btn.isPressed ? 0 : 1;
            }
        }

        // 2. Check Slide switch
        const switches = comps.filter(c => c.type === "switch-slide");
        for (const sw of switches) {
            const sRot = ((sw.rotation || 0) * Math.PI) / 180;
            const sCos = Math.cos(sRot);
            const sSin = Math.sin(sRot);

            const p1 = { x: Math.round(sw.x), y: Math.round(sw.y) };
            const pCom = { x: Math.round(sw.x + 16 * sCos), y: Math.round(sw.y + 16 * sSin) };
            const p2 = { x: Math.round(sw.x + 32 * sCos), y: Math.round(sw.y + 32 * sSin) };

            const touchesCom = connectedPoints.some(pt => Math.hypot(pt.x - pCom.x, pt.y - pCom.y) <= 20);
            const touches1 = connectedPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20);
            const touches2 = connectedPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20);

            const swPos = sw.switchState ?? sw.state ?? 0;
            if (touchesCom || touches1 || touches2) {
                const isClosedToGnd = (touchesCom && ((swPos === 0 && gndPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20)) || (swPos === 1 && gndPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20)))) ||
                                      (touches1 && swPos === 0 && gndPoints.some(pt => Math.hypot(pt.x - pCom.x, pt.y - pCom.y) <= 20)) ||
                                      (touches2 && swPos === 1 && gndPoints.some(pt => Math.hypot(pt.x - pCom.x, pt.y - pCom.y) <= 20));
                if (isClosedToGnd) return 0;

                const isClosedToVcc = (touchesCom && ((swPos === 0 && vccPoints.some(pt => Math.hypot(pt.x - p1.x, pt.y - p1.y) <= 20)) || (swPos === 1 && vccPoints.some(pt => Math.hypot(pt.x - p2.x, pt.y - p2.y) <= 20)))) ||
                                      (touches1 && swPos === 0 && vccPoints.some(pt => Math.hypot(pt.x - pCom.x, pt.y - pCom.y) <= 20)) ||
                                      (touches2 && swPos === 1 && vccPoints.some(pt => Math.hypot(pt.x - pCom.x, pt.y - pCom.y) <= 20));
                if (isClosedToVcc) return 1;

                return mode === "INPUT_PULLUP" ? 1 : 0;
            }
        }

        // 3. Check PIR Motion Sensor
        const pirs = comps.filter(c => c.type === "sensor-pir" || c.type === "pir");
        for (const pir of pirs) {
            const pRot = ((pir.rotation || 0) * Math.PI) / 180;
            const pOut = { x: Math.round(pir.x + 16 * Math.cos(pRot)), y: Math.round(pir.y + 16 * Math.sin(pRot)) };
            if (connectedPoints.some(pt => Math.hypot(pt.x - pOut.x, pt.y - pOut.y) <= 24)) {
                let isPirActive = Boolean(pir.motionActive || pir.isMotion || pir.isTriggered);
                if (pir.pirBallX != null && pir.pirBallY != null) {
                    const rM = pir.rangeM != null ? pir.rangeM : 5;
                    const pirRangeR = 60 + rM * 35;
                    const pirAngleRad = (32 * Math.PI) / 180;
                    const dx = pir.pirBallX - 16;
                    const dy = -70 - pir.pirBallY;
                    const distPx = Math.hypot(dx, dy);
                    const phi = Math.atan2(dx, dy);
                    if (dy > 0 && Math.abs(phi) <= pirAngleRad && distPx <= pirRangeR) {
                        isPirActive = true;
                    }
                }
                return isPirActive ? 1 : 0;
            }
        }

        // Default Pullup / direct wire logic
        if (mode === "INPUT_PULLUP" || !mode) {
            const isDirectGnd = connectedPoints.some(pt => gndPoints.some(gpt => Math.hypot(pt.x - gpt.x, pt.y - gpt.y) <= 20));
            return isDirectGnd ? 0 : 1;
        }

        const isDirectVcc = connectedPoints.some(pt => vccPoints.some(vpt => Math.hypot(pt.x - vpt.x, pt.y - vpt.y) <= 20));
        if (isDirectVcc) return 1;

        return this.pinStates[p] != null ? this.pinStates[p] : 0;
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

    transpilePython(pyCode) {
        const rawLines = pyCode.split("\n");
        const jsLines = [];
        const indentStack = [0];
        const declaredVars = new Set([
            "Pin", "I2C", "time", "utime", "sleep", "sleep_ms", "sleep_us", "time_pulse_us", "I2cLcd", 
            "machine", "random", "len", "bytearray", "ord", "chr", "str", "int", "float", "Exception",
            "print", "true", "false", "null"
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

            if (stmt === "pass") {
                continue;
            }

            if (stmt.startsWith("raise ")) {
                const errExpr = stmt.substring(6).trim();
                stmt = `throw new Exception(${this.transformPyExpr(errExpr.replace(/^Exception\s*\(/, "("))})`;
            } else if (stmt === "while True") {
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
            } else if (stmt.startsWith("for ") && stmt.includes(" in ")) {
                const m = stmt.match(/for\s+([A-Za-z0-9_,\s()]+)\s+in\s+(.+)/);
                if (m) {
                    const varName = m[1].trim();
                    declaredVars.add(varName);
                    const iterable = this.transformPyExpr(m[2].trim());
                    stmt = `for (const ${varName} of (${iterable}))`;
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
        // Preserve string literals while replacing operators
        const strings = [];
        let s = expr.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
            strings.push(match);
            return `__STR_${strings.length - 1}__`;
        });

        s = s.replace(/\bTrue\b/g, "true");
        s = s.replace(/\bFalse\b/g, "false");
        s = s.replace(/\bNone\b/g, "null");
        s = s.replace(/\band\b/g, "&&");
        s = s.replace(/\bor\b/g, "||");
        s = s.replace(/\bnot\b/g, "!");

        // Pin & I2C instantiation
        s = s.replace(/(^|[^.\w])Pin\s*\(/g, "$1new Pin(");
        s = s.replace(/(^|[^.\w])I2cLcd\s*\(/g, "$1new I2cLcd(");
        s = s.replace(/(^|[^.\w])I2C\s*\(([^)]*)\)/g, (m, prefix, args) => {
            const cleanArgs = args.replace(/\b(sda|scl|freq|id)\s*=\s*/g, "");
            return `${prefix}new I2C(${cleanArgs})`;
        });

        // Sleep calls (utime, time, sleep)
        s = s.replace(/\butime\.sleep\s*\(\s*([^)]+)\s*\)/g, "await utime.sleep($1)");
        s = s.replace(/\butime\.sleep_ms\s*\(\s*([^)]+)\s*\)/g, "await utime.sleep_ms($1)");
        s = s.replace(/\butime\.sleep_us\s*\(\s*([^)]+)\s*\)/g, "await utime.sleep_us($1)");
        s = s.replace(/\btime\.sleep\s*\(\s*([^)]+)\s*\)/g, "await time.sleep($1)");
        s = s.replace(/\btime\.sleep_ms\s*\(\s*([^)]+)\s*\)/g, "await time.sleep_ms($1)");
        s = s.replace(/\btime\.sleep_us\s*\(\s*([^)]+)\s*\)/g, "await time.sleep_us($1)");
        s = s.replace(/(^|[^.\w])sleep\s*\(\s*([^)]+)\s*\)/g, "$1await sleep($2)");
        s = s.replace(/(^|[^.\w])sleep_ms\s*\(\s*([^)]+)\s*\)/g, "$1await sleep_ms($2)");
        s = s.replace(/(^|[^.\w])sleep_us\s*\(\s*([^)]+)\s*\)/g, "$1await sleep_us($2)");

        // MicroPython time ticks
        s = s.replace(/\butime\.ticks_ms\s*\(\s*\)/g, "Date.now()");
        s = s.replace(/\butime\.ticks_us\s*\(\s*\)/g, "(Date.now() * 1000)");
        s = s.replace(/\butime\.ticks_diff\s*\(\s*([^,]+),\s*([^)]+)\)/g, "(($1) - ($2))");
        s = s.replace(/\btime\.ticks_ms\s*\(\s*\)/g, "Date.now()");
        s = s.replace(/\btime\.ticks_us\s*\(\s*\)/g, "(Date.now() * 1000)");
        s = s.replace(/\btime\.ticks_diff\s*\(\s*([^,]+),\s*([^)]+)\)/g, "(($1) - ($2))");

        // Ultrasonic pulse
        s = s.replace(/\btime_pulse_us\s*\(\s*([^)]+)\s*\)/g, "await time_pulse_us($1)");

        // Print
        s = s.replace(/\bprint\s*\(\s*([^)]*)\s*\)/g, "await print($1)");

        // Python f-strings
        s = s.replace(/\bf"(.*?)"/g, (m, content) => {
            const parts = content.replace(/\{([^}]+)\}/g, '" + ($1) + "');
            return `"${parts}"`.replace(/"" \+ /g, "").replace(/ \+ ""/g, "");
        });

        // Restore strings
        s = s.replace(/__STR_(\d+)__/g, (m, idx) => strings[Number(idx)]);

        return s;
    }

    createExecutionContext(builtinPin) {
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
            __pulseIn: async (_pin, _val, _timeout) => {
                const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                const ultrasonic = comps.find(c => c.type === "sensor-ultrasonic");
                if (!ultrasonic) return 0;
                let dist = null;
                if (typeof window !== "undefined" && window.__twinlab_sensor_live?.[ultrasonic.id]?.measuredDistanceCm != null) {
                    dist = window.__twinlab_sensor_live[ultrasonic.id].measuredDistanceCm;
                } else if (typeof window !== "undefined" && window.__twinlab_ultrasonic_distance != null) {
                    dist = window.__twinlab_ultrasonic_distance;
                } else if (ultrasonic.measuredDistanceCm != null) {
                    dist = ultrasonic.measuredDistanceCm;
                } else if (ultrasonic.distanceCm != null) {
                    dist = ultrasonic.distanceCm;
                } else {
                    dist = 25;
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
                    this.callbacks.onPinStateChange(this.boardId, { ...this.pinStates }, isD13, isD2, isGP25, { ...this.pinModes });
                }
            },
            __digitalRead: (pin) => {
                return this.readPinHardwareLevel(pin);
            },
            __analogRead: (pin) => {
                const pStr = String(pin).trim();
                const comps = this.callbacks.getComponents ? this.callbacks.getComponents() : [];
                const tempSen = comps.find(c => c.type === "sensor-temp" || c.type === "sensor-temperature" || c.type === "sensor-tmp36");
                const photo = comps.find(c => c.type === "photoresistor");
                const soil = comps.find(c => c.type === "sensor-soil" || c.type === "sensor-soil-moisture");
                const pot = comps.find(c => c.type === "potentiometer");

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
                return 512;
            },
            __pinMode: (pin, mode) => {
                let p = String(pin).trim();
                if (/^GP/i.test(p)) p = p.replace(/^GP/i, "");
                if (/^D/i.test(p)) p = p.replace(/^D/i, "");
                this.pinModes[p] = mode;
                if (this.callbacks.onPinStateChange) {
                    this.callbacks.onPinStateChange(
                        this.boardId, 
                        { ...this.pinStates }, 
                        this.pinStates["13"] === 1, 
                        this.pinStates["2"] === 1, 
                        this.pinStates["25"] === 1, 
                        { ...this.pinModes }
                    );
                }
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
                const text = String(msg != null ? msg : "");
                this.serialBuffer += text;
                if (this.serialBuffer.includes("\n")) {
                    const lines = this.serialBuffer.split("\n");
                    this.serialBuffer = lines.pop(); // keep trailing incomplete segment
                    lines.forEach(line => {
                        const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                        if (this.callbacks.onSerialLog) {
                            this.callbacks.onSerialLog({
                                time: `${elapsed}s`,
                                type: "serial",
                                text: line
                            });
                        }
                    });
                } else {
                    if (this._serialFlushTimer) clearTimeout(this._serialFlushTimer);
                    this._serialFlushTimer = setTimeout(() => {
                        if (this.serialBuffer && this.callbacks.onSerialLog) {
                            const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                            this.callbacks.onSerialLog({
                                time: `${elapsed}s`,
                                type: "serial",
                                text: this.serialBuffer
                            });
                            this.serialBuffer = "";
                        }
                    }, 120);
                }
                if (this.callbacks.onTxPulse) this.callbacks.onTxPulse();
            },
            __serialPrintln: (msg) => {
                if (this._serialFlushTimer) {
                    clearTimeout(this._serialFlushTimer);
                    this._serialFlushTimer = null;
                }
                const text = String(msg != null ? msg : "");
                const fullLine = this.serialBuffer + text;
                this.serialBuffer = "";
                const elapsed = ((Date.now() - this.simStartTime) / 1000).toFixed(2);
                if (this.callbacks.onSerialLog) {
                    this.callbacks.onSerialLog({
                        time: `${elapsed}s`,
                        type: "serial",
                        text: fullLine
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

        // MicroPython & Python Objects and Classes
        function PyPin(pinNum, mode = "OUTPUT", pull = null) {
            if (!(this instanceof PyPin)) {
                return new PyPin(pinNum, mode, pull);
            }
            let p = pinNum;
            if (typeof p === "string" && (p.toLowerCase() === "led" || p.toUpperCase() === "LED")) {
                p = builtinPin;
            }
            this.pin = String(p).replace(/^GP/i, "").trim();
            if (mode === "INPUT" || mode === 0 || mode === "IN" || mode === PyPin.IN) {
                this.mode = (pull === "PULL_UP" || pull === PyPin.PULL_UP) ? "INPUT_PULLUP" : "INPUT";
            } else {
                this.mode = "OUTPUT";
            }
            this.currentVal = 0;
            context.__pinMode(this.pin, this.mode);
        }
        PyPin.OUT = "OUTPUT";
        PyPin.IN = "INPUT";
        PyPin.PULL_UP = "INPUT_PULLUP";
        PyPin.PULL_DOWN = "INPUT";

        PyPin.prototype.value = function(v) {
            if (v === undefined) {
                return context.__digitalRead(this.pin);
            }
            const val = (v === 1 || v === true || v === "1") ? 1 : 0;
            this.currentVal = val;
            context.__digitalWrite(this.pin, val);
            return val;
        };
        PyPin.prototype.on = function() { return this.value(1); };
        PyPin.prototype.off = function() { return this.value(0); };
        PyPin.prototype.high = function() { return this.value(1); };
        PyPin.prototype.low = function() { return this.value(0); };
        PyPin.prototype.toggle = function() { return this.value(this.currentVal === 1 ? 0 : 1); };
        PyPin.prototype.init = function(mode, pull) {
            if (mode) {
                if (mode === "INPUT" || mode === 0 || mode === "IN" || mode === PyPin.IN) {
                    this.mode = (pull === "PULL_UP" || pull === PyPin.PULL_UP) ? "INPUT_PULLUP" : "INPUT";
                } else {
                    this.mode = "OUTPUT";
                }
            }
            context.__pinMode(this.pin, this.mode);
        };

        const pyTime = {
            sleep: async (s) => await context.__delay(Math.round((Number(s) || 0) * 1000)),
            sleep_ms: async (ms) => await context.__delay(Math.round(Number(ms) || 0)),
            sleep_us: async (us) => await context.__delayMicroseconds(Math.round(Number(us) || 0)),
            ticks_ms: () => Date.now(),
            ticks_us: () => Date.now() * 1000,
            ticks_diff: (t1, t2) => (Number(t1) || 0) - (Number(t2) || 0),
            time: () => Math.floor(Date.now() / 1000)
        };

        const pyPulse = async (pinObj, val, timeout = 30000) => {
            const p = pinObj?.pin != null ? pinObj.pin : pinObj;
            return await context.__pulseIn(p, val, timeout);
        };

        function PyI2cLcd(i2c, addr = 0x27, rows = 2, cols = 16) {
            if (!(this instanceof PyI2cLcd)) {
                return new PyI2cLcd(i2c, addr, rows, cols);
            }
            this.lcd = new context.__LiquidCrystal(addr, cols, rows);
            this.lcd.begin(cols, rows);
        }
        PyI2cLcd.prototype.putstr = function(str) { this.lcd.print(str); };
        PyI2cLcd.prototype.clear = function() { this.lcd.clear(); };
        PyI2cLcd.prototype.move_to = function(col, row) { this.lcd.setCursor(col, row); };
        PyI2cLcd.prototype.backlight_on = function() { this.lcd.backlight(); };
        PyI2cLcd.prototype.backlight_off = function() { this.lcd.noBacklight(); };

        function PyI2C(id, sda, scl, freq) {
            if (!(this instanceof PyI2C)) {
                return new PyI2C(id, sda, scl, freq);
            }
            this.id = id;
            this.sda = sda?.pin != null ? sda.pin : sda;
            this.scl = scl?.pin != null ? scl.pin : scl;
            this.freq = freq;
            this.lcd = new context.__LiquidCrystal(0x27, 16, 2);
            this.lcd.begin(16, 2);
            this._highNibble = null;
        }
        PyI2C.prototype.scan = function() {
            return [0x27];
        };
        PyI2C.prototype.writeto = function(addr, buf) {
            const bytes = Array.from(buf || []);
            for (const b of bytes) {
                const en = (b & 0x04) !== 0;
                const rs = (b & 0x01) !== 0;
                const nibble = (b & 0xF0);
                if (en) {
                    if (this._highNibble === null) {
                        this._highNibble = nibble;
                    } else {
                        const fullByte = this._highNibble | (nibble >> 4);
                        this._highNibble = null;
                        if (rs) {
                            this.lcd.write(fullByte);
                        } else {
                            if (fullByte === 0x01) this.lcd.clear();
                            else if (fullByte === 0x02) this.lcd.home();
                            else if ((fullByte & 0x80) !== 0) {
                                const col = (fullByte & 0x7F) % 16;
                                const row = fullByte >= 0xC0 ? 1 : 0;
                                this.lcd.setCursor(col, row);
                            }
                        }
                    }
                }
            }
        };
        PyI2C.prototype.readfrom = function(addr, nbytes) {
            return new Uint8Array(nbytes || 0);
        };
        PyI2C.prototype.writeto_mem = function(addr, memaddr, buf) {
            return this.writeto(addr, buf);
        };
        PyI2C.prototype.readfrom_mem = function(addr, memaddr, nbytes) {
            return new Uint8Array(nbytes || 0);
        };

        const pyRandom = {
            randint: (a, b) => Math.floor(Math.random() * (Number(b) - Number(a) + 1)) + Number(a),
            choice: (arr) => arr[Math.floor(Math.random() * arr.length)],
            random: () => Math.random(),
            randrange: (start, stop, step = 1) => {
                const range = [];
                for (let i = start; i < stop; i += step) range.push(i);
                return range[Math.floor(Math.random() * range.length)];
            }
        };

        const pyLen = (obj) => {
            if (obj == null) return 0;
            if (typeof obj === "string" || Array.isArray(obj) || obj instanceof Uint8Array) return obj.length;
            if (typeof obj === "object") return Object.keys(obj).length;
            return 0;
        };

        const pyBytearray = (arg) => {
            if (Array.isArray(arg)) return new Uint8Array(arg);
            if (typeof arg === "number") return new Uint8Array(arg);
            return new Uint8Array(arg || []);
        };

        const pyOrd = (c) => (typeof c === "string" ? c.charCodeAt(0) : Number(c));
        const pyChr = (n) => String.fromCharCode(Number(n));
        const pyStr = (v) => String(v != null ? v : "");
        const pyInt = (v, base = 10) => parseInt(v, base) || 0;
        const pyFloat = (v) => parseFloat(v) || 0.0;

        class PyException extends Error {
            constructor(message) {
                super(message);
                this.name = "Exception";
            }
        }

        function PyADC(pin) {
            if (!(this instanceof PyADC)) return new PyADC(pin);
            let p = pin?.pin != null ? pin.pin : pin;
            this.pin = String(p).replace(/^GP/i, "").trim();
        }
        PyADC.prototype.read_u16 = function() {
            const raw10 = context.__analogRead(this.pin);
            return Math.min(65535, Math.round((raw10 / 1023) * 65535));
        };

        function PyPWM(pin) {
            if (!(this instanceof PyPWM)) return new PyPWM(pin);
            let p = pin?.pin != null ? pin.pin : pin;
            this.pin = String(p).replace(/^GP/i, "").trim();
        }
        PyPWM.prototype.freq = function(hz) { this.frequency = hz; };
        PyPWM.prototype.duty_u16 = function(val) {
            const duty8 = Math.max(0, Math.min(255, Math.round((Number(val) || 0) / 257)));
            context.__analogWrite(this.pin, duty8);
        };

        context.Pin = PyPin;
        context.I2C = PyI2C;
        context.time = pyTime;
        context.utime = pyTime;
        context.sleep = pyTime.sleep;
        context.sleep_ms = pyTime.sleep_ms;
        context.sleep_us = pyTime.sleep_us;
        context.time_pulse_us = pyPulse;
        context.I2cLcd = PyI2cLcd;
        context.ADC = PyADC;
        context.PWM = PyPWM;
        context.random = pyRandom;
        context.len = pyLen;
        context.bytearray = pyBytearray;
        context.ord = pyOrd;
        context.chr = pyChr;
        context.str = pyStr;
        context.int = pyInt;
        context.float = pyFloat;
        context.Exception = PyException;
        context.machine = {
            Pin: PyPin,
            I2C: PyI2C,
            ADC: PyADC,
            PWM: PyPWM,
            time_pulse_us: pyPulse,
            time: pyTime,
            utime: pyTime
        };
        context.print = async (...args) => {
            const text = args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ");
            await context.__serialPrintln(text);
        };

        return context;
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
                code.includes("import utime") ||
                code.includes("from utime import") ||
                code.includes("from time import") ||
                code.includes("time_pulse_us") ||
                code.includes("Pin.OUT") ||
                code.includes("Pin.IN") ||
                code.includes("Pin(") ||
                code.includes("machine.Pin") ||
                code.includes("utime.") ||
                code.includes(".toggle()") ||
                code.includes(".value(") ||
                code.includes(".on()") ||
                code.includes(".off()") ||
                code.includes(".low()") ||
                code.includes(".high()") ||
                (code.includes("print(") && !code.includes("Serial.print")) ||
                ((this.boardType?.includes("pico") || this.boardType === "raspberry-pi") && !code.includes("void setup") && !code.includes("void loop") && !code.includes("int main"))
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
                            I2C,
                            time,
                            utime,
                            sleep,
                            sleep_ms,
                            sleep_us,
                            time_pulse_us,
                            I2cLcd,
                            machine,
                            ADC,
                            PWM,
                            random,
                            len,
                            bytearray,
                            ord,
                            chr,
                            str,
                            int,
                            float,
                            Exception,
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

            const context = this.createExecutionContext(builtinPin);

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
