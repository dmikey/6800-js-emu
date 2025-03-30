# 6800-js-emu

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/platform-browser%20%7C%20node.js-lightgrey)

A Motorola 6800 microprocessor emulator written in JavaScript with both browser and Node.js support.

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

### Example Program

The following example program adds two numbers and stores the result:

```
86 05    ; LDA #$05    Load accumulator A with the value 5
97 10    ; STA $10     Store accumulator A to memory location $10
86 03    ; LDA #$03    Load accumulator A with the value 3
6B 10    ; ADD $10     Add the value at memory location $10 to accumulator A
97 20    ; STA $20     Store the result to memory location $20
01       ; NOP         No operation (program end)
```

### Node.js Interface

You can also run programs directly from the command line:

```bash
node main.js example.txt
```

## Project Structure

- `emulator.js` - Core emulation logic for Node.js
- `browser-emulator.js` - Browser-compatible version of the emulator
- `instructions.js` - Implementation of 6800 CPU instructions
- `breadboard.js` - UI logic for the browser interface
- `index.html` - Web interface
- `styles.css` - UI styling
- `server.js` - Simple Express server for web access
- `main.js` - Command-line entry point

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

## Supported Instructions

The emulator currently supports the following 6800 instructions:

| Mnemonic | Description                             | Opcode |
|----------|-----------------------------------------|--------|
| LDA      | Load Accumulator A                      | 86, 96 |
| STA      | Store Accumulator A                     | 97     |
| LDX      | Load Index Register X                   | 8E     |
| STX      | Store Index Register X                  | 10     |
| ADD      | Add Memory to Accumulator A             | 6B     |
| SUB      | Subtract Memory from Accumulator A      | 90     |
| INC      | Increment Memory                        | 1C     |
| DEC      | Decrement Memory                        | 1A     |
| BRA      | Branch Always                           | 20     |
| BEQ      | Branch if Equal (Z=1)                   | 27     |
| BNE      | Branch if Not Equal (Z=0)               | 26     |
| NOP      | No Operation                            | 01     |
| AND      | Logical AND                             | 24     |
| ORA      | Logical OR                              | 2A     |
| EOR      | Logical Exclusive OR                    | 28     |
| ROL      | Rotate Left                             | 2B     |
| ROR      | Rotate Right                            | 2E     |
| TAP      | Transfer A to CCR                       | 05     |
| INX      | Increment Index Register                | 08     |

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [Motorola 6800 Programming Reference](http://www.sbprojects.net/sbasm/6800.php)
- [6800 Assembly Language Programming](https://archive.org/details/6800AssemblyLanguageProgramming1979LanceALeventhal)
- [Retrocomputing Stack Exchange](https://retrocomputing.stackexchange.com/)
