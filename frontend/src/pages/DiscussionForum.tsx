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
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuthStore } from '../store/authStore';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Assignments' | 'Exams' | 'Events' | 'Coding';
  authorName: string;
  authorRole: string;
  createdAt: string;
}

const DEFAULT_POSTS: ForumPost[] = [
  {
    id: 'post_1',
    title: 'Tips for preparing for the upcoming Midterm exams?',
    content: "Hi all, what are the best study strategies for the programming exams? Does the professor emphasize theory or practical coding exercises?",
    category: 'Exams',
    authorName: 'Alex Rivera',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
  },
  {
    id: 'post_2',
    title: 'Vite PWA Manifest caching configurations',
    content: "Working on setting up service workers for offline asset management. Ensure to include all image/icon resources under the assets array to cache stylesheet assets natively.",
    category: 'Coding',
    authorName: 'Dr. Sarah Jenkins',
    authorRole: 'Faculty',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: 'post_3',
    title: 'Department Coding Hackathon registration open',
    content: "The annual EduTech Hackathon is happening next Friday! Teams of up to 4. Register inside the CS Department office by Wednesday. Cash prizes for the top 3 teams!",
    category: 'Events',
    authorName: 'Emma Watson',
    authorRole: 'Student',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
];

const CATEGORIES = ['All', 'General', 'Assignments', 'Exams', 'Events', 'Coding'] as const;

export const DiscussionForum: React.FC = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Create Post Form States
  const [openCreate, setOpenCreate] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'General' | 'Assignments' | 'Exams' | 'Events' | 'Coding'>('General');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Load forum posts from localStorage in sandbox mode
    const raw = localStorage.getItem('eh_forum_posts');
    const delay = setTimeout(() => {
      if (raw) {
        setPosts(JSON.parse(raw));
      } else {
        setPosts(DEFAULT_POSTS);
        localStorage.setItem('eh_forum_posts', JSON.stringify(DEFAULT_POSTS));
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(delay);
  }, []);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('General');
    setOpenCreate(true);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim() || !user) return;
    setActionLoading(true);

    const newPost: ForumPost = {
      id: 'post_' + Date.now(),
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      authorName: user.name || 'Anonymous',
      authorRole: user.role.toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newPost, ...posts];
    
    // Simulate API delay
    setTimeout(() => {
      setPosts(updated);
      localStorage.setItem('eh_forum_posts', JSON.stringify(updated));
      setActionLoading(false);
      setOpenCreate(false);
    }, 500);
  };

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Discussion Board
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Share ideas, ask academic questions, and engage with the campus community.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
        >
          New Discussion
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                clickable
                color={selectedCategory === cat ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(cat)}
                sx={{
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Threads list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredPosts.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">No discussions found matching your filters.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredPosts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <Card sx={{ '&:hover': { borderColor: 'primary.light' } }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.dark', width: 32, height: 32, fontSize: '0.85rem' }}>
                        {post.authorName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {post.authorName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {post.authorRole}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip label={post.category} size="small" variant="outlined" color="secondary" sx={{ fontWeight: 'bold' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarTodayIcon sx={{ fontSize: 12 }} />
                        {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                    {post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {post.content}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Discussion Dialog */}
      <Dialog open={openCreate} onClose={() => !actionLoading && setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <form onSubmit={handleCreatePost}>
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <ForumIcon color="primary" />
            Start a Discussion
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Discussion Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="What would you like to ask or share?"
              required
              disabled={actionLoading}
            />

            <FormControl fullWidth>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={formCategory}
                label="Category"
                onChange={(e) => setFormCategory(e.target.value as any)}
                disabled={actionLoading}
              >
                <MenuItem value="General">General</MenuItem>
                <MenuItem value="Assignments">Assignments</MenuItem>
                <MenuItem value="Exams">Exams</MenuItem>
                <MenuItem value="Events">Events</MenuItem>
                <MenuItem value="Coding">Coding</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Content details"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Describe your question or share information..."
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
              disabled={actionLoading || !formTitle.trim() || !formContent.trim()}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Post Discussion
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
export default DiscussionForum;
