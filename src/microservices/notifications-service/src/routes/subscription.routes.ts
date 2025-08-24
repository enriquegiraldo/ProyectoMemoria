import { Router } from 'express';
import { SubscriptionController } from '../controllers';
import { authMiddleware, rateLimitMiddleware, securityMiddleware } from '../middleware';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Apply rate limiting to all routes
router.use(rateLimitMiddleware);

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/subscriptions - Create a new subscription
router.post('/', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.createSubscription(req, res);
});

// GET /api/subscriptions/:id - Get a subscription by ID
router.get('/:id', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.getSubscription(req, res);
});

// GET /api/subscriptions - List subscriptions
router.get('/', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.listSubscriptions(req, res);
});

// PUT /api/subscriptions/:id - Update a subscription
router.put('/:id', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.updateSubscription(req, res);
});

// DELETE /api/subscriptions/:id - Delete a subscription
router.delete('/:id', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.deleteSubscription(req, res);
});

// PUT /api/subscriptions/preferences - Update user preferences
router.put('/preferences', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.updatePreferences(req, res);
});

// GET /api/subscriptions/preferences - Get user preferences
router.get('/preferences', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.getPreferences(req, res);
});

// POST /api/subscriptions/:id/enable - Enable a subscription
router.post('/:id/enable', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.enableSubscription(req, res);
});

// POST /api/subscriptions/:id/disable - Disable a subscription
router.post('/:id/disable', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.disableSubscription(req, res);
});

// GET /api/subscriptions/:id/status - Get subscription status
router.get('/:id/status', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.getSubscriptionStatus(req, res);
});

// GET /api/subscriptions/stats - Get subscription statistics
router.get('/stats', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.getSubscriptionStats(req, res);
});

// POST /api/subscriptions/:id/validate - Validate a subscription
router.post('/:id/validate', (req, res) => {
  const controller = new SubscriptionController(req.app.locals.subscriptionService);
  return controller.validateSubscription(req, res);
});

export default router;
