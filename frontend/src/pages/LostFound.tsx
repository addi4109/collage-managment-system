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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useAuthStore } from '../store/authStore';

interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  contactInfo: string;
  createdAt: string;
  resolved: boolean;
}

const DEFAULT_ITEMS: LostFoundItem[] = [
  {
    id: 'lf_1',
    title: 'Blue Water Bottle (Hydro Flask)',
    description: "Left in Room 402 after the math class. Has a few custom stickers on the side.",
    type: 'found',
    location: 'Room 402',
    contactInfo: 'Math Department Desk / Ext 4022',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hrs ago
    resolved: false,
  },
  {
    id: 'lf_2',
    title: 'Black leather wallet containing keys',
    description: "Lost somewhere near the student cafeteria or green lawns. Please check if anyone has found it, has student card.",
    type: 'lost',
    location: 'Cafeteria / Lawns',
    contactInfo: 'Alex Rivera (Student) - 555-0199',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20 hrs ago
    resolved: false,
  },
  {
    id: 'lf_3',
    title: 'Silver Apple iPad Pro',
    description: "Found in library study room 4. Handed over to security desk.",
    type: 'found',
    location: 'Library Room 4',
    contactInfo: 'Security Office (Main Entrance)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    resolved: true,
  },
];

export const LostFound: React.FC = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');

  // Report Item Form States
  const [openCreate, setOpenCreate] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'lost' | 'found'>('lost');
  const [formLocation, setFormLocation] = useState('');
  const [formContact, setFormContact] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Load lost & found items from localStorage in sandbox mode
    const raw = localStorage.getItem('eh_lost_found');
    const delay = setTimeout(() => {
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        setItems(DEFAULT_ITEMS);
        localStorage.setItem('eh_lost_found', JSON.stringify(DEFAULT_ITEMS));
      }
      setLoading(false);
    }, 400);
    return () => clearTimeout(delay);
  }, []);

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormType('lost');
    setFormLocation('');
    setFormContact(user?.email || '');
    setOpenCreate(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim() || !formLocation.trim() || !formContact.trim()) return;
    setActionLoading(true);

    const newItem: LostFoundItem = {
      id: 'lf_' + Date.now(),
      title: formTitle.trim(),
      description: formDescription.trim(),
      type: formType,
      location: formLocation.trim(),
      contactInfo: formContact.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    const updated = [newItem, ...items];

    setTimeout(() => {
      setItems(updated);
      localStorage.setItem('eh_lost_found', JSON.stringify(updated));
      setActionLoading(false);
      setOpenCreate(false);
    }, 500);
  };

  const handleResolveItem = (id: string) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, resolved: !item.resolved };
      }
      return item;
    });
    setItems(updated);
    localStorage.setItem('eh_lost_found', JSON.stringify(updated));
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
            Lost & Found Logs
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Report and locate missing campus items and help restore belongings.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}
        >
          Report Item
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
            placeholder="Search items, locations..."
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(['all', 'lost', 'found'] as const).map((type) => (
              <Chip
                key={type}
                label={type.toUpperCase()}
                clickable
                color={selectedType === type ? 'primary' : 'default'}
                onClick={() => setSelectedType(type)}
                sx={{
                  fontWeight: selectedType === type ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </Box>
        </Grid>
      </Grid>

      {/* Items list */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredItems.length === 0 ? (
        <Card sx={{ border: '1px dashed rgba(255,255,255,0.06)' }}>
          <CardContent sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">No lost or found items logged.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredItems.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Card
                sx={{
                  opacity: item.resolved ? 0.65 : 1,
                  borderColor: item.resolved ? 'rgba(255,255,255,0.02)' : item.type === 'lost' ? 'error.light' : 'success.light',
                  '&:hover': {
                    borderColor: item.resolved ? 'none' : item.type === 'lost' ? 'error.main' : 'success.main',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        label={item.type.toUpperCase()}
                        size="small"
                        color={item.type === 'lost' ? 'error' : 'success'}
                        sx={{ fontWeight: 'bold' }}
                      />
                      {item.resolved && (
                        <Chip
                          label="RESOLVED"
                          size="small"
                          color="default"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Typography>
                  </Box>

                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, textDecoration: item.resolved ? 'line-through' : 'none' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 2 }}>
                    Location: <strong>{item.location}</strong>
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                    {item.description}
                  </Typography>

                  <Divider sx={{ mb: 2, opacity: 0.08 }} />

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'secondary.light', fontWeight: 600 }}>
                      <PhoneIcon sx={{ fontSize: 14 }} />
                      {item.contactInfo}
                    </Typography>
                    
                    {/* Let user toggle resolve for own testing convenience */}
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={() => handleResolveItem(item.id)}
                      startIcon={item.resolved ? <HelpOutlineIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                      sx={{ borderRadius: 2 }}
                    >
                      {item.resolved ? 'Reopen' : 'Resolve'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Report Item Dialog */}
      <Dialog open={openCreate} onClose={() => !actionLoading && setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#111827' } }}>
        <form onSubmit={handleCreateItem}>
          <DialogTitle sx={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            Report Lost / Found Item
          </DialogTitle>
          <DialogContent sx={{ p: 3, mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Log Type</InputLabel>
              <Select
                labelId="type-label"
                value={formType}
                label="Log Type"
                onChange={(e) => setFormType(e.target.value as any)}
                disabled={actionLoading}
              >
                <MenuItem value="lost">LOST - I lost an item</MenuItem>
                <MenuItem value="found">FOUND - I found an item</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Item Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Leather wallet, keys chain..."
              required
              disabled={actionLoading}
            />

            <TextField
              fullWidth
              label="Location"
              value={formLocation}
              onChange={(e) => setFormLocation(e.target.value)}
              placeholder="e.g. library desk, Room 201..."
              required
              disabled={actionLoading}
            />

            <TextField
              fullWidth
              label="Contact details"
              value={formContact}
              onChange={(e) => setFormContact(e.target.value)}
              placeholder="How can someone reach you? Phone or office..."
              required
              disabled={actionLoading}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Color, brand, special marks, contents..."
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
              disabled={actionLoading || !formTitle.trim() || !formDescription.trim()}
              startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              Report Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
export default LostFound;
