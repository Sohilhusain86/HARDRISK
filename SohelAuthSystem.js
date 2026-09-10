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

  // 3. मुख्य लॉगिन सिस्टम (डायरेक्ट, बिना OTP)
  function initAuthSystem() {
    
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
          
          window.dispatchEvent(new Event("login_success"));
          window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: window.currentUser } }));
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

    // लॉगिन बटन लॉजिक (डायरेक्ट)
    const authBtn = document.getElementById("btn-action-auth");
    
    // OTP बॉक्स को छिपा दें अगर वो दिख रहा हो
    const otpSection = document.getElementById("otp-section");
    if (otpSection) otpSection.style.display = "none";
    if (authBtn) authBtn.textContent = "🚀 मैसेंजर में प्रवेश करें";

    if (authBtn) {
      authBtn.onclick = function(e) {
        e.preventDefault();
        const name = document.getElementById("user-name")?.value.trim();
        const phone = document.getElementById("user-phone")?.value.trim().replace(/[^0-9]/g, "");
        const roll = document.getElementById("user-roll")?.value.trim();
        const pass = document.getElementById("user-pass")?.value.trim();

        if (!name) { alert("कृपया नाम दर्ज करें"); return; }
        if (phone.length < 10) { alert("सही 10 अंकों का मोबाइल नंबर दर्ज करें"); return; }

        // एडमिन चेक
        let role = "student";
        if (pass === "razavi123") { role = "admin"; }
        else if (pass.length > 0 && pass !== "razavi123") { alert("गलत एडमिन पासवर्ड"); return; }

        finishLogin(name, phone, roll, role);
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
        
        window.dispatchEvent(new Event("login_success"));
        window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: window.currentUser } }));
      }, 300);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAuthSystem);
  else initAuthSystem();
})();
