const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

router.get('/:userId', auth, transactionController.getUserTransactions);

module.exports = router;
