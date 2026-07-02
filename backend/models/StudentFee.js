import mongoose from 'mongoose';

const studentFeeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    totalFee: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    lastPaymentDate: {
      type: Date,
      default: null,
    },
    academicYear: {
      type: String,
      required: true, // e.g. "2026-27"
    },
    installments: [
      {
        index: { type: Number, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound unique index constraint
studentFeeSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

const StudentFee = mongoose.model('StudentFee', studentFeeSchema);
export default StudentFee;
