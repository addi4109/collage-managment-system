import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, TextField, MenuItem,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function StudentDirectoryTab({ role }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterYear, setFilterYear] = useState('First Year');
  const [filterSemester, setFilterSemester] = useState('Sem 1');
  
  // Form State
  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  const initialForm = {
    name: '', username: '', password: '', email: '', phone: '',
    rollNumber: '', enrollmentNumber: '', departmentId: '',
    year: 'First Year', semester: 'Sem 1', parentName: '', parentMobile: '', address: ''
  };
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '/students';
      
      const res = await api.get(endpoint, {
        params: {
          year: filterYear,
          semester: filterSemester
        }
      });
      setStudents(res.data);
      
      if (role === 'hod' || role === 'principal') {
        const deptRes = await api.get('/departments');
        setDepartments(deptRes.data);
      }
    } catch (err) {
      showToast('Failed to load student directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, filterYear, filterSemester]);

  const handleOpenForm = (student = null) => {
    if (student) {
      setIsEditMode(true);
      setEditId(student._id);
      setForm({
        name: student.userId?.name || '',
        username: student.userId?.username || '',
        password: '',
        email: student.userId?.email || '',
        phone: student.phone || '',
        rollNumber: student.rollNumber || '',
        enrollmentNumber: student.enrollmentNumber || '',
        departmentId: student.departmentId?._id || student.departmentId || '',
        year: student.year || 'First Year',
        semester: student.semester || 'Sem 1',
        parentName: student.parentName || '',
        parentMobile: student.parentMobile || '',
        address: student.address || ''
      });
    } else {
      setIsEditMode(false);
      setEditId(null);
      setForm({
        ...initialForm,
        departmentId: role === 'hod' ? user.departmentId : ''
      });
    }
    setOpenForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/students/${editId}`, form);
        showToast('Student updated successfully.', 'success');
      } else {
        await api.post('/students', form);
        showToast('Student registered successfully.', 'success');
      }
      setOpenForm(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save student.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      showToast('Student deleted successfully.', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete student.', 'error');
    }
  };

  const years = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Students Directory</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            size="small"
            label="Year"
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setFilterSemester(e.target.value === 'First Year' ? 'Sem 1' : 'Sem 3'); }}
            sx={{ minWidth: 120 }}
          >
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </TextField>
          <TextField
            select
            size="small"
            label="Semester"
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            {getSemestersForYear(filterYear).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          {(role === 'hod' || role === 'principal') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
              Register Student
            </Button>
          )}
        </Stack>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : students.length === 0 ? (
        <Typography color="text.secondary">No students found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll Number</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Class</TableCell>
                {(role === 'hod' || role === 'principal') && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{s.rollNumber}</TableCell>
                  <TableCell>{s.userId?.name}</TableCell>
                  <TableCell>{s.userId?.username}</TableCell>
                  <TableCell>{s.departmentId?.name}</TableCell>
                  <TableCell>{s.year} - {s.semester}</TableCell>
                  {(role === 'hod' || role === 'principal') && (
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenForm(s)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(s._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Student Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>{isEditMode ? 'Modify Student Profile' : 'Register New Student'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Student Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={isEditMode} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required={!isEditMode}
                  type={showPassword ? 'text' : 'password'}
                  label={isEditMode ? 'Reset Password (optional)' : 'Password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <IconButton size="small" onClick={() => setShowPassword(v => !v)} edge="end">
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone Number (Optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Department"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  disabled={role === 'hod'}
                >
                  {role === 'hod' && !departments.find(d => d._id === user.departmentId) ? (
                     <MenuItem value={user.departmentId}>{user.departmentName}</MenuItem>
                  ) : null}
                  {departments.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth required label="Semester" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                  {getSemestersForYear(form.year).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Save Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
