// src/layouts/MainLayout.tsx
import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import LogoutIcon from "@mui/icons-material/Logout";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { type AppDispatch } from "@/store";
import { useDispatch } from "react-redux";
import { clearAuth } from "@/store/AuthSlice";

const links = [
  {
    to: "/chatbot",
    label: "Chatbot",
    icon: <ChatBubbleIcon />,
    roles: ["learner"],
  },
  {
    to: "/courses",
    label: "Courses",
    icon: <LibraryBooksIcon />,
    roles: ["learner"],
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: <PeopleIcon />,
    roles: ["instructor"],
  },
  {
    to: "/admin/courses",
    label: "Edit Courses",
    icon: <SchoolIcon />,
    roles: ["instructor"],
  },

];


export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = React.useState(false);

  const groups = localStorage.getItem("groups");

  const filteredLinks = links.filter((link) =>
    link.roles.some((role) => groups?.includes(role))
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("sub");
    localStorage.removeItem("groups");

    dispatch(clearAuth());
    navigate("/");
  };

  const DrawerContent = (
    <Box sx={{ width: 280, pt: 1 }} role="navigation" aria-label="main">
      <List>
        {filteredLinks.map((l) => (
          <ListItemButton
            key={l.to}
            selected={location.pathname === l.to}
            onClick={() => {
              if (l.label === "Logout") {
                handleLogout();
              } else {
                navigate(l.to);
              }
              setOpen(false);
            }}
          >
            <ListItemIcon>{l.icon}</ListItemIcon>
            <ListItemText primary={l.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );


  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar sx={{ gap: 2 }}>
          {/* Always show hamburger to open the Drawer */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box
            component="img"
            src="/new_logo_3.png"
            alt="PrepPilot Logo"
            sx={{ height: 48, width: "auto", display: "block" }}
          />

          {/* Title */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PrepPilot
          </Typography>

          {/* (Optional) quick Logout button on the right; keep if you want */}
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{ display: { xs: "none", sm: "inline-flex" } }} // hide on very small screens
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer open={open} onClose={() => setOpen(false)}>
        {DrawerContent}
      </Drawer>

      <Container maxWidth="lg" sx={{ py: 2, flex: 1 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
