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
    bookCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    finePerDay: {
      type: Number,
      default: 2, // fine in currency units per day overdue
    },
  },
  {
    timestamps: true,
  }
);

bookSchema.index({ bookCode: 1 });
bookSchema.index({ title: 1 });

const Book = mongoose.model('Book', bookSchema);
export default Book;
