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
    eventType: {
      type: String,
      enum: ['holiday', 'event', 'exam', 'seminar', 'cultural'],
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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // null means all / college-level visibility
    },
    visibility: {
      type: String,
      enum: ['college', 'department'],
      default: 'college',
    },
    color: {
      type: String,
      default: '#1976d2',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ departmentId: 1, visibility: 1 });

const Event = mongoose.model('Event', eventSchema);
export default Event;
