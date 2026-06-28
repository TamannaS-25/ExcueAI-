import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Input,
  Paper,
  Alert
} from '@mui/material';
import {
  RecordVoiceOver as VoiceIcon,
  CloudUpload as UploadIcon,
  CheckCircleOutlined as CheckIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Subject as SummaryIcon,
  GraphicEq as WaveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const MeetingIntelligence = () => {
  const { isManager } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMeetings = async () => {
    try {
      const response = await axios.get(`${API_URL}/meetings`);
      setMeetings(response.data);
      if (response.data.length > 0 && !selectedMeeting) {
        setSelectedMeeting(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMeetings();
      setLoading(false);
    };
    init();
  }, []);

  const handleAudioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['mp3', 'wav', 'm4a'].includes(ext)) {
      setErrorMsg('Unsupported audio format. Only MP3, WAV, and M4A are supported.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/meetings/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchMeetings();
      setSelectedMeeting(response.data);
    } catch (err) {
      console.error('Error processing audio:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to process audio transcript. Please verify file integrity.');
    } finally {
      setUploading(false);
    }
  };

  const getActionItemsArray = (itemsStr) => {
    try {
      return JSON.parse(itemsStr);
    } catch (e) {
      return itemsStr ? [itemsStr] : [];
    }
  };

  const getRisksArray = (risksStr) => {
    try {
      return JSON.parse(risksStr);
    } catch (e) {
      return risksStr ? [risksStr] : [];
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with audio upload button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Audio Intelligence Sync
        </Typography>

        {isManager && (
          <label htmlFor="audio-upload-btn">
            <Input
              id="audio-upload-btn"
              type="file"
              sx={{ display: 'none' }}
              onChange={handleAudioUpload}
            />
            <Button
              variant="contained"
              component="span"
              disabled={uploading}
              startIcon={<UploadIcon />}
              sx={{ fontWeight: 700 }}
            >
              {uploading ? 'Whisper Speech-to-Text Parsing...' : 'Transcribe Meeting Audio'}
            </Button>
          </label>
        )}
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {uploading && (
        <Card sx={{ p: 3, display: 'flex', alignItems: 'center', justify: 'center', gap: 3, background: 'rgba(99,102,241,0.05)' }}>
          <CircularProgress color="secondary" />
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>AI is processing your audio file...</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Whisper model is performing transcribing, followed by GPT structured analysis.</Typography>
          </Box>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Archive List Left Side */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%', minHeight: 450 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <VoiceIcon sx={{ color: 'primary.main' }} /> Transcriptions Archive
            </Typography>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {meetings.map((m) => {
                const isActive = selectedMeeting?.meeting_id === m.meeting_id;
                return (
                  <ListItem
                    key={m.meeting_id}
                    onClick={() => setSelectedMeeting(m)}
                    sx={{
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: isActive ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,0.04)',
                      backgroundColor: isActive ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.01)',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isActive ? 'primary.main' : 'text.secondary' }}>
                      <WaveIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={m.title}
                      primaryTypographyProps={{ fontWeight: 750, fontSize: '0.85rem' }}
                      secondary={new Date(m.upload_date).toLocaleDateString()}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                  </ListItem>
                );
              })}
              {meetings.length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', p: 3 }}>
                  No transcribed meetings available.
                </Typography>
              )}
            </List>
          </Card>
        </Grid>

        {/* Meeting Analysis Panel Right Side */}
        <Grid item xs={12} md={8}>
          {selectedMeeting ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Main Analysis card */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, color: '#f9fafb' }}>
                  {selectedMeeting.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                  Transcribed on: {new Date(selectedMeeting.upload_date).toLocaleString()} | Uploaded by: {selectedMeeting.uploader?.name || 'System Manager'}
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Summary */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SummaryIcon fontSize="small" /> Brief Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                      {selectedMeeting.summary || 'Summary is unavailable.'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ opacity: 0.1 }} />
                  </Grid>

                  {/* Action items list */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AssignmentIcon fontSize="small" /> Action Deliverables
                    </Typography>
                    <List p={0}>
                      {getActionItemsArray(selectedMeeting.action_items).map((item, idx) => (
                        <ListItem key={idx} sx={{ p: 0, mb: 1, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, color: 'success.main', mt: 0.2 }}>
                            <CheckIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ fontSize: '0.85rem', color: 'text.primary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>

                  {/* Risks Profile */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon fontSize="small" /> Potential Roadblocks
                    </Typography>
                    <List p={0}>
                      {getRisksArray(selectedMeeting.risks).map((risk, idx) => (
                        <ListItem key={idx} sx={{ p: 0, mb: 1, alignItems: 'flex-start' }}>
                          <ListItemIcon sx={{ minWidth: 28, color: 'error.main', mt: 0.2 }}>
                            <WarningIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={risk} primaryTypographyProps={{ fontSize: '0.85rem', color: 'text.primary' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </Card>

              {/* Transcript text content card */}
              <Card sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                  Full Transcription Script
                </Typography>
                <Box
                  sx={{
                    maxHeight: 280,
                    overflowY: 'auto',
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.01)',
                    border: '1px solid rgba(255,255,255,0.03)',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    color: 'text.secondary',
                  }}
                >
                  {selectedMeeting.transcript}
                </Box>
              </Card>
            </Box>
          ) : (
            <Card sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Please select a meeting on the left to view transcript analytics.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MeetingIntelligence;
