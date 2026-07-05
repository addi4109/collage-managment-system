import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import createAppTheme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Pages & Components (we will create these next)
import AuthLanding from './pages/AuthLanding';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import HodDashboard from './pages/HodDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to protect pages based on role permissions
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null; // let startup me check run

  if (!user) {
    return <Navigate to="/portal" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

function MainApp() {
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('themeMode', nextMode);
  };

  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routing */}
          <Route path="/portal" element={<AuthLanding mode={mode} toggleTheme={toggleTheme} />} />
          <Route path="/login/:role" element={<Login mode={mode} toggleTheme={toggleTheme} />} />
          
          {/* Protected Role Layout Container */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout mode={mode} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            }
          >
            {/* Scoped Dashboard views dynamically redirected */}
            <Route
              path="faculty"
              element={
                <ProtectedRoute allowedRoles={['faculty']}>
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="hod"
              element={
                <ProtectedRoute allowedRoles={['hod']}>
                  <HodDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="principal"
              element={
                <ProtectedRoute allowedRoles={['principal']}>
                  <PrincipalDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Error and Fallback Routing */}
          <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
