import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, IconButton, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';

import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FacultyDirectoryTab({ role }) {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  // Form states
  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  const initialForm = { name: '', username: '', password: '', assignedDepartments: [], assignedYears: [] };
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'hod' ? '/hod/faculty' : '/faculty';
      const res = await api.get(endpoint);
      setFaculties(res.data);
      
      if (role === 'hod' || role === 'principal') {
        const deptRes = await api.get('/departments');
        setDepartments(deptRes.data);
      }
    } catch (err) {
      showToast('Failed to load faculty directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleOpenForm = (faculty = null) => {
    if (faculty) {
      setIsEditMode(true);
      setEditId(faculty._id);
      setForm({
        name: faculty.userId?.name || '',
        username: faculty.userId?.username || '',
        password: '',
        assignedDepartments: faculty.assignedDepartments?.map(d => d._id) || [],
        assignedYears: faculty.assignedYears || [],
      });
    } else {
      setIsEditMode(false);
      setEditId(null);
      setForm({ 
        ...initialForm, 
        assignedDepartments: role === 'hod' && user?.departmentId ? [user.departmentId] : [] 
      });
    }
    setOpenForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/faculty/${editId}`, form);
        if (form.password) {
          await api.put(`/faculty/${editId}/password`, { password: form.password });
        }
        showToast('Faculty profile updated.', 'success');
      } else {
        await api.post('/faculty', form);
        showToast('Faculty member registered successfully.', 'success');
      }
      setOpenForm(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit faculty form.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty profile?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      showToast('Faculty profile soft-deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete faculty.', 'error');
    }
  };

  const handleResetPasswordPrompt = async (faculty) => {
    const newPassword = window.prompt(`Enter new password for faculty member ${faculty.userId?.name}:`);
    if (newPassword === null) return; // cancelled
    if (!newPassword.trim()) {
      return showToast('Password cannot be empty.', 'warning');
    }

    try {
      await api.put(`/faculty/${faculty._id}/password`, { password: newPassword });
      showToast('Faculty password reset successfully.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Faculty Directory</Typography>
        {(role === 'principal' || role === 'hod') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenForm()}>
            Register Faculty
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : faculties.length === 0 ? (
        <Typography color="text.secondary">No faculty members found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Assigned Departments</TableCell>
                <TableCell>Assigned Years</TableCell>
                {(role === 'principal' || role === 'hod') && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {faculties.map((f) => (
                <TableRow key={f._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{f.userId?.name}</TableCell>
                  <TableCell>{f.userId?.username}</TableCell>
                  <TableCell>
                    {f.assignedDepartments?.map(d => (
                      <Chip key={d._id} label={d.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    {f.assignedYears?.map((y, idx) => (
                      <Chip key={idx} label={y} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  {(role === 'principal' || role === 'hod') && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleResetPasswordPrompt(f)} color="warning" title="Reset Password">
                        <LockResetIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenForm(f)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(f._id)} color="error">
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

      {/* Faculty Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>{isEditMode ? 'Modify Faculty Profile' : 'Register Faculty Member'}</DialogTitle>
          <DialogContent>
            <TextField margin="dense" fullWidth required label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
            <TextField margin="dense" fullWidth required label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={isEditMode} sx={{ mb: 2 }} />
            <TextField margin="dense" fullWidth required={!isEditMode} type="password" label={isEditMode ? "Reset Password (leave blank to keep current)" : "Password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} sx={{ mb: 2 }} />
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Assign Department"
              SelectProps={{
                multiple: true,
                value: form.assignedDepartments,
                onChange: (e) => setForm({ ...form, assignedDepartments: e.target.value }),
              }}
              disabled={role === 'hod'} // HODs can only add faculty to their own dept (pre-filled)
              sx={{ mb: 2 }}
            >
              {role === 'hod' && !departments.find(d => d._id === user.departmentId) ? (
                 <MenuItem value={user.departmentId}>{user.departmentName}</MenuItem>
              ) : null}
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Assign Year Scope"
              SelectProps={{
                multiple: true,
                value: form.assignedYears,
                onChange: (e) => setForm({ ...form, assignedYears: e.target.value }),
              }}
            >
              {['First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Save Profile'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
