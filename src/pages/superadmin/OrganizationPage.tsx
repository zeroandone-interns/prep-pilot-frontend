// src/pages/superadmin/OrganizationsPage.tsx
// Requires: VITE_API_URL in your frontend .env (e.g., VITE_API_URL=http://localhost:3000)

import * as React from 'react'
import {
  Box, Typography, Button, Stack, Paper, TextField, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  useMediaQuery, Snackbar, Alert, Divider, List, ListItem, ListItemText, MenuItem
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import SaveIcon from '@mui/icons-material/Save'
import CloseIcon from '@mui/icons-material/Close'
import BusinessIcon from '@mui/icons-material/Business'
import SearchIcon from '@mui/icons-material/Search'
import GroupIcon from '@mui/icons-material/Group'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PersonOffIcon from '@mui/icons-material/PersonOff'
import axios, { AxiosError, AxiosHeaders } from 'axios'
import type { InternalAxiosRequestConfig } from 'axios'

type ApiOrg = { id: number; name: string; usersCount: number; coursesCount: number }
type Organization = { id: number; name: string; usersCount: number; coursesCount: number }

// Match your backend select in OrganizationsService (id, cognito_sub, organization_id)
type Instructor = { id: number; cognito_sub: string | null; organization_id: number | null }

// AdminCreateUserDto (backend)
type AdminCreateUserBody = {
  email: string
  firstName: string
  lastName: string
  role: 'instructor' | 'learner'
  organizationId: number
}

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000',
})

// Safe interceptor: don’t replace `headers`, set on it.
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('jwt') // optional
  if (token) {
    const h = config.headers
    if (h && typeof (h as AxiosHeaders).set === 'function') {
      ;(h as AxiosHeaders).set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = { ...(h as any), Authorization: `Bearer ${token}` }
    }
  }
  return config
})

