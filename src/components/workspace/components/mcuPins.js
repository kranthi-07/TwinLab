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

// ESP8266 NodeMCU V2/V3 (30-pin, 15 pins top and 15 pins bottom on 16px pitch)
export const ESP8266_NODEMCU_PINS = {
    topRow: [
        { name: "D0", x: 48, y: 16, pinNum: 16, isGpio: true },
        { name: "D1", x: 64, y: 16, pinNum: 5, isGpio: true },
        { name: "D2", x: 80, y: 16, pinNum: 4, isGpio: true },
        { name: "D3", x: 96, y: 16, pinNum: 0, isGpio: true },
        { name: "D4", x: 112, y: 16, pinNum: 2, isGpio: true, isD4: true, isLed: true }, // Built-in blue LED
        { name: "D5", x: 128, y: 16, pinNum: 14, isGpio: true },
        { name: "D6", x: 144, y: 16, pinNum: 12, isGpio: true },
        { name: "D7", x: 160, y: 16, pinNum: 13, isGpio: true },
        { name: "D8", x: 176, y: 16, pinNum: 15, isGpio: true },
        { name: "RX", x: 192, y: 16, pinNum: 3, isGpio: true },
        { name: "TX", x: 208, y: 16, pinNum: 1, isGpio: true },
        { name: "GND", x: 224, y: 16, isGnd: true, pinNum: "GND" },
        { name: "3V3", x: 240, y: 16, is3V3: true, pinNum: "3.3V" },
        { name: "GND", x: 256, y: 16, isGnd: true, pinNum: "GND" },
        { name: "3V3", x: 272, y: 16, is3V3: true, pinNum: "3.3V" },
    ],
    botRow: [
        { name: "A0", x: 48, y: 128, pinNum: "A0", isAnalog: true },
        { name: "G", x: 64, y: 128, isGnd: true, pinNum: "GND" },
        { name: "VU", x: 80, y: 128, is5V: true, pinNum: "5V" },
        { name: "S3", x: 96, y: 128, pinNum: 10, isGpio: true },
        { name: "S2", x: 112, y: 128, pinNum: 9, isGpio: true },
        { name: "S1", x: 128, y: 128, pinNum: 8, isGpio: true },
        { name: "SC", x: 144, y: 128, pinNum: 11, isGpio: true },
        { name: "SK", x: 160, y: 128, pinNum: 7, isGpio: true },
        { name: "G", x: 176, y: 128, isGnd: true, pinNum: "GND" },
        { name: "3V", x: 192, y: 128, is3V3: true, pinNum: "3.3V" },
        { name: "EN", x: 208, y: 128, pinNum: "EN" },
        { name: "RST", x: 224, y: 128, pinNum: "RST" },
        { name: "G", x: 240, y: 128, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 256, y: 128, is5V: true, pinNum: "VIN" },
        { name: "3V", x: 272, y: 128, is3V3: true, pinNum: "3.3V" },
    ]
};

