import React, { useState, useEffect } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  CloudOff as OfflineIcon,
  CloudDone as OnlineIcon
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();
  const [apiKeySet, setApiKeySet] = useState(false);

  // Check if API key is present in environment or local settings mock
  useEffect(() => {
    const checkApiKey = () => {
      // Typically set in LocalStorage from our Settings panel
      const storedKey = localStorage.getItem('openai_api_key');
      setApiKeySet(!!storedKey);
    };

    checkApiKey();
    // Poll every 3 seconds to keep it reactive to Settings adjustments
    const interval = setInterval(checkApiKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/manager-dashboard':
      case '/employee-dashboard':
        return 'Overview Dashboard';
      case '/tasks':
        return 'Task Boards Workspace';
      case '/documents':
        return 'Knowledge Base Repository';
      case '/meetings':
        return 'Speech Transcription Sync';
      case '/assistant':
        return 'Excue AI Copilot';
      case '/ppt-generator':
        return 'PowerPoint Slide Generator';
      case '/reports':
        return 'Analytics Reports & Diff';
      case '/settings':
        return 'Configuration Workspace';
      default:
        return 'Enterprise Workspace';
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'rgba(11, 15, 25, 0.5)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#f9fafb', fontSize: '1.25rem' }}>
            {getPageTitle()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* AI Connection state Badge */}
          {apiKeySet ? (
            <Tooltip title="AI services connected to OpenAI API">
              <Chip
                icon={<OnlineIcon style={{ color: '#10b981', fontSize: '16px' }} />}
                label="OpenAI Active"
                size="small"
                sx={{
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="No OpenAI key set. Operating in Offline Mock AI mode (highly functional offline).">
              <Chip
                icon={<OfflineIcon style={{ color: '#f59e0b', fontSize: '16px' }} />}
                label="Simulated AI (Offline)"
                size="small"
                sx={{
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Tooltip>
          )}

          {/* Notifications */}
          <IconButton
            sx={{
              color: '#9ca3af',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 2,
              '&:hover': {
                color: '#f9fafb',
                backgroundColor: 'rgba(255,255,255,0.02)',
              },
            }}
          >
            <Badge badgeContent={3} color="primary">
              <NotificationsIcon fontSize="small" />
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
