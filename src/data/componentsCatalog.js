import breadboardImg from "../assets/twinlab/breadboard.webp";

export const COMPONENTS_CATALOG = [
    // ==========================================
    // BOARDS & PROTOTYPING
    // ==========================================
    {
        id: "breadboard-half",
        name: "Breadboard (Half-Size)",
        type: "breadboard-half",
        category: "boards",
        image: breadboardImg,
        icon: "ri-layout-grid-line",
        width: 560,
        height: 288,
        desc: "Standard 30-column solderless breadboard with dual power rails (400 tie-points)",
        tag: "Core"
    },
    {
        id: "breadboard-full",
        name: "Breadboard (Full-Size)",
        type: "breadboard-full",
        category: "boards",
        image: breadboardImg,
        icon: "ri-layout-grid-fill",
        width: 1040,
        height: 288,
        desc: "Full 60-column solderless breadboard with extended dual power rails (830 tie-points)",
        tag: "Core"
    },
    {
        id: "breadboard-mini",
        name: "Breadboard (Mini 170-Point)",
        type: "breadboard-mini",
        category: "boards",
        icon: "ri-grid-line",
        width: 352,
        height: 208,
        desc: "Compact 17-column mini breadboard without power rails for small circuits",
        tag: "Core"
    },
    {
        id: "arduino-uno",
        name: "Arduino Uno R3",
        type: "arduino-uno",
        category: "boards",
        icon: "ri-router-line",
        width: 320,
        height: 224,
        desc: "ATmega328P microcontroller with 14 digital I/O pins, 6 analog inputs, 16MHz clock",
        tag: "MCU"
    },
    {
        id: "arduino-mega",
        name: "Arduino Mega 2560",
        type: "arduino-mega",
        category: "boards",
        icon: "ri-server-line",
        width: 480,
        height: 224,
        desc: "ATmega2560 with 54 digital I/O pins, 16 analog inputs, 4 UARTs for massive projects",
        tag: "MCU"
    },
    {
        id: "arduino-nano",
        name: "Arduino Nano",
        type: "arduino-nano",
        category: "boards",
        icon: "ri-cpu-line",
        width: 256,
        height: 96,
        desc: "Breadboard-friendly 30-pin mini Arduino powered by ATmega328P",
        tag: "MCU"
    },
    {
        id: "esp32-devkit",
        name: "ESP32 DevKit V1",
        type: "esp32-devkit",
        category: "boards",
        icon: "ri-wifi-line",
        width: 240,
        height: 144,
        desc: "Xtensa dual-core 32-bit MCU with integrated 2.4GHz Wi-Fi, Bluetooth 4.2 BLE, 30 GPIOs",
        tag: "IoT"
    },
    {
        id: "esp32-s3",
        name: "ESP32-S3 WROOM",
        type: "esp32-s3",
        category: "boards",
        icon: "ri-bluetooth-line",
        width: 256,
        height: 144,
        desc: "Dual-core LX7 processor with vector instructions for AI acceleration and USB-OTG",
        tag: "IoT"
    },
    {
        id: "rpi-pico",
        name: "Raspberry Pi Pico",
        type: "rpi-pico",
        category: "boards",
        icon: "ri-computer-line",
        width: 176,
        height: 80,
        desc: "RP2040 dual-core ARM Cortex-M0+ running up to 133MHz with 26 multi-function GPIOs",
        tag: "MCU"
    },
    {
        id: "stm32-bluepill",
        name: "STM32 Blue Pill",
        type: "stm32-bluepill",
        category: "boards",
        icon: "ri-microchip-line",
        width: 176,
        height: 80,
        desc: "ARM 32-bit Cortex-M3 (STM32F103C8T6) 72MHz microcontroller with 64KB Flash",
        tag: "ARM"
    },
    {
        id: "attiny85",
        name: "ATtiny85 (DIP-8)",
        type: "attiny85",
        category: "boards",
        icon: "ri-cpu-fill",
        width: 64,
        height: 64,
        desc: "Ultra-compact 8-pin 8-bit AVR microcontroller with 8KB ISP Flash memory",
        tag: "DIP"
    },

    // ==========================================
    // PASSIVES & SMALL COMPONENTS
    // ==========================================
    {
        id: "wire",
        name: "Connecting Wire",
        type: "wire-tool",
        category: "devices",
        icon: "ri-route-line",
        width: 64,
        height: 64,
        desc: "Point-to-point breadboard jumper wire that snaps to grid points",
        tag: "Wiring"
    },
    {
        id: "resistor",
        name: "Resistor (220Ω)",
        type: "resistor",
        category: "devices",
        icon: "ri-pulse-line",
        width: 80,
        height: 16,
        desc: "Through-hole carbon film axial resistor (customizable resistance)",
        tag: "Passive"
    },
    {
        id: "capacitor-ceramic",
        name: "Ceramic Capacitor (100nF)",
        type: "capacitor-ceramic",
        category: "devices",
        icon: "ri-contrast-2-line",
        width: 32,
        height: 32,
        desc: "Non-polarized high-frequency noise decoupling disc capacitor",
        tag: "Passive"
    },
    {
        id: "capacitor-electrolytic",
        name: "Electrolytic Capacitor (10µF)",
        type: "capacitor-electrolytic",
        category: "devices",
        icon: "ri-battery-2-line",
        width: 32,
        height: 48,
        desc: "Polarized radial capacitor with anode (+) and cathode (-) stripes",
        tag: "Passive"
    },
    {
        id: "led-red",
        name: "LED (Red 5mm)",
        type: "led",
        color: "#ef4444",
        category: "devices",
        icon: "ri-lightbulb-line",
        width: 32,
        height: 32,
        desc: "Standard 5mm diffused LED with long anode (+) and flat cathode (-)",
        tag: "Output"
    },
    {
        id: "led-green",
        name: "LED (Green 5mm)",
        type: "led",
        color: "#10b981",
        category: "devices",
        icon: "ri-lightbulb-fill",
        width: 32,
        height: 32,
        desc: "5mm high-efficiency green diffused emitting diode",
        tag: "Output"
    },
    {
        id: "push-button",
        name: "Push Button (Tactile)",
        type: "button",
        category: "devices",
        icon: "ri-radio-button-line",
        width: 48,
        height: 48,
        desc: "4-pin 6mm momentary tactile push-button switch",
        tag: "Input"
    },
    {
        id: "potentiometer",
        name: "Potentiometer (10kΩ)",
        type: "potentiometer",
        category: "devices",
        icon: "ri-equalizer-line",
        width: 48,
        height: 48,
        desc: "Rotary variable resistor with Terminal 1, Wiper, and Terminal 2",
        tag: "Input"
    },
    {
        id: "slide-switch",
        name: "Slide Switch (SPDT)",
        type: "slide-switch",
        category: "devices",
        icon: "ri-toggle-line",
        width: 48,
        height: 32,
        desc: "Single Pole Double Throw slide switch with Common pin",
        tag: "Input"
    },
    {
        id: "battery-9v",
        name: "Battery",
        type: "battery-9v",
        category: "devices",
        icon: "ri-battery-charge-line",
        width: 96,
        height: 144,
        desc: "Standard 9-volt DC power source with positive & negative snap terminals",
        tag: "Power"
    },
    {
        id: "battery-coin",
        name: "Coin Cell (CR2032 3V)",
        type: "battery-coin",
        category: "devices",
        icon: "ri-coin-line",
        width: 64,
        height: 64,
        desc: "3-Volt lithium coin battery for low-power microcontroller twins",
        tag: "Power"
    },
    {
        id: "battery-aa",
        name: "AA Battery Pack",
        type: "battery-aa",
        category: "devices",
        icon: "ri-battery-2-charge-line",
        width: 96,
        height: 64,
        desc: "AA cell battery enclosure with coiled spring and snap leads (1, 2, or 4 cells: 1.5V, 3V, 6V)",
        tag: "Power"
    },
    {
        id: "battery-aaa",
        name: "AAA Battery Pack",
        type: "battery-aaa",
        category: "devices",
        icon: "ri-battery-charge-line",
        width: 88,
        height: 56,
        desc: "AAA cell battery enclosure with coiled spring and snap leads (1, 2, or 4 cells: 1.5V, 3V, 6V)",
        tag: "Power"
    },
    {
        id: "switch-spst",
        name: "SPST Toggle Switch",
        type: "switch-spst",
        category: "devices",
        icon: "ri-toggle-line",
        width: 48,
        height: 32,
        desc: "Single-Pole Single-Throw electronic toggle switch with ON/OFF contact lever",
        tag: "Input"
    },
    {
        id: "lcd-1602",
        name: "16x2 Character LCD (I2C)",
        type: "lcd-1602",
        category: "devices",
        icon: "ri-tv-line",
        width: 192,
        height: 96,
        desc: "HD44780 dot-matrix 16x2 alphanumeric display with integrated PCF8574 I2C backpack",
        tag: "Output"
    },
    {
        id: "buzzer",
        name: "Piezo Buzzer",
        type: "buzzer",
        category: "devices",
        icon: "ri-volume-up-line",
        width: 48,
        height: 48,
        desc: "Audio transducer for tones, frequency generation, and alarm pulses",
        tag: "Output"
    },
    {
        id: "multimeter",
        name: "Digital Multimeter (DMM)",
        type: "multimeter",
        category: "devices",
        icon: "ri-speed-up-line",
        width: 120,
        height: 184,
        desc: "Benchtop Digital Multimeter with movable Red (+) and Black (-) test probes for V, mA, Ω",
        tag: "Meter"
    },
    {
        id: "transistor-npn",
        name: "NPN Transistor (2N2222)",
        type: "transistor",
        category: "devices",
        icon: "ri-git-commit-line",
        width: 48,
        height: 32,
        desc: "TO-92 bipolar junction transistor with Collector, Base, and Emitter",
        tag: "Discrete"
    },
    {
        id: "photoresistor",
        name: "Photoresistor (LDR)",
        type: "photoresistor",
        category: "devices",
        icon: "ri-sun-line",
        width: 32,
        height: 32,
        desc: "Light-dependent cadmium-sulfide resistor for ambient lux detection",
        tag: "Sensor"
    },

    // ==========================================
    // STARTERS (TINKERCAD GRADE PRE-BUILT CIRCUITS)
    // ==========================================
    {
        id: "starter-led-resistor",
        name: "Starter: LED + Resistor",
        type: "starter-led-resistor",
        category: "starters",
        isStarter: true,
        icon: "ri-lightbulb-flash-line",
        desc: "Pre-configured 5mm LED with a 220 Ohm current-limiting resistor pair",
        tag: "Starter"
    },
    {
        id: "starter-battery-led",
        name: "Starter: 9V Power and LED",
        type: "starter-battery-led",
        category: "starters",
        isStarter: true,
        icon: "ri-battery-charge-fill",
        desc: "Complete DC starter circuit: 9V Battery, 1k Ohm Resistor, and LED",
        tag: "Starter"
    },
    {
        id: "starter-pot-led",
        name: "Starter: Variable Dimmer",
        type: "starter-pot-led",
        category: "starters",
        isStarter: true,
        icon: "ri-dashboard-2-line",
        desc: "Variable brightness circuit using 10k potentiometer and LED",
        tag: "Starter"
    },
    {
        id: "starter-button-buzzer",
        name: "Starter: Doorbell Buzzer",
        type: "starter-button-buzzer",
        category: "starters",
        isStarter: true,
        icon: "ri-notification-3-line",
        desc: "Tactile pushbutton buzzer alarm circuit with battery power",
        tag: "Starter"
    }
];

