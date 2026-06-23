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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import PublishIcon from '@mui/icons-material/Publish';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedIcon from '@mui/icons-material/Verified';

import {
  getDepartmentSummaries,
  getDepartmentDetails,
  verifyDepartment,
  declareDepartment,
  DepartmentSummary,
  ResultResponse,
} from '../services/resultService';
import { useToast } from '../context/ToastContext';

export const AdminResults: React.FC = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<DepartmentSummary[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<DepartmentSummary | null>(null);
  const [details, setDetails] = useState<ResultResponse[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentSummaries();
      setSummaries(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load department result summaries.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDepartment = async (sum: DepartmentSummary) => {
    const key = `${sum.department}-${sum.semester}-${sum.academicYear}-verify`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await verifyDepartment({
        department: sum.department,
        semester: sum.semester,
        academicYear: sum.academicYear,
      });
      toast.success(res.message || 'Department results verified successfully.');
      await fetchSummaries();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to verify department results.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeclareDepartment = async (sum: DepartmentSummary) => {
    const key = `${sum.department}-${sum.semester}-${sum.academicYear}-declare`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await declareDepartment({
        department: sum.department,
        semester: sum.semester,
        academicYear: sum.academicYear,
      });
      toast.success(res.message || 'Department results declared successfully.');
      await fetchSummaries();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to declare department results.');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleViewDetails = async (sum: DepartmentSummary) => {
    setSelectedGroup(sum);
    setDetailsLoading(true);
    try {
      const data = await getDepartmentDetails(sum.department, sum.semester, sum.academicYear);
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load student result sheets.');
      setSelectedGroup(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'declared':
        return <Chip label="DECLARED" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'verified':
        return <Chip label="VERIFIED" color="secondary" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'submitted':
        return <Chip label="SUBMITTED" color="info" size="small" sx={{ fontWeight: 'bold' }} />;
      case 'draft':
      default:
        return <Chip label="DRAFT" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />;
    }
  };

  if (loading && summaries.length === 0) {
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
          Department Result Verification
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review, verify, and declare semester-end academic results in bulk at the department/branch level.
        </Typography>
      </Box>

      {/* Summaries list */}
      {summaries.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Results Awaiting Review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            There are no active result drafts or submissions at this time.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {summaries.map((sum, index) => {
            const verifyKey = `${sum.department}-${sum.semester}-${sum.academicYear}-verify`;
            const declareKey = `${sum.department}-${sum.semester}-${sum.academicYear}-declare`;
            
            const isVerifying = actionLoading[verifyKey] || false;
            const isDeclaring = actionLoading[declareKey] || false;

            return (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 4, border: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(30, 41, 59, 0.15)' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    {/* Header */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.light' }}>
                        {sum.department}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CalendarTodayIcon fontSize="inherit" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          Semester: <b>{sum.semester}</b> | Year: <b>{sum.academicYear}</b>
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2, opacity: 0.05 }} />

                    {/* Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">TOTAL STUDENTS</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{sum.totalStudents}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">SUBMITTED</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'info.main' }}>{sum.submittedCount}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">VERIFIED</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>{sum.verifiedCount}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary" display="block">DECLARED</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>{sum.declaredCount}</Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 2, opacity: 0.05 }} />

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(sum)}
                        sx={{ borderRadius: 2 }}
                      >
                        View Results
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        startIcon={isVerifying ? <CircularProgress size={16} /> : <VerifiedIcon />}
                        disabled={sum.submittedCount === 0 || isVerifying}
                        onClick={() => handleVerifyDepartment(sum)}
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Verify Department
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={isDeclaring ? <CircularProgress size={16} /> : <PublishIcon />}
                        disabled={sum.verifiedCount === 0 || isDeclaring}
                        onClick={() => handleDeclareDepartment(sum)}
                        sx={{ borderRadius: 2, fontWeight: 'bold' }}
                      >
                        Declare Results
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Details Dialog */}
      <Dialog
        open={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3.5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
        }}
      >
        {selectedGroup && (
          <>
            <DialogTitle sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {selectedGroup.department} Results
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Semester: <b>{selectedGroup.semester}</b> | Year: <b>{selectedGroup.academicYear}</b>
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              {detailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              ) : details.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No result records found in this group.
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Roll No</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Max Marks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Obtained Marks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Percentage</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>CGPA</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Outcome</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {details.map((result) => (
                        <TableRow key={result._id}>
                          <TableCell>{result.rollNumber || 'N/A'}</TableCell>
                          <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon fontSize="inherit" color="action" />
                            <Typography variant="body2">{result.studentName}</Typography>
                          </TableCell>
                          <TableCell align="center">{result.totalMarks}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>{result.obtainedMarks}</TableCell>
                          <TableCell align="center">{result.percentage}%</TableCell>
                          <TableCell align="center" sx={{ color: 'primary.light', fontWeight: 'bold' }}>{result.cgpa}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>{result.overallGrade}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={result.overallResult.toUpperCase()}
                              size="small"
                              color={result.overallResult === 'Pass' ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold' }}
                            />
                          </TableCell>
                          <TableCell align="center">{getStatusChip(result.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Button onClick={() => setSelectedGroup(null)} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminResults;
