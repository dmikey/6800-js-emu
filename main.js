const fs = require('fs');
const M6800 = require('./emulator');

// Function to load program from a file
function loadProgramFromFile(cpu, filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const program = data.split(/\s+/).filter(byte => byte !== '').map(byte => parseInt(byte, 16));
        cpu.load(program, 0x0000);  // Load program at memory address 0x0000
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
    loadProgramFromFile(cpu, programPath);
    cpu.run();
}

main();
