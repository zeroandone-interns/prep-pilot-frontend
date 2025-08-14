import * as React from 'react'
import {
  AppBar, Toolbar, Typography, Button, Container, Box, IconButton,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, useMediaQuery
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import PeopleIcon from '@mui/icons-material/People'
import SchoolIcon from '@mui/icons-material/School'
import LogoutIcon from '@mui/icons-material/Logout'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '@mui/material/styles'

const links = [
  { to: '/chatbot', label: 'Chatbot', icon: <ChatBubbleIcon /> },
  { to: '/courses', label: 'Courses', icon: <LibraryBooksIcon /> },
  { to: '/admin/users', label: 'Edit Users', icon: <PeopleIcon /> },
  { to: '/admin/courses', label: 'Edit Courses', icon: <SchoolIcon /> },
  { to: '/', label: 'Logout', icon: <LogoutIcon /> },
]

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const upMd = useMediaQuery(theme.breakpoints.up('md'))
  const [open, setOpen] = React.useState(false)

  const DrawerContent = (
    <Box sx={{ width: 260, pt: 1 }}>
      <List>
        {links.map(l => (
          <ListItemButton
            key={l.to}
            selected={location.pathname === l.to}
            onClick={() => { navigate(l.to); setOpen(false) }}
          >
            <ListItemIcon>{l.icon}</ListItemIcon>
            <ListItemText primary={l.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          {!upMd && (
            <IconButton edge="start" color="inherit" onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Box component="img" src="/new_logo_3.png" alt="PrepPilot Logo"
            sx={{ height: 48, width: 'auto', mr: 1, display: 'block' }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>PrepPilot</Typography>

          {upMd && links.map((l) => (
            <Button
              key={l.to}
              component={NavLink}
              to={l.to}
              color={location.pathname === l.to ? 'secondary' : 'inherit'}
              sx={{ '&.active': { bgcolor: 'rgba(255,255,255,0.12)' }, textTransform: 'none' }}
              startIcon={l.icon}
            >
              {l.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        {DrawerContent}
      </Drawer>

      <Container maxWidth="lg" sx={{ py: { xs: 1.5, sm: 2 }, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
