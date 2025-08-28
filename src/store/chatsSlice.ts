import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { chatApi } from "@/pages/chatbot-page/chatApi";

export type Msg = { id: string; content: string; isBot: boolean; ts: string };

export type Chat = {
  sessionID: number;
  userID: number; // <-- user-based + chat-based uniqueness
  title: string;
  msgs: Msg[];
  last: string;
};

interface ChatsState {
  chats: Chat[];          // keep array for minimal disruption; each Chat has userID
  curId: string;          // unused by Chatbot page, kept for compatibility
  loading: boolean;
}

const initialState: ChatsState = {
  chats: [
    {
      sessionID: 0,
      userID: 0,
      title: "AWS Learning Chat",
      msgs: [
        {
          id: "m1",
          content: "Hi! I'm your AWS learning assistant. Ask me anything.",
          isBot: true,
          ts: new Date().toISOString(),
        },
      ],
      last: new Date().toISOString(),
    },
  ],
  curId: "local-1",
  loading: false,
};

// Helper to find a chat by (userID, sessionID)
function findChatIndex(state: ChatsState, userID: number, sessionID: number) {
  return state.chats.findIndex((c) => c.userID === userID && c.sessionID === sessionID);
}

// --- Async thunks (reads only) ---
export const createChatSession = createAsyncThunk(
  "chats/createChatSession",
  async () => {
    const session = await chatApi.createSession(); // returns ChatSessionDTO
    return session; // { id, user_id, ... }
  }
);

export const fetchMessages = createAsyncThunk(
  "chats/fetchMessages",
  async (sessionID: number) => {
    const msgs = await chatApi.getMessages(sessionID);
    const mapped = msgs.map((m) => ({
      id: String(m.id),
      content: m.message,
      isBot: m.sender === "assistant",
      ts: m.created_at,
    })) as Msg[];
    return { sessionID, msgs: mapped };
  }
);

const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    // ensure a (userID, sessionID) chat stub exists
    upsertSession: (
      state,
      action: PayloadAction<{ id: number; user_id: number; session_started_at?: string | null }>
    ) => {
      const { id, user_id, session_started_at } = action.payload;
      const idx = findChatIndex(state, user_id, id);
      if (idx === -1) {
        state.chats.push({
          sessionID: id,
          userID: user_id,
          title: `New Chat ${state.chats.length + 1}`,
          msgs: [],
          last: session_started_at || new Date().toISOString(),
        });
      }
    },

    // add a single message locally to Redux
    addMessageLocal: (
      state,
      action: PayloadAction<{ userID: number; sessionID: number; content: string; isBot: boolean }>
    ) => {
      const { userID, sessionID, content, isBot } = action.payload;
      const idx = findChatIndex(state, userID, sessionID);
      const msg: Msg = {
        id: Date.now().toString(),
        content,
        isBot,
        ts: new Date().toISOString(),
      };

      if (idx === -1) {
        // if not present, create a stub chat and insert the message
        state.chats.push({
          sessionID,
          userID,
          title: `Chat ${sessionID}`,
          msgs: [msg],
          last: msg.ts,
        });
      } else {
        state.chats[idx].msgs.push(msg);
        state.chats[idx].last = msg.ts;
      }
    },

    // optional local title edit
    editTitle: (state, action: PayloadAction<{ userID: number; sessionID: number; title: string }>) => {
      const { userID, sessionID, title } = action.payload;
      const idx = findChatIndex(state, userID, sessionID);
      if (idx !== -1) state.chats[idx].title = title;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createChatSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(createChatSession.fulfilled, (state, action) => {
        state.loading = false;
        const { id, user_id, session_started_at } = action.payload as unknown as {
          id: number;
          user_id: number;
          session_started_at?: string | null;
        };
        const idx = findChatIndex(state, user_id, id);
        if (idx === -1) {
          state.chats.push({
            sessionID: id,
            userID: user_id,
            title: `New Chat ${state.chats.length + 1}`,
            msgs: [
              {
                id: `greet-${Date.now()}`,
                content: "Hi! I'm your AWS learning assistant. Ask me anything.",
                isBot: true,
                ts: new Date().toISOString(),
              },
            ],
            last: new Date().toISOString(),
          });
        }
      })
      .addCase(createChatSession.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { sessionID, msgs } = action.payload as { sessionID: number; msgs: Msg[] };
        // We don't know userID from this thunk directly; keep existing chat's userID if present
        const existingIdx = state.chats.findIndex((c) => c.sessionID === sessionID);
        if (existingIdx !== -1) {
          state.chats[existingIdx].msgs = msgs;
          state.chats[existingIdx].last = msgs[msgs.length - 1]?.ts ?? state.chats[existingIdx].last;
        }
      });
  },
});

export const { upsertSession, addMessageLocal, editTitle } = chatsSlice.actions;
export default chatsSlice.reducer;
