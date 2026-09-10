/*
 * SohelMsg91AuthSystem.js
 * -----------------------------------------
 * MSG91 OTP Widget + Firebase Custom Token
 *
 * IMPORTANT:
 * - OTP Send/Verify happens through MSG91 Web SDK.
 * - MSG91 account Authkey never goes to browser.
 * - Old fake OTP handler in index.html is neutralized
 *   by replacing the login button before attaching
 *   the new handler.
 */

import {
  initializeApp,
  getApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithCustomToken
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


/* =========================================================
   FIREBASE
   ========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
  authDomain: "ula-alif.firebaseapp.com",
  databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
  projectId: "ula-alif",
  storageBucket: "ula-alif.firebasestorage.app",
  messagingSenderId: "693272422991",
  appId: "1:693272422991:web:081c07b083e3549b0dd83a"
};

const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);


/* =========================================================
   STATE
   ========================================================= */

let otpSent = false;
let activePhone = "";
let msg91Ready = false;
let msg91Config = null;
let msg91Loading = null;


/* =========================================================
   HELPERS
   ========================================================= */

function cleanPhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}


function getErrorMessage(error) {
  if (!error) {
    return "अज्ञात त्रुटि";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return error.error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "अज्ञात MSG91 त्रुटि";
  }
}


function getDpUrl() {
  const box =
    document.getElementById("dp-preview-box");

  if (!box) {
    return "";
  }

  const bg =
    box.style.backgroundImage || "";

  const match =
    bg.match(/url\(["']?(.*?)["']?\)/);

  return match
    ? match[1]
    : "";
}


/* =========================================================
   LOAD MSG91 CONFIG FROM VERCEL
   ========================================================= */

async function loadMsg91Config() {
  if (msg91Config) {
    return msg91Config;
  }

  const response = await fetch(
    "/api/msg91/config",
    {
      method: "GET",
      cache: "no-store"
    }
  );

  const raw =
    await response.text();

  let data = {};

  try {
    data = raw
      ? JSON.parse(raw)
      : {};
  } catch {
    throw new Error(
      "MSG91 configuration response गलत है।"
    );
  }

  if (
    !response.ok ||
    !data.success ||
    !data.widgetId ||
    !data.tokenAuth
  ) {
    throw new Error(
      data.error ||
      "MSG91 Widget configuration नहीं मिली।"
    );
  }

  msg91Config = data;

  return data;
}


/* =========================================================
   LOAD MSG91 WEB SDK
   ========================================================= */

async function loadMsg91Widget() {
  if (
    msg91Ready &&
    typeof window.sendOtp === "function" &&
    typeof window.verifyOtp === "function"
  ) {
    return;
  }

  if (msg91Loading) {
    return msg91Loading;
  }

  msg91Loading = new Promise(
    async (resolve, reject) => {

      try {
        const config =
          await loadMsg91Config();

        window.__JAMIA_MSG91_CONFIG__ = {
          widgetId: config.widgetId,
          tokenAuth: config.tokenAuth,
          exposeMethods: true,
          captchaRenderId: "",

          success: (data) => {
            console.log(
              "[MSG91] SDK success:",
              data
            );
          },

          failure: (error) => {
            console.error(
              "[MSG91] SDK failure:",
              error
            );
          }
        };


        /*
         * If SDK already exists,
         * initialize it again with our config.
         */

        if (
          typeof window.initSendOTP ===
          "function"
        ) {
          window.initSendOTP(
            window.__JAMIA_MSG91_CONFIG__
          );

          msg91Ready = true;
          resolve();
          return;
        }


        const existing =
          document.querySelector(
            'script[src="https://verify.msg91.com/otp-provider.js"]'
          );

        if (existing) {

          existing.addEventListener(
            "load",
            () => {
              try {
                window.initSendOTP(
                  window.__JAMIA_MSG91_CONFIG__
                );

                msg91Ready = true;
                resolve();

              } catch (error) {
                reject(error);
              }
            },
            { once: true }
          );

          return;
        }


        const script =
          document.createElement("script");

        script.type =
          "text/javascript";

        script.src =
          "https://verify.msg91.com/otp-provider.js";

        script.onload = () => {

          try {

            if (
              typeof window.initSendOTP !==
              "function"
            ) {
              throw new Error(
                "MSG91 Web SDK load हुआ लेकिन initSendOTP उपलब्ध नहीं है।"
              );
            }

            window.initSendOTP(
              window.__JAMIA_MSG91_CONFIG__
            );

            msg91Ready = true;

            console.log(
              "[MSG91] Web SDK initialized"
            );

            resolve();

          } catch (error) {
            reject(error);
          }
        };


        script.onerror = () => {
          reject(
            new Error(
              "MSG91 Web SDK load नहीं हो सका।"
            )
          );
        };


        document.head.appendChild(script);

      } catch (error) {
        reject(error);
      }

    }
  );

  try {
    await msg91Loading;
  } finally {
    msg91Loading = null;
  }
}


/* =========================================================
   EXTRACT MSG91 ACCESS TOKEN
   ========================================================= */

function extractAccessToken(data) {

  const candidates = [
    data?.accessToken,
    data?.access_token,
    data?.token,
    data?.jwt,
    data?.data?.accessToken,
    data?.data?.access_token,
    data?.data?.token,
    data?.data?.jwt
  ];

  for (const value of candidates) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}


/* =========================================================
   FIREBASE LOGIN AFTER MSG91 VERIFICATION
   ========================================================= */

async function completeFirebaseLogin(
  phone,
  accessToken
) {

  const response =
    await fetch(
      "/api/msg91/verify",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          phone,
          accessToken
        })
      }
    );

  const raw =
    await response.text();

  let data = {};

  try {
    data = raw
      ? JSON.parse(raw)
      : {};
  } catch {
    throw new Error(
      "Server ने वैध JSON response नहीं दिया।"
    );
  }

  if (
    !response.ok ||
    !data.success ||
    !data.customToken
  ) {
    throw new Error(
      data.error ||
      "Firebase login token प्राप्त नहीं हुआ।"
    );
  }

  const credential =
    await signInWithCustomToken(
      auth,
      data.customToken
    );

  return credential;
}


