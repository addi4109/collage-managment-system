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
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  CircularProgress,
  Divider,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function MonthlyReportTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Faculty entry filters
  const [filter, setFilter] = useState({
    departmentId: '',
    year: 'First Year',
    semester: 'Sem 1',
    month: 'July 2026',
  });

  // Selected entities
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportForm, setReportForm] = useState({
    attendance: 85,
    discipline: 'Good',
    participation: 7,
    behavior: 8,
    punctuality: 8,
    subjects: [],
    remarks: '',
    published: false,
  });

  // Parent signing state
  const [parentRemarks, setParentRemarks] = useState('');
  const [signing, setSigning] = useState(false);

  const months = ['July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026'];

  const loadData = async () => {
    setLoading(true);
    try {
      if (role === 'student') {
        const res = await api.get('/monthly-reports');
        setReports(res.data);
      } else {
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
        const subRes = await api.get('/subjects');
        setSubjects(subRes.data);
      }
    } catch (err) {
      showToast('Error loading reports details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadStudentsForEntry = async () => {
    if (!filter.departmentId) return;
    setLoading(true);
    try {
      // Get all students matching filters
      const res = await api.get(`/students?departmentId=${filter.departmentId}&year=${filter.year}&semester=${filter.semester}`);
      setStudents(res.data);

      // Reset selection
      setSelectedStudent(null);
    } catch (err) {
      showToast('Failed to fetch batch students.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudentForReport = async (student) => {
    setSelectedStudent(student);
    setLoading(true);
    try {
      // Find existing report if any
      const res = await api.get(`/monthly-reports?studentId=${student.userId?._id}&month=${filter.month}`);
      const existing = res.data[0];

      // Prepare subject lines
      const batchSubjects = subjects.filter(
        s => s.departmentId?._id === filter.departmentId && s.semester === filter.semester
      );

      const mappedSubjects = batchSubjects.map(sub => {
        const found = existing?.subjects?.find(s => s.subjectName === sub.name);
        return {
          subjectId: sub._id,
          subjectName: sub.name,
          score: found ? found.score : 0,
          total: 100,
        };
      });

      setReportForm({
        attendance: existing ? existing.attendance : 85,
        discipline: existing ? existing.discipline : 'Good',
        participation: existing ? existing.participation : 7,
        behavior: existing ? existing.behavior : 8,
        punctuality: existing ? existing.punctuality : 8,
        subjects: mappedSubjects,
        remarks: existing ? existing.remarks : '',
        published: existing ? existing.published : false,
      });
    } catch (err) {
      showToast('Error setting up report card template.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (idx, scoreVal) => {
    const updated = [...reportForm.subjects];
    updated[idx].score = Number(scoreVal);
    setReportForm({ ...reportForm, subjects: updated });
  };

  const handleSaveReport = async (publishedValue) => {
    try {
      const payload = {
        ...reportForm,
        studentId: selectedStudent.userId._id,
        month: filter.month,
        published: publishedValue,
      };

      await api.post('/monthly-reports', payload);
      showToast(publishedValue ? 'Report card published!' : 'Report card draft saved.', 'success');
      loadStudentsForEntry();
    } catch (err) {
      showToast('Error saving report card details.', 'error');
    }
  };

  const handleParentSign = async (reportId) => {
    setSigning(true);
    try {
      await api.put(`/monthly-reports/${reportId}/sign`, { remarks: parentRemarks });
      showToast('Performance card signed successfully.', 'success');
      setParentRemarks('');
      loadData();
    } catch (err) {
      showToast('Failed to sign report card.', 'error');
    } finally {
      setSigning(false);
    }
  };

  if (loading && role === 'student') return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 3 }}>
        <AssessmentIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Monthly Report Cards
        </Typography>
      </Box>

      {role === 'student' ? (
        reports.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
            <Typography color="text.secondary">No performance reports published yet.</Typography>
          </Card>
        ) : (
          <Grid container spacing={4}>
            {reports.map((report) => (
              <Grid item xs={12} key={report._id}>
                <Card sx={{ p: 4, borderRadius: '20px', border: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Performance Report: {report.month}
                    </Typography>
                    <Chip
                      label={report.parentViewed ? 'Viewed & Signed' : 'Awaiting Sign-off'}
                      color={report.parentViewed ? 'success' : 'warning'}
                    />
                  </Box>

                  <Grid container spacing={3}>
                    {/* Performance Metrics sliders/meters */}
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Attendance & Conduct
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          Attendance Rate <span>{report.attendance}%</span>
                        </Typography>
                        <LinearProgress variant="determinate" value={report.attendance} sx={{ height: 8, borderRadius: 4 }} />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Discipline: <b>{report.discipline}</b></Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Evaluation Indicators (out of 10)
                      </Typography>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption">Participation: {report.participation}/10</Typography>
                        <LinearProgress variant="determinate" color="secondary" value={report.participation * 10} />
                      </Box>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption">Behavior & Etiquette: {report.behavior}/10</Typography>
                        <LinearProgress variant="determinate" color="success" value={report.behavior * 10} />
                      </Box>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption">Punctuality: {report.punctuality}/10</Typography>
                        <LinearProgress variant="determinate" color="warning" value={report.punctuality * 10} />
                      </Box>
                    </Grid>

                    {/* Subject Scores Table */}
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                        Subject Tests Breakdown
                      </Typography>
                      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell>Subject Name</TableCell>
                              <TableCell align="right">Score</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {report.subjects.map((sub, idx) => (
                              <TableRow key={idx}>
                                <TableCell sx={{ fontWeight: 'bold' }}>{sub.subjectName}</TableCell>
                                <TableCell align="right">{sub.score}</TableCell>
                                <TableCell align="right">{sub.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      <Card sx={{ p: 2, bgcolor: 'action.hover', border: 'none', mb: 3 }}>
                        <Typography variant="caption" color="text.secondary">Proctor Remarks:</Typography>
                        <Typography variant="body2">{report.remarks || 'None.'}</Typography>
                      </Card>

                      {/* Parent Sign-off */}
                      {report.parentViewed ? (
                        <Card sx={{ p: 2.5, border: '1px solid', borderColor: 'success.main', bgcolor: 'success.light' }}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
                            <CheckCircleIcon color="success" /> Performance Card Signed
                          </Typography>
                          {report.parentRemarks && (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                              Parent Feedback: {report.parentRemarks}
                            </Typography>
                          )}
                        </Card>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <TextField
                            label="Parent Remarks / Feedback"
                            multiline
                            rows={2}
                            fullWidth
                            value={parentRemarks}
                            onChange={(e) => setParentRemarks(e.target.value)}
                          />
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<SendIcon />}
                            onClick={() => handleParentSign(report._id)}
                            disabled={signing}
                          >
                            {signing ? 'Signing...' : 'Sign & Verify Card'}
                          </Button>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      ) : (
        /* FACULTY ENTRY VIEW */
        <Box>
          <Card sx={{ p: 3, mb: 4, borderRadius: '16px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
              Batch Report Entry Filter
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Department"
                  fullWidth
                  value={filter.departmentId}
                  onChange={(e) => setFilter({ ...filter, departmentId: e.target.value })}
                >
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Year"
                  fullWidth
                  value={filter.year}
                  onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                >
                  {['First Year', 'Second Year', 'Third Year'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Semester"
                  fullWidth
                  value={filter.semester}
                  onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
                >
                  {getSemestersForYear(filter.year).map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  select
                  label="Month"
                  fullWidth
                  value={filter.month}
                  onChange={(e) => setFilter({ ...filter, month: e.target.value })}
                >
                  {months.map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <Button variant="contained" onClick={loadStudentsForEntry} disabled={!filter.departmentId}>
              Search Students
            </Button>
          </Card>

          {students.length > 0 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Student Directory
                </Typography>
                <Paper sx={{ maxHeight: 400, overflowY: 'auto', borderRadius: '16px' }}>
                  <Table>
                    <TableBody>
                      {students.map((st) => (
                        <TableRow
                          key={st._id}
                          hover
                          selected={selectedStudent?._id === st._id}
                          onClick={() => handleSelectStudentForReport(st)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: 'bold' }}>{st.userId?.name}</TableCell>
                          <TableCell align="right">{st.rollNumber}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>

              {/* Entry panel */}
              <Grid item xs={12} md={8}>
                {selectedStudent ? (
                  <Card sx={{ p: 4, borderRadius: '20px' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                      Monthly Ratings: {selectedStudent.userId?.name} ({filter.month})
                    </Typography>

                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Attendance Percentage"
                          type="number"
                          fullWidth
                          value={reportForm.attendance}
                          onChange={(e) => setReportForm({ ...reportForm, attendance: Number(e.target.value) })}
                          sx={{ mb: 3 }}
                        />
                        <TextField
                          select
                          label="Discipline"
                          fullWidth
                          value={reportForm.discipline}
                          onChange={(e) => setReportForm({ ...reportForm, discipline: e.target.value })}
                          sx={{ mb: 3 }}
                        >
                          {['Excellent', 'Good', 'Average', 'Poor'].map(d => (
                            <MenuItem key={d} value={d}>{d}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          label="Feedback / General Remarks"
                          multiline
                          rows={2}
                          fullWidth
                          value={reportForm.remarks}
                          onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">Participation rating: {reportForm.participation}</Typography>
                        <Slider
                          value={reportForm.participation}
                          min={1}
                          max={10}
                          step={1}
                          onChange={(e, val) => setReportForm({ ...reportForm, participation: val })}
                          valueLabelDisplay="auto"
                          sx={{ mb: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">Behavior rating: {reportForm.behavior}</Typography>
                        <Slider
                          value={reportForm.behavior}
                          min={1}
                          max={10}
                          step={1}
                          onChange={(e, val) => setReportForm({ ...reportForm, behavior: val })}
                          valueLabelDisplay="auto"
                          sx={{ mb: 2 }}
                        />
                        <Typography variant="caption" color="text.secondary">Punctuality rating: {reportForm.punctuality}</Typography>
                        <Slider
                          value={reportForm.punctuality}
                          min={1}
                          max={10}
                          step={1}
                          onChange={(e, val) => setReportForm({ ...reportForm, punctuality: val })}
                          valueLabelDisplay="auto"
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Subject Assessment Marks Entry
                    </Typography>

                    {reportForm.subjects.map((sub, idx) => (
                      <Grid container spacing={2} key={idx} alignItems="center" sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Typography variant="body2">{sub.subjectName}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                          <TextField
                            label="Score"
                            type="number"
                            size="small"
                            value={sub.score}
                            onChange={(e) => handleScoreChange(idx, e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={3}>
                          <Typography variant="body2">/ 100</Typography>
                        </Grid>
                      </Grid>
                    ))}

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button variant="outlined" onClick={() => handleSaveReport(false)}>
                        Save Draft
                      </Button>
                      <Button variant="contained" onClick={() => handleSaveReport(true)}>
                        Save & Publish
                      </Button>
                    </Box>
                  </Card>
                ) : (
                  <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                    <Typography color="text.secondary">Select a student from the directory to start report card entry.</Typography>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
}
