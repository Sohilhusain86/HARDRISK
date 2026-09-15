# जमात ऊला अलिफ़ — v3

इस build में मुख्य SPA `index.html` है। `api/` में server-side authentication, AI gateway, Cloudinary fallback और OneSignal notification endpoints हैं। `firebase.rules.json` database authorization rules का source है।

## Vercel Environment Variables
`.env.example` में दिए variables Vercel Project Settings → Environment Variables में भरें। विशेष रूप से Firebase Admin credentials और `ADMIN_PASSKEY` आवश्यक हैं। AI provider keys server-side ही रखें; उन्हें `index.html` में न डालें।

## Firebase
Realtime Database → Rules में `firebase.rules.json` का content publish करें **लेकिन पहले Firebase Authentication → Sign-in method में Anonymous को enable करें?**

नोट: इस build का login UI OTP-मुक्त direct login है। Server custom token जारी करता है और Firebase Auth identity को database rules के साथ जोड़ता है।