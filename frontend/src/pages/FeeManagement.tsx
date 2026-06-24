import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  FeeRecord,
  getStudentFeeDetails,
  payFee,
  setFeeStructure,
} from '../services/erpService';

export const FeeManagement: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog toggles
  const [openPayDialog, setOpenPayDialog] = useState(false);
  const [openStructureDialog, setOpenStructureDialog] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  // Pay Form State
  const [payData, setPayData] = useState({
    amount: '',
    paymentMode: 'UPI',
    transactionId: '',
  });

  // Structure Form State
  const [structureData, setStructureData] = useState({
    totalAmount: '',
  });

  const loadFees = async () => {
    setLoading(true);
    try {
      const data = await getStudentFeeDetails();
      setFees(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payData.amount);
    if (!amt || amt <= 0) {
      toast.error('Payment amount must be greater than zero.');
      return;
    }
    if (!payData.transactionId) {
      toast.error('Transaction ID is required.');
      return;
    }
    try {
      await payFee({
        amount: amt,
        paymentMode: payData.paymentMode,
        transactionId: payData.transactionId,
      });
      toast.success('Payment submitted successfully!');
      setOpenPayDialog(false);
      setPayData({ amount: '', paymentMode: 'UPI', transactionId: '' });
      loadFees();
    } catch (err: any) {
      toast.error(err.message || 'Error recording payment.');
    }
  };

  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;
    const total = parseFloat(structureData.totalAmount);
    if (isNaN(total) || total < 0) {
      toast.error('Total amount must be a positive number.');
      return;
    }
    try {
      await setFeeStructure({
        studentId: selectedFee.studentId,
        totalAmount: total,
      });
      toast.success('Fee structure updated successfully!');
      setOpenStructureDialog(false);
      loadFees();
    } catch (err: any) {
      toast.error(err.message || 'Error setting fee structure.');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip label="Paid" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'partial':
        return <Chip label="Partial" color="warning" size="small" sx={{ fontWeight: 600 }} />;
      case 'unpaid':
      default:
        return <Chip label="Unpaid" color="error" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Fee Accounts Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track semester tuition, pending dues, and view transaction payment records.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : user?.role === 'student' ? (
        // Student Fee View
        <Grid container spacing={4}>
          <Grid item xs={12} lg={4}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Fee Summary
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Total Fee</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Rs. {fees[0]?.totalAmount || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Paid Amount</Typography>
                  <Typography variant="body1" color="success.main" sx={{ fontWeight: 'bold' }}>
                    Rs. {fees[0]?.paidAmount || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                  <Typography variant="body2" color="text.secondary">Dues Remaining</Typography>
                  <Typography variant="body1" color="error.main" sx={{ fontWeight: 'bold' }}>
                    Rs. {fees[0]?.dueAmount || 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  {getStatusChip(fees[0]?.status || 'unpaid')}
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={fees[0]?.dueAmount <= 0}
                  startIcon={<PaymentIcon />}
                  onClick={() => setOpenPayDialog(true)}
                  sx={{ fontWeight: 700 }}
                >
                  Pay Pending Dues
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Payment History
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {!fees[0]?.paymentHistory || fees[0].paymentHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No payment history recorded.
                  </Typography>
                ) : (
                  <List>
                    {fees[0].paymentHistory.map((item, idx) => (
                      <ListItem key={idx} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5 }}>
                        <ListItemText
                          primary={`Rs. ${item.amountPaid} via ${item.paymentMode}`}
                          secondary={`Transaction ID: ${item.transactionId}`}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.paymentDate).toLocaleDateString()}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        // Admin / Faculty Fee View
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Total Fee</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Paid Fee</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Due Fee</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        {user?.role === 'admin' && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fees.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={user?.role === 'admin' ? 9 : 8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                            No student fee structures found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fees.map((fee) => (
                          <TableRow key={fee._id} hover>
                            <TableCell sx={{ fontWeight: 500 }}>{fee.rollNumber}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{fee.studentName}</TableCell>
                            <TableCell>{fee.department}</TableCell>
                            <TableCell>{fee.semester}</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Rs. {fee.totalAmount}</TableCell>
                            <TableCell color="success.main">Rs. {fee.paidAmount}</TableCell>
                            <TableCell color="error.main">Rs. {fee.dueAmount}</TableCell>
                            <TableCell>{getStatusChip(fee.status)}</TableCell>
                            {user?.role === 'admin' && (
                              <TableCell align="right">
                                <IconButton
                                  color="success"
                                  onClick={() => {
                                    setSelectedFee(fee);
                                    setStructureData({ totalAmount: fee.totalAmount.toString() });
                                    setOpenStructureDialog(true);
                                  }}
                                  size="small"
                                  sx={{ border: '1px solid rgba(255,255,255,0.08)' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Student: Make Payment Dialog */}
      <Dialog open={openPayDialog} onClose={() => setOpenPayDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Payment</DialogTitle>
        <form onSubmit={handlePaySubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Payment Amount"
                  value={payData.amount}
                  onChange={(e) => setPayData((p) => ({ ...p, amount: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Payment Mode"
                  value={payData.paymentMode}
                  onChange={(e) => setPayData((p) => ({ ...p, paymentMode: e.target.value }))}
                >
                  <MenuItem value="UPI">UPI / QR Code</MenuItem>
                  <MenuItem value="Net Banking">Net Banking</MenuItem>
                  <MenuItem value="Card">Debit/Credit Card</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Transaction / Reference ID"
                  value={payData.transactionId}
                  onChange={(e) => setPayData((p) => ({ ...p, transactionId: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenPayDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Submit Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin: Set structure Dialog */}
      <Dialog open={openStructureDialog} onClose={() => setOpenStructureDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Update Fee Structure</DialogTitle>
        <form onSubmit={handleStructureSubmit}>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Set total semester tuition fee amount for student: <b>{selectedFee?.studentName}</b>
            </Typography>
            <TextField
              fullWidth
              required
              type="number"
              label="Total Fees (Rs.)"
              value={structureData.totalAmount}
              onChange={(e) => setStructureData({ totalAmount: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenStructureDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Save Fee Structure
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default FeeManagement;
