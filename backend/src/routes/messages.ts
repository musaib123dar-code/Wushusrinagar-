import { Router } from 'express';
import { MessageController } from '../controllers/MessageController';
import { authenticateToken } from '../middleware/auth';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const sendMessageValidation = [
  body('meetingId').isUUID(),
  body('content').isLength({ min: 1, max: 2000 }).trim(),
  body('type').optional().isIn(['text', 'emoji', 'system', 'file', 'image']),
  body('replyToId').optional().isUUID(),
  body('mentions').optional().isArray()
];

const editMessageValidation = [
  param('messageId').isUUID(),
  body('content').isLength({ min: 1, max: 2000 }).trim()
];

const messageIdValidation = [
  param('messageId').isUUID()
];

const meetingIdValidation = [
  param('meetingId').isUUID()
];

const searchValidation = [
  param('meetingId').isUUID(),
  query('query').isLength({ min: 2, max: 100 }).trim(),
  query('limit').optional().isInt({ min: 1, max: 50 })
];

const paginationValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('before').optional().isUUID()
];

// Apply authentication to all message routes
router.use(authenticateToken);

// Message operations
router.post('/', sendMessageValidation, MessageController.sendMessage);
router.get('/mentions', paginationValidation, MessageController.getMentions);

// Message actions
router.put('/:messageId', editMessageValidation, MessageController.editMessage);
router.delete('/:messageId', messageIdValidation, MessageController.deleteMessage);
router.post('/:messageId/read', messageIdValidation, MessageController.markAsRead);

// Meeting message operations
router.get('/meeting/:meetingId', meetingIdValidation, paginationValidation, MessageController.getMeetingMessages);
router.get('/meeting/:meetingId/search', searchValidation, MessageController.searchMessages);
router.get('/meeting/:meetingId/stats', meetingIdValidation, MessageController.getMessageStats);

export default router;