import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
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
import AttachFileIcon from '@mui/icons-material/AttachFile';

import { useAuthStore } from '../store/authStore';
import { createAssignment, getAssignments } from '../services/assignmentService';
import { useToast } from '../context/ToastContext';

export const AssignmentsManage: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Create Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseName, setCourseName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const assignmentsList = await getAssignments();
      // Filter assignments created by the current faculty
      const facultyId = user.uid;
      const filtered = assignmentsList.filter((asg: any) => {
        const facId = asg.faculty?._id || asg.faculty;
        return facId === facultyId;
      });
      setAssignments(filtered);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Post Assignment
  const handlePostAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !courseName || !dueDate || !user) {
      setErrorMsg('Please complete all assignment fields.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let attachmentBase64 = '';
      if (attachedFile) {
        attachmentBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(attachedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      }

      await createAssignment({
        title,
        description,
        courseName,
        dueDate,
        attachment: attachmentBase64 || undefined,
        attachmentName: attachedFile ? attachedFile.name : undefined,
      });

      toast.success('Assignment posted successfully.');
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
      setCourseName('');
      setDueDate('');
      setAttachedFile(null);
      
      // Reload assignments list
      const list = await getAssignments();
      const facultyId = user.uid;
      const filtered = list.filter((asg: any) => {
        const facId = asg.faculty?._id || asg.faculty;
        return facId === facultyId;
      });
      setAssignments(filtered);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to publish assignment.');
      toast.error('Failed to publish assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Decode and download Base64 attachment
  const downloadAttachment = (base64Data: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName || 'attachment';
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Unable to download attachment.');
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
          Upload course resources, post assignments, and manage class tasks.
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

              <form onSubmit={handlePostAssignment}>
                <TextField
                  fullWidth
                  label="Subject / Course Name"
                  variant="outlined"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. CS101 - Computer Science"
                  sx={{ mb: 2.5 }}
                  required
                />

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
                    {attachedFile ? `Attached: ${attachedFile.name}` : 'Attach Resource (PDF / Video / Doc)'}
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
                <TableContainer component={Box} sx={{ maxHeight: 500 }}>
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
                        <TableRow key={asg._id || asg.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{asg.courseName}</TableCell>
                          <TableCell sx={{ color: 'text.primary', fontWeight: 500 }}>
                            {asg.title}
                            {asg.attachment && (
                              <Chip
                                size="small"
                                label="Attached File"
                                color="secondary"
                                variant="outlined"
                                sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{new Date(asg.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            {asg.attachment ? (
                              <Button
                                size="small"
                                variant="outlined"
                                color="secondary"
                                startIcon={<AttachFileIcon />}
                                onClick={() => downloadAttachment(asg.attachment, asg.attachmentName)}
                              >
                                Download
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No Attachment
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AssignmentsManage;
