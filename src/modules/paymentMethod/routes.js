import { Router } from 'express';
import PaymentMethodController from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { createPayoutMethodSchema, createPaymentCardSchema } from './schema.js';
import { verifyJWT } from '../../middlewares/auth.js';

const router = Router();

// Secure all payment-method endpoints
router.use(verifyJWT);

// Payout Methods
router.post(
  '/payouts',
  validate(createPayoutMethodSchema),
  PaymentMethodController.addPayout
);

router.get(
  '/payouts',
  PaymentMethodController.listPayouts
);

router.delete(
  '/payouts/:id',
  PaymentMethodController.deletePayout
);

// Payment Cards
router.post(
  '/cards',
  validate(createPaymentCardSchema),
  PaymentMethodController.addCard
);

router.get(
  '/cards',
  PaymentMethodController.listCards
);

router.delete(
  '/cards/:id',
  PaymentMethodController.deleteCard
);

export default router;
