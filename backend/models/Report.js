import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  internalMarks: {
    type: Number,
    required: true,
  },
  externalMarks: {
    type: Number,
    default: null,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
});

const reportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    facultyName: {
      type: String,
      required: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    // Attendance Section
    totalClasses: {
      type: Number,
      required: true,
    },
    attendedClasses: {
      type: Number,
      required: true,
    },
    attendancePercentage: {
      type: Number,
      required: true,
    },
    // Marks Section
    subjects: [subjectSchema],
    // Evaluation Section
    remarks: {
      type: String,
      required: true,
      trim: true,
    },
    performanceGrade: {
      type: String,
      required: true,
      trim: true,
    },
    behaviorComment: {
      type: String,
      trim: true,
      default: '',
    },
    improvementSuggestions: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      required: true,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add unique index to prevent duplicate reports for same student, month, year
reportSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);
export default Report;
