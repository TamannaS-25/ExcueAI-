import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TaskManagement from './pages/TaskManagement';
import DocumentsCenter from './pages/DocumentsCenter';
import MeetingIntelligence from './pages/MeetingIntelligence';
import AIAssistant from './pages/AIAssistant';
import ReportsCenter from './pages/ReportsCenter';
import PPTGenerator from './pages/PPTGenerator';
import Settings from './pages/Settings';

// Layout Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Protected Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#0b0f19' }}>
        <Typography variant="h6">Loading workspace...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not allowed, redirect to correct landing page
    return user.role === 'Manager' 
      ? <Navigate to="/manager-dashboard" replace /> 
      : <Navigate to="/employee-dashboard" replace />;
  }

  return children;
};

// Workspace Main Layout
const WorkspaceLayout = () => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
          <Routes>
            {/* Manager specific routes */}
            <Route
              path="/manager-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ppt-generator"
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <PPTGenerator />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['Manager']}>
                  <ReportsCenter />
                </ProtectedRoute>
              }
            />
            
            {/* Employee specific routes */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute allowedRoles={['Employee']}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Common shared routes */}
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TaskManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentsCenter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings"
              element={
                <ProtectedRoute allowedRoles={['Manager', 'Employee']}>
                  <MeetingIntelligence />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <ProtectedRoute>
                  <AIAssistant />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Landing redirect */}
            <Route
              path="*"
              element={
                <Navigate to="/" replace />
              }
            />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return null;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return user.role === 'Manager' 
    ? <Navigate to="/manager-dashboard" replace /> 
    : <Navigate to="/employee-dashboard" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />
            <Route path="/*" element={<WorkspaceLayout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
