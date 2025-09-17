let currentInput = '0';
let previousInput = '';
let operator = '';
let waitingForOperand = false;

const timeElement = document.getElementById('time');

function updateDisplay() {
    document.getElementById('display-text').textContent = currentInput;
}

// Voice recognition setup with Gemini API
const micButton = document.getElementById('mic-icon');
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let isProcessing = false;
const GEMINI_API_KEY = 'AIzaSyDBUzXpRgeaRlHuM0KYrOlTA4vwtu68p50';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

micButton.addEventListener('click', async () => {
    if (isProcessing || isRecording) return; // Prevent multiple clicks
    await startRecording();
});



async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            isProcessing = true;
            await processAudioWithGemini(audioBlob);
            isProcessing = false;
            // Stop all tracks to release the microphone
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        micButton.classList.add('listening');

        // Auto-stop after 3 seconds
        setTimeout(() => {
            if (isRecording) {
                stopRecording();
            }
        }, 3000);
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Microphone access denied or not available.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        micButton.classList.remove('listening');
    }
}

async function processAudioWithGemini(audioBlob) {
    try {
        // Convert blob to base64
        const base64Audio = await blobToBase64(audioBlob);

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: "Parse the spoken calculator commands from this audio and return only the sequence of calculator operations as a space-separated string (e.g., '5 + 3 ='). Supported operations: digits 0-9, +, -, *, /, =, AC, +/-, %, ."
                        },
                        {
                            inline_data: {
                                mime_type: "audio/wav",
                                data: base64Audio
                            }
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        const generatedText = data.candidates[0].content.parts[0].text.trim();
        console.log('Gemini response:', generatedText);

        // Parse the response and simulate button presses
        processGeminiResponse(generatedText);

    } catch (error) {
        console.error('Error processing audio with Gemini:', error);
        alert('Error processing voice command. Please try again.');
    }
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function processGeminiResponse(responseText) {
    // Clean and split the response
    const cleanedResponse = responseText.replace(/[^0-9+\-*/=AC.%\s]/g, '').trim();
    const tokens = cleanedResponse.split(/\s+/);

    // Map of possible inputs
    const validInputs = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '*', '/', '=', 'AC', '+/-', '%', '.'];

    tokens.forEach(token => {
        if (validInputs.includes(token)) {
            const button = document.querySelector(`button[data-value="${token}"]`);
            if (button) {
                button.click();
            } else {
                console.log('Unrecognized token:', token);
            }
        } else if (/^\d+$/.test(token)) {
            // Multi-digit number, input each digit
            for (let digit of token) {
                inputNumber(digit);
            }
        } else {
            console.log('Invalid token:', token);
        }
    });
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
