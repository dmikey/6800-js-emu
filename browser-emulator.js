// Browser-compatible version of the 6800 emulator

// Helper function to set condition codes based on the result
function setCC(cpu, result, updateCarry = false) {
    cpu.cc.z = (result & 0xFF) === 0;  // Zero flag
    cpu.cc.n = (result & 0x80) !== 0;  // Negative flag
    if (updateCarry) {
        cpu.cc.c = (result > 0xFF);    // Carry flag
    }

    // Make sure the flags are properly updated by triggering events
    console.log(`Flag states - Z:${cpu.cc.z}, N:${cpu.cc.n}, C:${cpu.cc.c}, H:${cpu.cc.h}, I:${cpu.cc.i}`);
}

// Instruction implementations
const Instructions = {
    // Load Accumulator A from Memory
    LDA: function (cpu, address) {
        cpu.a = cpu.memory[address];
        setCC(cpu, cpu.a);
    },

    // Store Accumulator A into Memory
    STA: function (cpu, address) {
        cpu.memory[address] = cpu.a;
        setCC(cpu, cpu.a);
    },

    // Load Index Register X from Memory
    LDX: function (cpu, address) {
        cpu.x = (cpu.memory[address] << 8) | cpu.memory[address + 1];
        setCC(cpu, cpu.x >> 8); // Set condition codes based on high byte
    },

    // Store Index Register X into Memory
    STX: function (cpu, address) {
        cpu.memory[address] = (cpu.x >> 8) & 0xFF;
        cpu.memory[address + 1] = cpu.x & 0xFF;
    },

    // Add Memory to Accumulator A
    ADD: function (cpu, address) {
        const result = cpu.a + cpu.memory[address];
        cpu.a = result & 0xFF;
        setCC(cpu, result, true);
    },

    // Subtract Memory from Accumulator A
    SUB: function (cpu, address) {
        const result = cpu.a - cpu.memory[address];
        cpu.a = result & 0xFF;
        setCC(cpu, result, true);
    },

    // Increment Memory
    INC: function (cpu, address) {
        const result = cpu.memory[address] + 1;
        cpu.memory[address] = result & 0xFF;
        setCC(cpu, result);
    },

    // Decrement Memory
    DEC: function (cpu, address) {
        const result = cpu.memory[address] - 1;
        cpu.memory[address] = result & 0xFF;
        setCC(cpu, result);
    },

    // Branch Always
    BRA: function (cpu, offset) {
        const signedOffset = offset & 0x80 ? (offset - 256) : offset;
        cpu.pc += signedOffset;
    },

    // Branch if Zero
    BEQ: function (cpu, offset) {
        if (cpu.cc.z) {
            const signedOffset = offset & 0x80 ? (offset - 256) : offset;
            cpu.pc += signedOffset;
        }
    },

    // Branch if Not Zero
    BNE: function (cpu, offset) {
        if (!cpu.cc.z) {
            const signedOffset = offset & 0x80 ? (offset - 256) : offset;
            cpu.pc += signedOffset;
        }
    },

    // No Operation
    NOP: function () {
        // Does nothing
    },

    // Logical AND Memory with Accumulator
    AND: function (cpu, address) {
        cpu.a &= cpu.memory[address];
        setCC(cpu, cpu.a);
    },

    // Logical OR Memory with Accumulator
    ORA: function (cpu, address) {
        cpu.a |= cpu.memory[address];
        setCC(cpu, cpu.a);
    },

    // Logical Exclusive OR Memory with Accumulator
    EOR: function (cpu, address) {
        cpu.a ^= cpu.memory[address];
        setCC(cpu, cpu.a);
    },

    // Rotate Left Accumulator A
    ROL: function (cpu) {
        let result = (cpu.a << 1) | (cpu.cc.c ? 1 : 0);
        cpu.cc.c = (cpu.a & 0x80) !== 0;
        cpu.a = result & 0xFF;
        setCC(cpu, result);
    },

    // Rotate Right Accumulator A
    ROR: function (cpu) {
        let result = (cpu.a >> 1) | (cpu.cc.c ? 0x80 : 0);
        cpu.cc.c = (cpu.a & 1) !== 0;
        cpu.a = result & 0xFF;
        setCC(cpu, result);
    },

    // Transfer Accumulator A to Condition Code Register (TAP)
    TAP: function (cpu) {
        // Extract bits from accumulator A and set condition codes
        cpu.cc.c = (cpu.a & 0x01) !== 0; // Bit 0 → Carry
        cpu.cc.v = (cpu.a & 0x02) !== 0; // Bit 1 → Overflow (adding this flag)
        cpu.cc.z = (cpu.a & 0x04) !== 0; // Bit 2 → Zero
        cpu.cc.n = (cpu.a & 0x08) !== 0; // Bit 3 → Negative
        cpu.cc.i = (cpu.a & 0x10) !== 0; // Bit 4 → Interrupt mask
        cpu.cc.h = (cpu.a & 0x20) !== 0; // Bit 5 → Half-carry

        console.log(`TAP: Set CC from A=${cpu.a.toString(16).padStart(2, '0')}, flags now Z:${cpu.cc.z}, N:${cpu.cc.n}, C:${cpu.cc.c}, H:${cpu.cc.h}, I:${cpu.cc.i}`);
    },

    // INX - Increment Index Register X
    INX: function (cpu) {
        cpu.x = (cpu.x + 1) & 0xFFFF;  // Increment X and wrap at 16 bits

        // Set condition codes based on the high byte of X
        const highByte = (cpu.x >> 8) & 0xFF;
        cpu.cc.z = (cpu.x === 0);  // Zero flag - set if entire X is zero
        cpu.cc.n = (highByte & 0x80) !== 0;  // Negative flag - set based on high byte bit 7

        console.log(`INX: X incremented to ${cpu.x.toString(16).padStart(4, '0')}, flags: Z=${cpu.cc.z}, N=${cpu.cc.n}`);
    }
};

