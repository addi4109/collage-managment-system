import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import {
  PlacementDrive,
  createPlacementDrive,
  getPlacementDrives,
  applyToPlacementDrive,
  updatePlacementSelections,
} from '../services/erpService';

const DEPARTMENTS = [
  'Computer Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Electronics Engineering',
];
const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

export const PlacementCell: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openSelectDialog, setOpenSelectDialog] = useState(false);
  const [activeDrive, setActiveDrive] = useState<PlacementDrive | null>(null);

  // Create Drive Form State
  const [formData, setFormData] = useState({
    companyName: '',
    jobProfile: '',
    ctcPackage: '',
    driveDate: '',
    eligibilityCriteria: '',
    department: 'Computer Engineering',
    year: 'Third Year',
    semester: 'Sem 6',
  });

  // Selections Form State
  const [selections, setSelections] = useState<{
    studentId: string;
    studentName: string;
    rollNumber: string;
    packageOffered: string;
  }[]>([]);

  // Selection Item Input
  const [selItem, setSelItem] = useState({
    rollNumber: '',
    studentName: '',
    packageOffered: '',
  });

  const loadDrives = async () => {
    setLoading(true);
    try {
      const data = await getPlacementDrives();
      setDrives(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load placement drives.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === 'semester') {
        if (value === 'Sem 1' || value === 'Sem 2') updated.year = 'First Year';
        else if (value === 'Sem 3' || value === 'Sem 4') updated.year = 'Second Year';
        else if (value === 'Sem 5' || value === 'Sem 6') updated.year = 'Third Year';
      }
      return updated;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPlacementDrive(formData);
      toast.success('Placement drive created successfully!');
      setOpenCreateDialog(false);
      loadDrives();
    } catch (err: any) {
      toast.error(err.message || 'Error creating placement drive.');
    }
  };

  const handleApply = async (driveId: string) => {
    try {
      const res = await applyToPlacementDrive(driveId);
      toast.success(res.message || 'Successfully applied to drive.');
      loadDrives();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply to placement drive.');
    }
  };

  const handleOpenSelections = (drive: PlacementDrive) => {
    setActiveDrive(drive);
    setSelections(drive.selectedStudents || []);
    setSelItem({ rollNumber: '', studentName: '', packageOffered: drive.ctcPackage });
    setOpenSelectDialog(true);
  };

  const addSelectionItem = () => {
    if (!selItem.rollNumber || !selItem.studentName) {
      toast.error('Student Name and Roll Number are required.');
      return;
    }
    setSelections((prev) => [
      ...prev,
      {
        studentId: 'STUD-' + Math.random().toString(36).substring(2, 6).toUpperCase(), // placeholder or matching ID
        studentName: selItem.studentName,
        rollNumber: selItem.rollNumber,
        packageOffered: selItem.packageOffered || activeDrive?.ctcPackage || '',
      },
    ]);
    setSelItem({ rollNumber: '', studentName: '', packageOffered: activeDrive?.ctcPackage || '' });
  };

  const removeSelectionItem = (index: number) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSelections = async () => {
    if (!activeDrive) return;
    try {
      await updatePlacementSelections(activeDrive._id, selections);
      toast.success('Placement selection results updated successfully.');
      setOpenSelectDialog(false);
      loadDrives();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save selection results.');
    }
  };

  return (
    <Container maxWidth="xl" className="animate-fade-in" sx={{ mt: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Placement Cell
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage upcoming company campus drives, eligibility lists, and selection updates.
          </Typography>
        </Box>

        {user?.role === 'admin' && (
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Create Campus Drive
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <CardContent sx={{ p: 0 }}>
                <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Job Profile</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>CTC / Package</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Drive Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Target Batch</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Eligibility</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Applicants</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Selections</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {drives.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                            No campus placement drives scheduled.
                          </TableCell>
                        </TableRow>
                      ) : (
                        drives.map((drive) => {
                          const hasApplied = drive.eligibleStudents.includes(user?.uid || '');
                          return (
                            <TableRow key={drive._id} hover>
                              <TableCell sx={{ fontWeight: 600 }}>{drive.companyName}</TableCell>
                              <TableCell>{drive.jobProfile}</TableCell>
                              <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>
                                {drive.ctcPackage}
                              </TableCell>
                              <TableCell>{new Date(drive.driveDate).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{drive.department}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {drive.semester} ({drive.year})
                                </Typography>
                              </TableCell>
                              <TableCell>{drive.eligibilityCriteria || 'None'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${drive.eligibleStudents?.length || 0} Applied`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={`${drive.selectedStudents?.length || 0} Selected`}
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                  {user?.role === 'student' && (
                                    <Button
                                      variant={hasApplied ? 'outlined' : 'contained'}
                                      color={hasApplied ? 'primary' : 'success'}
                                      disabled={hasApplied}
                                      onClick={() => handleApply(drive._id)}
                                      size="small"
                                      sx={{ fontWeight: 700 }}
                                    >
                                      {hasApplied ? 'Registered' : 'Apply Now'}
                                    </Button>
                                  )}
                                  {user?.role === 'admin' && (
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      startIcon={<EditIcon />}
                                      onClick={() => handleOpenSelections(drive)}
                                      size="small"
                                      sx={{ fontWeight: 700 }}
                                    >
                                      Update Selections
                                    </Button>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Admin: Create Drive Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Placement Drive</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Job Profile"
                  name="jobProfile"
                  value={formData.jobProfile}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="CTC Package (e.g., 12 LPA)"
                  name="ctcPackage"
                  value={formData.ctcPackage}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Drive Date"
                  name="driveDate"
                  InputLabelProps={{ shrink: true }}
                  value={formData.driveDate}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Target Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                >
                  {DEPARTMENTS.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  required
                  label="Target Semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                >
                  {SEMESTERS.map((sem) => (
                    <MenuItem key={sem} value={sem}>
                      {sem}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  disabled
                  label="Year"
                  name="year"
                  value={formData.year}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Eligibility Criteria (e.g. CGPA > 7.0, no active backlogs)"
                  name="eligibilityCriteria"
                  value={formData.eligibilityCriteria}
                  onChange={handleInputChange}
                  helperText="Hint: include 'CGPA > X.Y' to automatically restrict student applicants."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" sx={{ fontWeight: 700 }}>
              Create Drive
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Admin: Update Selections Dialog */}
      <Dialog open={openSelectDialog} onClose={() => setOpenSelectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Placement Selection Results: {activeDrive?.companyName}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 2 }} color="text.secondary">
            Add students who successfully cleared the drive.
          </Typography>

          {/* Add selection item block */}
          <Grid container spacing={2} sx={{ mb: 3 }} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Student Roll No"
                value={selItem.rollNumber}
                onChange={(e) => setSelItem((p) => ({ ...p, rollNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Student Name"
                value={selItem.studentName}
                onChange={(e) => setSelItem((p) => ({ ...p, studentName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Package Offered"
                value={selItem.packageOffered}
                onChange={(e) => setSelItem((p) => ({ ...p, packageOffered: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={1}>
              <Button
                variant="contained"
                color="success"
                onClick={addSelectionItem}
                sx={{ height: 56, width: '100%', minWidth: 0 }}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
            Selected Students ({selections.length})
          </Typography>

          {selections.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No students selected yet. Add selected candidates above.
            </Typography>
          ) : (
            <List>
              {selections.map((sel, idx) => (
                <ListItem
                  key={idx}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => removeSelectionItem(idx)}>
                      <CloseIcon />
                    </IconButton>
                  }
                  sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <ListItemText
                    primary={`${sel.studentName} (${sel.rollNumber})`}
                    secondary={`Package: ${sel.packageOffered}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenSelectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSaveSelections} sx={{ fontWeight: 700 }}>
            Save Selection Results
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PlacementCell;
