import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';

import {
  getPendingExams,
  approveExam,
  rejectExam,
} from '../services/examService';
import { useToast } from '../context/ToastContext';

export const AdminExams: React.FC = () => {
  const toast = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Approve / Reject Dialogs State
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingExams();
      setExams(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to retrieve pending exams.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (examId: string, type: 'approve' | 'reject') => {
    setSelectedExamId(examId);
    setActionType(type);
    setComment(type === 'approve' ? 'Approved by administrator' : '');
    setOpenDialog(true);
  };

  const handleActionSubmit = async () => {
    if (!selectedExamId) return;
    if (actionType === 'reject' && !comment.trim()) {
      toast.warning('Rejection comments are required to reject an exam.');
      return;
    }

    try {
      if (actionType === 'approve') {
        await approveExam(selectedExamId, comment);
        toast.success('Exam paper approved successfully.');
      } else {
        await rejectExam(selectedExamId, comment);
        toast.success('Exam paper rejected.');
      }
      setOpenDialog(false);
      fetchPending();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed.');
    }
  };

  if (loading && exams.length === 0) {
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
          Pending Exam Approvals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and approve submitted faculty multiple-choice question papers.
        </Typography>
      </Box>

      {exams.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Pending Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All submitted faculty exam papers have been reviewed.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {exams.map((exam) => (
            <Grid item xs={12} sm={6} md={4} key={exam._id}>
              <Card sx={{ height: '100%', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.light', textTransform: 'uppercase', mb: 1, display: 'block' }}>
                    {exam.courseName}
                  </Typography>

                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
                    {exam.title}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Duration: <b>{exam.duration} Minutes</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Marks: <b>{exam.totalMarks}</b>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Submitted By: <b>{exam.createdBy?.name || 'Faculty Member'}</b>
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2, opacity: 0.05 }} />

                  <Box sx={{ mt: 'auto', display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleOpenAction(exam._id, 'approve')}
                      sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={() => handleOpenAction(exam._id, 'reject')}
                      sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    >
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* APPROVAL / REJECTION ACTION DIALOG */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {actionType === 'approve' ? 'Approve Exam Paper' : 'Reject Exam Paper'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 320 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label={actionType === 'approve' ? 'Comments/Notes (Optional)' : 'Rejection Feedback (Required)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required={actionType === 'reject'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleActionSubmit}
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
          >
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminExams;
