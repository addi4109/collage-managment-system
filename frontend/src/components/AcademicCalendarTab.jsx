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
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import AddIcon from '@mui/icons-material/Add';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AcademicCalendarTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Create state
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'event',
    startDate: '',
    endDate: '',
    visibility: 'college',
    departmentId: '',
    color: '#1976d2',
  });

  const eventTypes = [
    { value: 'event', label: 'College Event', color: '#1976d2' },
    { value: 'holiday', label: 'Holiday', color: '#2e7d32' },
    { value: 'exam', label: 'Exam', color: '#d32f2f' },
    { value: 'seminar', label: 'Seminar', color: '#7b1fa2' },
    { value: 'cultural', label: 'Cultural Fest', color: '#ed6c02' },
  ];

  const getEventIcon = (type) => {
    switch (type) {
      case 'holiday': return <BeachAccessIcon color="success" />;
      case 'exam': return <SchoolIcon color="error" />;
      default: return <EventIcon color="primary" />;
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar');
      setEvents(res.data);

      if (role === 'admin' || role === 'faculty') {
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
      }
    } catch (err) {
      showToast('Error loading calendar events.', 'error');
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
      const selectedType = eventTypes.find(t => t.value === form.eventType);
      const postForm = {
        ...form,
        color: selectedType ? selectedType.color : '#1976d2',
      };
      if (postForm.visibility === 'college') {
        postForm.departmentId = '';
      }

      await api.post('/calendar', postForm);
      showToast('Calendar event created successfully.', 'success');
      setOpenCreate(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating calendar event.', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/calendar/${id}`);
      showToast('Event removed.', 'success');
      loadData();
    } catch (err) {
      showToast('Error deleting event.', 'error');
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  const upcomingEvents = events.filter(e => new Date(e.endDate) >= new Date());
  const holidays = events.filter(e => e.eventType === 'holiday');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Academic Calendar
        </Typography>
        {(role === 'admin' || role === 'faculty') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Add Event
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        {/* Agenda / Events Timeline */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Upcoming Schedule
          </Typography>
          {upcomingEvents.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
              <Typography color="text.secondary">No upcoming events scheduled.</Typography>
            </Card>
          ) : (
            <Stack spacing={2.5}>
              {upcomingEvents.map((e) => (
                <Card
                  key={e._id}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    borderLeft: `6px solid ${e.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getEventIcon(e.eventType)}
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {e.title}
                      </Typography>
                    </Box>
                    <Chip label={e.eventType} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {e.description || 'No description provided.'}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Starts: {new Date(e.startDate).toLocaleString()} | Ends: {new Date(e.endDate).toLocaleString()}
                  </Typography>
                  {e.visibility === 'department' && e.departmentId && (
                    <Typography variant="caption" color="primary.main" sx={{ mt: 0.5 }}>
                      Department Scope: {e.departmentId.name}
                    </Typography>
                  )}

                  {(role === 'admin' || (role === 'faculty' && e.createdBy === api.defaults.headers.common?.userId)) && (
                    <Button
                      color="error"
                      size="small"
                      sx={{ position: 'absolute', bottom: 12, right: 12 }}
                      onClick={() => handleDelete(e._id)}
                    >
                      Remove
                    </Button>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Grid>

        {/* Holiday Widget Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '16px', bgcolor: 'action.hover' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <BeachAccessIcon color="success" /> Holidays Widget
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {holidays.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No holidays announced.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {holidays.map((h) => (
                  <Box key={h._id}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {h.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(h.startDate).toLocaleDateString()}
                    </Typography>
                    <Divider sx={{ mt: 1 }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* CREATE EVENT DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Add Calendar Event</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Event Title"
              fullWidth
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              select
              label="Event Type"
              fullWidth
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            >
              {eventTypes.map(t => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Date & Time"
                  type="datetime-local"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Date & Time"
                  type="datetime-local"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </Grid>
            </Grid>
            <TextField
              select
              label="Visibility Level"
              fullWidth
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
            >
              <MenuItem value="college">College Wide (All)</MenuItem>
              <MenuItem value="department">Department Scoped</MenuItem>
            </TextField>
            {form.visibility === 'department' && (
              <TextField
                select
                label="Select Department"
                fullWidth
                required
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </TextField>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create Event</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
