const nodemailer = require('nodemailer');

// POST /api/send-mail
module.exports = async (req, res) => {
  // CORS headers
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

  // Gmail SMTP transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,   // set in Vercel env vars
      pass: process.env.SMTP_PASS,   // set in Vercel env vars
    },
  });

  const mailBody = `
===========================================
   NEW BOOKING ENQUIRY – Kashyap Tour & Travels
===========================================

Name    : ${name}
Phone   : ${phone}
Email   : ${email || 'Not provided'}

From    : ${from}
To      : ${to}
Start Date : ${start_date}
End Date   : ${end_date}
Vehicle : ${vehicle || 'Not specified'}

Message :
${message || 'None'}

===========================================
Sent from: Kashyap Tour & Travels Website
  `;

  try {
    await transporter.sendMail({
      from: `"Kashyap Tour & Travels Website" <${process.env.SMTP_USER}>`,
      to:   process.env.SMTP_USER,   // receives on same gmail
      replyTo: email || phone,
      subject: `New Booking Enquiry from ${name} – Kashyap Tour & Travels`,
      text: mailBody,
    });

    return res.status(200).json({
      success: true,
      message: 'Your enquiry has been sent! We will contact you shortly.',
    });
  } catch (err) {
    console.error('Mail error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Mail could not be sent. Please call us at +91 70187 68317.',
    });
  }
};