/* =========================================================
   SAVE / RESTORE USER
   ========================================================= */

async function finishUserLogin(
  name,
  phone,
  roll
) {

  const userRef =
    ref(db, `users/${phone}`);

  const existing =
    await get(userRef);

  let finalName = name;
  let finalRoll = roll;

  if (existing.exists()) {

    const oldData =
      existing.val() || {};

    finalName =
      oldData.name || name;

    finalRoll =
      oldData.roll || roll;
  }

  const dpUrl =
    getDpUrl();

  const userData = {
    name: finalName,
    phone,
    roll: finalRoll,
    displayName:
      finalRoll
        ? `${finalName} (रोल: ${finalRoll})`
        : finalName
  };

  if (dpUrl) {
    userData.dpUrl = dpUrl;
  }

  if (!existing.exists()) {

    await set(
      userRef,
      {
        ...userData,
        createdAt: Date.now()
      }
    );

  } else {

    await update(
      userRef,
      userData
    );
  }


  window.currentUser =
    window.currentUser || {};

  window.currentUser.name =
    finalName;

  window.currentUser.phone =
    phone;

  window.currentUser.roll =
    finalRoll;

  window.currentUser.displayName =
    userData.displayName;

  window.currentUser.dpUrl =
    dpUrl ||
    window.currentUser.dpUrl ||
    "";

  /*
   * Security:
   * Admin role is NOT granted from
   * a client-side password here.
   *
   * That will be handled by the
   * secured admin phase.
   */

  window.currentUser.role =
    "student";


  localStorage.setItem(
    "jamia_chat_saved_user",
    JSON.stringify(
      window.currentUser
    )
  );


  const loginScreen =
    document.getElementById(
      "login-screen"
    );

  if (loginScreen) {
    loginScreen.style.display =
      "none";
  }


  /*
   * Existing application hooks
   */

  if (
    typeof window.registerUserFirebase ===
    "function"
  ) {
    try {
      await window.registerUserFirebase(
        window.currentUser
      );
    } catch (error) {
      console.warn(
        "[MSG91] registerUserFirebase:",
        error
      );
    }
  }


  if (
    typeof window.requestNotificationAccess ===
    "function"
  ) {
    try {
      window.requestNotificationAccess();
    } catch {}
  }


  if (
    typeof window.connectScaleDrone ===
    "function"
  ) {
    try {
      window.connectScaleDrone();
    } catch {}
  }


  if (
    typeof window.listenForIncomingCalls ===
    "function"
  ) {
    try {
      window.listenForIncomingCalls();
    } catch {}
  }


  if (
    typeof window.updateUserUI ===
    "function"
  ) {
    try {
      window.updateUserUI();
    } catch {}
  }
}


/* =========================================================
   MAIN LOGIN HANDLER
   ========================================================= */

