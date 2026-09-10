import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  // ==========================================
  // 1. Firebase इनिशियलाइज़ेशन (छात्रों और बोर्ड के लिए)
  // ==========================================
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

  // CoreSystem के लिए ग्लोबल वेरिएबल उपलब्ध कराना
  window.firebaseApp = app;
  window.auth = auth;
  window.db = db;
  window.database = db;
  window.ref = ref;
  window.set = set;
  window.get = get;
  window.update = update;
  window.onValue = onValue;

  signInAnonymously(auth).catch((err) => console.warn("Firebase Auth Init:", err));

  // ==========================================
  // 2. Cloudinary DP अपलोडर (जो SohelCoreSystem को चाहिए)
  // ==========================================
  window.selectedDpUrl = "";

  window.compressAndUploadImage = async function (file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file selected"));

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 600;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else if (h > maxDim) { h = Math.round((h * maxDim) / h); h = maxDim; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);

          canvas.toBlob(async (blob) => {
            if (!blob) return reject(new Error("Image compression failed"));
            const formData = new FormData();
            formData.append("file", blob, `dp_${Date.now()}.jpg`);
            formData.append("upload_preset", "jamia_dp");

            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/xgkhockl/image/upload", {
                method: "POST",
                body: formData
              });
              const data = await res.json();
              if (data.secure_url) {
                const cloudUrl = data.secure_url;
                window.selectedDpUrl = cloudUrl;

                // हेडर और अवतार अपडेट
                const myAvatar = document.getElementById("my-avatar");
                if (myAvatar) {
                  myAvatar.textContent = "";
                  myAvatar.style.backgroundImage = `url('${cloudUrl}')`;
                  myAvatar.style.backgroundSize = "cover";
                  myAvatar.style.backgroundPosition = "center";
                }

                // यूजर डेटा और Firebase अपडेट
                if (window.currentUser) {
                  window.currentUser.dpUrl = cloudUrl;
                  localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));
                  if (window.currentUser.phone) {
                    try {
                      await update(ref(db, `users/${window.currentUser.phone}`), { dpUrl: cloudUrl });
                    } catch (err) {}
                  }
                }

                // लॉगिन स्क्रीन का प्रीव्यू
                const preview = document.getElementById("dp-preview-box") || document.querySelector(".dp-upload-box");
                if (preview) {
                  preview.style.backgroundImage = `url('${cloudUrl}')`;
                  preview.style.backgroundSize = "cover";
                  const icon = preview.querySelector("i");
                  if (icon) icon.style.display = "none";
                }

                resolve(cloudUrl);
              } else {
                reject(new Error(data.error?.message || "Cloudinary Error"));
              }
            } catch (err) {
              reject(err);
            }
          }, "image/jpeg", 0.8);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  window.uploadProfilePhoto = window.compressAndUploadImage;
  window.uploadDP = window.compressAndUploadImage;

  // ==========================================
  // 3. Android-स्टाइल इंग्लिश SMS नोटिफिकेशन
  // ==========================================
  function injectSmsBanner() {
    if (document.getElementById("android-sms")) return;
    const style = document.createElement("style");
    style.innerHTML = `
      .android-sms-toast {
        display: none;
        position: fixed;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        width: 94%;
        max-width: 410px;
        background: #2b2d31;
        color: #f2f3f5;
        border-radius: 20px;
        padding: 14px 16px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
        z-index: 99999999;
        animation: androidDrop 0.35s ease-out;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      @keyframes androidDrop {
        from { top: -100px; opacity: 0; }
        to { top: 12px; opacity: 1; }
      }
      .sms-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.76rem;
        color: #949ba4;
        margin-bottom: 6px;
      }
      .sms-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }
      .sms-code-highlight {
        font-weight: 700;
        font-size: 1.15rem;
        color: #00a884;
        letter-spacing: 2px;
      }
    `;
    document.head.appendChild(style);

    const banner = document.createElement("div");
    banner.id = "android-sms";
    banner.className = "android-sms-toast";
    banner.innerHTML = `
      <div class="sms-top-bar">
        <div class="sms-badge">
          <i class="fa-solid fa-comment-dots" style="color: #00a884;"></i>
          <span>Messages • AX-JAMIA</span>
        </div>
        <span>just now</span>
      </div>
      <div style="font-size: 0.88rem; line-height: 1.35; color: #dbdee1;">
        <b id="sms-otp-display" class="sms-code-highlight">------</b> is your Jamia Messenger verification code. Do not share this OTP with anyone.
      </div>
    `;
    document.body.appendChild(banner);
  }

  // ==========================================
  // 4. लॉगिन और OTP लॉजिक
  // ==========================================
  const OTP_LIST = [
    "147258", "258369", "369147", "789456", "456123",
    "987654", "123987", "654321", "159753", "357159",
    "852456", "951753", "753159", "123456", "654987",
    "321654", "789123", "456789", "987123", "123789"
  ];
  let currentOtp = "789123";

  function completeLogin(name, phone, roll, role) {
    const displayName = roll ? `${name} (रोल: ${roll})` : `${name} (${phone.slice(-4)})`;
    const userDp = window.selectedDpUrl || "";

    window.currentUser = {
      name, phone, roll, displayName, role,
      location: "India",
      dpUrl: userDp
    };

    localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));

    // स्क्रीन हटाना
    const loginOverlay = document.getElementById("login-screen") || document.querySelector(".login-overlay");
    if (loginOverlay) {
      loginOverlay.style.setProperty("display", "none", "important");
      loginOverlay.remove();
    }
    document.body.classList.add("logged-in");

    // हेडर अपडेट
    const myAvatar = document.getElementById("my-avatar");
    if (myAvatar) {
      if (userDp) {
        myAvatar.textContent = "";
        myAvatar.style.backgroundImage = `url('${userDp}')`;
        myAvatar.style.backgroundSize = "cover";
      } else {
        myAvatar.textContent = name.charAt(0);
      }
    }
    const myNameEl = document.getElementById("my-display-name");
    if (myNameEl) myNameEl.textContent = displayName;

    const crown = document.getElementById("btn-admin-crown");
    if (role === "admin" && crown) crown.style.display = "block";

    // Firebase में ऑनलाइन उपस्थिति दर्ज करना
    try {
      update(ref(db, `users/${phone}`), {
        name, phone, roll, displayName, role,
        status: "online",
        lastSeen: Date.now(),
        ...(userDp ? { dpUrl: userDp } : {})
      });
    } catch (e) {}

    // कोर सिस्टम फंक्शन्स को ट्रिगर करना
    setTimeout(() => {
      try { if (typeof requestNotificationAccess === "function") requestNotificationAccess(); } catch (e) {}
      try { if (window.registerUserFirebase) window.registerUserFirebase(window.currentUser); } catch (e) {}
      try { if (typeof connectScaleDrone === "function") connectScaleDrone(); } catch (e) {}
    }, 200);
  }

  function initAuthSystem() {
    injectSmsBanner();

    // 1. ऑटो-लॉगिन चेक
    const savedUserJson = localStorage.getItem("jamia_chat_saved_user");
    if (savedUserJson) {
      try {
        const u = JSON.parse(savedUserJson);
        window.currentUser = u;
        if (u.dpUrl) window.selectedDpUrl = u.dpUrl;
        completeLogin(u.name, u.phone, u.roll, u.role);
      } catch (e) {}
    }

    // 2. लॉगिन स्क्रीन DP पिकर
    const dpInput = document.getElementById("dp-file-input");
    const previewBox = document.getElementById("dp-preview-box") || document.querySelector(".dp-upload-box");
    if (previewBox && dpInput) {
      previewBox.onclick = () => dpInput.click();
      dpInput.onchange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          await window.compressAndUploadImage(file);
        } catch (err) {
          alert("डीपी अपलोड में समस्या: " + err.message);
        }
      };
    }

    // 3. लॉगिन बटन इवेंट
    const authBtn = document.getElementById("btn-action-auth");
    const nameInput = document.getElementById("user-name");
    const phoneInput = document.getElementById("user-phone");
    const rollInput = document.getElementById("user-roll");
    const passInput = document.getElementById("user-pass");
    const otpInput = document.getElementById("otp-input") || document.querySelector('input[placeholder*="OTP"]');
    const otpSection = document.getElementById("otp-section") || (otpInput ? otpInput.parentElement : null);
    const smsToast = document.getElementById("android-sms");
    const smsOtpDisplay = document.getElementById("sms-otp-display");

    let isOtpStage = (otpInput && otpInput.offsetParent !== null);

    if (authBtn) {
      authBtn.onclick = function (e) {
        e.preventDefault();

        const name = nameInput ? nameInput.value.trim() : "";
        const phone = phoneInput ? phoneInput.value.trim().replace(/[^0-9]/g, "") : "";
        const roll = rollInput ? rollInput.value.trim() : "";
        const pass = passInput ? passInput.value.trim() : "";

        if (!name) { alert("कृपया अपना नाम दर्ज करें!"); nameInput?.focus(); return; }
        if (phone.length < 10) { alert("कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें!"); phoneInput?.focus(); return; }

        // 👑 एडमिन लॉगिन (सीधा प्रवेश)
        if (pass.length > 0) {
          if (pass === "razavi123") {
            completeLogin(name, phone, roll, "admin");
            return;
          } else {
            alert("❌ अमान्य एडमिन पासवर्ड!");
            passInput?.focus();
            return;
          }
        }

        // 🎓 छात्र OTP फ़्लो
        if (!isOtpStage) {
          authBtn.disabled = true;
          authBtn.textContent = "⏳ Requesting OTP...";

          setTimeout(() => {
            currentOtp = OTP_LIST[Math.floor(Math.random() * OTP_LIST.length)];
            if (smsOtpDisplay) smsOtpDisplay.textContent = currentOtp;

            if (smsToast) {
              smsToast.style.display = "block";
              setTimeout(() => { smsToast.style.display = "none"; }, 9000);
            }

            isOtpStage = true;
            if (otpSection) otpSection.style.display = "block";
            if (otpInput) {
              otpInput.focus();
              otpInput.placeholder = "Enter 6-digit OTP";
            }
            authBtn.disabled = false;
            authBtn.textContent = "✅ OTP सत्यापित करें";
          }, 800);

          return;
        }

        // OTP सत्यापन
        const enteredOtp = otpInput ? otpInput.value.trim() : "";
        if (!enteredOtp || enteredOtp.length !== 6) {
          alert("कृपया 6 अंकों का OTP दर्ज करें!");
          otpInput?.focus();
          return;
        }

        if (enteredOtp !== currentOtp && !OTP_LIST.includes(enteredOtp)) {
          alert("अमान्य OTP कोड! कृपया दोबारा जाँचें।");
          return;
        }

        completeLogin(name, phone, roll, "student");
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuthSystem);
  } else {
    initAuthSystem();
  }
})();