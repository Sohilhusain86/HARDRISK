import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase, ref, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

(function () {
  "use strict";

  // 1. Firebase सेटअप
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

  signInAnonymously(auth).catch(() => {}); 

  // 2. Cloudinary DP अपलोडर 
  window.selectedDpUrl = "";

  window.compressAndUploadImage = async function (file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("No file"));
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 500;
          let w = img.width, h = img.height;
          if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
          else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);

          canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append("file", blob, "dp.jpg");
            formData.append("upload_preset", "jamia_dp");
            try {
              const res = await fetch("https://api.cloudinary.com/v1_1/xgkhockl/image/upload", { method: "POST", body: formData });
              const data = await res.json();
              if (data.secure_url) {
                window.selectedDpUrl = data.secure_url;
                
                const preview = document.getElementById("dp-preview-box") || document.querySelector(".dp-upload-box");
                if (preview) {
                  preview.style.backgroundImage = `url('${data.secure_url}')`;
                  preview.style.backgroundSize = "cover";
                  const icon = preview.querySelector("i");
                  if (icon) icon.style.display = "none";
                }
                resolve(data.secure_url);
              } else reject(new Error("Upload Failed"));
            } catch (err) { reject(err); }
          }, "image/jpeg", 0.8);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // 3. असली SMS नोटिफिकेशन बैनर
  function injectSmsBanner() {
    if (document.getElementById("android-sms")) return;
    const style = document.createElement("style");
    style.innerHTML = `
      .android-sms-toast { display: none; position: fixed; top: 12px; left: 50%; transform: translateX(-50%); width: 94%; max-width: 410px; background: #2b2d31; color: #f2f3f5; border-radius: 20px; padding: 14px 16px; box-shadow: 0 12px 35px rgba(0,0,0,0.7); z-index: 99999999; animation: androidDrop 0.35s ease-out; font-family: sans-serif; }
      @keyframes androidDrop { from { top: -100px; opacity: 0; } to { top: 12px; opacity: 1; } }
      .sms-code-highlight { font-weight: 700; font-size: 1.15rem; color: #00a884; letter-spacing: 2px; }
    `;
    document.head.appendChild(style);
    const banner = document.createElement("div");
    banner.id = "android-sms";
    banner.className = "android-sms-toast";
    banner.innerHTML = `
      <div style="display:flex; justify-content:space-between; font-size:0.76rem; color:#949ba4; margin-bottom:6px;">
        <div style="display:flex; align-items:center; gap:6px; font-weight:600;"><i class="fa-solid fa-comment-dots" style="color:#00a884;"></i> Messages • AX-JAMIA</div><span>just now</span>
      </div>
      <div style="font-size:0.88rem; line-height:1.35;"><b id="sms-otp-display" class="sms-code-highlight">------</b> is your Jamia Messenger verification code. Do not share.</div>
    `;
    document.body.appendChild(banner);
  }

  // 4. मुख्य लॉगिन सिस्टम
  function initAuthSystem() {
    injectSmsBanner();

    // ऑटो लॉगिन
    const saved = localStorage.getItem("jamia_chat_saved_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        window.currentUser = u;
        if (u.dpUrl) window.selectedDpUrl = u.dpUrl;
        document.getElementById("login-screen")?.remove();
        document.body.classList.add("logged-in");
        
        const avatar = document.getElementById("my-avatar");
        if (avatar && u.dpUrl) { avatar.textContent = ""; avatar.style.backgroundImage = `url('${u.dpUrl}')`; avatar.style.backgroundSize = "cover"; }
        const nameEl = document.getElementById("my-display-name");
        if (nameEl) nameEl.textContent = u.displayName || u.name;
        if (u.role === "admin") { const c = document.getElementById("btn-admin-crown"); if (c) c.style.display = "block"; }
        
        setTimeout(() => {
          try { if (window.registerUserFirebase) window.registerUserFirebase(u); } catch(e){}
          try { if (typeof connectScaleDrone === "function") connectScaleDrone(); } catch(e){}
          
          // 🔥 यह वो लाइन है जो आपके पुराने सिस्टम (लीडरबोर्ड/नीचे का बार) को वापस लाएगी
          window.dispatchEvent(new Event("login_success")); 
          window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: u } }));
        }, 300);
      } catch(e){}
    }

    // DP अपलोड लिसनर
    const dpInput = document.getElementById("dp-file-input");
    const previewBox = document.getElementById("dp-preview-box") || document.querySelector(".dp-upload-box");
    if (previewBox && dpInput) {
      previewBox.onclick = () => dpInput.click();
      dpInput.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) window.compressAndUploadImage(file);
      };
    }

    // लॉगिन बटन लॉजिक
    const authBtn = document.getElementById("btn-action-auth");
    let isOtpStage = false;
    let currentOtp = "789456";
    const OTP_LIST = ["147258", "258369", "369147", "789456", "456123", "987654", "123987", "654321", "159753", "357159", "123456"];

    if (authBtn) {
      authBtn.onclick = function(e) {
        e.preventDefault();
        const name = document.getElementById("user-name")?.value.trim();
        const phone = document.getElementById("user-phone")?.value.trim().replace(/[^0-9]/g, "");
        const roll = document.getElementById("user-roll")?.value.trim();
        const pass = document.getElementById("user-pass")?.value.trim();
        const otpInput = document.getElementById("otp-input");

        if (!name) { alert("कृपया नाम दर्ज करें"); return; }
        if (phone.length < 10) { alert("सही मोबाइल नंबर दर्ज करें"); return; }

        // एडमिन चेक
        if (pass === "razavi123") { return finishLogin(name, phone, roll, "admin"); }
        if (pass.length > 0 && pass !== "razavi123") { alert("गलत एडमिन पासवर्ड"); return; }

        // OTP रिक्वेस्ट
        if (!isOtpStage) {
          authBtn.disabled = true; authBtn.textContent = "⏳ Requesting OTP...";
          setTimeout(() => {
            currentOtp = OTP_LIST[Math.floor(Math.random() * OTP_LIST.length)];
            document.getElementById("sms-otp-display").textContent = currentOtp;
            const smsToast = document.getElementById("android-sms");
            if (smsToast) { smsToast.style.display = "block"; setTimeout(() => smsToast.style.display = "none", 9000); }
            
            document.getElementById("otp-section").style.display = "block";
            if (otpInput) otpInput.focus();
            isOtpStage = true;
            authBtn.disabled = false; authBtn.textContent = "✅ OTP सत्यापित करें";
          }, 800);
          return;
        }

        // OTP वेरीफाई
        const entered = otpInput?.value.trim();
        if (entered !== currentOtp && !OTP_LIST.includes(entered)) { alert("अमान्य OTP!"); return; }
        finishLogin(name, phone, roll, "student");
      };
    }

    function finishLogin(name, phone, roll, role) {
      const displayName = roll ? `${name} (रोल: ${roll})` : `${name}`;
      const dp = window.selectedDpUrl || "";
      window.currentUser = { name, phone, roll, displayName, role, dpUrl: dp, location: "India" };
      localStorage.setItem("jamia_chat_saved_user", JSON.stringify(window.currentUser));
      
      try { update(ref(db, `users/${phone}`), { ...window.currentUser, status: "online", lastSeen: Date.now() }); } catch(e){}

      document.getElementById("login-screen")?.remove();
      document.body.classList.add("logged-in");

      const avatar = document.getElementById("my-avatar");
      if (avatar && dp) { avatar.textContent = ""; avatar.style.backgroundImage = `url('${dp}')`; avatar.style.backgroundSize = "cover"; }
      const nameEl = document.getElementById("my-display-name");
      if (nameEl) nameEl.textContent = displayName;
      if (role === "admin") { const c = document.getElementById("btn-admin-crown"); if (c) c.style.display = "block"; }

      setTimeout(() => {
        try { if (window.registerUserFirebase) window.registerUserFirebase(window.currentUser); } catch(e){}
        try { if (typeof connectScaleDrone === "function") connectScaleDrone(); } catch(e){}
        
        // 🔥 यह वो लाइन है जो आपके पुराने सिस्टम (लीडरबोर्ड/नीचे का बार) को वापस लाएगी
        window.dispatchEvent(new Event("login_success"));
        window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: window.currentUser } }));
      }, 300);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAuthSystem);
  else initAuthSystem();
})();
