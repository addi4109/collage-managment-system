import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: true,
    },
    date: {
      type: Date,
      required: true,
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
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: true,
      default: 'Present',
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent marking a student's attendance multiple times for the same session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true });
// Keep the old unique constraint index for date-based roll calls if still referenced
attendanceSchema.index({ student: 1, date: 1, session: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
