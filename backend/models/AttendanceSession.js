import mongoose from 'mongoose';

const attendanceSessionSchema = new mongoose.Schema(
  {
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    sessionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: String,
      default: '',
      trim: true,
    },
    semester: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      default: 5,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    sessionToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ['created', 'active', 'ended'],
      default: 'created',
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSession = mongoose.model('AttendanceSession', attendanceSessionSchema);
export default AttendanceSession;
