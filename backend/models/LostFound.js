import mongoose from 'mongoose';

const lostFoundReplySchema = new mongoose.Schema(
  {
    replierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    replierName: {
      type: String,
      required: true,
    },
    replierRole: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const lostFoundSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
    },
    contactInfo: {
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
    replies: [lostFoundReplySchema],
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      required: true,
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

lostFoundSchema.index({ departmentId: 1, year: 1, semester: 1 });

const LostFound = mongoose.model('LostFound', lostFoundSchema);
export default LostFound;
