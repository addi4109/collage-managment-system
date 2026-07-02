import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Exam', 'Placement', 'Scholarship', 'Holiday', 'Department', 'Emergency'],
      default: 'General',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    attachments: [
      {
        filename: { type: String, required: true },
        fileUrl: { type: String, required: true },
      },
    ],
    publishAt: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // null means all departments
    },
    year: {
      type: String,
      enum: ['First Year', 'Second Year', 'Third Year', 'All'],
      default: 'All',
    },
    semester: {
      type: String,
      default: 'All', // e.g. 'Sem 1', 'Sem 2', etc., or 'All'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

noticeSchema.index({ departmentId: 1, year: 1, semester: 1, publishAt: -1 });
noticeSchema.index({ pinned: -1, publishAt: -1 });

const Notice = mongoose.model('Notice', noticeSchema);
export default Notice;