// The M6800 CPU class
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
            c: false, // Carry
            v: false  // Overflow (adding this flag)
        };
        this.memory = new Uint8Array(65536);  // 64KB of memory
    }

    // Method to reset the CPU state
    reset() {
        this.pc = 0;
        this.sp = 0xFFFF;
        this.a = 0;
        this.b = 0;
        this.x = 0;
        this.cc = { z: false, n: false, h: false, i: false, c: false, v: false };

        // Clear the first 256 bytes of memory for a cleaner reset
        for (let i = 0; i < 256; i++) {
            this.memory[i] = 0;
        }
        console.log("CPU reset complete");
    }

    // Method to load a program into memory
    load(program, startAddress) {
        for (let i = 0; i < program.length; i++) {
            this.memory[startAddress + i] = program[i];
        }
        this.pc = startAddress;  // Set the program counter to the start address of the program
    }

    // Execute a single instruction
    step() {
        // Fetch the opcode
        const opcode = this.memory[this.pc++];

        // Execute the instruction
        return this.execute(opcode);
    }

    // Run the program until NOP or a specified number of steps
    run(maxSteps = 1000) {
        let steps = 0;
        let running = true;

        while (running && steps < maxSteps) {
            const opcode = this.memory[this.pc];
            if (opcode === 0x01) { // NOP can be used as a stopping point
                this.step();
                running = false;
            } else {
                this.step();
            }
            steps++;
        }

        return steps;
    }

    // Decoding and executing a single instruction
    execute(opcode) {
        switch (opcode) {
            case 0x00: // Treat as NOP for compatibility
                console.log("Encountered opcode 0x00, treating as NOP");
                break;

            case 0x86: // LDA Immediate
                // Get immediate value (PC is already incremented in step())
                const immediateValue = this.memory[this.pc];
                console.log(`LDA Immediate: Loading value ${immediateValue.toString(16)} into A`);
                this.a = immediateValue;
                setCC(this, this.a);
                this.pc++;
                break;

            case 0x97: // STA Direct
                const staAddress = this.memory[this.pc];
                console.log(`STA Direct: Storing A (${this.a.toString(16)}) to address ${staAddress.toString(16)}`);
                this.memory[staAddress] = this.a;
                setCC(this, this.a);
                this.pc++;
                break;

            case 0x8E: // LDX Immediate
                const highByte = this.memory[this.pc];
                const lowByte = this.memory[this.pc + 1];
                const xValue = (highByte << 8) | lowByte;
                console.log(`LDX Immediate: Loading value ${xValue.toString(16)} into X`);
                this.x = xValue;
                setCC(this, highByte); // Set condition codes based on high byte
                this.pc += 2; // X register is 16-bit, so we need to increment PC by 2
                break;

            case 0x6B: // ADD Direct
                const addAddress = this.memory[this.pc];
                const addValue = this.memory[addAddress];
                console.log(`ADD Direct: Adding memory[${addAddress.toString(16)}]=${addValue.toString(16)} to A=${this.a.toString(16)}`);
                const addResult = this.a + addValue;
                this.a = addResult & 0xFF;
                setCC(this, addResult, true);
                this.pc++;
                break;

            case 0x27: // BEQ (Branch if Equal)
                const beqOffset = this.memory[this.pc];
                console.log(`BEQ: Branch if Z=1 by offset ${beqOffset.toString(16)}, current Z=${this.cc.z}`);
                if (this.cc.z) {
                    const signedOffset = beqOffset & 0x80 ? (beqOffset - 256) : beqOffset;
                    this.pc += signedOffset;
                }
                this.pc++;
                break;

            case 0x01: // NOP
                console.log("NOP: No operation");
                Instructions.NOP();
                break;

            case 0x10: // STX Direct
                Instructions.STX(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x90: // SUB Direct
                Instructions.SUB(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x1C: // INC Direct
                Instructions.INC(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x1A: // DEC Direct
                Instructions.DEC(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x20: // BRA
                Instructions.BRA(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x26: // BNE
                Instructions.BNE(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x24: // AND Direct
                Instructions.AND(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x2A: // ORA Direct
                Instructions.ORA(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x28: // EOR Direct
                Instructions.EOR(this, this.memory[this.pc]);
                this.pc++;
                break;
            case 0x2B: // ROL
                Instructions.ROL(this);
                break;
            case 0x2E: // ROR
                Instructions.ROR(this);
                break;
            case 0x05: // TAP (Transfer Accumulator A to CCR)
                console.log("Executing TAP instruction");
                Instructions.TAP(this);
                break;
            case 0x08: // INX (Increment Index Register X)
                console.log("Executing INX instruction");
                Instructions.INX(this);
                break;
            default:
                console.error(`Unimplemented opcode: ${opcode.toString(16)}`);
                return false;
        }

        return true;
    }
}

// Make the M6800 class available to the global scope
window.M6800 = M6800;
