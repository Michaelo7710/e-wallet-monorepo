const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT, 10) || 587,
  pool: true, // Gunakan pool koneksi agar tidak membuka handshake baru terus menerus
  maxConnections: 5,
  maxMessages: 100,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (options) => {
  const mailOptions = {
    from: 'GreenPay FinTech <no-reply@greenpay.id>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;