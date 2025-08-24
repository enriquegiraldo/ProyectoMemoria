import { Router } from 'express';
import { MemoriesController } from '../controllers/memories.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();
const memoriesController = new MemoriesController();

// Validation schemas
const createMemorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    content: z.string().min(1).max(10000),
    type: z.enum(['story', 'photo', 'video', 'audio', 'document', 'memory', 'milestone', 'anniversary', 'tribute', 'legacy']),
    visibility: z.enum(['private', 'family', 'friends', 'public', 'custom']),
    tags: z.array(z.string()).optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      placeName: z.string().optional(),
    }).optional(),
    date: z.string().datetime().optional(),
  }),
});

const updateMemorySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    content: z.string().min(1).max(10000).optional(),
    type: z.enum(['story', 'photo', 'video', 'audio', 'document', 'memory', 'milestone', 'anniversary', 'tribute', 'legacy']).optional(),
    status: z.enum(['draft', 'published', 'archived', 'deleted', 'pending_review', 'rejected']).optional(),
    visibility: z.enum(['private', 'family', 'friends', 'public', 'custom']).optional(),
    tags: z.array(z.string()).optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      placeName: z.string().optional(),
    }).optional(),
    date: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().uuid(),
  }),
});

const memoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const searchMemoriesSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    visibility: z.string().optional(),
    tags: z.string().optional(),
    page: z.string().transform(val => parseInt(val)).optional(),
    limit: z.string().transform(val => parseInt(val)).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

const getUserMemoriesSchema = z.object({
  query: z.object({
    page: z.string().transform(val => parseInt(val)).optional(),
    limit: z.string().transform(val => parseInt(val)).optional(),
  }),
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Apply rate limiting
router.use(rateLimitMiddleware);

// Memory CRUD routes
router.post(
  '/',
  validateRequest(createMemorySchema),
  memoriesController.createMemory
);

router.get(
  '/:id',
  validateRequest(memoryIdSchema),
  memoriesController.getMemoryById
);

router.put(
  '/:id',
  validateRequest(updateMemorySchema),
  memoriesController.updateMemory
);

router.delete(
  '/:id',
  validateRequest(memoryIdSchema),
  memoriesController.deleteMemory
);

// Search and listing routes
router.get(
  '/search',
  validateRequest(searchMemoriesSchema),
  memoriesController.searchMemories
);

router.get(
  '/user/memories',
  validateRequest(getUserMemoriesSchema),
  memoriesController.getUserMemories
);

export default router;
