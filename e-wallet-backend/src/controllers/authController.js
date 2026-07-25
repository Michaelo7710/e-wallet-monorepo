// const { StatusCodes } = require('http-status-codes');
// const authService = require('../services/authService');
// const catchAsync = require('../utils/catchAsync');

// exports.register = catchAsync(async (req, res, next) => {
//   // Melempar req.body ke Service, lalu menunggu hasilnya
//   const result = await authService.registerUser(req.body);

//   res.status(StatusCodes.CREATED).json({
//     status: 'success',
//     token: result.token,
//     data: { user: result.user }
//   });
// });

// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
  
//   // Melempar email dan password ke Service
//   const result = await authService.loginUser(email, password);

//   res.status(StatusCodes.OK).json({
//     status: 'success',
//     token: result.token,
//     data: { user: result.user }
//   });
// });

// exports.verifyEmail = catchAsync(async (req, res, next) => {
//   const { email, code } = req.body;

//   // Melempar data ke Service untuk dieksekusi di koridor database
//   await authService.verifyEmail(email, code);

//   res.status(StatusCodes.OK).json({
//     status: 'success',
//     message: 'Verifikasi forensik berhasil. Akun Anda kini aktif sepenuhnya di ekosistem GreenPay.'
//   });
// });

const { StatusCodes } = require('http-status-codes');
const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res, next) => {
  const result = await authService.registerUser(req.body);

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    message: 'Registrasi akun berhasil. Kode OTP verifikasi telah dikirim ke email Anda.',
    data: {
      user: result.user,
      access_token: result.accessToken,
      refresh_token: result.refreshToken
    }
  });
});

// exports.login = catchAsync(async (req, res, next) => {
//   const { email, password } = req.body;
//   const result = await authService.loginUser(email, password);
//   res.status(StatusCodes.OK).json({
//     status: 'success',
//     token: result.token,
//     data: { user: result.user }
//   });
// });

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Autentikasi login berhasil.',
    data: {
      user: result.user,
      access_token: result.accessToken,
      refresh_token: result.refreshToken
    }
  });
});

exports.refreshToken = catchAsync(async (req, res, next) => {
  const { refresh_token } = req.body;
  const result = await authService.refreshAccessToken(refresh_token);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Access Token baru berhasil diterbitkan.',
    data: {
      access_token: result.accessToken
    }
  });
});

exports.logout = catchAsync(async (req, res, next) => {
  const { refresh_token } = req.body;
  await authService.logoutUser(refresh_token);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Sesi berhasil dihancurkan. Logout sukses.'
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { email, code } = req.body;
  await authService.verifyEmail(email, code);
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Verifikasi forensik berhasil. Akun Anda kini aktif sepenuhnya di ekosistem GreenPay.'
  });
});

// ==========================================
// PEMULIHAN AKSES (FORGOT PASSWORD)
// ==========================================
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  console.log(`🎮 [AUTH CONTROLLER] Mengetuk sirkuit forgot password untuk: ${email}`);
  await authService.forgotPassword(email);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Jika email terdaftar di GreenPay, kode OTP pemulihan sandi telah diterbangkan menuju Mailtrap.'
  });
});

// ========================================================
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, new_password } = req.body;

  console.log(`🎮 [AUTH CONTROLLER] Menjalankan kliring sandi baru untuk email: ${email}`);
  await authService.resetPassword(email, otp, new_password);

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Kata sandi akun GreenPay Anda berhasil diperbarui. Silakan login kembali.'
  });
});

// ==========================================
// GENERATE MANIFEST SECRET 2FA
// ==========================================
exports.generate2FA = catchAsync(async (req, res, next) => {
  // Pengujian Postman: Tarik userId dari body (Nanti diganti req.user.id saat Middleware Protect aktif)
  const { userId } = req.body; 
  const data = await authService.generate2FASecret(userId);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    data
  });
});

// ==========================================
// VALIDASI TOKEN TOTP 2FA
// ==========================================
exports.verify2FA = catchAsync(async (req, res, next) => {
  const { userId, token } = req.body;
  await authService.verify2FAToken(userId, token);
  
  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Bukti otentikasi TOTP 2FA valid. Konfigurasi keamanan akun berhasil dikunci.'
  });
});