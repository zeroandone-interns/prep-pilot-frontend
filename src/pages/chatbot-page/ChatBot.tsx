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
import { useAppDispatch } from "@/store";
import { addMessageLocal, upsertSession } from "@/store/chatsSlice";
import { chatApi, type ChatMessageDTO, type ChatSessionDTO } from "./chatApi";
import "./Chatbot.css";

type Msg = {
  id: number | string;
  content: string;
  isBot: boolean;
  ts: string;
  saving?: boolean;
  temp?: boolean;
};

type LocalChat = {
  id: number;
  title: string;
  last: string;
  msgs: Msg[];
};

const truncate = (s: string, n = 36) =>
  s.length > n ? s.slice(0, n) + "…" : s;
const nowIso = () => new Date().toISOString();
const mkTempId = () => `tmp-${Math.random().toString(36).slice(2, 10)}`;

export default function Chatbot() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const upSm = useMediaQuery(theme.breakpoints.up("sm"));
  const upMd = useMediaQuery(theme.breakpoints.up("md"));
  const APPBAR_H = upSm ? 64 : 56;
  const token = localStorage.getItem("token");

  const [sessions, setSessions] = useState<ChatSessionDTO[]>([]);
  const [sessionTitles, setSessionTitles] = useState<Record<number, string>>(
    {}
  );
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
      sx={{ width: size, height: size, objectFit: "contain" }}
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

  const chat = useMemo(
    () => (curId ? chats[curId] : undefined),
    [curId, chats]
  );
  const currentUserId = useMemo(
    () => (curId ? sessions.find((s) => s.id === curId)?.user_id ?? 0 : 0),
    [curId, sessions]
  );

  // Load sessions
  useEffect(() => {
    const load = async () => {
      try {
        setSessionsLoading(true);
        const data = await chatApi.getSessions();
        setSessions(data);
        data.forEach((s) => dispatch(upsertSession(s)));
        if (data.length && curId === null) setCurId(data[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setSessionsLoading(false);
      }
    };
    load();
  }, []);

  // Load messages for selected session
  useEffect(() => {
    const loadMsgs = async () => {
      if (!curId || chats[curId]) return;
      setMessagesLoading(true);
      try {
        const msgs = await chatApi.getMessages(curId);
        const derivedTitle = deriveTitleFromMessages(msgs);
        setChats((prev) => ({
          ...prev,
          [curId]: {
            id: curId,
            title: sessionTitles[curId] || derivedTitle || "New Chat",
            last: latestTs(msgs) || nowIso(),
            msgs: msgs.map(toLocalMsg),
          },
        }));
        if (derivedTitle)
          setSessionTitles((t) => ({ ...t, [curId]: derivedTitle }));
      } catch (e) {
        console.error(e);
      } finally {
        setMessagesLoading(false);
      }
    };
    loadMsgs();
  }, [curId]);

  // Auto-scroll
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat?.msgs.length]);

  // End session on tab close
  useEffect(() => {
    const handleUnload = async () => {
      if (curId) await chatApi.endSession(curId).catch(() => {});
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
      dispatch(upsertSession(s));
    } catch (err) {
      console.error("Failed to create chat session", err);
    } finally {
      setTimeout(() => setBootLoading(false), 400);
    }
  };

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
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  };

  // =========================
  // Send message to Flask API
  // =========================
  const send = async () => {
    if (!input.trim() || !curId || busy) return;
    const content = input.trim();
    setInput("");
    setBusy(true);

    const userTempId = mkTempId();
    addLocal(curId, {
      id: userTempId,
      content,
      isBot: false,
      ts: nowIso(),
      saving: true,
      temp: true,
    });
    setTimeout(() => updateMsg(curId, userTempId, { saving: false }), 250);

    setChats((prev) => {
      const c = prev[curId]!;
      const nextTitle =
        c.title === "New Chat" && content ? truncate(content) : c.title;
      return { ...prev, [curId]: { ...c, title: nextTitle } };
    });
    setSessionTitles((t) => {
      const curTitle = t[curId!];
      if (!curTitle || curTitle === "New Chat")
        return { ...t, [curId!]: truncate(content) };
      return t;
    });

    dispatch(
      addMessageLocal({
        userID: currentUserId || 0,
        sessionID: curId,
        content,
        isBot: false,
      })
    );

    try {
      const res = await fetch("http://localhost:3000/chat/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" , "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ session_id: curId, message: content }),
      });

      if (!res.ok) throw new Error(`Flask API returned ${res.status}`);
      const responseText = await res.text();
      const data = JSON.parse(responseText); // convert to object
      console.log(data.response); 
      const botReply = data.response;    
      const botId = mkTempId();
      addLocal(curId, {
        id: botId,
        content: botReply,
        isBot: true,
        ts: nowIso(),
      });
      dispatch(
        addMessageLocal({
          userID: currentUserId || 0,
          sessionID: curId,
          content: botReply,
          isBot: true,
        })
      );
    } catch (err) {
      console.error("Failed to get response from Flask:", err);
      const botId = mkTempId();
      addLocal(curId, {
        id: botId,
        content: "Sorry, something went wrong.",
        isBot: true,
        ts: nowIso(),
      });
    } finally {
      setBusy(false);
    }
  };

  // Local helpers
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

  const updateMsg = (
    chatId: number,
    msgId: string | number,
    patch: Partial<Msg>
  ) => {
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
    setChats((prev) => ({ ...prev, [curId]: { ...prev[curId]!, title: t } }));
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
            last: latestTs(msgs) || nowIso(),
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

  // Sidebar UI
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
                <ListItemButton
                  selected={s.id === curId}
                  onClick={() => selectChat(s.id)}
                >
                  <ListItemIcon style={{ minWidth: 32 }}>
                    <ChatBubble fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primaryTypographyProps={{ noWrap: true }}
                    primary={sessionTitles[s.id] || `Chat ${s.id}`}
                    secondary={
                      (s.lastMessageAt &&
                        new Date(s.lastMessageAt).toLocaleDateString()) ||
                      (s.session_started_at &&
                        new Date(s.session_started_at).toLocaleDateString())
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
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
                    setTitleDraft(chat?.title || "");
                    setEditing(true);
                  }}
                >
                  {chat?.title || "New Chat"}
                </Typography>
                <IconButton
                  size="small"
                  style={{ color: "inherit" }}
                  onClick={confirmDelete}
                  title="Delete chat"
                >
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
            {messagesLoading || bootLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <BubbleSkeleton key={`s-${i}`} isBot={i % 2 === 0} />
                ))
              : chat?.msgs.map((m) => (
                  <Box
                    key={m.id}
                    className={`chat-message ${m.isBot ? "bot" : "user"}`}
                  >
                    {m.saving ? (
                      <BubbleSkeleton isBot={m.isBot} />
                    ) : (
                      <Typography>{m.content}</Typography>
                    )}
                  </Box>
                ))}
          </Box>

          {/* Input */}
          <Box className="chat-input">
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={busy}
            />
            <IconButton
              color="primary"
              onClick={send}
              disabled={busy || !input.trim()}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Stack>

      {/* Delete Confirmation */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Chat?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this chat session? This cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={doDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
