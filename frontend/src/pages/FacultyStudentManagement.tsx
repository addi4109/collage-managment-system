import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Chip, IconButton, Tooltip, InputAdornment, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyForm = {
  name: '', username: '', password: '', rollNumber: '', enrollmentNumber: '',
  semester: '', email: '', phone: '', parentName: '', parentMobile: '', address: '',
};

export const FacultyStudentManagement: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // View Details dialog
  const [viewStudent, setViewStudent] = useState<any | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/students`, { headers: getHeaders() });
      const data = await res.json();
      if (res.ok) {
        setStudents(data);
      } else {
        toast.error(data.message || 'Failed to fetch students.');
      }
    } catch {
      toast.error('Network error loading students list.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setForm({ ...emptyForm });
    setFormErrors({});
    setShowPassword(false);
    setOpenDialog(true);
  };

  const handleOpenEdit = (stu: any) => {
    setEditingStudent(stu);
    setForm({
      name: stu.name || '',
      username: stu.username || '',
      password: '',
      rollNumber: stu.rollNumber || '',
      enrollmentNumber: stu.enrollmentNumber || '',
      semester: stu.semester || '',
      email: stu.email || '',
      phone: stu.phone || '',
      parentName: stu.parentName || '',
      parentMobile: stu.parentMobile || '',
      address: stu.address || '',
    });
    setFormErrors({});
    setShowPassword(false);
    setOpenDialog(true);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!editingStudent && !form.password) errs.password = 'Password is required.';
    if (!form.rollNumber.trim()) errs.rollNumber = 'Roll number is required.';
    if (!form.semester) errs.semester = 'Semester selection is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const payload: any = { ...form };
      if (!payload.password) delete payload.password;

      let res;
      if (editingStudent) {
        res = await fetch(`${API_URL}/students/${editingStudent._id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/students`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(
          editingStudent
            ? 'Student details updated successfully.'
            : 'Admission request created successfully and is pending approval.'
        );
        setOpenDialog(false);
        fetchStudents();
      } else {
        toast.error(data.message || 'Error processing request.');
      }
    } catch {
      toast.error('Network connection error.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/students/${deleteTarget._id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Student account deleted successfully.');
        setDeleteTarget(null);
        fetchStudents();
      } else {
        toast.error(data.message || 'Failed to delete student.');
      }
    } catch {
      toast.error('Error deleting student account.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.username?.toLowerCase().includes(search.toLowerCase())
  );

  const assignedSems = user?.assignedSemesters || [];

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      {/* ── Header ─────────────────────────────────────────── */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text-green" sx={{ fontWeight: 800 }}>
            Student Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Department: <strong>{user?.department || '—'}</strong>
            {assignedSems.length > 0 ? <> &nbsp;|&nbsp; Assigned Semesters: <strong>{assignedSems.join(', ')}</strong></> : null}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Chip
            icon={<PeopleIcon />}
            label={`${students.length} Student${students.length !== 1 ? 's' : ''}`}
            color="success"
            variant="outlined"
          />
          <Button
            variant="outlined" color="success" startIcon={<RefreshIcon />}
            onClick={fetchStudents} disabled={loading}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained" color="success" startIcon={<AddIcon />}
            onClick={handleOpenAdd}
            sx={{ fontWeight: 700 }}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      {/* ── Search ─────────────────────────────────────────── */}
      <TextField
        fullWidth
        placeholder="Search by name, roll number or username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
        }}
        size="small"
        sx={{ mb: 3, maxWidth: 420 }}
      />

      {/* ── Table ──────────────────────────────────────────── */}
      <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress color="success" />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ background: 'transparent' }} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <PeopleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                        <Typography color="text.secondary">
                          {search ? 'No students match your search.' : 'No students managed yet. Click "Add Student" to create a request.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((stu) => (
                      <TableRow key={stu._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell sx={{ fontWeight: 600 }}>{stu.name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{stu.username}</TableCell>
                        <TableCell>{stu.rollNumber || '—'}</TableCell>
                        <TableCell>{stu.semester || '—'}</TableCell>
                        <TableCell>
                          <Chip label={stu.year || '—'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={stu.status?.toUpperCase() || 'ACTIVE'}
                            color={stu.status === 'active' || stu.status === 'approved' ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => setViewStudent(stu)} color="primary">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Student">
                              <IconButton size="small" onClick={() => handleOpenEdit(stu)} color="success">
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Student">
                              <IconButton size="small" onClick={() => setDeleteTarget(stu)} color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Add / Edit Student Dialog ───────────────────────── */}
      <Dialog
        open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add Student (Creates Admission Request)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ borderRadius: 2, mb: 1 }}>
                Department: <strong>{user?.department}</strong>
              </Alert>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Student Full Name *" value={form.name}
                onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(fe => ({ ...fe, name: '' })); }}
                error={!!formErrors.name} helperText={formErrors.name} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Username (Login ID) *" value={form.username}
                onChange={(e) => { setForm(f => ({ ...f, username: e.target.value.toLowerCase() })); setFormErrors(fe => ({ ...fe, username: '' })); }}
                error={!!formErrors.username} helperText={formErrors.username || 'Student uses this to log in'}
                size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={editingStudent ? 'New Password (leave blank to keep)' : 'Password *'}
                type={showPassword ? 'text' : 'password'} value={form.password}
                onChange={(e) => { setForm(f => ({ ...f, password: e.target.value })); setFormErrors(fe => ({ ...fe, password: '' })); }}
                error={!!formErrors.password} helperText={formErrors.password} size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Roll Number *" value={form.rollNumber}
                onChange={(e) => { setForm(f => ({ ...f, rollNumber: e.target.value })); setFormErrors(fe => ({ ...fe, rollNumber: '' })); }}
                error={!!formErrors.rollNumber} helperText={formErrors.rollNumber} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Enrollment Number" value={form.enrollmentNumber}
                onChange={(e) => setForm(f => ({ ...f, enrollmentNumber: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={!!formErrors.semester}>
                <InputLabel>Semester *</InputLabel>
                <Select value={form.semester}
                  onChange={(e) => { setForm(f => ({ ...f, semester: e.target.value })); setFormErrors(fe => ({ ...fe, semester: '' })); }}
                  label="Semester *">
                  {assignedSems.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
                {formErrors.semester && <Typography variant="caption" color="error" sx={{ pl: 2 }}>{formErrors.semester}</Typography>}
              </FormControl>
            </Grid>

            <Grid item xs={12}><Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, fontWeight: 600 }}>Contact Details</Typography></Grid>

            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} size="small" type="email" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Parent Name" value={form.parentName}
                onChange={(e) => setForm(f => ({ ...f, parentName: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Parent Mobile" value={form.parentMobile}
                onChange={(e) => setForm(f => ({ ...f, parentMobile: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} size="small" multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="success" disabled={saving}>
            {saving ? 'Saving...' : editingStudent ? 'Save Changes' : 'Submit Admission'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Student Details Dialog ─────────────────────── */}
      <Dialog
        open={!!viewStudent} onClose={() => setViewStudent(null)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Student Information</DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {viewStudent && (
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Name</Typography><Typography variant="body2" fontWeight={600}>{viewStudent.name}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Username</Typography><Typography variant="body2" fontWeight={600}>{viewStudent.username}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Roll Number</Typography><Typography variant="body2">{viewStudent.rollNumber || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Enrollment No.</Typography><Typography variant="body2">{viewStudent.enrollmentNumber || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Semester</Typography><Typography variant="body2">{viewStudent.semester}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Academic Year</Typography><Typography variant="body2">{viewStudent.year}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Phone</Typography><Typography variant="body2">{viewStudent.phone || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Email</Typography><Typography variant="body2">{viewStudent.email || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Parent Name</Typography><Typography variant="body2">{viewStudent.parentName || '—'}</Typography></Grid>
              <Grid item xs={6}><Typography variant="caption" color="text.secondary">Parent Mobile</Typography><Typography variant="body2">{viewStudent.parentMobile || '—'}</Typography></Grid>
              <Grid item xs={12}><Typography variant="caption" color="text.secondary">Address</Typography><Typography variant="body2">{viewStudent.address || '—'}</Typography></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewStudent(null)} variant="outlined" color="inherit">Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────── */}
      <Dialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.light' }}>Delete Student Profile</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
            This will remove their profile and credentials.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
