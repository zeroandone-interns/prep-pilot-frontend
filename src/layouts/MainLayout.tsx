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
  const [showLearnerView, setShowLearnerView] = React.useState(false);

  const groups = localStorage.getItem("groups");

  // Filter links based on real role OR temporary learner view toggle
  const filteredLinks = links.filter((link) =>
    showLearnerView
      ? link.roles.includes("learner") // show only learner links when toggled
      : link.roles.some((role) => groups?.includes(role))
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
              navigate(l.to);
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
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </IconButton>

          <Box
            component="img"
            src="/new_logo_3.png"
            alt="PrepPilot Logo"
            sx={{ height: 48, width: "auto", display: "block" }}
          />

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
          </Typography>

          {/* Learner Experience toggle (only for instructors) */}
          {groups?.includes("instructor") && (
            <Button
              color="inherit"
              variant={"outlined"}
              onClick={() => {
                setShowLearnerView((prev) => !prev);
                if (showLearnerView) {
                  navigate("/courses");
                } else {
                  navigate("/admin/courses");
                }
              }}
              sx={{ mr: 1 }}
            >
              {showLearnerView ? "Exit Learner View" : "Learner Experience"}
            </Button>
          )}

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
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
