import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Assignment as DBIcon,
  Book as RAGIcon,
  Hearing as AudioIcon,
  AutoAwesome as GPTIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SOURCE_ICONS = {
  'PostgreSQL': <DBIcon fontSize="small" />,
  'ChromaDB RAG': <RAGIcon fontSize="small" />,
  'Meeting Knowledge Base': <AudioIcon fontSize="small" />,
  'GPT Content Generation Engine': <GPTIcon fontSize="small" />,
  'GPT': <GPTIcon fontSize="small" />,
};

const SOURCE_COLORS = {
  'PostgreSQL': 'info',
  'ChromaDB RAG': 'secondary',
  'Meeting Knowledge Base': 'warning',
  'GPT Content Generation Engine': 'primary',
  'GPT': 'primary',
};

const AIAssistant = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: `Hello ${user?.name || 'there'}! I am ExcueAI, your enterprise copilot. How can I help you automate operations today?`,
      source: 'GPT'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const promptSuggestions = [
    'Show my pending tasks',
    'Explain our leave policy',
    'Summarize latest meeting sync',
    'Draft a project status update email'
  ];

  const handleSend = async (messageText) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: textToSend }]);
    setInputText('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/ai/chat`, { message: textToSend });
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: response.data.response,
          source: response.data.source,
          context: response.data.context
        }
      ]);
    } catch (error) {
      console.error('AI chat failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I hit a network glitch processing that query. Please make sure the backend is active.',
          source: 'System'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  return (
    <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', justify: 'space-between' }}>
      
      {/* Messages Window */}
      <Card sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', mb: 3, overflowY: 'auto' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2.5, mb: 2 }}>
          {messages.map((msg, index) => {
            const isBot = msg.sender === 'bot';
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignSelf: isBot ? 'flex-start' : 'flex-end',
                  flexDirection: isBot ? 'row' : 'row-reverse',
                  alignItems: 'flex-start',
                  gap: 2,
                  maxWidth: '75%',
                }}
              >
                <Avatar sx={{ bgcolor: isBot ? 'primary.main' : 'secondary.main', width: 36, height: 36 }}>
                  {isBot ? <BotIcon /> : <UserIcon />}
                </Avatar>
                
                <Box>
                  {/* Chat bubble */}
                  <Box
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      borderTopLeftRadius: isBot ? 0 : 3,
                      borderTopRightRadius: isBot ? 3 : 0,
                      backgroundColor: isBot ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.1)',
                      border: isBot ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid rgba(99, 102, 241, 0.15)',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#f9fafb', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {msg.text}
                    </Typography>
                  </Box>

                  {/* Context and source tags */}
                  {isBot && msg.source && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={SOURCE_ICONS[msg.source] || <GPTIcon />}
                        label={`Source: ${msg.source}`}
                        color={SOURCE_COLORS[msg.source] || 'primary'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }}
                      />
                      {msg.context && (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          ({msg.context})
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
          
          {loading && (
            <Box sx={{ display: 'flex', alignSelf: 'flex-start', gap: 2, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                <BotIcon />
              </Avatar>
              <Box sx={{ p: 2, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.02)', display: 'flex', gap: 1, alignItems: 'center' }}>
                <CircularProgress size={16} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 650 }}>Copilot is investigating data indices...</Typography>
              </Box>
            </Box>
          )}
          <div ref={scrollRef} />
        </Box>

        {/* Suggestion Chips */}
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {promptSuggestions.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              sx={{
                cursor: 'pointer',
                bgcolor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  borderColor: '#6366f1'
                }
              }}
            />
          ))}
        </Stack>
      </Card>

      {/* Input panel */}
      <Card sx={{ p: 2, backgroundColor: 'rgba(17, 24, 39, 0.95)' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Query copilot..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            InputProps={{
              sx: { borderRadius: 2 },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={() => handleSend()}
            disabled={loading}
            sx={{ px: 4, fontWeight: 700 }}
          >
            Send
          </Button>
        </Box>
      </Card>

    </Box>
  );
};

export default AIAssistant;
