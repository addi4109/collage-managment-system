import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BarChartIcon from '@mui/icons-material/BarChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuthStore } from '../store/authStore';
import { logoutUser } from '../services/authService';
import { AiChatbotBubble } from './AiChatbotBubble';
import ForumIcon from '@mui/icons-material/Forum';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ChatIcon from '@mui/icons-material/Chat';
import { useThemeStore } from '../store/themeStore';
import { useToast } from '../context/ToastContext';

const drawerWidth = 240;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, clearState } = useAuthStore();
  const { themeMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearState();
      toast.success('You have been logged out successfully.');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      clearState();
      toast.success('You have been logged out successfully.');
      navigate('/');
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#111827' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <SchoolIcon color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h6" className="gradient-text" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
          EduTech Hub
        </Typography>
      </Toolbar>
      <Divider sx={{ opacity: 0.1 }} />
      
      {/* User Info Quick Badge */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ bgcolor: user?.role === 'admin' ? 'warning.main' : user?.role === 'faculty' ? 'secondary.main' : 'primary.main', fontWeight: 'bold' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 'bold', fontSize: '0.65rem' }}>
            {user?.role || 'Role'}
          </Typography>
        </Box>
      </Box>
      <Divider sx={{ opacity: 0.1, mb: 2 }} />

      <List sx={{ px: 1 }}>
        {/* Common Dashboard link */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (user?.role === 'admin') navigate('/admin/dashboard');
              else if (user?.role === 'faculty') navigate('/faculty/dashboard');
              else navigate('/student/dashboard');
            }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DashboardIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Student Specific Links */}
        {user?.role === 'student' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/attendance/scan')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <QrCodeScannerIcon color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Scan QR Code" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/assignments/view')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Assignments" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/reports')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssessmentIcon color="info" />
                </ListItemIcon>
                <ListItemText primary="My Reports" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Faculty Specific Links */}
        {user?.role === 'faculty' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/attendance/generate')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <QrCodeScannerIcon color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Generate QR Code" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/assignments/manage')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Manage Assignments" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/reports')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssessmentIcon color="info" />
                </ListItemIcon>
                <ListItemText primary="Generate Reports" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Admin Specific Links */}
        {user?.role === 'admin' && (
          <>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/attendance/generate')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <QrCodeScannerIcon color="secondary" />
                </ListItemIcon>
                <ListItemText primary="Generate QR Code" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/assignments/manage')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssignmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Manage Assignments" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/admin/crud')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AdminPanelSettingsIcon color="warning" />
                </ListItemIcon>
                <ListItemText primary="Manage Users" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/admin/timetable')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CalendarTodayIcon color="success" />
                </ListItemIcon>
                <ListItemText primary="Schedule Timetable" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                onClick={() => navigate('/reports')}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AssessmentIcon color="info" />
                </ListItemIcon>
                <ListItemText primary="Generate Reports" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          </>
        )}

        {/* Attendance Analytics (All Roles) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/attendance/analytics')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <BarChartIcon color="warning" />
            </ListItemIcon>
            <ListItemText primary="Attendance Stats" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Direct Chat (All Roles) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/chat')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ChatIcon color="secondary" />
            </ListItemIcon>
            <ListItemText primary="In-App Chat" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Discussion Forum (All Roles) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/forum')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <ForumIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Discussion Board" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>

        {/* Lost & Found (All Roles) */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/lost-found')}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <HelpCenterIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Lost & Found" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </List>

      <Box sx={{ mt: 'auto', p: 1 }}>
        <Divider sx={{ opacity: 0.1, mb: 1 }} />
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: 'error.light',
              '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'error.light' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(11, 15, 25, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Portal Workspace
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={toggleTheme} color="inherit">
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
            <IconButton onClick={handleMenuOpen} size="small" sx={{ p: 0.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.dark',
                  fontSize: '0.95rem',
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider sx={{ my: 0.5, opacity: 0.08 }} />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.light', gap: 1 }}>
                <LogoutIcon fontSize="small" />
                Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Side Navigation Drawers */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255, 255, 255, 0.08)' },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid rgba(255, 255, 255, 0.08)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar /> {/* Top spacer */}
        <Box sx={{ flexGrow: 1, animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          {children}
        </Box>
      </Box>
      <AiChatbotBubble />
    </Box>
  );
};
export default DashboardLayout;
