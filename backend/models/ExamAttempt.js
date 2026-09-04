import mongoose from 'mongoose';

const proctorLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      enum: ['CAMERA_OFF', 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'FOCUS_LOST', 'RIGHT_CLICK_ATTEMPT', 'COPY_PASTE_ATTEMPT'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    answers: {
      type: [Number], // array of selected option indexes (or -1 for skipped)
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    proctorWarnings: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
    integrityLogs: {
      type: [proctorLogSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attempts for the same exam by the same student
examAttemptSchema.index({ studentId: 1, examId: 1 }, { unique: true });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);
export default ExamAttempt;
