const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/confirm', auth, paymentController.confirmPayment);

module.exports = router;
