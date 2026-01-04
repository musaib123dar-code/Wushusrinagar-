import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 100 }).trim(),
  body('firstName').isLength({ min: 1, max: 100 }).trim(),
  body('lastName').isLength({ min: 1, max: 100 }).trim(),
  body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
];

const refreshTokenValidation = [
  body('refreshToken').isLength({ min: 1 })
];

const changePasswordValidation = [
  body('currentPassword').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
];

const updateProfileValidation = [
  body('firstName').optional().isLength({ min: 1, max: 100 }).trim(),
  body('lastName').optional().isLength({ min: 1, max: 100 }).trim(),
  body('avatar').optional().isURL()
];

// Routes
router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.post('/refresh-token', refreshTokenValidation, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.use(authenticateToken);

router.get('/profile', AuthController.getProfile);
router.put('/profile', updateProfileValidation, AuthController.updateProfile);
router.post('/change-password', changePasswordValidation, AuthController.changePassword);
router.get('/search', AuthController.searchUsers);
router.get('/online', AuthController.getOnlineUsers);

export default router;