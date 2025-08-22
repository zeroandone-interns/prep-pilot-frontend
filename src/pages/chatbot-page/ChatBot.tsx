// src/pages/chatbot-page/Chatbot.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Add,
  Check,
  ChatBubble,
  Close,
  Edit,
  Menu as MenuIcon,
  Person,
  Send,
} from "@mui/icons-material";
import "./Chatbot.css";
import { chatApi, type ChatMessageDTO, type ChatSessionDTO } from "./chatApi";

type Msg = { id: number; content: string; isBot: boolean; ts: string };
type LocalChat = {
  id: number;
  title: string;
  last: string;
  msgs: Msg[];
};

const truncate = (s: string, n = 36) => (s.length > n ? s.slice(0, n) + "…" : s);

export default function Chatbot() {
  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up("sm"));
  const upMd = useMediaQuery(theme.breakpoints.up("md"));
  const APPBAR_H = upSm ? 64 : 56;

  const [sessions, setSessions] = useState<ChatSessionDTO[]>([]);
  const [sessionTitles, setSessionTitles] = useState<Record<number, string>>({});
  const [chats, setChats] = useState<Record<number, LocalChat>>({});
  const [curId, setCurId] = useState<number | null>(null);

  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Bot icon (preserve your design)
  const BotIcon = ({ size = 20 }: { size?: number }) => (
    <Box
      component="img"
      src="/logo_black.png"
      alt="Bot"
      sx={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );

  const chat = useMemo(() => (curId ? chats[curId] : undefined), [curId, chats]);

  // Load sessions at mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await chatApi.getSessions();
        setSessions(data);
        if (data.length && curId === null) {
          setCurId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Load messages for current session
  useEffect(() => {
    const loadMsgs = async () => {
      if (!curId) return;
      // If not loaded yet, fetch
      if (!chats[curId]) {
        try {
          const msgs = await chatApi.getMessages(curId);
          setChats((prev) => ({
            ...prev,
            [curId]: {
              id: curId,
              title:
                sessionTitles[curId] ||
                deriveTitleFromMessages(msgs) ||
                `New Chat`,
              last:
                latestTs(msgs) ||
                sessions.find((s) => s.id === curId)?.session_started_at ||
                new Date().toISOString(),
              msgs: msgs.map(toLocalMsg),
            },
          }));
          // If we derived a title, remember it for the sidebar
          const derived = deriveTitleFromMessages(msgs);
          if (derived) {
            setSessionTitles((t) => ({ ...t, [curId]: derived }));
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    loadMsgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curId]);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat?.msgs.length]);

  // End current session on tab close (best effort)
  useEffect(() => {
    const handleUnload = async () => {
      if (curId) {
        try {
          await chatApi.endSession(curId);
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [curId]);

  const deriveTitleFromMessages = (msgs: ChatMessageDTO[]) => {
    const firstUser = msgs.find((m) => m.sender === "user");
    return firstUser ? truncate(firstUser.message) : "";
  };

  const latestTs = (msgs: ChatMessageDTO[]) =>
    msgs.length ? msgs[msgs.length - 1].created_at : undefined;

  const toLocalMsg = (m: ChatMessageDTO): Msg => ({
    id: m.id,
    content: m.message,
    isBot: m.sender === "assistant",
    ts: m.created_at,
  });

  // Create new session
  const create = async () => {
    try {
      const s = await chatApi.createSession();
      setSessions((arr) => [s, ...arr]);
      setSessionTitles((t) => ({ ...t, [s.id]: "New Chat" }));
      setChats((prev) => ({
        ...prev,
        [s.id]: {
          id: s.id,
          title: "New Chat",
          last: s.session_started_at || new Date().toISOString(),
          msgs: [],
        },
      }));
      setCurId(s.id);
      setEditing(true);
      setTitleDraft("New Chat");
    } catch (err) {
      console.error("Failed to create chat session", err);
    }
  };

  // Send message
  const send = async () => {
    if (!input.trim() || !curId) return;
    const content = input.trim();
    setInput("");

    try {
      const saved = await chatApi.sendMessage(curId, content, "user");

      // Update local
      setChats((prev) => {
        const existing = prev[curId] || {
          id: curId,
          title: sessionTitles[curId] || "New Chat",
          last: new Date().toISOString(),
          msgs: [],
        };
        const newMsgs = [...existing.msgs, toLocalMsg(saved)];
        // If title still generic, set first user message as title
        const nextTitle =
          existing.title === "New Chat" && content
            ? truncate(content)
            : existing.title;

        // Also reflect the latest time
        return {
          ...prev,
          [curId]: {
            ...existing,
            title: nextTitle,
            last: saved.created_at,
            msgs: newMsgs,
          },
        };
      });

      // keep a sidebar title cache in sync
      setSessionTitles((t) => {
        const curTitle = t[curId];
        if (!curTitle || curTitle === "New Chat") {
          return { ...t, [curId]: truncate(content) };
        }
        return t;
      });

      // (Optional) If you later add assistant responses server-side,
      // you can refetch:
      // const fresh = await chatApi.getMessages(curId);
      // setChats((prev) => ({
      //   ...prev,
      //   [curId]: { ...prev[curId]!, msgs: fresh.map(toLocalMsg), last: latestTs(fresh) || prev[curId]!.last }
      // }));
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Save edited title (local only — preserves design, avoids schema changes)
  const saveTitle = () => {
    if (!curId) return;
    const t = titleDraft.trim() || "New Chat";
    setSessionTitles((m) => ({ ...m, [curId]: t }));
    setChats((prev) => ({
      ...prev,
      [curId]: { ...prev[curId]!, title: t },
    }));
    setEditing(false);
  };

  // Switch chat/session
  const selectChat = async (sessionId: number) => {
    if (sessionId === curId) return;
    setCurId(sessionId);
    setEditing(false);
    setDrawerOpen(false);
    if (!chats[sessionId]) {
      try {
        const msgs = await chatApi.getMessages(sessionId);
        setChats((prev) => ({
          ...prev,
          [sessionId]: {
            id: sessionId,
            title:
              sessionTitles[sessionId] ||
              deriveTitleFromMessages(msgs) ||
              "New Chat",
            last:
              latestTs(msgs) ||
              sessions.find((s) => s.id === sessionId)?.lastMessageAt ||
              new Date().toISOString(),
            msgs: msgs.map(toLocalMsg),
          },
        }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!curId && !sessions.length) {
    // First-time view: still show your layout
    return (
      <Box className="chat-container" style={{ height: `calc(100dvh - ${APPBAR_H}px)` }}>
        <Stack direction={{ xs: "column", md: "row" }} className="chat-stack">
          {upMd ? (
            <Paper variant="outlined" className="chat-sidebar">
              <Box className="chat-sidebar-button">
                <Button fullWidth variant="contained" startIcon={<Add />} onClick={create}>
                  New Chat
                </Button>
              </Box>
            </Paper>
          ) : (
            <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              <Box className="chat-sidebar">
                <Box className="chat-sidebar-button">
                  <Button fullWidth variant="contained" startIcon={<Add />} onClick={create}>
                    New Chat
                  </Button>
                </Box>
              </Box>
            </Drawer>
          )}

          <Paper className="chat-main">
            <Box className="chat-header">
              {!upMd && (
                <IconButton size="small" style={{ color: "inherit" }} onClick={() => setDrawerOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <BotIcon size={40} />
              <Typography variant="h6" style={{ flex: 1 }}>
                PrepPilot
              </Typography>
            </Box>

            <Box className="chat-messages" />
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
                      if (!curId) create();
                      else send();
                    }
                  }}
                  placeholder="Type your message here…"
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                />
                <IconButton color="primary" onClick={() => (curId ? send() : create())} disabled={!input.trim()}>
                  <Send />
                </IconButton>
              </Paper>
            </Box>
          </Paper>
        </Stack>
      </Box>
    );
  }

  const Sidebar = (
    <Box className="chat-sidebar">
      <Box className="chat-sidebar-button">
        <Button fullWidth variant="contained" startIcon={<Add />} onClick={create}>
          New Chat
        </Button>
      </Box>
      <List dense className="chat-sidebar-list">
        {sessions.map((s) => (
          <ListItem key={s.id} disablePadding>
            <ListItemButton selected={s.id === curId} onClick={() => selectChat(s.id)}>
              <ListItemIcon style={{ minWidth: 32 }}>
                <ChatBubble fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ noWrap: true }}
                primary={sessionTitles[s.id] || `Chat ${s.id}`}
                secondary={
                  (s.lastMessageAt && new Date(s.lastMessageAt).toLocaleDateString()) ||
                  (s.session_started_at && new Date(s.session_started_at).toLocaleDateString())
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box className="chat-container" style={{ height: `calc(100dvh - ${APPBAR_H}px)` }}>
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
              <IconButton size="small" style={{ color: "inherit" }} onClick={() => setDrawerOpen(true)}>
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
                    setTitleDraft(chat?.title || "");
                    setEditing(true);
                  }}
                >
                  {chat?.title || "New Chat"}
                </Typography>
                <IconButton
                  size="small"
                  style={{ color: "inherit" }}
                  onClick={() => {
                    setTitleDraft(chat?.title || "");
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
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  className="chat-title-input"
                />
                <IconButton size="small" style={{ color: "inherit" }} onClick={saveTitle}>
                  <Check />
                </IconButton>
                <IconButton size="small" style={{ color: "inherit" }} onClick={() => setEditing(false)}>
                  <Close />
                </IconButton>
              </>
            )}
          </Box>

          {/* Messages */}
          <Box className="chat-messages" ref={messagesRef}>
            {chat?.msgs.map((m) => (
              <Box key={m.id} className={`chat-message ${m.isBot ? "bot" : "user"}`}>
                <Box
                  style={{
                    marginTop: 2,
                    color: m.isBot ? theme.palette.secondary.main : theme.palette.primary.main,
                  }}
                >
                  {m.isBot ? <BotIcon size={30} /> : <Person fontSize="small" />}
                </Box>
                <Paper
                  variant={m.isBot ? "outlined" : "elevation"}
                  elevation={m.isBot ? 0 : 1}
                  className={`chat-bubble ${m.isBot ? "bot" : "user"}`}
                  style={
                    !m.isBot
                      ? {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                      : {}
                  }
                >
                  <Typography variant="body2">{m.content}</Typography>
                  <Typography className={`chat-timestamp ${m.isBot ? "bot" : "user"}`}>
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
              <IconButton color="primary" onClick={send} disabled={!input.trim()}>
                <Send />
              </IconButton>
            </Paper>
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