export const SMALL_COMPONENTS_PALETTE = [
    { id: "wire", name: "Wire", type: "wire-tool", icon: "ri-route-line", color: "#FF8A00" },
    { id: "resistor", name: "Resistor", type: "resistor", icon: "ri-pulse-line", color: "#3B9CFF" },
    { id: "capacitor-ceramic", name: "Capacitor", type: "capacitor-ceramic", icon: "ri-contrast-2-line", color: "#10B981" },
    { id: "led-red", name: "LED", type: "led", icon: "ri-lightbulb-line", color: "#EF4444" },
    { id: "push-button", name: "Button", type: "button", icon: "ri-radio-button-line", color: "#A855F7" },
    { id: "switch-spst", name: "Toggle", type: "switch-spst", icon: "ri-toggle-line", color: "#6366F1" },
    { id: "slide-switch", name: "Slide SW", type: "slide-switch", icon: "ri-git-commit-line", color: "#818CF8" },
    { id: "potentiometer", name: "Potentiometer", type: "potentiometer", icon: "ri-equalizer-line", color: "#F59E0B" },
    { id: "battery-aa", name: "AA Pack", type: "battery-aa", icon: "ri-battery-2-charge-line", color: "#EC4899" },
    { id: "battery-aaa", name: "AAA Pack", type: "battery-aaa", icon: "ri-battery-charge-line", color: "#F43F5E" },
    { id: "battery-9v", name: "9V Battery", type: "battery-9v", icon: "ri-battery-line", color: "#D946EF" },
    { id: "lcd-1602", name: "16x2 LCD", type: "lcd-1602", icon: "ri-tv-line", color: "#14B8A6" },
    { id: "buzzer", name: "Buzzer", type: "buzzer", icon: "ri-volume-up-line", color: "#06B6D4" }
];
