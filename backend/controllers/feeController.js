import * as feeService from '../services/feeService.js';

export const createStructure = async (req, res) => {
  try {
    const structure = await feeService.createFeeStructure(req.body, req.user.id);
    res.status(201).json(structure);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getStructures = async (req, res) => {
  try {
    const structures = await feeService.getFeeStructures();
    res.json(structures);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve fee structures.' });
  }
};

export const createBatchInvoices = async (req, res) => {
  try {
    const invoices = await feeService.generateBatchInvoices(req.body, req.user.id);
    res.status(201).json({ message: `Successfully generated ${invoices.length} invoices.`, invoices });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyFees = async (req, res) => {
  try {
    const fees = await feeService.getStudentFeeDetails(req.user.id);
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve fee details.' });
  }
};

export const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    const fees = await feeService.getStudentFeeDetails(studentId);
    res.status(200).json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve student fee details.' });
  }
};

export const payInstallment = async (req, res) => {
  try {
    const { studentFeeId, installmentIndex, paymentMethod } = req.body;
    if (!studentFeeId || !installmentIndex || !paymentMethod) {
      return res.status(400).json({ message: 'studentFeeId, installmentIndex, and paymentMethod are required.' });
    }
    const result = await feeService.simulateInstallmentCheckout(
      req.user.id,
      studentFeeId,
      installmentIndex,
      paymentMethod
    );
    res.status(200).json({ message: 'Installment paid successfully.', ...result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getBillingStats = async (req, res) => {
  try {
    const stats = await feeService.getBillingAnalytics();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve billing analytics.' });
  }
};
