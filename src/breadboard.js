document.addEventListener('DOMContentLoaded', function () {
    // Initialize CPU
    const cpu = new M6800();
    cpu.reset();
    console.log("CPU initialized");
    updateStatusBar("Ready", "System initialized");

    // Track current memory address for manual programming
    let currentMemoryAddress = 0;

    // Add a variable to track if we're paused at a breakpoint
    let pausedAtBreakpoint = false;

    // Add a variable to track if program is currently running
    let programRunning = false;

    // Function to update the status bar
    function updateStatusBar(status, message) {
        const statusIndicatorDot = document.getElementById('status-indicator-dot');
        const statusLabel = document.getElementById('status-label');
        const statusMessage = document.getElementById('status-message');

        statusLabel.textContent = status;
        statusMessage.textContent = message;

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
        // ...existing code for execute button...
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
