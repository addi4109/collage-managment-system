import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import GradeIcon from '@mui/icons-material/Grade';
import AttachFileIcon from '@mui/icons-material/AttachFile';

import { useAuthStore } from '../store/authStore';
import {
  getFacultyCourses,
  getFacultyAssignments,
  createAssignment,
  getAssignmentSubmissions,
  gradeSubmission,
} from '../firebase/dbService';
import { Course } from '../types';
import { formatDate } from '../utils/format';

export const AssignmentsManage: React.FC = () => {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  // Grader States
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});
  const [feedbackInputs, setFeedbackInputs] = useState<Record<string, string>>({});
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [coursesList, assignmentsList] = await Promise.all([
        getFacultyCourses(user.uid),
        getFacultyAssignments(user.uid),
      ]);
      setCourses(coursesList);
      setAssignments(assignmentsList);
      if (coursesList.length > 0) {
        setSelectedCourseId(coursesList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load submissions for selected assignment
  const handleViewSubmissions = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const list = await getAssignmentSubmissions(assignment.id);
      setSubmissions(list);
      
      // Initialize inputs with current values
      const initialGrades: Record<string, string> = {};
      const initialFeedbacks: Record<string, string> = {};
      list.forEach((s) => {
        initialGrades[s.id] = s.grade || 'A';
        initialFeedbacks[s.id] = s.feedbackComments || '';
      });
      setGradeInputs(initialGrades);
      setFeedbackInputs(initialFeedbacks);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  // Handle Post Assignment
  const handlePostAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !selectedCourseId || !dueDate || !user) {
      setErrorMsg('Please complete all assignment fields.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createAssignment(
        {
          title,
          description,
          courseId: selectedCourseId,
          dueDate,
          facultyId: user.uid,
        },
        attachedFile || undefined
      );

      setSuccessMsg('Assignment posted successfully to course resources.');
      
      // Trigger local mock notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification("EduTech Hub Notification", {
            body: `New assignment posted: "${title}"`
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification("EduTech Hub Notification", {
                body: `New assignment posted: "${title}"`
              });
            }
          });
        }
      }

      setTitle('');
      setDescription('');
      setAttachedFile(null);
      
      // Reload assignments list
      const list = await getFacultyAssignments(user.uid);
      setAssignments(list);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to publish assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Submit Grade
  const handleSubmitGrade = async (submissionId: string) => {
    if (!user || !selectedAssignment) return;
    const grade = gradeInputs[submissionId];
    const feedback = feedbackInputs[submissionId];

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await gradeSubmission(submissionId, grade, feedback, user.uid);
      setSuccessMsg('Student submission graded successfully.');
      
      // Refresh submissions
      const list = await getAssignmentSubmissions(selectedAssignment.id);
      setSubmissions(list);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit grade.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Manage Assignments & Notes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload course resources, post assignments, and grade student submissions.
        </Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left column: Post Assignment Form */}
        <Grid item xs={12} lg={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudUploadIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Post New Assignment / Notes
                </Typography>
              </Box>
              <Divider sx={{ mb: 3, opacity: 0.08 }} />

              {courses.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  Assign courses to your profile before creating assignments.
                </Alert>
              ) : (
                <form onSubmit={handlePostAssignment}>
                  <FormControl fullWidth sx={{ mb: 2.5 }}>
                    <InputLabel id="course-select-label">Select Course</InputLabel>
                    <Select
                      labelId="course-select-label"
                      value={selectedCourseId}
                      label="Select Course"
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                      {courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Assignment Title"
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2.5 }}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Description & Instructions"
                    multiline
                    rows={4}
                    variant="outlined"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mb: 2.5 }}
                    required
                  />

                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    sx={{ mb: 2.5 }}
                    required
                  />

                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<AttachFileIcon />}
                      sx={{
                        height: 48,
                        borderStyle: 'dashed',
                        borderColor: attachedFile ? 'secondary.main' : 'rgba(255,255,255,0.15)',
                        '&:hover': {
                          borderColor: 'secondary.light',
                          backgroundColor: 'rgba(6, 182, 212, 0.04)',
                        },
                      }}
                    >
                      {attachedFile ? `Attached: ${attachedFile.name}` : 'Attach Resource (PDF / Video)'}
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setAttachedFile(e.target.files[0]);
                          }
                        }}
                      />
                    </Button>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={actionLoading}
                    startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                    sx={{ height: 48 }}
                  >
                    {actionLoading ? 'Uploading & Publishing...' : 'Post Assignment'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Assignments List */}
        <Grid item xs={12} lg={7}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LibraryBooksIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Lecturer Assignments List
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, opacity: 0.08 }} />

              {assignments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No assignments created yet.
                </Typography>
              ) : (
                <TableContainer component={Box} sx={{ maxHeight: 350 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Course</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Assignment Title</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Due Date</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: '#111827' }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((asg) => (
                        <TableRow key={asg.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{asg.courseCode}</TableCell>
                          <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                            {asg.title}
                            {asg.fileUrl && (
                              <Chip
                                size="small"
                                label="Attached File"
                                color="secondary"
                                variant="outlined"
                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{asg.dueDate}</TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              onClick={() => handleViewSubmissions(asg)}
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
            </CardContent>
          </Card>

          {/* Submissions Grading Panel */}
          {selectedAssignment && (
            <Card className="animate-fade-in">
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GradeIcon color="warning" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Grading: {selectedAssignment.title} ({selectedAssignment.courseCode})
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2, opacity: 0.08 }} />

                {submissionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : submissions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No students have submitted homework for this assignment yet.
                  </Typography>
                ) : (
                  <Box>
                    {submissions.map((sub, idx) => (
                      <Box key={sub.id} sx={{ mb: 3 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {sub.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {sub.studentEmail}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Submitted: {formatDate(sub.submittedAt)}
                            </Typography>
                            
                            <Box sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="info"
                                href={sub.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                startIcon={<AttachFileIcon />}
                              >
                                View File
                              </Button>
                            </Box>
                          </Grid>

                          {/* Grade select input */}
                          <Grid item xs={12} sm={4} md={2}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Grade</InputLabel>
                              <Select
                                value={gradeInputs[sub.id] || 'A'}
                                label="Grade"
                                onChange={(e) =>
                                  setGradeInputs({ ...gradeInputs, [sub.id]: e.target.value })
                                }
                              >
                                <MenuItem value="A+">A+</MenuItem>
                                <MenuItem value="A">A</MenuItem>
                                <MenuItem value="B">B</MenuItem>
                                <MenuItem value="C">C</MenuItem>
                                <MenuItem value="D">D</MenuItem>
                                <MenuItem value="F">F</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Feedback text input */}
                          <Grid item xs={12} sm={6} md={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Feedback Comments"
                              variant="outlined"
                              value={feedbackInputs[sub.id] || ''}
                              onChange={(e) =>
                                setFeedbackInputs({ ...feedbackInputs, [sub.id]: e.target.value })
                              }
                            />
                          </Grid>

                          {/* Submit Grade button */}
                          <Grid item xs={12} sm={2} md={2} sx={{ textAlign: 'right' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              disabled={actionLoading}
                              onClick={() => handleSubmitGrade(sub.id)}
                            >
                              Grade
                            </Button>
                          </Grid>
                        </Grid>
                        
                        {sub.grade && (
                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip size="small" label={`Graded: ${sub.grade}`} color="success" />
                            {sub.feedbackComments && (
                              <Typography variant="caption" color="text.secondary">
                                "{sub.feedbackComments}"
                              </Typography>
                            )}
                          </Box>
                        )}
                        {idx < submissions.length - 1 && <Divider sx={{ mt: 2, opacity: 0.05 }} />}
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};
export default AssignmentsManage;
