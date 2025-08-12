import * as React from 'react'
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Drawer, Typography, Stack
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import VisibilityIcon from '@mui/icons-material/Visibility'
import AddIcon from '@mui/icons-material/PersonAdd'
import { useAppDispatch, useAppSelector } from '@/store'
import { addUser, deleteUser, selectUserById } from '@/store/usersSlice'

export default function AdminUsers() {
  const dispatch = useAppDispatch()
  const users = useAppSelector((s) => s.users.items)
  const courses = useAppSelector((s) => s.courses.items)

  // Add dialog state
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({ name: '', email: '', isAdmin: false })

  // View drawer state
  const [viewId, setViewId] = React.useState<string | null>(null)
  const viewed = useAppSelector((s) => selectUserById(s, viewId || ''))

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Users</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpen(true)}>
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Enrolled</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.isAdmin ? <Chip color="secondary" label="Admin" /> : 'User'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {u.enrollments.map((e) => {
                      const course = courses.find((c) => c.id === e.courseId)
                      return (
                        <Chip key={e.courseId} size="small" label={`${course?.title || 'Course'} • ${e.progress}%`} />
                      )
                    })}
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="primary" onClick={() => setViewId(u.id)}>
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton color="error" onClick={() => dispatch(deleteUser(u.id))}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add user dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add User</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: 360 }}>
          <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              dispatch(addUser({ name: form.name, email: form.email }))
              setForm({ name: '', email: '', isAdmin: false })
              setOpen(false)
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View drawer: user details */}
      <Drawer anchor="right" open={!!viewId} onClose={() => setViewId(null)}>
        <Box sx={{ width: 380, p: 2 }}>
          {viewed ? (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>{viewed.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{viewed.email}</Typography>

              <Typography variant="subtitle2">Enrolled Courses</Typography>
              <Stack spacing={1} sx={{ my: 1 }}>
                {viewed.enrollments.map((e) => {
                  const course = courses.find((c) => c.id === e.courseId)
                  return (
                    <Box key={e.courseId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{course?.title || 'Course'}</span>
                      <Chip size="small" label={`${e.progress}% done`} />
                    </Box>
                  )
                })}
              </Stack>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Chat Histories</Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {viewed.chats.map((c) => (
                  <Box key={c.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.title}</span>
                    <Chip size="small" label={`${c.messageCount} msgs`} />
                  </Box>
                ))}
              </Stack>
            </>
          ) : (
            <Typography sx={{ p: 2 }}>No user selected.</Typography>
          )}
        </Box>
      </Drawer>
    </Box>
  )
}