import Book from '../models/Book.js';
import BookIssueLog from '../models/BookIssueLog.js';
import Student from '../models/Student.js';
import User from '../models/User.js';
import { createNotification } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const addBook = async (bookData, adminId) => {
  const { title, author, isbn, category, bookCode, totalCopies } = bookData;

  const existing = await Book.findOne({ bookCode });
  if (existing) {
    throw new Error(`Book with code ${bookCode} already exists.`);
  }

  const book = new Book({
    title,
    author,
    isbn,
    category,
    bookCode,
    totalCopies: totalCopies || 1,
    availableCopies: totalCopies || 1,
  });

  await book.save();
  await logActivity(adminId, 'ADD_BOOK', 'Library', `Added book to catalog: ${title} (${bookCode})`);
  return book;
};

export const getBooks = async () => {
  return await Book.find().sort({ title: 1 });
};

export const issueBook = async (bookCode, studentUserId, days = 14, adminId) => {
  const book = await Book.findOne({ bookCode });
  if (!book) {
    throw new Error('Book not found in library catalog.');
  }

  if (book.availableCopies <= 0) {
    throw new Error('No available copies of this book are left to issue.');
  }

  const studentUser = await User.findById(studentUserId);
  if (!studentUser || studentUser.role !== 'student') {
    throw new Error('Invalid student user.');
  }

  // Check if student already has this book issued and not returned
  const alreadyIssued = await BookIssueLog.findOne({
    bookId: book._id,
    studentId: studentUserId,
    status: { $in: ['issued', 'overdue'] },
  });

  if (alreadyIssued) {
    throw new Error('This book is already issued to the student.');
  }

  const now = new Date();
  const dueDate = new Date();
  dueDate.setDate(now.getDate() + Number(days));

  const log = new BookIssueLog({
    bookId: book._id,
    studentId: studentUserId,
    issuedDate: now,
    dueDate,
    status: 'issued',
  });

  await log.save();

  // Decrement copy counter
  book.availableCopies -= 1;
  await book.save();

  await createNotification(
    studentUserId,
    'Book Issued',
    `Book "${book.title}" was issued to you. Due date: ${dueDate.toLocaleDateString()}`,
    'Fee Due'
  );

  await logActivity(adminId, 'ISSUE_BOOK', 'Library', `Issued book code ${bookCode} to student ${studentUserId}`);
  return log;
};

export const returnBook = async (issueLogId, adminId) => {
  const log = await BookIssueLog.findById(issueLogId).populate('bookId');
  if (!log) {
    throw new Error('Book issue record not found.');
  }

  if (log.status === 'returned') {
    throw new Error('Book is already marked as returned.');
  }

  const now = new Date();
  let fineAmount = 0;

  // Calculate late fines if overdue
  if (now > log.dueDate) {
    const diffTime = Math.abs(now - log.dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    fineAmount = diffDays * (log.bookId.finePerDay || 2);
  }

  log.returnDate = now;
  log.fineAmount = fineAmount;
  log.status = 'returned';
  await log.save();

  // Increment copy counter
  const book = log.bookId;
  book.availableCopies += 1;
  await book.save();

  await createNotification(
    log.studentId,
    'Book Returned',
    `Book "${book.title}" returned successfully. Fine charged: $${fineAmount}`,
    'Result Declared'
  );

  await logActivity(adminId, 'RETURN_BOOK', 'Library', `Returned book code ${book.bookCode} from student ${log.studentId}. Fine: ${fineAmount}`);
  return log;
};

export const getStudentIssues = async (studentUserId) => {
  const logs = await BookIssueLog.find({ studentId: studentUserId })
    .populate('bookId')
    .sort({ status: -1, issuedDate: -1 });

  // Enrich with dynamic overdue fine estimates
  return logs.map(l => {
    let currentFine = l.fineAmount;
    let computedStatus = l.status;
    const now = new Date();

    if (l.status === 'issued' && now > l.dueDate) {
      computedStatus = 'overdue';
      const diffTime = Math.abs(now - l.dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      currentFine = diffDays * (l.bookId.finePerDay || 2);
    }

    return {
      ...l.toObject(),
      status: computedStatus,
      fineAmount: currentFine,
    };
  });
};

export const getAllIssueLogs = async () => {
  const logs = await BookIssueLog.find()
    .populate('bookId')
    .populate('studentId', 'name email')
    .sort({ status: -1, issuedDate: -1 });

  // Enrich with dynamic overdue status & fine estimates
  const enriched = [];
  for (const l of logs) {
    let currentFine = l.fineAmount;
    let computedStatus = l.status;
    const now = new Date();

    if (l.status === 'issued' && now > l.dueDate) {
      computedStatus = 'overdue';
      const diffTime = Math.abs(now - l.dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      currentFine = diffDays * (l.bookId.finePerDay || 2);
    }

    const studentProfile = l.studentId
      ? await Student.findOne({ userId: l.studentId._id, isDeleted: false })
      : null;

    enriched.push({
      ...l.toObject(),
      status: computedStatus,
      fineAmount: currentFine,
      studentProfile: studentProfile
        ? { rollNumber: studentProfile.rollNumber, enrollmentNumber: studentProfile.enrollmentNumber }
        : null,
    });
  }

  return enriched;
};
