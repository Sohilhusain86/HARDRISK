// 1. Dark Mode Toggle
document.getElementById("darkModeBtn").addEventListener("click", function() {
    document.body.classList.toggle("dark-mode");
});

// 2. Random Quote Generator
const quotes = [
    "اَلسَّلاَمْ عَلَيْــــــــــــــــــــكُمْا وَ رَحْمَةُ اللَّهِ وَبَرَكَاتُهُ",
    "اللہ پر بھروسہ:
"اور جو اللہ پر بھروسہ کرے تو وہ اسے کافی ہے۔"
(سورۃ الطلاق: 3).",
    "اللہ کی رحمت:
"بیشک اللہ کی رحمت نیکی والوں کے قریب ہے۔"
(سورۃ الاعراف: 56)",
    "صبر کی فضیلت:
"بیشک اللہ صبر والوں کے ساتھ ہے۔"
(سورۃ البقرہ: 153)."
    "دلوں کا سکون:
"سن لو! اللہ ہی کے ذکر سے دلوں کو چین ملتا ہے۔"
(سورۃ الرعد: 28)."
    "اللہ کی مدد:
"اور مدد نہیں مگر اللہ کی طرف سے۔"
(سورۃ الانفال: 10)."
    "دنیا کی حقیقت:
"اور دنیا کی زندگی تو نہیں مگر کھیل کود اور بیشک پچھلا گھر (آخرت) ہی اصل زندگی ہے۔"
(سورۃ العنکبوت: 64)."
    "استغفار کی برکت:
"اور اپنے رب سے بخشش مانگو پھر اس کی طرف رجوع کرو، بیشک میرا رب مہربان محبت والا ہے۔"
(سورۃ ہود: 90)."
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
startCountdown(5);const 

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
