import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Button,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Folder as FolderIcon,
  Hearing as HearingIcon,
  Chat as ChatIcon,
  Assessment as AssessmentIcon,
  Slideshow as SlideshowIcon,
  Settings as SettingsIcon,
  ExitToApp as ExitToAppIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 280;

const Sidebar = () => {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = isManager
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/manager-dashboard' },
        { text: 'Task Board', icon: <AssignmentIcon />, path: '/tasks' },
        { text: 'Documents Center', icon: <FolderIcon />, path: '/documents' },
        { text: 'Meeting Intelligence', icon: <HearingIcon />, path: '/meetings' },
        { text: 'AI Assistant', icon: <ChatIcon />, path: '/assistant' },
        { text: 'AI PPT Generator', icon: <SlideshowIcon />, path: '/ppt-generator' },
        { text: 'Reports Center', icon: <AssessmentIcon />, path: '/reports' },
      ]
    : [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee-dashboard' },
        { text: 'My Tasks', icon: <AssignmentIcon />, path: '/tasks' },
        { text: 'Company Library', icon: <FolderIcon />, path: '/documents' },
        { text: 'AI Assistant', icon: <ChatIcon />, path: '/assistant' },
      ];

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#111827',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        },
      }}
    >
      <Box>
        {/* Title logo branding */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            E
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#f9fafb' }}>
              ExcueAI
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem', fontWeight: 600 }}>
              ENTERPRISE WORKSPACE
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ opacity: 0.1, my: 1 }} />

        {/* User Card */}
        <Box sx={{ p: 2.5, mx: 2, my: 1.5, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: isManager ? 'primary.main' : 'secondary.main', width: 40, height: 40, fontWeight: 700 }}>
            {user?.name ? user.name[0] : 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#f9fafb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>

        {/* Menu Navigation */}
        <List sx={{ px: 1.5 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    px: 2,
                    backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                    color: isActive ? '#818cf8' : '#9ca3af',
                    borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      color: '#f9fafb',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isActive ? '#818cf8' : '#6b7280',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.925rem',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Footer controls */}
      <Box sx={{ p: 2 }}>
        <List sx={{ p: 0 }}>
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavigate('/settings')}
              sx={{
                borderRadius: 2,
                color: location.pathname === '/settings' ? '#818cf8' : '#9ca3af',
                backgroundColor: location.pathname === '/settings' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.02)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: location.pathname === '/settings' ? '#818cf8' : '#6b7280' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: '0.925rem' }} />
            </ListItemButton>
          </ListItem>
        </List>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<ExitToAppIcon />}
          onClick={logout}
          sx={{
            py: 1,
            borderRadius: 2,
            borderColor: 'rgba(244, 63, 94, 0.2)',
            color: '#f43f5e',
            '&:hover': {
              backgroundColor: 'rgba(244, 63, 94, 0.05)',
              borderColor: '#f43f5e',
            },
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
