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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  CircularProgress,
  Autocomplete,
  Tabs,
  Tab,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import InboxIcon from '@mui/icons-material/Inbox';
import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const TARGET_OPTIONS_ADMIN = [
  { value: 'all_students', label: 'All Students', icon: <SchoolIcon />, color: '#4F46E5' },
  { value: 'all_faculty', label: 'All Faculty', icon: <PeopleAltIcon />, color: '#10b981' },
  { value: 'all_staff', label: 'Everyone (Faculty + Students)', icon: <AllInclusiveIcon />, color: '#f59e0b' },
  { value: 'batch', label: 'Specific Batch (Dept + Year)', icon: <GroupIcon />, color: '#06b6d4' },
  { value: 'individual', label: 'Individual Person', icon: <PersonIcon />, color: '#ef4444' },
];

const TARGET_OPTIONS_FACULTY = [
  { value: 'batch', label: 'My Batch (Dept + Year)', icon: <GroupIcon />, color: '#06b6d4' },
  { value: 'individual', label: 'Individual Student', icon: <PersonIcon />, color: '#ef4444' },
];

export default function NotificationTab({ role }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentList, setSentList] = useState([]);
  const [inboxList, setInboxList] = useState([]);

  // Compose form
  const [target, setTarget] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [recipientId, setRecipientId] = useState(null);

  // Dropdowns
  const [departments, setDepartments] = useState([]);
  const [recipients, setRecipients] = useState([]);

  const targetOptions = role === 'admin' ? TARGET_OPTIONS_ADMIN : TARGET_OPTIONS_FACULTY;

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (role === 'faculty') {
        const assigned = user?.assignedDepartments || [];
        const filtered = res.data.filter(d => assigned.includes(d._id));
        setDepartments(filtered);
      } else {
        setDepartments(res.data);
      }
    } catch (_) {}
  };

  const loadRecipients = async () => {
    try {
      const roleFilter = role === 'faculty' ? 'student' : '';
      const res = await api.get(`/notifications/recipients${roleFilter ? `?role=${roleFilter}` : ''}`);
      setRecipients(res.data);
    } catch (_) {}
  };

  const loadSent = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/sent');
      setSentList(res.data);
    } catch (_) {
      showToast('Failed to load sent notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInbox = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setInboxList(res.data);
    } catch (_) {
      showToast('Failed to load inbox.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      showToast('All notifications marked as read.', 'success');
      loadInbox();
    } catch (_) {}
  };

  useEffect(() => {
    loadDepartments();
    if (target === 'individual') loadRecipients();
  }, [target]);

  useEffect(() => {
    if (activeTab === 1) loadSent();
    if (activeTab === 2) loadInbox();
  }, [activeTab]);

  const resetForm = () => {
    setTarget('');
    setTitle('');
    setMessage('');
    setDepartmentId('');
    setYear('');
    setSemester('');
    setRecipientId(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!target) return showToast('Please select a target audience.', 'warning');
    if (!title.trim()) return showToast('Please enter a title.', 'warning');
    if (!message.trim()) return showToast('Please enter a message.', 'warning');

    if (target === 'batch' && (!departmentId || !year)) {
      return showToast('Please select Department and Year for batch notification.', 'warning');
    }
    if (target === 'individual' && !recipientId) {
      return showToast('Please select a recipient.', 'warning');
    }

    setSending(true);
    try {
      const payload = { title, message, target };
      if (target === 'batch') { payload.departmentId = departmentId; payload.year = year; payload.semester = semester || undefined; }
      if (target === 'individual') { payload.recipientId = recipientId._id; }

      const res = await api.post('/notifications/send', payload);
      showToast(`✅ Notification sent to ${res.data.count} recipient(s).`, 'success');
      resetForm();
      if (activeTab === 1) loadSent();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send notification.', 'error');
    } finally {
      setSending(false);
    }
  };

  const selectedTarget = targetOptions.find(t => t.value === target);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <NotificationsActiveIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Send Notifications</Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab icon={<SendIcon />} iconPosition="start" label="Compose" />
        <Tab icon={<NotificationsActiveIcon />} iconPosition="start" label="Sent" />
        <Tab icon={<InboxIcon />} iconPosition="start" label="Inbox" />
      </Tabs>

      {/* ── COMPOSE TAB ── */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* Audience Picker */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>1. Choose Audience</Typography>
            <Stack spacing={2}>
              {targetOptions.map(opt => (
                <Card
                  key={opt.value}
                  onClick={() => setTarget(opt.value)}
                  sx={{
                    p: 2, borderRadius: '16px', cursor: 'pointer',
                    border: '2px solid',
                    borderColor: target === opt.value ? opt.color : 'transparent',
                    background: target === opt.value
                      ? `linear-gradient(135deg, ${opt.color}18, ${opt.color}08)`
                      : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: opt.color, transform: 'translateX(4px)' },
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: opt.color, width: 40, height: 40 }}>
                    {React.cloneElement(opt.icon, { fontSize: 'small' })}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: target === opt.value ? 700 : 400 }}>
                    {opt.label}
                  </Typography>
                </Card>
              ))}
            </Stack>
          </Grid>

          {/* Compose Message */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>2. Compose Message</Typography>
            <form onSubmit={handleSend}>
              <Stack spacing={2.5}>
                {/* Batch fields */}
                {target === 'batch' && (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select fullWidth required label="Department"
                        value={departmentId}
                        onChange={e => setDepartmentId(e.target.value)}
                      >
                        {departments.map(d => (
                          <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select fullWidth required label="Year"
                        value={year}
                        onChange={e => setYear(e.target.value)}
                      >
                        {(role === 'faculty' && user?.assignedYears ? user.assignedYears : ['First Year', 'Second Year', 'Third Year']).map(y => (
                          <MenuItem key={y} value={y}>{y}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select fullWidth label="Semester (optional)"
                        value={semester}
                        onChange={e => setSemester(e.target.value)}
                      >
                        <MenuItem value="">All Semesters</MenuItem>
                        {['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6'].map(s => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                )}

                {/* Individual picker */}
                {target === 'individual' && (
                  <Autocomplete
                    options={recipients}
                    getOptionLabel={opt => `${opt.name} (${opt.role}) — @${opt.username}`}
                    value={recipientId}
                    onChange={(_, v) => setRecipientId(v)}
                    onOpen={loadRecipients}
                    renderInput={params => (
                      <TextField {...params} label="Search recipient by name / username" fullWidth required />
                    )}
                    renderOption={(props, opt) => (
                      <Box component="li" {...props} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: opt.role === 'student' ? '#4F46E5' : '#10b981', fontSize: 14 }}>
                          {opt.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{opt.name}</Typography>
                          <Typography variant="caption" color="text.secondary">@{opt.username} · {opt.role}</Typography>
                        </Box>
                      </Box>
                    )}
                  />
                )}

                <TextField
                  fullWidth required
                  label="Notification Title"
                  placeholder="e.g. Exam Schedule Update"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  inputProps={{ maxLength: 100 }}
                  helperText={`${title.length}/100`}
                />

                <TextField
                  fullWidth required multiline rows={5}
                  label="Message"
                  placeholder="Write your notification message here..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${message.length}/1000`}
                />

                {/* Preview bar */}
                {selectedTarget && title && (
                  <Card sx={{
                    p: 2, borderRadius: '12px',
                    background: `linear-gradient(135deg, ${selectedTarget.color}15, ${selectedTarget.color}05)`,
                    border: `1px solid ${selectedTarget.color}40`,
                  }}>
                    <Typography variant="caption" color="text.secondary">Preview — sending to:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        avatar={<Avatar sx={{ bgcolor: selectedTarget.color }}>{React.cloneElement(selectedTarget.icon, { fontSize: 'small' })}</Avatar>}
                        label={selectedTarget.label}
                        size="small"
                        sx={{ bgcolor: `${selectedTarget.color}20`, fontWeight: 600 }}
                      />
                      {target === 'batch' && departmentId && year && (
                        <Chip label={`${departments.find(d => d._id === departmentId)?.name} · ${year}${semester ? ' · ' + semester : ''}`} size="small" variant="outlined" />
                      )}
                      {target === 'individual' && recipientId && (
                        <Chip label={recipientId.name} size="small" variant="outlined" />
                      )}
                    </Box>
                  </Card>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={sending || !target || !title || !message}
                  startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  sx={{
                    height: 52,
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    background: 'linear-gradient(135deg, #4F46E5, #06b6d4)',
                    '&:hover': { background: 'linear-gradient(135deg, #4338ca, #0891b2)' },
                  }}
                >
                  {sending ? 'Sending...' : 'Send Notification'}
                </Button>
              </Stack>
            </form>
          </Grid>
        </Grid>
      )}

      {/* ── SENT TAB ── */}
      {activeTab === 1 && (
        <Box>
          {loading ? (
            <CircularProgress />
          ) : sentList.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: '16px' }}>
              <SendIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No notifications sent yet.</Typography>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Recipient</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Sent At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sentList.map(n => (
                    <TableRow key={n._id}>
                      <TableCell sx={{ fontWeight: 700 }}>{n.title}</TableCell>
                      <TableCell sx={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>{n.message}</TableCell>
                      <TableCell>
                        {n.recipientId ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: n.recipientId.role === 'student' ? '#4F46E5' : '#10b981' }}>
                              {n.recipientId.name?.[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1 }}>{n.recipientId.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{n.recipientId.role}</Typography>
                            </Box>
                          </Box>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={n.read ? 'Read' : 'Unread'} color={n.read ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell>{new Date(n.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* ── INBOX TAB ── */}
      {activeTab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button startIcon={<MarkEmailReadIcon />} variant="outlined" onClick={markAllRead} size="small">
              Mark All Read
            </Button>
          </Box>
          {loading ? (
            <CircularProgress />
          ) : inboxList.length === 0 ? (
            <Card sx={{ p: 5, textAlign: 'center', borderRadius: '16px' }}>
              <InboxIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Your inbox is empty.</Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {inboxList.map(n => (
                <Card
                  key={n._id}
                  sx={{
                    p: 3, borderRadius: '16px',
                    border: '1px solid',
                    borderColor: n.read ? 'divider' : 'primary.main',
                    bgcolor: n.read ? 'background.paper' : 'primary.50',
                    opacity: n.read ? 0.8 : 1,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{n.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{n.message}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right', ml: 2, flexShrink: 0 }}>
                      <Chip label={n.read ? 'Read' : 'New'} color={n.read ? 'default' : 'primary'} size="small" />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                  {n.senderId && (
                    <Divider sx={{ my: 1.5 }} />
                  )}
                  {n.senderId && (
                    <Typography variant="caption" color="text.secondary">
                      From: <strong>{n.senderId.name}</strong> ({n.senderId.role})
                    </Typography>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}
