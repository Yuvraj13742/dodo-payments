const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const giftController = require('../controllers/giftController');

router.post('/send', auth, giftController.sendGift);
router.get('/', auth, giftController.getAllGifts); // Added route to fetch all gifts

module.exports = router;
