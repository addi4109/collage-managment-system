import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Divider,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import InfoIcon from '@mui/icons-material/Info';
import { useToast } from '../context/ToastContext';

export default function ContactSupportTab() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    category: 'General Inquiry',
    subject: '',
    message: '',
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    // Simulate support ticket creation
    setTimeout(() => {
      showToast('Technical support ticket submitted successfully. We will contact you soon.', 'success');
      setForm({
        category: 'General Inquiry',
        subject: '',
        message: '',
      });
      setSubmitLoading(false);
    }, 1000);
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Technical Support & Helpdesk
      </Typography>

      <Grid container spacing={4}>
        {/* Left Side: Developer and Manager Contact Info Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            {/* Header branding */}
            <Box sx={{
              height: 100,
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              display: 'flex',
              alignItems: 'center',
              px: 3,
              color: '#fff',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                System Management Desk
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Profile section of manager/developer */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                  <PersonIcon sx={{ fontSize: '2rem' }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Aditya Sawant
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Lead Full Stack Developer & System Manager
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Information Rows */}
              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <EmailIcon color="primary" sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Email Address</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>adityasawant4109@gmail.com</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <PhoneIcon color="primary" sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Helpline</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>+91 95523 65738</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <LocationOnIcon color="primary" sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Office Desk</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Vikasnagar, Satara, Maharashtra</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <AccessTimeIcon color="primary" sx={{ mt: 0.2 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">Support Availability</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Mon - Sat: 9:00 AM to 5:00 PM</Typography>
                  </Box>
                </Box>
              </Stack>

              {/* Support Notice */}
              <Paper sx={{ mt: 4, p: 2, bgcolor: 'action.hover', borderRadius: '12px', border: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5 }}>
                <InfoIcon color="info" size="small" />
                <Typography variant="caption" color="text.secondary">
                  For severe portal access issues or database errors, please contact Aditya Sawant directly via phone or email for immediate escalation.
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Contact / Issue Submission Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{
            borderRadius: '24px',
            border: '1px solid',
            borderColor: 'divider',
            p: 4,
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Submit a Technical Issue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Describe the bug, crash, or data mismatch you are facing. Our technical team will review the issue and get back to you shortly.
            </Typography>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Issue Category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {['Login/Authentication', 'Grading/Marks Entry', 'Attendance Scanner', 'Notification System', 'Academic Calendar', 'Other Portal Bug'].map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Subject"
                    placeholder="Short description of the issue"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    multiline
                    minRows={5}
                    label="Detailed Description"
                    placeholder="Provide details about what you were doing when the issue occurred and any error messages shown..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitLoading}
                    startIcon={<SendIcon />}
                    sx={{ borderRadius: '12px', px: 4 }}
                  >
                    Submit Support Ticket
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
