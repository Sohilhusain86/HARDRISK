document.addEventListener('DOMContentLoaded', () => {
    console.log("Website loaded successfully!");

    // 🌟 1. Dynamic Fade-in Effect
    let opacity = 0;
    const fadeInInterval = setInterval(() => {
        if (opacity >= 1) clearInterval(fadeInInterval);
        document.body.style.opacity = opacity;
        opacity += 0.05;
    }, 50);

    // 🌟 2. Dynamic Text Rotation
    const dynamicTextElement = document.getElementById('dynamic-text');
    const phrases = [
        "🚀 मेरी वेबसाइट पर आपका स्वागत है!",
        "🌟 High-level JavaScript in action!",
        "🎭 Experience the power of modern JS!"
    ];
    let currentPhraseIndex = 0;
    setInterval(() => {
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        dynamicTextElement.textContent = phrases[currentPhraseIndex];
    }, 3000);

    // 🌟 3. Dark Mode Toggle
    const darkModeBtn = document.getElementById('darkModeBtn');
    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // 🌟 4. Countdown Timer (10 seconds)
    const countdownElement = document.getElementById('countdown');
    let countdownTime = 10;
    const countdownInterval = setInterval(() => {
        countdownElement.textContent = countdownTime > 0 ? `⏳ Countdown: ${countdownTime} sec` : "🚀 Time's Up!";
        countdownTime--;
        if (countdownTime < 0) clearInterval(countdownInterval);
    }, 1000);

    // 🌟 5. Random Quote Generator
    const quotes = [
        "💡 Believe in yourself!",
        "🚀 The best is yet to come.",
        "🔥 Never give up!",
        "🌟 Stay positive and work hard!"
    ];
    const quoteBtn = document.getElementById('quoteBtn');
    quoteBtn.addEventListener('click', () => {
        alert(quotes[Math.floor(Math.random() * quotes.length)]);
    });

    // 🌟 6. Interactive Button Animation
    const animateBtn = document.getElementById('animateBtn');
    animateBtn.addEventListener('click', () => {
        animateBtn.style.transform = "scale(1.2)";
        setTimeout(() => {
            animateBtn.style.transform = "scale(1)";
        }, 300);
    });

    // 🌟 7. Visitor Greeting Based on Time
    const greetingElement = document.getElementById('greeting');
    const hours = new Date().getHours();
    if (hours < 12) {
        greetingElement.innerHTML = "🌅 अस्सलामु अलैकुम! सुबह की मुबारकबाद! ☀️";
    } else if (hours < 18) {
        greetingElement.innerHTML = "🌞 अस्सलामु अलैकुम! दोपहर मुबारक! 🔥";
    } else {
        greetingElement.innerHTML = "🌙 अस्सलामु अलैकुम! रात मुबारक! ✨";
    }

    // 🌟 8. Scroll Animation Effect
    window.addEventListener('scroll', () => {
        document.body.style.backgroundColor = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    });

    // 🌟 9. Keyboard Shortcut Feature (Press 'D' for Dark Mode)
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'd') {
            document.body.classList.toggle('dark-mode');
        }
    });

});
document.addEventListener('DOMContentLoaded', () => {
    console.log("Website loaded successfully!");

    // 1. Tab key behavior toggle using Ctrl + Shift + M
    let tabMovesFocus = true; 
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'm') {
            tabMovesFocus = !tabMovesFocus;
            console.log(`Tab key moves focus: ${tabMovesFocus}`);
        }

        // 2. Move to the next interactive element using Esc + Tab
        if (event.key === "Tab" && event.altKey) {
            event.preventDefault();
            const focusableElements = document.querySelectorAll('button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])');
            const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
            const nextIndex = (currentIndex + 1) % focusableElements.length;
            focusableElements[nextIndex].focus();
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    console.log("Website loaded successfully!");

    // 1. Dynamic Fade-in Effect
    let opacity = 0;
    const fadeInInterval = setInterval(() => {
        if (opacity >= 1) {
            clearInterval(fadeInInterval);
        }
        document.body.style.opacity = opacity;
        opacity += 0.05;
    }, 50);

    // 2. Dynamic Text Rotation
    const dynamicTextElement = document.getElementById('dynamic-text');
    const phrases = [
        "High-level JavaScript in action!",
        "Experience the power of modern JS!"
    ];
    let currentPhraseIndex = 0;
    if (dynamicTextElement) {
        dynamicTextElement.textContent = phrases[currentPhraseIndex];
        setInterval(() => {
            currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
            dynamicTextElement.textContent = phrases[currentPhraseIndex];
        }, 3000);
    }

    // 3. Dark Mode Toggle
    const darkModeBtn = document.getElementById('darkModeBtn');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
        });
    }

    // 4. Countdown Timer (10 seconds)
    const countdownElement = document.getElementById('countdown');
    let countdownTime = 10;
    if (countdownElement) {
        countdownElement.textContent = `Countdown: ${countdownTime} sec`;
        const countdownInterval = setInterval(() => {
            countdownTime--;
            if (countdownTime > 0) {
                countdownElement.textContent = `Countdown: ${countdownTime} sec`;
            } else {
                countdownElement.textContent = "Time's Up!";
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    // 5. Random Quote Generator
    const quotes = [
        "Believe in yourself!",
        "The best is yet to come.",
        "Never give up!",
        "Stay positive and work hard!"
    ];
    const quoteBtn = document.getElementById('quoteBtn');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', () => {
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            alert(randomQuote);
        });
    }

    // 6. Interactive Button Animation
    const animateBtn = document.getElementById('animateBtn');
    if (animateBtn) {
        animateBtn.addEventListener('click', () => {
            animateBtn.style.transform = "scale(1.2)";
            setTimeout(() => {
                animateBtn.style.transform = "scale(1)";
                alert("Action performed!");
            }, 300);
        });
    }

    // 7. Visitor Greeting Based on Time
    const greetingElement = document.getElementById('greeting');
    if (greetingElement) {
        const hours = new Date().getHours();
        if (hours < 12) {
            greetingElement.innerHTML = "Good Morning! अस्सलामु अलैकुम!";
        } else if (hours < 18) {
            greetingElement.innerHTML = "Good Afternoon! अस्सलामु अलैकुम!";
        } else {
            greetingElement.innerHTML = "Good Evening! अस्सलामु अलैकुम!";
        }
    }

    // 8. Scroll Animation Effect - Random Background Color on Scroll
    window.addEventListener('scroll', () => {4
        document.body.style.backgroundColor = `rgb(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)})`;
    });

    // 9. Keyboard Shortcut Feature (Press 'd' for Dark Mode Toggle)
    document.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'd') {
            document.body.classList.toggle('dark-mode');
        }
    });
});
