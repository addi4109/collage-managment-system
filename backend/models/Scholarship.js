import mongoose from 'mongoose';

const scholarshipSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['Government', 'Private', 'Merit'],
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'verified', 'approved', 'disbursed', 'rejected'],
      default: 'applied',
    },
    disbursementDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

scholarshipSchema.index({ studentId: 1, status: 1 });

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
export default Scholarship;
