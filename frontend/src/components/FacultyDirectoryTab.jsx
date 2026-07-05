import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, IconButton, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function FacultyDirectoryTab({ role, handleOpenFacultyForm, handleResetPasswordPrompt, handleDeleteFaculty }) {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = role === 'hod' ? '/hod/faculty' : '/faculty';
      const res = await api.get(endpoint);
      setFaculties(res.data);
    } catch (err) {
      showToast('Failed to load faculty directory.', 'error');
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
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Faculty Directory</Typography>
        {role === 'principal' && handleOpenFacultyForm && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenFacultyForm()}>
            Register Faculty
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : faculties.length === 0 ? (
        <Typography color="text.secondary">No faculty members found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Assigned Departments</TableCell>
                <TableCell>Assigned Years</TableCell>
                {role === 'principal' && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {faculties.map((f) => (
                <TableRow key={f._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{f.userId?.name}</TableCell>
                  <TableCell>{f.userId?.username}</TableCell>
                  <TableCell>
                    {f.assignedDepartments?.map(d => (
                      <Chip key={d._id} label={d.name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    {f.assignedYears?.map((y, idx) => (
                      <Chip key={idx} label={y} size="small" variant="outlined" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  {role === 'principal' && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleResetPasswordPrompt && handleResetPasswordPrompt(f)} color="warning" title="Reset Password">
                        <LockResetIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenFacultyForm && handleOpenFacultyForm(f)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteFaculty && handleDeleteFaculty(f._id)} color="error">
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
