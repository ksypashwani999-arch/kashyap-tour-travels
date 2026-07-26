const nodemailer = require('nodemailer');
const https = require('https');

// POST /api/send-mail
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { name, phone, email, from, to, start_date, end_date, vehicle, message } = req.body;

  // Basic validation
  if (!name || !phone || !from || !to || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
  }

  const mailBody = `
===========================================
   NEW BOOKING ENQUIRY – Kashyap Tour & Travels
===========================================

Name       : ${name}
Phone      : ${phone}
Email      : ${email || 'Not provided'}

From       : ${from}
To         : ${to}
Start Date : ${start_date}
End Date   : ${end_date}
Vehicle    : ${vehicle || 'Not specified'}

Message    :
${message || 'None'}

===========================================
Sent from: Kashyap Tour & Travels Website
  `;

  const waText = `🚗 *New Booking Enquiry!*
━━━━━━━━━━━━━━━━━━━
👤 *Name:* ${name}
📞 *Phone:* ${phone}
📧 *Email:* ${email || 'Not provided'}

📍 *From:* ${from}
📍 *To:* ${to}
📅 *Start:* ${start_date}
📅 *End:* ${end_date}
🚌 *Vehicle:* ${vehicle || 'Not specified'}

💬 *Message:* ${message || 'None'}
━━━━━━━━━━━━━━━━━━━
_Kashyap Tour & Travels Website_`;

  // ── 1. Send Email ──
  let mailSent = false;
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Kashyap Tour & Travels Website" <${process.env.SMTP_USER}>`,
      to:   process.env.SMTP_USER,
      replyTo: email || undefined,
      subject: `New Booking Enquiry from ${name} – Kashyap Tour & Travels`,
      text: mailBody,
    });
    mailSent = true;
  } catch (err) {
    console.error('Mail error:', err.message);
  }

  // ── 2. Send WhatsApp via Green API ──
  let waSent = false;
  try {
    const idInstance       = process.env.GREEN_ID;     // Green API idInstance
    const apiTokenInstance = process.env.GREEN_TOKEN;  // Green API token
    const chatId           = '918988003662@c.us';      // Your WhatsApp number

    if (idInstance && apiTokenInstance) {
      const url = `https://api.green-api.com/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
      const payload = JSON.stringify({ chatId, message: waText });

      await new Promise((resolve) => {
        const req = https.request(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (r) => { r.resume(); r.on('end', resolve); });
        req.on('error', (e) => { console.error('WhatsApp error:', e.message); resolve(); });
        req.write(payload);
        req.end();
      });
      waSent = true;
    }
  } catch (err) {
    console.error('WhatsApp error:', err.message);
  }

  if (mailSent || waSent) {
    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been sent! We will contact you shortly.',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Could not send enquiry. Please call us at +91 70187 68317.',
  });
};
