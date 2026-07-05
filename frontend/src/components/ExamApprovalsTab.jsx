import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, List, ListItem, ListItemText,
  CircularProgress
} from '@mui/material';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ExamApprovalsTab() {
  const [pendingExams, setPendingExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [openExamQuestionsDialog, setOpenExamQuestionsDialog] = useState(false);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams/pending');
      setPendingExams(res.data);
    } catch (err) {
      showToast('Failed to load pending exams.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewExam = async (examId, approve) => {
    try {
      await api.post(`/exams/${examId}/review`, { approve });
      showToast(`Exam ${approve ? 'approved' : 'rejected and returned to draft'}.`, 'success');
      loadData();
    } catch (err) {
      showToast('Failed to review exam.', 'error');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Pending Exam Approvals</Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : pendingExams.length === 0 ? (
        <Typography color="text.secondary">No exams are pending approval right now.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell align="center">Questions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingExams.map((e) => (
                <TableRow key={e._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{e.title}</TableCell>
                  <TableCell>{e.subjectId?.name || 'N/A'}</TableCell>
                  <TableCell>{e.departmentId?.name || 'N/A'}</TableCell>
                  <TableCell>{e.year} - {e.semester}</TableCell>
                  <TableCell>{e.duration} mins</TableCell>
                  <TableCell>{e.facultyId?.name || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedExam(e);
                        setOpenExamQuestionsDialog(true);
                      }}
                    >
                      View ({e.questions?.length || 0})
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleReviewExam(e._id, true)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleReviewExam(e._id, false)}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* EXAM QUESTIONS VIEW DIALOG */}
      <Dialog open={openExamQuestionsDialog} onClose={() => setOpenExamQuestionsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Questions: {selectedExam?.title}</DialogTitle>
        <DialogContent dividers>
          {selectedExam?.questions?.length === 0 ? (
            <Typography>No questions found in this exam.</Typography>
          ) : (
            <List>
              {selectedExam?.questions?.map((q, i) => (
                <ListItem key={i} divider alignItems="flex-start">
                  <ListItemText
                    primary={<Typography fontWeight="bold">Q{i + 1}: {q.questionText}</Typography>}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {q.options.map((opt, oIdx) => (
                          <Typography
                            key={oIdx}
                            variant="body2"
                            color={opt === q.correctAnswer ? 'success.main' : 'text.secondary'}
                            sx={{ fontWeight: opt === q.correctAnswer ? 'bold' : 'normal' }}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt}
                            {opt === q.correctAnswer && ' (Correct Answer)'}
                          </Typography>
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExamQuestionsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
