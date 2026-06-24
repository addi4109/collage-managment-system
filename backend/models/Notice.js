import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['faculty', 'admin'],
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
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
  },
  {
    timestamps: true,
  }
);

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
