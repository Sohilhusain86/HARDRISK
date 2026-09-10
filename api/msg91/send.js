module.exports = function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST method required' });
  }

  const { phone } = req.body || {};
  
  if (!phone) {
    return res.status(400).json({ success: false, error: 'मोबाइल नंबर अनिवार्य है!' });
  }

  // असली जैसा फील देने के लिए 1.5 सेकंड का डिले
  setTimeout(() => {
    res.status(200).json({ success: true, message: 'OTP successfully sent' });
  }, 1500);
};
