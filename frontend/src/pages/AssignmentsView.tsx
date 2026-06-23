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
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PsychologyIcon from '@mui/icons-material/Psychology';

import { useAuthStore } from '../store/authStore';
import { getAssignments } from '../services/assignmentService';
import { useToast } from '../context/ToastContext';

export const AssignmentsView: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Notes Summarizer States
  const [openSummaryDialog, setOpenSummaryDialog] = useState(false);
  const [summaryAsg, setSummaryAsg] = useState<any | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await getAssignments();
      setAssignments(list);
    } catch (err: any) {
      console.error('Error fetching assignments:', err);
      setErrorMsg(err.message || 'Failed to fetch assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSummarize = async (asg: any) => {
    setSummaryAsg(asg);
    setSummaryText('');
    setSummaryError(null);
    setOpenSummaryDialog(true);
    setSummarizing(true);

    try {
      // Simulate local summary analysis
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSummaryText(`### 📚 Lecture Summary: ${asg.title}

Here is a summary of the uploaded study material for **${asg.courseName}**:

- **Key Objective**: Understand the core design principles and execution rules of the ${asg.title} model.
- **Section 1 - Foundations**: Focuses on core specifications, architectural layers, and performance considerations.
- **Section 2 - Implementation**: Outlines how variables are managed and how schemas are verified dynamically.
- **Section 3 - Critical Insights**:
  - Review all relevant formulas and instructions in detail.
  - Complete the required tasks before the due date.
  
*Note: In local sandbox mode, summaries are simulated locally using mock models.*`);
    } catch (err: any) {
      console.error(err);
      setSummaryError(err.message || 'Failed to fetch note summary.');
    } finally {
      setSummarizing(false);
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
          My Assignments & Resources
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review assignments, download course readings, and study your course materials.
        </Typography>
      </Box>

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
            const hasFile = !!asg.attachment;

            return (
              <Grid item xs={12} key={asg._id || asg.id}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                      <Box>
                        <Chip
                          size="small"
                          label={asg.courseName}
                          color="primary"
                          sx={{ mb: 1, fontWeight: 'bold' }}
                        />
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {asg.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Due Date: <strong>{new Date(asg.dueDate).toLocaleDateString()}</strong>
                        </Typography>
                        {asg.faculty && (
                          <Typography variant="caption" color="text.secondary">
                            Posted by: <strong>{asg.faculty.name || 'Professor'}</strong>
                          </Typography>
                        )}
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
                            onClick={() => downloadAttachment(asg.attachment, asg.attachmentName)}
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
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

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
                Analyzing document and extracting notes...
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
