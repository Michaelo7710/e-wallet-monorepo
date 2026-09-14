const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const { schemas, responses } = require('../docs/components');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GreenPay E-Wallet API Documentation',
      version: '1.0.0',
      description: 'Dokumentasi Interaktif API Backend Dompet Digital GreenPay (Production)',
      contact: {
        name: 'GreenPay Engineering Team',
      },
    },
    servers: [
      {
        url: 'https://e-wallet-monorepo-kappa.vercel.app/api/v1',
        description: 'Production Server (Vercel Cloud)',
      },
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development Server (Local Host)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Masukkan Access Token JWT Anda (contoh: Bearer <token>)',
        },
      },
      schemas,
      responses,
    },
  },
  // 💡 Merekam rute Express sekaligus berkas dokumentasi terpisah
  apis: [
    path.join(__dirname, '../routes/*.js').replace(/\\/g, '/'),
    path.join(__dirname, '../docs/routes/*.js').replace(/\\/g, '/'),
    path.join(process.cwd(), 'src/routes/*.js').replace(/\\/g, '/'),
    path.join(process.cwd(), 'src/docs/routes/*.js').replace(/\\/g, '/'),
    path.join(process.cwd(), 'e-wallet-backend/src/routes/*.js').replace(/\\/g, '/'),
    path.join(process.cwd(), 'e-wallet-backend/src/docs/routes/*.js').replace(/\\/g, '/'),
    './src/routes/*.js',
    './src/docs/routes/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = { specs };