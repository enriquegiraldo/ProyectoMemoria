import { Router } from 'express';
import multer from 'multer';
import { MediaController } from '../controllers/media.controller';
import { 
  authenticate, 
  requirePermission, 
  optionalAuth 
} from '../middleware/auth.middleware';
import { 
  rateLimitMiddleware, 
  uploadRateLimit 
} from '../middleware/rate-limit.middleware';
import { 
  securityHeaders, 
  corsMiddleware, 
  requestIdMiddleware 
} from '../middleware/security.middleware';
import { config } from '../config';

const router = Router();
const mediaController = new MediaController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
  fileFilter: (req, file, cb) => {
    // Validate file type
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/tiff', 'image/bmp',
      // Videos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv',
      // Audio
      'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/opus',
      // Documents
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/html', 'application/rtf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Apply security middleware to all routes
router.use(securityHeaders);
router.use(corsMiddleware);
router.use(requestIdMiddleware);

// Health check endpoint (no auth required)
router.get('/health', mediaController.healthCheck.bind(mediaController));

// Public endpoints (optional auth)
router.get('/formats/:mediaType', 
  optionalAuth,
  mediaController.getSupportedFormats.bind(mediaController)
);

// Protected endpoints (auth required)
router.use(authenticate);

// Upload and process media file
router.post('/upload',
  uploadRateLimit,
  upload.single('file'),
  requirePermission('file:upload'),
  mediaController.uploadAndProcess.bind(mediaController)
);

// Process existing media file
router.post('/process',
  rateLimitMiddleware,
  requirePermission('processing:create'),
  mediaController.processMedia.bind(mediaController)
);

// Get media metadata
router.get('/metadata/:filePath(*)',
  rateLimitMiddleware,
  requirePermission('file:read'),
  mediaController.getMetadata.bind(mediaController)
);

// Validate media file
router.get('/validate/:filePath(*)',
  rateLimitMiddleware,
  requirePermission('file:read'),
  mediaController.validateMedia.bind(mediaController)
);

// Batch process multiple files
router.post('/batch',
  rateLimitMiddleware,
  requirePermission('processing:create'),
  mediaController.batchProcess.bind(mediaController)
);

// Get processing status
router.get('/status',
  rateLimitMiddleware,
  requirePermission('processing:read'),
  mediaController.getProcessingStatus.bind(mediaController)
);

// Error handling for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        details: `File size exceeds maximum limit of ${config.upload.maxFileSize / 1024 / 1024}MB`,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        details: `Maximum ${config.upload.maxFiles} files allowed`,
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field',
        details: 'File field name must be "file"',
      });
    }
  }

  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      details: 'File type not supported',
    });
  }

  next(error);
});

export default router;
