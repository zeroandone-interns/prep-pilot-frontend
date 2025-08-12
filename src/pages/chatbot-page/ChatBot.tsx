import React, { useMemo, useState } from 'react'
import { Box, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, IconButton, TextField, Paper } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Send, SmartToy, Person, Add, ChatBubble, Edit, Check, Close } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../store'
import { createChat, sendMsg, setCur, editTitle } from '../../store/chatsSlice'

const NAVBAR = 64, SIDEBAR = 260

export default function Chatbot() {
  const dispatch = useAppDispatch()
  const { chats, curId } = useAppSelector(state => state.chats)
  const chat = useMemo(() => chats.find(c => c.id === curId)!, [chats, curId])

  const [input, setInput] = useState('')
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')

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

  return (
    <Box sx={{ position:'fixed', top: NAVBAR, left:0, right:0, bottom:0, display:'flex', bgcolor:'background.default' }}>
      <Box sx={{ width: SIDEBAR, borderRight:1, borderColor:'divider', display:'flex', flexDirection:'column' }}>
        <Box sx={{ p:2 }}>
          <Button fullWidth variant="contained" startIcon={<Add/>} onClick={create}>New Chat</Button>
        </Box>
        <List dense sx={{ px:1, overflowY:'auto' }}>
          {chats.map(c=>(
            <ListItem key={c.id} disablePadding>
              <ListItemButton selected={c.id===curId} onClick={()=>{dispatch(setCur(c.id)); setEditing(false)}}>
                <ListItemIcon sx={{ minWidth:32 }}><ChatBubble fontSize="small"/></ListItemIcon>
                <ListItemText primaryTypographyProps={{ noWrap:true }} primary={c.title} secondary={new Date(c.last).toLocaleDateString()}/>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Box sx={{ px:2, py:1, borderBottom:1, borderColor:'divider', display:'flex', alignItems:'center', gap:1,
                   bgcolor:'primary.main', color:'primary.contrastText' }}>
          <SmartToy/>
          {!editing ? (
            <>
              <Typography variant="h6" sx={{ flex:1, cursor:'text' }} onDoubleClick={()=>{setTitle(chat.title); setEditing(true)}}>{chat.title}</Typography>
              <IconButton size="small" sx={{ color:'inherit' }} onClick={()=>{setTitle(chat.title); setEditing(true)}}><Edit/></IconButton>
            </>
          ) : (
            <>
              <TextField size="small" autoFocus value={title} onChange={(e)=>setTitle(e.target.value)}
                         onKeyDown={(e)=>{if(e.key==='Enter')saveTitle(); if(e.key==='Escape')setEditing(false)}}
                         sx={{ bgcolor:'background.paper', borderRadius:1, minWidth:240, flex:1, '& .MuiInputBase-input':{ color:'text.primary' } }}/>
              <IconButton size="small" sx={{ color:'inherit' }} onClick={saveTitle}><Check/></IconButton>
              <IconButton size="small" sx={{ color:'inherit' }} onClick={()=>setEditing(false)}><Close/></IconButton>
            </>
          )}
        </Box>

        <Box sx={{ flex:1, overflowY:'auto', p:3 }}>
          {chat.msgs.map(m=>(
            <Box key={m.id} sx={{ display:'flex', flexDirection:m.isBot?'row':'row-reverse', alignItems:'flex-start', gap:1.25, mb:1.25 }}>
              <Box sx={{ mt:0.25, color:m.isBot?'primary.main':'secondary.main' }}>{m.isBot?<SmartToy fontSize="small"/>:<Person fontSize="small"/>}</Box>
              <Paper variant={m.isBot?'outlined':'elevation'} elevation={m.isBot?0:1}
                     sx={(t)=>({ px:1.5, py:1, maxWidth:'85%', borderRadius:2,
                                 bgcolor:m.isBot?'background.paper':alpha(t.palette.primary.main, .08) })}>
                <Typography variant="body2" sx={{ whiteSpace:'pre-wrap' }}>{m.content}</Typography>
                <Typography variant="caption" sx={{ display:'block', mt:.5, color:'text.secondary', textAlign:m.isBot?'left':'right' }}>
                  {new Date(m.ts).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box sx={{ borderTop:1, borderColor:'divider', p:2 }}>
          <Paper variant="outlined" sx={{ p:1, display:'flex', alignItems:'flex-end', gap:1, borderRadius:2 }}>
            <TextField fullWidth multiline minRows={2} value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() } }} placeholder="Type your message here…" variant="standard"
              InputProps={{ disableUnderline:true, sx:{ px:1 } }}/>
            <IconButton color="primary" onClick={send} disabled={!input.trim()}><Send/></IconButton>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
