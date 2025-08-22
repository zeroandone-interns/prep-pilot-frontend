import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  TextField,
  Paper,
  Drawer,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Send,
  Person,
  Add,
  ChatBubble,
  Edit,
  Check,
  Close,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  createChatSession,
  sendMsg,
  setCur,
  editTitle,
} from "../../store/chatsSlice";
import "./Chatbot.css";

const USER_ID = 1; // Replace with actual logged-in user ID

export default function Chatbot() {
  const dispatch = useAppDispatch();
  const { chats, curId } = useAppSelector((state) => state.chats);
  const chat = useMemo(() => chats.find((c) => c.id === curId), [chats, curId]);

  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up("sm"));
  const upMd = useMediaQuery(theme.breakpoints.up("md"));
  const APPBAR_H = upSm ? 64 : 56;

  // use a custom PNG logo for bot
  const BotIcon = ({ size = 20 }: { size?: number }) => (
    <Box
      component="img"
      src="/logo_black.png"
      alt="Bot"
      sx={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );

  // ref to the scrollable messages container
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // --- END CURRENT SESSION ON TAB CLOSE ---
  useEffect(() => {
    const handleUnload = async () => {
      if (chat?.sessionID) {
        try {
          await fetch(
            `http://localhost:3000/chat/session/${chat.sessionID}/end`,
            { method: "POST" }
          );
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [chat]);

  // --- AUTO-SCROLL TO BOTTOM ON NEW MESSAGES ---
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat?.msgs.length]);

  // --- CREATE NEW CHAT SESSION ---
  const create = async () => {
    try {
      await dispatch(createChatSession(USER_ID)).unwrap();
      setEditing(true);
      const newChat = chats[chats.length - 1];
      setTitle(newChat?.title || `New Chat ${chats.length}`);
    } catch (err) {
      console.error("Failed to create chat session", err);
    }
  };

  // --- SEND MESSAGE ---
  const send = async () => {
    if (!input.trim() || !chat) return;
    const content = input;
    setInput("");

    try {
      dispatch(sendMsg({ content, isBot: false }));
      setTimeout(() => {
        const botMsg = "Hi"; // replace with actual AI response if backend supports
        dispatch(sendMsg({ content: botMsg, isBot: true }));
      }, 400);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // --- SAVE EDITED TITLE ---
  const saveTitle = () => {
    if (!chat) return;
    const t = title.trim() || chat.title || "New Chat";
    dispatch(editTitle(t));
    setEditing(false);
  };

  // --- SWITCH / REOPEN CHAT SESSION ---
  const selectChat = async (c: typeof chat) => {
    if (!c || c.id === curId) return;
    dispatch(setCur(c.id));
    setEditing(false);
    setDrawerOpen(false);
  };

  if (!chat) return <div>Loading chats...</div>;

  // --- SIDEBAR ---
  const Sidebar = (
    <Box className="chat-sidebar">
      <Box className="chat-sidebar-button">
        <Button
          fullWidth
          variant="contained"
          startIcon={<Add />}
          onClick={create}
        >
          New Chat
        </Button>
      </Box>
      <List dense className="chat-sidebar-list">
        {chats.map(
          (c) =>
            c && (
              <ListItem key={c.id} disablePadding>
                <ListItemButton
                  selected={c.id === curId}
                  onClick={() => selectChat(c)}
                >
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <ChatBubble fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ noWrap: true }}
                    primary={c.title}
                    secondary={new Date(c.last).toLocaleDateString()}
                  />
                </ListItemButton>
              </ListItem>
            )
        )}
      </List>
    </Box>
  );

  return (
    <Box
      className="chat-container"
      style={{ height: `calc(100dvh - ${APPBAR_H}px)` }}
    >
      <Stack direction={{ xs: "column", md: "row" }} className="chat-stack">
        {upMd ? (
          <Paper variant="outlined" className="chat-sidebar">
            {Sidebar}
          </Paper>
        ) : (
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
            {Sidebar}
          </Drawer>
        )}

        <Paper className="chat-main">
          {/* Header */}
          <Box className="chat-header">
            {!upMd && (
              <IconButton
                size="small"
                style={{ color: "inherit" }}
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            )}
            <BotIcon size={40} />
            {!editing ? (
              <>
                <Typography
                  variant="h6"
                  style={{ flex: 1, cursor: "text" }}
                  onDoubleClick={() => {
                    setTitle(chat.title);
                    setEditing(true);
                  }}
                >
                  {chat.title}
                </Typography>
                <IconButton
                  size="small"
                  style={{ color: "inherit" }}
                  onClick={() => {
                    setTitle(chat.title);
                    setEditing(true);
                  }}
                >
                  <Edit />
                </IconButton>
              </>
            ) : (
              <>
                <TextField
                  size="small"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="chat-title-input"
                />
                <IconButton
                  size="small"
                  style={{ color: "inherit" }}
                  onClick={saveTitle}
                >
                  <Check />
                </IconButton>
                <IconButton
                  size="small"
                  style={{ color: "inherit" }}
                  onClick={() => setEditing(false)}
                >
                  <Close />
                </IconButton>
              </>
            )}
          </Box>

          {/* Messages */}
          <Box className="chat-messages" ref={messagesRef}>
            {chat.msgs.map((m) => (
              <Box
                key={m.id}
                className={`chat-message ${m.isBot ? "bot" : "user"}`}
              >
                <Box
                  style={{
                    marginTop: 2,
                    color: m.isBot
                      ? theme.palette.secondary.main
                      : theme.palette.primary.main,
                  }}
                >
                  {m.isBot ? (
                    <BotIcon size={30} />
                  ) : (
                    <Person fontSize="small" />
                  )}
                </Box>
                <Paper
                  variant={m.isBot ? "outlined" : "elevation"}
                  elevation={m.isBot ? 0 : 1}
                  className={`chat-bubble ${m.isBot ? "bot" : "user"}`}
                  style={
                    !m.isBot
                      ? {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.08
                          ),
                        }
                      : {}
                  }
                >
                  <Typography variant="body2">{m.content}</Typography>
                  <Typography
                    className={`chat-timestamp ${m.isBot ? "bot" : "user"}`}
                  >
                    {new Date(m.ts).toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Input */}
          <Box className="chat-input-box">
            <Paper variant="outlined" className="chat-input-paper">
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Type your message here…"
                variant="standard"
                InputProps={{ disableUnderline: true }}
              />
              <IconButton
                color="primary"
                onClick={send}
                disabled={!input.trim()}
              >
                <Send />
              </IconButton>
            </Paper>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
