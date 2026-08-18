// // src/docs/components.js

// const schemas = {
//   User: {
//     type: 'object',
//     properties: {
//       id: { type: 'string', example: '65f1a2b3c4d5e6f7' },
//       username: { type: 'string', example: 'Michael S' },
//       email: { type: 'string', example: 'user@greenpay.id' },
//       phone_number: { type: 'string', example: '081234567890' },
//       role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
//       is_verified: { type: 'boolean', example: true },
//     },
//   },
//   Wallet: {
//     type: 'object',
//     properties: {
//       balance: { type: 'number', example: 1500000 },
//       currency: { type: 'string', example: 'IDR' },
//     },
//   },
//   ErrorPayload: {
//     type: 'object',
//     properties: {
//       status: { type: 'string', example: 'fail' },
//       error_code: { type: 'string', example: 'OPERATIONAL_ERROR' },
//       message: { type: 'string', example: 'Pesan penjelasan error' },
//       timestamp: { type: 'string', example: '2026-07-29T10:00:00.000Z' },
//     },
//   },
// };

// const responses = {
//   '200OK': {
//     description: 'Permintaan berhasil diproses',
//   },
//   '400BadRequest': {
//     description: 'Bad Request - Parameter/payload input tidak valid',
//     content: {
//       'application/json': { schema: { $ref: '#/components/schemas/ErrorPayload' } },
//     },
//   },
//   '401Unauthorized': {
//     description: 'Unauthorized - Bearer token tidak valid atau kadaluwarsa',
//     content: {
//       'application/json': { schema: { $ref: '#/components/schemas/ErrorPayload' } },
//     },
//   },
//   '403Forbidden': {
//     description: 'Forbidden - Akses ditolak (Hak akses tidak mencukupi)',
//     content: {
//       'application/json': { schema: { $ref: '#/components/schemas/ErrorPayload' } },
//     },
//   },
//   '404NotFound': {
//     description: 'Not Found - Resource tidak ditemukan',
//     content: {
//       'application/json': { schema: { $ref: '#/components/schemas/ErrorPayload' } },
//     },
//   },
//   '500InternalServerError': {
//     description: 'Internal Server Error - Gangguan pada server backend/database',
//     content: {
//       'application/json': { schema: { $ref: '#/components/schemas/ErrorPayload' } },
//     },
//   },
// };

// module.exports = { schemas, responses };

/**
 * Centralized OpenAPI Components (Schemas & Responses)
 * Clean Code & DRY Principle - GreenPay API Documentation
 */

const schemas = {
  // Standard Error Response Payload
  ErrorPayload: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'fail' },
      error_code: { type: 'string', example: 'OPERATIONAL_ERROR' },
      message: { type: 'string', example: 'Pesan penjelasan error operasional' },
      timestamp: { type: 'string', example: '2026-08-06T08:59:00.000Z' },
    },
  },

  // User Model Schema
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', example: '65f1a2b3c4d5e6f7' },
      username: { type: 'string', example: 'Michael S' },
      email: { type: 'string', example: 'user@greenpay.id' },
      phone_number: { type: 'string', example: '081234567890' },
      role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
      is_verified: { type: 'boolean', example: true },
    },
  },

  // Auth Dual-Token Payload
  AuthTokens: {
    type: 'object',
    properties: {
      access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
      refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
    },
  },

  // Standard Auth Success Response (Login / Register)
  AuthSuccessResponse: {
    type: 'object',
    properties: {
      status: { type: 'string', example: 'success' },
      message: { type: 'string', example: 'Autentikasi berhasil' },
      data: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
          refresh_token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
        },
      },
    },
  },
};

const responses = {
  '200OK': {
    description: 'Permintaan berhasil diproses.',
  },
  '201Created': {
    description: 'Entitas baru berhasil dibuat.',
  },
  '400BadRequest': {
    description: 'Bad Request - Format input tidak valid atau parameter kurang.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorPayload' },
      },
    },
  },
  '401Unauthorized': {
    description: 'Unauthorized - Kredensial salah, token hilang, atau token expired.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorPayload' },
      },
    },
  },
  '403Forbidden': {
    description: 'Forbidden - Akses ditolak (Akun belum terverifikasi / terkunci).',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorPayload' },
      },
    },
  },
  '404NotFound': {
    description: 'Not Found - Resource atau pengguna tidak ditemukan.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorPayload' },
      },
    },
  },
  '500InternalServerError': {
    description: 'Internal Server Error - Gangguan pada server backend/database.',
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorPayload' },
      },
    },
  },
};

module.exports = { schemas, responses };