import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { getFacultyReports, publishReport, deleteReport, Report } from '../services/reportService';
import { useToast } from '../context/ToastContext';

const MONTHS = [
  'All',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const FacultyReportDashboard: React.FC = () => {

  const navigate = useNavigate();
  const toast = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getFacultyReports();
      setReports(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load report cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePublish = async (id: string) => {
    if (!window.confirm('Are you sure you want to publish this report? Once published, it will be visible to the student.')) return;
    try {
      await publishReport(id);
      toast.success('Report published successfully!');
      fetchReports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to publish report.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report card? This cannot be undone.')) return;
    try {
      await deleteReport(id);
      toast.success('Report deleted successfully.');
      fetchReports();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete report.');
    }
  };

  // Extract unique years from reports
  const years = ['All', ...Array.from(new Set(reports.map((r) => r.year.toString())))].sort();

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMonth = selectedMonth === 'All' || report.month === selectedMonth;
    const matchesYear = selectedYear === 'All' || report.year.toString() === selectedYear;
    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Report Card Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Draft, edit, and publish monthly academic and behavioral progress reports for students.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/reports/create')}
          sx={{ boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
        >
          Create ReportCard
        </Button>
      </Box>

      {/* Filter and Search Section */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student or course..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="filter-month-label">Month</InputLabel>
            <Select
              labelId="filter-month-label"
              value={selectedMonth}
              label="Month"
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {MONTHS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="filter-year-label">Year</InputLabel>
            <Select
              labelId="filter-year-label"
              value={selectedYear}
              label="Year"
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Reports List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredReports.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)', bgcolor: '#111827' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <AssessmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No report cards found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredReports.map((report) => {
            const isDraft = report.status === 'draft';
            return (
              <Grid item xs={12} md={6} lg={4} key={report._id}>
                <Card
                  sx={{
                    bgcolor: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, border-color 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      borderColor: 'primary.light',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {report.month} {report.year}
                      </Typography>
                      <Chip
                        icon={isDraft ? <LockOpenIcon sx={{ fontSize: '0.85rem !important' }} /> : <LockIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label={report.status}
                        size="small"
                        color={isDraft ? 'warning' : 'success'}
                        sx={{ textTransform: 'capitalize', fontWeight: 'bold' }}
                      />
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                      {report.studentName}
                    </Typography>
                    <Typography variant="body2" color="primary.light" sx={{ fontWeight: 600, mb: 2 }}>
                      {report.courseName}
                    </Typography>

                    <Grid container spacing={1} sx={{ mb: 2.5 }}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Attendance
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {report.attendancePercentage}%
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Grade
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'secondary.light' }}>
                            {report.performanceGrade}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: 40,
                    }}>
                      Remarks: "{report.remarks}"
                    </Typography>
                  </CardContent>

                  <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    {isDraft ? (
                      <>
                        <Tooltip title="Edit Report Card">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/reports/edit/${report._id}`)}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Publish Report (Lock)">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePublish(report._id)}
                          >
                            <PublishIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title="Published & Locked">
                        <IconButton size="small" disabled sx={{ color: 'success.main' }}>
                          <LockIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Delete Report Card">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(report._id)}
                      >
                        <DeleteIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default FacultyReportDashboard;
