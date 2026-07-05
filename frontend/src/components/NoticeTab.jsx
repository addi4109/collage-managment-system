import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import PushPinIcon from '@mui/icons-material/PushPin';
import HelpIcon from '@mui/icons-material/Help';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import SendIcon from '@mui/icons-material/Send';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function NoticeTab({ role }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Form State
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'General',
    priority: 'Medium',
    pinned: false,
    departmentId: role === 'hod' ? user?.departmentId || '' : '',
    year: 'All',
    semester: 'All',
    publishAt: '',
    expiryDate: '',
  });

  const categories = ['All', 'General', 'Exam', 'Placement', 'Scholarship', 'Holiday', 'Department', 'Emergency'];

  const getPriorityColor = (p) => {
    switch (p) {
      case 'Urgent': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'primary';
      default: return 'default';
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notices');
      setNotices(res.data);

      if (['admin', 'principal', 'faculty', 'hod'].includes(role)) {
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
      }
    } catch (err) {
      showToast('Error loading notices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const noticeBody = { ...form };
      if (!noticeBody.departmentId) delete noticeBody.departmentId;
      if (!noticeBody.publishAt) delete noticeBody.publishAt;
      if (!noticeBody.expiryDate) delete noticeBody.expiryDate;

      await api.post('/notices', noticeBody);
      showToast('Notice posted successfully.', 'success');
      setOpenCreate(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error posting notice.', 'error');
    }
  };

  const handleNoticeClick = async (notice) => {
    setSelectedNotice(notice);
    if (!notice.isRead && role === 'student') {
      try {
        await api.post(`/notices/${notice._id}/read`);
        // Update local read state
        setNotices(prev => prev.map(n => n._id === notice._id ? { ...n, isRead: true } : n));
      } catch (err) {
        console.error('Failed to mark notice as read:', err);
      }
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      showToast('Notice deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Error deleting notice.', 'error');
    }
  };

  const filteredNotices = selectedCategory === 'All'
    ? notices
    : notices.filter(n => n.category === selectedCategory);

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Notice Board
        </Typography>
        {(['admin', 'principal', 'faculty', 'hod'].includes(role)) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
            setForm({
              title: '', content: '', category: 'General', priority: 'Medium', pinned: false,
              departmentId: role === 'hod' ? user?.departmentId || '' : '',
              year: 'All', semester: 'All', publishAt: '', expiryDate: ''
            });
            setOpenCreate(true);
          }}>
            Post Notice
          </Button>
        )}
      </Box>

      {/* Category filters */}
      <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 2, mb: 3 }}>
        {categories.map((c) => (
          <Chip
            key={c}
            label={c}
            clickable
            color={selectedCategory === c ? 'primary' : 'default'}
            onClick={() => setSelectedCategory(c)}
          />
        ))}
      </Stack>

      {filteredNotices.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No notices under this category.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredNotices.map((n) => (
            <Grid item xs={12} key={n._id}>
              <Card
                onClick={() => handleNoticeClick(n)}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  cursor: 'pointer',
                  border: n.pinned ? '1px solid' : '1px solid',
                  borderColor: n.pinned ? 'warning.main' : 'divider',
                  bgcolor: n.pinned ? 'warning.light' : 'background.paper',
                  position: 'relative',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s',
                  },
                }}
              >
                {role === 'student' && !n.isRead && (
                  <Chip
                    label="NEW"
                    color="success"
                    size="small"
                    sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'bold' }}
                  />
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  {n.pinned && <PushPinIcon color="warning" />}
                  <Chip label={n.category} size="small" variant="outlined" />
                  <Chip label={n.priority} size="small" color={getPriorityColor(n.priority)} />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(n.publishAt).toLocaleDateString()} by {n.createdBy?.name}
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{n.title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {n.content}
                </Typography>

                {(role === 'admin' || (role === 'faculty' && n.createdBy?._id === api.defaults.headers.common?.userId)) && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button color="error" size="small" onClick={(e) => handleDelete(n._id, e)}>
                      Delete
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* VIEW NOTICE DIALOG */}
      <Dialog open={!!selectedNotice} onClose={() => setSelectedNotice(null)} maxWidth="sm" fullWidth>
        {selectedNotice && (
          <>
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              {selectedNotice.pinned && <PushPinIcon color="warning" />}
              {selectedNotice.title}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip label={selectedNotice.category} size="small" variant="outlined" />
                <Chip label={selectedNotice.priority} size="small" color={getPriorityColor(selectedNotice.priority)} />
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
                  Posted on: {new Date(selectedNotice.publishAt).toLocaleString()}
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
                {selectedNotice.content}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedNotice(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* POST NOTICE DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Post New Notice</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Content Details"
              fullWidth
              multiline
              rows={4}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {categories.slice(1).map(c => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              select
              label="Target Department"
              fullWidth
              value={form.departmentId}
              disabled={role === 'hod'}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              {role !== 'hod' && <MenuItem value="">All Departments</MenuItem>}
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Target Year"
                  fullWidth
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  {['First Year', 'Second Year', 'Third Year', 'All'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Target Semester"
                  fullWidth
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  {['All', ...getSemestersForYear(form.year)].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Publish Date & Time (optional)"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.publishAt}
                  onChange={(e) => setForm({ ...form, publishAt: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Expiry Date & Time (optional)"
                  type="datetime-local"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                />
              }
              label="Pin Notice to Top"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Post</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
