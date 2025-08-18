import React, { useMemo, useState, useEffect } from 'react'
import {
  Box, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, TextField, Paper, Drawer, Stack, useMediaQuery
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Send, SmartToy, Person, Add, ChatBubble, Edit, Check, Close, Menu as MenuIcon } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../store'
import { createChatSession, sendMsg, setCur, editTitle } from '../../store/chatsSlice'

const SIDEBAR_W = 260
const USER_ID = 1 // Replace with actual logged-in user ID

export default function Chatbot() {
  const dispatch = useAppDispatch()
  const { chats, curId } = useAppSelector(state => state.chats)
  const chat = useMemo(() => chats.find(c => c.id === curId), [chats, curId])

  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  const upMd = useMediaQuery(theme.breakpoints.up('md'))
  const APPBAR_H = upSm ? 64 : 56

  // --- END CURRENT SESSION ON TAB CLOSE ---
  useEffect(() => {
    const handleUnload = async () => {
      if (chat?.sessionID) {
        try { await fetch(`http://localhost:3000/chat/session/${chat.sessionID}/end`, { method: 'POST' }) } catch {}
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [chat])

  // --- CREATE NEW CHAT SESSION ---
  const create = async () => {
    try {
      await dispatch(createChatSession(USER_ID)).unwrap()
      setEditing(true)
      const newChat = chats[chats.length - 1]
      setTitle(newChat?.title || `New Chat ${chats.length}`)
    } catch (err) {
      console.error("Failed to create chat session", err)
    }
  }

  // --- SEND MESSAGE ---
  const send = async () => {
    if (!input.trim() || !chat) return
    const content = input
    setInput('')

    try {
      // Send user message via Redux thunk or API directly
      dispatch(sendMsg({ content, isBot: false }))
      // Simulate bot response
      setTimeout(() => {
        const botMsg = "Hi" // replace with actual AI response if backend supports
        dispatch(sendMsg({ content: botMsg, isBot: true }))
      }, 400)
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  // --- SAVE EDITED TITLE ---
  const saveTitle = () => {
    if (!chat) return
    const t = title.trim() || chat.title || "New Chat"
    dispatch(editTitle(t))
    setEditing(false)
  }

  // --- SWITCH / REOPEN CHAT SESSION ---
  const selectChat = async (c: typeof chat) => {
    if (!c || c.id === curId) return
    dispatch(setCur(c.id))
    setEditing(false)
    setDrawerOpen(false)
  }

  if (!chat) return <div>Loading chats...</div>

  // --- SIDEBAR ---
  const Sidebar = (
    <Box sx={{ width: SIDEBAR_W, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Button fullWidth variant="contained" startIcon={<Add />} onClick={create}>New Chat</Button>
      </Box>
      <List dense sx={{ px: 1, overflowY: 'auto', flex: 1 }}>
        {chats.map(c => c && (
          <ListItem key={c.id} disablePadding>
            <ListItemButton selected={c.id === curId} onClick={() => selectChat(c)}>
              <ListItemIcon sx={{ minWidth: 32 }}><ChatBubble fontSize="small" /></ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ noWrap: true }}
                primary={c.title}
                secondary={new Date(c.last).toLocaleDateString()}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ height: `calc(100dvh - ${APPBAR_H}px)`, overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ height: '100%' }}>
        {upMd ? (
          <Paper variant="outlined" sx={{ width: SIDEBAR_W, height: '100%', flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
            {Sidebar}
          </Paper>
        ) : (
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {Sidebar}
          </Drawer>
        )}

        <Paper sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'primary.main', color: 'primary.contrastText', flexShrink: 0 }}>
            {!upMd && <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setDrawerOpen(true)}><MenuIcon /></IconButton>}
            <SmartToy />
            {!editing ? (
              <>
                <Typography variant="h6" sx={{ flex: 1, cursor: 'text' }} onDoubleClick={() => { setTitle(chat.title); setEditing(true) }}>{chat.title}</Typography>
                <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => { setTitle(chat.title); setEditing(true) }}><Edit /></IconButton>
              </>
            ) : (
              <>
                <TextField size="small" autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
                  sx={{ bgcolor: 'background.paper', borderRadius: 1, minWidth: { xs: 160, sm: 240 }, flex: 1, '& .MuiInputBase-input': { color: 'text.primary' } }} />
                <IconButton size="small" sx={{ color: 'inherit' }} onClick={saveTitle}><Check /></IconButton>
                <IconButton size="small" sx={{ color: 'inherit' }} onClick={() => setEditing(false)}><Close /></IconButton>
              </>
            )}
          </Box>

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
            {chat.msgs.map(m => (
              <Box key={m.id} sx={{ display: 'flex', flexDirection: m.isBot ? 'row' : 'row-reverse', alignItems: 'flex-start', gap: 1.25, mb: 1.25 }}>
                <Box sx={{ mt: 0.25, color: m.isBot ? 'secondary.main' : 'primary.main' }}>
                  {m.isBot ? <SmartToy fontSize="small" /> : <Person fontSize="small" />}
                </Box>
                <Paper variant={m.isBot ? 'outlined' : 'elevation'} elevation={m.isBot ? 0 : 1} sx={(t) => ({ px: 1.5, py: 1, maxWidth: '85%', borderRadius: 2, wordBreak: 'break-word', bgcolor: m.isBot ? 'background.paper' : alpha(t.palette.primary.main, .08) })}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                  <Typography variant="caption" sx={{ display: 'block', mt: .5, color: 'text.secondary', textAlign: m.isBot ? 'left' : 'right' }}>
                    {new Date(m.ts).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input */}
          <Box sx={{ borderTop: 1, borderColor: 'divider', p: { xs: 1.25, sm: 2 }, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'flex-end', gap: 1, borderRadius: 2 }}>
              <TextField
                fullWidth multiline minRows={2} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Type your message here…" variant="standard"
                InputProps={{ disableUnderline: true, sx: { px: 1 } }}
              />
              <IconButton color="primary" onClick={send} disabled={!input.trim()}><Send /></IconButton>
            </Paper>
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}
