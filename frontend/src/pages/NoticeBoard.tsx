import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuthStore } from '../store/authStore';
import { getNotices, createNotice, deleteNotice, Notice } from '../services/noticeService';
import { useToast } from '../context/ToastContext';

export const NoticeBoard: React.FC = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  
  // Create Notice Form States
  const [openCreate, setOpenCreate] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high'>('low');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllNotices = async () => {
    try {
      setLoading(true);
      const data = await getNotices();
      setNotices(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to load notices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllNotices();
  }, []);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormMessage('');
    setFormPriority('low');
    setOpenCreate(true);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim() || !user) return;
    setActionLoading(true);

    try {
      await createNotice({
        title: formTitle.trim(),
        message: formMessage.trim(),
        priority: formPriority,
      });
      toast.success('Notice published successfully!');
      setOpenCreate(false);
      fetchAllNotices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to publish notice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await deleteNotice(id);
      toast.success('Notice deleted successfully.');
      fetchAllNotices();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete notice.');
    }
  };

  // Filter notices
  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.createdByName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = selectedPriority === 'All' || notice.priority === selectedPriority.toLowerCase();
    return matchesSearch && matchesPriority;
  });

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'info';
    }
  };

  const isAuthorOrAdmin = (notice: Notice) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return notice.createdBy === user.uid;
  };

  const canCreateNotices = user?.role === 'faculty' || user?.role === 'admin';

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Notice Board
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Stay updated with the latest announcements, schedules, and important information.
          </Typography>
        </Box>
        {canCreateNotices && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
          >
            Create Notice
          </Button>
        )}
      </Box>

      {/* Filter and Search Bar */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices by title, message, or faculty..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Filter by Priority:
            </Typography>
            {['All', 'Low', 'Medium', 'High'].map((prio) => (
              <Chip
                key={prio}
                label={prio}
                clickable
                color={selectedPriority === prio ? 'primary' : 'default'}
                onClick={() => setSelectedPriority(prio)}
                sx={{
                  fontWeight: selectedPriority === prio ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Notices list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredNotices.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)', bgcolor: '#111827' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <CampaignIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No notices found.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredNotices.map((notice) => {
            const isHighPriority = notice.priority === 'high';
            return (
              <Grid item xs={12} key={notice._id}>
                <Card
                  sx={{
                    bgcolor: '#111827',
                    border: isHighPriority ? '1.5px solid #f43f5e' : '1px solid rgba(255,255,255,0.06)',
                    boxShadow: isHighPriority ? '0 0 15px rgba(244,63,94,0.15)' : 'none',
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      borderColor: isHighPriority ? '#f43f5e' : 'primary.light',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: notice.role === 'admin' ? 'warning.main' : 'secondary.main', width: 32, height: 32, fontSize: '0.85rem' }}>
                          {notice.createdByName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {notice.createdByName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                            {notice.role}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={notice.priority}
                          size="small"
                          color={getPriorityColor(notice.priority)}
                          sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 12 }} />
                          {new Date(notice.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                        {isAuthorOrAdmin(notice) && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteNotice(notice._id)}
                            sx={{ ml: 0.5 }}
                          >
                            <DeleteIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: isHighPriority ? '#f43f5e' : 'text.primary' }}>
                      {notice.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {notice.message}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Notice Dialog */}
      <Dialog open={openCreate} onClose={() => !actionLoading && setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <form onSubmit={handleCreateNotice}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <CampaignIcon color="primary" />
            Publish a Notice
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Notice Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="E.g., Midterm Exam Schedule Revised"
              required
              disabled={actionLoading}
            />

            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                value={formPriority}
                label="Priority"
                onChange={(e) => setFormPriority(e.target.value as any)}
                disabled={actionLoading}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={5}
              label="Notice Message"
              value={formMessage}
              onChange={(e) => setFormMessage(e.target.value)}
              placeholder="Enter details of the announcement..."
              required
              disabled={actionLoading}
            />
          </DialogContent>
          <Divider sx={{ opacity: 0.08 }} />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenCreate(false)} color="inherit" disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={actionLoading || !formTitle.trim() || !formMessage.trim()}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Publish Notice
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NoticeBoard;
