import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Academic', 'Facility', 'Faculty'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: [
      {
        filename: { type: String, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // E.g. If complaining about a specific Faculty member
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'processing', 'resolved'],
      default: 'open',
    },
    remarks: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ status: 1, priority: -1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
