import { Request, Response, NextFunction } from 'express';
import { MemoriesService } from '../services/memories.service';
import { logger } from '../utils/logger';
import { handleError, formatErrorResponse } from '../utils/errors';
import { CreateMemoryRequest, UpdateMemoryRequest, SearchFilters } from '../types';

export class MemoriesController {
  private memoriesService: MemoriesService;

  constructor() {
    this.memoriesService = new MemoriesService();
  }

  /**
   * Create a new memory
   */
  createMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const data: CreateMemoryRequest = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      const memory = await this.memoriesService.createMemory(userId, data, ip);

      res.status(201).json({
        success: true,
        data: memory,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req.headers['x-request-id'] as string || 'unknown',
        },
      });
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Create memory controller error', {
        error: customError.message,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };

  /**
   * Get memory by ID
   */
  getMemoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const { id } = req.params;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      const memory = await this.memoriesService.getMemoryById(id, userId, ip);

      if (!memory) {
        res.status(404).json(formatErrorResponse(new Error('Memory not found')));
        return;
      }

      res.status(200).json({
        success: true,
        data: memory,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req.headers['x-request-id'] as string || 'unknown',
        },
      });
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Get memory by ID controller error', {
        error: customError.message,
        memoryId: req.params.id,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };

  /**
   * Update memory
   */
  updateMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const { id } = req.params;
      const data: UpdateMemoryRequest = req.body;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      const memory = await this.memoriesService.updateMemory(id, userId, data, ip);

      res.status(200).json({
        success: true,
        data: memory,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req.headers['x-request-id'] as string || 'unknown',
        },
      });
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Update memory controller error', {
        error: customError.message,
        memoryId: req.params.id,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };

  /**
   * Delete memory
   */
  deleteMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const { id } = req.params;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      await this.memoriesService.deleteMemory(id, userId, ip);

      res.status(204).send();
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Delete memory controller error', {
        error: customError.message,
        memoryId: req.params.id,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };

  /**
   * Search memories
   */
  searchMemories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const filters: SearchFilters = {
        query: req.query.query as string,
        type: req.query.type ? (req.query.type as string).split(',') : undefined,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        visibility: req.query.visibility ? (req.query.visibility as string).split(',') : undefined,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const ip = req.ip || req.connection.remoteAddress || 'unknown';

      const result = await this.memoriesService.searchMemories(userId, filters, ip);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req.headers['x-request-id'] as string || 'unknown',
        },
      });
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Search memories controller error', {
        error: customError.message,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };

  /**
   * Get user memories
   */
  getUserMemories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json(formatErrorResponse(new Error('Authentication required')));
        return;
      }

      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = (page - 1) * limit;

      const result = await this.memoriesService.getUserMemories(userId, { page, limit, offset });

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          requestId: req.headers['x-request-id'] as string || 'unknown',
        },
      });
    } catch (error) {
      const customError = handleError(error as Error);
      logger.error('Get user memories controller error', {
        error: customError.message,
        userId: req.user?.id,
        ip: req.ip,
      });
      res.status(customError.statusCode).json(formatErrorResponse(customError));
    }
  };
}
