import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  Chip,
  Grid
} from '@mui/material';
import {
  Settings as SettingsIcon,
  VpnKey as KeyIcon,
  CloudDone as OnlineIcon,
  CloudOff as OfflineIcon
} from '@mui/icons-material';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key') || '';
    setApiKey(key);
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey.trim());
      // Propagate key to backend processes as well by syncing it via header or env
      // But typically we can pass it in headers or payloads
    } else {
      localStorage.removeItem('openai_api_key');
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleClear = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 720, p: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon sx={{ color: 'primary.main' }} /> Settings Panel
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Manage your AI configurations and API hookups below.
          </Typography>

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              Settings updated successfully. Real-time updates have synced.
            </Alert>
          )}

          <form onSubmit={handleSave}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <KeyIcon fontSize="small" sx={{ color: 'secondary.main' }} /> OpenAI API Authentication Key
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                  Input your OpenAI Key. The workspace will execute live LLM calls, RAG, and audio transcription. Leaving it blank triggers simulated offline responses.
                </Typography>
                
                <TextField
                  fullWidth
                  type="password"
                  label="sk-..."
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: 2 },
                  }}
                />
              </Box>

              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ px: 4, fontWeight: 700 }}
                >
                  Save API Key
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleClear}
                  sx={{ px: 4 }}
                >
                  Clear Key
                </Button>
              </Stack>
            </Box>
          </form>

          <Divider sx={{ my: 4, opacity: 0.1 }} />

          {/* Quick reference for demo accounts */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
            Developer Demo Accounts Credentials
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
            Use these seeded users to switch roles and audit RBAC restrictions (Password is **password123** for all).
          </Typography>

          <Grid container spacing={2}>
            {/* Managers */}
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.light' }}>
                  Managers (All Privileges)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • hr_mgr@excueai.com (Sarah - HR)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • eng_mgr@excueai.com (David - Eng)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • fin_mgr@excueai.com (Robert - Finance)
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Employees */}
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5, color: 'secondary.light' }}>
                  Employees (Restricted Roles)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • frank@excueai.com (Frank - Eng Employee)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • alice@excueai.com (Alice - HR Employee)
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    • karen@excueai.com (Karen - Finance Employee)
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

        </CardContent>
      </Card>
    </Box>
  );
};

export default Settings;
export const Stack = ({ children, direction = 'row', spacing = 2, sx }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: direction, gap: spacing, ...sx }}>
      {children}
    </Box>
  );
};
