// src/pages/superadmin/OrganizationsPage.tsx
// Requires VITE_API_URL in your frontend .env (e.g., VITE_API_URL=http://localhost:3000)

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

/** Backend payloads */
type ApiOrg = { id: number; name: string; usersCount: number; coursesCount: number }
type Organization = { id: number; name: string; usersCount: number; coursesCount: number }

/** From OrganizationsService.listInstructors (DB) */
type DbInstructor = { id: number; cognito_sub: string | null; organization_id: number | null }

/** Enriched instructor row for UI (DB + Cognito) */
type UiInstructor = {
  id: number                 // DB user id (needed for remove-by-id)
  sub: string | null         // Cognito sub (needed for delete everywhere)
  username?: string | null   // from Cognito (Username)
  email?: string | null      // from Cognito attributes.email
  firstName?: string | null  // from Cognito attributes.given_name
  lastName?: string | null   // from Cognito attributes.family_name
}

/** Matches AdminCreateUserDto (backend) */
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

/** Attach Authorization header if localStorage.jwt exists */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('jwt')
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
  const [instructors, setInstructors] = React.useState<UiInstructor[]>([])
  const [instLoading, setInstLoading] = React.useState(false)
  const [instFilter, setInstFilter] = React.useState('')
  const [existingUserId, setExistingUserId] = React.useState<string>('') // path A: attach existing user by ID

  // Inline "Create Instructor" (email + username only)
  const [email, setEmail] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [creatingInstructor, setCreatingInstructor] = React.useState(false)

  // Separate admin-create dialog (optional, still available)
  const [adminCreateOpen, setAdminCreateOpen] = React.useState(false)
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
    setEditOrg(o); setEditName(o.name); setEditOpen(true)
  }
  async function saveEdit() {
    if (!editOrg) return
    const newName = editName.trim()
    if (!newName || newName === editOrg.name) {
      setEditOpen(false); return
    }
    try {
      const { data } = await api.patch<ApiOrg>(`/organizations/${editOrg.id}`, { name: newName })
      setOrgs(prev => prev.map(o => o.id === editOrg.id ? {
        id: data.id, name: data.name, usersCount: data.usersCount, coursesCount: data.coursesCount
      } : o))
      setSuccess('Organization updated')
      setEditOpen(false); setEditOrg(null)
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
    setExistingUserId('')
    setEmail('')
    setUsername('')
    setInstructors([])
    setInstOpen(true)
    await loadInstructors(org.id)
  }

  /**
   * Loads instructors with DB IDs and enriches them with Cognito info
   * so we can show username/email while still knowing DB userId.
   */
  async function loadInstructors(orgId: number) {
    setInstLoading(true)
    try {
      // 1) DB side: get user IDs + subs
      const { data: dbUsers } = await api.get<DbInstructor[]>(`/organizations/${orgId}/instructors`)
      // 2) Cognito info (email/username/first/last) for this org
      const { data: cognitoInfos } = await api.get<any[]>(`/users/by-org/${orgId}`)

      // Build lookup by sub from Cognito
      // cognitoInfos[i] shape (from your service): { username, attributes: { email, given_name, family_name, sub }, ... }
      const bySub = new Map<string, any>()
      for (const info of cognitoInfos) {
        const subFromAttrs = info?.attributes?.sub
        if (subFromAttrs) bySub.set(subFromAttrs, info)
      }

      // Join
      const uiRows: UiInstructor[] = dbUsers.map(u => {
        const info = u.cognito_sub ? bySub.get(u.cognito_sub) : null
        return {
          id: u.id,
          sub: u.cognito_sub,
          username: info?.username ?? null,
          email: info?.attributes?.email ?? null,
          firstName: info?.attributes?.given_name ?? null,
          lastName: info?.attributes?.family_name ?? null,
        }
      })

      setInstructors(uiRows)
    } catch (e) {
      onAxiosError(e, 'Failed to load instructors')
    } finally {
      setInstLoading(false)
    }
  }

  // Path A: attach existing user by numeric id → assign to org
  async function attachExistingUser() {
    if (!instOrg) return
    const idNum = parseInt(existingUserId, 10)
    if (!idNum || Number.isNaN(idNum)) {
      setError('Please enter a valid numeric user ID')
      return
    }
    try {
      await api.post(`/organizations/${instOrg.id}/instructors`, { userId: idNum })
      setExistingUserId('')
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o))
      setSuccess(`User #${idNum} attached to ${instOrg.name}`)
    } catch (e) {
      onAxiosError(e, 'Failed to attach user')
    }
  }

  // Path B: create brand-new instructor with only email + username (we auto-map to AdminCreateUserDto)
  async function createInstructorInline() {
    if (!instOrg) return
    const cleanEmail = email.trim()
    const cleanUsername = username.trim()
    if (!cleanEmail || !cleanUsername) {
      setError('Email and Username are required')
      return
    }
    // Map to AdminCreateUserDto:
    const payload: AdminCreateUserBody = {
      email: cleanEmail,
      firstName: cleanUsername,
      lastName: cleanUsername,        // backend requires lastName; mirror username
      role: 'instructor',
      organizationId: instOrg.id,
    }

    setCreatingInstructor(true)
    try {
      const { data } = await api.post('/users/admin-create', payload)
      // (data.tempPassword, data.cognitoSub available if you want to show)
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? ({ ...o, usersCount: o.usersCount + 1 }) : o))
      setEmail('')
      setUsername('')
      setSuccess('Instructor created and attached to organization')
    } catch (e) {
      onAxiosError(e, 'Failed to create instructor')
    } finally {
      setCreatingInstructor(false)
    }
  }

  async function removeInstructor(userId: number) {
    if (!instOrg) return
    try {
      await api.delete(`/organizations/${instOrg.id}/instructors/${userId}`)
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: Math.max(0, o.usersCount - 1) } : o))
      setSuccess(`User #${userId} removed from ${instOrg.name}`)
    } catch (e) {
      onAxiosError(e, 'Failed to remove instructor')
    }
  }

  // Delete user entirely (Cognito + DB) by sub
  async function deleteInstructorEverywhere(sub: string | null) {
    if (!instOrg || !sub) return
    try {
      await api.delete(`/users/${encodeURIComponent(sub)}`)
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: Math.max(0, o.usersCount - 1) } : o))
      setSuccess(`User deleted from Cognito & DB`)
    } catch (e) {
      onAxiosError(e, 'Failed to delete user from Cognito/DB')
    }
  }

  const filteredInstructors = React.useMemo(() => {
    const q = instFilter.trim().toLowerCase()
    if (!q) return instructors
    return instructors.filter(i =>
      String(i.id).includes(q) ||
      (i.username ?? '').toLowerCase().includes(q) ||
      (i.email ?? '').toLowerCase().includes(q)
    )
  }, [instructors, instFilter])

  // Optional: separate admin-create dialog from table row
  function openAdminCreateForOrg(org: Organization) {
    setAdminCreateOpen(true)
    // prefill with current instOrg if any, otherwise org clicked
    setInstOrg(org)
    setEmail('')
    setUsername('')
  }

  async function submitAdminCreateDialog() {
    if (!instOrg) return
    const cleanEmail = email.trim()
    const cleanUsername = username.trim()
    if (!cleanEmail || !cleanUsername) {
      setError('Email and Username are required')
      return
    }
    const payload: AdminCreateUserBody = {
      email: cleanEmail,
      firstName: cleanUsername,
      lastName: cleanUsername,
      role: 'instructor',
      organizationId: instOrg.id,
    }
    setAdminSubmitting(true)
    try {
      await api.post('/users/admin-create', payload)
      setAdminSubmitting(false)
      setAdminCreateOpen(false)
      setSuccess('User created and attached to organization')
      await loadInstructors(instOrg.id)
      setOrgs(prev => prev.map(o => o.id === instOrg.id ? { ...o, usersCount: o.usersCount + 1 } : o))
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
                  <Tooltip title="Quick Create Instructor">
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
      <Dialog open={instOpen} onClose={() => setInstOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupIcon />
          Manage Instructors {instOrg ? `— ${instOrg.name}` : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          {/* Path A: attach existing user by ID */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Attach existing user by ID"
              value={existingUserId}
              onChange={(e) => setExistingUserId(e.target.value)}
              InputProps={{ startAdornment: <PersonAddIcon fontSize="small" sx={{ mr: 1 }} /> as any }}
            />
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={attachExistingUser} disabled={!existingUserId.trim()}>
              Attach
            </Button>
          </Stack>

          <Divider textAlign="left">or Create a New Instructor</Divider>

          {/* Path B: create brand-new instructor (Email + Username only) */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              helperText="We’ll auto-fill first/last name with Username and create an instructor."
            />
            <Button
              variant="contained"
              onClick={createInstructorInline}
              disabled={creatingInstructor || !email.trim() || !username.trim()}
            >
              {creatingInstructor ? 'Creating…' : 'Create Instructor'}
            </Button>
          </Stack>

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
            <SearchIcon fontSize="small" />
            <TextField
              fullWidth
              size="small"
              placeholder="Filter by ID, Username, or Email…"
              value={instFilter}
              onChange={(e) => setInstFilter(e.target.value)}
            />
            {instLoading && <Chip size="small" label="Loading…" />}
          </Stack>

          <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, maxHeight: 420, overflow: 'auto' }}>
            {filteredInstructors.map((i) => (
              <ListItem
                key={`${i.id}-${i.sub ?? ''}`}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    {/* Remove from org (by DB user id) */}
                    <Tooltip title="Remove from organization">
                      <IconButton edge="end" color="error" onClick={() => removeInstructor(i.id)}>
                        <PersonRemoveIcon />
                      </IconButton>
                    </Tooltip>
                    {/* Delete user everywhere (Cognito + DB) */}
                    {i.sub && (
                      <Tooltip title="Delete user (Cognito + DB)">
                        <IconButton edge="end" onClick={() => deleteInstructorEverywhere(i.sub!)}>
                          <PersonOffIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                }
              >
                <ListItemText
                  primary={i.username || i.email || `User #${i.id}`}
                  secondary={[
                    i.email ? `Email: ${i.email}` : null,
                    i.username ? `Username: ${i.username}` : null,
                    `User ID: ${i.id}`,
                    i.sub ? `Sub: ${i.sub}` : null,
                  ].filter(Boolean).join(' · ')}
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

      {/* Quick Admin-create dialog (optional shortcut from table) */}
      <Dialog open={adminCreateOpen} onClose={() => setAdminCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOutlineIcon />
          Quick Create Instructor {instOrg ? `— Org #${instOrg.id}` : ''}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            helperText="We’ll auto-fill first/last name with this Username."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAdminCreateDialog}
            disabled={adminSubmitting || !email.trim() || !username.trim()}
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
