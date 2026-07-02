import mongoose from 'mongoose';

const studentSemesterResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    semester: {
      type: String,
      required: true,
      enum: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
    },
    sgpa: {
      type: Number,
      required: true,
    },
    cgpa: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    declaredDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentSemesterResultSchema.index({ studentId: 1, semester: 1 }, { unique: true });

const StudentSemesterResult = mongoose.model('StudentSemesterResult', studentSemesterResultSchema);
export default StudentSemesterResult;
