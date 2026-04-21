import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true }, // Format "HH:mm"
  endTime: { type: String, required: true }, // Format "HH:mm"
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  meetingLink: { type: String } // E.g., for routing them to Video Call room
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
