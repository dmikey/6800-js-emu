const fs = require('fs');
const M6800 = require('./emulator');

// Function to load program from a file
function loadProgramFromFile(cpu, filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        console.log(`Loading program from ${filePath}`);

        // Filter out any non-hex characters and parse each byte
        const program = data.split(/\s+/)
            .filter(byte => /^[0-9A-Fa-f]+$/.test(byte))
            .map(byte => parseInt(byte, 16));

        console.log(`Program loaded: ${program.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        cpu.load(program, 0x0000);  // Load program at memory address 0x0000
        return program.length;
    } catch (err) {
        console.error("Failed to read the file:", err);
        process.exit(1);
    }
}

// Main function to setup and run the emulator
function main() {
    const cpu = new M6800();
    cpu.reset();

    if (process.argv.length < 3) {
        console.log("Usage: node main.js <path_to_program_file>");
        process.exit(1);
    }

    const programPath = process.argv[2];
    const programSize = loadProgramFromFile(cpu, programPath);

    console.log("Initial state:");
    console.log(`PC: ${cpu.pc.toString(16)}`);
    console.log(`A: ${cpu.a.toString(16)}, B: ${cpu.b.toString(16)}, X: ${cpu.x.toString(16)}`);
    console.log("Starting emulation...");

    cpu.run();

    console.log("Memory dump of key locations:");
    for (let i = 0; i < 0x30; i += 16) {
        console.log(`${i.toString(16).padStart(4, '0')}: ${Array.from({ length: 16 }, (_, j) =>
            cpu.memory[i + j].toString(16).padStart(2, '0')).join(' ')}`);
    }
}

main();
