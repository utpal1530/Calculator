let display = document.getElementById('display');
let currentInput = '0';
let previousInput = '';
let operator = '';
let waitingForOperand = false;

const timeElement = document.getElementById('time');

function updateDisplay() {
    display.textContent = currentInput;
}

function inputNumber(num) {
    if (waitingForOperand) {
        currentInput = num;
        waitingForOperand = false;
    } else {
        currentInput = currentInput === '0' ? num : currentInput + num;
    }
    updateDisplay();
}

function updateTime() {
    const options = { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' };
    const formatter = new Intl.DateTimeFormat([], options);
    const timeString = formatter.format(new Date());
    timeElement.textContent = timeString;
}

setInterval(updateTime, 1000);
updateTime();

function inputOperator(nextOperator) {
    const inputValue = parseFloat(currentInput);

    if (previousInput && waitingForOperand) {
        operator = nextOperator;
        return;
    }

    if (previousInput === '') {
        previousInput = inputValue;
    } else if (operator) {
        const result = calculate(previousInput, inputValue, operator);
        currentInput = String(result);
        previousInput = result;
    }

    waitingForOperand = true;
    operator = nextOperator;
    updateDisplay();
}

function calculate(firstValue, secondValue, operator) {
    switch (operator) {
        case '+':
            return firstValue + secondValue;
        case '-':
            return firstValue - secondValue;
        case '*':
            return firstValue * secondValue;
        case '/':
            return firstValue / secondValue;
        default:
            return secondValue;
    }
}

function inputDecimal() {
    if (waitingForOperand) {
        currentInput = '0.';
        waitingForOperand = false;
    } else if (currentInput.indexOf('.') === -1) {
        currentInput += '.';
    }
    updateDisplay();
}

function clear() {
    currentInput = '0';
    previousInput = '';
    operator = '';
    waitingForOperand = false;
    updateDisplay();
}

function negate() {
    currentInput = String(-parseFloat(currentInput));
    updateDisplay();
}

function percent() {
    currentInput = String(parseFloat(currentInput) / 100);
    updateDisplay();
}

function performCalculation() {
    const inputValue = parseFloat(currentInput);

    if (previousInput && operator) {
        const result = calculate(previousInput, inputValue, operator);
        currentInput = String(result);
        previousInput = '';
        operator = '';
        waitingForOperand = true;
    }
    updateDisplay();
}

const keySound = new Audio('key-press.mp3');

function playKeySound() {
    keySound.currentTime = 0;
    keySound.play();
}

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const value = e.target.dataset.value;
        playKeySound();

        if (value >= '0' && value <= '9') {
            inputNumber(value);
        } else if (value === '+' || value === '-' || value === '*' || value === '/') {
            inputOperator(value);
        } else if (value === '=') {
            performCalculation();
        } else if (value === '.') {
            inputDecimal();
        } else if (value === 'AC') {
            clear();
        } else if (value === '+/-') {
            negate();
        } else if (value === '%') {
            percent();
        }
    });
});

document.addEventListener('keydown', (event) => {
    const key = event.key;

    // Find the button element corresponding to the key pressed
    let button = null;
    if (key === 'Enter') {
        button = document.querySelector('button[data-value="="]');
    } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        button = document.querySelector('button[data-value="AC"]');
    } else if (key.toLowerCase() === 'n') {
        button = document.querySelector('button[data-value="+/-"]');
    } else {
        button = document.querySelector(`button[data-value="${key}"]`);
    }

    if (button) {
        // Add a highlight class to the button
        button.classList.add('active-keyboard');
        // Remove the highlight after a short delay
        setTimeout(() => {
            button.classList.remove('active-keyboard');
        }, 150);
    }

    if (key >= '0' && key <= '9') {
        inputNumber(key);
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        inputOperator(key);
    } else if (key === '=' || key === 'Enter') {
        performCalculation();
    } else if (key === '.') {
        inputDecimal();
    } else if (key === 'c' || key === 'C' || key === 'Escape') {
        clear();
    } else if (key === '%') {
        percent();
    } else if (key === 'n' || key === 'N') {
        negate();
    }
});
