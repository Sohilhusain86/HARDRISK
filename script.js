document.addEventListener("DOMContentLoaded", () => {
  // Advanced Countdown Timer
  function updateCountdown() {
    // लक्ष्य तिथि सेट करें (उदाहरण: 21 अप्रैल 2025, ईद की तारीख)
    const targetDate = new Date("2025-04-2T00:00:00").getTime();
    const now = Date.now();
    const distance = targetDate - now;

    const countdownEl = document.getElementById("countdown");
    if (!countdownEl) return;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      countdownEl.textContent = `${days} دن ${hours} گھنٹے ${minutes} منٹ ${seconds} سیکنڈ`;
    } else {
      countdownEl.textContent = "عید مبارک! 🎉";
    }
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Scroll Reveal Animation: पृष्ठ स्क्रॉल पर एनिमेशन दिखाएं
  const revealElements = document.querySelectorAll(".animate");
  function revealOnScroll() {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) {
        el.classList.add("show");
      }
    });
  }
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();

  // Dark Mode Toggle (यदि आपके HTML में dark mode टॉगल बटन है)
  const darkModeToggle = document.getElementById("darkModeToggle");
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }

  // Smooth Scrolling for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Additional Feature: Hide/Show Navigation Bar on Scroll
  let lastScrollY = window.pageYOffset;
  const navBar = document.querySelector("header");
  window.addEventListener("scroll", () => {
    const currentScrollY = window.pageYOffset;
    if (currentScrollY < lastScrollY) {
      // ऊपर स्क्रॉल करने पर नेव बार दिखाएं
      navBar.style.top = "0";
    } else {
      // नीचे स्क्रॉल करने पर नेव बार छिपा दें
      navBar.style.top = "-80px";
    }
    lastScrollY = currentScrollY;
  });

  // Debugging: सुनिश्चित करें कि स्क्रिप्ट लोड हो गई
  console.log("Advanced interactive script loaded successfully.");
});
