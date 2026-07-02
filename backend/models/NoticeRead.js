import mongoose from 'mongoose';

const noticeReadSchema = new mongoose.Schema(
  {
    noticeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notice',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for quick lookup and duplicate prevention
noticeReadSchema.index({ noticeId: 1, userId: 1 }, { unique: true });

const NoticeRead = mongoose.model('NoticeRead', noticeReadSchema);
export default NoticeRead;
