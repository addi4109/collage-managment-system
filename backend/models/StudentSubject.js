import mongoose from 'mongoose';

const studentSubjectSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
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

// Ensure a student isn't registered for the same subject multiple times in the same academic year
studentSubjectSchema.index({ studentId: 1, subjectId: 1, academicYear: 1 }, { unique: true });

const StudentSubject = mongoose.model('StudentSubject', studentSubjectSchema);
export default StudentSubject;
