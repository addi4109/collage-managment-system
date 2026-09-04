import mongoose from 'mongoose';

const bookIssueLogSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
      default: null,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
  },
  {
    timestamps: true,
  }
);

bookIssueLogSchema.index({ studentId: 1, status: 1 });

const BookIssueLog = mongoose.model('BookIssueLog', bookIssueLogSchema);
export default BookIssueLog;
