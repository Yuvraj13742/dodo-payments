const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('../config/database');
const { syncModels } = require('../models'); // Import syncModels
const coinRoutes = require('../routes/coinRoutes');
const giftRoutes = require('../routes/giftRoutes');
const subscriptionRoutes = require('../routes/subscriptionRoutes');
const creatorRoutes = require('../routes/creatorRoutes');
const authRoutes = require('../routes/authRoutes');
const transactionRoutes = require('../routes/transactionRoutes');
const paymentRoutes = require('../routes/paymentRoutes');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Connect to database and sync models
connectDB();
syncModels(); // Call syncModels to synchronize all models

// Routes
app.use('/webhooks/dodo', require('../routes/dodoWebhooks'));
app.use('/coins', coinRoutes);
app.use('/gifts', giftRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/creators', creatorRoutes);
app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);
app.use('/payments', paymentRoutes);
app.use('/creator', creatorRoutes);

app.get('/', (req, res) => {
    res.send('Payment Service API');
});

module.exports = app;
