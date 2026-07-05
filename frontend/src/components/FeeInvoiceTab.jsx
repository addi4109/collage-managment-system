import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  LinearProgress,
  Stack,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaidIcon from '@mui/icons-material/Paid';
import AddIcon from '@mui/icons-material/Add';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function FeeInvoiceTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Student Fee Details & Payments
  const [feeRecords, setFeeRecords] = useState([]);
  const [openPay, setOpenPay] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState(null);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Admin Fee structures & creations
  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openStructure, setOpenStructure] = useState(false);
  const [structureForm, setStructureForm] = useState({
    title: '',
    amount: 10000,
    category: 'Tuition',
    departmentId: '',
    year: 'First Year',
    semester: 'Sem 1',
  });

  const [openBatch, setOpenBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    departmentId: '',
    year: 'First Year',
    semester: 'Sem 1',
    academicYear: '2026-27',
    installmentCount: 2,
  });

  const [analytics, setAnalytics] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const res = await api.get('/fees/my');
        setFeeRecords(res.data);
      } else {
        const structRes = await api.get('/fees/structures');
        setStructures(structRes.data);
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
        const analRes = await api.get('/fees/analytics');
        setAnalytics(analRes.data);
      }
    } catch (err) {
      showToast('Error loading billing details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateStructure = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/structures', structureForm);
      showToast('Fee structure added successfully.', 'success');
      setOpenStructure(false);
      loadData();
    } catch (err) {
      showToast('Error creating fee structure.', 'error');
    }
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/batch-invoice', batchForm);
      showToast('Invoices generated successfully for this batch.', 'success');
      setOpenBatch(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error generating batch invoices.', 'error');
    }
  };

  const handleProcessPayment = async () => {
    try {
      await api.post('/fees/pay', {
        studentFeeId: selectedFeeRecord._id,
        installmentIndex: selectedInstallment.index,
        paymentMethod,
      });
      showToast('Installment payment simulated successfully!', 'success');
      setOpenPay(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Payment simulation failed.', 'error');
    }
  };

  const handlePrintReceipt = (payment) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${payment.receiptNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
            .receipt-box { border: 1px solid #ccc; padding: 25px; border-radius: 10px; max-width: 600px; margin: auto; }
            h2 { color: #1976d2; text-align: center; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <h2>OFFICIAL FEE RECEIPT</h2>
            <hr/>
            <div class="row"><span class="label">Receipt Number:</span><span>${payment.receiptNumber}</span></div>
            <div class="row"><span class="label">Transaction ID:</span><span>${payment.transactionId}</span></div>
            <div class="row"><span class="label">Date Paid:</span><span>${new Date(payment.paymentDate).toLocaleString()}</span></div>
            <div class="row"><span class="label">Payment Method:</span><span>${payment.paymentMethod}</span></div>
            <div class="row"><span class="label">Installment Paid:</span><span>Installment #${payment.installmentIndex}</span></div>
            <div class="row"><span class="label">Late Fee Penalty:</span><span>$${payment.lateFeeCharged}</span></div>
            <hr/>
            <div class="row" style="font-size: 1.2rem;"><span class="label">Total Paid Amount:</span><span>$${payment.amount}</span></div>
            <hr/>
            <p style="text-align: center; font-size: 0.9rem; color: #666;">This is a system generated mock invoice copy.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReceiptIcon color="primary" /> Fees & Billing Panel
        </Typography>
        {role === 'admin' && (
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenStructure(true)}>
              Define Structure
            </Button>
            <Button variant="contained" startIcon={<LocalActivityIcon />} onClick={() => setOpenBatch(true)}>
              Generate Batch Invoices
            </Button>
          </Stack>
        )}
      </Box>

      {role === 'student' ? (
        feeRecords.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
            <Typography color="text.secondary">No fee structures invoiced for your profile yet.</Typography>
          </Card>
        ) : (
          <Stack spacing={4}>
            {feeRecords.map(({ feeDetails, payments }) => {
              return (
                <Grid container spacing={4} key={feeDetails._id}>
                  {/* Summary Card */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'primary.light', color: '#fff' }}>
                      <Typography variant="subtitle2">Academic Year: {feeDetails.academicYear}</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 2, mb: 1 }}>
                        ${feeDetails.remainingAmount}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8, mb: 3 }}>
                        Outstanding Balance
                      </Typography>
                      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 2 }} />
                      <Stack spacing={1}>
                        <Typography variant="caption">Total Fee: ${feeDetails.totalFee}</Typography>
                        <Typography variant="caption">Total Paid: ${feeDetails.paidAmount}</Typography>
                        {feeDetails.lastPaymentDate && (
                          <Typography variant="caption">
                            Last Payment: {new Date(feeDetails.lastPaymentDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    </Card>
                  </Grid>

                  {/* Installments table */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Installments Schedule
                    </Typography>
                    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 4 }}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell>Installment</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Due Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {feeDetails.installments.map((inst) => {
                            const isPastDue = new Date() > new Date(inst.dueDate);
                            const matchingPayment = payments.find(p => p.installmentIndex === inst.index);

                            return (
                              <TableRow key={inst.index}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Installment #{inst.index}</TableCell>
                                <TableCell>${inst.amount}</TableCell>
                                <TableCell>
                                  {new Date(inst.dueDate).toLocaleDateString()}
                                  {inst.status === 'unpaid' && isPastDue && (
                                    <Chip label="Overdue" size="small" color="error" sx={{ ml: 1 }} />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={inst.status}
                                    color={inst.status === 'paid' ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {inst.status === 'unpaid' ? (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<CreditCardIcon />}
                                      onClick={() => {
                                        setSelectedFeeRecord(feeDetails);
                                        setSelectedInstallment(inst);
                                        setOpenPay(true);
                                      }}
                                    >
                                      Pay Now
                                    </Button>
                                  ) : (
                                    matchingPayment && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handlePrintReceipt(matchingPayment)}
                                      >
                                        Receipt
                                      </Button>
                                    )
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              );
            })}
          </Stack>
        )
      ) : (
        /* ADMIN VIEW */
        <Box sx={{ mt: 2 }}>
          {analytics && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: '16px', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Billed Fees</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>${analytics.totalBilled}</Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: '16px', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Collections</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>${analytics.totalPaid}</Typography>
                  </Box>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 3, borderRadius: '16px', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <ReceiptIcon color="error" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Outstanding Dues</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>${analytics.totalDue}</Typography>
                  </Box>
                </Card>
              </Grid>
            </Grid>
          )}

          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            General Fee Structures Defined
          </Typography>
          {structures.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
              <Typography color="text.secondary">No fee structures created yet.</Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Batch / Sem</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {structures.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{s.title}</TableCell>
                      <TableCell>{s.category}</TableCell>
                      <TableCell>{s.departmentId?.name}</TableCell>
                      <TableCell>{s.year} / {s.semester}</TableCell>
                      <TableCell align="right">${s.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* DEFINE STRUCTURE DIALOG */}
      <Dialog open={openStructure} onClose={() => setOpenStructure(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateStructure}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Define Fee Structure</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Fee Structure Title"
              fullWidth
              required
              value={structureForm.title}
              onChange={(e) => setStructureForm({ ...structureForm, title: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Amount"
                  type="number"
                  fullWidth
                  required
                  value={structureForm.amount}
                  onChange={(e) => setStructureForm({ ...structureForm, amount: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={structureForm.category}
                  onChange={(e) => setStructureForm({ ...structureForm, category: e.target.value })}
                >
                  {['Tuition', 'Library', 'Lab', 'Exam'].map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              select
              label="Select Department"
              fullWidth
              required
              value={structureForm.departmentId}
              onChange={(e) => setStructureForm({ ...structureForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Year"
                  fullWidth
                  value={structureForm.year}
                  onChange={(e) => setStructureForm({ ...structureForm, year: e.target.value })}
                >
                  {['First Year', 'Second Year', 'Third Year'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Semester"
                  fullWidth
                  value={structureForm.semester}
                  onChange={(e) => setStructureForm({ ...structureForm, semester: e.target.value })}
                >
                  {getSemestersForYear(structureForm.year).map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenStructure(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Define</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* GENERATE BATCH INVOICES DIALOG */}
      <Dialog open={openBatch} onClose={() => setOpenBatch(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleGenerateBatch}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Generate Batch Invoices</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Calculate total fees based on defined structures, split them into installments, and assign invoice schedules to all students in this batch.
            </Typography>
            <TextField
              select
              label="Target Department"
              fullWidth
              required
              value={batchForm.departmentId}
              onChange={(e) => setBatchForm({ ...batchForm, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Year"
                  fullWidth
                  value={batchForm.year}
                  onChange={(e) => setBatchForm({ ...batchForm, year: e.target.value })}
                >
                  {['First Year', 'Second Year', 'Third Year'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Semester"
                  fullWidth
                  value={batchForm.semester}
                  onChange={(e) => setBatchForm({ ...batchForm, semester: e.target.value })}
                >
                  {getSemestersForYear(batchForm.year).map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Academic Year"
                  fullWidth
                  value={batchForm.academicYear}
                  placeholder="2026-27"
                  onChange={(e) => setBatchForm({ ...batchForm, academicYear: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Installments Count"
                  type="number"
                  fullWidth
                  value={batchForm.installmentCount}
                  onChange={(e) => setBatchForm({ ...batchForm, installmentCount: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBatch(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Generate</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* MOCK CHECKOUT DIALOG */}
      <Dialog open={openPay} onClose={() => setOpenPay(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Mock Payment Gateway</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2">
            Paying: <b>Installment #{selectedInstallment?.index}</b>
          </Typography>
          <Typography variant="body2">
            Amount: <b>${selectedInstallment?.amount}</b>
          </Typography>
          <TextField
            select
            label="Payment Method"
            fullWidth
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {['UPI', 'Card', 'NetBanking', 'MockGateway'].map(m => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Note: This is a secure simulated mock sandbox checkout session. No real funds will be processed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleProcessPayment}>
            Process Checkout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
