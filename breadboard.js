document.addEventListener('DOMContentLoaded', function () {
    // Initialize CPU
    const cpu = new M6800();
    cpu.reset();
    console.log("CPU initialized");

    // Track current memory address for manual programming
    let currentMemoryAddress = 0;

    // Update the UI with CPU state
    function updateUI() {
        // Update registers
        document.getElementById('register-a').textContent = cpu.a.toString(16).padStart(2, '0').toUpperCase();
        document.getElementById('register-b').textContent = cpu.b.toString(16).padStart(2, '0').toUpperCase();
        document.getElementById('register-x').textContent = cpu.x.toString(16).padStart(4, '0').toUpperCase();
        document.getElementById('register-pc').textContent = cpu.pc.toString(16).padStart(4, '0').toUpperCase();
        document.getElementById('register-sp').textContent = cpu.sp.toString(16).padStart(4, '0').toUpperCase();

        // Update flags
        document.getElementById('flag-z').classList.toggle('on', cpu.cc.z);
        document.getElementById('flag-n').classList.toggle('on', cpu.cc.n);
        document.getElementById('flag-c').classList.toggle('on', cpu.cc.c);
        document.getElementById('flag-v').classList.toggle('on', cpu.cc.v);
        document.getElementById('flag-h').classList.toggle('on', cpu.cc.h);
        document.getElementById('flag-i').classList.toggle('on', cpu.cc.i);

        // Update memory address display
        document.getElementById('memory-address').textContent = currentMemoryAddress.toString(16).padStart(4, '0').toUpperCase();

        // Update current memory value at address
        document.getElementById('memory-value').textContent = cpu.memory[currentMemoryAddress].toString(16).padStart(2, '0').toUpperCase();

        // Update memory display
        updateMemoryDisplay();
    }

    // Handle data switches
    const switches = document.querySelectorAll('.switch-input');
    switches.forEach(switchEl => {
        switchEl.addEventListener('change', updateDataValue);
    });

    function updateDataValue() {
        let value = 0;
        switches.forEach(switchEl => {
            if (switchEl.checked) {
                const bit = parseInt(switchEl.id.replace('switch', ''), 10);
                value |= (1 << bit);
            }
        });

        document.getElementById('data-hex').textContent = value.toString(16).padStart(2, '0').toUpperCase();
        document.getElementById('data-dec').textContent = value.toString(10);
    }

    // Memory display
    function updateMemoryDisplay() {
        const memoryRowsContainer = document.getElementById('memory-rows');
        memoryRowsContainer.innerHTML = '';

        // Show 8 rows of memory (0x00-0x7F)
        for (let row = 0; row < 8; row++) {
            const rowAddress = row * 16;
            const memoryRow = document.createElement('div');
            memoryRow.classList.add('memory-row');

            const addrSpan = document.createElement('span');
            addrSpan.classList.add('addr');
            addrSpan.textContent = rowAddress.toString(16).padStart(4, '0').toUpperCase();
            memoryRow.appendChild(addrSpan);

            for (let col = 0; col < 16; col++) {
                const address = rowAddress + col;
                const memVal = document.createElement('span');
                memVal.classList.add('mem-val');

                // Highlight current memory address
                if (address === currentMemoryAddress) {
                    memVal.classList.add('current');
                }

                if (address === cpu.pc) {
                    memVal.classList.add('active');
                }

                memVal.textContent = cpu.memory[address].toString(16).padStart(2, '0').toUpperCase();
                memVal.dataset.address = address;

                // Make memory cells clickable
                memVal.addEventListener('click', function () {
                    currentMemoryAddress = address;
                    updateUI();
                });

                memoryRow.appendChild(memVal);
            }

            memoryRowsContainer.appendChild(memoryRow);
        }
    }

    // Full reset of application state
    function performFullReset() {
        // Reset CPU state
        cpu.reset();

        // Reset current memory address
        currentMemoryAddress = 0;

        // Reset data switches
        switches.forEach(switchEl => {
            switchEl.checked = false;
        });
        updateDataValue();

        // Clear debug console
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) {
            debugConsole.innerHTML = '';
            debugConsole.appendChild(document.createElement('div')).textContent = '> System reset complete';
        }

        // Update UI to show reset state
        updateUI();

        console.log("Full system reset complete");
    }

    // Button event handlers
    document.getElementById('reset-button').addEventListener('click', function () {
        performFullReset();

        // Provide visual feedback that reset occurred
        const resetButton = document.getElementById('reset-button');
        resetButton.classList.add('button-flash');
        setTimeout(() => {
            resetButton.classList.remove('button-flash');
        }, 200);
    });

    document.getElementById('load-button').addEventListener('click', function () {
        const value = parseInt(document.getElementById('data-hex').textContent, 16);
        const selectedReg = document.querySelector('input[name="register"]:checked').value;

        if (selectedReg === 'a') {
            cpu.a = value;
        } else if (selectedReg === 'b') {
            cpu.b = value;
        }

        updateUI();
    });

    // Memory navigation buttons
    document.getElementById('prev-addr').addEventListener('click', function () {
        currentMemoryAddress = (currentMemoryAddress - 1) & 0xFFFF; // Wrap around at 0
        updateUI();
    });

    document.getElementById('next-addr').addEventListener('click', function () {
        currentMemoryAddress = (currentMemoryAddress + 1) & 0xFFFF; // Wrap around at 65535
        updateUI();
    });

    // Store to memory button
    document.getElementById('store-to-memory').addEventListener('click', function () {
        const value = parseInt(document.getElementById('data-hex').textContent, 16);
        cpu.memory[currentMemoryAddress] = value;
        console.log(`Stored value ${value.toString(16)} at address ${currentMemoryAddress.toString(16)}`);
        updateUI();
    });

    // Execute button handler
    document.getElementById('execute-button').addEventListener('click', function () {
        // Get opcode at PC
        const opcode = cpu.memory[cpu.pc];
        const opcodeHex = opcode.toString(16).padStart(2, '0').toUpperCase();

        console.log(`Executing instruction at PC=${cpu.pc.toString(16).padStart(4, '0')}, opcode=${opcodeHex}`);

        // Show next few bytes to help debugging
        let nextBytesMsg = "Next bytes: ";
        for (let i = 0; i < 4; i++) {
            nextBytesMsg += cpu.memory[cpu.pc + i].toString(16).padStart(2, '0').toUpperCase() + " ";
        }
        console.log(nextBytesMsg);

        const result = cpu.step();

        if (!result) {
            console.error("Execution failed. See error above.");
        } else {
            console.log(`Execution completed, new PC=${cpu.pc.toString(16).padStart(4, '0')}, A=${cpu.a.toString(16).padStart(2, '0')}, B=${cpu.b.toString(16).padStart(2, '0')}`);
        }

        // Add debug info for register values
        console.log(`Register A: ${cpu.a.toString(16).padStart(2, '0')}, Register B: ${cpu.b.toString(16).padStart(2, '0')}, PC: ${cpu.pc.toString(16).padStart(4, '0')}`);
        console.log(`Flags - Z:${cpu.cc.z ? 'ON' : 'off'}, N:${cpu.cc.n ? 'ON' : 'off'}, V:${cpu.cc.v ? 'ON' : 'off'}, C:${cpu.cc.c ? 'ON' : 'off'}, H:${cpu.cc.h ? 'ON' : 'off'}, I:${cpu.cc.i ? 'ON' : 'off'}`);

        updateUI();
    });

    // Execute All button handler
    document.getElementById('execute-all-button').addEventListener('click', function () {
        console.log("Executing entire program...");

        // Run until NOP (0x01) is reached or max steps
        const maxSteps = 100; // Safety limit to prevent infinite loops
        let steps = 0;
        let running = true;

        while (running && steps < maxSteps) {
            const opcode = cpu.memory[cpu.pc];
            console.log(`Step ${steps + 1}: PC=${cpu.pc.toString(16).padStart(4, '0')}, opcode=${opcode.toString(16).padStart(2, '0')}`);

            if (opcode === 0x01) { // Stop at NOP
                cpu.step();
                console.log("NOP encountered, execution complete");
                running = false;
            } else if (opcode === 0x00) { // Stop at undefined/null memory
                console.log("End of program (0x00 encountered)");
                running = false;
            } else {
                const result = cpu.step();
                if (!result) {
                    console.error("Execution failed, stopping");
                    running = false;
                }
            }

            steps++;

            // Update UI without redrawing everything (optional)
            document.getElementById('register-a').textContent = cpu.a.toString(16).padStart(2, '0').toUpperCase();
            document.getElementById('register-b').textContent = cpu.b.toString(16).padStart(2, '0').toUpperCase();
            document.getElementById('register-pc').textContent = cpu.pc.toString(16).padStart(4, '0').toUpperCase();

            // Update flags
            document.getElementById('flag-z').classList.toggle('on', cpu.cc.z);
            document.getElementById('flag-n').classList.toggle('on', cpu.cc.n);
            document.getElementById('flag-c').classList.toggle('on', cpu.cc.c);
            document.getElementById('flag-v').classList.toggle('on', cpu.cc.v);
        }

        console.log(`Program execution completed in ${steps} steps`);
        console.log(`Final state: A=${cpu.a.toString(16).padStart(2, '0')}, B=${cpu.b.toString(16).padStart(2, '0')}, PC=${cpu.pc.toString(16).padStart(4, '0')}`);
        console.log(`Flags - Z:${cpu.cc.z ? 'ON' : 'off'}, N:${cpu.cc.n ? 'ON' : 'off'}, V:${cpu.cc.v ? 'ON' : 'off'}, C:${cpu.cc.c ? 'ON' : 'off'}`);

        // Full UI update at the end
        updateUI();
    });

    // Full reset button handler
    document.getElementById('full-reset-button').addEventListener('click', function () {
        // Perform a complete system reset including clearing all memory
        cpu.memory = new Uint8Array(65536);  // Recreate the entire memory array
        performFullReset();

        // Display confirmation in debug console
        console.log("Full system reset performed - all memory cleared");
    });

    // Load program button handler
    document.getElementById('load-program').addEventListener('click', function () {
        const programInput = document.getElementById('program-input').value;

        // Parse program from text
        const program = programInput.split(/\s+/)
            .filter(byte => /^[0-9A-Fa-f]{1,2}$/.test(byte))
            .map(byte => parseInt(byte, 16));

        if (program.length > 0) {
            console.log(`Loading program: ${program.map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
            cpu.load(program, 0);
            updateUI();
        } else {
            alert('Invalid program format. Please enter hex bytes separated by spaces.');
        }
    });

    // Load example program from the input box
    const exampleProgram = document.getElementById('program-input');
    if (!exampleProgram.value) {
        exampleProgram.value = "86 05 97 10 86 03 6B 10 27 01 97 20 01";
    }

    // Initialize UI
    updateUI();
});
