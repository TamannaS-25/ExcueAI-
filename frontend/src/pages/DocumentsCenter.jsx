import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Divider,
  Input,
  Chip,
  Alert
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MenuBook as BookIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DocumentsCenter = () => {
  const { isManager } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Q&A States
  const [query, setQuery] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaSource, setQaSource] = useState('');
  const [qaContext, setQaContext] = useState('');

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      setDocuments(response.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchDocuments();
      setLoading(false);
    };
    init();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file types
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setErrorMsg('Unsupported format. Only PDF, DOCX, and TXT are supported.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (window.confirm('Are you sure you want to delete this document? This will remove its index from the AI Knowledge Base.')) {
      try {
        await axios.delete(`${API_URL}/documents/${docId}`);
        fetchDocuments();
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  const handleSearchQA = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setQaLoading(true);
    setQaAnswer('');
    setQaSource('');
    setQaContext('');

    try {
      const response = await axios.post(`${API_URL}/ai/chat`, { message: query });
      setQaAnswer(response.data.response);
      setQaSource(response.data.source);
      setQaContext(response.data.context);
    } catch (err) {
      console.error('Q&A search failed:', err);
      setQaAnswer('Could not retrieve a RAG response for this query. Make sure RAG indexing has ran.');
    } finally {
      setQaLoading(false);
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
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
      
      {/* Search Q&A Panel */}
      <Card sx={{ p: 3, background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(20,184,166,0.03) 100%)' }}>
        <CardContent sx={{ p: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SparklesIcon sx={{ color: 'secondary.main' }} /> AI Knowledge Base Search
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Query the vector database about HR guidelines, parental leaves, safety regulations, or corporate standard operation procedures (SOPs).
          </Typography>

          <form onSubmit={handleSearchQA}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="e.g., What is our policy on split parental leave?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  sx: { borderRadius: 2 },
                  endAdornment: <SearchIcon sx={{ color: 'text.secondary' }} />,
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={qaLoading}
                sx={{ px: 4, fontWeight: 700 }}
              >
                {qaLoading ? <CircularProgress size={20} color="inherit" /> : 'Query'}
              </Button>
            </Box>
          </form>

          {/* Q&A Result */}
          {qaAnswer && (
            <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main' }}>
                  AI Synthesized Answer
                </Typography>
                <Chip label={`Engine: ${qaSource}`} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }} />
              </Box>
              <Typography variant="body2" sx={{ color: '#f9fafb', lineHeight: 1.6, mb: 2, whiteSpace: 'pre-wrap' }}>
                {qaAnswer}
              </Typography>
              {qaContext && (
                <>
                  <Divider sx={{ my: 1.5, opacity: 0.1 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block' }}>
                    Reference Context: {qaContext}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Directory Table */}
      <Card sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookIcon sx={{ color: 'primary.main' }} /> Company Library Directory
          </Typography>
          
          {isManager && (
            <label htmlFor="upload-button">
              <Input
                id="upload-button"
                type="file"
                sx={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Button
                variant="outlined"
                component="span"
                disabled={uploading}
                startIcon={<UploadIcon />}
                sx={{ fontWeight: 700 }}
              >
                {uploading ? 'Processing vector index...' : 'Upload Policy / SOP'}
              </Button>
            </label>
          )}
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Document Title</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Upload Date</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Uploaded By</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 650 }}>Vector Reference</TableCell>
                {isManager && <TableCell sx={{ color: 'text.secondary', fontWeight: 650, textAlign: 'right' }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.document_id} sx={{ '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.01)' } }}>
                  <TableCell sx={{ fontWeight: 700, color: '#f9fafb' }}>{doc.filename}</TableCell>
                  <TableCell>{new Date(doc.upload_date).toLocaleString()}</TableCell>
                  <TableCell>{doc.uploader?.name || 'System Manager'}</TableCell>
                  <TableCell>
                    <Chip
                      label={doc.vector_reference || 'Indexing...'}
                      size="small"
                      color={doc.vector_reference ? 'success' : 'warning'}
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  {isManager && (
                    <TableCell sx={{ textAlign: 'right' }}>
                      <IconButton onClick={() => handleDelete(doc.document_id)} sx={{ color: 'error.main' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                    No files cataloged in the knowledge base.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

    </Box>
  );
};

export default DocumentsCenter;
