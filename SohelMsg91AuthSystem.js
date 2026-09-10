/*
 * SohelMsg91AuthSystem.js
 * ============================================
 * Jamia Messenger - MSG91 OTP Login
 *
 * Flow:
 * Browser
 *   ↓
 * MSG91 Web SDK
 *   ↓
 * SMS OTP
 *   ↓
 * MSG91 verifyOtp()
 *   ↓
 * MSG91 access token
 *   ↓
 * /api/msg91/verify
 *   ↓
 * Firebase Custom Token
 *   ↓
 * Firebase Login
 *
 * IMPORTANT:
 * - No fake OTP
 * - No Math.random OTP
 * - No /api/msg91/send for OTP
 * - No MSG91 Authkey in browser
 * - Old login button listeners are removed
 */


/* =========================================================
   FIREBASE
   ========================================================= */

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


const firebaseConfig = {
  apiKey: "AIzaSyDpqKDayo6H0nVyjnT1JBPjpH8RjmwpvV0",
  authDomain: "ula-alif.firebaseapp.com",
  databaseURL: "https://ula-alif-default-rtdb.firebaseio.com",
  projectId: "ula-alif",
  storageBucket: "ula-alif.firebasestorage.app",
  messagingSenderId: "693272422991",
  appId: "1:693272422991:web:081c07b083e3549b0dd83a"
};

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getDatabase(firebaseApp);


/* =========================================================
   STATE
   ========================================================= */

let msg91Config = null;
let msg91LoadingPromise = null;

let otpSent = false;
let activePhone = "";

let loginButton = null;


/* =========================================================
   BASIC HELPERS
   ========================================================= */

function cleanPhone(value) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(-10);
}


function errorMessage(error) {
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
    return "अज्ञात त्रुटि";
  }
}


/* =========================================================
   DP URL
   ========================================================= */

