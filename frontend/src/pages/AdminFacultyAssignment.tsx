import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem, Checkbox, FormControlLabel,
  CircularProgress, Chip, TextField, IconButton, InputAdornment, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useToast } from '../context/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'https://collage-managment-system.onrender.com/api';

const getHeaders = () => {
  const token = localStorage.getItem('eh_token') || sessionStorage.getItem('eh_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const YEARS = ['First Year', 'Second Year', 'Third Year'];

const emptyFacultyForm = {
  name: '', username: '', email: '', password: '', phone: '',
  employeeId: '', department: '', assignedYear: '', assignedSubjects: [] as string[],
};

export const AdminFacultyAssignment: React.FC = () => {
  const toast = useToast();

  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Create/Edit Faculty dialog
  const [openFacultyDialog, setOpenFacultyDialog] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [facultyForm, setFacultyForm] = useState({ ...emptyFacultyForm });
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Subject Assignment dialog
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [assigningFaculty, setAssigningFaculty] = useState<any | null>(null);
  const [assignedDept, setAssignedDept] = useState('');
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);
  const [deptSubjects, setDeptSubjects] = useState<any[]>([]);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, facRes] = await Promise.all([
        fetch(`${API_URL}/departments`, { headers: getHeaders() }),
        fetch(`${API_URL}/auth/admin/faculty`, { headers: getHeaders() }),
      ]);
      const deptData = await deptRes.json();
      const facData = await facRes.json();
      if (deptRes.ok) setDepartments(deptData);
      if (facRes.ok) setFaculties(facData);
    } catch {
      toast.error('Connection error loading data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Create / Edit Faculty ─────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingFaculty(null);
    setFacultyForm({ ...emptyFacultyForm });
    setShowPassword(false);
    setOpenFacultyDialog(true);
  };

  const handleOpenEdit = (fac: any) => {
    setEditingFaculty(fac);
    setFacultyForm({
      name: fac.name || '',
      username: fac.username || '',
      email: fac.email || '',
      password: '',
      phone: fac.phone || '',
      employeeId: fac.employeeId || '',
      department: fac.department || '',
      assignedYear: fac.assignedYear || '',
      assignedSubjects: fac.assignedSubjects || [],
    });
    setShowPassword(false);
    setOpenFacultyDialog(true);
  };

  const handleSaveFaculty = async () => {
    if (!facultyForm.name || !facultyForm.username || !facultyForm.department) {
      toast.warning('Name, username, and department are required.');
      return;
    }
    if (!editingFaculty && !facultyForm.password) {
      toast.warning('Password is required when creating a new faculty account.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...facultyForm };
      if (!payload.password) delete payload.password;

      let res;
      if (editingFaculty) {
        res = await fetch(`${API_URL}/auth/admin/faculty/${editingFaculty._id}`, {
          method: 'PUT', headers: getHeaders(), body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/auth/admin/faculty`, {
          method: 'POST', headers: getHeaders(), body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (res.ok) {
        toast.success(editingFaculty ? 'Faculty account updated.' : 'Faculty account created.');
        setOpenFacultyDialog(false);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to save faculty.');
      }
    } catch {
      toast.error('Connection error saving faculty.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Faculty ────────────────────────────────────────────────────────
  const handleDeleteFaculty = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin/faculty/${deleteTarget._id}`, {
        method: 'DELETE', headers: getHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Faculty account deleted.');
        setDeleteTarget(null);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to delete.');
      }
    } catch {
      toast.error('Connection error deleting faculty.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Status Update ─────────────────────────────────────────────────────────
  const handleUpdateStatus = async (facultyId: string, status: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/admin/faculty/${facultyId}/status`, {
        method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Status updated.'); fetchData(); }
      else toast.error(data.message || 'Failed to update status.');
    } catch {
      toast.error('Error updating status.');
    }
  };

  // ── Subject Assignment ────────────────────────────────────────────────────
  const handleOpenAssignDialog = (fac: any) => {
    setAssigningFaculty(fac);
    setAssignedDept(fac.department || '');
    setAssignedSubjects(fac.assignedSubjects || []);
    const dept = departments.find((d) => d.departmentName === fac.department);
    setDeptSubjects(dept ? dept.subjects : []);
    setOpenAssignDialog(true);
  };

  const handleDeptChangeInDialog = (deptName: string) => {
    setAssignedDept(deptName);
    const dept = departments.find((d) => d.departmentName === deptName);
    setDeptSubjects(dept ? dept.subjects : []);
    setAssignedSubjects([]);
  };

  const handleSubjectToggle = (subjName: string) => {
    setAssignedSubjects((prev) =>
      prev.includes(subjName) ? prev.filter((s) => s !== subjName) : [...prev, subjName]
    );
  };

  const handleSaveAssignment = async () => {
    if (!assigningFaculty) return;
    try {
      const res = await fetch(`${API_URL}/auth/admin/faculty/${assigningFaculty._id}/assign`, {
        method: 'PUT', headers: getHeaders(),
        body: JSON.stringify({ department: assignedDept, assignedSubjects }),
      });
      const data = await res.json();
      if (res.ok) { toast.success('Faculty assignments updated.'); setOpenAssignDialog(false); fetchData(); }
      else toast.error(data.message || 'Failed to save assignment.');
    } catch {
      toast.error('Error saving assignments.');
    }
  };

  const filteredFaculties = faculties.filter((f) =>
    selectedDeptFilter === 'All' || f.department === selectedDeptFilter
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress color="success" /></Box>;
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      {/* ── Header ──────────────────────────────────────────── */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text-green" sx={{ fontWeight: 800 }}>
            Faculty Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create, edit, and manage all faculty accounts and subject assignments.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Department</InputLabel>
            <Select value={selectedDeptFilter} onChange={(e) => setSelectedDeptFilter(e.target.value)} label="Filter by Department">
              <MenuItem value="All">All Departments</MenuItem>
              {departments.map((d) => <MenuItem key={d._id} value={d.departmentName}>{d.departmentName}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" color="success" startIcon={<PersonAddIcon />} onClick={handleOpenCreate} sx={{ fontWeight: 700 }}>
            Create Faculty
          </Button>
        </Box>
      </Box>

      {/* ── Faculty Table ────────────────────────────────────── */}
      <Card elevation={0} className="glass-panel" sx={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ background: 'transparent' }} elevation={0}>
            <Table>
              <TableHead>
                <TableRow sx={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Year</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Subjects</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFaculties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No faculty members found.</TableCell>
                  </TableRow>
                ) : (
                  filteredFaculties.map((fac) => (
                    <TableRow key={fac._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{fac.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{fac.email || fac.employeeId || ''}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.85rem' }}>
                        {fac.username || '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={fac.department || 'Not Assigned'} color={fac.department ? 'success' : 'default'} variant="outlined" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {fac.assignedYear || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {fac.assignedSubjects?.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {fac.assignedSubjects.slice(0, 2).map((sub: string) => (
                              <Chip key={sub} label={sub} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981' }} />
                            ))}
                            {fac.assignedSubjects.length > 2 && (
                              <Chip label={`+${fac.assignedSubjects.length - 2}`} size="small" variant="outlined" />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fac.status?.toUpperCase()}
                          color={fac.status === 'active' || fac.status === 'approved' ? 'success' : fac.status === 'pending' ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Edit Faculty">
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(fac)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Assign Subjects">
                            <IconButton size="small" color="success" onClick={() => handleOpenAssignDialog(fac)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {fac.status === 'pending' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton size="small" color="success" onClick={() => handleUpdateStatus(fac._id, 'approved')}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton size="small" color="error" onClick={() => handleUpdateStatus(fac._id, 'rejected')}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {(fac.status === 'active' || fac.status === 'approved') && (
                            <Tooltip title="Suspend">
                              <IconButton size="small" color="error" onClick={() => handleUpdateStatus(fac._id, 'suspended')}>
                                <BlockIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {(fac.status === 'suspended' || fac.status === 'rejected') && (
                            <Tooltip title="Re-Activate">
                              <IconButton size="small" color="success" onClick={() => handleUpdateStatus(fac._id, 'approved')}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Faculty">
                            <IconButton size="small" color="error" onClick={() => setDeleteTarget(fac)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      {/* ── Create / Edit Faculty Dialog ─────────────────────── */}
      <Dialog
        open={openFacultyDialog} onClose={() => setOpenFacultyDialog(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingFaculty ? `Edit Faculty: ${editingFaculty.name}` : 'Create Faculty Account'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name *" value={facultyForm.name}
                onChange={(e) => setFacultyForm(f => ({ ...f, name: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Username *" value={facultyForm.username}
                onChange={(e) => setFacultyForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} size="small"
                helperText="Faculty uses this to log in" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={editingFaculty ? 'New Password (leave blank to keep)' : 'Password *'}
                type={showPassword ? 'text' : 'password'} value={facultyForm.password}
                onChange={(e) => setFacultyForm(f => ({ ...f, password: e.target.value }))} size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword(p => !p)}>
                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" value={facultyForm.email}
                onChange={(e) => setFacultyForm(f => ({ ...f, email: e.target.value }))} size="small" type="email" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Employee ID" value={facultyForm.employeeId}
                onChange={(e) => setFacultyForm(f => ({ ...f, employeeId: e.target.value }))} size="small"
                helperText="Auto-generated if left blank" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={facultyForm.phone}
                onChange={(e) => setFacultyForm(f => ({ ...f, phone: e.target.value }))} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Department *</InputLabel>
                <Select value={facultyForm.department}
                  onChange={(e) => setFacultyForm(f => ({ ...f, department: e.target.value }))} label="Department *">
                  <MenuItem value="">— Select —</MenuItem>
                  {departments.map((d) => <MenuItem key={d._id} value={d.departmentName}>{d.departmentName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Assigned Year</InputLabel>
                <Select value={facultyForm.assignedYear}
                  onChange={(e) => setFacultyForm(f => ({ ...f, assignedYear: e.target.value }))} label="Assigned Year">
                  <MenuItem value="">— Not Set —</MenuItem>
                  {YEARS.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenFacultyDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveFaculty} variant="contained" color="success" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}>
            {saving ? 'Saving...' : editingFaculty ? 'Save Changes' : 'Create Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Subject Assignment Dialog ────────────────────────── */}
      <Dialog
        open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>
          Assign Subjects: {assigningFaculty?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select value={assignedDept} onChange={(e) => handleDeptChangeInDialog(e.target.value)} label="Department">
                  <MenuItem value="">— Select Department —</MenuItem>
                  {departments.map((d) => <MenuItem key={d._id} value={d.departmentName}>{d.departmentName}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Select Assigned Subjects
              </Typography>
              {deptSubjects.length === 0 ? (
                <Box sx={{ p: 2, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {assignedDept ? 'No subjects in this department.' : 'Select a department first.'}
                  </Typography>
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: 'auto', bgcolor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Grid container spacing={1}>
                    {deptSubjects.map((sub) => (
                      <Grid item xs={12} sm={6} key={sub.subjectCode}>
                        <FormControlLabel
                          control={
                            <Checkbox checked={assignedSubjects.includes(sub.subjectName)}
                              onChange={() => handleSubjectToggle(sub.subjectName)} color="success" size="small" />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">{sub.subjectName}</Typography>
                              <Typography variant="caption" color="text.secondary">{sub.subjectCode}</Typography>
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
          <Button onClick={() => setOpenAssignDialog(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSaveAssignment} variant="contained" color="success">Save Assignment</Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation ──────────────────────────────── */}
      <Dialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { bgcolor: '#111827', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.light' }}>Delete Faculty Account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete <strong>{deleteTarget?.name}</strong>?
            This action cannot be undone and will revoke their access immediately.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDeleteFaculty} variant="contained" color="error" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
