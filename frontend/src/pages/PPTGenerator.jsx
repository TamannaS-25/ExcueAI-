import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Alert
} from '@mui/material';
import {
  Slideshow as SlideshowIcon,
  CloudDownload as DownloadIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const PPTGenerator = () => {
  const [topic, setTopic] = useState('');
  const [projectName, setProjectName] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      setDocsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/documents`);
        setDocuments(response.data);
      } catch (err) {
        console.error('Failed to load documents for dropdown:', err);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleGeneratePPT = async (e) => {
    e.preventDefault();
    if (!topic) {
      alert('Please fill out the presentation Topic field.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/reports/generate/ppt`,
        {
          topic,
          project_name: projectName,
          meeting_summary: meetingSummary,
          uploaded_document_id: selectedDocId ? parseInt(selectedDocId) : null,
        },
        {
          responseType: 'blob', // binary slide deck stream
        }
      );

      // Trigger download prompt
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectName || 'Presentation'}_Slides.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PPT compilation failed:', err);
      alert('Could not compile PowerPoint slides. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
      <Card sx={{ width: '100%', maxWidth: 720, p: 3 }}>
        <CardContent>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SlideshowIcon sx={{ color: 'primary.main' }} /> AI PowerPoint Generator
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
            Provide topic descriptions and context inputs below. The assistant compiles a structured slide deck presentation with styled color sheets.
          </Typography>

          <form onSubmit={handleGeneratePPT}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              <TextField
                fullWidth
                label="Presentation Topic"
                placeholder="e.g., Q3 Engineering Deliverables Review"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Project Scope Name"
                placeholder="e.g., Code Refactoring and Core Analytics"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />

              <TextField
                fullWidth
                label="Meeting Synopsis Insights"
                multiline
                rows={3}
                placeholder="Extract key decisions or highlights from audio transcription to add context..."
                value={meetingSummary}
                onChange={(e) => setMeetingSummary(e.target.value)}
              />

              {/* Document attachment selector */}
              <FormControl fullWidth>
                <InputLabel id="doc-select-label">Link Knowledge Base Context</InputLabel>
                <Select
                  labelId="doc-select-label"
                  value={selectedDocId}
                  label="Link Knowledge Base Context"
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={docsLoading}
                >
                  <MenuItem value="">
                    <em>None - Generate without document indexing</em>
                  </MenuItem>
                  {documents.map((doc) => (
                    <MenuItem key={doc.document_id} value={doc.document_id}>
                      {doc.filename} ({new Date(doc.upload_date).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {loading && (
                <Card sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: 'rgba(99,102,241,0.04)' }}>
                  <CircularProgress size={24} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Assembling slides framework and writing XML slides templates...
                  </Typography>
                </Card>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                color="primary"
                startIcon={<DownloadIcon />}
                disabled={loading}
                sx={{ py: 1.5, fontWeight: 700 }}
              >
                {loading ? 'Compiling PowerPoint...' : 'Generate & Download PPTX'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PPTGenerator;
