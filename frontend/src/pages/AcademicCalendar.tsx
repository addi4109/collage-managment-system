import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import CelebrationIcon from '@mui/icons-material/Celebration';
import SchoolIcon from '@mui/icons-material/School';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  CalendarEvent,
  addCalendarEvent,
  getCalendarEvents,
} from '../services/erpService';

const DEPARTMENTS = [
  'All',
  'Computer Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Electronics Engineering',
];
const SEMESTERS = ['All', 'Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

export const AcademicCalendar: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'event',
    startDate: '',
    endDate: '',
    department: 'All',
    year: 'All',
    semester: 'All',
  });

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await getCalendarEvents();
      setEvents(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === 'semester') {
        if (value === 'All') updated.year = 'All';
        else if (value === 'Sem 1' || value === 'Sem 2') updated.year = 'First Year';
        else if (value === 'Sem 3' || value === 'Sem 4') updated.year = 'Second Year';
        else if (value === 'Sem 5' || value === 'Sem 6') updated.year = 'Third Year';
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCalendarEvent(formData);
      toast.success('Calendar event added successfully!');
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        type: 'event',
        startDate: '',
        endDate: '',
        department: 'All',
        year: 'All',
        semester: 'All',
      });
      loadEvents();
    } catch (err: any) {
      toast.error(err.message || 'Error adding event.');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'holiday':
        return <CelebrationIcon color="warning" />;
      case 'exam':
        return <SchoolIcon color="error" />;
      case 'event':
      default:
        return <EventIcon color="primary" />;
    }
  };

  const getEventChip = (type: string) => {
    switch (type) {
      case 'holiday':
        return <Chip label="Holiday" color="warning" size="small" sx={{ fontWeight: 600 }} />;
      case 'exam':
        return <Chip label="Exam" color="error" size="small" sx={{ fontWeight: 600 }} />;
      case 'event':
      default:
        return <Chip label="Academic Event" color="primary" size="small" sx={{ fontWeight: 600 }} />;
    }
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Academic Calendar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep track of holidays, exams schedules, and upcoming institutional events.
          </Typography>
        </Box>

        {user?.role === 'admin' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Add Calendar Event
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarMonthIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Scheduled Events List
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {events.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                    No upcoming events scheduled.
                  </Typography>
                ) : (
                  <List>
                    {events.map((ev) => (
                      <ListItem
                        key={ev._id}
                        sx={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          py: 2,
                          gap: 2,
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getEventIcon(ev.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {ev.title}
                              </Typography>
                              {getEventChip(ev.type)}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {ev.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Target: {ev.department} - {ev.semester} ({ev.year})
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {new Date(ev.startDate).toLocaleDateString()}
                          </Typography>
                          {ev.endDate && ev.endDate !== ev.startDate && (
                            <Typography variant="caption" color="text.secondary">
                              to {new Date(ev.endDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Admin: Create Event Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Calendar Event</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Event Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Event Type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <MenuItem value="event">Academic Event</MenuItem>
                  <MenuItem value="holiday">Holiday</MenuItem>
                  <MenuItem value="exam">Exam Schedule</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Start Date"
                  name="startDate"
                  InputLabelProps={{ shrink: true }}
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="End Date"
                  name="endDate"
                  InputLabelProps={{ shrink: true }}
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Department Target"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Semester Target"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                >
                  {SEMESTERS.map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      {sem}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Add Event
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AcademicCalendar;
