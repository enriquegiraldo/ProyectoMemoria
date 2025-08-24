import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { rateLimit } from 'express-rate-limit';
import { auditLogger } from '../utils/logger';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
];

const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  body('firstName').isLength({ min: 2, max: 50 }),
  body('lastName').isLength({ min: 2, max: 50 }),
  body('consent').isBoolean().custom((value) => {
    if (!value) {
      throw new Error('Consent is required');
    }
    return true;
  }),
];

const validatePasswordChange = [
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail(),
];

const validatePasswordResetConfirm = [
  body('token').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
];

// Helper function to handle validation errors
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array(),
    });
  }
  next();
};

// Authentication routes

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', validateRegister, handleValidationErrors, async (req, res) => {
  try {
    const { email, password, firstName, lastName, consent } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authController.register({
      email,
      password,
      firstName,
      lastName,
      consent,
      ip,
      userAgent,
    });

    auditLogger.login(result.user.id, 'register', true, ip, userAgent);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    auditLogger.login('unknown', 'register', false, req.ip, req.get('User-Agent'));
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post('/login', authLimiter, validateLogin, handleValidationErrors, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent');

    const result = await authController.login({
      email,
      password,
      ip,
      userAgent,
    });

    auditLogger.login(result.user.id, 'password', true, ip, userAgent);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          twoFactorEnabled: result.user.twoFactorEnabled,
        },
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    auditLogger.login('unknown', 'password', false, req.ip, req.get('User-Agent'));
    
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;
    const ip = req.ip;

    await authController.logout({
      userId,
      refreshToken,
      ip,
    });

    auditLogger.logout(userId, ip);
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const result = await authController.refreshToken({
      refreshToken,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password', authMiddleware, validatePasswordChange, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const ip = req.ip;

    await authController.changePassword({
      userId,
      currentPassword,
      newPassword,
      ip,
    });

    auditLogger.passwordChange(userId, ip);
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password', validatePasswordReset, handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.ip;

    await authController.forgotPassword({
      email,
      ip,
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', validatePasswordResetConfirm, handleValidationErrors, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ip = req.ip;

    const result = await authController.resetPassword({
      token,
      newPassword,
      ip,
    });

    auditLogger.passwordChange(result.userId, ip);
    
    res.json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
        },
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await authController.getCurrentUser({
      userId,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email address
 * @access Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const ip = req.ip;

    const result = await authController.verifyEmail({
      token,
      ip,
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          emailVerified: result.user.emailVerified,
        },
        tokens: result.tokens,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post('/resend-verification', validatePasswordReset, handleValidationErrors, async (req, res) => {
  try {
    const { email } = req.body;
    const ip = req.ip;

    await authController.resendVerification({
      email,
      ip,
    });

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
});

export { router as authRouter };
