import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  if (window.__DIRECT_LOGIN_ENGINE__) return;
  window.__DIRECT_LOGIN_ENGINE__ = true;

  // Firebase कॉन्फ़िगरेशन
  const firebaseConfig = {
    apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
    authDomain: "ula-alif.firebaseapp.com",
    databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
    projectId: "ula-alif",
    storageBucket: "ula-alif.firebasestorage.app",
    messagingSenderId: "693272422991",
    appId: "1:693272422991:web:081c07b083e3549b0dd83a"
  };

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  window.selectedDpUrl = "";

  // 1. डीपी अपलोड लॉजिक (Cloudinary)
  window.compressAndUploadImage = async function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } 
          else if (h > maxDim) { h = Math.round((h * maxDim) / h); h = maxDim; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("इमेज प्रोसेस विफल"));
            const compressedFile = new File([blob], `dp_${Date.now()}.jpg`, { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("upload_preset", "jamia_dp");
            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/xgkhockl/image/upload", { method: "POST", body: formData });
              const data = await res.json();
              if (data.secure_url) resolve(data.secure_url);
              else reject(new Error(data.error?.message || "क्लाउडिनरी अपलोड त्रुटि"));
            } catch (err) { reject(err); }
          }, "image/jpeg", 0.75);
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  function initDp() {
    const fileInput = document.getElementById("dp-file-input");
    const preview = document.getElementById("dp-preview-box");
    if (fileInput) {
      fileInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (preview) { preview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`; preview.style.opacity = "0.6"; }
        try {
          const url = await window.compressAndUploadImage(file);
          window.selectedDpUrl = url;
          if (preview) { preview.style.backgroundImage = `url('${url}')`; preview.style.opacity = "1"; }
        } catch (err) {
          alert("डीपी अपलोड विफल: " + err.message);
        }
      };
    }
  }

  // 2. डायरेक्ट लॉगिन (बिना किसी OTP के)
  function initAuthButton() {
    const btn = document.getElementById("btn-action-auth");
    const otpSection = document.getElementById("otp-section");
    
    // OTP इनपुट छुपाएं और बटन का नाम सीधा लॉगिन करें
    if (otpSection) otpSection.style.display = "none";
    if (btn) btn.textContent = "🚀 मैसेंजर में प्रवेश करें";

    if (!btn) return;

    btn.onclick = async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("user-name");
      const phoneInput = document.getElementById("user-phone");
      const rollInput = document.getElementById("user-roll");
      const passInput = document.getElementById("user-pass");

      const name = nameInput?.value.trim();
      const rawPhone = phoneInput?.value.replace(/[^0-9]/g, "") || "";
      const phone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";
      const roll = rollInput?.value.trim() || "";
      const pass = passInput?.value.trim() || "";

      if (!name) { 
        alert("कृपया अपना नाम दर्ज करें!"); 
        nameInput?.focus();
        return; 
      }
      if (phone10.length !== 10) { 
        alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!"); 
        phoneInput?.focus();
        return; 
      }

      btn.disabled = true;
      btn.textContent = "⏳ लॉगिन हो रहा है...";

      try {
        // Firebase अनाम ऑथेंटिकेशन (या सीधा UID जनरेशन)
        let uid = `user_${phone10}`;
        try {
          const cred = await signInAnonymously(auth);
          if (cred?.user?.uid) uid = cred.user.uid;
        } catch (authErr) {
          console.warn("Auth bypass used:", authErr);
        }

        // Firebase डेटाबेस में यूज़र डेटा सुरक्षित करना
        const userRef = ref(db, `users/${phone10}`);
        await update(userRef, {
          uid: uid,
          name: name,
          phone: phone10,
          roll: roll,
          status: "online",
          lastSeen: Date.now(),
          ...(window.selectedDpUrl ? { dpUrl: window.selectedDpUrl } : {})
        });

        // लोकल स्टोरेज में सेशन सुरक्षित करना
        window.currentUser = {
          uid: uid,
          name: name,
          phone: phone10,
          roll: roll,
          role: pass === "razavi123" ? "admin" : "student",
          dpUrl: window.selectedDpUrl || ""
        };
        localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

        // स्क्रीन खोलना
        const loginScreen = document.getElementById("login-screen");
        if (loginScreen) loginScreen.style.display = "none";
        document.body.classList.add("logged-in");

        alert("स्वागत है! आप सफलतापूर्वक लॉगिन हो चुके हैं।");
        location.reload();

      } catch (err) {
        btn.disabled = false;
        btn.textContent = "🚀 मैसेंजर में प्रवेश करें";
        alert("लॉगिन में त्रुटि: " + err.message);
      }
    };
  }

  // 3. पहले से लॉगिन यूज़र को सीधे अंदर भेजना
  function checkSession() {
    const saved = localStorage.getItem("jamia_chat_saved_user");
    const loginScreen = document.getElementById("login-screen");
    if (saved) {
      try {
        window.currentUser = JSON.parse(saved);
        if (loginScreen) loginScreen.style.display = "none";
        document.body.classList.add("logged-in");
      } catch (e) {}
    }
  }

  function start() {
    checkSession();
    initDp();
    initAuthButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
