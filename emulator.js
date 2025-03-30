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
        this.cc = { z: false, n: false, h: false, i: false, c: false };
    }

    // Method to load a program into memory
    load(program, startAddress) {
        for (let i = 0; i < program.length; i++) {
            this.memory[startAddress + i] = program[i];
        }
        this.pc = startAddress;  // Set the program counter to the start address of the program
    }

    // Fetch, Decode, Execute cycle
    run() {
        let running = true;

        while (running) {
            // For debugging
            // console.log(`PC: ${this.pc.toString(16)}, A: ${this.a.toString(16)}, B: ${this.b.toString(16)}, X: ${this.x.toString(16)}`);

            // Fetch the opcode
            const opcode = this.memory[this.pc++];

            // Execute the instruction
            this.execute(opcode);

            // Example stopping condition or breakpoint
            if (opcode === 0x01) {  // NOP can be used as a stopping point
                console.log("Execution complete (reached NOP)");
                console.log(`Final state: PC=${this.pc.toString(16)}, A=${this.a.toString(16)}, B=${this.b.toString(16)}, X=${this.x.toString(16)}`);
                console.log(`Memory at 0x10: ${this.memory[0x10].toString(16)}, Memory at 0x20: ${this.memory[0x20].toString(16)}`);
                running = false;
            }
        }
    }

    // Decoding and executing the instruction
    execute(opcode) {
        switch (opcode) {
            case 0x86: // LDA Immediate
                LDA(this, this.pc);
                this.pc++;
                break;
            case 0x97: // STA Direct
                STA(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x8E: // LDX Immediate
                LDX(this, this.pc);
                this.pc += 2; // X register is 16-bit, so we need to increment PC by 2
                break;
            case 0x10: // STX Direct
                STX(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x6B: // ADD Direct
                ADD(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x90: // SUB Direct
                SUB(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x1C: // INC Direct
                INC(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x1A: // DEC Direct
                DEC(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x20: // BRA
                BRA(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x27: // BEQ
                BEQ(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x26: // BNE
                BNE(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x01: // NOP
                NOP();
                break;
            case 0x24: // AND Direct
                AND(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x2A: // ORA Direct
                ORA(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x28: // EOR Direct
                EOR(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x2B: // ROL
                ROL(this);
                break;
            case 0x2E: // ROR
                ROR(this);
                break;
            default:
                console.error(`Unimplemented opcode: ${opcode.toString(16)}`);
                break;
        }
    }
}

module.exports = M6800;
