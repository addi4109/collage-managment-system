import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

import {
  getAllUsers,
  getAllDepartments,
  createOrUpdateUser,
  deleteUser,
  createOrUpdateDepartment,
  deleteDepartment,
} from '../firebase/dbService';
import { UserProfile, Department, UserRole } from '../types';

export const AdminCrud: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dialog control states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  
  // Edit Form states - User
  const [editUserUid, setEditUserUid] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [userDept, setUserDept] = useState('');

  // Edit Form states - Department
  const [editDeptId, setEditDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHod, setDeptHod] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersList, deptsList] = await Promise.all([getAllUsers(), getAllDepartments()]);
      setUsers(usersList);
      setDepartments(deptsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Open User dialog for Add/Edit
  const handleOpenUserDialog = (userToEdit?: UserProfile) => {
    setErrorMsg(null);
    if (userToEdit) {
      setEditUserUid(userToEdit.uid);
      setUserName(userToEdit.name);
      setUserEmail(userToEdit.email);
      setUserRole(userToEdit.role);
      setUserDept(userToEdit.department || '');
    } else {
      setEditUserUid(null);
      setUserName('');
      setUserEmail('');
      setUserRole('student');
      setUserDept('');
    }
    setUserDialogOpen(true);
  };

  // Open Department dialog for Add/Edit
  const handleOpenDeptDialog = (deptToEdit?: Department) => {
    setErrorMsg(null);
    if (deptToEdit) {
      setEditDeptId(deptToEdit.id);
      setDeptName(deptToEdit.name);
      setDeptCode(deptToEdit.code);
      setDeptHod(deptToEdit.hodId);
    } else {
      setEditDeptId(null);
      setDeptName('');
      setDeptCode('');
      setDeptHod('');
    }
    setDeptDialogOpen(true);
  };

  // Handle Save User
  const handleSaveUser = async () => {
    if (!userName || !userEmail) {
      setErrorMsg('Please enter name and email.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const uid = editUserUid || 'user_' + Date.now();
      const updatedUser: UserProfile = {
        uid,
        name: userName,
        email: userEmail,
        role: userRole,
        department: userDept || undefined,
        enrolledCourses: [],
      };
      await createOrUpdateUser(updatedUser);
      setSuccessMsg(`User ${userName} successfully saved.`);
      setUserDialogOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (uid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;
    setActionLoading(true);
    try {
      await deleteUser(uid);
      setSuccessMsg(`User ${name} deleted.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Save Department
  const handleSaveDept = async () => {
    if (!deptName || !deptCode || !deptHod) {
      setErrorMsg('Please complete all department fields.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      await createOrUpdateDepartment({
        id: editDeptId || undefined,
        name: deptName,
        code: deptCode,
        hodId: deptHod,
      });
      setSuccessMsg(`Department "${deptName}" saved.`);
      setDeptDialogOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save department.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Department
  const handleDeleteDept = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete department "${name}"?`)) return;
    setActionLoading(true);
    try {
      await deleteDepartment(id);
      setSuccessMsg(`Department "${name}" deleted.`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete department.');
    } finally {
      setActionLoading(false);
    }
  };

  const students = users.filter((u) => u.role === 'student');
  const faculty = users.filter((u) => u.role === 'faculty');
  const hodCandidates = users.filter((u) => u.role === 'faculty');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Manage Users & Departments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            System CRUD portals for Students, Faculty, and Departments.
          </Typography>
        </Box>
        <Box>
          {activeTab < 2 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenUserDialog()}
            >
              Add User
            </Button>
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDeptDialog()}
            >
              Add Department
            </Button>
          )}
        </Box>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Card>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <Tab label="Students" sx={{ fontWeight: 'bold' }} />
          <Tab label="Faculty" sx={{ fontWeight: 'bold' }} />
          <Tab label="Departments" sx={{ fontWeight: 'bold' }} />
        </Tabs>
        <CardContent sx={{ p: 0 }}>
          {/* 1. Students CRUD Panel */}
          {activeTab === 0 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Department</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((st) => (
                    <TableRow key={st.uid} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{st.uid}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{st.name}</TableCell>
                      <TableCell>{st.email}</TableCell>
                      <TableCell>{st.department || <Typography variant="caption" color="text.secondary">Unassigned</Typography>}</TableCell>
                      <TableCell align="right">
                        <IconButton color="secondary" onClick={() => handleOpenUserDialog(st)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteUser(st.uid, st.name)} size="small" disabled={actionLoading}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* 2. Faculty CRUD Panel */}
          {activeTab === 1 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>UID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Department</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faculty.map((fa) => (
                    <TableRow key={fa.uid} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{fa.uid}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{fa.name}</TableCell>
                      <TableCell>{fa.email}</TableCell>
                      <TableCell>{fa.department || <Typography variant="caption" color="text.secondary">Unassigned</Typography>}</TableCell>
                      <TableCell align="right">
                        <IconButton color="secondary" onClick={() => handleOpenUserDialog(fa)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteUser(fa.uid, fa.name)} size="small" disabled={actionLoading}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* 3. Departments CRUD Panel */}
          {activeTab === 2 && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Department Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'text.secondary' }}>HOD UID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map((dept) => (
                    <TableRow key={dept.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{dept.id}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{dept.name}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{dept.code}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{dept.hodId}</TableCell>
                      <TableCell align="right">
                        <IconButton color="secondary" onClick={() => handleOpenDeptDialog(dept)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteDept(dept.id, dept.name)} size="small" disabled={actionLoading}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* User Save Modal */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {editUserUid ? 'Edit User Profile' : 'Add New User Profile'}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <TextField
            fullWidth
            label="Name"
            variant="outlined"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            sx={{ mb: 2.5 }}
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            variant="outlined"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            sx={{ mb: 2.5 }}
            required
          />
          
          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>Account Role</InputLabel>
            <Select
              value={userRole}
              label="Account Role"
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Department"
            variant="outlined"
            value={userDept}
            onChange={(e) => setUserDept(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={() => setUserDialogOpen(false)} color="inherit" disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={16} color="inherit" /> : 'Save Profile'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Save Modal */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {editDeptId ? 'Edit Department' : 'Create Department'}
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          <TextField
            fullWidth
            label="Department Name"
            variant="outlined"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            sx={{ mb: 2.5 }}
            required
          />
          <TextField
            fullWidth
            label="Code (e.g. CSE)"
            variant="outlined"
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            sx={{ mb: 2.5 }}
            required
          />
          
          <FormControl fullWidth>
            <InputLabel>Head of Department (HOD)</InputLabel>
            <Select
              value={deptHod}
              label="Head of Department (HOD)"
              onChange={(e) => setDeptHod(e.target.value)}
            >
              {hodCandidates.map((hc) => (
                <MenuItem key={hc.uid} value={hc.uid}>
                  {hc.name} ({hc.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={() => setDeptDialogOpen(false)} color="inherit" disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleSaveDept} variant="contained" color="secondary" disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={16} color="inherit" /> : 'Save Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminCrud;
