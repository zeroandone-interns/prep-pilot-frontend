import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
export type Msg = { id: string; content: string; isBot: boolean; ts: string };
export type Chat = { id: string; title: string; msgs: Msg[]; last: string };

interface ChatsState {
  chats: Chat[];
  curId: string;
}

const initialState: ChatsState = {
  chats: [
    {
      id: "1",
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
  curId: "1",
};

export const chatsSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setCur: (state: ChatsState, action: PayloadAction<string>) => {
      state.curId = action.payload;
    },
    createChat: (state: ChatsState) => {
      const id = Date.now().toString();
      state.chats.push({
        id,
        title: `New Chat ${state.chats.length + 1}`,
        msgs: [
          {
            id: id + "-greet",
            content: "Hi! I'm your AWS learning assistant. Ask me anything.",
            isBot: true,
            ts: new Date().toISOString(),
          },
        ],
        last: new Date().toISOString(),
      });
      state.curId = id;
    },
    sendMsg: (
      state: ChatsState,
      action: PayloadAction<{ content: string; isBot: boolean }>
    ) => {
      const chat = state.chats.find((c) => c.id === state.curId);
      if (!chat) return;
      chat.msgs.push({
        id: Date.now().toString(),
        content: action.payload.content,
        isBot: action.payload.isBot,
        ts: new Date().toISOString(),
      });
      chat.last = new Date().toISOString();
    },
    editTitle: (state: ChatsState, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c.id === state.curId);
      if (chat) {
        chat.title = action.payload;
      }
    },
  },
});

export const { setCur, createChat, sendMsg, editTitle } = chatsSlice.actions;
export default chatsSlice.reducer;
