import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { chatApi } from "../pages/chatbot-page/chatApi";

export type Msg = { id: string; content: string; isBot: boolean; ts: string };
export type Chat = { id: string; sessionID: number; title: string; msgs: Msg[]; last: string };

interface ChatsState {
  chats: Chat[];
  curId: string;
  loading: boolean;
}

const initialState: ChatsState = {
  chats: [
    {
      id: "1",
      sessionID: 0,
      title: "AWS Learning Chat",
      msgs: [
        { id: "m1", content: "Hi! I'm your AWS learning assistant. Ask me anything.", isBot: true, ts: new Date().toISOString() },
      ],
      last: new Date().toISOString(),
    },
  ],
  curId: "1",
  loading: false,
};

// --- Async thunks ---
export const createChatSession = createAsyncThunk(
  "chats/createChatSession",
  async (userID: number) => {
    const session = await chatApi.createSession(userID);
    return session; // { id: number }
  }
);

export const sendMessageAsync = createAsyncThunk(
  "chats/sendMessage",
  async ({ sessionID, content, isBot }: { sessionID: number; content: string; isBot: boolean }) => {
    const sender = isBot ? "bot" : "user";
    const msg = await chatApi.sendMessage(sessionID, content, sender);
    return { ...msg, sessionID }; // add sessionID for reducer
  }
);

export const fetchMessages = createAsyncThunk(
  "chats/fetchMessages",
  async (sessionID: number) => {
    const msgs = await chatApi.getMessages(sessionID);
    return { sessionID, msgs };
  }
);

const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setCur: (state, action: PayloadAction<string>) => {
      state.curId = action.payload;
    },
    editTitle: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find(c => c.id === state.curId);
      if (chat) chat.title = action.payload;
    },
    createChat: (state, action: PayloadAction<Chat>) => {
      state.chats.push(action.payload);
      state.curId = action.payload.id;
    },
    sendMsg: (state, action: PayloadAction<{ content: string; isBot: boolean }>) => {
      const chat = state.chats.find(c => c.id === state.curId);
      if (!chat) return;
      chat.msgs.push({
        id: Date.now().toString(),
        content: action.payload.content,
        isBot: action.payload.isBot,
        ts: new Date().toISOString(),
      });
      chat.last = new Date().toISOString();
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createChatSession.pending, state => { state.loading = true; })
      .addCase(createChatSession.fulfilled, (state, action: PayloadAction<{ id: number }>) => {
        const newId = Date.now().toString();
        state.chats.push({
          id: newId,
          sessionID: action.payload.id,
          title: `New Chat ${state.chats.length + 1}`,
          msgs: [{ id: newId + "-greet", content: "Hi! I'm your AWS learning assistant. Ask me anything.", isBot: true, ts: new Date().toISOString() }],
          last: new Date().toISOString(),
        });
        state.curId = newId;
        state.loading = false;
      })
      .addCase(createChatSession.rejected, state => { state.loading = false; })
      .addCase(sendMessageAsync.fulfilled, (state, action: PayloadAction<{ id: string; content: string; sender: string; ts: string; sessionID: number }>) => {
        const chat = state.chats.find(c => c.sessionID === action.payload.sessionID);
        if (chat) {
          chat.msgs.push({ id: action.payload.id, content: action.payload.content, isBot: action.payload.sender === "bot", ts: action.payload.ts });
          chat.last = new Date().toISOString();
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ sessionID: number; msgs: Msg[] }>) => {
        const chat = state.chats.find(c => c.sessionID === action.payload.sessionID);
        if (chat) chat.msgs = action.payload.msgs;
      });
  },
});

export const { setCur, editTitle, createChat, sendMsg } = chatsSlice.actions;
export default chatsSlice.reducer;
