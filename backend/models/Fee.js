import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    year: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'partial', 'unpaid'],
      default: 'unpaid',
      required: true,
    },
    paymentHistory: [
      {
        amountPaid: Number,
        transactionId: String,
        paymentMode: String, // e.g. "UPI", "Card", "Cash"
        paymentDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;
