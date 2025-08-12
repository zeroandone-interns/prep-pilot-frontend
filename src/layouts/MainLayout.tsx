import * as React from 'react'
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const links = [
  { to: '/', label: 'Chatbot' },
  { to: '/courses', label: 'Courses' },
  { to: '/admin/users', label: 'Admin: Users' },
  { to: '/admin/courses', label: 'Admin: Courses' },
]

export default function MainLayout() {
  const location = useLocation()
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Edu AWS</Typography>
          {links.map((l) => (
            <Button
              key={l.to}
              component={NavLink}
              to={l.to}
              color={location.pathname === l.to ? 'secondary' : 'inherit'}
              sx={{
                '&.active': { bgcolor: 'rgba(255,255,255,0.12)' },
                textTransform: 'none',
              }}
            >
              {l.label}
            </Button>
          ))}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 2, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  )
}