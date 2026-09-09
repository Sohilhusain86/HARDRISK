const https = require('https');

module.exports = function (req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'POST method required' });
  }

  try {
    const phone = req.body && req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, '') : '';
    const mobile10 = phone.slice(-10);

    if (mobile10.length !== 10) {
      return res.status(400).json({ success: false, error: 'अमान्य मोबाइल नंबर' });
    }

    const payload = JSON.stringify({
      widgetId: '3669696b7335343532303131',
      tokenAuth: '569375TMznDInf4QV6aa1417fP1',
      identifier: '91' + mobile10
    });

    const options = {
      hostname: 'control.msg91.com',
      port: 443,
      path: '/api/v5/widget/sendOtp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': '569375AVYtiXmers66aa144b3P1',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const request = https.request(options, (response) => {
      let body = '';
      response.on('data', (chunk) => body += chunk);
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.type === 'error') {
            res.status(400).json({ success: false, error: data.message || 'MSG91 API Error' });
          } else {
            res.status(200).json({ success: true, message: 'OTP Sent' });
          }
        } catch (e) {
          res.status(500).json({ success: false, error: 'MSG91 Parse Error' });
        }
      });
    });

    request.on('error', (e) => res.status(500).json({ success: false, error: e.message }));
    request.write(payload);
    request.end();

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};