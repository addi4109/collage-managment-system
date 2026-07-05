import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import Grid from '@mui/material/Grid';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function SubjectManagementTab({ role, userDepartmentId }) {
  const { showToast } = useToast();

  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [openSubjectDialog, setOpenSubjectDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    departmentId: role === 'hod' ? userDepartmentId : '',
    year: 'First Year',
    semester: 'Sem 1',
    maxInternal: 20,
    maxPractical: 30,
    maxTheory: 80,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, depsRes] = await Promise.all([
        api.get(role === 'hod' && userDepartmentId ? `/subjects?departmentId=${userDepartmentId}` : '/subjects'),
        api.get('/departments')
      ]);
      setSubjects(subsRes.data);
      setDepartments(depsRes.data);
    } catch (err) {
      showToast('Failed to load subjects.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userDepartmentId]);

  const handleOpenSubjectForm = (subject = null) => {
    if (subject) {
      setIsEditMode(true);
      setEditSubjectId(subject._id);
      setSubjectForm({
        name: subject.name,
        code: subject.code,
        departmentId: subject.departmentId?._id || subject.departmentId,
        year: subject.year,
        semester: subject.semester,
        maxInternal: subject.maxInternal !== undefined ? subject.maxInternal : 20,
        maxPractical: subject.maxPractical !== undefined ? subject.maxPractical : 30,
        maxTheory: subject.maxTheory !== undefined ? subject.maxTheory : 80,
      });
    } else {
      setIsEditMode(false);
      setSubjectForm({
        name: '',
        code: '',
        departmentId: role === 'hod' ? userDepartmentId : (departments.length > 0 ? departments[0]._id : ''),
        year: 'First Year',
        semester: 'Sem 1',
        maxInternal: 20,
        maxPractical: 30,
        maxTheory: 80,
      });
    }
    setOpenSubjectDialog(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = { ...subjectForm };
      if (role === 'hod') payload.departmentId = userDepartmentId;

      if (isEditMode) {
        await api.post('/subjects', { ...payload, id: editSubjectId });
        showToast('Subject updated successfully.', 'success');
      } else {
        await api.post('/subjects', payload);
        showToast('Subject created successfully.', 'success');
      }
      setOpenSubjectDialog(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit subject form.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      showToast('Subject deleted successfully.', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete subject.', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Subjects Directory</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenSubjectForm()}>
          Create Subject
        </Button>
      </Box>

      {subjects.length === 0 ? (
        <Typography color="text.secondary">No subjects are defined yet.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subject Name</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="center">Internals Max</TableCell>
                <TableCell align="center">Practicals Max</TableCell>
                <TableCell align="center">Theory Max</TableCell>
                <TableCell align="center">Total Max</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subjects.map((sub) => {
                const mI = sub.maxInternal !== undefined ? sub.maxInternal : 20;
                const mP = sub.maxPractical !== undefined ? sub.maxPractical : 30;
                const mT = sub.maxTheory !== undefined ? sub.maxTheory : 80;
                return (
                  <TableRow key={sub._id}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{sub.name}</TableCell>
                    <TableCell>{sub.code}</TableCell>
                    <TableCell>{sub.departmentId?.name || 'N/A'}</TableCell>
                    <TableCell>{sub.year} - {sub.semester}</TableCell>
                    <TableCell align="center">{mI}</TableCell>
                    <TableCell align="center">{mP}</TableCell>
                    <TableCell align="center">{mT}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{mI + mP + mT}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton size="small" color="primary" onClick={() => handleOpenSubjectForm(sub)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteSubject(sub._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* SUBJECT CREATE/EDIT DIALOG */}
      <Dialog open={openSubjectDialog} onClose={() => setOpenSubjectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {isEditMode ? 'Edit Subject Details' : 'Create New Subject'}
        </DialogTitle>
        <form onSubmit={handleSubjectSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <TextField
              margin="dense"
              fullWidth
              required
              label="Subject Name"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              fullWidth
              required
              label="Subject Code"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            {role !== 'hod' && (
              <TextField
                select
                margin="dense"
                fullWidth
                required
                label="Department"
                value={subjectForm.departmentId}
                onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
                sx={{ mb: 2 }}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </TextField>
            )}

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Year"
                  value={subjectForm.year}
                  onChange={(e) => setSubjectForm({ ...subjectForm, year: e.target.value, semester: getSemestersForYear(e.target.value)[0] })}
                >
                  {['First Year', 'Second Year', 'Third Year'].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Semester"
                  value={subjectForm.semester}
                  onChange={(e) => setSubjectForm({ ...subjectForm, semester: e.target.value })}
                >
                  {getSemestersForYear(subjectForm.year).map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
              Form Format (Max Marks Configuration)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Internals Max"
                  value={subjectForm.maxInternal}
                  onChange={(e) => setSubjectForm({ ...subjectForm, maxInternal: parseInt(e.target.value, 10) || 0 })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Practicals Max"
                  value={subjectForm.maxPractical}
                  onChange={(e) => setSubjectForm({ ...subjectForm, maxPractical: parseInt(e.target.value, 10) || 0 })}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  label="Theory Max"
                  value={subjectForm.maxTheory}
                  onChange={(e) => setSubjectForm({ ...subjectForm, maxTheory: parseInt(e.target.value, 10) || 0 })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubjectDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Save Subject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
