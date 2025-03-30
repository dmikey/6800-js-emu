document.addEventListener('DOMContentLoaded', function () {
    // Initialize variables first
    let currentMemoryAddress = 0;
    let pausedAtBreakpoint = false;
    let programRunning = false;
    let lastExecutionTime = null;

    // Initialize CPU
    const cpu = new M6800();
    cpu.reset();
    console.log("CPU initialized");

    // Function to update the status bar
    function updateStatusBar(status, message, executionTimeMs = null) {
        const statusIndicatorDot = document.getElementById('status-indicator-dot');
        const statusLabel = document.getElementById('status-label');
        const statusMessage = document.getElementById('status-message');

        statusLabel.textContent = status;

        // If execution time is provided and status is Ready, add it to the message
        if (executionTimeMs !== null && status === "Ready") {
            lastExecutionTime = executionTimeMs;
            statusMessage.innerHTML = `${message} <span class="execution-time">(last execution: ${executionTimeMs.toFixed(2)}ms)</span>`;
        } else {
            // If there was a previous execution time and we're back to Ready status
            if (lastExecutionTime !== null && status === "Ready" && !message.includes("execution")) {
                statusMessage.innerHTML = `${message} <span class="execution-time">(last execution: ${lastExecutionTime.toFixed(2)}ms)</span>`;
            } else {
                statusMessage.textContent = message;
            }
        }

        // Update status dot appearance
        statusIndicatorDot.className = 'status-dot';

        switch (status) {
            case "Running":
                statusIndicatorDot.classList.add('running');
                break;
            case "Paused":
                statusIndicatorDot.classList.add('paused');
                break;
            case "Error":
                statusIndicatorDot.classList.add('error');
                break;
            default: // Ready
                // Default green dot
                break;
        }
    }

    // Now call updateStatusBar after the function is defined
    updateStatusBar("Ready", "System initialized");

    // Track current memory address for manual programming
    // Add a variable to track if we're paused at a breakpoint
    // Add a variable to track if program is currently running
    // Add variable to track last execution time

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
            if (pausedAtBreakpoint) {
                continueButton.classList.add('active');
            } else {
                continueButton.classList.remove('active');
            }
        }

        // Update Execute All button state based on if program is running
        const executeAllButton = document.getElementById('execute-all-button');
        if (executeAllButton) {
            executeAllButton.disabled = programRunning;
            executeAllButton.title = programRunning ?
                "Cannot run while program is active" : "Execute program until completion";
        }

        // Update status bar based on CPU state
        if (pausedAtBreakpoint) {
            updateStatusBar("Paused", `Execution paused at breakpoint @ $${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
        } else if (programRunning) {
            updateStatusBar("Running", `Executing program...`);
        } else {
            updateStatusBar("Ready", `PC=$${cpu.pc.toString(16).padStart(4, '0').toUpperCase()} A=$${cpu.a.toString(16).padStart(2, '0').toUpperCase()} B=$${cpu.b.toString(16).padStart(2, '0').toUpperCase()}`);
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

                // Mark breakpoints
                if (cpu.hasBreakpoint(address)) {
                    memVal.classList.add('breakpoint');
                }

                memVal.textContent = cpu.memory[address].toString(16).padStart(2, '0').toUpperCase();
                memVal.dataset.address = address;

                // Make memory cells clickable with proper event handling
                memVal.addEventListener('click', function (e) {
                    const addr = parseInt(this.dataset.address, 10);

                    // Check if shift key is pressed
                    if (e.shiftKey) {
                        // Toggle breakpoint when shift+clicking
                        console.log(`Shift - clicked at address: 0x${addr.toString(16).toUpperCase()}`);
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
        // Reset program state variables in addition to other resets
        pausedAtBreakpoint = false;
        programRunning = false;
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
            updateStatusBar("Ready", `Program loaded (${program.length} bytes)`);
            updateUI();
        } else {
            alert('Invalid program format. Please enter hex bytes separated by spaces.');
            updateStatusBar("Error", "Invalid program format");
        }
    });

    // Execute button handler
    document.getElementById('execute-button').addEventListener('click', function () {
        // Get opcode at PC
        const opcode = cpu.memory[cpu.pc];
        const opcodeHex = opcode.toString(16).padStart(2, '0').toUpperCase();

        // Start timing
        const startTime = performance.now();

        // If we're already paused at a breakpoint, we should execute this instruction
        // regardless of the breakpoint (otherwise we can never step through it)
        if (pausedAtBreakpoint) {
            console.log(`Stepping through breakpoint at PC=${cpu.pc.toString(16).padStart(4, '0')}, opcode=${opcodeHex}`);

            // Record the current PC before executing
            const currentPC = cpu.pc;

            // Execute the instruction at the breakpoint
            const result = cpu.step();

            if (!result) {
                console.error("Execution failed. See error above.");
                pausedAtBreakpoint = false;
                updateStatusBar("Error", "Execution failed");
                updateUI();
                return;
            }

            console.log(`Execution completed, new PC=${cpu.pc.toString(16).padStart(4, '0')}, A=${cpu.a.toString(16).padStart(2, '0')}, B=${cpu.b.toString(16).padStart(2, '0')}`);

            // Add debug info for register values
            console.log(`Register A: ${cpu.a.toString(16).padStart(2, '0')}, Register B: ${cpu.b.toString(16).padStart(2, '0')}, PC: ${cpu.pc.toString(16).padStart(4, '0')}`);
            console.log(`Flags - Z:${cpu.cc.z ? 'ON' : 'off'}, N:${cpu.cc.n ? 'ON' : 'off'}, V:${cpu.cc.v ? 'ON' : 'off'}, C:${cpu.cc.c ? 'ON' : 'off'}, H:${cpu.cc.h ? 'ON' : 'off'}, I:${cpu.cc.i ? 'ON' : 'off'}`);

            // WORKAROUND: Check if PC didn't advance and force it to move to the next instruction
            // This works around potential bugs in the CPU emulator
            if (cpu.pc === currentPC) {
                console.warn(`PC didn't advance after execution of opcode ${opcodeHex}. Forcing increment.`);

                // Determine instruction length (most 6800 instructions are 1-3 bytes)
                let increment = 1; // Default increment for 1-byte instructions

                // Make a reasonable guess of instruction length based on opcode
                // This is a simplified lookup since we don't have the full instruction set
                // 97 is STA Direct which is 2 bytes (opcode + direct address)
                if (opcode === 0x97) {
                    increment = 2; // opcode + direct address
                } else if ([0x7E, 0xBD, 0xAD].includes(opcode)) {
                    increment = 3; // Examples of 3-byte instructions (JMP, JSR Extended)
                }

                cpu.pc = (currentPC + increment) & 0xFFFF; // Apply increment with wrapping
                console.log(`Advancing PC to ${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
            }

            // After executing the instruction, we're no longer paused at a breakpoint
            // We'll only pause again if the next instruction has a breakpoint
            pausedAtBreakpoint = false;

            // Only check for breakpoint at new PC if it's different from where we started
            if (cpu.pc !== currentPC && cpu.hasBreakpoint(cpu.pc)) {
                console.log(`New breakpoint found at: 0x${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
                pausedAtBreakpoint = true;
            }

            // End timing
            const executionTime = performance.now() - startTime;
            updateStatusBar("Ready", `Stepped through breakpoint at $${currentPC.toString(16).padStart(4, '0').toUpperCase()}`, executionTime);

            updateUI();
            return;
        }

        // Normal execution path (not already at a breakpoint)
        // Check for breakpoint BEFORE executing the instruction
        if (cpu.hasBreakpoint(cpu.pc)) {
            console.log(`Breakpoint hit at 0x${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
            // Set the paused state to true
            pausedAtBreakpoint = true;
            updateStatusBar("Paused", `Breakpoint hit at $${cpu.pc.toString(16).padStart(4, '0').toUpperCase()}`);
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

        // End timing
        const executionTime = performance.now() - startTime;

        let statusMessage = "";
        if (!result) {
            console.error("Execution failed. See error above.");
            statusMessage = "Execution failed";
            updateStatusBar("Error", statusMessage);
        } else {
            statusMessage = `Executed instruction at $${(cpu.pc - 1).toString(16).padStart(4, '0').toUpperCase()}`;
            console.log(`Execution completed, new PC=${cpu.pc.toString(16).padStart(4, '0')}, A=${cpu.a.toString(16).padStart(2, '0')}, B=${cpu.b.toString(16).padStart(2, '0')}`);
            updateStatusBar("Ready", statusMessage, executionTime);
        }

        // Add debug info for register values
        console.log(`Register A: ${cpu.a.toString(16).padStart(2, '0')}, Register B: ${cpu.b.toString(16).padStart(2, '0')}, PC: ${cpu.pc.toString(16).padStart(4, '0')}`);
        console.log(`Flags - Z:${cpu.cc.z ? 'ON' : 'off'}, N:${cpu.cc.n ? 'ON' : 'off'}, V:${cpu.cc.v ? 'ON' : 'off'}, C:${cpu.cc.c ? 'ON' : 'off'}, H:${cpu.cc.h ? 'ON' : 'off'}, I:${cpu.cc.i ? 'ON' : 'off'}`);

        updateUI();
    });

    // Execute All button handler
    document.getElementById('execute-all-button').addEventListener('click', function () {
        // Don't run if program is already active
        if (programRunning || pausedAtBreakpoint) {
            console.log("Cannot start execution - program is already running or paused");
            return;
        }

        // Set the program running state to true
        programRunning = true;
        updateStatusBar("Running", "Executing program...");
        updateUI(); // Update button state

        console.log("Executing entire program...");

        // Start timing
        const startTime = performance.now();

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
        }

        // End timing
        const executionTime = performance.now() - startTime;

        if (hitBreakpoint) {
            console.log(`Program paused at breakpoint after ${steps} steps`);
            updateStatusBar("Paused", `Paused at breakpoint after ${steps} steps`);
            // Don't reset programRunning since we're still paused at a breakpoint
        } else if (steps >= maxSteps) {
            console.warn(`Maximum step count (${maxSteps}) reached. Execution halted to prevent infinite loop.`);
            updateStatusBar("Ready", `Halted: maximum step count (${maxSteps}) reached`, executionTime);
            programRunning = false;
        } else {
            console.log(`Program execution completed in ${steps} steps`);
            updateStatusBar("Ready", `Program completed in ${steps} steps`, executionTime);
            programRunning = false;
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

            // Start timing
            const startTime = performance.now();

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
                updateStatusBar("Error", "Execution failed");
                updateUI();
                return;
            }

            // If we had a breakpoint at the original location, restore it
            if (hadBreakpoint) {
                cpu.addBreakpoint(currentPC);
            }

            // Reset the paused state, but keep program running true
            pausedAtBreakpoint = false;
            programRunning = true;
            updateStatusBar("Running", "Continuing execution...");

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
                        updateStatusBar("Error", "Execution failed");
                    }
                }

                steps++;
            }

            // End timing
            const executionTime = performance.now() - startTime;

            if (hitBreakpoint) {
                console.log(`Program paused at breakpoint after ${steps} steps`);
                updateStatusBar("Paused", `Paused at breakpoint after ${steps} additional steps`);
                pausedAtBreakpoint = true;
                // programRunning stays true while at breakpoint
            } else if (steps >= maxSteps) {
                console.warn(`Maximum step count (${maxSteps}) reached. Execution halted to prevent infinite loop.`);
                updateStatusBar("Ready", `Halted: maximum step count (${maxSteps}) reached`, executionTime);
                pausedAtBreakpoint = false;
                programRunning = false;
            } else {
                console.log(`Program execution completed in ${steps} steps`);
                updateStatusBar("Ready", `Program completed in ${steps} additional steps`, executionTime);
                pausedAtBreakpoint = false;
                programRunning = false;
            }

            updateUI();
        }
    });

    // Full reset button handler
    document.getElementById('full-reset-button').addEventListener('click', function () {
        // Perform a complete system reset including clearing all memory
        cpu.memory = new Uint8Array(65536);  // Recreate the entire memory array
        performFullReset();

        // Reset program state variables
        pausedAtBreakpoint = false;
        programRunning = false;

        updateStatusBar("Ready", "System fully reset");
    });

    // Add memory dump button handler
    document.getElementById('dump-memory').addEventListener('click', function () {
        console.log("Dumping memory...");
        cpu.dumpMemory();
    });

    // Add panel toggle functionality
    const panelToggleButton = document.getElementById('breakpoint-panel-toggle');
    const closeButton = document.getElementById('close-panel');
    const panel = document.getElementById('breakpoint-panel');

    if (panelToggleButton && closeButton && panel) {
        // Open panel
        panelToggleButton.addEventListener('click', function () {
            panel.classList.add('open');
        });

        // Close panel
        closeButton.addEventListener('click', function () {
            panel.classList.remove('open');
        });

        // Also close when clicking outside the panel
        document.addEventListener('click', function (event) {
            // If click is not on panel or toggle button and panel is open
            if (!panel.contains(event.target) &&
                !panelToggleButton.contains(event.target) &&
                panel.classList.contains('open')) {
                panel.classList.remove('open');
            }
        });
    }

    // Debug console panel toggle functionality
    const debugPanelToggleButton = document.getElementById('debug-panel-toggle');
    const closeDebugButton = document.getElementById('close-debug-panel');
    const debugPanel = document.getElementById('debug-panel');

    if (debugPanelToggleButton && closeDebugButton && debugPanel) {
        // Open panel
        debugPanelToggleButton.addEventListener('click', function () {
            debugPanel.classList.add('open');
        });

        // Close panel
        closeDebugButton.addEventListener('click', function () {
            debugPanel.classList.remove('open');
        });

        // Also close when clicking outside the panel
        document.addEventListener('click', function (event) {
            // If click is not on panel or toggle button and panel is open
            if (!debugPanel.contains(event.target) &&
                !debugPanelToggleButton.contains(event.target) &&
                debugPanel.classList.contains('open')) {
                debugPanel.classList.remove('open');
            }
        });
    }

    // Program loader panel toggle functionality
    const programPanelToggleButton = document.getElementById('program-panel-toggle');
    const closeProgramButton = document.getElementById('close-program-panel');
    const programPanel = document.getElementById('program-panel');

    if (programPanelToggleButton && closeProgramButton && programPanel) {
        // Open panel
        programPanelToggleButton.addEventListener('click', function () {
            programPanel.classList.add('open');
        });

        // Close panel
        closeProgramButton.addEventListener('click', function () {
            programPanel.classList.remove('open');
        });

        // Also close when clicking outside the panel
        document.addEventListener('click', function (event) {
            // If click is not on panel or toggle button and panel is open
            if (!programPanel.contains(event.target) &&
                !programPanelToggleButton.contains(event.target) &&
                programPanel.classList.contains('open')) {
                programPanel.classList.remove('open');
            }
        });
    }

    // Add clear breakpoints button handler
    document.getElementById('clear-breakpoints-button').addEventListener('click', function () {
        cpu.clearAllBreakpoints();
        console.log("All breakpoints cleared");
        updateStatusBar("Ready", "All breakpoints cleared");

        // Force complete UI refresh
        updateUI();
    });

    // Load example program from the input box
    const exampleProgram = document.getElementById('program-input');
    if (!exampleProgram.value) {
        exampleProgram.value = "86 05 97 10 86 03 6B 10 27 01 97 20 01";
    }

    // Initialize UI and status bar
    updateUI();
});
