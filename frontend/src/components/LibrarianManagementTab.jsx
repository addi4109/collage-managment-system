import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PersonIcon from '@mui/icons-material/Person';

import { api } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TableSkeleton } from '../SkeletonLoader';

export default function LibrarianManagementTab() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [librarians, setLibrarians] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', phone: '' });

  const loadLibrarians = async () => {
    setLoading(true);
    try {
      const res = await api.get('/principal/librarians');
      setLibrarians(res.data);
    } catch (err) {
      showToast('Failed to load librarians.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLibrarians();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await api.post('/principal/librarian', form);
      showToast('Librarian created successfully.', 'success');
      setOpenCreateDialog(false);
      setForm({ name: '', username: '', password: '', phone: '' });
      loadLibrarians();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create librarian.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this librarian?')) return;
    try {
      await api.delete(`/principal/librarian/${id}`);
      showToast('Librarian deleted successfully.', 'success');
      loadLibrarians();
    } catch (err) {
      showToast('Failed to delete librarian.', 'error');
    }
  };

  if (loading) return <TableSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LibraryBooksIcon color="primary" /> Librarian Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreateDialog(true)}>
          Create Librarian
        </Button>
      </Box>

      {librarians.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', bgcolor: 'action.hover' }}>
          <LibraryBooksIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">No librarians have been created yet.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell>Name</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {librarians.map((lib) => (
                <TableRow key={lib._id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{lib.userId?.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{lib.employeeId}</Typography>
                  </TableCell>
                  <TableCell>{lib.userId?.username}</TableCell>
                  <TableCell>{lib.userId?.email}</TableCell>
                  <TableCell>{lib.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={lib.userId?.status || 'active'}
                      color={lib.userId?.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => handleDelete(lib._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* CREATE LIBRARIAN DIALOG */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LibraryBooksIcon color="primary" /> Create New Librarian
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              margin="dense"
              fullWidth
              required
              label="Full Name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Username"
              placeholder="e.g. librarian1"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              type="password"
              label="Password"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Phone (Optional)"
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Create Librarian'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
