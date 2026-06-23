import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    employeeId: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      default: '',
    },
    isHOD: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
