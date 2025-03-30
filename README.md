# 6800-js-emu

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-browser%20%7C%20node.js-lightgrey)

A Motorola 6800 microprocessor emulator written in JavaScript with both browser and Node.js support.

![Emulator Screenshot](https://via.placeholder.com/800x400?text=6800+Emulator+Screenshot)

## Overview

This project implements a functional emulator for the Motorola 6800 microprocessor, featuring:

- Complete CPU emulation with accurate instruction execution
- Interactive browser-based UI with a breadboard-style interface
- Memory visualization and editing capabilities
- Real-time status display for registers and flags
- Support for program loading and execution

The 6800 was an 8-bit microprocessor released by Motorola in 1974. It was among the first widely available microprocessors and was used in various early computer systems, arcade games, and industrial controllers.

## Installation

### Prerequisites

- Node.js (v12 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/6800-js-emu.git
   cd 6800-js-emu
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Usage

### Browser Interface

The browser interface provides a complete emulation environment:

1. **Load a Program**: Enter hexadecimal opcodes in the Program input box and click "Load Program"
2. **Execute Instructions**: Use the "Execute Step" button to step through program execution or "Execute All" to run the entire program
3. **Monitor State**: View register values, flags, and memory contents in real-time
4. **Manipulate Memory**: Click on memory locations to select them, then use the data switches to set values

## Feature Checklist

### 1. **Enhance Debugging and Logging**
   - [x] **Add Step-by-Step Execution Logs**: Include detailed logs for each instruction executed, showing the opcode, affected registers, and memory changes.
   - [x] **Memory Dump Feature**: Add a feature to dump the entire memory or specific ranges to the debug console for analysis.
   - [ ] **Breakpoint Support**: Allow users to set breakpoints at specific memory addresses or instructions.

### 2. **Expand Instruction Set**
   - [x] Implement additional 6800 instructions that are currently missing, such as `TAP`, `TBA`, `ABA`, and others.
   - [ ] Add support for more addressing modes (e.g., indexed, extended, and indirect).

### 3. **Improve User Interface**
   - [x] **Interactive Memory Editor**: Allow users to edit memory values directly in the memory display UI.
   - [ ] **Instruction Viewer**: Display the disassembled instructions in memory for easier debugging.
   - [x] **Real-Time Updates**: Update the UI dynamically as instructions are executed, without requiring manual refreshes.

### 4. **Add Peripheral Emulation**
   - [x] Simulate basic I/O devices like LEDs, switches, or a simple display to demonstrate interaction with hardware.
   - [ ] Add a serial interface or terminal emulator to simulate communication with external devices.

### 5. **Support for Assembler Input**
   - [ ] Create a simple assembler to convert assembly code into machine code, allowing users to write programs in assembly language.
   - [ ] Integrate the assembler into the UI for direct program loading.

### 6. **Save and Load State**
   - [ ] Implement functionality to save the current CPU and memory state to a file and reload it later.
   - [ ] This would allow users to pause and resume their work.

### 7. **Add Example Programs**
   - [x] Include pre-written example programs to demonstrate the emulator's capabilities (e.g., simple arithmetic, loops, or I/O operations).
   - [ ] Provide a library of example programs in the UI for users to load and run.

### 8. **Improve Performance**
   - [ ] Optimize the emulator's execution loop for better performance, especially when running large programs.
   - [ ] Add a "fast-forward" mode to skip through instructions quickly.

### 9. **Documentation and Tutorials**
   - [ ] Write detailed documentation explaining how to use the emulator, including the instruction set, addressing modes, and UI features.
   - [ ] Create tutorials or walkthroughs for beginners to learn how to program the 6800.

### 10. **Testing and Validation**
   - [ ] Write unit tests for all instructions to ensure correctness.
   - [ ] Validate the emulator against known 6800 programs or test suites to ensure accurate behavior.

### 11. **Web-Based Enhancements**
   - [ ] Add a feature to load programs directly from a URL or cloud storage.
   - [ ] Allow users to share their programs or emulator states via links.

### 12. **Add Visualization Tools**
   - [x] Include visualizations for the stack, memory usage, and instruction flow to help users understand the program execution.

### 13. **Cross-Platform Compatibility**
   - [x] Ensure the emulator works seamlessly in different environments (e.g., browsers, Node.js, or as a standalone desktop app using Electron).
