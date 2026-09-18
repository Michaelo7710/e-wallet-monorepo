/**
 * GreenPay Structured JSON Logger (Pino Enterprise Observability)
 * 
 * Instance Pino singleton dengan kapabilitas:
 * - Sanitasi otomatis Data Pribadi (PII) via Redaction Engine
 * - Timestamp ISO 8601 berstandar Datadog / CloudWatch
 * - Format NDJSON berperforma tinggi dan terstruktur
 */

const os = require('os');
const pino = require('pino');

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Kontrak field PII & kredensial yang disensor otomatis (TASK-BE-06)
const PII_PATHS = [
  'req.headers.authorization',
  'headers.authorization',
  'authorization',
  // Password variants
  'password',
  'old_password',
  'new_password',
  'confirm_new_password',
  'oldPassword',
  'newPassword',
  'confirmNewPassword',
  // PIN variants
  'pin',
  'old_pin',
  'new_pin',
  'confirm_new_pin',
  'oldPin',
  'newPin',
  'confirmNewPin',
  // OTP variants
  'otp',
  // Token variants
  'token',
  'pre_auth_token',
  'refresh_token',
  'preAuthToken',
  'refreshToken',
  // Secret & 2FA variants
  'secret',
  'two_factor_secret',
  'twoFactorSecret',
  // Identity & KYC PII variants
  'id_card_photo',
  'idCardPhoto',
  'nik',
  // Wildcards level 1 (*.field)
  '*.password',
  '*.old_password',
  '*.new_password',
  '*.confirm_new_password',
  '*.oldPassword',
  '*.newPassword',
  '*.confirmNewPassword',
  '*.pin',
  '*.old_pin',
  '*.new_pin',
  '*.confirm_new_pin',
  '*.oldPin',
  '*.newPin',
  '*.confirmNewPin',
  '*.otp',
  '*.token',
  '*.pre_auth_token',
  '*.refresh_token',
  '*.preAuthToken',
  '*.refreshToken',
  '*.secret',
  '*.two_factor_secret',
  '*.twoFactorSecret',
  '*.id_card_photo',
  '*.idCardPhoto',
  '*.nik',
  // Wildcards level 2 (*.*.field)
  '*.*.password',
  '*.*.old_password',
  '*.*.new_password',
  '*.*.confirm_new_password',
  '*.*.oldPassword',
  '*.*.newPassword',
  '*.*.confirmNewPassword',
  '*.*.pin',
  '*.*.old_pin',
  '*.*.new_pin',
  '*.*.confirm_new_pin',
  '*.*.oldPin',
  '*.*.newPin',
  '*.*.confirmNewPin',
  '*.*.otp',
  '*.*.token',
  '*.*.pre_auth_token',
  '*.*.refresh_token',
  '*.*.preAuthToken',
  '*.*.refreshToken',
  '*.*.secret',
  '*.*.two_factor_secret',
  '*.*.twoFactorSecret',
  '*.*.id_card_photo',
  '*.*.idCardPhoto',
  '*.*.nik',
  // Body paths
  'body.password',
  'body.old_password',
  'body.new_password',
  'body.confirm_new_password',
  'body.oldPassword',
  'body.newPassword',
  'body.confirmNewPassword',
  'body.pin',
  'body.old_pin',
  'body.new_pin',
  'body.confirm_new_pin',
  'body.oldPin',
  'body.newPin',
  'body.confirmNewPin',
  'body.otp',
  'body.token',
  'body.pre_auth_token',
  'body.refresh_token',
  'body.preAuthToken',
  'body.refreshToken',
  'body.secret',
  'body.two_factor_secret',
  'body.twoFactorSecret',
  'body.id_card_photo',
  'body.idCardPhoto',
  'body.nik',
  // req.body paths
  'req.body.password',
  'req.body.pin',
  'req.body.otp',
  'req.body.token',
  'req.body.secret',
  'req.body.id_card_photo',
  'req.body.idCardPhoto',
  'req.body.nik',
];

const pinoOptions = {
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : isDev ? 'debug' : 'info'),
  redact: {
    paths: PII_PATHS,
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    pid: process.pid,
    hostname: os.hostname(),
  },
};

const logger = pino(pinoOptions);

logger.PII_PATHS = PII_PATHS;
logger.pinoOptions = pinoOptions;

module.exports = logger;
