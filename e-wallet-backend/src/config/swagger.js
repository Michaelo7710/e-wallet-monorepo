// const swaggerUi = require('swagger-ui-express');
// const swaggerJsdoc = require('swagger-jsdoc');

// const options = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'GreenPay E-Wallet API Documentation',
//       version: '1.0.0',
//       description: 'Dokumentasi Interaktif API Backend Dompet Digital GreenPay (Production)',
//       contact: {
//         name: 'GreenPay Engineering Team',
//       },
//     },
//     servers: [
//       {
//         url: 'https://e-wallet-monorepo-kappa.vercel.app/api/v1',
//         description: 'Production Server (Vercel Cloud)',
//       },
//       {
//         url: 'http://localhost:3000/api/v1',
//         description: 'Development Server (Local Host)',
//       },
//     ],
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//           description: 'Masukkan Access Token JWT Anda (contoh: Bearer <token>)',
//         },
//       },
//     },
//     security: [
//       {
//         bearerAuth: [],
//       },
//     ],
//   },
//   apis: ['./src/routes/*.js'], // Membaca annotasi dokumentasi di berkas rute
// };

// const specs = swaggerJsdoc(options);

// // Custom Options agar tampilan CSS Swagger UI tetap rapi di Vercel Serverless
// const swaggerUiOptions = {
//   customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
//   customJs: [
//     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.js',
//     'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.js',
//   ],
//   customSiteTitle: 'GreenPay API Documentation',
// };

// module.exports = { swaggerUi, specs, swaggerUiOptions };

const swaggerJsdoc = require('swagger-jsdoc');

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
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Otomatis membaca annotasi di seluruh file rute
};

const specs = swaggerJsdoc(options);

module.exports = { specs };