import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: ['holiday', 'event', 'exam'],
      default: 'event',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    department: {
      type: String, // e.g. "Computer Engineering" or "All"
      default: 'All',
    },
    year: {
      type: String, // e.g. "First Year" or "All"
      default: 'All',
    },
    semester: {
      type: String, // e.g. "Sem 1" or "All"
      default: 'All',
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model('Event', eventSchema);
export default Event;
