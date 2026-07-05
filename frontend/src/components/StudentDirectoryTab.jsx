import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, IconButton, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function StudentDirectoryTab({ role, handleOpenStudentForm, handleDeleteStudent }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '/students';
      if (role === 'hod') endpoint = '/hod/students';
      if (role === 'faculty') endpoint = '/faculty/students';
      if (role === 'principal') endpoint = '/students';
      const res = await api.get(endpoint);
      setStudents(res.data);
    } catch (err) {
      showToast('Failed to load student directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Students Directory</Typography>
        {role === 'faculty' && handleOpenStudentForm && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenStudentForm()}>
            Register Student
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : students.length === 0 ? (
        <Typography color="text.secondary">No students found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll Number</TableCell>
                <TableCell>Enrollment</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Class</TableCell>
                {role === 'faculty' && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{s.rollNumber}</TableCell>
                  <TableCell>{s.enrollmentNumber || 'N/A'}</TableCell>
                  <TableCell>{s.userId?.name}</TableCell>
                  <TableCell>{s.departmentId?.name}</TableCell>
                  <TableCell>{s.year} - {s.semester}</TableCell>
                  {role === 'faculty' && (
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleOpenStudentForm && handleOpenStudentForm(s)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteStudent && handleDeleteStudent(s._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
