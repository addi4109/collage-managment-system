import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
} from '@mui/material';

import { useAuth } from '../context/AuthContext';
import SubjectManagementTab from '../components/SubjectManagementTab';

export default function HodDashboard() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'stats';
  const { user } = useAuth();

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>HOD Dashboard</Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the Head of Department portal for {user.departmentName || 'your department'}.
        </Typography>
      </Box>

      {/* STATS VIEW */}
      {tab === 'stats' && (
        <Box>
          <Typography variant="h6">Overview (Coming Soon)</Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar to navigate to Subjects Directory or other modules.
          </Typography>
        </Box>
      )}

      {/* SUBJECTS DIRECTORY */}
      {tab === 'subjects' && (
        <SubjectManagementTab role="hod" userDepartmentId={user.departmentId} />
      )}
    </Box>
  );
}
