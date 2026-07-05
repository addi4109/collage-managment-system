import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, Divider, CircularProgress
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ApplicationApprovalsTab() {
  const [pendingApplications, setPendingApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/applications/pending');
      setPendingApplications(res.data);
    } catch (err) {
      showToast('Failed to load pending applications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplicationReview = async (id, status) => {
    const remarks = status === 'rejected'
      ? window.prompt('Enter rejection reason (optional):')
      : '';
    if (status === 'rejected' && remarks === null) return; // cancelled
    try {
      await api.post(`/applications/review/${id}`, { status, remarks: remarks || '' });
      showToast(`Application ${status} successfully.`, 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to review application.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>Application Approvals</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review leave requests, document requests, and other student/faculty applications.
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : pendingApplications.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">All caught up!</Typography>
          <Typography variant="body2" color="text.secondary">No pending applications at this time.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {pendingApplications.map((app) => (
            <Grid item xs={12} md={6} key={app._id}>
              <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Box sx={{ p: 0.5, bgcolor: app.type === 'leave' ? 'warning.light' : app.type === 'document' ? 'info.light' : 'primary.light' }} />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Chip label={app.type?.replace('_', ' ').toUpperCase() || 'REQUEST'} size="small" color={app.type === 'leave' ? 'warning' : 'info'} sx={{ mb: 0.5, fontWeight: 'bold', textTransform: 'capitalize' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{app.subject || app.title || 'Application'}</Typography>
                    </Box>
                    <Chip label="Pending" size="small" sx={{ bgcolor: 'warning.light', color: 'warning.dark', fontWeight: 'bold' }} />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccountCircleIcon fontSize="small" color="action" />
                    <Typography variant="body2"><strong>From:</strong> {app.applicant?.name || 'Unknown'} ({app.applicant?.role || '—'})</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarMonthIcon fontSize="small" color="action" />
                    <Typography variant="body2"><strong>Submitted:</strong> {new Date(app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                  </Box>
                  {app.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: '8px', fontStyle: 'italic' }}>
                      "{app.description}"
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => handleApplicationReview(app._id, 'approved')}
                    sx={{ borderRadius: '8px', flex: 1 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleApplicationReview(app._id, 'rejected')}
                    sx={{ borderRadius: '8px', flex: 1 }}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
