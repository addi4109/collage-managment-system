import mongoose from 'mongoose';

const examAttemptSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Question',
          required: true,
        },
        selectedAnswer: {
          type: String,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'submitted', 'blocked'],
      default: 'active',
      required: true,
    },
    warnings: {
      type: Number,
      default: 0,
    },
    startTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple exam attempts per student on the same exam paper
examAttemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const ExamAttempt = mongoose.model('ExamAttempt', examAttemptSchema);
export default ExamAttempt;
