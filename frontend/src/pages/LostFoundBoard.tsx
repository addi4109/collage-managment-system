import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ForumIcon from '@mui/icons-material/Forum';
import { useAuthStore } from '../store/authStore';
import {
  getLostFound,
  deleteLostFound,
  updateLostFound,
  addReply,
  LostFoundItem,
} from '../services/lostFoundService';
import { useToast } from '../context/ToastContext';

export const LostFoundBoard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');

  // Reply States (keyed by item ID)
  const [replyMessages, setReplyMessages] = useState<{ [key: string]: string }>({});
  const [replyContacts, setReplyContacts] = useState<{ [key: string]: string }>({});
  const [replySubmitting, setReplySubmitting] = useState<{ [key: string]: boolean }>({});

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await getLostFound();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteLostFound(id);
      toast.success('Entry deleted successfully.');
      fetchItems();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete entry.');
    }
  };

  const handleToggleStatus = async (item: LostFoundItem) => {
    const nextStatus = item.status === 'active' ? 'resolved' : 'active';
    try {
      await updateLostFound(item._id, { status: nextStatus });
      toast.success(`Item status updated to ${nextStatus}.`);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update item status.');
    }
  };

  const handleSendReply = async (itemId: string) => {
    const msg = replyMessages[itemId] || '';
    const contact = replyContacts[itemId] || '';

    if (!msg.trim()) {
      toast.error('Reply message cannot be empty.');
      return;
    }

    try {
      setReplySubmitting((prev) => ({ ...prev, [itemId]: true }));
      await addReply(itemId, { message: msg.trim(), contactInfo: contact.trim() });
      toast.success('Reply message sent to faculty!');
      setReplyMessages((prev) => ({ ...prev, [itemId]: '' }));
      setReplyContacts((prev) => ({ ...prev, [itemId]: '' }));
      fetchItems(); // Reload to reflect any visual status
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to send reply.');
    } finally {
      setReplySubmitting((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const isOwnerOrAdmin = (item: LostFoundItem) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return item.createdBy === user.uid;
  };

  const canCreate = user?.role === 'faculty' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Lost & Found Board
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Locate lost possessions or post discovered objects to assist students and staff.
          </Typography>
        </Box>
        {canCreate && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/lostfound/create')}
            sx={{ boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
          >
            Create Entry
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by title, description, or location..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['All', 'Lost', 'Found'].map((type) => (
              <Chip
                key={type}
                label={type === 'All' ? 'All Items' : type}
                clickable
                color={selectedType === type.toLowerCase() || (type === 'All' && selectedType === 'all') ? 'primary' : 'default'}
                onClick={() => setSelectedType(type === 'All' ? 'all' : (type.toLowerCase() as any))}
                sx={{
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Board List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)', bgcolor: '#111827' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <HelpOutlineIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No entries found on the board.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => {
            const isResolved = item.status === 'resolved';
            const isLost = item.type === 'lost';
            const owner = isOwnerOrAdmin(item);

            return (
              <Grid item xs={12} key={item._id}>
                <Card
                  sx={{
                    bgcolor: '#111827',
                    border: '1px solid rgba(255,255,255,0.06)',
                    opacity: isResolved ? 0.7 : 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.light',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={item.type.toUpperCase()}
                          size="small"
                          color={isLost ? 'error' : 'success'}
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={(item.status || 'active').toUpperCase()}
                          size="small"
                          variant="outlined"
                          color={isResolved ? 'default' : 'primary'}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 14 }} />
                          {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        {item.location && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1.5 }}>
                            <LocationOnIcon sx={{ fontSize: 14 }} />
                            {item.location}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    <Grid container spacing={3}>
                      {/* Left: Content info */}
                      <Grid item xs={12} md={item.imageUrl ? 9 : 12}>
                        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5, textDecoration: isResolved ? 'line-through' : 'none' }}>
                          {item.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {item.description}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          Posted by: {item.createdByName}
                        </Typography>
                      </Grid>

                      {/* Right: Optional Image Preview */}
                      {item.imageUrl && (
                        <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <Box
                            component="img"
                            src={item.imageUrl}
                            alt="Item"
                            sx={{
                              maxWidth: '100%',
                              maxHeight: 140,
                              borderRadius: 1.5,
                              border: '1px solid rgba(255,255,255,0.08)',
                              objectFit: 'cover',
                            }}
                          />
                        </Grid>
                      )}
                    </Grid>

                    {/* Owner controls */}
                    {owner && (
                      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title={isResolved ? 'Mark as Active' : 'Mark as Resolved'}>
                          <IconButton
                            size="small"
                            color={isResolved ? 'default' : 'success'}
                            onClick={() => handleToggleStatus(item)}
                          >
                            <CheckCircleIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Post">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => navigate(`/lostfound/edit/${item._id}`)}
                          >
                            <EditIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Entry">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(item._id)}
                          >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}

                    {/* Student Reply Form (Only active objects) */}
                    {isStudent && !isResolved && (
                      <Box sx={{ mt: 3, pt: 2.5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Message regarding this item
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Message"
                              value={replyMessages[item._id] || ''}
                              onChange={(e) => setReplyMessages((prev) => ({ ...prev, [item._id]: e.target.value }))}
                              placeholder="I think I saw this item in..."
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Contact (Phone/Email)"
                                value={replyContacts[item._id] || ''}
                                onChange={(e) => setReplyContacts((prev) => ({ ...prev, [item._id]: e.target.value }))}
                                placeholder="Optional"
                              />
                              <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => handleSendReply(item._id)}
                                disabled={replySubmitting[item._id] || !(replyMessages[item._id] || '').trim()}
                                startIcon={replySubmitting[item._id] ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                              >
                                Send
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}

                    {/* Faculty Replies Log (Grouped replies under posts) */}
                    {owner && item.replies && item.replies.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Accordion sx={{ bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 1.5, overflow: 'hidden' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ForumIcon color="primary" sx={{ fontSize: 18 }} />
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                Student Replies ({item.replies.length})
                              </Typography>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {item.replies.map((reply, ridx) => (
                              <Paper key={ridx} sx={{ p: 2, bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Avatar sx={{ bgcolor: 'secondary.main', width: 24, height: 24, fontSize: '0.7rem' }}>
                                      {reply.studentName.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                      {reply.studentName}
                                    </Typography>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(reply.createdAt).toLocaleDateString()} at {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                                  {reply.message}
                                </Typography>
                                {reply.contactInfo && (
                                  <Typography variant="caption" color="secondary.light" sx={{ display: 'block', fontWeight: 600 }}>
                                    Contact Info: {reply.contactInfo}
                                  </Typography>
                                )}
                              </Paper>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default LostFoundBoard;
