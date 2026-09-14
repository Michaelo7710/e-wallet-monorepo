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

// Kontrak field PII & kredensial yang disensor otomatis
const PII_PATHS = [
  'req.headers.authorization',
  'headers.authorization',
  'authorization',
  'password',
  'pin',
  'old_password',
  'new_password',
  'confirm_new_password',
  'old_pin',
  'new_pin',
  'confirm_new_pin',
  'token',
  'pre_auth_token',
  'refresh_token',
  'two_factor_secret',
  'nik',
  // Wildcards untuk nesting di dalam body, payload, atau response
  '*.password',
  '*.pin',
  '*.old_password',
  '*.new_password',
  '*.confirm_new_password',
  '*.old_pin',
  '*.new_pin',
  '*.confirm_new_pin',
  '*.token',
  '*.pre_auth_token',
  '*.refresh_token',
  '*.two_factor_secret',
  '*.nik',
  '*.*.password',
  '*.*.pin',
  '*.*.old_password',
  '*.*.new_password',
  '*.*.confirm_new_password',
  '*.*.old_pin',
  '*.*.new_pin',
  '*.*.confirm_new_pin',
  '*.*.token',
  '*.*.pre_auth_token',
  '*.*.refresh_token',
  '*.*.two_factor_secret',
  '*.*.nik',
  'body.password',
  'body.pin',
  'body.old_password',
  'body.new_password',
  'body.confirm_new_password',
  'body.old_pin',
  'body.new_pin',
  'body.confirm_new_pin',
  'body.token',
  'body.pre_auth_token',
  'body.refresh_token',
  'body.two_factor_secret',
  'body.nik',
  'req.body.password',
  'req.body.pin',
  'req.body.token',
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
