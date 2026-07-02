import mongoose from 'mongoose';

const studentResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    internalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    practicalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 30,
    },
    theoryMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 80,
    },
    attendancePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    grade: {
      type: String,
      required: true,
    },
    gp: {
      type: Number,
      required: true,
    },
    pass: {
      type: Boolean,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const resultBatchSchema = new mongoose.Schema(
  {
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    year: {
      type: String,
      required: true,
      enum: ['First Year', 'Second Year', 'Third Year'],
    },
    semester: {
      type: String,
      required: true,
      enum: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    results: {
      type: [studentResultSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'declared'],
      default: 'draft',
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

resultBatchSchema.index({ departmentId: 1, year: 1, semester: 1 }, { unique: true });

const ResultBatch = mongoose.model('ResultBatch', resultBatchSchema);
export default ResultBatch;
