// 1. Dark Mode Toggle
document.getElementById("darkModeBtn").addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
});

// 2. Random Quote Generator
const quotes = [
    "Stay strong, stay positive!",
    "The best way to predict the future is to create it.",
    "Believe in yourself and all that you are!",
    "Success is not final, failure is not fatal."
];
document.getElementById("quoteBtn").addEventListener("click", function() {
    alert(quotes[Math.floor(Math.random() * quotes.length)]);
});

// 3. Countdown Timer
let timeLeft = 10;
const countdownElement = document.getElementById("timer");

function startCountdown() {
    const interval = setInterval(() => {
        timeLeft--;
        countdownElement.textContent = timeLeft;

        if (timeLeft === 0) {
            clearInterval(interval);
            alert("Time's up!");
        }
    }, 1000);
}
startCountdown();

// 4. Animation Trigger
document.getElementById("animateBtn").addEventListener("click", function() {
    document.querySelector(".animated-box").style.backgroundColor = "blue";
});

// 5. Matrix Rain Effect
function startMatrixRain() {
    const canvas = document.createElement('canvas');
    canvas.id = "matrixRain";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "-1";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
    const lettersArray = letters.split("");
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(0);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#0F0";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < columns; i++) {
            const text = lettersArray[Math.floor(Math.random() * lettersArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 33);
}
startMatrixRain();

// 6. Feedback Form Submission
document.getElementById("contactForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const message = document.getElementById("message").value;

    if (name && message) {
        alert(`Thank you, ${name}! Your message has been received.`);
    } else {
        alert("Please fill in all fields.");
    }
});
