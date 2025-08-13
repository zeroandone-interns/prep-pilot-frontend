import * as React from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Drawer, Typography, Stack, Select, MenuItem, InputLabel, FormControl,
  Card, CardContent, CardActions, useMediaQuery
} from '@mui/material'
import { Visibility, Edit, Save, PersonAdd, Delete } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '@/store'
import { addUser, deleteUser, selectUserById, updateUser } from '@/store/usersSlice'
import { useTheme } from '@mui/material/styles'

export default function AdminUsers() {
  const d = useAppDispatch()
  const users = useAppSelector(s => s.users.items)
  const courses = useAppSelector(s => s.courses.items)
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))

  const [open, setOpen] = React.useState(false)
  const [addForm, setAdd] = React.useState({ firstName:'', lastName:'', email:'', role:'learner' as 'learner'|'admin' })

  const [viewId, setView] = React.useState<string | null>(null)
  const viewed = useAppSelector(s => selectUserById(s, viewId || ''))
  const [edit, setEdit] = React.useState(false)
  const [form, setForm] = React.useState({ firstName:'', lastName:'', email:'', role:'learner' as 'learner'|'admin' })

  React.useEffect(() => {
    if (!viewed) return
    setForm({ firstName:viewed.firstName, lastName:viewed.lastName, email:viewed.email, role:viewed.role })
  }, [viewed])

  return (
    <Box>
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:2 }}>
        <Typography variant="h5">Users</Typography>
        <Button startIcon={<PersonAdd/>} variant="contained" onClick={() => setOpen(true)}>Add User</Button>
      </Box>

      {upSm ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} hover>
                  <TableCell>{u.firstName} {u.lastName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Chip size="small" color={u.role==='admin'?'secondary':'default'} label={u.role}/></TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={()=>{setView(u.id); setEdit(false)}}><Visibility/></IconButton>
                    <IconButton color="primary" onClick={()=>{setView(u.id); setEdit(true)}}><Edit/></IconButton>
                    <IconButton color="error" onClick={()=>d(deleteUser(u.id))}><Delete/></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Stack spacing={1.5}>
          {users.map(u => (
            <Card key={u.id} variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">{u.firstName} {u.lastName}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{u.email}</Typography>
                <Chip size="small" color={u.role==='admin'?'secondary':'default'} label={u.role}/>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button size="small" onClick={()=>{setView(u.id); setEdit(false)}} startIcon={<Visibility/>}>View</Button>
                <Button size="small" onClick={()=>{setView(u.id); setEdit(true)}} startIcon={<Edit/>}>Edit</Button>
                <Button size="small" color="error" onClick={()=>d(deleteUser(u.id))} startIcon={<Delete/>}>Delete</Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={()=>setOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent sx={{ pt:2, display:'grid', gap:2, minWidth:{ xs: 320, sm: 420 } }}>
          <TextField label="First name" value={addForm.firstName} onChange={e=>setAdd({...addForm, firstName:e.target.value})}/>
          <TextField label="Last name"  value={addForm.lastName}  onChange={e=>setAdd({...addForm, lastName:e.target.value})}/>
          <TextField label="Email" type="email" value={addForm.email} onChange={e=>setAdd({...addForm, email:e.target.value})}/>
          <FormControl>
            <InputLabel id="role">Role</InputLabel>
            <Select labelId="role" label="Role" value={addForm.role}
              onChange={e=>setAdd({...addForm, role:e.target.value as 'learner'|'admin'})}>
              <MenuItem value="learner">Learner</MenuItem><MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={()=>{
            if(!addForm.firstName||!addForm.lastName||!addForm.email) return
            d(addUser(addForm)); setAdd({ firstName:'', lastName:'', email:'', role:'learner' }); setOpen(false)
          }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={!!viewId} onClose={()=>setView(null)}>
        <Box sx={{ width:{ xs: 320, sm: 420 }, p:2 }}>
          {!viewed ? <Typography>No user selected.</Typography> : (
            <>
              <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:1.5 }}>
                <Typography variant="h6">{viewed.firstName} {viewed.lastName}</Typography>
                {edit
                  ? <Button size="small" startIcon={<Save/>} variant="contained"
                      onClick={()=>{ d(updateUser({ id:viewed.id, changes:form })); setEdit(false) }}>Save</Button>
                  : <Button size="small" startIcon={<Edit/>} onClick={()=>setEdit(true)}>Edit</Button>}
              </Box>

              <Stack spacing={1.5} sx={{ mb:2 }}>
                <TextField label="First name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} disabled={!edit}/>
                <TextField label="Last name"  value={form.lastName}  onChange={e=>setForm({...form,lastName:e.target.value})} disabled={!edit}/>
                <TextField label="Email" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} disabled={!edit}/>
                <FormControl disabled={!edit}>
                  <InputLabel id="role2">Role</InputLabel>
                  <Select labelId="role2" label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value as 'learner'|'admin'})}>
                    <MenuItem value="learner">Learner</MenuItem><MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Typography variant="subtitle2">Enrolled Courses</Typography>
              <Stack spacing={1} sx={{ my:1 }}>
                {viewed.enrollments.length===0 && <Typography variant="body2" color="text.secondary">No enrollments.</Typography>}
                {viewed.enrollments.map(e=>{
                  const c = courses.find(x=>x.id===e.courseId)
                  return <Box key={e.courseId} sx={{ display:'flex', justifyContent:'space-between' }}>
                    <span>{c?.title||'Course'}</span><Chip size="small" label={`${e.progress}% done`}/>
                  </Box>
                })}
              </Stack>

              <Typography variant="subtitle2" sx={{ mt:2 }}>Chat Histories</Typography>
              <Stack spacing={1} sx={{ mt:1 }}>
                {viewed.chats.length===0 && <Typography variant="body2" color="text.secondary">No chats.</Typography>}
                {viewed.chats.map(c=><Box key={c.id} sx={{ display:'flex', justifyContent:'space-between' }}>
                  <span>{c.title}</span><Chip size="small" label={`${c.messageCount} msgs`}/>
                </Box>)}
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}
