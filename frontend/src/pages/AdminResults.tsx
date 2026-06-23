import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonIcon from '@mui/icons-material/Person';
import PublishIcon from '@mui/icons-material/Publish';

import {
  getPendingResults,
  approveSubject,
  rejectSubject,
  declareResult,
  ResultResponse,
} from '../services/resultService';
import { useToast } from '../context/ToastContext';

export const AdminResults: React.FC = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultResponse[]>([]);

  // Remarks state mapped as record[resultId-subjectIndex]: string
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingResults();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load pending result reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSub = async (resultId: string, subIdx: number) => {
    const key = `${resultId}-${subIdx}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await approveSubject(resultId, subIdx);
      toast.success('Subject approved.');
      
      // Local updates instead of full refetch to keep scroll / open accordion state
      await refreshSingleResult(resultId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to approve subject.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRejectSub = async (resultId: string, subIdx: number) => {
    const key = `${resultId}-${subIdx}`;
    const remark = remarks[key] || '';
    if (!remark.trim()) {
      toast.warning('Please enter a remark explaining the rejection.');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await rejectSubject(resultId, subIdx, remark);
      toast.success('Subject rejected with remark.');
      
      // Clear remark
      setRemarks((prev) => ({ ...prev, [key]: '' }));
      await refreshSingleResult(resultId);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to reject subject.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeclare = async (resultId: string) => {
    setActionLoading((prev) => ({ ...prev, [resultId]: true }));
    try {
      await declareResult(resultId);
      toast.success('Result sheet declared and published online.');
      fetchPending(); // Refresh list
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to declare result.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [resultId]: false }));
    }
  };

  const refreshSingleResult = async (_resultId: string) => {
    // Re-fetch pending to get fresh sync
    try {
      const data = await getPendingResults();
      setResults(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const getOverallStatusChip = (status: string) => {
    switch (status) {
      case 'ready_for_declaration':
        return <Chip label="READY FOR DECLARATION" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'verification_pending':
        return <Chip label="VERIFICATION PENDING" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'submitted':
        return <Chip label="SUBMITTED" color="info" size="small" sx={{ fontWeight: 'bold' }} />;
      default:
        return <Chip label={status.toUpperCase()} size="small" />;
    }
  };

  const getSubjectStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
      case 'pending':
      default:
        return <Chip icon={<HourglassEmptyIcon />} label="Pending" color="warning" size="small" variant="outlined" sx={{ fontWeight: 'bold' }} />;
    }
  };

  if (loading && results.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          Result Verification Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review student marks subject-by-subject and declare finalized report cards.
        </Typography>
      </Box>

      {/* List */}
      {results.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Results Awaiting Review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            All submitted student results have been verified, approved, and declared.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {results.map((result) => {
            const approvedCount = result.subjects.filter((s) => s.approvalStatus === 'approved').length;
            const allApproved = approvedCount === result.subjects.length;
            const isDeclaring = actionLoading[result._id] || false;

            return (
              <Grid item xs={12} key={result._id}>
                <Card sx={{ borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(30, 41, 59, 0.15)' }}>
                  <CardContent sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PersonIcon color="primary" fontSize="small" />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {result.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Roll: {result.rollNumber || 'N/A'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Course: <b>{result.courseName}</b> | Semester: <b>{result.semester}</b> | Year: <b>{result.academicYear}</b>
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Prepared By: <b>{result.facultyName || 'Faculty'}</b>
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
                        {getOverallStatusChip(result.status)}
                        <Typography variant="caption" color="text.secondary">
                          Approved Subjects: <b>{approvedCount} / {result.subjects.length}</b>
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2, opacity: 0.05 }} />

                    {/* Marks Table with Actions */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                      Subject Verification Sheet
                    </Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
                      <Table>
                        <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Max Marks</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Obtained</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} width={240}>Remark</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }} width={200}>Verify Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.subjects.map((sub, sIdx) => {
                            const key = `${result._id}-${sIdx}`;
                            const isSubLoading = actionLoading[key] || false;
                            
                            return (
                              <TableRow key={sIdx}>
                                <TableCell>{sub.subjectCode}</TableCell>
                                <TableCell>{sub.subjectName}</TableCell>
                                <TableCell>{sub.maxMarks}</TableCell>
                                <TableCell>{sub.obtainedMarks}</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>{sub.grade}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={sub.status}
                                    size="small"
                                    color={sub.status === 'Pass' ? 'success' : 'error'}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 'bold' }}
                                  />
                                </TableCell>
                                <TableCell>{getSubjectStatusChip(sub.approvalStatus || 'pending')}</TableCell>
                                <TableCell>
                                  {sub.approvalStatus === 'pending' ? (
                                    <TextField
                                      size="small"
                                      placeholder="Remarks on reject"
                                      value={remarks[key] || ''}
                                      onChange={(e) => setRemarks({ ...remarks, [key]: e.target.value })}
                                      disabled={isSubLoading}
                                    />
                                  ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                      {sub.adminRemark || '-'}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {sub.approvalStatus === 'pending' ? (
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                      <IconButton
                                        color="success"
                                        onClick={() => handleApproveSub(result._id, sIdx)}
                                        disabled={isSubLoading}
                                      >
                                        <CheckCircleIcon />
                                      </IconButton>
                                      <IconButton
                                        color="error"
                                        onClick={() => handleRejectSub(result._id, sIdx)}
                                        disabled={isSubLoading}
                                      >
                                        <CancelIcon />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">
                                      Finalized
                                    </Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Extra Parameters Display */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CalendarTodayIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Attendance: <b>{result.attendancePercentage ?? 'N/A'}%</b>
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Internals Total: <b>{result.internalMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Practicals Total: <b>{result.practicalMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Theory Total: <b>{result.theoryMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Declare Button section */}
                    {allApproved && (
                      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="large"
                          startIcon={isDeclaring ? <CircularProgress size={20} /> : <PublishIcon />}
                          onClick={() => handleDeclare(result._id)}
                          disabled={isDeclaring}
                          sx={{ fontWeight: 'bold', px: 4, borderRadius: 2.5 }}
                        >
                          Declare & Publish Results
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default AdminResults;
