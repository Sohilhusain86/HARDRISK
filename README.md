# SUHAIL AI

Full Vercel + Firebase study AI application.

## Student login
There is no email, password or OTP. A student enters:
- Name
- Exactly 4-digit roll number
- 10-digit Indian mobile number

On first use, the account is created automatically. Later, the same roll + name + phone combination logs the student in. The server stores only the account data needed by the application.

## Plans
- FREE: Gemini
- PLUS: ₹10 / 30 days, Groq `openai/gpt-oss-20b`
- PRO: ₹50 / 30 days, Groq `openai/gpt-oss-120b`

## QR payment
The app shows the configured payment QR inside the payment screen. For the simplest deployment, place the real FamPay/UPI QR image at `public/payment-qr.png`. Do not use a placeholder or fake QR. You may instead set `PAYMENT_QR_URL` to a publicly reachable image URL.

The flow is manual verification: student pays, submits the request/UTR, admin verifies the actual received amount, then approves. Until approval the student stays on FREE.

## Environment variables
Copy `.env.example` values into Vercel Environment Variables. Never put real API keys in GitHub.


## Student login and persistence
- Login/registration uses name, exactly 4-digit roll number, 10-digit Indian mobile number, and a password (6-128 characters).
- Passwords are stored only as bcrypt hashes; plaintext passwords are never written to Firebase.
- JWT session is persisted in browser localStorage for 30 days.
- Active conversation ID and a small local UI cache are persisted so a normal refresh/reopen restores the last chat instead of starting over.
- Server-side Firebase conversation data remains the source of truth.
