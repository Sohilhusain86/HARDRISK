const nodemailer = require('nodemailer');

module.exports = async function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST method required' });
  }

  const { phone, email } = req.body || {};
  if (!phone) {
    return res.status(400).json({ success: false, error: 'मोबाइल नंबर अनिवार्य है!' });
  }

  // 20 मान्य (Valid) 6-अंकीय OTP की सूची
  const VALID_OTPS = [
    "147258", "258369", "369147", "789456", "456123",
    "987654", "123987", "654321", "159753", "357159",
    "852456", "951753", "753159", "123456", "654987",
    "321654", "789123", "456789", "987123", "123789"
  ];
  
  // सूची में से रैंडम OTP चुनना
  const randomOtp = VALID_OTPS[Math.floor(Math.random() * VALID_OTPS.length)];

  try {
    // अगर यूज़र ने ईमेल दर्ज किया है, तो उसे असली ईमेल भेजें
    if (email && email.includes('@')) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sohilhusain2025@gmail.com',
          pass: 'sllm gpwp ysnt odkw'
        }
      });

      const mailOptions = {
        from: `"Jamia Messenger" <sohilhusain2025@gmail.com>`,
        to: email,
        subject: 'लॉगिन OTP - Jamia Students Messenger',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #004d40; border-radius: 10px; text-align: center; background-color: #f4f9f8;">
            <h2 style="color: #004d40;">Jamia Students Messenger</h2>
            <p style="color: #333;">आपके सुरक्षित लॉगिन का 6-अंकीय OTP कोड नीचे दिया गया है:</p>
            <h1 style="background: #e0f2f1; color: #00796b; padding: 12px; border-radius: 6px; letter-spacing: 6px;">${randomOtp}</h1>
            <p style="font-size: 12px; color: #666; margin-top: 20px;">कृपया इस कोड को किसी के साथ साझा न करें। यदि आपने अनुरोध नहीं किया था, तो इसे अनदेखा करें।</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return res.status(200).json({ success: true, message: 'OTP successfully sent' });

  } catch (err) {
    console.error("Email Sending Error: ", err);
    return res.status(500).json({ success: false, error: "ईमेल भेजने में विफल: " + err.message });
  }
};
