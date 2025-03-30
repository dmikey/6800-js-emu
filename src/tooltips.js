/**
 * Custom HTML tooltips for 6800 CPU flags and other UI elements
 */
document.addEventListener('DOMContentLoaded', function () {
    // Create tooltip container once
    const tooltipContainer = document.createElement('div');
    tooltipContainer.className = 'custom-tooltip';
    tooltipContainer.style.display = 'none';
    document.body.appendChild(tooltipContainer);

    // CPU flag tooltips
    const flagTooltips = {
        'Z': 'Zero Flag - Set when the result of the last operation was zero',
        'N': 'Negative Flag - Set when the result of the last operation had bit 7 set (negative value)',
        'C': 'Carry Flag - Set when the last operation produced a carry from bit 7 or a borrow into bit 7',
        'V': 'Overflow Flag - Set when the last operation caused a signed overflow (result exceeds signed range)',
        'H': 'Half-Carry Flag - Set when the last operation caused a carry from bit 3 to bit 4 (used for BCD arithmetic)',
        'I': 'Interrupt Mask Flag - When set, maskable interrupts are disabled'
    };

    // Register tooltips
    const registerTooltips = {
        'Accumulator A:': '8-bit general purpose register, used for arithmetic and logic operations',
        'Accumulator B:': '8-bit general purpose register, used for arithmetic and logic operations',
        'Index Register X:': '16-bit index register, often used for indexed addressing modes',
        'Program Counter:': 'Points to the next instruction to be executed',
        'Stack Pointer:': 'Points to the current top of the stack in memory'
    };

    // Button tooltips
    const buttonTooltips = {
        'load-button': 'Load data from the switches into the selected register',
        'execute-button': 'Execute the single instruction at the current program counter',
        'execute-all-button': 'Run the program until completion or a breakpoint is hit',
        'continue-button': 'Continue execution after hitting a breakpoint',
        'reset-button': 'Reset CPU registers to initial state',
        'full-reset-button': 'Reset CPU and clear all memory',
        'dump-memory': 'Print memory contents to the debug console',
        'store-to-memory': 'Store the value from the data switches to the currently selected memory address',
        'clear-breakpoints-button': 'Remove all breakpoints'
    };

    // Function to show tooltip
    function showTooltip(text, event) {
        tooltipContainer.textContent = text;
        tooltipContainer.style.display = 'block';

        // Position the tooltip with an offset from the cursor
        const offset = 15;
        tooltipContainer.style.left = (event.pageX + offset) + 'px';
        tooltipContainer.style.top = (event.pageY + offset) + 'px';
    }

    // Function to hide tooltip
    function hideTooltip() {
        tooltipContainer.style.display = 'none';
    }

    // Apply tooltips to CPU flags
    document.querySelectorAll('.flag label').forEach(label => {
        const flagName = label.textContent.trim().replace(':', '');
        if (flagTooltips[flagName]) {
            label.style.cursor = 'help';

            label.addEventListener('mouseover', function (event) {
                showTooltip(flagTooltips[flagName], event);
            });

            label.addEventListener('mouseout', hideTooltip);

            // Update tooltip position on mouse move
            label.addEventListener('mousemove', function (event) {
                const offset = 15;
                tooltipContainer.style.left = (event.pageX + offset) + 'px';
                tooltipContainer.style.top = (event.pageY + offset) + 'px';
            });
        }
    });

    // Apply tooltips to registers
    document.querySelectorAll('.register label').forEach(label => {
        const regName = label.textContent.trim();
        if (registerTooltips[regName]) {
            label.style.cursor = 'help';

            label.addEventListener('mouseover', function (event) {
                showTooltip(registerTooltips[regName], event);
            });

            label.addEventListener('mouseout', hideTooltip);

            // Update tooltip position on mouse move
            label.addEventListener('mousemove', function (event) {
                const offset = 15;
                tooltipContainer.style.left = (event.pageX + offset) + 'px';
                tooltipContainer.style.top = (event.pageY + offset) + 'px';
            });
        }
    });

    // Apply tooltips to buttons
    Object.keys(buttonTooltips).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.cursor = 'pointer';

            button.addEventListener('mouseover', function (event) {
                showTooltip(buttonTooltips[buttonId], event);
            });

            button.addEventListener('mouseout', hideTooltip);

            // Update tooltip position on mouse move
            button.addEventListener('mousemove', function (event) {
                const offset = 15;
                tooltipContainer.style.left = (event.pageX + offset) + 'px';
                tooltipContainer.style.top = (event.pageY + offset) + 'px';
            });
        }
    });
});
