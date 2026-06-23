import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { seedLocalDb } from './firebase/dbSeeder';
import { useThemeStore } from './store/themeStore';
import { getAppTheme } from './theme';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

// Lazy load authentication views
const AuthLanding = React.lazy(() => import('./pages/AuthLanding').then(m => ({ default: m.AuthLanding })));
const StudentLogin = React.lazy(() => import('./pages/StudentLogin').then(m => ({ default: m.StudentLogin })));
const StudentRegister = React.lazy(() => import('./pages/StudentRegister').then(m => ({ default: m.StudentRegister })));
const FacultyLogin = React.lazy(() => import('./pages/FacultyLogin').then(m => ({ default: m.FacultyLogin })));
const FacultyRegister = React.lazy(() => import('./pages/FacultyRegister').then(m => ({ default: m.FacultyRegister })));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminRegister = React.lazy(() => import('./pages/AdminRegister').then(m => ({ default: m.AdminRegister })));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));

// Lazy load portal dashboard panels
const StudentDashboard = React.lazy(() => import('./pages/Dashboards').then(m => ({ default: m.StudentDashboard })));
const FacultyDashboard = React.lazy(() => import('./pages/Dashboards').then(m => ({ default: m.FacultyDashboard })));
const AdminDashboard = React.lazy(() => import('./pages/Dashboards').then(m => ({ default: m.AdminDashboard })));

// Lazy load helper workspaces
const MySessions = React.lazy(() => import('./pages/MySessions').then(m => ({ default: m.MySessions })));
const CreateSession = React.lazy(() => import('./pages/CreateSession').then(m => ({ default: m.CreateSession })));
const QrDisplay = React.lazy(() => import('./pages/QrDisplay').then(m => ({ default: m.QrDisplay })));
const QrScan = React.lazy(() => import('./pages/QrScan').then(m => ({ default: m.QrScan })));
const AttendanceAnalytics = React.lazy(() => import('./pages/AttendanceAnalytics').then(m => ({ default: m.AttendanceAnalytics })));
const MarkAttendance = React.lazy(() => import('./pages/MarkAttendance').then(m => ({ default: m.MarkAttendance })));
const AssignmentsManage = React.lazy(() => import('./pages/AssignmentsManage').then(m => ({ default: m.AssignmentsManage })));
const AssignmentsView = React.lazy(() => import('./pages/AssignmentsView').then(m => ({ default: m.AssignmentsView })));
const AdminCrud = React.lazy(() => import('./pages/AdminCrud').then(m => ({ default: m.AdminCrud })));
const TimetableGenerator = React.lazy(() => import('./pages/TimetableGenerator').then(m => ({ default: m.TimetableGenerator })));
const FacultyReportDashboard = React.lazy(() => import('./pages/FacultyReportDashboard').then(m => ({ default: m.FacultyReportDashboard })));
const ReportForm = React.lazy(() => import('./pages/ReportForm').then(m => ({ default: m.ReportForm })));
const StudentReportView = React.lazy(() => import('./pages/StudentReportView').then(m => ({ default: m.StudentReportView })));
const InAppChat = React.lazy(() => import('./pages/InAppChat').then(m => ({ default: m.InAppChat })));
const NoticeBoard = React.lazy(() => import('./pages/NoticeBoard').then(m => ({ default: m.NoticeBoard })));
const LostFound = React.lazy(() => import('./pages/LostFound').then(m => ({ default: m.LostFound })));

// Instant micro-loader UI spinner
const LoadingFallback: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
    <CircularProgress size={40} color="primary" />
  </Box>
);

// Router Dispatcher to forward users to their target dashboard route
const RootDashboardDispatcher: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'faculty':
      return <Navigate to="/faculty/dashboard" replace />;
    case 'student':
    default:
      return <Navigate to="/student/dashboard" replace />;
  }
};

const AppContent: React.FC = () => {
  const { themeMode } = useThemeStore();
  const activeTheme = getAppTheme(themeMode);
  const { user, loading } = useAuth();

  React.useEffect(() => {
    seedLocalDb();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={activeTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'background.default' }}>
          <CircularProgress color="primary" size={50} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <CssBaseline />
      <Router>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Credentials Pages */}
            <Route path="/student/login" element={<StudentLogin />} />
            <Route path="/student/register" element={<StudentRegister />} />
            <Route path="/faculty/login" element={<FacultyLogin />} />
            <Route path="/faculty/register" element={<FacultyRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Default Route Forwarder or Guest Landing */}
            <Route
              path="/"
              element={
                user ? (
                  <RootDashboardDispatcher />
                ) : (
                  <AuthLanding />
                )
              }
            />

            {/* Role-Specific Isolated Dashboard Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout>
                    <StudentDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/dashboard"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <DashboardLayout>
                    <FacultyDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Attendance Session Managers */}
            <Route
              path="/attendance/sessions"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <MySessions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/sessions/create"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <CreateSession />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/sessions/qr/:id"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <QrDisplay />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/scan"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout>
                    <QrScan />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/analytics"
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <AttendanceAnalytics />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance/mark"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <MarkAttendance />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Course Assignments */}
            <Route
              path="/assignments/manage"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <AssignmentsManage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assignments/view"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout>
                    <AssignmentsView />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Administrative Management */}
            <Route
              path="/admin/crud"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminCrud />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/timetable"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <TimetableGenerator />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/view"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout>
                    <StudentReportView />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/manage"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <FacultyReportDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/create"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <ReportForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/edit/:id"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <ReportForm />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Utilities */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <InAppChat />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notices"
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <NoticeBoard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lost-found"
              element={
                <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <LostFound />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
