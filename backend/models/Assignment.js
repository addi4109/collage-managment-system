import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    maxMarks: {
      type: Number,
      required: true,
      default: 20,
    },
    attachments: [
      {
        filename: { type: String, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    allowLateSubmission: {
      type: Boolean,
      default: true,
    },
    latePenaltyMarks: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    maxAttempts: {
      type: Number,
      default: 3,
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

assignmentSchema.index({ departmentId: 1, year: 1, semester: 1, subjectId: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
