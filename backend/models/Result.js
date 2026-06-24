import mongoose from 'mongoose';

const SubjectResultSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    trim: true,
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 0,
  },
  obtainedMarks: {
    type: Number,
    required: true,
    min: 0,
  },
  grade: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail'],
  },
});

const ResultSchema = new mongoose.Schema(
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
    rollNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    courseName: {
      type: String,
      trim: true,
    },
    semester: {
      type: String,
      trim: true,
    },
    year: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    facultyName: {
      type: String,
    },
    subjects: {
      type: [SubjectResultSchema],
      required: true,
      validate: [
        (val) => val.length > 0,
        'At least one subject mark record must be provided.',
      ],
    },
    // Calculated Summary Metrics
    totalMarks: {
      type: Number,
      default: 0,
    },
    obtainedMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    cgpa: {
      type: Number,
      default: 0,
    },
    overallGrade: {
      type: String,
      trim: true,
    },
    overallResult: {
      type: String,
      enum: ['Pass', 'Fail'],
    },
    // Extra academic parameters
    attendancePercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    internalMarksTotal: {
      type: Number,
      min: 0,
    },
    practicalMarksTotal: {
      type: Number,
      min: 0,
    },
    theoryMarksTotal: {
      type: Number,
      min: 0,
    },
    // Workflow State Machine
    status: {
      type: String,
      enum: ['draft', 'submitted', 'verified', 'declared'],
      default: 'draft',
      index: true,
    },
    // Audit Trails
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    declaredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast lookups
ResultSchema.index({ studentId: 1 });
ResultSchema.index({ facultyId: 1 });
ResultSchema.index({ status: 1 });
ResultSchema.index({ department: 1, semester: 1, academicYear: 1 });

const Result = mongoose.model('Result', ResultSchema);
export default Result;

