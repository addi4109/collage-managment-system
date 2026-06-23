import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';

import { useAuthStore } from '../store/authStore';
import { getStudentAssignments, submitAssignment } from '../firebase/dbService';
import { isPlaceholder } from '../firebase/config';

export const AssignmentsView: React.FC = () => {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog States
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [selectedAsg, setSelectedAsg] = useState<any | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // AI Notes Summarizer States
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [summaryAsg, setSummaryAsg] = useState<any | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await getStudentAssignments(user.uid);
      setAssignments(list);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenSubmit = (asg: any) => {
    setSelectedAsg(asg);
    setAttachedFile(null);
    setOpenSubmitDialog(true);
  };

  const handleCloseSubmit = () => {
    setOpenSubmitDialog(false);
    setSelectedAsg(null);
    setAttachedFile(null);
  };

  const handleSubmitFile = async () => {
    if (!user || !selectedAsg || !attachedFile) return;
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await submitAssignment(selectedAsg.id, user.uid, attachedFile);
      setSuccessMsg(`Homework successfully uploaded for: ${selectedAsg.title}.`);
      handleCloseSubmit();
      
      // Reload lists
      const list = await getStudentAssignments(user.uid);
      setAssignments(list);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit file.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSummarize = async (asg: any) => {
    setSummaryAsg(asg);
    setSummaryText('');
    setSummaryError(null);
    setOpenSummaryDialog(true);
    setSummarizing(true);

    try {
      if (isPlaceholder) {
        // Local Sandbox simulation
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        // Generate simple mock summary tailored to course/assignment
        setSummaryText(`### 📚 Lecture Summary: ${asg.title}

Here is a summary of the uploaded study material for **${asg.courseCode}**:

- **Key Objective**: Understand the core design principles and execution rules of the ${asg.title} model.
- **Section 1 - Foundations**: Focuses on core specifications, architectural layers, and performance considerations.
- **Section 2 - Implementation**: Outlines how variables are managed and how schemas are verified dynamically.
- **Section 3 - Critical Insights**:
  - Double check conflict flags when editing data files.
  - Review how the circular widgets display information.
  
*Note: In local sandbox mode, summaries are simulated locally. Add your GEMINI_API_KEY in backend functions to process actual PDF files!*`);
      } else {
        // Trigger live cloud function
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'edutech-hub-placeholder';
        const isLocalHost = window.location.hostname === 'localhost';
        const url = isLocalHost
          ? `http://localhost:5001/${projectId}/us-central1/aiSummarizer`
          : `https://us-central1-${projectId}.cloudfunctions.net/aiSummarizer`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileUrl: asg.fileUrl }),
        });

        if (!response.ok) {
          throw new Error('API server returned error status');
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setSummaryText(data.summary || 'Empty summary received.');
      }
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'Failed to fetch note summary. Verify cloud services are online.');
    } finally {
      setSummarizing(false);
    }
  };

  // Determine status chip
  const getStatusChip = (asg: any) => {
    const isSubmitted = !!asg.submission;
    const isGraded = isSubmitted && !!asg.submission.grade;
    const isOverdue = new Date(asg.dueDate) < new Date();

    if (isGraded) {
      return (
        <Chip
          label={`Graded: ${asg.submission.grade}`}
          color="success"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    if (isSubmitted) {
      return (
        <Chip
          label="Submitted"
          color="info"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    if (isOverdue) {
      return (
        <Chip
          icon={<AssignmentLateIcon />}
          label="Overdue"
          color="error"
          sx={{ fontWeight: 'bold' }}
        />
      );
    }
    return (
      <Chip
        label="Pending Submit"
        color="warning"
        sx={{ fontWeight: 'bold' }}
      />
    );
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
          My Assignments & Resources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review assignments, download course readings, and submit your work files.
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

      {assignments.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">
              No assignments assigned. Ensure you are enrolled in active courses.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {assignments.map((asg) => {
            const hasFile = !!asg.fileUrl;
            const isSubmitted = !!asg.submission;
            const isGraded = isSubmitted && !!asg.submission.grade;

            return (
              <Grid item xs={12} key={asg.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                      <Box>
                        <Chip
                          size="small"
                          label={`${asg.courseCode} - ${asg.courseName}`}
                          color="primary"
                          sx={{ mb: 1, fontWeight: 'bold' }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {asg.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                        {getStatusChip(asg)}
                        <Typography variant="caption" color="text.secondary">
                          Due Date: <strong>{asg.dueDate}</strong>
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ mb: 2, opacity: 0.08 }} />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
                      {asg.description}
                    </Typography>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {/* Download Resource Attachment */}
                      {hasFile && (
                        <>
                          <Button
                            variant="outlined"
                            color="secondary"
                            href={asg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            startIcon={<DownloadIcon />}
                          >
                            Download Resource
                          </Button>
                          <Button
                            variant="contained"
                            onClick={() => handleSummarize(asg)}
                            startIcon={<PsychologyIcon />}
                            sx={{
                              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                              color: '#fff',
                              fontWeight: 'bold',
                              boxShadow: '0 4px 14px rgba(168, 85, 247, 0.3)',
                              '&:hover': {
                                background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                              },
                            }}
                          >
                            AI Summarize
                          </Button>
                        </>
                      )}

                      {/* Submit Homework Button */}
                      {!isGraded && (
                        <Button
                          variant="contained"
                          color={isSubmitted ? 'inherit' : 'primary'}
                          onClick={() => handleOpenSubmit(asg)}
                          startIcon={<CloudUploadIcon />}
                          sx={{
                            backgroundColor: isSubmitted ? 'rgba(255, 255, 255, 0.05)' : 'primary.main',
                            color: isSubmitted ? 'text.secondary' : 'primary.contrastText',
                          }}
                        >
                          {isSubmitted ? 'Resubmit Homework' : 'Submit Assignment'}
                        </Button>
                      )}
                    </Box>

                    {/* Grader Feedback Details */}
                    {isGraded && (
                      <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.light', mb: 1 }}>
                          <CheckCircleIcon fontSize="small" />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Graded Assignment Summary (Score: {asg.submission.grade})
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Feedback Comments: "{asg.feedback || 'Excellent work! Keep it up.'}"
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Upload Submission Dialog */}
      <Dialog open={openSubmitDialog} onClose={handleCloseSubmit} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          Submit Assignment
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Upload your homework solution file (PDF, docx, or zip format) for:{' '}
            <strong>{selectedAsg?.title}</strong>.
          </Typography>

          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<AttachFileIcon />}
            sx={{
              height: 56,
              borderStyle: 'dashed',
              borderColor: attachedFile ? 'secondary.main' : 'rgba(255,255,255,0.15)',
              '&:hover': {
                borderColor: 'secondary.light',
                backgroundColor: 'rgba(6, 182, 212, 0.04)',
              },
            }}
          >
            {attachedFile ? attachedFile.name : 'Select File to Upload'}
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
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={handleCloseSubmit} color="inherit" disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitFile}
            variant="contained"
            color="primary"
            disabled={actionLoading || !attachedFile}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
          >
            Submit Homework
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Summary Dialog */}
      <Dialog
        open={openSummaryDialog}
        onClose={() => !summarizing && setOpenSummaryDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="secondary" />
            AI Notes Summarizer
          </Typography>
          {!summarizing && (
            <IconButton size="small" onClick={() => setOpenSummaryDialog(false)} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <Divider sx={{ opacity: 0.08 }} />
        <DialogContent sx={{ py: 3 }}>
          {summarizing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
              <CircularProgress color="secondary" />
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Analyzing PDF document and extracting notes...
              </Typography>
            </Box>
          ) : summaryError ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {summaryError}
            </Alert>
          ) : (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.light' }}>
                Document: {summaryAsg?.title}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  maxHeight: '400px',
                  overflowY: 'auto',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    color: 'text.primary',
                    fontFamily: 'inherit',
                  }}
                >
                  {summaryText}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button
            onClick={() => setOpenSummaryDialog(false)}
            variant="outlined"
            disabled={summarizing}
            sx={{ borderRadius: 2 }}
          >
            Close Summary
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AssignmentsView;
