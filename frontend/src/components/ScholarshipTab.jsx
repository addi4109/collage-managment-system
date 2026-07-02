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
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ScholarshipTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scholarships, setScholarships] = useState([]);

  // Student apply states
  const [openApply, setOpenApply] = useState(false);
  const [form, setForm] = useState({
    title: '',
    amount: 15000,
    type: 'Government',
  });

  // Admin approval states
  const [editingSch, setEditingSch] = useState(null);
  const [statusVal, setStatusVal] = useState('applied');
  const [remarksVal, setRemarksVal] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/scholarships');
      setScholarships(res.data);
    } catch (err) {
      showToast('Error loading scholarships.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/scholarships/apply', form);
      showToast('Scholarship application submitted successfully.', 'success');
      setOpenApply(false);
      loadData();
    } catch (err) {
      showToast('Error submitting scholarship application.', 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/scholarships/${editingSch._id}`, { status: statusVal, remarks: remarksVal });
      showToast('Scholarship review submitted.', 'success');
      setEditingSch(null);
      loadData();
    } catch (err) {
      showToast('Error updating scholarship status.', 'error');
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'disbursed': return 'success';
      case 'approved': return 'success';
      case 'verified': return 'primary';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <CardGiftcardIcon color="primary" /> Scholarships Desk
        </Typography>
        {role === 'student' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenApply(true)}>
            Apply for Scholarship
          </Button>
        )}
      </Box>

      {scholarships.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No scholarship applications logged.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Scholarship Scheme</TableCell>
                <TableCell>Category Type</TableCell>
                <TableCell>Student Details</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status Stages</TableCell>
                <TableCell>Remarks</TableCell>
                {role !== 'student' && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {scholarships.map((s) => (
                <TableRow key={s._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{s.title}</TableCell>
                  <TableCell>{s.type}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{s.studentId?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {s.studentProfile?.rollNumber} | {s.studentProfile?.departmentId?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>${s.amount}</TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" color={getStatusColor(s.status)} />
                    {s.disbursementDate && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        Disbursed: {new Date(s.disbursementDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{s.remarks || 'No remarks recorded.'}</TableCell>
                  {role !== 'student' && (
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        disabled={s.status === 'disbursed' || s.status === 'rejected'}
                        onClick={() => {
                          setEditingSch(s);
                          setStatusVal(s.status);
                          setRemarksVal(s.remarks || '');
                        }}
                      >
                        Review
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* STUDENT APPLY DIALOG */}
      <Dialog open={openApply} onClose={() => setOpenApply(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleApplySubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Apply for Scholarship</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Scholarship Scheme Name"
              fullWidth
              required
              placeholder="e.g. State Merit Scholarship"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Claimed Amount"
                  type="number"
                  fullWidth
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Scholarship Type"
                  fullWidth
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {['Government', 'Private', 'Merit'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Typography variant="caption" color="text.secondary">
              * Note: Submission registers your claim. Make sure to present valid certification records directly to the scholarship cell office if requested.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApply(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit Claim</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ADMIN REVIEW DIALOG */}
      <Dialog open={!!editingSch} onClose={() => setEditingSch(null)} maxWidth="xs" fullWidth>
        {editingSch && (
          <form onSubmit={handleReviewSubmit}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Verify Scholarship Claim</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2">
                Scheme: <b>{editingSch.title}</b>
              </Typography>
              <Typography variant="body2">
                Requested: <b>${editingSch.amount}</b>
              </Typography>
              <TextField
                select
                label="Verify status stage"
                fullWidth
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              >
                {['applied', 'verified', 'approved', 'disbursed', 'rejected'].map(st => (
                  <MenuItem key={st} value={st}>{st.toUpperCase()}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Auditor Remarks"
                fullWidth
                multiline
                rows={3}
                value={remarksVal}
                onChange={(e) => setRemarksVal(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingSch(null)}>Cancel</Button>
              <Button type="submit" variant="contained">Update Stage</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
