import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  LinearProgress,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GradeIcon from '@mui/icons-material/Grade';
import DeleteIcon from '@mui/icons-material/Delete';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AssignmentTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Faculty state for creation
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    departmentId: '',
    year: 'First Year',
    semester: 'Sem 1',
    subjectId: '',
    dueDate: '',
    maxMarks: 20,
    maxAttempts: 3,
    allowLateSubmission: true,
    latePenaltyMarks: 2,
    published: true,
  });

  // Student upload submission states
  const [openSubmit, setOpenSubmit] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [file, setFile] = useState(null);

  // Faculty grading states
  const [openSubmissions, setOpenSubmissions] = useState(false);
  const [currentAssignmentId, setCurrentAssignmentId] = useState('');
  const [submissionsList, setSubmissionsList] = useState([]);
  const [gradingSub, setGradingSub] = useState(null);
  const [gradingForm, setGradingForm] = useState({ marks: '', remarks: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assignments');
      setAssignments(res.data);

      if (role === 'faculty' || role === 'admin') {
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
        const subRes = await api.get('/subjects');
        setSubjects(subRes.data);
      }
    } catch (err) {
      showToast('Error loading assignments.', 'error');
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
      await api.post('/assignments', form);
      showToast('Assignment created successfully.', 'success');
      setOpenCreate(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating assignment.', 'error');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate size (5MB limit)
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB.', 'warning');
      return;
    }

    // Validate type (pdf, docx, png, jpg, jpeg)
    const allowedExtensions = ['pdf', 'docx', 'png', 'jpg', 'jpeg'];
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      showToast(`Invalid file type. Only ${allowedExtensions.join(', ')} are allowed.`, 'warning');
      return;
    }

    setFile(selectedFile);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    if (!file) return showToast('Please select a file to submit.', 'warning');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Assignment submitted successfully!', 'success');
      setOpenSubmit(false);
      setFile(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting assignment.', 'error');
    }
  };

  const handleViewSubmissions = async (assignmentId) => {
    setCurrentAssignmentId(assignmentId);
    try {
      const res = await api.get(`/assignments/${assignmentId}/submissions`);
      setSubmissionsList(res.data);
      setOpenSubmissions(true);
    } catch (err) {
      showToast('Error loading submissions.', 'error');
    }
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/assignments/submissions/${gradingSub._id}/grade`, gradingForm);
      showToast('Submission graded successfully.', 'success');
      setGradingSub(null);
      // reload submissions
      handleViewSubmissions(currentAssignmentId);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error grading submission.', 'error');
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${assignmentId}`);
      showToast('Assignment deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Error deleting assignment.', 'error');
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Assignment Manager
        </Typography>
        {(role === 'faculty' || role === 'admin') && (
          <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => setOpenCreate(true)}>
            Create Assignment
          </Button>
        )}
      </Box>

      {assignments.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No assignments posted yet.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {role === 'student' ? (
            assignments.map(({ assignment, submissions, attemptsUsed, maxAttempts }) => {
              const latestSubmission = submissions[0];
              const dueDateObj = new Date(assignment.dueDate);
              const isOverdue = new Date() > dueDateObj;
              const hasAttempts = attemptsUsed < maxAttempts;

              let statusLabel = 'Pending';
              let chipColor = 'warning';
              if (latestSubmission) {
                if (latestSubmission.status === 'graded') {
                  statusLabel = `Graded (${latestSubmission.marks}/${assignment.maxMarks})`;
                  chipColor = 'success';
                } else {
                  statusLabel = 'Submitted';
                  chipColor = 'primary';
                }
              }

              return (
                <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                  <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip label={assignment.subjectId?.name || 'Subject'} size="small" variant="outlined" />
                        <Chip label={statusLabel} color={chipColor} size="small" />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{assignment.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{assignment.description}</Typography>
                      <Divider sx={{ my: 1.5 }} />
                      <Typography variant="caption" color="text.secondary" display="block">
                        Due: {dueDateObj.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Attempts used: {attemptsUsed} / {maxAttempts}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 3 }}>
                      {latestSubmission && latestSubmission.status === 'graded' && (
                        <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: '8px', mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Feedback:</Typography>
                          <Typography variant="body2" color="text.secondary">{latestSubmission.remarks || 'No remarks provided.'}</Typography>
                        </Box>
                      )}
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!hasAttempts || (isOverdue && !assignment.allowLateSubmission)}
                        startIcon={<UploadFileIcon />}
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setOpenSubmit(true);
                        }}
                      >
                        {!hasAttempts ? 'No Attempts Left' : isOverdue ? 'Submit Late' : 'Submit Attempt'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })
          ) : (
            assignments.map((assignment) => (
              <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip label={assignment.subjectId?.name || 'Subject'} size="small" variant="outlined" />
                      <Chip
                        label={assignment.published ? 'Published' : 'Draft'}
                        color={assignment.published ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{assignment.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{assignment.description}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" color="text.secondary" display="block">
                      Dept: {assignment.departmentId?.name} ({assignment.year})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Due: {new Date(assignment.dueDate).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button variant="outlined" size="small" startIcon={<GradeIcon />} onClick={() => handleViewSubmissions(assignment._id)}>
                      Submissions
                    </Button>
                    <Button variant="outlined" color="error" size="small" startIcon={<DeleteIcon />} onClick={() => handleDelete(assignment._id)}>
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* CREATE ASSIGNMENT DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Create New Assignment</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <TextField
              label="Description / Instructions"
              fullWidth
              multiline
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <TextField
              select
              label="Department"
              fullWidth
              required
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Year"
                  fullWidth
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                >
                  {['First Year', 'Second Year', 'Third Year'].map(y => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  label="Semester"
                  fullWidth
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                >
                  {['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'].map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              select
              label="Subject"
              fullWidth
              required
              value={form.subjectId}
              onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            >
              {subjects.map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name} ({s.code})</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Due Date"
              type="datetime-local"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Max Marks"
                  type="number"
                  fullWidth
                  required
                  value={form.maxMarks}
                  onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Max Attempts"
                  type="number"
                  fullWidth
                  required
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.allowLateSubmission}
                  onChange={(e) => setForm({ ...form, allowLateSubmission: e.target.checked })}
                />
              }
              label="Allow Late Submission"
            />
            {form.allowLateSubmission && (
              <TextField
                label="Late Penalty Marks"
                type="number"
                fullWidth
                value={form.latePenaltyMarks}
                onChange={(e) => setForm({ ...form, latePenaltyMarks: Number(e.target.value) })}
              />
            )}
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
              }
              label="Publish Immediately (instead of Draft)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* STUDENT UPLOAD SUBMISSION DIALOG */}
      <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAssignmentSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Submit Solution</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload your solution file for <b>{selectedAssignment?.title}</b>.
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              Choose PDF/DOCX/Image (max 5MB)
              <input type="file" hidden accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
            </Button>
            {file && (
              <Typography variant="caption" color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircleIcon size="small" /> Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubmit(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!file}>Submit</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* VIEW SUBMISSIONS LIST DIALOG */}
      <Dialog open={openSubmissions} onClose={() => setOpenSubmissions(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Student Submissions</DialogTitle>
        <DialogContent>
          {submissionsList.length === 0 ? (
            <Typography color="text.secondary">No submissions made yet.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Student</TableCell>
                    <TableCell>Roll No / Enrollment</TableCell>
                    <TableCell>Attempt</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Marks</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissionsList.map((sub) => (
                    <TableRow key={sub._id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{sub.studentId?.name}</TableCell>
                      <TableCell>
                        {sub.studentProfile?.rollNumber || 'N/A'} / {sub.studentProfile?.enrollmentNumber || 'N/A'}
                      </TableCell>
                      <TableCell>{sub.attemptNumber}</TableCell>
                      <TableCell>{new Date(sub.submittedAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          startIcon={<GetAppIcon />}
                          size="small"
                          href={`${api.defaults.baseURL}${sub.fileUrl}`}
                          target="_blank"
                        >
                          Download
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sub.status}
                          color={sub.status === 'graded' ? 'success' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {sub.marks !== null ? `${sub.marks}` : 'Not graded'}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setGradingSub(sub);
                            setGradingForm({ marks: sub.marks || '', remarks: sub.remarks || '' });
                          }}
                        >
                          Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmissions(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* GRADING DIALOG */}
      <Dialog open={!!gradingSub} onClose={() => setGradingSub(null)} maxWidth="xs" fullWidth>
        {gradingSub && (
          <form onSubmit={handleGradeSubmit}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Grade Submission</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Typography variant="body2">
                Student: <b>{gradingSub.studentId?.name}</b>
              </Typography>
              <Typography variant="body2">
                Max Marks: <b>{gradingSub.assignmentId?.maxMarks}</b>
              </Typography>
              <TextField
                label="Enter Marks"
                type="number"
                required
                fullWidth
                value={gradingForm.marks}
                onChange={(e) => setGradingForm({ ...gradingForm, marks: e.target.value })}
              />
              <TextField
                label="Feedback / Remarks"
                multiline
                rows={3}
                fullWidth
                value={gradingForm.remarks}
                onChange={(e) => setGradingForm({ ...gradingForm, remarks: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGradingSub(null)}>Cancel</Button>
              <Button type="submit" variant="contained">Save Grade</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
