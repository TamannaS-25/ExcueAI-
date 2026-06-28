import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Chip,
  Alert
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Description as DocxIcon,
  Compare as CompareIcon,
  Difference as DiffIcon,
  CloudDownload as DownloadIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const ReportsCenter = () => {
  // Document compiler form
  const [topic, setTopic] = useState('');
  const [projectName, setProjectName] = useState('');
  const [meetingSummary, setMeetingSummary] = useState('');
  const [documentContext, setDocumentContext] = useState('');
  
  const [compilingPdf, setCompilingPdf] = useState(false);
  const [compilingDocx, setCompilingDocx] = useState(false);

  // Compare engine states
  const [fileA, setFileA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [compareError, setCompareError] = useState('');

  const handleCompileReport = async (format) => {
    if (!topic) {
      alert('Please fill out the Topic field before compiling.');
      return;
    }

    if (format === 'pdf') setCompilingPdf(true);
    else setCompilingDocx(true);

    try {
      const formData = new FormData();
      formData.append('topic', topic);
      formData.append('project_name', projectName);
      formData.append('meeting_summary', meetingSummary);
      formData.append('document_context', documentContext);

      const response = await axios.post(`${API_URL}/reports/generate/${format}`, formData, {
        responseType: 'blob', // Important to handle binaries
      });

      // Triggers browser prompt download
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${projectName || 'Report'}_Draft.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to compile report:', error);
      alert('Could not compile report. Verify server connection.');
    } finally {
      setCompilingPdf(false);
      setCompilingDocx(false);
    }
  };

  const handleCompareSubmit = async (e) => {
    e.preventDefault();
    if (!fileA || !fileB) {
      setCompareError('Please select both document versions.');
      return;
    }

    setComparing(true);
    setCompareError('');
    setCompareResult(null);

    const formData = new FormData();
    formData.append('file_a', fileA);
    formData.append('file_b', fileB);

    try {
      const response = await axios.post(`${API_URL}/reports/compare`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCompareResult(response.data);
    } catch (error) {
      console.error('Compare failed:', error);
      setCompareError(error.response?.data?.detail || 'Comparison engine failed. Only PDF, DOCX, and TXT files are compared.');
    } finally {
      setComparing(false);
    }
  };

  const handleDownloadCompareReport = async (reportUrl, defaultName) => {
    try {
      const response = await axios.get(`${API_URL}${reportUrl}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', defaultName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Download failed:', e);
    }
  };

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      <Grid container spacing={3}>
        {/* Compiler Form card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DocxIcon sx={{ color: 'primary.main' }} /> AI Document Compiler
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Enter structural guidelines below. The system automatically structures and generates executive briefings in PDF or Word.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                fullWidth
                label="Report Topic / Title"
                placeholder="e.g., Q3 Operations Audit"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <TextField
                fullWidth
                label="Project Identifier Name"
                placeholder="e.g., Project Alpha"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Meeting Sync Insights"
                multiline
                rows={3}
                placeholder="Paste highlights from sync transcriptions..."
                value={meetingSummary}
                onChange={(e) => setMeetingSummary(e.target.value)}
              />
              <TextField
                fullWidth
                label="Context Documents Snippets"
                multiline
                rows={3}
                placeholder="Paste details from policies or manuals..."
                value={documentContext}
                onChange={(e) => setDocumentContext(e.target.value)}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<PdfIcon />}
                  disabled={compilingPdf}
                  onClick={() => handleCompileReport('pdf')}
                  sx={{ fontWeight: 700 }}
                >
                  {compilingPdf ? <CircularProgress size={20} color="inherit" /> : 'Compile PDF'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<DocxIcon />}
                  disabled={compilingDocx}
                  onClick={() => handleCompileReport('docx')}
                  sx={{ fontWeight: 700 }}
                >
                  {compilingDocx ? <CircularProgress size={20} color="inherit" /> : 'Compile Word'}
                </Button>
              </Stack>
            </Box>
          </Card>
        </Grid>

        {/* Comparison Engine card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CompareIcon sx={{ color: 'secondary.main' }} /> Drafts Comparison Engine
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Upload two drafts of a contract, SOP manual, or document guidelines to review additions, deletions, and differences.
            </Typography>

            {compareError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {compareError}
              </Alert>
            )}

            <form onSubmit={handleCompareSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Draft A */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                    Document Draft A (Original Version)
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFileA(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                </Box>

                {/* Draft B */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: 'text.secondary' }}>
                    Document Draft B (Revised Version)
                  </Typography>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setFileB(e.target.files[0])}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.01)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  color="secondary"
                  disabled={comparing}
                  startIcon={<CompareIcon />}
                  sx={{ py: 1.2, fontWeight: 700, mt: 1 }}
                >
                  {comparing ? <CircularProgress size={20} color="inherit" /> : 'Compare Drafts'}
                </Button>
              </Box>
            </form>

            {/* Comparison results */}
            {compareResult && (
              <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', mb: 1 }}>
                  Auditor Audit Summary
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2, whiteSpace: 'pre-wrap' }}>
                  {compareResult.summary}
                </Typography>

                <Divider sx={{ my: 2, opacity: 0.08 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>
                  Download Comparison Reports
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadCompareReport(compareResult.pdf_report_path, 'Comparison_Report.pdf')}
                  >
                    PDF Log
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownloadCompareReport(compareResult.docx_report_path, 'Comparison_Report.docx')}
                  >
                    Word Log
                  </Button>
                </Stack>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsCenter;
