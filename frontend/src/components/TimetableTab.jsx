import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const yearsList = ['First Year', 'Second Year', 'Third Year'];

export default function TimetableTab({ role }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';
  const isStudent = role === 'student';

  // Load Setup Data
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  // Filter Selection States (for listing)
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('First Year');
  const [selectedSem, setSelectedSem] = useState('Sem 1');

  // Timetable Listing State
  const [timetableList, setTimetableList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Form State (for Admin Creation)
  const [form, setForm] = useState({
    departmentId: '',
    year: 'Second Year',
    semester: 'Sem 4',
    day: 'Monday',
    subjectName: '',
    facultyName: '',
    startTime: '',
    endTime: '',
    roomNumber: '',
  });
  const [saving, setSaving] = useState(false);

  // Fetch all departments
  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
      if (res.data.length > 0) {
        // Set default selections
        const firstDeptId = res.data[0]._id;
        setSelectedDept(firstDeptId);
        setForm(prev => ({ ...prev, departmentId: firstDeptId }));
      }
    } catch (err) {
      showToast('Error loading departments.', 'error');
    } finally {
      setLoadingDepts(false);
    }
  };

  // Set default student filters on mount
  useEffect(() => {
    if (isStudent && user) {
      if (user.departmentId) setSelectedDept(user.departmentId);
      if (user.year) setSelectedYear(user.year);
      if (user.semester) setSelectedSem(user.semester);
    }
  }, [isStudent, user]);

  // Load departments if admin or student
  useEffect(() => {
    if (isAdmin || isStudent) {
      fetchDepartments();
    }
  }, [role]);

  // Fetch timetable schedule for specific class (Admin & Student)
  const fetchClassSchedule = async () => {
    if (!selectedDept || !selectedYear || !selectedSem) return;
    setLoadingList(true);
    try {
      const res = await api.get(`/timetable/class?departmentId=${selectedDept}&year=${selectedYear}&semester=${selectedSem}`);
      setTimetableList(res.data);
    } catch (err) {
      showToast('Error loading timetable.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch faculty's own schedule
  const fetchFacultySchedule = async () => {
    setLoadingList(true);
    try {
      const res = await api.get('/timetable/my');
      setTimetableList(res.data);
    } catch (err) {
      showToast('Failed to load your timetable.', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  // Refetch list when filters change
  useEffect(() => {
    if (isAdmin || isStudent) {
      fetchClassSchedule();
    }
  }, [selectedDept, selectedYear, selectedSem]);

  // Load faculty schedule on mount
  useEffect(() => {
    if (isFaculty) {
      fetchFacultySchedule();
    }
  }, [role]);

  // Handle Save (Admin Only)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.departmentId || !form.subjectName || !form.facultyName || !form.startTime || !form.endTime || !form.roomNumber) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await api.post('/timetable', form);
      showToast('Timetable slot created successfully.', 'success');
      // Reset parts of the form but keep metadata for easy consecutive entries
      setForm(prev => ({
        ...prev,
        subjectName: '',
        facultyName: '',
        startTime: '',
        endTime: '',
        roomNumber: '',
      }));
      // Refresh list
      fetchClassSchedule();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create timetable slot.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete (Admin Only)
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this timetable record?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      showToast('Timetable entry deleted.', 'success');
      fetchClassSchedule();
    } catch (err) {
      showToast('Failed to delete timetable entry.', 'error');
    }
  };

  if (loadingDepts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      {/* ── ADMIN VIEW: Timetable Builder ── */}
      {isAdmin && (
        <Grid container spacing={4}>
          {/* Create Form Column */}
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonthIcon color="primary" /> Create Timetable Record
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSave}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Department"
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      required
                    >
                      {departments.map(d => (
                        <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Year"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value, semester: getSemestersForYear(e.target.value)[0] })}
                      required
                    >
                      {yearsList.map(y => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      select
                      fullWidth
                      label="Semester"
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      required
                    >
                      {getSemestersForYear(form.year).map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Day"
                      value={form.day}
                      onChange={(e) => setForm({ ...form, day: e.target.value })}
                      required
                    >
                      {daysOfWeek.map(d => (
                        <MenuItem key={d} value={d}>{d}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      placeholder="e.g. Java Programming"
                      value={form.subjectName}
                      onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Faculty Name"
                      placeholder="e.g. Mr. Patil"
                      value={form.facultyName}
                      onChange={(e) => setForm({ ...form, facultyName: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Start Time"
                      placeholder="e.g. 10:00 AM"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="End Time"
                      placeholder="e.g. 11:00 AM"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Room Number"
                      placeholder="e.g. Lab 3"
                      value={form.roomNumber}
                      onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      required
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={saving}
                      startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                      sx={{ py: 1.5, borderRadius: '8px' }}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Card>
          </Grid>

          {/* List and Preview Column */}
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Class Timetable Slots
              </Typography>
              <Divider sx={{ mb: 3 }} />

              {/* Filtering for List */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Filter Department"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    {departments.map(d => (
                      <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Filter Year"
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value);
                      setSelectedSem(getSemestersForYear(e.target.value)[0]);
                    }}
                  >
                    {yearsList.map(y => (
                      <MenuItem key={y} value={y}>{y}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Filter Semester"
                    value={selectedSem}
                    onChange={(e) => setSelectedSem(e.target.value)}
                  >
                    {getSemestersForYear(selectedYear).map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {loadingList ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : timetableList.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No timetable entries found for this class combination.
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Day</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Faculty</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {timetableList.map((slot) => (
                        <TableRow key={slot._id} hover>
                          <TableCell>{slot.day}</TableCell>
                          <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                          <TableCell sx={{ fontWeight: 'medium' }}>{slot.subjectName}</TableCell>
                          <TableCell>{slot.facultyName}</TableCell>
                          <TableCell>{slot.roomNumber}</TableCell>
                          <TableCell align="right">
                            <IconButton color="error" size="small" onClick={() => handleDelete(slot._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ── FACULTY VIEW: Personal Flat Schedule ── */}
      {isFaculty && (
        <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            My Timetable
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : timetableList.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No timetable entries found matching your faculty name.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Day</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timetableList.map((slot) => (
                    <TableRow key={slot._id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{slot.day}</TableCell>
                      <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: 'primary.main' }}>{slot.subjectName}</TableCell>
                      <TableCell>{slot.roomNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* ── STUDENT VIEW: Filtered Class Timetable ── */}
      {isStudent && (
        <Card sx={{ p: 4, borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
            Class Timetable
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {/* Filtering controls */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Department"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departments.map(d => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                select
                fullWidth
                label="Year"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedSem(getSemestersForYear(e.target.value)[0]);
                }}
              >
                {yearsList.map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={6} sm={4}>
              <TextField
                select
                fullWidth
                label="Semester"
                value={selectedSem}
                onChange={(e) => setSelectedSem(e.target.value)}
              >
                {getSemestersForYear(selectedYear).map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          {loadingList ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : timetableList.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No timetable entries found for the selected filter combination.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Day</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Faculty</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Room</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timetableList.map((slot) => (
                    <TableRow key={slot._id} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>{slot.day}</TableCell>
                      <TableCell sx={{ fontWeight: 'semibold', color: 'primary.main' }}>{slot.subjectName}</TableCell>
                      <TableCell>{slot.facultyName}</TableCell>
                      <TableCell>{slot.startTime} - {slot.endTime}</TableCell>
                      <TableCell>{slot.roomNumber}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}
    </Box>
  );
}
