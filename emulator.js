const {
    LDA, STA, LDX, STX, ADD, SUB, INC, DEC,
    BRA, BEQ, BNE, NOP, AND, ORA, EOR, ROL, ROR
} = require('./instructions');

class M6800 {
    constructor() {
        this.pc = 0;  // Program Counter
        this.sp = 0xFFFF;  // Stack Pointer
        this.a = 0;   // Accumulator A
        this.b = 0;   // Accumulator B
        this.x = 0;   // Index Register X
        this.cc = {   // Condition Codes
            z: false, // Zero
            n: false, // Negative
            h: false, // Half-carry
            i: false, // Interrupt Mask
            c: false  // Carry
        };
        this.memory = new Uint8Array(65536);  // 64KB of memory
    }

    // Method to reset the CPU state
    reset() {
        this.pc = 0xFFFE;
        this.sp = 0xFFFF;
        this.a = 0;
        this.b = 0;
        this.x = 0;
        this.cc = {z: false, n: false, h: false, i: false, c: false};
    }

    // Method to load a program into memory
    load(program, startAddress) {
        for (let i = 0; i < program.length; i++) {
            // console.log(`Loading byte: ${program[i].toString(16).toUpperCase()} at address ${startAddress + i}`);
            this.memory[startAddress + i] = program[i];
        }
        this.pc = startAddress;  // Set the program counter to the start address of the program
    }

    // Fetch, Decode, Execute cycle
    run() {
        let running = true;
        // console.log(this.memory)
        console.log(this.pc, this.memory[this.pc++])
        while (running) {
            const opcode = this.memory[this.pc++];
            this.execute(opcode);
            // Example stopping condition or breakpoint
            if (this.pc === 0xFFFF) {
                running = false;
            }
        }
    }

    // Decoding and executing the instruction
    execute(opcode) {
        switch (opcode) {
            case 0x86: // LDA Immediate
                LDA(this, this.memory[this.pc++]);
                break;
            case 0x97: // STA Direct
                STA(this, this.memory[this.pc++]);
                break;
            case 0x8E: // LDX Immediate
                LDX(this, this.memory[this.pc++]);
                break;
            case 0x10: // STX Direct
                STX(this, this.memory[this.pc++]);
                break;
            case 0x6B: // ADD Direct
                ADD(this, this.memory[this.pc++]);
                break;
            case 0x90: // SUB Direct
                SUB(this, this.memory[this.pc++]);
                break;
            case 0x1C: // INC Direct
                INC(this, this.memory[this.pc++]);
                break;
            case 0x1A: // DEC Direct
                DEC(this, this.memory[this.pc++]);
                break;
            case 0x20: // BRA
                BRA(this, this.memory[this.pc++]);
                break;
            case 0x27: // BEQ
                BEQ(this, this.memory[this.pc++]);
                break;
            case 0x26: // BNE
                BNE(this, this.memory[this.pc++]);
                break;
            case 0x01: // NOP
                NOP();
                break;
            case 0x24: // AND Direct
                AND(this, this.memory[this.pc++]);
                break;
            case 0x2A: // ORA Direct
                ORA(this, this.memory[this.pc++]);
                break;
            case 0x28: // EOR Direct
                EOR(this, this.memory[this.pc++]);
                break;
            case 0x2B: // ROL
                ROL(this);
                break;
            case 0x2E: // ROR
                ROR(this);
                break;
            default:
                // console.error(`Unimplemented opcode: ${opcode}`);
                break;
        }
    }
}

module.exports = M6800;
