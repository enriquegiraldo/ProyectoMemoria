import { Router } from 'express';
import { SchedulerController } from '../controllers';
import { authMiddleware, rateLimitMiddleware, securityMiddleware } from '../middleware';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Apply rate limiting to all routes
router.use(rateLimitMiddleware);

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/scheduler/schedule - Schedule a notification
router.post('/schedule', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.scheduleNotification(req, res);
});

// POST /api/scheduler/recurring - Schedule a recurring notification
router.post('/recurring', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.scheduleRecurringNotification(req, res);
});

// POST /api/scheduler/delayed - Schedule a delayed notification
router.post('/delayed', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.scheduleDelayedNotification(req, res);
});

// GET /api/scheduler/:id - Get a schedule by ID
router.get('/:id', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.getSchedule(req, res);
});

// GET /api/scheduler - List schedules
router.get('/', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.listSchedules(req, res);
});

// PUT /api/scheduler/:id - Update a schedule
router.put('/:id', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.updateSchedule(req, res);
});

// DELETE /api/scheduler/:id - Cancel a schedule
router.delete('/:id', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.cancelSchedule(req, res);
});

// GET /api/scheduler/user/:userId - Get scheduled notifications for a user
router.get('/user/:userId', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.getUserScheduledNotifications(req, res);
});

// GET /api/scheduler/stats - Get schedule statistics
router.get('/stats', (req, res) => {
  const controller = new SchedulerController(req.app.locals.schedulerService);
  return controller.getScheduleStats(req, res);
});

export default router;
