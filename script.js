// Advanced JavaScript Script for HARDRISK Website
// This script provides dynamic UI features, animations, asynchronous behavior, and keyboard shortcuts.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Website loaded successfully!");

    // =====================================================
    // 1. Fade-In Effect for the Entire Page
    // =====================================================
    (function fadeInPage() {
        let opacity = 0;
        const fadeInterval = setInterval(() => {
            if (opacity >= 1) {
                clearInterval(fadeInterval);
            }
            document.body.style.opacity = opacity;
            opacity += 0.05;
        }, 50);
    })();

    // =====================================================
    // 2. Dynamic Text Rotation
    // =====================================================
    // Ensure that your index.html has an element with id "dynamic-text"
    const dynamicTextEl = document.getElementById('dynamic-text');
    const phrases = [
        "🚀 Welcome to HARDRISK!",
        "🌟 High-level JavaScript in action!",
        "🎭 Experience interactive magic!",
        "💡 Creativity meets code!"
    ];
    let phraseIndex = 0;
    if (dynamicTextEl) {
        dynamicTextEl.textContent = phrases[phraseIndex];
        setInterval(() => {
            phraseIndex = (phraseIndex + 1) % phrases.length;
            dynamicTextEl.textContent = phrases[phraseIndex];
        }, 3000);
    }

    // =====================================================
    // 3. Dark Mode Toggle with Persistent Storage
    // =====================================================
    // Ensure that index.html contains a button with id "darkModeBtn"
    const darkModeBtn = document.getElementById('darkModeBtn');
    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        // Save the state in localStorage so that it persists across sessions
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
        } else {
            localStorage.setItem('darkMode', 'disabled');
        }
    }
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', toggleDarkMode);
    }
    // Apply dark mode based on previous setting
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // =====================================================
    // 4. Countdown Timer (10 seconds)
    // =====================================================
    // Ensure index.html has an element with id "countdown"
    const countdownEl = document.getElementById('countdown');
    let timeLeft = 10;
    if (countdownEl) {
        countdownEl.textContent = `⏳ Countdown: ${timeLeft} sec`;
        const countdownInterval = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) {
                countdownEl.textContent = `⏳ Countdown: ${timeLeft} sec`;
            } else {
                countdownEl.textContent = "🚀 Time's Up!";
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    // =====================================================
    // 5. Random Quote Generator with Asynchronous Simulation
    // =====================================================
    // Ensure index.html has a button with id "quoteBtn"
    const quotes = [
        "💡 Believe in yourself!",
        "🚀 The best is yet to come.",
        "🔥 Never give up!",
        "🌟 Stay positive and work hard!",
        "🎯 Success is a journey, not a destination!"
    ];
    const quoteBtn = document.getElementById('quoteBtn');
    if (quoteBtn) {
        quoteBtn.addEventListener('click', () => {
            // Simulate an asynchronous operation using a promise
            new Promise((resolve) => {
                setTimeout(() => {
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    resolve(randomQuote);
                }, 200);
            }).then((quote) => {
                alert(`Quote: "${quote}"`);
            }).catch((err) => {
                console.error("Error fetching quote:", err);
            });
        });
    }

    // =====================================================
    // 6. Interactive Button Animation
    // =====================================================
    // Ensure index.html has a button with id "animateBtn"
    const animateBtn = document.getElementById('animateBtn');
    if (animateBtn) {
        animateBtn.addEventListener('click', () => {
            animateBtn.style.transition = "transform 0.3s ease";
            animateBtn.style.transform = "scale(1.2)";
            setTimeout(() => {
                animateBtn.style.transform = "scale(1)";
                alert("🎉 Button clicked! Animation complete.");
            }, 300);
        });
    }

    // =====================================================
    // 7. Visitor Greeting Based on Time
    // =====================================================
    // Ensure index.html has an element with id "greeting"
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) {
        const currentHour = new Date().getHours();
        if (currentHour < 12) {
            greetingEl.innerHTML = "🌅 Good Morning! अस्सलामु अलैकुम!";
        } else if (currentHour < 18) {
            greetingEl.innerHTML = "🌞 Good Afternoon! अस्सलामु अलैकुम!";
        } else {
            greetingEl.innerHTML = "🌙 Good Evening! अस्सलामु अलैकुम!";
        }
    }

    // =====================================================
    // 8
