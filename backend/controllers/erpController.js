import Placement from '../models/Placement.js';
import Book from '../models/Book.js';
import Fee from '../models/Fee.js';
import Event from '../models/Event.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import Student from '../models/Student.js';

// ──────────────────────────────────────────────────────────
// PLACEMENT MODULE
// ──────────────────────────────────────────────────────────

export const createPlacementDrive = async (req, res) => {
  const { companyName, jobProfile, ctcPackage, driveDate, eligibilityCriteria, department, year, semester } = req.body;

  if (!companyName || !jobProfile || !ctcPackage || !driveDate || !department || !year || !semester) {
    return res.status(400).json({ message: 'Missing required placement drive details.' });
  }

  try {
    const drive = new Placement({
      companyName,
      jobProfile,
      ctcPackage,
      driveDate: new Date(driveDate),
      eligibilityCriteria,
      department,
      year,
      semester,
      eligibleStudents: [],
      selectedStudents: [],
    });

    await drive.save();
    res.status(201).json({ success: true, drive });
  } catch (error) {
    console.error('Create placement drive error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getPlacementDrives = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.department = req.user.department;
      query.year = req.user.year;
      query.semester = req.user.semester;
    } else if (req.user.role === 'faculty') {
      query.department = req.user.department;
      query.semester = { $in: req.user.assignedSemesters };
    }

    const drives = await Placement.find(query).sort({ driveDate: 1 });
    res.json(drives);
  } catch (error) {
    console.error('Get placement drives error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const applyToPlacementDrive = async (req, res) => {
  const { driveId } = req.params;

  try {
    const drive = await Placement.findById(driveId);
    if (!drive) return res.status(404).json({ message: 'Placement drive not found.' });

    // Check if student already applied
    if (drive.eligibleStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'You have already registered for this drive.' });
    }

    // Verify CGPA eligibility if specified
    if (drive.eligibilityCriteria && drive.eligibilityCriteria.toLowerCase().includes('cgpa')) {
      // Find latest CGPA from results
      const studentResults = await Result.find({ studentId: req.user.id, status: 'declared' }).sort({ semester: -1 });
      if (studentResults.length > 0) {
        const latestResult = studentResults[0];
        // Parse minimum CGPA requirements (e.g. "CGPA > 7.5")
        const match = drive.eligibilityCriteria.match(/(\d+(\.\d+)?)/);
        if (match) {
          const reqCgpa = parseFloat(match[0]);
          if (latestResult.cgpa < reqCgpa) {
            return res.status(400).json({
              message: `You do not meet the eligibility criteria. Required CGPA: ${reqCgpa}, Your CGPA: ${latestResult.cgpa}`
            });
          }
        }
      }
    }

    drive.eligibleStudents.push(req.user.id);
    await drive.save();

    res.json({ success: true, message: 'Successfully applied to placement drive.', drive });
  } catch (error) {
    console.error('Apply placement drive error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updatePlacementSelections = async (req, res) => {
  const { driveId } = req.params;
  const { selectedStudents } = req.body; // Array of { studentId, studentName, rollNumber, packageOffered }

  try {
    const drive = await Placement.findById(driveId);
    if (!drive) return res.status(404).json({ message: 'Placement drive not found.' });

    drive.selectedStudents = selectedStudents;
    await drive.save();

    res.json({ success: true, message: 'Placement selection results updated.', drive });
  } catch (error) {
    console.error('Update placement selection error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// LIBRARY MODULE
// ──────────────────────────────────────────────────────────

export const addBook = async (req, res) => {
  const { title, author, isbn, category } = req.body;
  if (!title || !author) return res.status(400).json({ message: 'Title and author are required.' });

  try {
    const newBook = new Book({ title, author, isbn, category, status: 'available' });
    await newBook.save();
    res.status(201).json({ success: true, book: newBook });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getBooks = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }
    const books = await Book.find(query).sort({ title: 1 });
    res.json(books);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const issueBook = async (req, res) => {
  const { bookId } = req.params;
  const { rollNumber, days } = req.body; // days default 14

  if (!rollNumber) return res.status(400).json({ message: 'Student roll number is required.' });

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    if (book.status === 'issued') return res.status(400).json({ message: 'Book is already issued.' });

    // Look up student by rollNumber
    const studentUser = await User.findOne({ rollNumber: rollNumber.trim(), role: 'student' });
    if (!studentUser) return res.status(404).json({ message: 'Student roll number not found.' });

    const issueDays = Number(days) || 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + issueDays);

    book.status = 'issued';
    book.issuedTo = studentUser._id;
    book.issuedStudentName = studentUser.name;
    book.issuedRollNumber = studentUser.rollNumber;
    book.issuedDate = new Date();
    book.dueDate = dueDate;
    book.fineAmount = 0;

    await book.save();
    res.json({ success: true, message: `Book issued to ${studentUser.name} successfully.`, book });
  } catch (error) {
    console.error('Issue book error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const returnBook = async (req, res) => {
  const { bookId } = req.params;

  try {
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    if (book.status === 'available') return res.status(400).json({ message: 'Book is not currently issued.' });

    // Calculate fine if past due date (e.g. Rs 5 per day overdue)
    let fine = 0;
    const today = new Date();
    if (book.dueDate && today > new Date(book.dueDate)) {
      const diffTime = Math.abs(today - new Date(book.dueDate));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 5;
    }

    book.status = 'available';
    book.issuedTo = null;
    book.issuedStudentName = '';
    book.issuedRollNumber = '';
    book.issuedDate = null;
    book.dueDate = null;
    book.fineAmount = fine;

    await book.save();
    res.json({
      success: true,
      message: fine > 0 ? `Book returned. Overdue fine calculated: Rs. ${fine}.` : 'Book returned successfully with no outstanding fine.',
      book,
      finePaid: fine
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// FEE MODULE
// ──────────────────────────────────────────────────────────

export const getStudentFeeDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'student') {
      let fee = await Fee.findOne({ studentId: user._id });
      if (!fee) {
        // Create a default fee structure for the student if none exists
        fee = new Fee({
          studentId: user._id,
          studentName: user.name,
          rollNumber: user.rollNumber,
          department: user.department,
          year: user.year,
          semester: user.semester,
          totalAmount: 60000,
          paidAmount: 0,
          dueAmount: 60000,
          status: 'unpaid',
          paymentHistory: [],
        });
        await fee.save();
      }
      return res.json([fee]);
    }

    // Faculty or Admin query
    let filter = {};
    if (user.role === 'faculty') {
      filter.department = user.department;
      filter.semester = { $in: user.assignedSemesters };
    }

    const feesList = await Fee.find(filter).sort({ rollNumber: 1 });
    res.json(feesList);
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const payFee = async (req, res) => {
  const { amount, transactionId, paymentMode } = req.body;

  if (!amount || amount <= 0 || !transactionId || !paymentMode) {
    return res.status(400).json({ message: 'Missing transaction details.' });
  }

  try {
    let fee = await Fee.findOne({ studentId: req.user.id });
    if (!fee) {
      // Auto-provision
      fee = new Fee({
        studentId: req.user.id,
        studentName: req.user.name,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
        year: req.user.year,
        semester: req.user.semester,
        totalAmount: 60000,
        paidAmount: 0,
        dueAmount: 60000,
        status: 'unpaid',
        paymentHistory: [],
      });
    }

    const payAmt = Number(amount);
    if (payAmt > fee.dueAmount) {
      return res.status(400).json({ message: `Payment amount Rs. ${payAmt} exceeds due amount Rs. ${fee.dueAmount}.` });
    }

    fee.paidAmount += payAmt;
    fee.dueAmount -= payAmt;
    fee.status = fee.dueAmount === 0 ? 'paid' : 'partial';

    fee.paymentHistory.push({
      amountPaid: payAmt,
      transactionId,
      paymentMode,
      paymentDate: new Date(),
    });

    await fee.save();
    res.json({ success: true, message: 'Payment recorded successfully.', fee });
  } catch (error) {
    console.error('Pay fee error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const setFeeStructure = async (req, res) => {
  const { studentId, totalAmount } = req.body;

  if (!studentId || totalAmount === undefined) {
    return res.status(400).json({ message: 'Student ID and total amount are required.' });
  }

  try {
    const studentUser = await User.findById(studentId);
    if (!studentUser) return res.status(404).json({ message: 'Student not found.' });

    let fee = await Fee.findOne({ studentId });
    if (fee) {
      fee.totalAmount = Number(totalAmount);
      fee.dueAmount = fee.totalAmount - fee.paidAmount;
      fee.status = fee.dueAmount <= 0 ? 'paid' : fee.paidAmount > 0 ? 'partial' : 'unpaid';
    } else {
      fee = new Fee({
        studentId,
        studentName: studentUser.name,
        rollNumber: studentUser.rollNumber,
        department: studentUser.department,
        year: studentUser.year,
        semester: studentUser.semester,
        totalAmount: Number(totalAmount),
        paidAmount: 0,
        dueAmount: Number(totalAmount),
        status: 'unpaid',
        paymentHistory: [],
      });
    }

    await fee.save();
    res.json({ success: true, message: 'Fee structure updated successfully.', fee });
  } catch (error) {
    console.error('Set fee error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// ACADEMIC CALENDAR
// ──────────────────────────────────────────────────────────

export const addCalendarEvent = async (req, res) => {
  const { title, description, type, startDate, endDate, department, year, semester } = req.body;

  if (!title || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, start date, and end date are required.' });
  }

  try {
    const event = new Event({
      title,
      description: description || '',
      type: type || 'event',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      department: department || 'All',
      year: year || 'All',
      semester: semester || 'All',
    });

    await event.save();
    res.status(201).json({ success: true, event });
  } catch (error) {
    console.error('Add calendar event error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getCalendarEvents = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.$and = [
        { $or: [{ department: req.user.department }, { department: 'All' }] },
        { $or: [{ year: req.user.year }, { year: 'All' }] },
        { $or: [{ semester: req.user.semester }, { semester: 'All' }] }
      ];
    } else if (req.user.role === 'faculty') {
      query.$and = [
        { $or: [{ department: req.user.department }, { department: 'All' }] },
        { $or: [{ semester: { $in: req.user.assignedSemesters } }, { semester: 'All' }] }
      ];
    }

    const events = await Event.find(query).sort({ startDate: 1 });
    res.json(events);
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// ──────────────────────────────────────────────────────────
// CERTIFICATE GENERATION MODULE
// ──────────────────────────────────────────────────────────

export const requestCertificate = async (req, res) => {
  const { type } = req.body; // 'bonafide' | 'leaving' | 'internship'

  if (!['bonafide', 'leaving', 'internship'].includes(type)) {
    return res.status(400).json({ message: 'Invalid certificate type.' });
  }

  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'Only active students can request certificates.' });
    }

    // Generate certificate metadata dynamically
    const verificationCode = 'CERT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const certDetails = {
      studentName: student.name,
      rollNumber: student.rollNumber,
      enrollmentNumber: student.enrollmentNumber || 'N/A',
      department: student.department,
      year: student.year,
      semester: student.semester,
      type,
      verificationCode,
      dateGenerated: new Date().toLocaleDateString(),
      collegeName: 'AntiGravity Engineering College',
      status: 'Verified',
    };

    res.json({ success: true, certificate: certDetails });
  } catch (error) {
    console.error('Certificate request error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
