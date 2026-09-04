import FeeStructure from '../models/FeeStructure.js';
import StudentFee from '../models/StudentFee.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import { createNotification, createBatchNotifications } from './notificationService.js';
import { logActivity } from './activityLogService.js';

export const createFeeStructure = async (structureData, adminId) => {
  const { departmentId, year, semester, title, amount, category } = structureData;

  const structure = new FeeStructure({
    departmentId,
    year,
    semester,
    title,
    amount,
    category: category || 'Tuition',
  });

  await structure.save();
  await logActivity(adminId, 'CREATE_FEE_STRUCTURE', 'Billing', `Created fee structure: ${title} of amount ${amount}`);
  return structure;
};

export const getFeeStructures = async () => {
  return await FeeStructure.find().populate('departmentId', 'name code');
};

export const generateBatchInvoices = async (batchData, adminId) => {
  const { departmentId, year, semester, academicYear, installments } = batchData;

  if (!installments || !Array.isArray(installments) || installments.length === 0) {
    throw new Error('You must provide at least one installment.');
  }

  // 1. Find all students in this batch
  const students = await Student.find({ departmentId, year, semester, isDeleted: false });
  if (students.length === 0) {
    throw new Error('No students found in the specified batch.');
  }

  // 2. Fetch all matching fee structures to compute the total expected fee
  const structures = await FeeStructure.find({ departmentId, year, semester });
  if (structures.length === 0) {
    throw new Error('No fee structures defined for this batch. Create fee structures first.');
  }

  const expectedTotalFee = structures.reduce((sum, item) => sum + item.amount, 0);

  // 3. Validate installments sum against the expected total fee
  let installmentsSum = 0;
  const processedInstallments = installments.map((inst, idx) => {
    const amount = Number(inst.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Invalid amount in installment #${idx + 1}.`);
    }
    const dueDate = new Date(inst.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error(`Invalid due date in installment #${idx + 1}.`);
    }
    
    installmentsSum += amount;
    return {
      index: idx + 1,
      amount,
      dueDate,
      status: 'unpaid',
    };
  });

  if (installmentsSum !== expectedTotalFee) {
    throw new Error(`The sum of installments ($${installmentsSum}) does not match the expected total fee ($${expectedTotalFee}) for this batch.`);
  }

  const generatedFees = [];

  for (const student of students) {
    // Attempt to update or create StudentFee
    const studentFee = await StudentFee.findOneAndUpdate(
      { studentId: student.userId, academicYear },
      {
        totalFee: expectedTotalFee,
        remainingAmount: expectedTotalFee,
        paidAmount: 0,
        installments: processedInstallments,
        lastPaymentDate: null,
      },
      { upsert: true, new: true }
    );

    generatedFees.push(studentFee);

    await createNotification(
      student.userId,
      'Fee Invoice Generated',
      `An academic fee invoice of $${expectedTotalFee} has been generated for academic year ${academicYear}.`,
      'Fee Due'
    );
  }

  await logActivity(
    adminId,
    'GENERATE_BATCH_FEES',
    'Billing',
    `Generated fees for department ${departmentId}, year ${year}, sem ${semester}. Invoiced ${students.length} students.`
  );

  return generatedFees;
};

export const getStudentFeeDetails = async (studentId) => {
  const feeDetails = await StudentFee.find({ studentId }).sort({ createdAt: -1 });
  const enrichedDetails = [];

  for (const fd of feeDetails) {
    const payments = await Payment.find({ feeId: fd._id, studentId, status: 'success' }).sort({ paymentDate: -1 });
    enrichedDetails.push({
      feeDetails: fd,
      payments,
    });
  }

  return enrichedDetails;
};

export const simulateInstallmentCheckout = async (studentId, studentFeeId, installmentIndex, paymentMethod) => {
  const studentFee = await StudentFee.findOne({ _id: studentFeeId, studentId });
  if (!studentFee) {
    throw new Error('Student fee record not found.');
  }

  const instIdx = studentFee.installments.findIndex(ins => ins.index === Number(installmentIndex));
  if (instIdx === -1) {
    throw new Error('Installment not found.');
  }

  const installment = studentFee.installments[instIdx];
  if (installment.status === 'paid') {
    throw new Error('Installment is already paid.');
  }

  // Calculate late fee if past due date (e.g. $10 per day late)
  const now = new Date();
  let lateFeeCharged = 0;
  if (now > installment.dueDate) {
    const diffTime = Math.abs(now - installment.dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    lateFeeCharged = diffDays * 10; // $10 per day
  }

  // Generate receipt and transaction IDs
  const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const receiptNumber = `REC-${now.getFullYear()}-${Date.now().toString().slice(-4)}-${Math.floor(10 + Math.random() * 90)}`;

  // Mark installment as paid
  studentFee.installments[instIdx].status = 'paid';
  studentFee.paidAmount += installment.amount + lateFeeCharged;
  studentFee.remainingAmount = Math.max(0, studentFee.remainingAmount - installment.amount);
  studentFee.lastPaymentDate = now;

  await studentFee.save();

  // Create payment entry
  const payment = new Payment({
    feeId: studentFeeId,
    studentId,
    amount: installment.amount + lateFeeCharged,
    paymentDate: now,
    transactionId,
    paymentMethod,
    installmentIndex: Number(installmentIndex),
    lateFeeCharged,
    receiptNumber,
    status: 'success',
  });

  await payment.save();

  await createNotification(
    studentId,
    'Payment Successful',
    `Successfully paid installment ${installmentIndex} of amount ${installment.amount}. Receipt Number: ${receiptNumber}`,
    'Result Declared'
  );

  await logActivity(
    studentId,
    'PAY_INSTALLMENT',
    'Billing',
    `Paid installment ${installmentIndex} for student fee ${studentFeeId}. Total: ${installment.amount + lateFeeCharged}`
  );

  return { studentFee, payment };
};

export const getBillingAnalytics = async () => {
  const fees = await StudentFee.find();
  const totalBilled = fees.reduce((acc, curr) => acc + curr.totalFee, 0);
  const totalPaid = fees.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const totalDue = fees.reduce((acc, curr) => acc + curr.remainingAmount, 0);

  const paymentsCount = await Payment.countDocuments({ status: 'success' });

  return {
    totalBilled,
    totalPaid,
    totalDue,
    studentsInvoiced: fees.length,
    paymentsCount,
  };
};
