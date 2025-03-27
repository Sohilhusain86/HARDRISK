<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="HARDRISK - Experience the power of modern JavaScript. Interactive quotes, animations, countdown, dark mode, and more!">
    <meta name="keywords" content="JavaScript, HARDRISK, Interactive Web, Dark Mode, Quotes, Countdown, Animations">
    <meta name="author" content="Sohil Husain">
    
    <!-- Open Graph Meta Tags for Social Sharing -->
    <meta property="og:title" content="HARDRISK - Explore JavaScript Power!">
    <meta property="og:description" content="An interactive website built with modern JavaScript features like Dark Mode, Quotes, Animations & Countdown Timer!">
    <meta property="og:image" content="https://yourwebsite.com/preview-image.jpg">
    <meta property="og:url" content="https://sohilhusain86.github.io/HARDRISK/">
    
    <!-- Favicon -->
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    
    <!-- External CSS -->
    <link rel="stylesheet" href="style.css">
    
    <!-- Internal CSS for quick styling -->
    <style>
        /* Smooth transition effects */
        body { 
            transition: opacity 0.5s, background-color 0.5s, color 0.5s;
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
        }
        h1, h2 { margin-bottom: 15px; }
        .dark-mode { background-color: #121212; color: white; }
        button { 
            margin: 10px; 
            padding: 10px 15px; 
            cursor: pointer; 
            font-size: 16px;
        }
        .container {
            max-width: 800px;
            margin: auto;
            padding: 20px;
            border: 2px solid gray;
            border-radius: 10px;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
            background-color: #f9f9f9;
        }
        .dark-mode .container {
            background-color: #1e1e1e;
            border-color: white;
        }
        /* Animated Elements */
        .animated-box {
            width: 100px;
            height: 100px;
            background: red;
            position: relative;
            animation: moveBox 3s infinite alternate;
        }
        @keyframes moveBox {
            0% { left: 0; }
            100% { left: 200px; }
        }
    </style>
</head>

<body>
    <h1 id="greeting">Loading Greeting...</h1>
    <h2 id="dynamic-text">Loading dynamic text...</h2>

    <div class="container">
        <p><strong>Welcome to HARDRISK!</strong> Explore the power of interactive JavaScript.</p>

        <!-- Dark Mode Toggle -->
        <button id="darkModeBtn">Toggle Dark Mode</button>

        <!-- Random Quote Generator -->
        <button id="quoteBtn">Show Random Quote</button>

        <!-- Countdown Timer -->
        <div id="countdown">⏳ Countdown: 10 sec</div>

        <!-- Interactive Button Animation -->
        <button id="animateBtn">Click for Animation!</button>
        
        <!-- Animated Box -->
        <div class="animated-box"></div>
        // =============================================
// 10. Matrix Rain Effect (Advanced Background Animation)
// =============================================
function startMatrixRain() {
    // Create a full-screen canvas element and append it as the background
    const canvas = document.createElement('canvas');
    canvas.id = "matrixRain";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "-1"; // behind all other content
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    // Set canvas dimensions equal to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Characters to display
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()*&^%";
    const lettersArray = letters.split("");
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    // Initialize drops array: one drop per column
    const drops = Array(columns).fill(0);

    function draw() {
        // Fill the canvas with a translucent black background to create trail effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Set text color and font
        ctx.fillStyle = "#0F0"; // bright green
        ctx.font = fontSize + "px monospace";

        // Draw a random letter at each drop's position
        for (let i = 0; i < columns; i++) {
            const text = lettersArray[Math.floor(Math.random() * lettersArray.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            // Reset drop to top randomly after reaching bottom
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 33);
}

// Start the Matrix Rain Effect
startMatrixRain();

        <!-- Form for Additional Interactions -->
        <form id="contactForm">
            <h3>Feedback Form</h3>
            <label for="name">Name:</label>
            <input type="text" id="name" required>
            
            <label for="message">Message:</label>
            <textarea id="message" required></textarea>
            
            <button type="submit">Send Feedback</button>
        </form>

        <!-- Real-Time Clock -->
        <div id="clock">⏰ Time: Loading...</div>
    </div>

    <!-- JavaScript File -->
    <script src="script.js"></script>
    
    <!-- Inline Script for Real-Time Clock -->
    <script>
        function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    document.getElementById('clock').textContent = `⏰ Time: ${hours}:${minutes}:${seconds}`;
}
setInterval(updateClock, 1000);
        setInterval(updateClock, 1000);
</script>
<script src="script.js"></script> 
</body>
</html>
