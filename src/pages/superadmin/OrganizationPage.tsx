import * as React from 'react'
import {
  Box, Typography, Button, Stack, Paper, TextField, Chip, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, CardActions,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Drawer, Divider, List, ListItem, ListItemText, ListItemSecondaryAction,
  useMediaQuery
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import BusinessIcon from '@mui/icons-material/Business'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'

// ------------------------
// Types (frontend-only)
// ------------------------
type AdminUser = {
  id: string
  firstName: string
  lastName: string
  email: string
}

type Organization = {
  id: string
  name: string
  createdAt: string
  admins: AdminUser[]
  usersCount: number
  coursesCount: number
  // Optionally domains or tags later
}

// ------------------------
// Mock seed (replace via API later)
// ------------------------
const SEED_ORGS: Organization[] = [
  {
    id: 'o-1001',
    name: 'Acme Corp',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    admins: [
      { id: 'a-1', firstName: 'Dana', lastName: 'Lee', email: 'dana@acme.com' },
      { id: 'a-2', firstName: 'Tom', lastName: 'Green', email: 'tom@acme.com' },
    ],
    usersCount: 184,
    coursesCount: 12,
  },
  {
    id: 'o-1002',
    name: 'Globex',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    admins: [
      { id: 'a-3', firstName: 'Maya', lastName: 'R.', email: 'maya@globex.io' },
    ],
    usersCount: 63,
    coursesCount: 7,
  },
]

// ------------------------
// Page
// ------------------------
export default function OrganizationsPage() {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))

  const [orgs, setOrgs] = React.useState<Organization[]>(SEED_ORGS)
  const [filter, setFilter] = React.useState('')

  const [createOpen, setCreateOpen] = React.useState(false)
  const [createForm, setCreateForm] = React.useState({ name: '' })

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [toDelete, setToDelete] = React.useState<Organization | null>(null)

  const [viewId, setViewId] = React.useState<string | null>(null)
  const viewed = React.useMemo(() => orgs.find(o => o.id === viewId) || null, [orgs, viewId])

  const [addAdminOpen, setAddAdminOpen] = React.useState(false)
  const [adminForm, setAdminForm] = React.useState({ firstName: '', lastName: '', email: '' })

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return orgs
    return orgs.filter(o =>
      o.name.toLowerCase().includes(q) ||
      o.admins.some(a =>
        a.email.toLowerCase().includes(q) ||
        (a.firstName + ' ' + a.lastName).toLowerCase().includes(q)
      )
    )
  }, [orgs, filter])

  // ------------------------
  // Handlers (replace with API calls later)
  // ------------------------
  function createOrg() {
    const name = createForm.name.trim()
    if (!name) return
    const newOrg: Organization = {
      id: `o-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      admins: [],
      usersCount: 0,
      coursesCount: 0,
    }
    // TODO: POST /api/organizations
    setOrgs(prev => [newOrg, ...prev])
    setCreateForm({ name: '' })
    setCreateOpen(false)
  }

  function askDelete(org: Organization) {
    setToDelete(org)
    setConfirmOpen(true)
  }

  function confirmDelete() {
    if (!toDelete) return
    // TODO: DELETE /api/organizations/:id
    setOrgs(prev => prev.filter(o => o.id !== toDelete.id))
    if (viewId === toDelete.id) setViewId(null)
    setConfirmOpen(false)
    setToDelete(null)
  }

  function addAdmin() {
    if (!viewed) return
    const fn = adminForm.firstName.trim()
    const ln = adminForm.lastName.trim()
    const em = adminForm.email.trim()
    if (!fn || !ln || !em) return
    const newAdmin: AdminUser = { id: `a-${Date.now()}`, firstName: fn, lastName: ln, email: em }
    // TODO: POST /api/organizations/:id/admins
    setOrgs(prev => prev.map(o => o.id === viewed.id ? { ...o, admins: [...o.admins, newAdmin] } : o))
    setAdminForm({ firstName: '', lastName: '', email: '' })
    setAddAdminOpen(false)
  }

  function removeAdmin(adminId: string) {
    if (!viewed) return
    // TODO: DELETE /api/organizations/:id/admins/:adminId
    setOrgs(prev => prev.map(o => o.id === viewed.id ? { ...o, admins: o.admins.filter(a => a.id !== adminId) } : o))
  }

  // ------------------------
  // UI
  // ------------------------
  return (
    <Box>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <BusinessIcon color="primary" />
          <Typography variant="h5">Organizations</Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            size="small"
            placeholder="Search organizations or admins…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            New Organization
          </Button>
        </Stack>
      </Stack>

      {/* Content */}
      {upSm ? (
        // Desktop: table
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Admins</TableCell>
                <TableCell align="right">Users</TableCell>
                <TableCell align="right">Courses</TableCell>
                <TableCell align="right">Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell sx={{ width: 280 }}>
                    <Typography variant="subtitle2">{o.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {o.admins.slice(0, 4).map(a => (
                        <Chip key={a.id} size="small" color="secondary" variant="outlined" label={a.email} />
                      ))}
                      {o.admins.length > 4 && <Chip size="small" label={`+${o.admins.length - 4}`} />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{o.usersCount}</TableCell>
                  <TableCell align="right">{o.coursesCount}</TableCell>
                  <TableCell align="right">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Manage Admins">
                      <IconButton color="primary" onClick={() => setViewId(o.id)}>
                        <AdminPanelSettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Organization">
                      <IconButton color="error" onClick={() => askDelete(o)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography align="center" color="text.secondary">No organizations match your search.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Mobile: cards
        <Stack spacing={1.25}>
          {filtered.map((o) => (
            <Card key={o.id} variant="outlined" sx={{ borderRadius: 3, borderColor: alpha(theme.palette.primary.main, 0.18) }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: .25 }}>{o.name}</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip size="small" label={`${o.usersCount} users`} />
                  <Chip size="small" label={`${o.coursesCount} courses`} />
                  <Chip size="small" label={`Created ${new Date(o.createdAt).toLocaleDateString()}`} />
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {o.admins.slice(0, 3).map(a => <Chip key={a.id} size="small" color="secondary" variant="outlined" label={a.email} />)}
                  {o.admins.length > 3 && <Chip size="small" label={`+${o.admins.length - 3}`} />}
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button size="small" startIcon={<AdminPanelSettingsIcon />} onClick={() => setViewId(o.id)}>Manage</Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => askDelete(o)}>Delete</Button>
              </CardActions>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography align="center" color="text.secondary">No organizations match your search.</Typography>
            </Paper>
          )}
        </Stack>
      )}

      {/* Create organization dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <DialogTitle>New Organization</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: { xs: 320, sm: 420 } }}>
          <TextField
            autoFocus
            label="Organization name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ name: e.target.value })}
            placeholder="e.g., Stark Industries"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createOrg} disabled={!createForm.name.trim()}>Create</Button>
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

      {/* Drawer: manage admins (superAdmin can only manage admins, not inner content) */}
      <Drawer anchor="right" open={!!viewId} onClose={() => setViewId(null)}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {!viewed ? (
            <Typography>No organization selected.</Typography>
          ) : (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">{viewed.name}</Typography>
                <IconButton onClick={() => setViewId(null)}><CloseIcon /></IconButton>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap">
                <Chip label={`${viewed.usersCount} users`} />
                <Chip label={`${viewed.coursesCount} courses`} />
                <Chip label={`Created ${new Date(viewed.createdAt).toLocaleDateString()}`} />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1">Admins</Typography>
                <Button size="small" startIcon={<GroupAddIcon />} onClick={() => setAddAdminOpen(true)}>Add admin</Button>
              </Stack>

              <Paper variant="outlined" sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex' }}>
                <List sx={{ width: '100%', overflowY: 'auto' }}>
                  {viewed.admins.length === 0 && (
                    <ListItem><ListItemText primary="No admins yet." primaryTypographyProps={{ color: 'text.secondary' }} /></ListItem>
                  )}
                  {viewed.admins.map(a => (
                    <ListItem key={a.id} divider>
                      <ListItemText
                        primary={`${a.firstName} ${a.lastName}`}
                        secondary={a.email}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Remove admin">
                          <IconButton edge="end" color="error" onClick={() => removeAdmin(a.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                SuperAdmin can only manage organizations and their admins. Inner data remains private to each organization.
              </Typography>
            </>
          )}
        </Box>
      </Drawer>

      {/* Add admin dialog */}
      <Dialog open={addAdminOpen} onClose={() => setAddAdminOpen(false)}>
        <DialogTitle>Add admin to {viewed?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'grid', gap: 2, minWidth: { xs: 320, sm: 420 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField label="First name" value={adminForm.firstName} onChange={e => setAdminForm({ ...adminForm, firstName: e.target.value })} fullWidth />
            <TextField label="Last name" value={adminForm.lastName} onChange={e => setAdminForm({ ...adminForm, lastName: e.target.value })} fullWidth />
          </Stack>
          <TextField type="email" label="Work email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddAdminOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addAdmin} disabled={!adminForm.firstName.trim() || !adminForm.lastName.trim() || !adminForm.email.trim()}>
            Add admin
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
