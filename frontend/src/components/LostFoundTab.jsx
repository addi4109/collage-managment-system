import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  Avatar,
  Paper,
  CardContent,
  CardActions,
  Link,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CommentIcon from '@mui/icons-material/Comment';
import HelpIcon from '@mui/icons-material/Help';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { api, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSemestersForYear } from '../utils/academicHelpers';

export default function LostFoundTab() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Post Dialog State
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    type: 'lost',
    contactInfo: '',
    departmentId: '',
    year: 'First Year',
    semester: 'Sem 1',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Reply States
  const [replyMessages, setReplyMessages] = useState({}); // itemId -> message text

  // Load setup and items
  const loadSetup = async () => {
    try {
      const deptRes = await api.get('/departments');
      setDepartments(deptRes.data);
    } catch (err) {
      console.error('Error loading departments:', err);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.type = filterType;
      if (filterStatus) params.status = filterStatus;
      if (filterDept) params.departmentId = filterDept;

      const res = await api.get('/lostfound', { params });
      setItems(res.data);
    } catch (err) {
      showToast('Error loading Lost & Found items.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetup();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [filterType, filterStatus, filterDept]);

  // Set default values for post form based on user profile
  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      setPostForm((prev) => ({
        ...prev,
        departmentId: user.departmentId || '',
        year: user.year || 'First Year',
        semester: user.semester || 'Sem 1',
      }));
    } else if (user.role === 'faculty') {
      setPostForm((prev) => ({
        ...prev,
        departmentId: user.assignedDepartments?.[0] || '',
        year: user.assignedYears?.[0] || 'First Year',
        semester: 'Sem 1',
      }));
    } else if (departments.length > 0) {
      setPostForm((prev) => ({
        ...prev,
        departmentId: departments[0]._id,
      }));
    }
  }, [user, departments]);

  const handleOpenPostDialog = () => {
    setSelectedFiles([]);
    setOpenPostDialog(true);
  };

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postForm.departmentId) {
      return showToast('Department is required.', 'warning');
    }
    setSubmitLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', postForm.title);
      formData.append('description', postForm.description);
      formData.append('type', postForm.type);
      formData.append('contactInfo', postForm.contactInfo);
      formData.append('departmentId', postForm.departmentId);
      formData.append('year', postForm.year);
      formData.append('semester', postForm.semester);

      selectedFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      await api.post('/lostfound', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showToast('Item entry posted successfully.', 'success');
      setOpenPostDialog(false);
      // Reset form
      setPostForm({
        title: '',
        description: '',
        type: 'lost',
        contactInfo: '',
        departmentId: user.role === 'student' ? user.departmentId : (user.assignedDepartments?.[0] || departments[0]?._id || ''),
        year: user.role === 'student' ? user.year : (user.assignedYears?.[0] || 'First Year'),
        semester: user.role === 'student' ? user.semester : 'Sem 1',
      });
      setSelectedFiles([]);
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to post entry.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResolve = async (itemId) => {
    if (!window.confirm('Are you sure you want to mark this item as resolved?')) return;
    try {
      await api.post(`/lostfound/${itemId}/resolve`);
      showToast('Item marked as resolved.', 'success');
      fetchItems();
    } catch (err) {
      showToast('Failed to resolve entry.', 'error');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/lostfound/${itemId}`);
      showToast('Post deleted successfully.', 'success');
      fetchItems();
    } catch (err) {
      showToast('Failed to delete post.', 'error');
    }
  };

  const handleReplySubmit = async (itemId) => {
    const message = replyMessages[itemId]?.trim();
    if (!message) return showToast('Reply message cannot be empty.', 'warning');

    try {
      await api.post(`/lostfound/${itemId}/reply`, { message });
      showToast('Reply posted successfully.', 'success');
      setReplyMessages({ ...replyMessages, [itemId]: '' });
      fetchItems();
    } catch (err) {
      showToast('Failed to post reply.', 'error');
    }
  };

  const handleReplyChange = (itemId, val) => {
    setReplyMessages({
      ...replyMessages,
      [itemId]: val,
    });
  };

  const getDeptName = (deptId) => {
    const dept = departments.find((d) => d._id === deptId || d._id === deptId?._id);
    return dept ? dept.name : 'All Departments';
  };

  const isImageFile = (url) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  };

  const renderAttachments = (item) => {
    if (!item.attachments || item.attachments.length === 0) return null;
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Attachments:</Typography>
        <Grid container spacing={2}>
          {item.attachments.map((file, idx) => {
            const serverUrl = file.fileUrl.startsWith('http') ? file.fileUrl : `http://localhost:5000${file.fileUrl}`;
            return (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Paper variant="outlined" sx={{ p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'action.hover' }}>
                  {isImageFile(file.fileUrl) ? (
                    <Box
                      component="img"
                      src={serverUrl}
                      alt={file.filename}
                      sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px', mb: 1 }}
                    />
                  ) : (
                    <Box sx={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HelpIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
                    </Box>
                  )}
                  <Link href={serverUrl} target="_blank" rel="noopener noreferrer" sx={{ fontSize: '0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {file.filename}
                  </Link>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  return (
    <Box>
      {/* Header and Add Action */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Lost & Found Message Board</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPostDialog}>
          Post New Item
        </Button>
      </Box>

      {/* Filter Options */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="lost">Lost</MenuItem>
            <MenuItem value="found">Found</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            size="small"
            label="Filter Status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </TextField>
        </Grid>
        {user?.role !== 'student' && (
          <Grid item xs={12} sm={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Filter Department"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
        )}
      </Grid>

      {/* Main Board Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
          <Typography color="text.secondary">No postings found matching your filters.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {items.map((item) => {
            const isCreator = item.createdBy === user.id || item.createdBy?._id === user.id;
            const canManage = isCreator || user.role === 'admin';

            return (
              <Grid item xs={12} key={item._id}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', overflow: 'visible' }}>
                  <CardContent>
                    {/* Header Chips */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Posted on {new Date(item.createdAt).toLocaleDateString()} by{' '}
                          <strong>{item.createdBy?.name || 'Someone'}</strong> ({item.createdBy?.role || 'User'})
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={item.type.toUpperCase()}
                          color={item.type === 'lost' ? 'error' : 'success'}
                          size="small"
                        />
                        <Chip
                          label={item.status.toUpperCase()}
                          color={item.status === 'active' ? 'primary' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>

                    {/* Metadata tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip label={getDeptName(item.departmentId)} size="small" variant="outlined" />
                      <Chip label={item.year} size="small" variant="outlined" />
                      <Chip label={item.semester} size="small" variant="outlined" />
                    </Box>

                    {/* Body */}
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>{item.description}</Typography>

                    {/* Contact Info */}
                    <Paper sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover', mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                      <ContactPhoneIcon color="primary" />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">Contact Information</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{item.contactInfo}</Typography>
                      </Box>
                    </Paper>

                    {/* Attachments */}
                    {renderAttachments(item)}

                    <Divider sx={{ my: 2 }} />

                    {/* Replies Feed */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CommentIcon fontSize="small" /> Replies ({item.replies?.length || 0})
                    </Typography>
                    {item.replies?.length > 0 && (
                      <List sx={{ bgcolor: 'action.hover', borderRadius: '8px', px: 2, py: 1, mb: 2 }}>
                        {item.replies.map((reply, rIdx) => (
                          <ListItem key={rIdx} disableGutters sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1, borderBottom: rIdx < item.replies.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: reply.replierRole === 'admin' ? 'error.main' : reply.replierRole === 'faculty' ? 'secondary.main' : 'primary.main' }}>
                                {reply.replierName?.[0]}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {reply.replierName}
                              </Typography>
                              <Chip label={reply.replierRole} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(reply.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ pl: 4 }}>{reply.message}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Add Reply */}
                    {item.status === 'active' && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Write a reply..."
                          value={replyMessages[item._id] || ''}
                          onChange={(e) => handleReplyChange(item._id, e.target.value)}
                        />
                        <Button variant="outlined" onClick={() => handleReplySubmit(item._id)}>Reply</Button>
                      </Box>
                    )}
                  </CardContent>

                  {/* Actions for Creator / Admin */}
                  {canManage && item.status === 'active' && (
                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                      <Button
                        size="small"
                        color="success"
                        variant="outlined"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleResolve(item._id)}
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete Post
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* CREATE POST DIALOG */}
      <Dialog open={openPostDialog} onClose={() => setOpenPostDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handlePostSubmit}>
          <DialogTitle sx={{ fontWeight: 'bold' }}>Post Lost/Found Item</DialogTitle>
          <DialogContent>
            {/* Type */}
            <TextField
              select
              margin="dense"
              fullWidth
              required
              label="Post Type"
              value={postForm.type}
              onChange={(e) => setPostForm({ ...postForm, type: e.target.value })}
              sx={{ mb: 2, mt: 1 }}
            >
              <MenuItem value="lost">Lost Item</MenuItem>
              <MenuItem value="found">Found Item</MenuItem>
            </TextField>

            {/* Title */}
            <TextField
              margin="dense"
              fullWidth
              required
              label="Item Title (e.g. Blue Water Bottle, Black Leather Wallet)"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              margin="dense"
              fullWidth
              required
              multiline
              rows={4}
              label="Description (Details of where it was lost/found, features, etc.)"
              value={postForm.description}
              onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            {/* Contact Info */}
            <TextField
              margin="dense"
              fullWidth
              required
              label="Contact Info (e.g. Phone number, email, or room number)"
              value={postForm.contactInfo}
              onChange={(e) => setPostForm({ ...postForm, contactInfo: e.target.value })}
              sx={{ mb: 2 }}
            />

            {/* Scoped Visibility Dropdowns - Disabled or filtered based on role */}
            {user?.role === 'admin' ? (
              <>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Department Scope"
                  value={postForm.departmentId}
                  onChange={(e) => setPostForm({ ...postForm, departmentId: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {departments.map((d) => (
                    <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Year Scope"
                  value={postForm.year}
                  onChange={(e) => setPostForm({ ...postForm, year: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {['First Year', 'Second Year', 'Third Year'].map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Semester Scope"
                  value={postForm.semester}
                  onChange={(e) => setPostForm({ ...postForm, semester: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {getSemestersForYear(postForm.year).map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </>
            ) : user?.role === 'faculty' ? (
              <>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Department Scope"
                  value={postForm.departmentId}
                  onChange={(e) => setPostForm({ ...postForm, departmentId: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {departments
                    .filter((d) => user.assignedDepartments.includes(d._id))
                    .map((d) => (
                      <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Year Scope"
                  value={postForm.year}
                  onChange={(e) => setPostForm({ ...postForm, year: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {user.assignedYears.map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  margin="dense"
                  fullWidth
                  required
                  label="Target Semester Scope"
                  value={postForm.semester}
                  onChange={(e) => setPostForm({ ...postForm, semester: e.target.value })}
                  sx={{ mb: 2 }}
                >
                  {getSemestersForYear(postForm.year).map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </>
            ) : (
              // For student, hide scopes or make read-only since they are set automatically
              <Box sx={{ mt: 1, mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: '8px' }}>
                <Typography variant="caption" color="text.secondary" display="block">Post Scoped To Your Class:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {getDeptName(user.departmentId)} - {user.year} - {user.semester}
                </Typography>
              </Box>
            )}

            {/* Attachments */}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Upload Attachments
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Selected Files:</Typography>
                  {selectedFiles.map((file, idx) => (
                    <Typography key={idx} variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                      • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPostDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitLoading}>
              {submitLoading ? <CircularProgress size={24} /> : 'Post Entry'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
