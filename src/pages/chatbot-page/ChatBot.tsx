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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
  DeleteForever,
} from "@mui/icons-material";
import "./Chatbot.css";
import { chatApi, type ChatMessageDTO, type ChatSessionDTO } from "./chatApi";

type Msg = {
  id: number | string; // temp ids are strings like "tmp-123"
  content: string;
  isBot: boolean;
  ts: string;
  saving?: boolean; // show spinner until persisted
  temp?: boolean; // local placeholder
};

type LocalChat = {
  id: number;
  title: string;
  last: string;
  msgs: Msg[];
};

const truncate = (s: string, n = 36) => (s.length > n ? s.slice(0, n) + "…" : s);
const nowIso = () => new Date().toISOString();
const mkTempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

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

  const [busy, setBusy] = useState(false); // disable input while both user+assistant save
  const [confirmOpen, setConfirmOpen] = useState(false); // delete dialog

  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Bot icon (preserve design)
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
      if (!chats[curId]) {
        try {
          const msgs = await chatApi.getMessages(curId);
          const derived = deriveTitleFromMessages(msgs);
          setChats((prev) => ({
            ...prev,
            [curId]: {
              id: curId,
              title: sessionTitles[curId] || derived || `New Chat`,
              last:
                latestTs(msgs) ||
                sessions.find((s) => s.id === curId)?.session_started_at ||
                nowIso(),
              msgs: msgs.map(toLocalMsg),
            },
          }));
          if (derived) setSessionTitles((t) => ({ ...t, [curId]: derived }));
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
    // Keep titles client-only to avoid schema changes
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
          last: s.session_started_at || nowIso(),
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

  // Delete current session
  const confirmDelete = () => setConfirmOpen(true);
  const doDelete = async () => {
    setConfirmOpen(false);
    if (!curId) return;
    try {
      await chatApi.deleteSession(curId);
      // prune local state
      setSessions((list) => list.filter((s) => s.id !== curId));
      setChats((prev) => {
        const { [curId]: _, ...rest } = prev;
        return rest;
      });
      // pick another session if available
      const remaining = sessions.filter((s) => s.id !== curId);
      setCurId(remaining[0]?.id ?? null);
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  // Send message with per-message loading + auto assistant reply ("Hi 👋")
const send = async () => {
  if (!input.trim() || !curId || busy) return;
  const content = input.trim();
  setInput("");
  setBusy(true);

  // 1) Add local temp user bubble
  const userTempId = mkTempId();
  addLocal(curId, {
    id: userTempId,
    content,
    isBot: false,
    ts: nowIso(),
    saving: true,
    temp: true,
  });

  // 2) Persist user message
  try {
    const savedUser = await chatApi.sendMessage(curId, content, "user");
    replaceTemp(curId, userTempId, savedUser);

    // Update title if it was "New Chat"
    setChats((prev) => {
      const c = prev[curId]!;
      const nextTitle =
        c.title === "New Chat" && content ? truncate(content) : c.title;
      return {
        ...prev,
        [curId]: { ...c, title: nextTitle, last: savedUser.created_at },
      };
    });
    setSessionTitles((t) => {
      const curTitle = t[curId];
      if (!curTitle || curTitle === "New Chat") {
        return { ...t, [curId]: truncate(content) };
      }
      return t;
    });
  } catch (e) {
    console.error("Failed to save user message", e);
    markFailed(curId, userTempId, "(failed to send)");
    setBusy(false);
    return;
  }

  // 3) Add local temp assistant bubble
  const botTempId = mkTempId();
  addLocal(curId, {
    id: botTempId,
    content: "…",
    isBot: true,
    ts: nowIso(),
    saving: true,
    temp: true,
  });

  // 4) Open SSE connection to NestJS streaming endpoint
  try {
    const evtSource = new EventSource(
      `http://localhost:3000/chatbot/stream?session_id=${curId}&message=${encodeURIComponent(
        content
      )}`
    );

    let fullMessage = "";

    evtSource.onmessage = (event) => {
      fullMessage += event.data;
      setChats((prev) => {
        const c = prev[curId];
        if (!c) return prev;
        const msgs = c.msgs.map((m) =>
          m.id === botTempId ? { ...m, content: fullMessage } : m
        );
        return { ...prev, [curId]: { ...c, msgs } };
      });
    };

    evtSource.onerror = (err) => {
      console.error("AI SSE error:", err);
      markFailed(curId, botTempId, "(assistant failed)");
      evtSource.close();
      setBusy(false);
    };

evtSource.addEventListener("end", () => {
  replaceTemp(curId, botTempId, {
    id: -1, 
    session_id: curId, 
    message: fullMessage,
    sender: "assistant",
    created_at: nowIso(),
  });
  evtSource.close();
  setBusy(false);
});
  } catch (err) {
    console.error("Failed to start AI stream:", err);
    markFailed(curId, botTempId, "(assistant failed)");
    setBusy(false);
  }
};

  // Helpers to manage local temp -> saved swap
  const addLocal = (chatId: number, msg: Msg) => {
    setChats((prev) => {
      const c = prev[chatId] || {
        id: chatId,
        title: sessionTitles[chatId] || "New Chat",
        last: nowIso(),
        msgs: [],
      };
      return {
        ...prev,
        [chatId]: { ...c, msgs: [...c.msgs, msg], last: msg.ts },
      };
    });
  };

  const replaceTemp = (chatId: number, tempId: string, saved: ChatMessageDTO) => {
    setChats((prev) => {
      const c = prev[chatId];
      if (!c) return prev;
      const msgs = c.msgs.map((m) =>
        m.id === tempId
          ? {
              id: saved.id,
              content: saved.message,
              isBot: saved.sender === "assistant",
              ts: saved.created_at,
              saving: false,
              temp: false,
            }
          : m
      );
      return { ...prev, [chatId]: { ...c, msgs, last: saved.created_at } };
    });
  };

  const markFailed = (chatId: number, tempId: string, text: string) => {
    setChats((prev) => {
      const c = prev[chatId];
      if (!c) return prev;
      const msgs = c.msgs.map((m) =>
        m.id === tempId
          ? { ...m, saving: false, content: `${m.content}\n${text}` }
          : m
      );
      return { ...prev, [chatId]: { ...c, msgs } };
    });
  };

  // Save edited title (client-only)
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

  // Switch session
  const selectChat = async (sessionId: number) => {
    if (sessionId === curId) return;
    setCurId(sessionId);
    setEditing(false);
    setDrawerOpen(false);
    if (!chats[sessionId]) {
      try {
        const msgs = await chatApi.getMessages(sessionId);
        const derived = deriveTitleFromMessages(msgs);
        setChats((prev) => ({
          ...prev,
          [sessionId]: {
            id: sessionId,
            title: sessionTitles[sessionId] || derived || "New Chat",
            last:
              latestTs(msgs) ||
              sessions.find((s) => s.id === sessionId)?.lastMessageAt ||
              nowIso(),
            msgs: msgs.map(toLocalMsg),
          },
        }));
        if (derived) setSessionTitles((t) => ({ ...t, [sessionId]: derived }));
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (!curId && !sessions.length) {
    // First-time blank slate
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
                  disabled={busy}
                />
                <IconButton color="primary" onClick={() => (curId ? send() : create())} disabled={!input.trim() || busy}>
                  {busy ? <CircularProgress size={22} /> : <Send />}
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

                {/* Delete current session (tiny icon, keeps header design) */}
                <IconButton size="small" style={{ color: "inherit" }} onClick={confirmDelete} title="Delete chat">
                  <DeleteForever />
                </IconButton>

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
                      ? { backgroundColor: alpha(theme.palette.primary.main, 0.08) }
                      : {}
                  }
                >
                  <Typography variant="body2">
                    {m.temp && m.isBot && m.content === "…" ? "Assistant is typing…" : m.content}
                  </Typography>
                  <Typography className={`chat-timestamp ${m.isBot ? "bot" : "user"}`}>
                    {new Date(m.ts).toLocaleTimeString()}
                    {m.saving && (
                      <>
                        {" "}
                        • <CircularProgress size={12} sx={{ verticalAlign: "middle" }} />
                        <span> Saving…</span>
                      </>
                    )}
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
                disabled={busy}
              />
              <IconButton color="primary" onClick={send} disabled={!input.trim() || busy}>
                {busy ? <CircularProgress size={22} /> : <Send />}
              </IconButton>
            </Paper>
          </Box>
        </Paper>
      </Stack>

      {/* Delete dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete this chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove the chat and its messages. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
