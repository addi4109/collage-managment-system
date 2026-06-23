import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Fab,
  Card,
  CardContent,
  CardHeader,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  CircularProgress,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import { isPlaceholder } from '../firebase/config';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// Local mock response helper for Sandbox mode
const matchLocalResponse = (prompt: string): string => {
  const lowercase = prompt.toLowerCase();
  if (lowercase.includes('hello') || lowercase.includes('hi') || lowercase.includes('hey')) {
    return "Hi there! I am your EduTech AI Assistant. I can help you answer questions about assignments, timetables, QR attendance logs, or summarize note PDFs. Ask me anything!";
  }
  if (lowercase.includes('schedule') || lowercase.includes('timetable') || lowercase.includes('class')) {
    return "To manage class times, Admins can go to 'Schedule Timetable' and build hours vs days slots. Real-time conflict-checking verifies classroom and professor availability before saving.";
  }
  if (lowercase.includes('attendance') || lowercase.includes('qr')) {
    return "Attendance is checked via temporary QR codes. Faculty click 'Generate QR Code' on their screen, and students scan it using 'Scan QR Code' to log their attendance. Check progress details under 'Attendance Stats'.";
  }
  if (lowercase.includes('assignment') || lowercase.includes('homework') || lowercase.includes('grade')) {
    return "Students submit their classwork inside the 'My Assignments' workspace. Instructors grade submissions and post text feedback reviews inside the 'Manage Assignments' panel.";
  }
  if (lowercase.includes('summarize') || lowercase.includes('note') || lowercase.includes('pdf')) {
    return "You can summarize study guides or PDF slides instantly by clicking 'AI Summarize' right next to the download links in the 'My Assignments & Resources' view.";
  }
  if (lowercase.includes('developer') || lowercase.includes('who built you') || lowercase.includes('creator')) {
    return "I was designed by the Google DeepMind team and built specifically for the EduTech Hub educational management ecosystem!";
  }
  return "That is an interesting question! In this local sandbox mode, I answer general questions about the EduTech Hub features (QR scanning, scheduling conflicts, PDF notes summarization). Set up your Firebase project environment configurations to get live generative replies!";
};

export const AiChatbotBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your EduTech AI Assistant. How can I help you today? You can ask me about courses, schedules, QR attendance, or assignment grading.",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat history on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMsgText = prompt.trim();
    setPrompt('');
    
    // Add user message
    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: userMsgText,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      if (isPlaceholder) {
        // Local simulation delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        const aiText = matchLocalResponse(userMsgText);
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'ai',
            text: aiText,
            timestamp: new Date(),
          },
        ]);
      } else {
        // Trigger live cloud function endpoint
        const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'edutech-hub-placeholder';
        
        // Handle local emulator vs production url
        const isLocalHost = window.location.hostname === 'localhost';
        const url = isLocalHost
          ? `http://localhost:5001/${projectId}/us-central1/aiChatbot`
          : `https://us-central1-${projectId}.cloudfunctions.net/aiChatbot`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: userMsgText }),
        });

        if (!response.ok) {
          throw new Error('API server returned error status');
        }

        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai_' + Date.now(),
            sender: 'ai',
            text: data.response || 'No reply generated.',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          sender: 'ai',
          text: "Connection error: Unable to reach the AI engine. Please verify your connection or try again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1100 }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setIsOpen(true)}
          sx={{
            boxShadow: '0 6px 24px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.08)',
            },
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {/* Floating Chat Container */}
      {isOpen && (
        <Card
          sx={{
            width: { xs: 320, sm: 350 },
            height: 460,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            '@keyframes fadeInUp': {
              '0%': { opacity: 0, transform: 'translateY(15px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <CardHeader
            avatar={
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <SmartToyIcon />
              </Avatar>
            }
            action={
              <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'text.secondary' }}>
                <CloseIcon />
              </IconButton>
            }
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  EduTech AI
                </Typography>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: '#10b981',
                    boxShadow: '0 0 8px #10b981',
                  }}
                />
              </Box>
            }
            subheader={
              <Typography variant="caption" color="text.secondary">
                Online Helper
              </Typography>
            }
            sx={{
              pb: 1.5,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          />

          <CardContent
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    width: '100%',
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: isUser ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      backgroundColor: isUser ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                      border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                      boxShadow: isUser ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.primary',
                        fontSize: '0.85rem',
                        lineHeight: 1.4,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        textAlign: isUser ? 'right' : 'left',
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        mt: 0.5,
                      }}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <CircularProgress size={12} color="inherit" />
                <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                  AI is thinking...
                </Typography>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* Chat Input Bar */}
          <Box
            component="form"
            onSubmit={handleSend}
            sx={{
              p: 1.5,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(11, 15, 25, 0.4)',
            }}
          >
            <TextField
              fullWidth
              size="small"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask a question..."
              variant="outlined"
              autoComplete="off"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      type="submit"
                      edge="end"
                      color="primary"
                      disabled={!prompt.trim() || loading}
                    >
                      <SendIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                  },
                },
              }}
            />
          </Box>
        </Card>
      )}
    </Box>
  );
};
export default AiChatbotBubble;
