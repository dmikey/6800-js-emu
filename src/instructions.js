// Helper function to set condition codes based on the result
function setCC(cpu, result, updateCarry = false) {
    cpu.cc.z = (result & 0xFF) === 0;  // Zero flag
    cpu.cc.n = (result & 0x80) !== 0;  // Negative flag
    if (updateCarry) {
        cpu.cc.c = (result > 0xFF);    // Carry flag
    }
}

// Load Accumulator A from Memory
function LDA(cpu, address) {
    cpu.a = cpu.memory[address];
    setCC(cpu, cpu.a);
}

// Store Accumulator A into Memory
function STA(cpu, address) {
    cpu.memory[address] = cpu.a;
    setCC(cpu, cpu.a);
}

// Load Index Register X from Memory
function LDX(cpu, address) {
    cpu.x = (cpu.memory[address] << 8) | cpu.memory[address + 1];
    setCC(cpu, cpu.x >> 8); // Set condition codes based on high byte
}

// Store Index Register X into Memory
function STX(cpu, address) {
    cpu.memory[address] = (cpu.x >> 8) & 0xFF;
    cpu.memory[address + 1] = cpu.x & 0xFF;
}

// Add Memory to Accumulator A
function ADD(cpu, address) {
    const result = cpu.a + cpu.memory[address];
    cpu.a = result & 0xFF;
    setCC(cpu, result, true);
}

// Substract Memory from Accumulator A
function SUB(cpu, address) {
    const result = cpu.a - cpu.memory[address];
    cpu.a = result & 0xFF;
    setCC(cpu, result, true);
}

// Increment Memory
function INC(cpu, address) {
    const result = cpu.memory[address] + 1;
    cpu.memory[address] = result & 0xFF;
    setCC(cpu, result);
}

// Decrement Memory
function DEC(cpu, address) {
    const result = cpu.memory[address] - 1;
    cpu.memory[address] = result & 0xFF;
    setCC(cpu, result);
}

// Branch Always
function BRA(cpu, offset) {
    // Treat the offset as a signed 8-bit value
    const signedOffset = offset & 0x80 ? (offset - 256) : offset;
    cpu.pc += signedOffset;
}

// Branch if Zero
function BEQ(cpu, offset) {
    if (cpu.cc.z) {
        const signedOffset = offset & 0x80 ? (offset - 256) : offset;
        cpu.pc += signedOffset;
    }
}

// Branch if Not Zero
function BNE(cpu, offset) {
    if (!cpu.cc.z) {
        const signedOffset = offset & 0x80 ? (offset - 256) : offset;
        cpu.pc += signedOffset;
    }
}

// No Operation
function NOP() {
    // Does nothing
}

// Logical AND Memory with Accumulator
function AND(cpu, address) {
    cpu.a &= cpu.memory[address];
    setCC(cpu, cpu.a);
}

// Logical OR Memory with Accumulator
function ORA(cpu, address) {
    cpu.a |= cpu.memory[address];
    setCC(cpu, cpu.a);
}

// Logical Exclusive OR Memory with Accumulator
function EOR(cpu, address) {
    cpu.a ^= cpu.memory[address];
    setCC(cpu, cpu.a);
}

// Rotate Left Accumulator A
function ROL(cpu) {
    let result = (cpu.a << 1) | (cpu.cc.c ? 1 : 0);
    cpu.cc.c = (cpu.a & 0x80) !== 0;
    cpu.a = result & 0xFF;
    setCC(cpu, result);
}

// Rotate Right Accumulator A
function ROR(cpu) {
    let result = (cpu.a >> 1) | (cpu.cc.c ? 0x80 : 0);
    cpu.cc.c = (cpu.a & 1) !== 0;
    cpu.a = result & 0xFF;
    setCC(cpu, result);
}

// Export the instruction handlers
module.exports = {
    LDA, STA, LDX, STX, ADD, SUB, INC, DEC, BRA, BEQ, BNE, NOP,
    AND, ORA, EOR, ROL, ROR
};