export default function OrganizationsPage() {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))

  const [orgs, setOrgs] = React.useState<Organization[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState('')

  // Create org
  const [createOpen, setCreateOpen] = React.useState(false)
  const [createName, setCreateName] = React.useState('')

  // Edit org
  const [editOpen, setEditOpen] = React.useState(false)
  const [editOrg, setEditOrg] = React.useState<Organization | null>(null)
  const [editName, setEditName] = React.useState('')

  // Delete org
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<Organization | null>(null)

  // Instructors dialog
  const [instOpen, setInstOpen] = React.useState(false)
  const [instOrg, setInstOrg] = React.useState<Organization | null>(null)
  const [instructors, setInstructors] = React.useState<Instructor[]>([])
  const [instLoading, setInstLoading] = React.useState(false)
  const [instUserId, setInstUserId] = React.useState<string>('') // as text input, parse to int
  const [instFilter, setInstFilter] = React.useState('')

  // Admin-create user dialog (creates user in Cognito and DB, attached to this org)
  const [adminCreateOpen, setAdminCreateOpen] = React.useState(false)
  const [adminForm, setAdminForm] = React.useState<AdminCreateUserBody>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'instructor',
    organizationId: 0, // filled when opening dialog for a specific org
  })
  const [adminSubmitting, setAdminSubmitting] = React.useState(false)

  const onAxiosError = (e: unknown, fallback: string) => {
    if (axios.isAxiosError(e)) {
      const ae = e as AxiosError<any>
      setError(ae.response?.data?.message || ae.message || fallback)
    } else setError(fallback)
  }

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { data } = await api.get<ApiOrg[]>('/organizations')
      setOrgs(data.map(o => ({
        id: o.id, name: o.name, usersCount: o.usersCount, coursesCount: o.coursesCount
      })))
    } catch (e) {
      onAxiosError(e, 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? orgs.filter(o => o.name.toLowerCase().includes(q)) : orgs
  }, [orgs, filter])

  // ---------- Create ----------
  async function createOrg() {
    const name = createName.trim()
    if (!name) return
    try {
      const { data } = await api.post<ApiOrg>('/organizations', { name })
      setOrgs(prev => [
        { id: data.id, name: data.name, usersCount: data.usersCount, coursesCount: data.coursesCount },
        ...prev
      ])
      setCreateName(''); setCreateOpen(false)
      setSuccess('Organization created')
    } catch (e) {
      onAxiosError(e, 'Failed to create organization')
    }
  }

  // ---------- Edit ----------
  function openEdit(o: Organization) {
    setEditOrg(o)
    setEditName(o.name)
    setEditOpen(true)
  }
  async function saveEdit() {
    if (!editOrg) return
    const newName = editName.trim()
    if (!newName || newName === editOrg.name) {
      setEditOpen(false)
      return
    }
    try {
      const { data } = await api.patch<ApiOrg>(`/organizations/${editOrg.id}`, { name: newName })
      setOrgs(prev => prev.map(o => o.id === editOrg.id ? {
        id: data.id, name: data.name, usersCount: data.usersCount, coursesCount: data.coursesCount
      } : o))
      setSuccess('Organization updated')
      setEditOpen(false)
      setEditOrg(null)
    } catch (e) {
      onAxiosError(e, 'Failed to update organization')
    }
  }

  // ---------- Delete ----------
  async function confirmDelete() {
    if (!toDelete) return
    try {
      await api.delete(`/organizations/${toDelete.id}`)
      setOrgs(prev => prev.filter(o => o.id !== toDelete.id))
      setSuccess('Organization deleted')
    } catch (e) {
      onAxiosError(e, 'Cannot delete organization (has users/courses?)')
    } finally {
      setConfirmOpen(false); setToDelete(null)
    }
  }

  // ---------- Instructors ----------
  async function openInstructors(org: Organization) {
    setInstOrg(org)
    setInstFilter('')
    setInstUserId('')
    setInstructors([])
    setInstOpen(true)
    await loadInstructors(org.id)
  }

  async function loadInstructors(orgId: number) {
    setInstLoading(true)
    try {
      const { data } = await api.get<Instructor[]>(`/organizations/${orgId}/instructors`)
      setInstructors(data)
    } catch (e) {
      onAxiosError(e, 'Failed to load instructors')
    } finally {
      setInstLoading(false)
    }
  }

  async function addInstructor() {
    if (!instOrg) return
    const idNum = parseInt(instUserId, 10)
    if (!idNum || Number.isNaN(idNum)) {
      setError('Please enter a valid numeric user ID')
      return
    }
    try {
      await api.post(`/organizations/${instOrg.id}/instructors`, { userId: idNum })
      setInstUserId('')
      await loadInstructors(instOrg.id)
      // also bump the usersCount in the table for this org
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o))
      setSuccess(`User #${idNum} added to ${instOrg.name}`)
    } catch (e) {
      onAxiosError(e, 'Failed to add instructor')
    }
  }

  async function removeInstructor(userId: number) {
    if (!instOrg) return
    try {
      await api.delete(`/organizations/${instOrg.id}/instructors/${userId}`)
      await loadInstructors(instOrg.id)
      // decrement usersCount in the table
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: Math.max(0, o.usersCount - 1) } : o))
      setSuccess(`User #${userId} removed from ${instOrg.name}`)
    } catch (e) {
      onAxiosError(e, 'Failed to remove instructor')
    }
  }

  // Delete instructor entirely (Cognito + DB) using /users/:sub
  async function deleteInstructorEverywhere(cognitoSub: string) {
    if (!instOrg) return
    try {
      await api.delete(`/users/${encodeURIComponent(cognitoSub)}`)
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: Math.max(0, o.usersCount - 1) } : o))
      setSuccess(`User with sub ${cognitoSub} deleted from Cognito & DB`)
    } catch (e) {
      onAxiosError(e, 'Failed to delete user from Cognito/DB')
    }
  }

  const filteredInstructors = React.useMemo(() => {
    const q = instFilter.trim().toLowerCase()
    if (!q) return instructors
    // filter by id or cognito_sub string
    return instructors.filter(i =>
      String(i.id).includes(q) ||
      (i.cognito_sub ?? '').toLowerCase().includes(q)
    )
  }, [instructors, instFilter])

  // ----- Admin-create user -----
  function openAdminCreateForOrg(org: Organization) {
    setAdminForm({
      email: '',
      firstName: '',
      lastName: '',
      role: 'instructor',
      organizationId: org.id,
    })
    setAdminCreateOpen(true)
  }

  async function submitAdminCreate() {
    if (!adminForm.email || !adminForm.firstName || !adminForm.lastName || !adminForm.role || !adminForm.organizationId) {
      setError('All fields are required')
      return
    }
    setAdminSubmitting(true)
    try {
      await api.post('/users/admin-create', adminForm as AdminCreateUserBody)
      setAdminSubmitting(false)
      setAdminCreateOpen(false)
      setSuccess('User created and attached to organization')
      if (instOrg && instOrg.id === adminForm.organizationId) {
        await loadInstructors(instOrg.id)
        setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o))
      } else {
        // reload org list to refresh counts
        await load()
      }
    } catch (e) {
      setAdminSubmitting(false)
      onAxiosError(e, 'Failed to create user')
    }
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <BusinessIcon color="primary" />
          <Typography variant="h5">Organizations</Typography>
          {loading && <Chip size="small" label="Loading…" />}
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            placeholder="Search organizations…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Organization
          </Button>
        </Stack>
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size={upSm ? 'small' : 'medium'}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Users</TableCell>
              <TableCell align="right">Courses</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ width: 280 }}>
                  <Typography variant="subtitle2">{o.name}</Typography>
                </TableCell>
                <TableCell align="right">{o.usersCount}</TableCell>
                <TableCell align="right">{o.coursesCount}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <Tooltip title="Edit Organization">
                    <IconButton onClick={() => openEdit(o)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Manage Instructors">
                    <IconButton onClick={() => openInstructors(o)}>
                      <GroupIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Create & Attach User">
                    <IconButton color="primary" onClick={() => openAdminCreateForOrg(o)}>
                      <PersonOutlineIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Organization">
                    <IconButton color="error" onClick={() => { setToDelete(o); setConfirmOpen(true) }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography align="center" color="text.secondary">No organizations found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>New Organization</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: { xs: 320, sm: 420 } }}>
          <TextField
            autoFocus
            label="Organization name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="e.g., Stark Industries"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createOrg} disabled={!createName.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit organization</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: { xs: 320, sm: 420 } }}>
          <TextField
            autoFocus
            label="Organization name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Organization name"
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<CloseIcon />} onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button startIcon={<SaveIcon />} variant="contained" onClick={saveEdit} disabled={!editName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete organization</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <strong>{toDelete?.name}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Instructors dialog */}
      <Dialog open={instOpen} onClose={() => setInstOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Manage Instructors {instOrg ? `— ${instOrg.name}` : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="User ID to add"
              value={instUserId}
              onChange={(e) => setInstUserId(e.target.value)}
              InputProps={{ startAdornment: <PersonAddIcon fontSize="small" sx={{ mr: 1 }} /> as any }}
            />
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={addInstructor} disabled={!instUserId.trim()}>
              Add
            </Button>
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <SearchIcon fontSize="small" />
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by ID or Cognito Sub…"
              value={instFilter}
              onChange={(e) => setInstFilter(e.target.value)}
            />
            {instLoading && <Chip size="small" label="Loading…" />}
          </Stack>

          <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, maxHeight: 360, overflow: 'auto' }}>
            {filteredInstructors.map((i) => (
              <ListItem
                key={i.id}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    {/* Remove from org */}
                    <Tooltip title="Remove from organization">
                      <IconButton edge="end" color="error" onClick={() => removeInstructor(i.id)}>
                        <PersonRemoveIcon />
                      </IconButton>
                    </Tooltip>
                    {/* Delete user everywhere (Cognito + DB) */}
                    {i.cognito_sub && (
                      <Tooltip title="Delete user (Cognito + DB)">
                        <IconButton edge="end" onClick={() => deleteInstructorEverywhere(i.cognito_sub!)}>
                          <PersonOffIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                }
              >
                <ListItemText
                  primary={`User #${i.id}`}
                  secondary={i.cognito_sub ? `cognito_sub: ${i.cognito_sub}` : 'cognito_sub: —'}
                />
              </ListItem>
            ))}
            {filteredInstructors.length === 0 && (
              <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                {instLoading ? 'Loading…' : 'No instructors found.'}
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Admin-create user dialog */}
      <Dialog open={adminCreateOpen} onClose={() => setAdminCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOutlineIcon />
          Create & Attach User {adminForm.organizationId ? `— Org #${adminForm.organizationId}` : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={adminForm.email}
            onChange={(e) => setAdminForm(v => ({ ...v, email: e.target.value }))}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              label="First name"
              value={adminForm.firstName}
              onChange={(e) => setAdminForm(v => ({ ...v, firstName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Last name"
              value={adminForm.lastName}
              onChange={(e) => setAdminForm(v => ({ ...v, lastName: e.target.value }))}
              fullWidth
            />
          </Stack>
          <TextField
            select
            label="Role"
            value={adminForm.role}
            onChange={(e) => setAdminForm(v => ({ ...v, role: e.target.value as 'instructor' | 'learner' }))}
            fullWidth
          >
            <MenuItem value="instructor">instructor</MenuItem>
            <MenuItem value="learner">learner</MenuItem>
          </TextField>
          <TextField
            label="Organization ID"
            value={adminForm.organizationId}
            onChange={(e) => setAdminForm(v => ({ ...v, organizationId: Number(e.target.value) || 0 }))}
            type="number"
            fullWidth
            helperText="Pre-filled based on the selected organization; you can change it if needed."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAdminCreate}
            disabled={
              adminSubmitting ||
              !adminForm.email ||
              !adminForm.firstName ||
              !adminForm.lastName ||
              !adminForm.role ||
              !adminForm.organizationId
            }
          >
            {adminSubmitting ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alerts */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={3500} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
}
