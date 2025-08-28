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
  Skeleton,
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
import { useAppDispatch } from "@/store";
import { addMessageLocal, upsertSession } from "@/store/chatsSlice";

type Msg = {
  id: number | string;
  content: string;
  isBot: boolean;
  ts: string;
  saving?: boolean; // local skeleton toggle
  temp?: boolean;
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
  const dispatch = useAppDispatch();

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

  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);

  const BotIcon = ({ size = 20 }: { size?: number }) => (
    <Box
      component="img"
      src="/logo_black.png"
      alt="Bot"
      sx={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );

  function BubbleSkeleton({ isBot }: { isBot: boolean }) {
    return (
      <Box className={`chat-message ${isBot ? "bot" : "user"}`}>
        <Box sx={{ mt: 0.5 }}>
          {isBot ? <BotIcon size={30} /> : <Person fontSize="small" />}
        </Box>
        <Box sx={{ maxWidth: "85%" }}>
          <Skeleton
            variant="rounded"
            height={56}
            sx={{
              borderRadius: 3,
              width: `${Math.floor(40 + Math.random() * 40)}%`,
            }}
          />
          <Skeleton width={80} sx={{ mt: 0.5 }} />
        </Box>
      </Box>
    );
  }

  const chat = useMemo(() => (curId ? chats[curId] : undefined), [curId, chats]);
  const currentUserId = useMemo(
    () => (curId ? sessions.find((s) => s.id === curId)?.user_id ?? 0 : 0),
    [curId, sessions]
  );

  // Load sessions on mount
  useEffect(() => {
    const load = async () => {
      try {
        setSessionsLoading(true);
        const data = await chatApi.getSessions();
        setSessions(data);
        // prime Redux with any existing sessions (for uniqueness by user & chat)
        data.forEach((s) => dispatch(upsertSession(s)));
        if (data.length && curId === null) {
          setCurId(data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setSessionsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load messages when switching sessions
  useEffect(() => {
    const loadMsgs = async () => {
      if (!curId) return;
      if (!chats[curId]) {
        setMessagesLoading(true);
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
        } finally {
          setMessagesLoading(false);
        }
      }
    };
    loadMsgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curId]);

  // Auto-scroll when msg count changes
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
    setBootLoading(true);
    try {
      const s = await chatApi.createSession();
      // keep local view
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

      // also prime Redux (user-based + chat-based)
      dispatch(upsertSession(s));
    } catch (err) {
      console.error("Failed to create chat session", err);
    } finally {
      setTimeout(() => setBootLoading(false), 400);
    }
  };

  // Delete current session
  const confirmDelete = () => setConfirmOpen(true);
  const doDelete = async () => {
    setConfirmOpen(false);
    if (!curId) return;
    try {
      await chatApi.deleteSession(curId);
      setSessions((list) => list.filter((s) => s.id !== curId));
      setChats((prev) => {
        const { [curId]: _, ...rest } = prev;
        return rest;
      });
      const remaining = sessions.filter((s) => s.id !== curId);
      setCurId(remaining[0]?.id ?? null);
      // no Redux deletion on purpose (teammate can add later)
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };


  // ================================
  // Send message (save to Redux) + stub bot "hi"
  // ================================
  const send = async () => {
    if (!input.trim() || !curId || busy) return;
    const content = input.trim();
    setInput("");
    setBusy(true);

    // local user bubble (with quick skeleton fade)
    const userTempId = mkTempId();
    addLocal(curId, {
      id: userTempId,
      content,
      isBot: false,
      ts: nowIso(),
      saving: true,
      temp: true,
    });
    setTimeout(() => {
      updateMsg(curId, userTempId, { saving: false });
    }, 250);

    // set title locally if it's brand new
    setChats((prev) => {
      const c = prev[curId]!;
      const nextTitle = c.title === "New Chat" && content ? truncate(content) : c.title;
      return { ...prev, [curId]: { ...c, title: nextTitle } };
    });
    setSessionTitles((t) => {
      const curTitle = t[curId!];
      if (!curTitle || curTitle === "New Chat") return { ...t, [curId!]: truncate(content) };
      return t;
    });

    // ✅ Save to Redux (user-based + chat-based)
    dispatch(
      addMessageLocal({
        userID: currentUserId || 0,
        sessionID: curId,
        content,
        isBot: false,
      })
    );

    // Stub AI reply "hi" → show locally + save to Redux
    setTimeout(() => {
      const botId = mkTempId();
      addLocal(curId, {
        id: botId,
        content: "hi",
        isBot: true,
        ts: nowIso(),
      });
      dispatch(
        addMessageLocal({
          userID: currentUserId || 0,
          sessionID: curId,
          content: "hi",
          isBot: true,
        })
      );
      setBusy(false);
    }, 350);
  };


  // Local helpers (UI state only)
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

  const updateMsg = (chatId: number, msgId: string | number, patch: Partial<Msg>) => {
    setChats((prev) => {
      const c = prev[chatId];
      if (!c) return prev;
      const msgs = c.msgs.map((m) => (m.id === msgId ? { ...m, ...patch } : m));
      return { ...prev, [chatId]: { ...c, msgs } };
    });
  };

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

  const selectChat = async (sessionId: number) => {
    if (sessionId === curId) return;
    setCurId(sessionId);
    setEditing(false);
    setDrawerOpen(false);
    if (!chats[sessionId]) {
      setMessagesLoading(true);
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
      } finally {
        setMessagesLoading(false);
      }
    }
  };

  // First-time / no sessions yet
  if (!curId && !sessions.length) {
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

            <Box className="chat-messages">
              {bootLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <BubbleSkeleton key={`boot-${i}`} isBot={i % 2 === 0} />
                  ))
                : null}
            </Box>

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
                      create();
                    }
                  }}
                  placeholder="Type your message here…"
                  variant="standard"
                  InputProps={{ disableUnderline: true }}
                  disabled
                />
                <IconButton color="primary" disabled>
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
        {sessionsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <ListItem key={`ls-${i}`} disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <Skeleton variant="circular" width={22} height={22} />
                  </ListItemIcon>
                  <ListItemText
                    primary={<Skeleton width="60%" />}
                    secondary={<Skeleton width="40%" />}
                  />
                </ListItemButton>
              </ListItem>
            ))
          : sessions.map((s) => (
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
            {messagesLoading || bootLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <BubbleSkeleton key={`s-${i}`} isBot={i % 2 === 0} />
              ))
            ) : (
              chat?.msgs.map((m) => (
                <Box key={m.id} className={`chat-message ${m.isBot ? "bot" : "user"}`}>
                  {m.saving ? (
                    <BubbleSkeleton isBot={m.isBot} />
                  ) : (
                    <>
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
                        <Typography variant="body2">{m.content}</Typography>
                        <Typography className={`chat-timestamp ${m.isBot ? "bot" : "user"}`}>
                          {new Date(m.ts).toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </>
                  )}
                </Box>
              ))
            )}
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
