import { Router } from 'express';
import { SubscriptionController } from '../controllers';
import { authenticateToken, validateRequest, rateLimiter } from '../middleware';

const router = Router();
const subscriptionController = new SubscriptionController();

// Apply rate limiting to all subscription routes
router.use(rateLimiter);

// Subscription operations
router.post(
  '/',
  authenticateToken,
  validateRequest('createSubscription'),
  subscriptionController.createSubscription.bind(subscriptionController)
);

router.get(
  '/',
  authenticateToken,
  validateRequest('getSubscriptions'),
  subscriptionController.getSubscription.bind(subscriptionController)
);

router.get(
  '/user/:userId',
  authenticateToken,
  validateRequest('getUserSubscription'),
  subscriptionController.getUserSubscription.bind(subscriptionController)
);

router.get(
  '/:subscriptionId',
  authenticateToken,
  validateRequest('getSubscription'),
  subscriptionController.getSubscription.bind(subscriptionController)
);

router.put(
  '/:subscriptionId',
  authenticateToken,
  validateRequest('updateSubscription'),
  subscriptionController.updateSubscription.bind(subscriptionController)
);

router.post(
  '/:subscriptionId/cancel',
  authenticateToken,
  validateRequest('cancelSubscription'),
  subscriptionController.cancelSubscription.bind(subscriptionController)
);

// Analytics
router.get(
  '/analytics',
  authenticateToken,
  validateRequest('getSubscriptionAnalytics'),
  subscriptionController.getSubscriptionAnalytics.bind(subscriptionController)
);

export default router;
