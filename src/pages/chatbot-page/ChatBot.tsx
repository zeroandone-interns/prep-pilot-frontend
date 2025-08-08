// src/components/Chatbot.tsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Paper,
  Divider
} from '@mui/material'
import {
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as UserIcon,
  Add as PlusIcon,
  ChatBubble as ChatBubbleIcon
} from '@mui/icons-material'

interface Message {
  id: string
  content: string
  isBot: boolean
  timestamp: Date
}

interface Chat {
  id: string
  title: string
  messages: Message[]
  lastActive: Date
}

const drawerWidth = 250

export default function Chatbot() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      title: 'AWS Learning Chat',
      messages: [
        {
          id: '1',
          content: "Hi! I'm your AWS learning assistant. Ask me anything.",
          isBot: true,
          timestamp: new Date()
        }
      ],
      lastActive: new Date()
    }
  ])
  const [currentChatId, setCurrentChatId] = useState('1')
  const [inputMessage, setInputMessage] = useState('')

  const currentChat = chats.find((c) => c.id === currentChatId)!
  const msgs = currentChat.messages

  function createNewChat() {
    const id = Date.now().toString()
    const greeting: Message = {
      id,
      content: "Hi! I'm your AWS learning assistant. Ask me anything.",
      isBot: true,
      timestamp: new Date()
    }
    setChats((prev) => [
      ...prev,
      { id, title: `New Chat ${prev.length + 1}`, messages: [greeting], lastActive: new Date() }
    ])
    setCurrentChatId(id)
  }

  function send() {
    if (!inputMessage.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isBot: false,
      timestamp: new Date()
    }
    const updated = [...msgs, userMsg]
    setChats((prev) =>
      prev.map((c) =>
        c.id === currentChatId
          ? { ...c, messages: updated, lastActive: new Date() }
          : c
      )
    )
    setInputMessage('')

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Hi',
        isBot: true,
        timestamp: new Date()
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? { ...c, messages: [...updated, botMsg], lastActive: new Date() }
            : c
        )
      )
    }, 500)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box'
          }
        }}
        anchor="left"
      >
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            onClick={createNewChat}
          >
            New Chat
          </Button>
          <Divider sx={{ my: 2 }} />
          <List>
            {chats.map((c) => (
              <ListItem key={c.id} disablePadding>
                <ListItemButton
                  selected={c.id === currentChatId}
                  onClick={() => setCurrentChatId(c.id)}
                >
                  <ListItemIcon>
                    <ChatBubbleIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={c.title}
                    secondary={c.lastActive.toLocaleDateString()}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${drawerWidth}px`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <AppBar position="static" color="primary">
          <Toolbar>
            <BotIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{currentChat.title}</Typography>
          </Toolbar>
        </AppBar>

        {/* Messages area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.paper'
          }}
        >
          {msgs.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: 'flex',
                flexDirection: m.isBot ? 'row' : 'row-reverse',
                alignItems: 'flex-start',
                mb: 2
              }}
            >
              <IconButton disabled>
                {m.isBot ? <BotIcon color="primary" /> : <UserIcon color="secondary" />}
              </IconButton>
              <Paper
                elevation={1}
                sx={{
                  p: 1,
                  maxWidth: '70%',
                  bgcolor: m.isBot ? 'grey.100' : 'primary.lighter'
                }}
              >
                <Typography variant="body2">{m.content}</Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  sx={{ mt: 0.5, display: 'block' }}
                >
                  {m.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Input area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Type your message here…"
            />
            <IconButton color="primary" onClick={send} disabled={!inputMessage.trim()}>
              <SendIcon />
            </IconButton>
          </Box>
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            {['Generate EC2 Exam', 'Explain VPC', 'What is Lambda?'].map((t, i) => (
              <Button key={i} size="small" variant="outlined" onClick={() => setInputMessage(t)}>
                {t}
              </Button>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
