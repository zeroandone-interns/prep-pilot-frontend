import React, { useMemo, useState } from 'react'
import {
  Box, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, TextField, Paper, Drawer, Stack, useMediaQuery
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Send, SmartToy, Person, Add, ChatBubble, Edit, Check, Close, Menu as MenuIcon } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../store'
import { createChat, sendMsg, setCur, editTitle } from '../../store/chatsSlice'

const SIDEBAR_W = 260

export default function Chatbot() {
  const dispatch = useAppDispatch()
  const { chats, curId } = useAppSelector(state => state.chats)
  const chat = useMemo(() => chats.find(c => c.id === curId)!, [chats, curId])

  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))   // AppBar: 56 on xs, 64 on sm+
  const upMd = useMediaQuery(theme.breakpoints.up('md'))   // Sidebar breakpoint
  const APPBAR_H = upSm ? 64 : 56

  const create = () => {
    dispatch(createChat())
    setEditing(true)
    setTitle(`New Chat ${chats.length + 1}`)
  }

  const send = () => {
    if (!input.trim()) return
    dispatch(sendMsg({ content: input, isBot: false }))
    setInput('')
    setTimeout(() => {
      dispatch(sendMsg({ content: 'Hi', isBot: true }))
    }, 400)
  }

  const saveTitle = () => {
    const t = title.trim() || chat.title
    dispatch(editTitle(t))
    setEditing(false)
  }

  const Sidebar = (
    <Box sx={{ width: SIDEBAR_W, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Button fullWidth variant="contained" startIcon={<Add/>} onClick={create}>New Chat</Button>
      </Box>
      <List dense sx={{ px: 1, overflowY: 'auto', flex: 1 }}>
        {chats.map(c=>(
          <ListItem key={c.id} disablePadding>
            <ListItemButton selected={c.id===curId} onClick={()=>{dispatch(setCur(c.id)); setEditing(false); setDrawerOpen(false)}}>
              <ListItemIcon sx={{ minWidth: 32 }}><ChatBubble fontSize="small"/></ListItemIcon>
              <ListItemText primaryTypographyProps={{ noWrap:true }} primary={c.title} secondary={new Date(c.last).toLocaleDateString()}/>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    // The wrapper takes the viewport minus AppBar and prevents page scroll
    <Box sx={{ height: `calc(100dvh - ${APPBAR_H}px)`, overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ height: '100%' }}>
        {/* Sidebar (hidden on mobile, Drawer instead) */}
        {upMd && (
          <Paper variant="outlined" sx={{ width: SIDEBAR_W, height: '100%', flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
            {Sidebar}
          </Paper>
        )}
        {!upMd && (
          <Drawer open={drawerOpen} onClose={()=>setDrawerOpen(false)}>
            {Sidebar}
          </Drawer>
        )}

        {/* Chat area */}
        <Paper sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header (fixed inside panel) */}
          <Box
            sx={{
              px: 2, py: 1, borderBottom: 1, borderColor: 'divider',
              display: 'flex', alignItems: 'center', gap: 1,
              bgcolor: 'primary.main', color: 'primary.contrastText',
              flexShrink: 0
            }}
          >
            {!upMd && (
              <IconButton size="small" sx={{ color:'inherit' }} onClick={()=>setDrawerOpen(true)}>
                <MenuIcon/>
              </IconButton>
            )}
            <SmartToy/>
            {!editing ? (
              <>
                <Typography variant="h6" sx={{ flex: 1, cursor: 'text' }} onDoubleClick={()=>{setTitle(chat.title); setEditing(true)}}>{chat.title}</Typography>
                <IconButton size="small" sx={{ color:'inherit' }} onClick={()=>{setTitle(chat.title); setEditing(true)}}><Edit/></IconButton>
              </>
            ) : (
              <>
                <TextField size="small" autoFocus value={title} onChange={(e)=>setTitle(e.target.value)}
                  onKeyDown={(e)=>{if(e.key==='Enter')saveTitle(); if(e.key==='Escape')setEditing(false)}}
                  sx={{ bgcolor:'background.paper', borderRadius:1, minWidth:{ xs: 160, sm: 240 }, flex:1,
                        '& .MuiInputBase-input':{ color:'text.primary' } }}/>
                <IconButton size="small" sx={{ color:'inherit' }} onClick={saveTitle}><Check/></IconButton>
                <IconButton size="small" sx={{ color:'inherit' }} onClick={()=>setEditing(false)}><Close/></IconButton>
              </>
            )}
          </Box>

          {/* Messages (scrolls inside) */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 } }}>
            {chat.msgs.map(m=>(
              <Box key={m.id} sx={{ display:'flex', flexDirection:m.isBot?'row':'row-reverse', alignItems:'flex-start', gap:1.25, mb:1.25 }}>
                <Box sx={{ mt:0.25, color:m.isBot?'secondary.main':'primary.main' }}>
                  {m.isBot ? <SmartToy fontSize="small"/> : <Person fontSize="small"/>}
                </Box>
                <Paper
                  variant={m.isBot?'outlined':'elevation'}
                  elevation={m.isBot?0:1}
                  sx={(t)=>({
                    px:1.5, py:1, maxWidth:'85%', borderRadius:2, wordBreak:'break-word',
                    bgcolor:m.isBot?'background.paper':alpha(t.palette.primary.main, .08)
                  })}
                >
                  <Typography variant="body2" sx={{ whiteSpace:'pre-wrap' }}>{m.content}</Typography>
                  <Typography variant="caption" sx={{ display:'block', mt:.5, color:'text.secondary', textAlign:m.isBot?'left':'right' }}>
                    {new Date(m.ts).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input (fixed inside panel) */}
          <Box sx={{ borderTop:1, borderColor:'divider', p: { xs: 1.25, sm: 2 }, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ p: 1, display:'flex', alignItems:'flex-end', gap:1, borderRadius:2 }}>
              <TextField
                fullWidth multiline minRows={2} value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() } }}
                placeholder="Type your message here…" variant="standard"
                InputProps={{ disableUnderline:true, sx:{ px:1 } }}
              />
              <IconButton color="primary" onClick={send} disabled={!input.trim()}><Send/></IconButton>
            </Paper>
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}
