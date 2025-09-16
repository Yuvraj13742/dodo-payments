const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

router.post('/create', auth, subscriptionController.createSubscription);
router.post('/cancel', auth, subscriptionController.cancelSubscription);
router.get('/:subscriptionId', auth, subscriptionController.getSubscriptionDetails);
router.get('/plans', auth, subscriptionController.getAllSubscriptionPlans); // New route to fetch all subscription plans
router.put('/update', auth, subscriptionController.updateSubscription);

module.exports = router;
