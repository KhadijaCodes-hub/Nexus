import Meeting from '../models/Meeting.js';

// Helper to convert HH:mm to minutes for overlap check
const getMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// @desc    Get all active meetings for a user
// @route   GET /api/meetings
export const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const meetings = await Meeting.find({
      $or: [{ organizerId: userId }, { attendeeId: userId }]
    }).populate('organizerId', 'name email avatarUrl role')
      .populate('attendeeId', 'name email avatarUrl role');
    
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Schedule a new meeting
// @route   POST /api/meetings
export const scheduleMeeting = async (req, res) => {
  try {
    const { attendeeId, title, description, date, startTime, endTime } = req.body;
    const organizerId = req.user._id;

    const startMins = getMinutes(startTime);
    const endMins = getMinutes(endTime);

    if (startMins >= endMins) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check for double booking conflicts on the same date for either user
    // A conflict occurs if an existing meeting overlaps the requested time window
    const targetDate = new Date(date);
    targetDate.setHours(0,0,0,0);
    
    const existingDateMeetings = await Meeting.find({
      date: targetDate,
      status: { $in: ['pending', 'accepted'] },
      $or: [
        { organizerId: organizerId }, { attendeeId: organizerId },
        { organizerId: attendeeId }, { attendeeId: attendeeId }
      ]
    });

    const isConflict = existingDateMeetings.some(meeting => {
      const existingStart = getMinutes(meeting.startTime);
      const existingEnd = getMinutes(meeting.endTime);
      
      // Conflict condition: new meeting starts before existing ends AND new ends after existing starts
      return (startMins < existingEnd && endMins > existingStart);
    });

    if (isConflict) {
      return res.status(409).json({ message: 'Time conflict detected. One of the participants is already booked.' });
    }

    // Auto generate a local room ID for Video calls
    const meetingLink = `/chat/${Math.random().toString(36).substring(7)}`;

    const newMeeting = await Meeting.create({
      organizerId,
      attendeeId,
      title,
      description,
      date: targetDate,
      startTime,
      endTime,
      meetingLink
    });

    res.status(201).json(newMeeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
export const updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Ensure the person accepting/rejecting is the attendee
    if (meeting.attendeeId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the attendee can accept or reject' });
    }

    meeting.status = status;
    await meeting.save();
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