// STM32 Nucleo-64 (Nucleo-F401RE / F103RB) Pin Definitions
export const STM32_NUCLEO_PINS = {
    topDigital: [
        { name: "D15", x: 80, y: 16, isGpio: true, pinNum: 15 },
        { name: "D14", x: 96, y: 16, isGpio: true, pinNum: 14 },
        { name: "AVDD", x: 112, y: 16, is3V3: true, pinNum: "3.3V" },
        { name: "GND", x: 128, y: 16, isGnd: true, pinNum: "GND" },
        { name: "D13", x: 144, y: 16, isGpio: true, isD13: true, isLed: true, pinNum: 13 }, // Green LD2 User LED (PA5)
        { name: "D12", x: 160, y: 16, isGpio: true, pinNum: 12 },
        { name: "D11", x: 176, y: 16, isGpio: true, pinNum: 11 },
        { name: "D10", x: 192, y: 16, isGpio: true, pinNum: 10 },
        { name: "D9", x: 208, y: 16, isGpio: true, pinNum: 9 },
        { name: "D8", x: 224, y: 16, isGpio: true, pinNum: 8 },
        { name: "D7", x: 240, y: 16, isGpio: true, pinNum: 7 },
        { name: "D6", x: 256, y: 16, isGpio: true, pinNum: 6 },
        { name: "D5", x: 272, y: 16, isGpio: true, pinNum: 5 },
        { name: "D4", x: 288, y: 16, isGpio: true, pinNum: 4 },
        { name: "D3", x: 304, y: 16, isGpio: true, pinNum: 3 },
        { name: "D2", x: 320, y: 16, isGpio: true, pinNum: 2 },
        { name: "D1", x: 336, y: 16, isGpio: true, pinNum: 1 },
        { name: "D0", x: 352, y: 16, isGpio: true, pinNum: 0 },
    ],
    botAnalogPower: [
        { name: "IOREF", x: 64, y: 208, is3V3: true, pinNum: "IOREF" },
        { name: "RESET", x: 80, y: 208, pinNum: "RESET" },
        { name: "3V3", x: 96, y: 208, is3V3: true, pinNum: "3.3V" },
        { name: "5V", x: 112, y: 208, is5V: true, pinNum: "5V" },
        { name: "GND", x: 128, y: 208, isGnd: true, pinNum: "GND" },
        { name: "GND", x: 144, y: 208, isGnd: true, pinNum: "GND" },
        { name: "VIN", x: 160, y: 208, is5V: true, pinNum: "VIN" },
        { name: "A0", x: 208, y: 208, isAnalog: true, pinNum: "A0" },
        { name: "A1", x: 224, y: 208, isAnalog: true, pinNum: "A1" },
        { name: "A2", x: 240, y: 208, isAnalog: true, pinNum: "A2" },
        { name: "A3", x: 256, y: 208, isAnalog: true, pinNum: "A3" },
        { name: "A4", x: 272, y: 208, isAnalog: true, pinNum: "A4" },
        { name: "A5", x: 288, y: 208, isAnalog: true, pinNum: "A5" },
    ]
};

