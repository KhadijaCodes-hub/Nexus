import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// Helper to simulate a network delay for mock gateway (2 seconds)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// @desc    Get user's transactions
// @route   GET /api/payments/transactions
// @access  Private
export const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ user: req.user._id }, { recipient: req.user._id }]
    })
    .populate('recipient', 'name email avatarUrl')
    .populate('user', 'name email avatarUrl')
    .sort({ createdAt: -1 });
    
    // Calculate Mock Balance (Deposits & Received Transfers - Withdrawals & Sent Transfers)
    let balance = 0;
    transactions.forEach(t => {
      if (t.status === 'Completed') {
        if (t.type === 'deposit') balance += t.amount;
        if (t.type === 'withdraw') balance -= t.amount;
        if (t.type === 'transfer') {
          if (t.user.id === req.user.id) balance -= t.amount; // Sender
          else balance += t.amount; // Receiver
        }
      }
    });

    res.json({ balance, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mockStripeKey123', {
  apiVersion: '2023-10-16',
});

// @desc    Deposit funds using Stripe (Mock Integration)
// @route   POST /api/payments/deposit
// @access  Private
export const depositFunds = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // 1. Create a PaymentIntent with actual Stripe SDK
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency: 'usd',
      payment_method_types: ['card'],
      description: `Deposit via ${paymentMethod || 'Credit Card'}`
    });

    // 2. Acknowledge Pending
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'deposit',
      amount,
      status: 'Pending',
      description: `Deposit via ${paymentMethod || 'Credit Card'} - PI: ${paymentIntent.id}`
    });

    // Simulate mock Stripe processing delay
    await delay(1500);
    
    // Simulate successful charge since this is sandbox
    transaction.status = 'Completed';
    await transaction.save();

    res.json({ message: 'Deposit successful', transaction, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Withdraw funds (Mock)
// @route   POST /api/payments/withdraw
// @access  Private
export const withdrawFunds = async (req, res) => {
  try {
    const { amount, bankAccountInfo } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // We skip actual balance check here for the mock, trusting frontend or basic logic.
    // In a real app we'd verify user's real balance from the wallet or DB here strictly.

    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'withdraw',
      amount,
      status: 'Pending',
      description: `Withdraw to ${bankAccountInfo || 'Bank Account'}`
    });

    await delay(2000);
    
    transaction.status = 'Completed';
    await transaction.save();

    res.json({ message: 'Withdraw successful', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer funds to another user (Mock Escrow or direct)
// @route   POST /api/payments/transfer
// @access  Private
export const transferFunds = async (req, res) => {
  try {
    const { amount, recipientId, description } = req.body;
    
    if (!amount || amount <= 0 || !recipientId) {
      return res.status(400).json({ message: 'Invalid amount or recipient' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      recipient: recipientId,
      type: 'transfer',
      amount,
      status: 'Pending',
      description: description || `Transfer to ${recipient.name}`
    });

    await delay(1500);

    transaction.status = 'Completed';
    await transaction.save();

    res.json({ message: 'Transfer successful', transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
