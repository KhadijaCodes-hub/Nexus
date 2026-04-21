import express from 'express';
import { getMyMeetings, scheduleMeeting, updateMeetingStatus } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getMyMeetings)
  .post(protect, scheduleMeeting);

router.put('/:id/status', protect, updateMeetingStatus);

export default router;
