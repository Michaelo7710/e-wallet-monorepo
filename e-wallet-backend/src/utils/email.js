// const nodemailer = require('nodemailer');

// const sendEmail = async (options) => {
//   // 1. Inisialisasi Transporter yang mengarah murni ke Sandbox Mailtrap
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
//     port: process.env.EMAIL_PORT || 2525,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   // 2. Susun manifes pengiriman
//   const mailOptions = {
//     from: 'GreenPay FinTech <no-reply@greenpay.id>',
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // Kedepannya Anda bisa menyuntikkan template HTML premium di sini
//   };

//   // 3. Eksekusi pengiriman lintas jaringan
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;

const nodemailer = require('nodemailer');
const AppError = require('./AppError');
const { StatusCodes } = require('http-status-codes');

const sendEmail = async (options) => {
  // 1. GAURD CLAUSE: Validasi Eksistensi Kredensial Environment
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("❌ EROR SISTEM: Kredensial Mailtrap (.env) tidak terdeteksi oleh sistem!");
    // Jangan biarkan aplikasi crash, lempar error operasional terkendali
    throw new AppError('Gagal membangun konfigurasi server email internal.', StatusCodes.INTERNAL_SERVER_ERROR);
  }

  // 2. Inisialisasi Transporter Kompatibilitas Tinggi
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    // Gunakan port dinamis dari .env, atau fallback ke 2525 (Bisa diganti ke 587 jika diblokir ISP)
    port: parseInt(process.env.EMAIL_PORT, 10) || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // [DIAGNOSTIK DINAMIS] Menyala hanya saat development untuk melacak error secara real-time
    logger: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development'
  });

  // 3. Manifes Paket Data Email
  const mailOptions = {
    from: 'GreenPay FinTech <no-reply@greenpay.id>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  try {
    // 4. Eksekusi Jaringan Lintas Batas
    const info = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✉️ Email berhasil dikirim ke Mailtrap. Message-ID: ${info.messageId}`);
    }
    return info;
  } catch (error) {
    console.error("💥 KELAINAN JARINGAN: Gagal mengirimkan paket SMTP ke Mailtrap!");
    console.error(error.message);
    throw new AppError('Proses pengiriman kode verifikasi ke email Anda mengalami gangguan.', StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

module.exports = sendEmail;