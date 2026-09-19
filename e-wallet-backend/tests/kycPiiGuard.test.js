const path = require('path');
const fs = require('fs');
const {
  auditStaticController,
  inspectPayloadForPii,
  verifyKycResponseContract,
} = require('../../scripts/ci/guard-kyc-pii');

describe('🛡️ [CI GATEWAY TEST: KYC PII REDACTION GUARD]', () => {
  describe('1. Static Code Analysis Scanner', () => {
    it('Harus meloloskan controller jika response KYC bersih dari NIK dan id_card_photo', () => {
      const cleanCode = `
        exports.updateKYC = catchAsync(async (req, res, next) => {
          const user = await userService.updateKYC(userId, kycPayload);
          res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
              _id: user._id,
              username: user.username,
              is_kyc_verified: true,
              account_tier: 'premium'
            }
          });
        });
      `;

      const violations = auditStaticController(cleanCode, 'mockController.js');
      expect(violations.length).toBe(0);
    });

    it('Harus mendeteksi pelanggaran PII_EXPOSURE_NIK jika controller mengekspos properti nik', () => {
      const leakyCode = `
        exports.updateKYC = catchAsync(async (req, res, next) => {
          const user = await userService.updateKYC(userId, kycPayload);
          res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
              _id: user._id,
              nik: user.nik, // LEAKED NIK!
              is_kyc_verified: true
            }
          });
        });
      `;

      const violations = auditStaticController(leakyCode, 'mockController.js');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.type === 'PII_EXPOSURE_NIK')).toBe(true);
      expect(violations[0].message).toMatch(/dilarang mengekspos properti `nik`/i);
    });

    it('Harus mendeteksi pelanggaran PII_EXPOSURE_ID_CARD_PHOTO jika controller mengekspos properti id_card_photo', () => {
      const leakyCode = `
        exports.updateKYC = catchAsync(async (req, res, next) => {
          const user = await userService.updateKYC(userId, kycPayload);
          res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
              _id: user._id,
              id_card_photo: user.id_card_photo, // LEAKED PHOTO!
              is_kyc_verified: true
            }
          });
        });
      `;

      const violations = auditStaticController(leakyCode, 'mockController.js');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.type === 'PII_EXPOSURE_ID_CARD_PHOTO')).toBe(true);
    });

    it('Harus mendeteksi pelanggaran UNSAFE_OBJECT_SPREAD jika controller menyebarkan ...user._doc', () => {
      const dangerousSpreadCode = `
        exports.updateKYC = catchAsync(async (req, res, next) => {
          const user = await userService.updateKYC(userId, kycPayload);
          res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
              ...user._doc,
              is_kyc_verified: true
            }
          });
        });
      `;

      const violations = auditStaticController(dangerousSpreadCode, 'mockController.js');
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.type === 'UNSAFE_OBJECT_SPREAD')).toBe(true);
    });

    it('Harus mengabaikan komentar yang menyebut kata nik atau id_card_photo (Zero False Positive)', () => {
      const commentedCode = `
        // Catatan: nik dan id_card_photo tidak boleh diekspos di sini
        exports.updateKYC = catchAsync(async (req, res, next) => {
          /* Jangan pernah masukkan nik: user.nik */
          const user = await userService.updateKYC(userId, kycPayload);
          res.status(StatusCodes.OK).json({
            status: 'success',
            data: {
              _id: user._id,
              is_kyc_verified: true
            }
          });
        });
      `;

      const violations = auditStaticController(commentedCode, 'mockController.js');
      expect(violations.length).toBe(0);
    });
  });

  describe('2. Recursive Deep Payload Inspector', () => {
    it('Harus meloloskan payload resmi yang hanya berisi atribut profil non-sensitif', () => {
      const cleanPayload = {
        status: 'success',
        message: 'Akun Anda resmi ditingkatkan menjadi status Terverifikasi Premium.',
        data: {
          _id: '60d0fe4f5311236168a109ca',
          username: 'johndoe',
          email: 'john@example.com',
          phone_number: '081234567890',
          role: 'user',
          bio: 'Wiraswasta transaksi harian bisnis',
          is_verified: true,
          is_kyc_verified: true,
          account_tier: 'premium',
          balance: 5000000,
          two_factor_enabled: true,
          has_pin: true,
        },
      };

      const violations = inspectPayloadForPii(cleanPayload);
      expect(violations.length).toBe(0);
    });

    it('Harus mendeteksi kebocoran jika key nik muncul pada tingkat nested manapun', () => {
      const leakyPayload = {
        status: 'success',
        data: {
          user: {
            profile: {
              nik: '3171012345670001',
            },
          },
        },
      };

      const violations = inspectPayloadForPii(leakyPayload);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.key === 'nik')).toBe(true);
    });

    it('Harus mendeteksi kebocoran jika key id_card_photo muncul', () => {
      const leakyPayload = {
        status: 'success',
        data: {
          id_card_photo: '/uploads/kyc/ktp-12345.jpg',
        },
      };

      const violations = inspectPayloadForPii(leakyPayload);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.key === 'id_card_photo')).toBe(true);
    });

    it('Harus mendeteksi string 16-digit NIK mentah meskipun ditaruh dalam key berbeda', () => {
      const obfuscatedPayload = {
        status: 'success',
        data: {
          national_id_number: '3171012345670001', // Pola 16 digit NIK
        },
      };

      const violations = inspectPayloadForPii(obfuscatedPayload);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.type === 'RAW_NIK_VALUE_DETECTED')).toBe(true);
    });
  });

  describe('3. Live Controller Verification in Codebase', () => {
    it('Kode produksi aktif userController.js harus 100% lolos audit statis PII guard', () => {
      const realControllerPath = path.resolve(__dirname, '../src/controllers/userController.js');
      expect(fs.existsSync(realControllerPath)).toBe(true);

      const realContent = fs.readFileSync(realControllerPath, 'utf-8');
      const violations = auditStaticController(realContent, 'userController.js');

      expect(violations.length).toBe(0);
    });
  });
});
