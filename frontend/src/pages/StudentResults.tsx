import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
  Button,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import InfoIcon from '@mui/icons-material/Info';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getStudentResults, ResultResponse } from '../services/resultService';
import { useToast } from '../context/ToastContext';

export const StudentResults: React.FC = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ResultResponse[]>([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getStudentResults();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load your results sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Academic Performance Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View your declared semester-wise consolidated marksheets.
          </Typography>
        </Box>
        {results.length > 0 && (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{ fontWeight: 'bold', borderRadius: 2 }}
          >
            Download Marksheet PDF
          </Button>
        )}
      </Box>

      {/* Main List */}
      {results.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
          <InfoIcon color="action" sx={{ fontSize: 48, mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
            No Declared Results Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Results will appear here as soon as they are approved and declared by the administration.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {results.map((result) => (
            <Card
              key={result._id}
              className="print-section"
              sx={{
                borderRadius: 4,
                border: '2px solid rgba(255, 255, 255, 0.08)',
                bgcolor: 'rgba(30, 41, 59, 0.1)',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              {/* College Heading */}
              <Box
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.03)',
                  p: 3,
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <SchoolIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 1.5 }}>
                  EDUTECH HUB UNIVERSITY
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', tracking: 1, fontWeight: 'bold' }}>
                  Official Statement of Marks
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                {/* Student Metadata */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Typography variant="caption" color="text.secondary" display="block">STUDENT NAME</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.studentName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Typography variant="caption" color="text.secondary" display="block">ROLL NUMBER</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.rollNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Typography variant="caption" color="text.secondary" display="block">DEPARTMENT</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.department || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Typography variant="caption" color="text.secondary" display="block">COURSE</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.courseName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Typography variant="caption" color="text.secondary" display="block">SEMESTER & YEAR</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {result.semester} ({result.academicYear})
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ mb: 4, opacity: 0.05 }} />

                {/* Marks Table */}
                <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid rgba(255, 255, 255, 0.05)', mb: 4 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Subject Code</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Subject Name</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Max Marks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Obtained Marks</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.subjects.map((sub, sIdx) => (
                        <TableRow key={sIdx} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell sx={{ fontWeight: 500 }}>{sub.subjectCode}</TableCell>
                          <TableCell>{sub.subjectName}</TableCell>
                          <TableCell align="center">{sub.maxMarks}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold' }}>{sub.obtainedMarks}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={sub.grade}
                              size="small"
                              color={sub.grade === 'F' ? 'error' : 'primary'}
                              sx={{ fontWeight: 'bold', minWidth: 32 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Totals & Grades Block */}
                <Box sx={{ p: 3, bgcolor: 'rgba(255, 255, 255, 0.01)', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.04)', mb: 4 }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">TOTAL MAX MARKS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.totalMarks}</Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">OBTAINED MARKS</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.obtainedMarks}</Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">PERCENTAGE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{result.percentage}%</Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">CGPA</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'primary.light' }}>{result.cgpa}</Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">OVERALL GRADE</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: result.overallGrade === 'F' ? 'error.light' : 'success.light' }}>
                            {result.overallGrade}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                          <Typography variant="caption" color="text.secondary" display="block">RESULT OUTCOME</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: result.overallResult === 'Pass' ? 'success.light' : 'error.light' }}>
                            {result.overallResult.toUpperCase()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    {/* Big Result Badge */}
                    <Grid item xs={12} sm={4} sx={{ textAlign: 'center', borderLeft: { sm: '1px solid rgba(255, 255, 255, 0.05)' } }}>
                      {result.overallResult === 'Pass' ? (
                        <Box sx={{ color: 'success.main', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <CheckCircleIcon sx={{ fontSize: 56, mb: 1 }} />
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>PASS</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ color: 'error.main', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <CancelIcon sx={{ fontSize: 56, mb: 1 }} />
                          <Typography variant="h5" sx={{ fontWeight: 900 }}>FAIL</Typography>
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Box>

                {/* Additional Metrics block */}
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Additional Academic Metrics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ p: 2, border: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                      <Typography variant="caption" color="text.secondary">Attendance %</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{result.attendancePercentage ?? 'N/A'}%</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ p: 2, border: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                      <Typography variant="caption" color="text.secondary">Internal Marks</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{result.internalMarksTotal ?? 'N/A'}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ p: 2, border: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                      <Typography variant="caption" color="text.secondary">Practicals Total</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{result.practicalMarksTotal ?? 'N/A'}</Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ p: 2, border: '1px solid rgba(255,255,255,0.03)', bgcolor: 'rgba(255,255,255,0.01)' }}>
                      <Typography variant="caption" color="text.secondary">Theory Total</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{result.theoryMarksTotal ?? 'N/A'}</Typography>
                    </Card>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 3, opacity: 0.05 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Declared Date: <b>{result.declaredAt ? new Date(result.declaredAt).toLocaleDateString() : 'N/A'}</b>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    * This is an official computer-generated statement of marks.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default StudentResults;
