import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const AdminFacultyAssignment: React.FC = () => {
  const toast = useToast();
  
  // Data lists
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  
  // Assignment Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [assignedDept, setAssignedDept] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [deptSubjects, setDeptSubjects] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all departments and faculty
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get departments
      const deptRes = await fetch(`${API_URL}/departments`, { headers: getHeaders() });
      const deptData = await deptRes.json();
      if (deptRes.ok) {
        setDepartments(deptData);
      } else {
        toast.error('Failed to load departments.');
      }

      // 2. Get faculty list
      const facRes = await fetch(`${API_URL}/auth/admin/faculty`, { headers: getHeaders() });
      const facData = await facRes.json();
      if (facRes.ok) {
        setFaculties(facData);
      } else {
        toast.error('Failed to load faculty members.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Connection error loading assignment dashboard.');
    } finally {
      setLoading(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (facultyId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/admin/faculty/${facultyId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Faculty status updated successfully.`);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to update status.');
      }
    } catch (err: any) {
      toast.error('Error updating status.');
    }
  };

  // Open Edit Assignment Dialog
  const handleOpenAssignDialog = (faculty: any) => {
    setEditingFaculty(faculty);
    setAssignedDept(faculty.department || '');
    setAssignedSubjects(faculty.assignedSubjects || []);
    
    // Find department subjects
    const dept = departments.find((d) => d.departmentName === faculty.department);
    setDeptSubjects(dept ? dept.subjects : []);
    
    setOpenDialog(true);
  };

  // Handle department change in dialog
  const handleDeptChangeInDialog = (deptName: string) => {
    setAssignedDept(deptName);
    const dept = departments.find((d) => d.departmentName === deptName);
    setDeptSubjects(dept ? dept.subjects : []);
    setAssignedSubjects([]); // Reset subject selections
  };

  // Handle subject checkbox toggles
  const handleSubjectToggle = (subjName: string) => {
    setAssignedSubjects((prev) =>
      prev.includes(subjName) ? prev.filter((s) => s !== subjName) : [...prev, subjName]
    );
  };

  // Save Assignment Changes
  const handleSaveAssignment = async () => {
    if (!editingFaculty) return;
    
    try {
      const res = await fetch(`${API_URL}/auth/admin/faculty/${editingFaculty._id}/assign`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          department: assignedDept,
          assignedSubjects,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Faculty department and subjects updated.');
        setOpenDialog(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to save assignment.');
      }
    } catch (err) {
      toast.error('Error saving assignments.');
    }
  };

  // Filter faculties list
  const filteredFaculties = faculties.filter((f) => {
    if (selectedDeptFilter === 'All') return true;
    return f.department === selectedDeptFilter;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text-green" sx={{ fontWeight: 800 }}>
            Faculty & Subjects Assignment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage HOD/Faculty statuses, assign permanent departments, and allocate subjects.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="dept-filter-label">Filter by Department</InputLabel>
          <Select
            labelId="dept-filter-label"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            label="Filter by Department"
          >
            <MenuItem value="All">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d._id} value={d.departmentName}>
                {d.departmentName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ background: 'transparent' }} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Assigned Subjects</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFaculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      No faculty members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFaculties.map((fac) => (
                    <TableRow key={fac._id} sx={{ '&:hover': { background: 'rgba(255, 255, 255, 0.02)' } }}>
                      <TableCell sx={{ fontWeight: 500 }}>{fac.name}</TableCell>
                      <TableCell color="text.secondary">{fac.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={fac.department || 'Not Assigned'}
                          color={fac.department ? 'success' : 'default'}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {fac.assignedSubjects && fac.assignedSubjects.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {fac.assignedSubjects.map((sub: string) => (
                              <Chip key={sub} label={sub} size="small" variant="filled" sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }} />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">None Assigned</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fac.status.toUpperCase()}
                          color={
                            fac.status === 'active' || fac.status === 'approved'
                              ? 'success'
                              : fac.status === 'pending'
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenAssignDialog(fac)}
                          >
                            Assign
                          </Button>
                          
                          {fac.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleUpdateStatus(fac._id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => handleUpdateStatus(fac._id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {(fac.status === 'active' || fac.status === 'approved') && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<BlockIcon />}
                              onClick={() => handleUpdateStatus(fac._id, 'suspended')}
                            >
                              Suspend
                            </Button>
                          )}

                          {fac.status === 'suspended' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateStatus(fac._id, 'active')}
                            >
                              Activate
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Assignment Setup Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: '#111827',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Manage Assignments: {editingFaculty?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="dialog-dept-label">Faculty Department</InputLabel>
                <Select
                  labelId="dialog-dept-label"
                  value={assignedDept}
                  onChange={(e) => handleDeptChangeInDialog(e.target.value)}
                  label="Faculty Department"
                >
                  <MenuItem value="">-- Select Department --</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d.departmentName}>
                      {d.departmentName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Select Assigned Subjects
              </Typography>
              {deptSubjects.length === 0 ? (
                <Box sx={{ p: 2, border: '1px dashed rgba(255, 255, 255, 0.1)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {assignedDept ? 'No subjects found in this department.' : 'Please select a department first.'}
                  </Typography>
                </Box>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxHeight: 200,
                    overflowY: 'auto',
                    bgcolor: 'rgba(255, 255, 255, 0.01)',
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <Grid container spacing={1}>
                    {deptSubjects.map((sub) => (
                      <Grid item xs={12} sm={6} key={sub.subjectCode}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={assignedSubjects.includes(sub.subjectName)}
                              onChange={() => handleSubjectToggle(sub.subjectName)}
                              color="success"
                              size="small"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{sub.subjectName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {sub.subjectCode}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveAssignment} variant="contained" color="success">
            Save Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
