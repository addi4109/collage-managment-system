import mongoose from 'mongoose';

const monthlyReportSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true, // e.g. "July 2026"
    },
    attendance: {
      type: Number,
      required: true, // percentage (0-100)
    },
    discipline: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Poor'],
      default: 'Good',
    },
    participation: {
      type: Number,
      required: true, // 1-10 rating
      min: 1,
      max: 10,
    },
    behavior: {
      type: Number,
      required: true, // 1-10 rating
      min: 1,
      max: 10,
    },
    punctuality: {
      type: Number,
      required: true, // 1-10 rating
      min: 1,
      max: 10,
    },
    subjects: [
      {
        subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
        subjectName: { type: String, required: true },
        score: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    remarks: {
      type: String,
      default: '',
    },
    parentViewed: {
      type: Boolean,
      default: false,
    },
    parentRemarks: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index constraint
monthlyReportSchema.index({ studentId: 1, month: 1 }, { unique: true });

const MonthlyReport = mongoose.model('MonthlyReport', monthlyReportSchema);
export default MonthlyReport;
