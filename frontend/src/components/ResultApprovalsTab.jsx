import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, CircularProgress
} from '@mui/material';

import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function ResultApprovalsTab() {
  const [resultBatches, setResultBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/results/pending');
      setResultBatches(res.data);
    } catch (err) {
      showToast('Failed to load pending results.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeclareBatch = async (id) => {
    try {
      await api.post(`/results/declare/${id}`);
      showToast('Semester results batch declared successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to declare results.', 'error');
    }
  };

  const handleDeclareAll = async () => {
    try {
      await api.post('/results/declare-all');
      showToast('All approved results declared successfully.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to declare results.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Pending Student Results</Typography>
        {resultBatches.length > 0 && (
          <Button variant="contained" color="success" onClick={handleDeclareAll}>
            Declare All Pending
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : resultBatches.length === 0 ? (
        <Typography color="text.secondary">No submitted student results found.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Roll Number</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Submitted By</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resultBatches.map((r) => (
                <TableRow key={r._id}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{r.studentName}</TableCell>
                  <TableCell>{r.rollNumber}</TableCell>
                  <TableCell>{r.departmentId?.name}</TableCell>
                  <TableCell>{r.year} - {r.semester}</TableCell>
                  <TableCell>{r.facultyId?.name}</TableCell>
                  <TableCell>
                    <Chip label={r.status} color="warning" size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" color="success" onClick={() => handleDeclareBatch(r._id)}>
                      Approve & Declare
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
