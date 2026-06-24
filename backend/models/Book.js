import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'issued'],
      default: 'available',
      required: true,
    },
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedStudentName: {
      type: String,
      default: '',
    },
    issuedRollNumber: {
      type: String,
      default: '',
    },
    issuedDate: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Book = mongoose.model('Book', bookSchema);
export default Book;
