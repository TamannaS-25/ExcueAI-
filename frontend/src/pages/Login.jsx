import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please input both email and password.');
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      if (result.role === 'Manager') {
        navigate('/manager-dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    } else {
      setErrorMsg(result.error);
    }
  };

  const handleQuickSelect = (selEmail) => {
    setEmail(selEmail);
    setPassword('password123');
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, #111827 0%, #070a0f 100%)',
        p: 3,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.04)',
          backgroundColor: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Logo Brand Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '1.75rem',
                color: '#ffffff',
                mb: 1.5,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
              }}
            >
              E
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              ExcueAI
            </Typography>
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5, fontWeight: 500 }}>
              Enterprise Workspace Platform
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Email Address"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="enter email"
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                InputProps={{
                  sx: { borderRadius: 2 },
                }}
              />
              
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
              </Button>
            </Box>
          </form>

          {/* Quick Seeding accounts selection */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="caption" sx={{ color: '#4b5563', display: 'block', mb: 1.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>
              Demo Quick Logins (Pass: password123)
            </Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Box
                  onClick={() => handleQuickSelect('eng_mgr@excueai.com')}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.1)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: '#6366f1'
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#818cf8', display: 'block' }}>
                    Manager (David)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                    Engineering Lead
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  onClick={() => handleQuickSelect('frank@excueai.com')}
                  sx={{
                    p: 1,
                    textAlign: 'center',
                    borderRadius: 2,
                    cursor: 'pointer',
                    bgcolor: 'rgba(20, 184, 166, 0.05)',
                    border: '1px solid rgba(20, 184, 166, 0.1)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'rgba(20, 184, 166, 0.1)',
                      borderColor: '#14b8a6'
                    }
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#2dd4bf', display: 'block' }}>
                    Employee (Frank)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                    Software Engineer
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
