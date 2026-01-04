import { Router } from 'express';
import { MeetingController } from '../controllers/MeetingController';
import { authenticateToken } from '../middleware/auth';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation middleware
const createMeetingValidation = [
  body('title').isLength({ min: 1, max: 255 }).trim(),
  body('description').optional().isLength({ max: 1000 }).trim(),
  body('isPrivate').optional().isBoolean(),
  body('password').optional().isLength({ min: 1, max: 255 }),
  body('maxParticipants').isInt({ min: 1, max: 100 }),
  body('startTime').isISO8601(),
  body('duration').optional().isInt({ min: 1, max: 1440 }), // max 24 hours
  body('recordingEnabled').optional().isBoolean(),
  body('chatEnabled').optional().isBoolean(),
  body('screenShareEnabled').optional().isBoolean()
];

const joinMeetingValidation = [
  param('meetingId').isUUID(),
  body('password').optional().isLength({ min: 1, max: 255 })
];

const updateMediaStateValidation = [
  param('meetingId').isUUID(),
  body('isMuted').optional().isBoolean(),
  body('isVideoEnabled').optional().isBoolean(),
  body('isScreenSharing').optional().isBoolean()
];

const meetingIdValidation = [
  param('meetingId').isUUID()
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

// Apply authentication to all meeting routes
router.use(authenticateToken);

// Meeting CRUD operations
router.post('/', createMeetingValidation, MeetingController.createMeeting);
router.get('/upcoming', paginationValidation, MeetingController.getUpcomingMeetings);
router.get('/user/me', paginationValidation, MeetingController.getUserMeetings);

// Meeting actions
router.post('/:meetingId/join', joinMeetingValidation, MeetingController.joinMeeting);
router.post('/:meetingId/leave', meetingIdValidation, MeetingController.leaveMeeting);
router.post('/:meetingId/start', meetingIdValidation, MeetingController.startMeeting);
router.post('/:meetingId/end', meetingIdValidation, MeetingController.endMeeting);
router.post('/:meetingId/cancel', meetingIdValidation, MeetingController.cancelMeeting);

// Meeting data retrieval
router.get('/:meetingId', meetingIdValidation, MeetingController.getMeeting);
router.get('/:meetingId/participants', meetingIdValidation, MeetingController.getParticipants);

// Meeting management
router.put('/:meetingId/media-state', updateMediaStateValidation, MeetingController.updateMediaState);
router.delete('/:meetingId', meetingIdValidation, MeetingController.deleteMeeting);

export default router;