const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const coinController = require('../controllers/coinController');

router.post('/purchase', auth, coinController.purchaseCoins);
router.get('/balance/:userId', auth, coinController.getWalletBalance);
router.get('/packages', coinController.getCoinPackages);

module.exports = router;
