import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function HodManagementTab() {
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    departmentId: '', // Optional: if HODs are tied to departments, we could fetch departments here.
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch HODs
      const res = await api.get('/principal/hods');
      setHods(res.data);
      
      // Fetch Departments for the dropdown (assuming endpoint exists)
      const deptRes = await api.get('/departments');
      setDepartments(deptRes.data);
    } catch (err) {
      showToast('Failed to load HODs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHod = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password || !formData.departmentId) {
      return showToast('Please fill all fields', 'warning');
    }
    setSubmitLoading(true);
    try {
      await api.post('/principal/hod', formData);
      showToast('HOD created successfully', 'success');
      setOpenDialog(false);
      setFormData({ name: '', email: '', username: '', password: '', departmentId: '' });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create HOD', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteHod = async (id) => {
    if (!window.confirm('Are you sure you want to delete this HOD?')) return;
    try {
      await api.delete(`/principal/hod/${id}`);
      showToast('HOD deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete HOD', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>HOD Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenDialog(true)}>
          Add New HOD
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Department</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {hods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No HODs found.
                </TableCell>
              </TableRow>
            ) : (
              hods.map((hod) => (
                <TableRow key={hod._id} hover>
                  <TableCell>{hod.userId?.name || 'N/A'}</TableCell>
                  <TableCell>{hod.userId?.username || 'N/A'}</TableCell>
                  <TableCell>{hod.userId?.email || 'N/A'}</TableCell>
                  <TableCell>{hod.departmentId?.name || 'Unassigned'}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDeleteHod(hod._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create HOD Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateHod}>
          <DialogTitle>Create New HOD</DialogTitle>
          <DialogContent dividers>
            <TextField
              fullWidth
              margin="dense"
              label="Full Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <TextField
              select
              fullWidth
              margin="dense"
              label="Assign Department"
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              SelectProps={{ native: true }}
            >
              <option value="" disabled></option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
