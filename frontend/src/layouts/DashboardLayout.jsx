import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Badge,
  Popover,
  Card,
  Chip,
  Button,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AssignmentIcon from '@mui/icons-material/Assignment';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CampaignIcon from '@mui/icons-material/Campaign';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HelpIcon from '@mui/icons-material/Help';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';

import { useAuth, api } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const drawerWidth = 260;

export default function DashboardLayout({ mode, toggleTheme }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Notification States
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadCountRef = useRef(0);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleProfileMenuClose();
    await logout();
    showToast('Logged out successfully.', 'info');
    navigate('/portal');
  };

  // Load real notifications from backend
  const loadNotifications = async (isFirstLoad = false) => {
    try {
      const res = await api.get('/notifications');
      const newNotifications = res.data;
      const newUnread = newNotifications.filter(n => !n.read);
      const newCount = newUnread.length;

      setNotifications(newNotifications);
      setUnreadCount(newCount);

      if (!isFirstLoad && newCount > prevUnreadCountRef.current) {
        const latest = newUnread[0];
        if (latest) {
          showToast(`🔔 New announcement: ${latest.title}`, 'info');
        }
      }
      prevUnreadCountRef.current = newCount;
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      prevUnreadCountRef.current = Math.max(0, prevUnreadCountRef.current - 1);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications(true);
    
    // Poll notifications every 30 seconds for live updates
    const interval = setInterval(() => loadNotifications(false), 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleNotifOpen = (e) => setNotifAnchor(e.currentTarget);
  const handleNotifClose = () => setNotifAnchor(null);
  
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      showToast('Failed to mark notifications as read.', 'error');
    }
  };

  // Automatically redirect based on role if at root dashboard route
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      if (user) {
        navigate(`/dashboard/${user.role}`);
      }
    }
  }, [location, user, navigate]);

  // Sidebar Menu Scoping
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: `/dashboard/${user?.role}` },
  ];

  if (user?.role === 'admin') {
    menuItems.push(
      { text: 'Faculty Management', icon: <PeopleIcon />, path: `/dashboard/admin?tab=faculty` },
      { text: 'Admission Approvals', icon: <ReceiptIcon />, path: `/dashboard/admin?tab=admissions` },
      { text: 'Result Declaration', icon: <QueryStatsIcon />, path: `/dashboard/admin?tab=results` },
      { text: 'Exam Approvals', icon: <AssignmentIcon />, path: `/dashboard/admin?tab=exams` },
      { text: 'Subject Directory', icon: <MenuBookIcon />, path: `/dashboard/admin?tab=subjects` },
      { text: 'Notice Board', icon: <CampaignIcon />, path: `/dashboard/admin?tab=notices` },
      { text: 'Academic Calendar', icon: <CalendarMonthIcon />, path: `/dashboard/admin?tab=calendar` },
      { text: 'Fee Structures & Invoices', icon: <ReceiptIcon />, path: `/dashboard/admin?tab=fees` },
      { text: 'Placement Drives', icon: <BusinessCenterIcon />, path: `/dashboard/admin?tab=placements` },
      { text: 'Grievance Resolver', icon: <ReportProblemIcon />, path: `/dashboard/admin?tab=complaints` },
      { text: 'Library Ledger', icon: <LibraryBooksIcon />, path: `/dashboard/admin?tab=library` },
      { text: 'Scholarship Approver', icon: <CardGiftcardIcon />, path: `/dashboard/admin?tab=scholarships` },
      { text: 'Send Notifications', icon: <NotificationsIcon />, path: `/dashboard/admin?tab=notifications` },
      { text: 'System Audit Logs', icon: <SecurityIcon />, path: `/dashboard/admin?tab=audit` }
    );
  } else if (user?.role === 'faculty') {
    menuItems.push(
      { text: 'Student CRUD', icon: <PeopleIcon />, path: `/dashboard/faculty?tab=students` },
      { text: 'Mark Attendance', icon: <QrCodeIcon />, path: `/dashboard/faculty?tab=attendance` },
      { text: 'Create MCQ Exams', icon: <AssignmentIcon />, path: `/dashboard/faculty?tab=exams` },
      { text: 'Enter Grade Sheets', icon: <ReceiptIcon />, path: `/dashboard/faculty?tab=results` },
      { text: 'Admissions Intake', icon: <PeopleIcon />, path: `/dashboard/faculty?tab=admissions` },
      { text: 'Assignments', icon: <AssignmentIcon />, path: `/dashboard/faculty?tab=assignments` },
      { text: 'Notice Board', icon: <CampaignIcon />, path: `/dashboard/faculty?tab=notices` },
      { text: 'Academic Calendar', icon: <CalendarMonthIcon />, path: `/dashboard/faculty?tab=calendar` },
      { text: 'Monthly Reports Entry', icon: <AssessmentIcon />, path: `/dashboard/faculty?tab=monthly-reports` },
      { text: 'Placement Drives', icon: <BusinessCenterIcon />, path: `/dashboard/faculty?tab=placements` },
      { text: 'Complaints Received', icon: <ReportProblemIcon />, path: `/dashboard/faculty?tab=complaints` },
      { text: 'Library Catalog', icon: <LibraryBooksIcon />, path: `/dashboard/faculty?tab=library` },
      { text: 'Send Notifications', icon: <NotificationsIcon />, path: `/dashboard/faculty?tab=notifications` }
    );
  } else if (user?.role === 'student') {
    menuItems.push(
      { text: 'Scan Attendance', icon: <QrCodeIcon />, path: `/dashboard/student?tab=attendance` },
      { text: 'MCQ Test Client', icon: <AssignmentIcon />, path: `/dashboard/student?tab=exams` },
      { text: 'My Sem Marksheet', icon: <ReceiptIcon />, path: `/dashboard/student?tab=results` },
      { text: 'Submit Request', icon: <CampaignIcon />, path: `/dashboard/student?tab=applications` },
      { text: 'My Assignments', icon: <AssignmentIcon />, path: `/dashboard/student?tab=assignments` },
      { text: 'Notice Board', icon: <CampaignIcon />, path: `/dashboard/student?tab=notices` },
      { text: 'Academic Calendar', icon: <CalendarMonthIcon />, path: `/dashboard/student?tab=calendar` },
      { text: 'Performance Reports', icon: <AssessmentIcon />, path: `/dashboard/student?tab=monthly-reports` },
      { text: 'Fees & Receipts', icon: <ReceiptIcon />, path: `/dashboard/student?tab=fees` },
      { text: 'Career Placements', icon: <BusinessCenterIcon />, path: `/dashboard/student?tab=placements` },
      { text: 'Helpdesk Grievance', icon: <ReportProblemIcon />, path: `/dashboard/student?tab=complaints` },
      { text: 'My Library Lends', icon: <LibraryBooksIcon />, path: `/dashboard/student?tab=library` },
      { text: 'My Scholarships', icon: <CardGiftcardIcon />, path: `/dashboard/student?tab=scholarships` }
    );
  }

  // Common menus
  menuItems.push(
    { text: 'Weekly Timetables', icon: <CalendarMonthIcon />, path: `/dashboard/${user?.role}?tab=timetable` },
    { text: 'Lost & Found Board', icon: <HelpIcon />, path: `/dashboard/${user?.role}?tab=lostfound` },
    { text: 'Contact Us', icon: <ContactSupportIcon />, path: `/dashboard/${user?.role}?tab=contact` }
  );

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, bgcolor: 'primary.main', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>C</Box>
          CollegeERP
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* Dynamic Scoped Sidebar Nav list */}
      <List sx={{ px: 2, py: 3, flexGrow: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname + location.search === item.path || (item.text === 'Dashboard' && location.pathname === item.path);
          return (
            <ListItem key={index} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '12px',
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? '#fff' : 'text.primary',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? '#fff' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 500 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      {/* Current User Profile bottom widget */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'action.hover' }}>
        <Avatar sx={{ bgcolor: 'secondary.main' }}>{user?.name?.[0]}</Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>{user?.name}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {user?.role}
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout} sx={{ ml: 'auto' }}>
          <LogoutIcon size="small" />
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ px: 3, display: 'flex', justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 700, textTransform: 'capitalize' }}>
            {location.search ? location.search.split('=')[1].replace('_', ' ') + ' Portal' : user?.role + ' Portal'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme switcher */}
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>

            {/* Notifications Menu Trigger */}
            <IconButton color="inherit" onClick={handleNotifOpen}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={handleNotifClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { p: 2, width: 320, borderRadius: '16px' } }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Notifications</Typography>
                {unreadCount > 0 && (
                  <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }} onClick={markAllAsRead}>
                    Mark all read
                  </Typography>
                )}
              </Box>
              <Divider sx={{ mb: 1 }} />
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>No new notifications.</Typography>
              ) : (
                <List disablePadding>
                  {notifications.map((n) => (
                    <ListItem
                      key={n._id || n.id}
                      disablePadding
                      onClick={() => !n.read && handleMarkAsRead(n._id || n.id)}
                      sx={{
                        mb: 1,
                        bgcolor: n.read ? 'transparent' : 'action.hover',
                        borderRadius: '8px',
                        p: 1,
                        cursor: n.read ? 'default' : 'pointer',
                        '&:hover': {
                          bgcolor: n.read ? 'transparent' : 'action.selected',
                        }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{n.title}</Typography>
                          {!n.read && <Box sx={{ width: 6, height: 6, bgcolor: 'error.main', borderRadius: '50%' }} />}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{n.message}</Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Popover>

            <IconButton onClick={handleProfileMenuOpen}>
              <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem', bgcolor: 'primary.main' }}>
                {user?.name?.[0]}
              </Avatar>
            </IconButton>

            <Popover
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  width: 320,
                  borderRadius: '24px',
                  boxShadow: '0px 10px 40px rgba(0,0,0,0.12)',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 1.5,
                }
              }}
            >
              {/* Header Gradient */}
              <Box sx={{
                height: 80,
                background: 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                color: '#fff',
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1.5 }}>
                  EDUTECH HUB
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem', letterSpacing: 1 }}>
                  OFFICIAL IDENTITY CARD
                </Typography>
              </Box>

              {/* Avatar section */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: '-40px', mb: 1 }}>
                <Avatar sx={{
                  width: 80,
                  height: 80,
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  bgcolor: 'secondary.main',
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}>
                  {user?.name?.[0]}
                </Avatar>
              </Box>

              {/* Identity details */}
              <Box sx={{ px: 3, pb: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {user?.username}
                </Typography>
                <Chip
                  label={user?.role?.toUpperCase()}
                  size="small"
                  color={user?.role === 'admin' ? 'secondary' : user?.role === 'faculty' ? 'success' : 'primary'}
                  sx={{ fontWeight: 'bold', mb: 2, px: 1 }}
                />

                <Divider sx={{ my: 1.5 }} />

                {/* Role specific ID details */}
                <Box sx={{
                  bgcolor: 'action.hover',
                  borderRadius: '16px',
                  p: 2,
                  textAlign: 'left',
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  {user?.role === 'student' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Roll Number</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{user?.rollNumber || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Enrollment</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{user?.enrollmentNumber || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Department</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.departmentName || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Semester / Year</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {user?.semester || 'N/A'} ({user?.year || 'N/A'})
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {user?.role === 'faculty' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Employee ID</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>{user?.employeeId || 'N/A'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="caption" color="text.secondary">Departments</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(user?.assignedDepartmentDetails || []).map(d => d.name).join(', ') || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Assigned Years</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          {user?.assignedYears?.join(', ') || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {user?.role === 'admin' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Designation</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>System Administrator</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Access Scope</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Full Access Control</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Barcode Simulator */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', gap: '2px', height: 30, alignItems: 'stretch', mb: 0.5, opacity: 0.85 }}>
                    {[1, 3, 1, 2, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3].map((width, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: `${width}px`,
                          bgcolor: 'text.primary',
                          borderRadius: '0.5px',
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: '0.65rem' }}>
                    {user?.id ? `UID-${user.id.substring(0, 8).toUpperCase()}` : 'UID-MEMBER'}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Logout Action at the bottom */}
              <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  sx={{ borderRadius: '12px', py: 1, fontWeight: 'bold' }}
                >
                  Logout from Session
                </Button>
              </Box>
            </Popover>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Components (Mobile & Desktop) */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
        >
          {drawerContent}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid', borderColor: 'divider' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Outer Content Layout Container */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
