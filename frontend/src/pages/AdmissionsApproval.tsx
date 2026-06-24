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
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  AdmissionRequest,
  createAdmissionRequest,
  getAdmissionRequests,
  approveAdmissionRequest,
  rejectAdmissionRequest,
  deleteAdmissionRequest,
} from '../services/admissionService';

const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

export const AdmissionsApproval: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [requests, setRequests] = useState<AdmissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    rollNumber: '',
    enrollmentNumber: '',
    department: user?.department || '',
    year: 'First Year',
    semester: 'Sem 1',
    email: '',
    phone: '',
    parentName: '',
    parentMobile: '',
    address: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getAdmissionRequests();
      setRequests(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load admission requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
    if (user && user.role === 'faculty') {
      setFormData((prev) => ({
        ...prev,
        department: user.department || '',
        semester: user.assignedSemesters?.[0] || 'Sem 1',
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === 'semester') {
        if (value === 'Sem 1' || value === 'Sem 2') updated.year = 'First Year';
        else if (value === 'Sem 3' || value === 'Sem 4') updated.year = 'Second Year';
        else if (value === 'Sem 5' || value === 'Sem 6') updated.year = 'Third Year';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdmissionRequest(formData);
      toast.success('Admission request submitted successfully!');
      setOpenDialog(false);
      setFormData({
        name: '',
        username: '',
        password: '',
        rollNumber: '',
        enrollmentNumber: '',
        department: user?.department || '',
        year: 'First Year',
        semester: user?.assignedSemesters?.[0] || 'Sem 1',
        email: '',
        phone: '',
        parentName: '',
        parentMobile: '',
        address: '',
      });
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting admission request.');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await approveAdmissionRequest(id);
      toast.success(res.message || 'Request approved and account provisioned.');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await rejectAdmissionRequest(id);
      toast.success(res.message || 'Admission request rejected.');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this admission request?')) return;
    try {
      const res = await deleteAdmissionRequest(id);
      toast.success(res.message || 'Admission request deleted.');
      loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete request.');
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip label="Approved" color="success" size="small" sx={{ fontWeight: 600 }} />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" sx={{ fontWeight: 600 }} />;
      case 'pending':
      default:
        return <Chip label="Pending" color="warning" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            {user?.role === 'admin' ? 'Admissions Board' : 'Department Admissions'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.role === 'admin'
              ? 'Review and verify pending student admission requests and auto-provision user accounts.'
              : 'Submit new student records for admin verification and account provisioning.'}
          </Typography>
        </Box>

        {user?.role === 'faculty' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            New Admission Request
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
              <Table>
                <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Class / Semester</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parent Info</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    {user?.role === 'faculty' && <TableCell sx={{ fontWeight: 700 }}>Submitted By</TableCell>}
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No admission requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((req) => (
                      <TableRow key={req._id} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{req.rollNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{req.name}</TableCell>
                        <TableCell color="text.secondary">{req.username}</TableCell>
                        <TableCell>{req.department}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{req.year}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {req.semester}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{req.parentName || 'N/A'}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {req.parentMobile || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(req.status)}</TableCell>
                        {user?.role === 'faculty' && (
                          <TableCell>
                            {typeof req.createdByFaculty === 'object'
                              ? req.createdByFaculty.name
                              : 'You'}
                          </TableCell>
                        )}
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            {user?.role === 'admin' && req.status === 'pending' && (
                              <>
                                <Tooltip title="Approve Student Account">
                                  <IconButton
                                    color="success"
                                    onClick={() => handleApprove(req._id)}
                                    size="small"
                                    sx={{ border: '1px solid rgba(16,185,129,0.2)', '&:hover': { bgcolor: 'rgba(16,185,129,0.08)' } }}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject Request">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleReject(req._id)}
                                    size="small"
                                    sx={{ border: '1px solid rgba(239,68,68,0.2)', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            {(user?.role === 'admin' ||
                              (user?.role === 'faculty' && req.status === 'pending')) && (
                              <Tooltip title="Delete Submission">
                                <IconButton
                                  color="default"
                                  onClick={() => handleDelete(req._id)}
                                  size="small"
                                  sx={{ border: '1px solid rgba(255,255,255,0.08)', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Faculty Add Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Student Admission Form</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  helperText="Unique ID for student login"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="password"
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Roll Number"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Enrollment Number"
                  name="enrollmentNumber"
                  value={formData.enrollmentNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Department"
                  name="department"
                  value={formData.department}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                >
                  {user?.assignedSemesters?.map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      {sem}
                    </MenuItem>
                  )) ||
                    SEMESTERS.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        {sem}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Assigned Year"
                  name="year"
                  value={formData.year}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="email"
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parent/Guardian Name"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Parent Contact Mobile"
                  name="parentMobile"
                  value={formData.parentMobile}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Submit Request
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AdmissionsApproval;