function getSelectedDpUrl() {
  const box =
    document.getElementById("dp-preview-box");

  if (!box) {
    return "";
  }

  const background =
    box.style.backgroundImage || "";

  const match =
    background.match(
      /url\(["']?(.*?)["']?\)/
    );

  return match
    ? match[1]
    : "";
}


/* =========================================================
   LOAD MSG91 CONFIG
   ========================================================= */

async function loadMsg91Config() {

  if (msg91Config) {
    return msg91Config;
  }

  const response =
    await fetch(
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

  msg91Config = {
    widgetId: data.widgetId,
    tokenAuth: data.tokenAuth
  };

  return msg91Config;
}


/* =========================================================
   WAIT FOR MSG91 FUNCTIONS
   ========================================================= */

function waitForMsg91Methods(
  timeout = 15000
) {

  return new Promise(
    (resolve, reject) => {

      const started =
        Date.now();

      const check = () => {

        const sendReady =
          typeof window.sendOtp ===
          "function";

        const verifyReady =
          typeof window.verifyOtp ===
          "function";

        if (
          sendReady &&
          verifyReady
        ) {

          console.log(
            "[MSG91] sendOtp + verifyOtp ready"
          );

          resolve();
          return;
        }

        if (
          Date.now() - started >=
          timeout
        ) {

          reject(
            new Error(
              "MSG91 Web SDK ने sendOtp/verifyOtp उपलब्ध नहीं किए।"
            )
          );

          return;
        }

        setTimeout(
          check,
          100
        );
      };

      check();
    }
  );
}


/* =========================================================
   INITIALIZE MSG91 WEB SDK
   ========================================================= */

async function loadMsg91Widget() {

  if (
    typeof window.sendOtp ===
      "function" &&
    typeof window.verifyOtp ===
      "function"
  ) {

    return;
  }


  if (msg91LoadingPromise) {
    return msg91LoadingPromise;
  }


  msg91LoadingPromise =
    (async () => {

      const config =
        await loadMsg91Config();


      /*
       * IMPORTANT:
       *
       * MSG91's documented Web SDK pattern
       * uses a global configuration object
       * and:
       *
       * onload="initSendOTP(configuration)"
       */

      window.configuration = {

        widgetId:
          config.widgetId,

        tokenAuth:
          config.tokenAuth,

        identifier:
          "",

        exposeMethods:
          true,

        captchaRenderId:
          "",

        success:
          (data) => {
            console.log(
              "[MSG91] SDK success:",
              data
            );
          },

        failure:
          (error) => {
            console.error(
              "[MSG91] SDK failure:",
              error
            );
          }
      };


      /*
       * SDK already available?
       */

      if (
        typeof window.initSendOTP ===
        "function"
      ) {

        console.log(
          "[MSG91] Existing SDK found. Initializing..."
        );

        window.initSendOTP(
          window.configuration
        );

        await waitForMsg91Methods();

        return;
      }


      /*
       * Create SDK script exactly like
       * MSG91's documented Web SDK flow.
       */

      await new Promise(
        (resolve, reject) => {

          const oldScript =
            document.querySelector(
              'script[data-jamia-msg91="true"]'
            );

          if (oldScript) {

            oldScript.addEventListener(
              "load",
              resolve,
              { once: true }
            );

            oldScript.addEventListener(
              "error",
              () => reject(
                new Error(
                  "MSG91 SDK load नहीं हुआ।"
                )
              ),
              { once: true }
            );

            return;
          }


          const script =
            document.createElement(
              "script"
            );

          script.type =
            "text/javascript";

          script.src =
            "https://verify.msg91.com/otp-provider.js";

          script.setAttribute(
            "data-jamia-msg91",
            "true"
          );


          /*
           * Exact initialization on script load.
           */

          script.onload = () => {

            console.log(
              "[MSG91] otp-provider.js loaded"
            );

            try {

              if (
                typeof window.initSendOTP !==
                "function"
              ) {

                reject(
                  new Error(
                    "MSG91 initSendOTP उपलब्ध नहीं है।"
                  )
                );

                return;
              }


              window.initSendOTP(
                window.configuration
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


          document.head.appendChild(
            script
          );

        }
      );


      /*
       * initSendOTP के बाद methods आने तक
       * wait करें।
       */

      await waitForMsg91Methods(
        15000
      );


      console.log(
        "[MSG91] Widget initialization complete"
      );

    })();


  try {

    await msg91LoadingPromise;

  } finally {

    msg91LoadingPromise =
      null;
  }
}


/* =========================================================
   ACCESS TOKEN EXTRACTION
   ========================================================= */

function extractAccessToken(data) {

  if (!data) {
    return "";
  }

  const candidates = [

    data.accessToken,

    data.access_token,

    data.token,

    data.jwt,

    data.data?.accessToken,

    data.data?.access_token,

    data.data?.token,

    data.data?.jwt
  ];


  for (
    const candidate of candidates
  ) {

    if (
      typeof candidate ===
        "string" &&
      candidate.trim()
    ) {

      return candidate.trim();
    }
  }


  return "";
}


/* =========================================================
   SERVER → FIREBASE LOGIN
   ========================================================= */

async function loginThroughFirebase(
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

          phone:
            phone,

          accessToken:
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


  return signInWithCustomToken(
    auth,
    data.customToken
  );
}


/* =========================================================
   SAVE USER
   ========================================================= */

async function saveUser(
  name,
  phone,
  roll
) {

  const userRef =
    ref(
      db,
      `users/${phone}`
    );


  const existing =
    await get(userRef);


  let finalName =
    name;

  let finalRoll =
    roll;


  if (existing.exists()) {

    const oldData =
      existing.val() || {};

    finalName =
      oldData.name ||
      name;

    finalRoll =
      oldData.roll ||
      roll;
  }


  const dpUrl =
    getSelectedDpUrl();


  const userData = {

    name:
      finalName,

    phone:
      phone,

    roll:
      finalRoll,

    displayName:
      finalRoll
        ? `${finalName} (रोल: ${finalRoll})`
        : finalName
  };


  if (dpUrl) {
    userData.dpUrl =
      dpUrl;
  }


  if (!existing.exists()) {

    await set(
      userRef,
      {
        ...userData,
        createdAt:
          Date.now()
      }
    );

  } else {

    await update(
      userRef,
      userData
    );
  }


  /*
   * Keep existing app's user object.
   */

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
   * Do NOT grant admin role from
   * a client-side password.
   */

  window.currentUser.role =
    "student";


  localStorage.setItem(
    "jamia_chat_saved_user",
    JSON.stringify(
      window.currentUser
    )
  );


  /*
   * Close login screen.
   */

  const loginScreen =
    document.getElementById(
      "login-screen"
    );

  if (loginScreen) {

    loginScreen.style.display =
      "none";
  }


  /*
   * Existing application functions.
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
    typeof window.askForMicPermission ===
    "function"
  ) {

    try {

      window.askForMicPermission();

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
   SEND OTP
   ========================================================= */

async function sendJamiaOtp(
  phone
) {

  await loadMsg91Widget();


  if (
    typeof window.sendOtp !==
    "function"
  ) {

    throw new Error(
      "MSG91 sendOtp उपलब्ध नहीं है।"
    );
  }


  return new Promise(
    (resolve, reject) => {

      console.log(
        "[MSG91] Sending OTP to:",
        "91" + phone
      );


      window.sendOtp(

        "91" + phone,

        (data) => {

          console.log(
            "[MSG91] OTP sent successfully:",
            data
          );

          resolve(data);
        },

        (error) => {

          console.error(
            "[MSG91] OTP send failed:",
            error
          );

          reject(error);
        }
      );
    }
  );
}


/* =========================================================
   VERIFY OTP
   ========================================================= */

async function verifyJamiaOtp(
  otp
) {

  await loadMsg91Widget();


  if (
    typeof window.verifyOtp !==
    "function"
  ) {

    throw new Error(
      "MSG91 verifyOtp उपलब्ध नहीं है।"
    );
  }


  return new Promise(
    (resolve, reject) => {

      console.log(
        "[MSG91] Verifying OTP..."
      );


      window.verifyOtp(

        Number(otp),

        (data) => {

          console.log(
            "[MSG91] OTP verification success:",
            data
          );

          resolve(data);
        },

        (error) => {

          console.error(
            "[MSG91] OTP verification failed:",
            error
          );

          reject(error);
        }
      );
    }
  );
}


/* =========================================================
   LOGIN BUTTON HANDLER
   ========================================================= */

async function handleLoginButton() {

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


  const name =
    nameInput?.value.trim() ||
    "";

  const phone =
    cleanPhone(
      phoneInput?.value ||
      ""
    );

  const roll =
    rollInput?.value.trim() ||
    "";


  /*
   * Name
   */

  if (!name) {

    alert(
      "कृपया अपना नाम दर्ज करें।"
    );

    return;
  }


  /*
   * Indian mobile number
   */

  if (
    !/^[6-9]\d{9}$/.test(
      phone
    )
  ) {

    alert(
      "कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें।"
    );

    return;
  }


  /* =======================================================
     STEP 1 — SEND OTP
     ======================================================= */

  if (!otpSent) {

    loginButton.disabled =
      true;

    loginButton.textContent =
      "⏳ MSG91 से OTP भेजा जा रहा है...";


    try {

      activePhone =
        phone;


      await sendJamiaOtp(
        phone
      );


      otpSent =
        true;


      if (otpSection) {

        otpSection.style.display =
          "block";
      }


      loginButton.textContent =
        "OTP सत्यापित करें और लॉगिन करें";

      loginButton.disabled =
        false;


      if (otpInput) {

        otpInput.focus();
      }


      return;

    } catch (error) {

      console.error(
        "[MSG91] Send OTP error:",
        error
      );


      otpSent =
        false;


      loginButton.disabled =
        false;


      loginButton.textContent =
        "OTP भेजें (Send OTP)";


      alert(
        "OTP भेजने में विफल:\n" +
        errorMessage(error)
      );


      return;
    }
  }


  /* =======================================================
     STEP 2 — VERIFY OTP
     ======================================================= */

  const otp =
    String(
      otpInput?.value ||
      ""
    ).trim();


  if (
    !/^\d{4,8}$/.test(
      otp
    )
  ) {

    alert(
      "कृपया सही OTP दर्ज करें।"
    );

    return;
  }


  loginButton.disabled =
    true;

  loginButton.textContent =
    "⏳ OTP सत्यापित हो रहा है...";


  try {

    /*
     * MSG91 itself verifies the OTP.
     */

    const verifyData =
      await verifyJamiaOtp(
        otp
      );


    /*
     * MSG91 returns an access token.
     */

    const accessToken =
      extractAccessToken(
        verifyData
      );


    if (!accessToken) {

      console.error(
        "[MSG91] Full verification response:",
        verifyData
      );

      throw new Error(
        "MSG91 ने access token नहीं दिया।"
      );
    }


    loginButton.textContent =
      "⏳ सुरक्षित Firebase login हो रहा है...";


    /*
     * Server verifies MSG91 access token
     * and creates Firebase custom token.
     */

    await loginThroughFirebase(
      activePhone,
      accessToken
    );


    /*
     * Save user data.
     */

    await saveUser(
      name,
      activePhone,
      roll
    );


    loginButton.disabled =
      false;


    console.log(
      "[MSG91] Jamia login completed successfully."
    );


  } catch (error) {

    console.error(
      "[MSG91] Login verification error:",
      error
    );


    loginButton.disabled =
      false;


    loginButton.textContent =
      "OTP सत्यापित करें और लॉगिन करें";


    alert(
      "लॉगिन पूरा नहीं हो सका:\n" +
      errorMessage(error)
    );
  }
}


/* =========================================================
   REMOVE OLD FAKE OTP HANDLER
   ========================================================= */

function installSecureLoginHandler() {

  const oldButton =
    document.getElementById(
      "btn-action-auth"
    );


  if (!oldButton) {

    console.error(
      "[MSG91] Login button #btn-action-auth नहीं मिला।"
    );

    return;
  }


  /*
   * VERY IMPORTANT
   *
   * Old index.html contains a listener
   * which generates:
   *
   * Math.random()
   *
   * and writes:
   *
   * /otps/{phone}
   *
   * Clone/replace removes that old listener.
   */

  const newButton =
    oldButton.cloneNode(
      true
    );


  oldButton.replaceWith(
    newButton
  );


  loginButton =
    newButton;


  newButton.addEventListener(
    "click",
    handleLoginButton
  );


  console.log(
    "[MSG91] Secure login handler installed."
  );
}


/* =========================================================
   BOOT
   ========================================================= */

function bootMsg91System() {

  try {

    installSecureLoginHandler();

  } catch (error) {

    console.error(
      "[MSG91] Boot error:",
      error
    );
  }
}


if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    bootMsg91System,
    { once: true }
  );

} else {

  bootMsg91System();
}