import { Router } from 'express';
import { NotificationController } from '../controllers';
import { authMiddleware, rateLimitMiddleware, securityMiddleware } from '../middleware';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Apply rate limiting to all routes
router.use(rateLimitMiddleware);

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/notifications/send - Send a single notification
router.post('/send', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendNotification(req, res);
});

// POST /api/notifications/bulk - Send bulk notifications
router.post('/bulk', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendBulkNotifications(req, res);
});

// GET /api/notifications/:id/status - Get notification status
router.get('/:id/status', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.getNotificationStatus(req, res);
});

// DELETE /api/notifications/:id - Cancel notification
router.delete('/:id', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.cancelNotification(req, res);
});

// GET /api/notifications/providers - Get available providers
router.get('/providers', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.getProviders(req, res);
});

// GET /api/notifications/providers/:provider/status - Get provider status
router.get('/providers/:provider/status', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.getProviderStatus(req, res);
});

// POST /api/notifications/email - Send email notification
router.post('/email', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendEmailNotification(req, res);
});

// POST /api/notifications/push - Send push notification
router.post('/push', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendPushNotification(req, res);
});

// POST /api/notifications/sms - Send SMS notification
router.post('/sms', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendSMSNotification(req, res);
});

// POST /api/notifications/webhook - Send webhook notification
router.post('/webhook', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendWebhookNotification(req, res);
});

// POST /api/notifications/in-app - Send in-app notification
router.post('/in-app', (req, res) => {
  const controller = new NotificationController(req.app.locals.notificationService);
  return controller.sendInAppNotification(req, res);
});

export default router;
