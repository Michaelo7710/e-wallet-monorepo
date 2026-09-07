// app.js
// Delegated root entry point referencing src/app.js
// Backward-compatibility hook untuk Simulator / Webhook Midtrans & Remote Config Route
// app.post('/api/transactions/midtrans-notification', paymentController.handleMidtransWebhook);
// app.post('/api/v1/transactions/midtrans-notification', paymentController.handleMidtransWebhook);
// app.use('/api/v1/config', require('./routes/configRoutes'));

module.exports = require('./src/app');