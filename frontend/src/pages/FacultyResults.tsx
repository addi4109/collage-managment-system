import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { getFacultyResults, submitResult, ResultResponse } from '../services/resultService';
import { useToast } from '../context/ToastContext';

export const FacultyResults: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultResponse[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [submitLoading, setSubmitLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getFacultyResults();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to retrieve results.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async (id: string) => {
    setSubmitLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await submitResult(id);
      toast.success('Result sheet submitted successfully.');
      fetchResults();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit result.');
    } finally {
      setSubmitLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const getOverallStatusChip = (status: string) => {
    switch (status) {
      case 'declared':
        return <Chip label="DECLARED" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'ready_for_declaration':
        return <Chip label="READY FOR DECLARATION" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'verification_pending':
        return <Chip label="VERIFICATION PENDING" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'submitted':
        return <Chip label="SUBMITTED" color="info" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'draft':
      default:
        return <Chip label="DRAFT" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />;
    }
  };

  const getSubjectStatusChip = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Chip
            icon={<CheckCircleIcon />}
            label="Approved"
            color="success"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Rejected"
            color="error"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        );
      case 'pending':
      default:
        return (
          <Chip
            icon={<HourglassEmptyIcon />}
            label="Pending"
            color="warning"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        );
    }
  };

  // Filter tabs
  const tabFilters = [
    { label: 'All Results', filter: () => true },
    { label: 'Drafts', filter: (r: ResultResponse) => r.status === 'draft' },
    { label: 'Submitted', filter: (r: ResultResponse) => r.status === 'submitted' },
    { label: 'Verification Pending', filter: (r: ResultResponse) => r.status === 'verification_pending' },
    { label: 'Declared', filter: (r: ResultResponse) => r.status === 'declared' },
  ];

  const filteredResults = results.filter(tabFilters[activeTab].filter);

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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Results Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Draft, submit, and correct student examination results.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/results/create')}
          sx={{ fontWeight: 'bold', borderRadius: 2 }}
        >
          Prepare New Result
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, nv) => setActiveTab(nv)} variant="scrollable" scrollButtons="auto">
          {tabFilters.map((tf, i) => (
            <Tab key={i} label={tf.label} sx={{ fontWeight: 'bold' }} />
          ))}
        </Tabs>
      </Box>

      {/* Results Accordions */}
      {filteredResults.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary">
            No Result Records Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Prepare a new result template or select another status filter above.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredResults.map((result) => {
            const isSubmitting = submitLoading[result._id] || false;
            const approvedCount = result.subjects.filter((s) => s.approvalStatus === 'approved').length;

            return (
              <Accordion
                key={result._id}
                sx={{
                  borderRadius: '12px !important',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  bgcolor: 'rgba(30, 41, 59, 0.15)',
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <Typography sx={{ fontWeight: 'bold' }}>{result.studentName}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Roll: {result.rollNumber || 'N/A'} | Course: {result.courseName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Semester: {result.semester}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Year: {result.academicYear}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Score: {result.obtainedMarks}/{result.totalMarks} ({result.percentage}%)
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Verification: {approvedCount}/{result.subjects.length} Approved
                      </Typography>
                    </Grid>
                     <Grid item xs={12} sm={2} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                       {getOverallStatusChip(result.status)}
                     </Grid>
                  </Grid>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 4, bgcolor: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  {/* Detailed marks table */}
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Subject-Wise Marks & Verification Status
                  </Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.05)', mb: 3 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Max Marks</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Obtained</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Verification</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>Admin Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.subjects.map((sub, sIdx) => (
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
                            <TableCell sx={{ color: sub.approvalStatus === 'rejected' ? 'error.light' : 'text.secondary', fontStyle: 'italic' }}>
                              {sub.adminRemark || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Internals: <b>{result.internalMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Practicals: <b>{result.practicalMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Theory: <b>{result.theoryMarksTotal ?? 'N/A'}</b>
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2, opacity: 0.05 }} />

                  {/* Actions inside accordion */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {['draft', 'verification_pending', 'submitted'].includes(result.status) && (
                      <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/results/edit/${result._id}`)}
                      >
                        Edit / Correct Marks
                      </Button>
                    )}
                    {['draft', 'verification_pending'].includes(result.status) && (
                      <Button
                        variant="contained"
                        color="secondary"
                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
                        onClick={() => handleSubmitResult(result._id)}
                        disabled={isSubmitting}
                      >
                        Submit Approval Request
                      </Button>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FacultyResults;
