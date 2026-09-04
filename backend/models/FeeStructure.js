import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['Tuition', 'Library', 'Lab', 'Exam'],
      default: 'Tuition',
    },
  },
  {
    timestamps: true,
  }
);

feeStructureSchema.index({ departmentId: 1, year: 1, semester: 1 });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;
