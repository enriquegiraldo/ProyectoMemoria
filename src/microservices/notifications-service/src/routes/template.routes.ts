import { Router } from 'express';
import { TemplateController } from '../controllers';
import { authMiddleware, rateLimitMiddleware, securityMiddleware } from '../middleware';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);

// Apply rate limiting to all routes
router.use(rateLimitMiddleware);

// Apply authentication middleware to all routes
router.use(authMiddleware);

// POST /api/templates - Create a new template
router.post('/', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.createTemplate(req, res);
});

// GET /api/templates/:id - Get a template by ID
router.get('/:id', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.getTemplate(req, res);
});

// GET /api/templates - List templates
router.get('/', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.listTemplates(req, res);
});

// PUT /api/templates/:id - Update a template
router.put('/:id', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.updateTemplate(req, res);
});

// DELETE /api/templates/:id - Delete a template
router.delete('/:id', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.deleteTemplate(req, res);
});

// POST /api/templates/:id/render - Render a template
router.post('/:id/render', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.renderTemplate(req, res);
});

// POST /api/templates/:id/preview - Preview a template
router.post('/:id/preview', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.previewTemplate(req, res);
});

// POST /api/templates/validate - Validate a template
router.post('/validate', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.validateTemplate(req, res);
});

// GET /api/templates/:id/variables - Get template variables
router.get('/:id/variables', (req, res) => {
  const controller = new TemplateController(req.app.locals.templateService);
  return controller.getTemplateVariables(req, res);
});

export default router;
