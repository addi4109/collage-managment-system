import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    rollNumber: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    enrolledCourses: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Student = mongoose.model('Student', studentSchema);
export default Student;