// Teensy 4.1 Header Pin Definitions (48 pins: 24 top, 24 bottom on 16px pitch)
export const TEENSY41_PINS = {
    topRow: [
        { name: "5V", x: 16, y: 16, is5V: true, pinNum: "5V" },
        { name: "GND", x: 32, y: 16, isGnd: true, pinNum: "GND" },
        { name: "3V3", x: 48, y: 16, is3V3: true, pinNum: "3.3V" },
        { name: "23", x: 64, y: 16, isGpio: true, isAnalog: true, pinNum: 23 },
        { name: "22", x: 80, y: 16, isGpio: true, isAnalog: true, pinNum: 22 },
        { name: "21", x: 96, y: 16, isGpio: true, isAnalog: true, pinNum: 21 },
        { name: "20", x: 112, y: 16, isGpio: true, isAnalog: true, pinNum: 20 },
        { name: "19", x: 128, y: 16, isGpio: true, isAnalog: true, pinNum: 19 },
        { name: "18", x: 144, y: 16, isGpio: true, isAnalog: true, pinNum: 18 },
        { name: "17", x: 160, y: 16, isGpio: true, isAnalog: true, pinNum: 17 },
        { name: "16", x: 176, y: 16, isGpio: true, isAnalog: true, pinNum: 16 },
        { name: "15", x: 192, y: 16, isGpio: true, isAnalog: true, pinNum: 15 },
        { name: "14", x: 208, y: 16, isGpio: true, isAnalog: true, pinNum: 14 },
        { name: "13", x: 224, y: 16, isGpio: true, isD13: true, isLed: true, pinNum: 13 }, // Orange LED on Pin 13
        { name: "GND", x: 240, y: 16, isGnd: true, pinNum: "GND" },
        { name: "41", x: 256, y: 16, isGpio: true, pinNum: 41 },
        { name: "40", x: 272, y: 16, isGpio: true, pinNum: 40 },
        { name: "39", x: 288, y: 16, isGpio: true, pinNum: 39 },
        { name: "38", x: 304, y: 16, isGpio: true, pinNum: 38 },
        { name: "37", x: 320, y: 16, isGpio: true, pinNum: 37 },
        { name: "36", x: 336, y: 16, isGpio: true, pinNum: 36 },
        { name: "35", x: 352, y: 16, isGpio: true, pinNum: 35 },
        { name: "34", x: 368, y: 16, isGpio: true, pinNum: 34 },
        { name: "33", x: 384, y: 16, isGpio: true, pinNum: 33 },
    ],
    botRow: [
        { name: "GND", x: 16, y: 96, isGnd: true, pinNum: "GND" },
        { name: "0", x: 32, y: 96, isGpio: true, pinNum: 0 },
        { name: "1", x: 48, y: 96, isGpio: true, pinNum: 1 },
        { name: "2", x: 64, y: 96, isGpio: true, pinNum: 2 },
        { name: "3", x: 80, y: 96, isGpio: true, pinNum: 3 },
        { name: "4", x: 96, y: 96, isGpio: true, pinNum: 4 },
        { name: "5", x: 112, y: 96, isGpio: true, pinNum: 5 },
        { name: "6", x: 128, y: 96, isGpio: true, pinNum: 6 },
        { name: "7", x: 144, y: 96, isGpio: true, pinNum: 7 },
        { name: "8", x: 160, y: 96, isGpio: true, pinNum: 8 },
        { name: "9", x: 176, y: 96, isGpio: true, pinNum: 9 },
        { name: "10", x: 192, y: 96, isGpio: true, pinNum: 10 },
        { name: "11", x: 208, y: 96, isGpio: true, pinNum: 11 },
        { name: "12", x: 224, y: 96, isGpio: true, pinNum: 12 },
        { name: "3V3", x: 240, y: 96, is3V3: true, pinNum: "3.3V" },
        { name: "24", x: 256, y: 96, isGpio: true, pinNum: 24 },
        { name: "25", x: 272, y: 96, isGpio: true, pinNum: 25 },
        { name: "26", x: 288, y: 96, isGpio: true, pinNum: 26 },
        { name: "27", x: 304, y: 96, isGpio: true, pinNum: 27 },
        { name: "28", x: 320, y: 96, isGpio: true, pinNum: 28 },
        { name: "29", x: 336, y: 96, isGpio: true, pinNum: 29 },
        { name: "30", x: 352, y: 96, isGpio: true, pinNum: 30 },
        { name: "31", x: 368, y: 96, isGpio: true, pinNum: 31 },
        { name: "32", x: 384, y: 96, isGpio: true, pinNum: 32 },
    ]
};

