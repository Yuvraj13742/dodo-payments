const { Subscription, User, Transaction, sequelize } = require('../models');
const dodoPaymentService = require('../services/dodoPaymentService');
const { Sequelize } = require('sequelize');

exports.createSubscription = async (req, res) => {
  const { creatorId, subscriberId, planType, price } = req.body;

  try {
    const creator = await User.findByPk(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ message: 'Creator not found or is not a creator.' });
    }

    const subscriber = await User.findByPk(subscriberId);
    if (!subscriber) {
      return res.status(404).json({ message: 'Subscriber not found.' });
    }

    // Simulate Dodo Payments checkout session creation for subscription
    const checkoutSession = await dodoPaymentService.checkoutSessions.create({
      productCart: [
        {
          productId: `subscription_plan_${planType}_${creator.id}`,
          quantity: 1,
          price: price,
          interval: planType === 'monthly' ? 'month' : 'year',
        },
      ],
      customer: {
        id: subscriber.id,
        email: subscriber.email,
      },
      returnUrl: process.env.DODO_RETURN_URL,
      cancelUrl: process.env.DODO_CANCEL_URL,
    });

    const subscription = await Subscription.create({
      creatorId: creator.id,
      subscriberId: subscriber.id,
      planType: planType,
      price: price,
      status: 'pending',
      // endDate will be set by webhook upon successful payment
    });

    // Record transaction as pending
    await Transaction.create({
      userId: subscriber.id,
      type: 'subscription',
      amount: price,
      currency: 'INR',
      status: 'pending',
      dodoTransactionId: checkoutSession.id,
      description: `${planType} subscription for ${creator.username}`,
    });

    res.status(200).json({
      message: 'Subscription checkout session created successfully',
      checkoutUrl: checkoutSession.checkoutUrl,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  const { subscriptionId } = req.body;

  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      return res.status(400).json({ message: 'Subscription is already cancelled or expired.' });
    }

    await subscription.update({ status: 'cancelled', endDate: new Date() });

    // Optionally, implement refund logic here if applicable

    res.status(200).json({ message: 'Subscription cancelled successfully.', subscription });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSubscriptionDetails = async (req, res) => {
  const { subscriptionId } = req.params;

  try {
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'Subscriber', attributes: ['id', 'username', 'email'] },
      ],
    });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    res.status(200).json({ subscription });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  const { subscriptionId, planType, price, autoRenew } = req.body;

  try {
    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found.' });
    }

    await subscription.update({
      planType: planType || subscription.planType,
      price: price || subscription.price,
      autoRenew: autoRenew !== undefined ? autoRenew : subscription.autoRenew,
    });

    res.status(200).json({ message: 'Subscription updated successfully.', subscription });

  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllSubscriptionPlans = async (req, res) => {
  try {
    const subscriptionPlans = await Subscription.findAll({
      include: [
        { model: User, as: 'Creator', attributes: ['id', 'username'] },
      ],
    });
    res.status(200).json(subscriptionPlans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Placeholder for other subscription-related functions (e.g., cancelSubscription, getSubscriptionDetails) will be added here.
