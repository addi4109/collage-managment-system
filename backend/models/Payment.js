import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentFee',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    installmentIndex: {
      type: Number,
      default: null,
    },
    lateFeeCharged: {
      type: Number,
      default: 0,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'success',
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
