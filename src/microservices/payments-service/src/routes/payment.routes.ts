// src/microservices/payments-service/src/routes/payment.routes.ts
import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const paymentController = new PaymentController();

// Rate limiting global para todo el router
router.use(rateLimiter);

// Health check
router.get('/health', paymentController.healthCheck.bind(paymentController));

// Payment intents
router.post(
  '/intents',
  authenticateToken,
  validateRequest('createPaymentIntent'),
  paymentController.createPaymentIntent.bind(paymentController)
);

// Payment operations
router.get(
  '/',
  authenticateToken,
  validateRequest('getPayments'),
  paymentController.getPayments.bind(paymentController)
);

router.get(
  '/:paymentId',
  authenticateToken,
  validateRequest('getPayment'),
  paymentController.getPayment.bind(paymentController)
);

router.post(
  '/:paymentId/confirm',
  authenticateToken,
  validateRequest('confirmPayment'),
  paymentController.confirmPayment.bind(paymentController)
);

router.post(
  '/:paymentId/refund',
  authenticateToken,
  validateRequest('refundPayment'),
  paymentController.refundPayment.bind(paymentController)
);

// Analytics
router.get(
  '/analytics',
  authenticateToken,
  validateRequest('getPaymentAnalytics'),
  paymentController.getPaymentAnalytics.bind(paymentController)
);

export default router;
