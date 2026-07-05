import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, CircularProgress, IconButton, Grid
} from '@mui/material';
import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';
import { TableSkeleton } from './SkeletonLoader';

export default function FacultyResultsTab() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters
  const [depts, setDepts] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('Sem 1');

  // Data
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Mark Entry Form
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [draftResult, setDraftResult] = useState(null);

  useEffect(() => {
    loadSetup();
  }, []);

  const loadSetup = async () => {
    try {
      const res = await api.get('/departments');
      const filtered = res.data.filter(d => user.assignedDepartments.includes(d._id));
      setDepts(filtered);
      if (filtered.length > 0) setSelectedDept(filtered[0]._id);
      if (user.assignedYears.length > 0) setSelectedYear(user.assignedYears[0]);
    } catch (err) {
      showToast('Error loading departments.', 'error');
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedDept || !selectedYear || !selectedSem) {
      return showToast('Please select Department, Year, and Semester.', 'warning');
    }
    setLoading(true);
    try {
      const res = await api.get(`/results/students?departmentId=${selectedDept}&year=${selectedYear}&semester=${selectedSem}`);
      setStudentsList(res.data);
    } catch (err) {
      showToast('Failed to load students.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMarkEntry = async (student) => {
    setSelectedStudent(student);
    setSubmitLoading(true);
    setOpenMarkDialog(true); // Open instantly to show loader
    try {
      const res = await api.get(`/results/student/${student.studentId}?departmentId=${selectedDept}&year=${selectedYear}&semester=${selectedSem}`);
      setDraftResult(res.data);
    } catch (err) {
      showToast('Failed to load student draft.', 'error');
      setOpenMarkDialog(false);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMarkChange = (subjectId, field, value) => {
    const updatedSubjects = draftResult.subjects.map(s => {
      if (s.subjectId === subjectId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setDraftResult({ ...draftResult, subjects: updatedSubjects });
  };

  const handleSaveDraft = async () => {
    // Validate mark limits
    for (const sub of draftResult.subjects) {
      const maxI = sub.maxInternal !== undefined ? sub.maxInternal : 20;
      const maxP = sub.maxPractical !== undefined ? sub.maxPractical : 30;
      const maxT = sub.maxTheory !== undefined ? sub.maxTheory : 80;

      if (sub.internalMarks > maxI) {
        return showToast(`Internal marks for ${sub.subjectName} cannot exceed ${maxI}.`, 'warning');
      }
      if (sub.practicalMarks > maxP) {
        return showToast(`Practical marks for ${sub.subjectName} cannot exceed ${maxP}.`, 'warning');
      }
      if (sub.theoryMarks > maxT) {
        return showToast(`Theory marks for ${sub.subjectName} cannot exceed ${maxT}.`, 'warning');
      }
      if (sub.attendancePercentage > 100) {
        return showToast(`Attendance percentage for ${sub.subjectName} cannot exceed 100.`, 'warning');
      }
    }

    setSubmitLoading(true);
    try {
      await api.post(`/results/student/${selectedStudent.studentId}`, draftResult);
      showToast('Marks saved successfully.', 'success');
      setOpenMarkDialog(false);
      handleLoadStudents(); // refresh status
    } catch (err) {
      showToast('Failed to save marks.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubmitResult = async (studentId) => {
    if (!window.confirm('Are you sure you want to submit this result to Admin?')) return;
    try {
      await api.post(`/results/student/${studentId}/submit`, { semester: selectedSem });
      showToast('Result submitted for Admin approval.', 'success');
      handleLoadStudents();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit result.', 'error');
    }
  };

  return (
    <Box>
      <Card sx={{ p: 3, borderRadius: '16px', mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Filter Students for Grading</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Department"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            >
              {depts.map(d => <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {user.assignedYears.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Semester"
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
            >
              {getSemestersForYear(selectedYear).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button fullWidth variant="contained" onClick={handleLoadStudents}>
              Load Students
            </Button>
          </Grid>
        </Grid>
      </Card>

      {loading ? <TableSkeleton /> : (
        studentsList.length > 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsList.map((st) => (
                  <TableRow key={st.studentId}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{st.rollNumber}</TableCell>
                    <TableCell>{st.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={st.status} 
                        color={st.status === 'pending' ? 'default' : st.status === 'draft' ? 'info' : st.status === 'submitted' ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenMarkEntry(st)}
                        sx={{ mr: 1 }}
                        disabled={st.status === 'declared' || st.status === 'submitted'}
                      >
                        {st.status === 'pending' ? 'Create Report' : 'Edit Report'}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={st.status !== 'draft'}
                        onClick={() => handleSubmitResult(st.studentId)}
                      >
                        Submit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )
      )}

      {/* MARK ENTRY DIALOG */}
      <Dialog open={openMarkDialog} onClose={() => setOpenMarkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Mark Entry - {selectedStudent?.name} ({selectedStudent?.rollNumber})
        </DialogTitle>
        <DialogContent dividers>
          {submitLoading && !draftResult ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : draftResult ? (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Internals</TableCell>
                    <TableCell>Practicals</TableCell>
                    <TableCell>Theory</TableCell>
                    <TableCell>Attendance %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftResult.subjects.map((sub) => {
                    const maxI = sub.maxInternal !== undefined ? sub.maxInternal : 20;
                    const maxP = sub.maxPractical !== undefined ? sub.maxPractical : 30;
                    const maxT = sub.maxTheory !== undefined ? sub.maxTheory : 80;
                    return (
                      <TableRow key={sub.subjectId}>
                        <TableCell sx={{ fontWeight: 'bold' }}>{sub.subjectName}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              disabled={!user.assignedSubjects?.includes(sub.subjectId)}
                              inputProps={{ min: 0, max: maxI }}
                              value={sub.internalMarks}
                              onChange={(e) => handleMarkChange(sub.subjectId, 'internalMarks', parseInt(e.target.value || 0, 10))}
                              sx={{ width: 80 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              / {maxI}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              disabled={!user.assignedSubjects?.includes(sub.subjectId)}
                              inputProps={{ min: 0, max: maxP }}
                              value={sub.practicalMarks}
                              onChange={(e) => handleMarkChange(sub.subjectId, 'practicalMarks', parseInt(e.target.value || 0, 10))}
                              sx={{ width: 80 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              / {maxP}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              type="number"
                              size="small"
                              disabled={!user.assignedSubjects?.includes(sub.subjectId)}
                              inputProps={{ min: 0, max: maxT }}
                              value={sub.theoryMarks}
                              onChange={(e) => handleMarkChange(sub.subjectId, 'theoryMarks', parseInt(e.target.value || 0, 10))}
                              sx={{ width: 80 }}
                            />
                            <Typography variant="body2" color="text.secondary">
                              / {maxT}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            size="small"
                            disabled={!user.assignedSubjects?.includes(sub.subjectId)}
                            inputProps={{ min: 0, max: 100 }}
                            value={sub.attendancePercentage}
                            onChange={(e) => handleMarkChange(sub.subjectId, 'attendancePercentage', parseInt(e.target.value || 0, 10))}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMarkDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveDraft} disabled={submitLoading || !draftResult}>
            {submitLoading ? <CircularProgress size={24} /> : 'Save Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
