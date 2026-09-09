/**
 * ============================================================================
 * 📲 JAMIA MESSENGER — PURE SERVER-TO-SERVER DIRECT AUTH ENGINE
 * File: SohelMsg91AuthSystem.js
 * ============================================================================
 */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  getDatabase, 
  ref, 
  get, 
  set, 
  update, 
  onDisconnect 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  if (window.__DIRECT_MSG91_ENGINE__) return;
  window.__DIRECT_MSG91_ENGINE__ = true;

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

  let isOtpStepActive = false;
  let activePhone10 = "";
  window.selectedDpUrl = "";

  // 1. Cloudinary Upload
  window.compressAndUploadImage = async function (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 800;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
          canvas.width = w;
          canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);

          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("इमेज प्रोसेस विफल"));
            const compressedFile = new File([blob], `dp_${Date.now()}.jpg`, { type: "image/jpeg" });
            const formData = new FormData();
            formData.append("file", compressedFile);
            formData.append("upload_preset", "jamia_dp");

            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/xgkhockl/image/upload", {
                method: "POST",
                body: formData
              });
              const data = await res.json();
              if (data.secure_url) resolve(data.secure_url);
              else reject(new Error(data.error?.message || "क्लाउडिनरी अस्वीकृत"));
            } catch (err) {
              reject(err);
            }
          }, "image/jpeg", 0.75);
        };
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 2. DP Binding
  function initDp() {
    const fileInput = document.getElementById("dp-file-input");
    const preview = document.getElementById("dp-preview-box");
    const icon = document.getElementById("dp-camera-icon");

    if (fileInput) {
      fileInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (preview) {
          preview.style.backgroundImage = `url('${URL.createObjectURL(file)}')`;
          preview.style.opacity = "0.6";
        }
        if (icon) icon.style.display = "none";

        try {
          const url = await window.compressAndUploadImage(file);
          window.selectedDpUrl = url;
          if (preview) {
            preview.style.backgroundImage = `url('${url}')`;
            preview.style.opacity = "1";
          }
        } catch (err) {
          alert("डीपी अपलोड विफल: " + err.message);
          if (preview) preview.style.opacity = "1";
        }
      };
    }
  }

  // 3. Direct Server Auth Flow
  function initAuthButton() {
    const btn = document.getElementById("btn-action-auth");
    if (!btn) return;

    btn.onclick = async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("user-name");
      const phoneInput = document.getElementById("user-phone");
      const otpInput = document.getElementById("otp-input");
      const otpSection = document.getElementById("otp-section");

      const rawPhone = phoneInput?.value.replace(/[^0-9]/g, "") || "";
      const phone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : "";

      if (phone10.length !== 10) {
        alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!");
        return;
      }
      activePhone10 = phone10;

      // STEP 1: डायरेक्ट API से SMS OTP भेजें
      if (!isOtpStepActive) {
        const name = nameInput?.value.trim();
        if (!name) {
          alert("कृपया अपना नाम दर्ज करें!");
          return;
        }

        btn.disabled = true;
        btn.textContent = "⏳ सर्वर से OTP भेजा जा रहा है...";

        try {
          const res = await fetch("/api/msg91/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: "91" + phone10 })
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            throw new Error(data.error || "SMS नहीं भेजा जा सका");
          }

          btn.disabled = false;
          btn.textContent = "OTP सत्यापित करें";
          isOtpStepActive = true;
          if (otpSection) otpSection.style.display = "block";
          if (phoneInput) phoneInput.disabled = true;
          alert(`✅ नंबर (+91 ${phone10}) पर SMS भेज दिया गया है।`);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "OTP भेजें (Send OTP)";
          alert("विफलता: " + err.message);
        }
        return;
      }

      // STEP 2: डायरेक्ट API से OTP चेक करें व लॉगिन करें
      const enteredOtp = otpInput?.value.trim();
      if (!enteredOtp || enteredOtp.length < 4) {
        alert("कृपया 4 अंकों का सही OTP दर्ज करें!");
        return;
      }

      btn.disabled = true;
      btn.textContent = "जाँचा जा रहा है...";

      try {
        const res = await fetch("/api/msg91/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: "91" + activePhone10, otp: enteredOtp })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "गलत OTP दर्ज किया गया");
        }

        // Firebase Sign In
        const userCredential = await signInWithCustomToken(auth, data.customToken);
        const firebaseUser = userCredential.user;

        const name = nameInput?.value.trim() || "छात्र";
        const roll = document.getElementById("user-roll")?.value.trim() || "";
        const pass = document.getElementById("user-pass")?.value.trim() || "";

        const userRef = ref(db, `users/${activePhone10}`);
        await update(userRef, {
          uid: firebaseUser.uid,
          name,
          roll,
          phone: activePhone10,
          status: "online",
          lastSeen: Date.now(),
          ...(window.selectedDpUrl ? { dpUrl: window.selectedDpUrl } : {})
        });

        window.currentUser = {
          uid: firebaseUser.uid,
          name,
          phone: activePhone10,
          roll,
          role: pass === "razavi123" ? "admin" : "student",
          dpUrl: window.selectedDpUrl || ""
        };
        localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

        const loginScreen = document.getElementById("login-screen");
        if (loginScreen) loginScreen.style.display = "none";
        document.body.classList.add("logged-in");

        alert("माशाअल्लाह! लॉगिन पूरी तरह सफल रहा।");
        location.reload();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "OTP सत्यापित करें";
        alert("त्रुटि: " + err.message);
      }
    };
  }

  // 4. Session Check
  function checkSession() {
    onAuthStateChanged(auth, (user) => {
      const loginScreen = document.getElementById("login-screen");
      if (user) {
        if (loginScreen) loginScreen.style.display = "none";
        document.body.classList.add("logged-in");
      } else {
        if (loginScreen) loginScreen.style.display = "flex";
      }
    });
  }

  function start() {
    initDp();
    initAuthButton();
    checkSession();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
