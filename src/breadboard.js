document.addEventListener('DOMContentLoaded', function () {
    // Initialize CPU
    const cpu = new M6800();
    cpu.reset();
    console.log("CPU initialized");

    // Track current memory address for manual programming
    let currentMemoryAddress = 0;

    // Add a variable to track if we're paused at a breakpoint
    let pausedAtBreakpoint = false;

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

        // Update breakpoint display
        updateBreakpointDisplay();

        // Show or hide the continue button based on breakpoint state
        const continueButton = document.getElementById('continue-button');
        if (continueButton) {
            continueButton.style.display = pausedAtBreakpoint ? 'inline-block' : 'none';
        }
    }

    // Update breakpoint display - Fixed to ensure it works properly
    function updateBreakpointDisplay() {
        const breakpointsContainer = document.getElementById('active-breakpoints');

        // Exit gracefully if container isn't found - don't show an error
        if (!breakpointsContainer) {
            console.log("Breakpoints container not found - skipping update");
            return;
        }

        // Get sorted breakpoints
        const breakpoints = cpu.getBreakpoints();

        // Clear previous breakpoint tags
        breakpointsContainer.innerHTML = '';

        if (breakpoints.length === 0) {
            // Show "no breakpoints" message
            const noBreakpointsMsg = document.createElement('span');
            noBreakpointsMsg.id = 'no-breakpoints-msg';
            noBreakpointsMsg.className = 'no-breakpoints-msg';
            noBreakpointsMsg.textContent = 'No active breakpoints';
            breakpointsContainer.appendChild(noBreakpointsMsg);
        } else {
            // Create a tag for each breakpoint
            breakpoints.forEach(address => {
                const bpTag = document.createElement('span');
                bpTag.classList.add('breakpoint-tag');
                bpTag.textContent = '0x' + address.toString(16).padStart(4, '0').toUpperCase();
                bpTag.title = 'Click to remove this breakpoint';

                // Add click handler to remove breakpoint
                bpTag.addEventListener('click', function (e) {
                    cpu.removeBreakpoint(address);
                    updateUI();

                    // Prevent event bubbling
                    e.stopPropagation();
                });

                breakpointsContainer.appendChild(bpTag);
            });
        }
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

                // Mark breakpoints - FIXED: Make sure this works
                if (cpu.hasBreakpoint(address)) {
                    memVal.classList.add('breakpoint');
                }

                memVal.textContent = cpu.memory[address].toString(16).padStart(2, '0').toUpperCase();
                memVal.dataset.address = address;

                // FIX: Make memory cells clickable with proper event handling
                memVal.addEventListener('click', function (e) {
                    const addr = parseInt(this.dataset.address, 10);

                    // Check if shift key is pressed
                    if (e.shiftKey) {
                        // Toggle breakpoint when shift+clicking
                        console.log(`Shift-clicked at address: 0x${addr.toString(16).toUpperCase()}`);
                        const isActive = cpu.toggleBreakpoint(addr);

                        // Don't update entire UI, just toggle the breakpoint class on this element
                        if (isActive) {
                            this.classList.add('breakpoint');
                        } else {
                            this.classList.remove('breakpoint');
                        }

                        // Only update the breakpoint display
                        updateBreakpointDisplay();
                    } else {
                        // Regular click selects the memory address
                        currentMemoryAddress = addr;
                        updateUI();
                    }

                    // Prevent event bubbling
                    e.stopPropagation();
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

        // Add log message without clearing debug console
        const debugConsole = document.getElementById('debug-console');
        if (debugConsole) {
            // Append reset message instead of clearing console
            const resetMessage = document.createElement('div');
            resetMessage.textContent = '> System reset complete';
            resetMessage.style.color = '#ffcc00'; // Highlight message
            debugConsole.appendChild(resetMessage);

            // Scroll to the bottom
            debugConsole.scrollTop = debugConsole.scrollHeight;
        }

        // Update UI to show reset state
        updateUI();

        // Make sure to reset the paused state
        pausedAtBreakpoint = false;

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

        // Check for breakpoint BEFORE executing the instruction
        if (cpu.hasBreakpoint(cpu.pc)) {
            console.log(`Breakpoint hit at 0x${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
            // Set the paused state to true
            pausedAtBreakpoint = true;
            // We still update UI to show where execution is paused
            updateUI();
            return; // Don't execute past the breakpoint
        }

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

        // Run until NOP (0x01) is reached, breakpoint hit, or max steps
        const maxSteps = 100; // Safety limit to prevent infinite loops
        let steps = 0;
        let running = true;
        let hitBreakpoint = false;

        while (running && steps < maxSteps) {
            // IMPORTANT: Check for breakpoints BEFORE executing the instruction
            if (cpu.hasBreakpoint(cpu.pc)) {
                console.log(`Breakpoint hit at 0x${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
                hitBreakpoint = true;
                pausedAtBreakpoint = true;
                break;
            }

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
                    console.error(`Execution failed at PC=0x${(cpu.pc - 1).toString(16).padStart(4, '0').toUpperCase()}, opcode=0x${opcode.toString(16).padStart(2, '0').toUpperCase()}`);
                    console.error("Check for invalid opcodes or memory access issues");
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

        if (hitBreakpoint) {
            console.log(`Program paused at breakpoint after ${steps} steps`);
        } else if (steps >= maxSteps) {
            console.warn(`Maximum step count (${maxSteps}) reached. Execution halted to prevent infinite loop.`);
        } else {
            console.log(`Program execution completed in ${steps} steps`);
        }

        console.log(`Final state: A=${cpu.a.toString(16).padStart(2, '0')}, B=${cpu.b.toString(16).padStart(2, '0')}, PC=${cpu.pc.toString(16).padStart(4, '0')}`);
        console.log(`Flags - Z:${cpu.cc.z ? 'ON' : 'off'}, N:${cpu.cc.n ? 'ON' : 'off'}, V:${cpu.cc.v ? 'ON' : 'off'}, C:${cpu.cc.c ? 'ON' : 'off'}, H:${cpu.cc.h ? 'ON' : 'off'}, I:${cpu.cc.i ? 'ON' : 'off'}`);

        // Full UI update at the end
        updateUI();
    });

    // Add continue execution button handler
    document.getElementById('continue-button').addEventListener('click', function () {
        if (pausedAtBreakpoint) {
            console.log("Continuing execution after breakpoint...");

            // Temporarily store and remove the current breakpoint so we can move past it
            const currentPC = cpu.pc;
            const hadBreakpoint = cpu.hasBreakpoint(currentPC);

            if (hadBreakpoint) {
                // Remove the breakpoint temporarily
                cpu.removeBreakpoint(currentPC);
            }

            // Execute the instruction at the current position
            const opcodeHex = cpu.memory[cpu.pc].toString(16).padStart(2, '0').toUpperCase();
            console.log(`Executing instruction at PC=${cpu.pc.toString(16).padStart(4, '0')}, opcode=${opcodeHex}`);

            const result = cpu.step();
            if (!result) {
                console.error("Execution failed. See error above.");

                // Reset paused state even if execution failed
                pausedAtBreakpoint = false;
                updateUI();
                return;
            }

            // If we had a breakpoint at the original location, restore it
            if (hadBreakpoint) {
                cpu.addBreakpoint(currentPC);
            }

            // Reset the paused state
            pausedAtBreakpoint = false;

            // Now continue execution with execute-all logic directly, not by clicking the button
            // This avoids triggering DOM events that might have side effects
            console.log("Continuing program execution...");

            // Simplified version of execute-all logic
            let steps = 0;
            const maxSteps = 100;
            let running = true;
            let hitBreakpoint = false;

            while (running && steps < maxSteps) {
                // Check for breakpoints
                if (cpu.hasBreakpoint(cpu.pc)) {
                    console.log(`Breakpoint hit at 0x${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
                    hitBreakpoint = true;
                    pausedAtBreakpoint = true;
                    break;
                }

                const opcode = cpu.memory[cpu.pc];
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
                        console.error(`Execution failed at PC=0x${(cpu.pc - 1).toString(16).padStart(4, '0').toUpperCase()}, opcode=0x${opcode.toString(16).padStart(2, '0').toUpperCase()}`);
                        running = false;
                    }
                }

                steps++;
            }

            if (hitBreakpoint) {
                console.log(`Program paused at breakpoint after ${steps} steps`);
            } else if (steps >= maxSteps) {
                console.warn(`Maximum step count (${maxSteps}) reached. Execution halted to prevent infinite loop.`);
            } else {
                console.log(`Program execution completed in ${steps} steps`);
                pausedAtBreakpoint = false;
            }

            updateUI();
        }
    });

    // Full reset button handler
    document.getElementById('full-reset-button').addEventListener('click', function () {
        // Perform a complete system reset including clearing all memory
        cpu.memory = new Uint8Array(65536);  // Recreate the entire memory array
        performFullReset();
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

    // Add memory dump button handler
    document.getElementById('dump-memory').addEventListener('click', function () {
        console.log("Dumping memory...");
        cpu.dumpMemory();
    });

    // Add clear breakpoints button handler
    document.getElementById('clear-breakpoints-button').addEventListener('click', function () {
        cpu.clearAllBreakpoints();
        console.log("All breakpoints cleared");

        // Force complete UI refresh
        updateUI();
    });

    // Load example program from the input box
    const exampleProgram = document.getElementById('program-input');
    if (!exampleProgram.value) {
        exampleProgram.value = "86 05 97 10 86 03 6B 10 27 01 97 20 01";
    }

    // Update the instructions for breakpoints
    const memoryInstructionsEl = document.querySelector('.memory-instructions');
    if (!memoryInstructionsEl.innerHTML.includes('key-instruction')) {
        memoryInstructionsEl.innerHTML = 'Click on memory cells to select them. Press <span class="key-instruction">Shift</span> + <span class="key-instruction">Click</span> on a memory cell to toggle a breakpoint.';
    }

    // Add a debugging helper function
    function debugBreakpoints() {
        const breakpoints = cpu.getBreakpoints();
        console.log("Current breakpoints:", breakpoints.map(b => "0x" + b.toString(16).toUpperCase()));
    }

    // Initialize UI
    updateUI();
});
