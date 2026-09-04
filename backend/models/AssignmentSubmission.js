import mongoose from 'mongoose';

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    marks: {
      type: Number,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['submitted', 'graded'],
      default: 'submitted',
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index constraint
assignmentSubmissionSchema.index(
  { assignmentId: 1, studentId: 1, attemptNumber: 1 },
  { unique: true }
);

const AssignmentSubmission = mongoose.model(
  'AssignmentSubmission',
  assignmentSubmissionSchema
);

export default AssignmentSubmission;