async function handleAuthClick() {

  const nameInput =
    document.getElementById(
      "user-name"
    );

  const phoneInput =
    document.getElementById(
      "user-phone"
    );

  const rollInput =
    document.getElementById(
      "user-roll"
    );

  const otpInput =
    document.getElementById(
      "otp-input"
    );

  const otpSection =
    document.getElementById(
      "otp-section"
    );

  const button =
    document.getElementById(
      "btn-action-auth"
    );


  const name =
    nameInput?.value.trim() || "";

  const phone =
    cleanPhone(
      phoneInput?.value || ""
    );

  const roll =
    rollInput?.value.trim() || "";


  if (!name) {
    alert(
      "कृपया अपना नाम दर्ज करें।"
    );
    return;
  }


  if (
    !/^[6-9]\d{9}$/.test(phone)
  ) {
    alert(
      "कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।"
    );
    return;
  }


  /* =========================================
     SEND OTP
     ========================================= */

  if (!otpSent) {

    button.disabled = true;

    button.textContent =
      "⏳ MSG91 से OTP भेजा जा रहा है...";


    try {

      await loadMsg91Widget();

      activePhone = phone;


      if (
        typeof window.sendOtp !==
        "function"
      ) {
        throw new Error(
          "MSG91 sendOtp उपलब्ध नहीं है।"
        );
      }


      window.sendOtp(
        "91" + phone,

        (data) => {

          console.log(
            "[MSG91] OTP sent:",
            data
          );

          otpSent = true;

          if (otpSection) {
            otpSection.style.display =
              "block";
          }

          button.textContent =
            "OTP सत्यापित करें और लॉगिन करें";

          button.disabled = false;

          if (otpInput) {
            otpInput.focus();
          }
        },

        (error) => {

          console.error(
            "[MSG91] Send OTP failed:",
            error
          );

          otpSent = false;

          button.disabled = false;

          button.textContent =
            "OTP भेजें (Send OTP)";

          alert(
            "OTP भेजने में विफलता: " +
            getErrorMessage(error)
          );
        }
      );

    } catch (error) {

      console.error(
        "[MSG91] SDK initialization failed:",
        error
      );

      button.disabled = false;

      button.textContent =
        "OTP भेजें (Send OTP)";

      alert(
        "MSG91 शुरू नहीं हो सका:\n" +
        getErrorMessage(error)
      );
    }

    return;
  }


  /* =========================================
     VERIFY OTP
     ========================================= */

  const otp =
    String(
      otpInput?.value || ""
    ).trim();


  if (!/^\d{4,8}$/.test(otp)) {
    alert(
      "कृपया सही OTP दर्ज करें।"
    );
    return;
  }


  button.disabled = true;

  button.textContent =
    "⏳ OTP सत्यापित हो रहा है...";


  try {

    if (
      typeof window.verifyOtp !==
      "function"
    ) {
      await loadMsg91Widget();
    }


    window.verifyOtp(
      otp,

      async (data) => {

        try {

          console.log(
            "[MSG91] OTP verified:",
            data
          );


          const accessToken =
            extractAccessToken(data);


          if (!accessToken) {
            throw new Error(
              "MSG91 ने access token नहीं दिया।"
            );
          }


          button.textContent =
            "⏳ सुरक्षित login पूरा हो रहा है...";


          await completeFirebaseLogin(
            activePhone,
            accessToken
          );


          await finishUserLogin(
            name,
            activePhone,
            roll
          );


          button.disabled = false;


        } catch (error) {

          console.error(
            "[MSG91] Final login error:",
            error
          );

          button.disabled = false;

          button.textContent =
            "OTP सत्यापित करें और लॉगिन करें";

          alert(
            "लॉगिन पूरा नहीं हो सका:\n" +
            getErrorMessage(error)
          );
        }

      },

      (error) => {

        console.error(
          "[MSG91] OTP verification failed:",
          error
        );

        button.disabled = false;

        button.textContent =
          "OTP सत्यापित करें और लॉगिन करें";

        alert(
          "गलत या expired OTP:\n" +
          getErrorMessage(error)
        );
      }
    );

  } catch (error) {

    console.error(
      "[MSG91] Verify call error:",
      error
    );

    button.disabled = false;

    button.textContent =
      "OTP सत्यापित करें और लॉगिन करें";

    alert(
      "OTP verification error:\n" +
      getErrorMessage(error)
    );
  }
}


/* =========================================================
   REMOVE OLD FAKE OTP LISTENER
   ========================================================= */

function installLoginHandler() {

  const oldButton =
    document.getElementById(
      "btn-action-auth"
    );

  if (!oldButton) {
    console.error(
      "[MSG91] Login button not found"
    );
    return;
  }


  /*
   * CRITICAL:
   *
   * index.html currently contains an
   * old addEventListener() which creates
   * Math.random() fake OTPs and writes
   * them to /otps/.
   *
   * cloneNode() removes those old listeners.
   */

  const newButton =
    oldButton.cloneNode(true);

  oldButton.replaceWith(
    newButton
  );


  newButton.addEventListener(
    "click",
    handleAuthClick
  );


  console.log(
    "[MSG91] Secure login handler installed."
  );
}


/* =========================================================
   START
   ========================================================= */

function boot() {

  /*
   * Do not initialize MSG91 immediately.
   * It will initialize when Send OTP is clicked.
   */

  installLoginHandler();

}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    boot,
    { once: true }
  );

} else {

  boot();

}