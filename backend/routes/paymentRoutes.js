import express from 'express';
import { check, validationResult } from 'express-validator';
import { 
  getTransactionHistory, 
  depositFunds, 
  withdrawFunds, 
  transferFunds 
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.use(protect); // All payment routes require authentication

router.get('/transactions', getTransactionHistory);

router.post('/deposit', [
  check('amount', 'Amount is required and must be a positive number').isFloat({ gt: 0 })
], validate, depositFunds);

router.post('/withdraw', [
  check('amount', 'Amount is required and must be a positive number').isFloat({ gt: 0 }),
  check('bankAccountInfo', 'Bank account info is required').notEmpty()
], validate, withdrawFunds);

router.post('/transfer', [
  check('amount', 'Amount is required and must be a positive number').isFloat({ gt: 0 }),
  check('recipientId', 'Recipient ID is required').notEmpty()
], validate, transferFunds);

export default router;