// STM32 Blue Pill / Black Pill 40-Pin Header Definitions (20 left, 20 right on 16px pitch)
export const STM32_BLUEPILL_PINS = {
    leftCol: [
        { name: "B12", x: 16, y: 16, pinNum: "B12", isGpio: true },
        { name: "B13", x: 16, y: 32, pinNum: "B13", isGpio: true },
        { name: "B14", x: 16, y: 48, pinNum: "B14", isGpio: true },
        { name: "B15", x: 16, y: 64, pinNum: "B15", isGpio: true },
        { name: "A8", x: 16, y: 80, pinNum: "A8", isGpio: true },
        { name: "A9", x: 16, y: 96, pinNum: "A9", isGpio: true },
        { name: "A10", x: 16, y: 112, pinNum: "A10", isGpio: true },
        { name: "A11", x: 16, y: 128, pinNum: "A11", isGpio: true },
        { name: "A12", x: 16, y: 144, pinNum: "A12", isGpio: true },
        { name: "A15", x: 16, y: 160, pinNum: "A15", isGpio: true },
        { name: "B3", x: 16, y: 176, pinNum: "B3", isGpio: true },
        { name: "B4", x: 16, y: 192, pinNum: "B4", isGpio: true },
        { name: "B5", x: 16, y: 208, pinNum: "B5", isGpio: true },
        { name: "B6", x: 16, y: 224, pinNum: "B6", isGpio: true },
        { name: "B7", x: 16, y: 240, pinNum: "B7", isGpio: true },
        { name: "B8", x: 16, y: 256, pinNum: "B8", isGpio: true },
        { name: "B9", x: 16, y: 272, pinNum: "B9", isGpio: true },
        { name: "5V", x: 16, y: 288, is5V: true, pinNum: "5V" },
        { name: "GND", x: 16, y: 304, isGnd: true, pinNum: "GND" },
        { name: "3V3", x: 16, y: 320, is3V3: true, pinNum: "3.3V" }
    ],
    rightCol: [
        { name: "PC13", x: 112, y: 16, pinNum: 13, isGpio: true, isD13: true, isLed: true }, // Green User LED (PC13)
        { name: "PC14", x: 112, y: 32, pinNum: 14, isGpio: true },
        { name: "PC15", x: 112, y: 48, pinNum: 15, isGpio: true },
        { name: "PA0", x: 112, y: 64, pinNum: 0, isGpio: true, isAnalog: true },
        { name: "PA1", x: 112, y: 80, pinNum: 1, isGpio: true, isAnalog: true },
        { name: "PA2", x: 112, y: 96, pinNum: 2, isGpio: true, isAnalog: true },
        { name: "PA3", x: 112, y: 112, pinNum: 3, isGpio: true, isAnalog: true },
        { name: "PA4", x: 112, y: 128, pinNum: 4, isGpio: true, isAnalog: true },
        { name: "PA5", x: 112, y: 144, pinNum: 5, isGpio: true, isAnalog: true },
        { name: "PA6", x: 112, y: 160, pinNum: 6, isGpio: true, isAnalog: true },
        { name: "PA7", x: 112, y: 176, pinNum: 7, isGpio: true, isAnalog: true },
        { name: "PB0", x: 112, y: 192, pinNum: "PB0", isGpio: true },
        { name: "PB1", x: 112, y: 208, pinNum: "PB1", isGpio: true },
        { name: "PB10", x: 112, y: 224, pinNum: "PB10", isGpio: true },
        { name: "PB11", x: 112, y: 240, pinNum: "PB11", isGpio: true },
        { name: "NRST", x: 112, y: 256, pinNum: "NRST" },
        { name: "3V3", x: 112, y: 272, is3V3: true, pinNum: "3.3V" },
        { name: "GND", x: 112, y: 288, isGnd: true, pinNum: "GND" },
        { name: "GND", x: 112, y: 304, isGnd: true, pinNum: "GND" },
        { name: "VBAT", x: 112, y: 320, is5V: true, pinNum: "VBAT" }
    ]
};

// ATtiny85 8-Pin DIP / Digispark Layout
export const ATTINY85_PINS = {
    leftCol: [
        { name: "PB5", x: 16, y: 16, pinNum: 5, isGpio: true },
        { name: "PB3", x: 16, y: 32, pinNum: 3, isGpio: true, isAnalog: true },
        { name: "PB4", x: 16, y: 48, pinNum: 4, isGpio: true, isAnalog: true },
        { name: "GND", x: 16, y: 64, isGnd: true, pinNum: "GND" }
    ],
    rightCol: [
        { name: "VCC", x: 48, y: 16, is5V: true, pinNum: "5V" },
        { name: "PB2", x: 48, y: 32, pinNum: 2, isGpio: true, isAnalog: true },
        { name: "PB1", x: 48, y: 48, pinNum: 1, isGpio: true, isLed: true }, // User LED
        { name: "PB0", x: 48, y: 64, pinNum: 0, isGpio: true }
    ]
};
