/******************************************************
 * ADVANCED PRO-LEVEL SCRIPT (script.js)
 * With multiple features: countdown, scroll reveal,
 * smooth scroll, nav hide, dark mode toggle, user greeting,
 * random BG color, random quotes, console debug logs.
 ******************************************************/
document.addEventListener("DOMContentLoaded", () => {
  console.log("Pro-level script loaded successfully. 😎");

  /****************************************
   * 1. DARK MODE TOGGLE (with localStorage)
   ****************************************/
  const body = document.body;
  const darkToggleBtn = document.getElementById("darkModeToggle"); // e.g. <button id="darkModeToggle">Dark Mode</button>

  // Check localStorage for dark mode preference
  const storedTheme = localStorage.getItem("darkThemeEnabled");
  if (storedTheme === "true") {
    body.classList.add("dark-mode");
    console.log("Dark mode enabled from localStorage.");
  }

  if (darkToggleBtn) {
    darkToggleBtn.addEventListener("click", () => {
      body.classList.toggle("dark-mode");
      // Save preference in localStorage
      localStorage.setItem("darkThemeEnabled", body.classList.contains("dark-mode"));
      console.log("Dark mode toggled. Current state:", body.classList.contains("dark-mode"));
    });
  }

  /****************************************
   * 2. COUNTDOWN TIMER (e.g. for Eid)
   ****************************************/
  function updateCountdown() {
    // Adjust your date/time as needed:
    const eidDate = new Date("2025-04-21T00:00:00").getTime();
    const now = Date.now();
    const diff = eidDate - now;
    const cdElement = document.getElementById("countdown"); // e.g. <span id="countdown"></span>

    if (!cdElement) return; // If there's no countdown element, skip.

    if (diff > 0) {
      let days = Math.floor(diff / (1000 * 60 * 60 * 24));
      let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((diff % (1000 * 60)) / 1000);
      cdElement.textContent = `${days} دن ${hours} گھنٹے ${minutes} منٹ ${seconds} سیکنڈ`;
    } else {
      cdElement.textContent = "عید مبارک! 🎉";
    }
  }
  setInterval(updateCountdown, 1000);
  updateCountdown();

  /****************************************
   * 3. SCROLL REVEAL ANIMATION
   ****************************************/
  const revealEls = document.querySelectorAll(".animate"); 
  function revealOnScroll() {
    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 80) {
        el.classList.add("show");
      }
    });
  }
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();

  /****************************************
   * 4. SMOOTH SCROLLING FOR ANCHOR LINKS
   ****************************************/
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  /****************************************
   * 5. HIDE/SHOW NAVIGATION ON SCROLL
   ****************************************/
  let lastScrollY = window.pageYOffset;
  const navBar = document.querySelector("header"); // e.g. <header> ... </header>
  if (navBar) {
    window.addEventListener("scroll", () => {
      const currentScrollY = window.pageYOffset;
      if (currentScrollY < lastScrollY) {
        // User scrolling up => show nav
        navBar.style.top = "0";
      } else {
        // User scrolling down => hide nav
        navBar.style.top = "-80px";
      }
      lastScrollY = currentScrollY;
    });
  }

  /****************************************
   * 6. USER GREETING (with name input)
   ****************************************/
  const greetForm = document.getElementById("greetForm");   // e.g. <form id="greetForm">
  const greetInput = document.getElementById("greetName");  // e.g. <input id="greetName">
  const greetOutput = document.getElementById("greetOutput");// e.g. <div id="greetOutput">

  if (greetForm && greetInput && greetOutput) {
    greetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userName = greetInput.value.trim();
      if (userName) {
        greetOutput.textContent = `السلام علیکم, ${userName}! خوش آمدید.`;
      } else {
        greetOutput.textContent = "براہ کرم اپنا نام درج کریں۔";
      }
    });
  }

  /****************************************
   * 7. RANDOM BACKGROUND COLOR ON SCROLL
   ****************************************/
  let scrollColorChange = 0;
  window.addEventListener("scroll", () => {
    scrollColorChange += 1;
    // Slight color shift each time user scrolls
    const red = (scrollColorChange * 5) % 255;
    const green = (scrollColorChange * 3) % 255;
    const blue = (scrollColorChange * 7) % 255;
    // Body BG color or container BG color? Let's do container
    const container = document.querySelector(".container");
    if (container) {
      container.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, 0.1)`;
    }
  });

  /****************************************
   * 8. RANDOM ISLAMIC QUOTES
   ****************************************/
  const quotes = [
    "من صام رمضان إيمانا واحتسابا غفر له ما تقدم من ذنبه (Bukhari)",
    "الدين النصيحة (Muslim)",
    "الدنيا سجن المؤمن وجنة الكافر (Muslim)",
    "خيركم من تعلم القرآن وعلمه (Bukhari)",
    "المرء مع من أحب (Bukhari)",
  ];
  const quoteBtn = document.getElementById("randomQuoteBtn"); // e.g. <button id="randomQuoteBtn">Show Quote</button>
  const quoteDisplay = document.getElementById("randomQuoteDisplay"); // e.g. <div id="randomQuoteDisplay"></div>

  if (quoteBtn && quoteDisplay) {
    quoteBtn.addEventListener("click", () => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      quoteDisplay.textContent = quotes[randomIndex];
    });
  }

  console.log("All advanced features are initialized. Enjoy!");
});
