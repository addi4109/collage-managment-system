import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Chip, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function StudentApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAppDialog, setOpenAppDialog] = useState(false);
  const [appForm, setAppForm] = useState({ type: 'Leave Application', description: '' });
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/my');
      setApplications(res.data);
    } catch (err) {
      showToast('Failed to load applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApply = async () => {
    if (!appForm.description.trim()) {
      showToast('Please provide a description.', 'error');
      return;
    }
    try {
      await api.post('/applications', appForm);
      showToast('Application request submitted successfully.', 'success');
      setOpenAppDialog(false);
      setAppForm({ type: 'Leave Application', description: '' });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit application', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Service Requests & Applications</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAppDialog(true)}>
          Submit Application
        </Button>
      </Box>

      {applications.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No applications submitted yet.</Typography>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Application Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((a) => (
                <TableRow key={a._id} hover>
                  <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{a.type}</TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.description}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status.replace('_', ' ').toUpperCase()}
                      size="small"
                      color={
                        a.status === 'approved' ? 'success' :
                        a.status === 'rejected' ? 'error' :
                        'warning'
                      }
                      variant="outlined"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </TableCell>
                  <TableCell>{a.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* SUBMIT APP DIALOG */}
      <Dialog open={openAppDialog} onClose={() => setOpenAppDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Submit Application Request</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Application Type"
            value={appForm.type}
            onChange={(e) => setAppForm({ ...appForm, type: e.target.value })}
            sx={{ mb: 3, mt: 1 }}
          >
            {['Leave Application', 'Bonafide Request', 'Document Request', 'ID Card Request'].map(t => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Application Details / Description"
            value={appForm.description}
            onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
            placeholder="Explain the reason for your application in detail..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenAppDialog(false)}>Cancel</Button>
          <Button onClick={handleApply} variant="contained" color="primary">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
