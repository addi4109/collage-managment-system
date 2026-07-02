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
  Divider,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ComplaintsTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Create form state
  const [openCreate, setOpenCreate] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    type: 'Academic',
    priority: 'low',
    description: '',
    targetId: '',
  });

  // Admin resolution dialog
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    status: 'processing',
    remarks: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);

      if (role === 'student') {
        const facRes = await api.get('/faculty'); // get faculty list to complain about faculty if needed
        setFaculties(facRes.data);
      }
    } catch (err) {
      showToast('Error loading grievances.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('Attachment size must be less than 5MB.', 'warning');
      return;
    }

    setFile(selectedFile);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('type', form.type);
    formData.append('priority', form.priority);
    formData.append('description', form.description);
    if (form.targetId) {
      formData.append('targetId', form.targetId);
    }
    if (file) {
      formData.append('file', file);
    }

    try {
      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Grievance ticket filed successfully.', 'success');
      setOpenCreate(false);
      setFile(null);
      loadData();
    } catch (err) {
      showToast('Error filing complaint.', 'error');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/complaints/${selectedComplaint._id}`, resolveForm);
      showToast('Grievance status updated successfully.', 'success');
      setSelectedComplaint(null);
      loadData();
    } catch (err) {
      showToast('Error resolving grievance.', 'error');
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'primary';
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportProblemIcon color="primary" /> Grievance Helpdesk
        </Typography>
        {role === 'student' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            File Grievance
          </Button>
        )}
      </Box>

      {complaints.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No grievance logs recorded.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {complaints.map((c) => (
            <Grid item xs={12} key={c._id}>
              <Card sx={{ p: 3, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={c.type} size="small" variant="outlined" />
                    <Chip label={c.priority} size="small" color={getPriorityColor(c.priority)} />
                    <Typography variant="caption" color="text.secondary">
                      Ticket #{c._id.slice(-6).toUpperCase()} | Filed on: {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  <Chip
                    label={c.status}
                    color={c.status === 'resolved' ? 'success' : c.status === 'processing' ? 'warning' : 'default'}
                    size="small"
                  />
                </Box>

                <Typography variant="body1" sx={{ mb: 2, fontWeight: 550 }}>
                  {c.description}
                </Typography>

                {c.attachments && c.attachments.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Attachments:</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      {c.attachments.map(att => (
                        <Button
                          key={att.filename}
                          startIcon={<DescriptionIcon />}
                          variant="outlined"
                          size="small"
                          href={`${api.defaults.baseURL}${att.fileUrl}`}
                          target="_blank"
                        >
                          View File
                        </Button>
                      ))}
                    </Stack>
                  </Box>
                )}

                {c.targetId && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    Targeted Faculty: <b>{c.targetId.name}</b>
                  </Typography>
                )}

                {c.remarks && (
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '12px', mt: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Admin Remarks / Resolution Details:</Typography>
                    <Typography variant="body2">{c.remarks}</Typography>
                    {c.resolvedAt && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Resolved on: {new Date(c.resolvedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}

                {role !== 'student' && c.status !== 'resolved' && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setResolveForm({ status: c.status, remarks: c.remarks || '' });
                      }}
                    >
                      Update Status
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* FILE COMPLAINT DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>File Grievance Ticket</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Category Type"
                  fullWidth
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {['Academic', 'Facility', 'Faculty'].map(t => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Severity Priority"
                  fullWidth
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {['low', 'medium', 'high'].map(p => (
                    <MenuItem key={p} value={p}>{p.toUpperCase()}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {form.type === 'Faculty' && (
              <TextField
                select
                label="Target Faculty Member"
                fullWidth
                value={form.targetId}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
              >
                <MenuItem value="">Choose Faculty (optional)</MenuItem>
                {faculties.map((f) => (
                  <MenuItem key={f._id} value={f.userId?._id}>{f.userId?.name}</MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Describe Grievance Details"
              fullWidth
              multiline
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              Attach Photo / PDF (max 5MB)
              <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
            </Button>
            {file && (
              <Typography variant="caption" color="primary.main">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Submit Ticket</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* RESOLVE COMPLAINT DIALOG */}
      <Dialog open={!!selectedComplaint} onClose={() => setSelectedComplaint(null)} maxWidth="xs" fullWidth>
        {selectedComplaint && (
          <form onSubmit={handleResolveSubmit}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Resolve Grievance Ticket</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                select
                label="Update Status"
                fullWidth
                value={resolveForm.status}
                onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
              >
                {['processing', 'resolved'].map(st => (
                  <MenuItem key={st} value={st}>{st.toUpperCase()}</MenuItem>
                ))}
              </TextField>
              <TextField
                label="Resolution Remarks / Instructions"
                multiline
                rows={3}
                required
                fullWidth
                value={resolveForm.remarks}
                onChange={(e) => setResolveForm({ ...resolveForm, remarks: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedComplaint(null)}>Cancel</Button>
              <Button type="submit" variant="contained">Save Resolution</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
