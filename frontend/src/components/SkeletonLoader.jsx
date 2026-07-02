import React from 'react';
import { Box, Card, Grid, Skeleton } from '@mui/material';

export const CardSkeleton = () => (
  <Card sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ width: '60%' }}>
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="40%" height={15} />
      </Box>
    </Box>
    <Skeleton variant="text" width="50%" height={32} />
  </Card>
);

export const DashboardSkeleton = () => (
  <Box sx={{ p: 4 }}>
    <Skeleton variant="text" width="30%" height={40} sx={{ mb: 4 }} />
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}><CardSkeleton /></Grid>
      <Grid item xs={12} sm={6} md={3}><CardSkeleton /></Grid>
      <Grid item xs={12} sm={6} md={3}><CardSkeleton /></Grid>
      <Grid item xs={12} sm={6} md={3}><CardSkeleton /></Grid>
    </Grid>
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '16px' }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: '16px' }} />
      </Grid>
    </Grid>
  </Box>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <Box sx={{ p: 2 }}>
    <Skeleton variant="rectangular" height={50} sx={{ mb: 2, borderRadius: '8px' }} />
    {[...Array(rows)].map((_, idx) => (
      <Skeleton key={idx} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: '4px' }} />
    ))}
  </Box>
);
