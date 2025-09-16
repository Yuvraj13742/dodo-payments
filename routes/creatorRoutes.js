const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const creatorController = require('../controllers/creatorController');

router.post('/withdraw', auth, creatorController.requestPayout);
router.get('/earnings/:creatorId', auth, creatorController.getEarningsDashboard);
router.put('/kyc', auth, creatorController.updateKYCStatus);
router.get('/', auth, creatorController.getAllCreators); // New route to fetch all creators

module.exports = router;
