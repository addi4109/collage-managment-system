import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Avatar,
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  Badge,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MessageIcon from '@mui/icons-material/Message';
import CircleIcon from '@mui/icons-material/Circle';
import { useAuthStore } from '../store/authStore';

interface Contact {
  uid: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  online: boolean;
}

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

const DUMMY_CONTACTS: Contact[] = [
  { uid: 'fac_1', name: 'Dr. Sarah Jenkins', role: 'faculty', online: true },
  { uid: 'fac_2', name: 'Prof. James Miller', role: 'faculty', online: false },
  { uid: 'stud_1', name: 'Alex Rivera', role: 'student', online: true },
  { uid: 'stud_2', name: 'Emma Watson', role: 'student', online: true },
  { uid: 'admin_1', name: 'Principal Vance', role: 'admin', online: true },
];

const DUMMY_BOT_RESPONSES = [
  "Thanks for the message! I'm reviewing your homework grades today and will get back to you shortly.",
  "Sure, let's discuss this tomorrow during my office hours. Does 2:00 PM work for you?",
  "Perfect, please email me the project slides as well so I can take a look.",
  "Yes, the lecture notes have been updated in the Assignments tab. Let me know if you need anything summarized.",
  "I am currently in a meeting, but I will review this as soon as I am free. Best, and have a good evening!",
];

export const InAppChat: React.FC = () => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Filter contacts based on user role
  useEffect(() => {
    if (!user) return;
    // Hide oneself from contacts
    const filtered = DUMMY_CONTACTS.filter((c) => c.uid !== user.uid);
    setContacts(filtered);
    if (filtered.length > 0) {
      setActiveContact(filtered[0]);
    }
  }, [user]);

  // Load chat messages when active contact changes
  useEffect(() => {
    if (!activeContact || !user) return;
    setLoading(true);
    
    // In local sandbox mode, read/write from localStorage or use dummy messages
    const chatKey = `eh_chat_${[user.uid, activeContact.uid].sort().join('_')}`;
    const raw = localStorage.getItem(chatKey);
    
    const delay = setTimeout(() => {
      if (raw) {
        setMessages(JSON.parse(raw));
      } else {
        // Seed default chat message
        const welcomeMsgs: ChatMessage[] = [
          {
            id: 'init_1',
            senderId: activeContact.uid,
            text: `Hi ${user.name}, this is ${activeContact.name}. Let me know if you have any questions!`,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          },
        ];
        setMessages(welcomeMsgs);
        localStorage.setItem(chatKey, JSON.stringify(welcomeMsgs));
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(delay);
  }, [activeContact, user]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !user || !activeContact) return;

    const chatKey = `eh_chat_${[user.uid, activeContact.uid].sort().join('_')}`;
    const userMsgText = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      senderId: user.uid,
      text: userMsgText,
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(chatKey, JSON.stringify(updated));

    // Simulate real-time bot response
    setTyping(true);
    setTimeout(async () => {
      setTyping(false);
      const randomResponse = DUMMY_BOT_RESPONSES[Math.floor(Math.random() * DUMMY_BOT_RESPONSES.length)];
      const botMsg: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        senderId: activeContact.uid,
        text: randomResponse,
        timestamp: new Date().toISOString(),
      };
      
      const updatedWithBot = [...updated, botMsg];
      setMessages(updatedWithBot);
      localStorage.setItem(chatKey, JSON.stringify(updatedWithBot));
    }, 1500);
  };

  return (
    <Box sx={{ mt: 2 }} className="animate-fade-in">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="gradient-text" sx={{ fontWeight: 800 }}>
          In-App Direct Chat
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Communicate in real time with professors, administration, and classmates.
        </Typography>
      </Box>

      <Card sx={{ height: '70vh', minHeight: 500, display: 'flex', flexDirection: 'column' }}>
        <Grid container sx={{ height: '100%', flexGrow: 1 }}>
          {/* Left Panel: Contacts List */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <MessageIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Conversations
              </Typography>
            </Box>
            <Divider sx={{ opacity: 0.08 }} />
            <List sx={{ overflowY: 'auto', flexGrow: 1, p: 0 }}>
              {contacts.map((contact) => {
                const isActive = activeContact?.uid === contact.uid;
                return (
                  <ListItem disablePadding key={contact.uid}>
                    <ListItemButton
                      selected={isActive}
                      onClick={() => setActiveContact(contact)}
                      sx={{
                        py: 1.5,
                        px: 2.5,
                        borderLeft: isActive ? '4px solid #6366f1' : '4px solid transparent',
                        backgroundColor: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                        '&:hover': {
                          backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.02)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color={contact.online ? 'success' : 'error'}
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: contact.online ? '#10b981' : '#ef4444',
                              boxShadow: `0 0 0 2px #111827`,
                            },
                          }}
                        >
                          <Avatar sx={{ bgcolor: 'secondary.dark', fontWeight: 'bold' }}>
                            {contact.name.charAt(0)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={contact.name}
                        secondary={contact.role.toUpperCase()}
                        primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'text.secondary' }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Grid>

          {/* Right Panel: Chat Thread Messages */}
          <Grid
            item
            xs={12}
            md={8}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              backgroundColor: 'rgba(11, 15, 25, 0.3)',
            }}
          >
            {activeContact ? (
              <>
                {/* Chat Header */}
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {activeContact.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CircleIcon sx={{ fontSize: 8, color: activeContact.online ? '#10b981' : '#9ca3af' }} />
                      {activeContact.online ? 'Online' : 'Offline'}
                    </Typography>
                  </Box>
                </Box>

                {/* Message Log */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : (
                    messages.map((msg) => {
                      const isSelf = msg.senderId === user?.uid;
                      return (
                        <Box
                          key={msg.id}
                          sx={{
                            display: 'flex',
                            justifyContent: isSelf ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Box
                            sx={{
                              maxWidth: '70%',
                              p: 2,
                              borderRadius: isSelf ? '16px 16px 0 16px' : '16px 16px 16px 0',
                              backgroundColor: isSelf ? 'primary.main' : 'background.paper',
                              border: isSelf ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                          >
                            <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                              {msg.text}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                textAlign: isSelf ? 'right' : 'left',
                                fontSize: '0.65rem',
                                color: 'text.secondary',
                                mt: 0.5,
                              }}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })
                  )}

                  {typing && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <CircularProgress size={12} color="inherit" />
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        {activeContact.name} is typing...
                      </Typography>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <TextField
                    fullWidth
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    autoComplete="off"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            type="submit"
                            color="primary"
                            disabled={!inputText.trim() || typing}
                          >
                            <SendIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: { borderRadius: 3 },
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
                <Typography>Select a contact to start chatting</Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};
export default InAppChat;
