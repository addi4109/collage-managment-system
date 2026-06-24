import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number,
      required: true, // in minutes
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'scheduled', 'active', 'completed'],
      default: 'draft',
      required: true,
    },
    scheduledAt: {
      type: Date,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    approvalComment: {
      type: String,
      default: '',
    },
    resultsPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
