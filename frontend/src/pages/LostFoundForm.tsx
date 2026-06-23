import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  createLostFound,
  updateLostFound,
  getLostFound,
} from '../services/lostFoundService';
import { useToast } from '../context/ToastContext';

export const LostFoundForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10)); // Default current date in YYYY-MM-DD
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState<'active' | 'resolved'>('active');

  useEffect(() => {
    const loadTarget = async () => {
      if (!isEditMode || !id) return;
      try {
        setLoading(true);
        const list = await getLostFound();
        const target = list.find((item) => item._id === id);

        if (target) {
          setTitle(target.title);
          setDescription(target.description);
          setType(target.type);
          setLocation(target.location || '');
          setDate(new Date(target.date).toISOString().substring(0, 10));
          setImageUrl(target.imageUrl || '');
          setStatus(target.status || 'active');
        } else {
          toast.error('Post entry not found.');
          navigate('/lostfound');
        }
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to load entry details.');
      } finally {
        setLoading(false);
      }
    };

    loadTarget();
  }, [id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !date) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        date: new Date(date).toISOString(),
        imageUrl: imageUrl.trim(),
        status,
      };

      if (isEditMode && id) {
        await updateLostFound(id, payload);
        toast.success('Lost & Found entry updated successfully.');
      } else {
        await createLostFound(payload);
        toast.success('Lost & Found entry published.');
      }

      navigate('/lostfound');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit post.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/lostfound')}
        sx={{ mb: 3 }}
        color="inherit"
      >
        Back to Board
      </Button>

      <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800, mb: 1 }}>
        {isEditMode ? 'Edit Lost & Found Post' : 'Create Lost & Found Entry'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Input the details of the item found or missing around the campus.
      </Typography>

      <Card sx={{ bgcolor: '#111827', border: '1px solid rgba(255,255,255,0.06)', maxWidth: 600 }}>
        <CardContent sx={{ p: 4 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TextField
              fullWidth
              label="Item Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Blue Hydro Flask Water Bottle"
              required
              disabled={submitting}
            />

            <FormControl fullWidth>
              <InputLabel id="type-select-label">Type</InputLabel>
              <Select
                labelId="type-select-label"
                value={type}
                label="Type"
                onChange={(e) => setType(e.target.value as any)}
                disabled={submitting}
              >
                <MenuItem value="lost">Lost</MenuItem>
                <MenuItem value="found">Found</MenuItem>
              </Select>
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="E.g., Room 402 / Cafeteria"
                  disabled={submitting}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  disabled={submitting}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Optional image link or reference"
              disabled={submitting}
            />

            {isEditMode && (
              <FormControl fullWidth>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={status}
                  label="Status"
                  onChange={(e) => setStatus(e.target.value as any)}
                  disabled={submitting}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description Details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the item..."
              required
              disabled={submitting}
            />

            <Divider sx={{ opacity: 0.08, my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={() => navigate('/lostfound')} color="inherit" disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitting || !title.trim() || !description.trim() || !date}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              >
                {isEditMode ? 'Update Entry' : 'Create Entry'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LostFoundForm;
