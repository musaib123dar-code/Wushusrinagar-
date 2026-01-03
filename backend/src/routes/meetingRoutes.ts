import { Router } from 'express';
import { MeetingController } from '../controllers/meetingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, MeetingController.create);
router.get('/upcoming', authenticate, MeetingController.listUpcoming);
router.get('/my-meetings', authenticate, MeetingController.listByHost);
router.get('/:id', authenticate, MeetingController.getById);
router.get('/code/:code', MeetingController.getByCode);
router.post('/:id/start', authenticate, MeetingController.start);
router.post('/:id/end', authenticate, MeetingController.end);
router.delete('/:id', authenticate, MeetingController.delete);

export default router;
