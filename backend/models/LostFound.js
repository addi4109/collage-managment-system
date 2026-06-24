import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  contactInfo: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

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
    location: {
      type: String,
      trim: true,
      default: '',
    },
    date: {
      type: Date,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    year: {
      type: String,
      default: '',
      trim: true,
    },
    semester: {
      type: String,
      default: '',
      trim: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    replies: [replySchema],
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LostFound = mongoose.model('LostFound', lostFoundSchema);
export default LostFound;
