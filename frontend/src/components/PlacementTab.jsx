import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PlacementTab({ role }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);

  // Drive creations
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    role: '',
    package: 6,
    eligibilityCriteria: 6.5,
    skillsRequired: '',
    deadline: '',
    departmentIds: [],
    placementYear: '2027',
  });

  // Application submission
  const [openApply, setOpenApply] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [resume, setResume] = useState(null);
  const [studentCgpa, setStudentCgpa] = useState('');

  // Applications view
  const [openApplicants, setOpenApplicants] = useState(false);
  const [currentDriveId, setCurrentDriveId] = useState('');
  const [applicantsList, setApplicantsList] = useState([]);

  // Round editing state
  const [editingApp, setEditingApp] = useState(null);
  const [statusVal, setStatusVal] = useState('applied');
  const [roundsVal, setRoundsVal] = useState([]);
  const [offerLetterUrl, setOfferLetterUrl] = useState('');

  const [analytics, setAnalytics] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/placements/drives');
      setDrives(res.data);

      if (role === 'student') {
        // Fetch current student profile for CGPA check
        try {
          const profRes = await api.get('/students/profile'); // Mock student profile or self profile endpoint
          setStudentProfile(profRes.data);
          // Set student CGPA automatically if found
          if (profRes.data) {
            setStudentCgpa(profRes.data.cgpa || '8.0');
          }
        } catch (e) {
          // If no profile endpoint, default to manual input
          setStudentCgpa('8.2');
        }
      } else {
        const depRes = await api.get('/departments');
        setDepartments(depRes.data);
        const analRes = await api.get('/placements/analytics');
        setAnalytics(analRes.data);
      }
    } catch (err) {
      showToast('Error loading placement drives.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const skills = form.skillsRequired.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/placements/drives', { ...form, skillsRequired: skills });
      showToast('Placement drive created successfully.', 'success');
      setOpenCreate(false);
      loadData();
    } catch (err) {
      showToast('Error creating placement drive.', 'error');
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Resume size must be less than 5MB.', 'warning');
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (extension !== 'pdf' && extension !== 'docx') {
      showToast('Only PDF and DOCX files are allowed for resumes.', 'warning');
      return;
    }

    setResume(file);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!resume) return showToast('Please choose a resume file.', 'warning');
    if (!studentCgpa || isNaN(studentCgpa)) return showToast('Please enter a valid CGPA.', 'warning');

    if (Number(studentCgpa) < selectedDrive.eligibilityCriteria) {
      return showToast(`CGPA doesn't meet minimum requirement of ${selectedDrive.eligibilityCriteria}`, 'error');
    }

    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('cgpa', studentCgpa);

    try {
      await api.post(`/placements/drives/${selectedDrive._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Successfully applied to placement drive!', 'success');
      setOpenApply(false);
      setResume(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to apply.', 'error');
    }
  };

  const handleViewApplicants = async (driveId) => {
    setCurrentDriveId(driveId);
    try {
      const res = await api.get(`/placements/drives/${driveId}/applications`);
      setApplicantsList(res.data);
      setOpenApplicants(true);
    } catch (err) {
      showToast('Failed to retrieve applicants.', 'error');
    }
  };

  const handleUpdateAppStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/placements/applications/${editingApp._id}`, {
        status: statusVal,
        rounds: roundsVal,
        offerLetterUrl: statusVal === 'selected' ? offerLetterUrl : null,
      });
      showToast('Application updated successfully.', 'success');
      setEditingApp(null);
      handleViewApplicants(currentDriveId);
    } catch (err) {
      showToast('Error updating application.', 'error');
    }
  };

  const handleRoundStatusToggle = (idx, status) => {
    const updated = [...roundsVal];
    updated[idx].status = status;
    setRoundsVal(updated);
  };

  const handleDeleteDrive = async (id) => {
    if (!window.confirm('Are you sure you want to delete this placement drive?')) return;
    try {
      await api.delete(`/placements/drives/${id}`);
      showToast('Drive deleted.', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to delete drive.', 'error');
    }
  };

  if (loading) return <LinearProgress color="primary" />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessCenterIcon color="primary" /> Placement Cell Job Portal
        </Typography>
        {(role === 'admin' || role === 'faculty') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)}>
            Add Placement Drive
          </Button>
        )}
      </Box>

      {/* Recruiter Stats */}
      {role !== 'student' && analytics && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ p: 2.5, borderRadius: '16px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Active Placement Drives</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{analytics.totalDrives}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ p: 2.5, borderRadius: '16px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Total Registrations</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{analytics.totalApplications}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ p: 2.5, borderRadius: '16px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Placed Students</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'success.main' }}>
                {analytics.placedCount}
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ p: 2.5, borderRadius: '16px', textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">Highest Package LPA</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1, color: 'primary.main' }}>
                {analytics.highestPackage} LPA
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {drives.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No placement drives active at this moment.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {role === 'student' ? (
            drives.map(({ drive, application }) => {
              const isEligible = Number(studentCgpa) >= drive.eligibilityCriteria;
              const isExpired = new Date() > new Date(drive.deadline);

              let appStatusText = 'Not Applied';
              let appStatusColor = 'default';
              if (application) {
                appStatusText = application.status.toUpperCase().replace('_', ' ');
                if (application.status === 'selected') appStatusColor = 'success';
                else if (application.status === 'rejected') appStatusColor = 'error';
                else appStatusColor = 'primary';
              }

              return (
                <Grid item xs={12} md={6} key={drive._id}>
                  <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{drive.companyName}</Typography>
                        <Chip label={appStatusText} color={appStatusColor} size="small" />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>Role: <b>{drive.role}</b></Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>Package CTC: <b>{drive.package} LPA</b></Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>Eligibility Min CGPA: <b>{drive.eligibilityCriteria}</b></Typography>

                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                        Deadline: {new Date(drive.deadline).toLocaleDateString()}
                      </Typography>

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Required Skills:</Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {drive.skillsRequired.map(s => (
                            <Chip key={s} label={s} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Box>

                      {application && (
                        <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '12px' }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Interview Rounds Tracker:</Typography>
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            {application.rounds.map(r => (
                              <Typography key={r.roundName} variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{r.roundName}</span>
                                <Chip
                                  label={r.status}
                                  size="small"
                                  color={r.status === 'qualified' ? 'success' : r.status === 'failed' ? 'error' : 'default'}
                                />
                              </Typography>
                            ))}
                          </Stack>
                          {application.offerLetterUrl && (
                            <Button
                              startIcon={<DownloadIcon />}
                              variant="contained"
                              color="success"
                              fullWidth
                              sx={{ mt: 2 }}
                              href={application.offerLetterUrl}
                              target="_blank"
                            >
                              Download Offer Letter
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>

                    {!application && (
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 3 }}
                        disabled={!isEligible || isExpired}
                        onClick={() => {
                          setSelectedDrive(drive);
                          setOpenApply(true);
                        }}
                      >
                        {!isEligible ? 'CGPA Below Requirements' : isExpired ? 'Deadline Passed' : 'Apply Now'}
                      </Button>
                    )}
                  </Card>
                </Grid>
              );
            })
          ) : (
            drives.map((drive) => (
              <Grid item xs={12} md={6} key={drive._id}>
                <Card sx={{ p: 3, borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{drive.companyName}</Typography>
                      <Chip label={`${drive.package} LPA`} color="primary" />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>Role: <b>{drive.role}</b></Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>Target Depts: <b>{drive.departmentIds?.map(d => d.name).join(', ')}</b></Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>Eligible CGPA: <b>{drive.eligibilityCriteria}</b></Typography>
                    <Typography variant="caption" color="text.secondary">
                      Deadline: {new Date(drive.deadline).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button variant="outlined" size="small" onClick={() => handleViewApplicants(drive._id)}>
                      View Applicants
                    </Button>
                    <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteDrive(drive._id)}>
                      Delete
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* CREATE PLACEMENT DRIVE DIALOG */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Add Recruitment Drive</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Company Name"
              fullWidth
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
            <TextField
              label="Job Role"
              fullWidth
              required
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="CTC Package (in LPA)"
                  type="number"
                  fullWidth
                  required
                  value={form.package}
                  onChange={(e) => setForm({ ...form, package: Number(e.target.value) })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Minimum Eligibility CGPA"
                  type="number"
                  inputProps={{ step: 0.1 }}
                  fullWidth
                  required
                  value={form.eligibilityCriteria}
                  onChange={(e) => setForm({ ...form, eligibilityCriteria: Number(e.target.value) })}
                />
              </Grid>
            </Grid>
            <TextField
              label="Required Skills (comma separated)"
              fullWidth
              value={form.skillsRequired}
              onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
            />
            <TextField
              label="Apply Deadline"
              type="datetime-local"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <TextField
              select
              label="Target Department"
              fullWidth
              required
              SelectProps={{ multiple: true }}
              value={form.departmentIds}
              onChange={(e) => setForm({ ...form, departmentIds: e.target.value })}
            >
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Post Drive</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* STUDENT APPLY DIALOG */}
      <Dialog open={openApply} onClose={() => setOpenApply(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleApplySubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Apply to {selectedDrive?.companyName}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Verify your Current CGPA"
              type="number"
              inputProps={{ step: 0.01 }}
              required
              fullWidth
              value={studentCgpa}
              onChange={(e) => setStudentCgpa(e.target.value)}
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ py: 3, borderStyle: 'dashed' }}
            >
              Upload PDF/DOCX Resume (max 5MB)
              <input type="file" hidden accept=".pdf,.docx" onChange={handleResumeChange} />
            </Button>
            {resume && (
              <Typography variant="caption" color="primary.main">
                Selected: {resume.name} ({(resume.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApply(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!resume}>Submit Application</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DRIVE APPLICANTS DIALOG */}
      <Dialog open={openApplicants} onClose={() => setOpenApplicants(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Placement Drive Applicants</DialogTitle>
        <DialogContent dividers>
          {applicantsList.length === 0 ? (
            <Typography color="text.secondary">No students applied yet.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell>Student</TableCell>
                    <TableCell>Roll No / Dept</TableCell>
                    <TableCell>CGPA</TableCell>
                    <TableCell>Resume</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicantsList.map(({ application, studentDetails }) => (
                    <TableRow key={application._id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{application.studentId?.name}</TableCell>
                      <TableCell>
                        {studentDetails?.rollNumber || 'N/A'} / {studentDetails?.departmentId?.name}
                      </TableCell>
                      <TableCell>{application.cgpa}</TableCell>
                      <TableCell>
                        <Button
                          startIcon={<DescriptionIcon />}
                          href={`${api.defaults.baseURL}${application.resumeUrl}`}
                          target="_blank"
                          size="small"
                        >
                          Resume
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={application.status}
                          color={application.status === 'selected' ? 'success' : application.status === 'rejected' ? 'error' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => {
                            setEditingApp(application);
                            setStatusVal(application.status);
                            setRoundsVal(application.rounds);
                            setOfferLetterUrl(application.offerLetterUrl || '');
                          }}
                        >
                          Review Rounds
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApplicants(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* REVIEW APPLICATION ROUNDS DIALOG */}
      <Dialog open={!!editingApp} onClose={() => setEditingApp(null)} maxWidth="xs" fullWidth>
        {editingApp && (
          <form onSubmit={handleUpdateAppStatus}>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Review Applicant Process</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              <TextField
                select
                label="Application Overall Status"
                fullWidth
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              >
                {['applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected'].map(st => (
                  <MenuItem key={st} value={st}>{st.toUpperCase().replace('_', ' ')}</MenuItem>
                ))}
              </TextField>

              <Divider />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Interview Rounds Checklist
              </Typography>
              {roundsVal.map((r, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{r.roundName}</Typography>
                  <Stack direction="row" spacing={0.5}>
                    {['pending', 'qualified', 'failed'].map(opt => (
                      <Chip
                        key={opt}
                        label={opt}
                        size="small"
                        clickable
                        color={r.status === opt ? (opt === 'qualified' ? 'success' : opt === 'failed' ? 'error' : 'primary') : 'default'}
                        onClick={() => handleRoundStatusToggle(idx, opt)}
                      />
                    ))}
                  </Stack>
                </Box>
              ))}

              {statusVal === 'selected' && (
                <TextField
                  label="Offer Letter Attachment Link"
                  fullWidth
                  value={offerLetterUrl}
                  onChange={(e) => setOfferLetterUrl(e.target.value)}
                />
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditingApp(null)}>Cancel</Button>
              <Button type="submit" variant="contained">Save Reviews</Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
