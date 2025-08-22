// src/pages/chatbot-page/chatApi.ts
type Sender = "user" | "assistant";

export type ChatMessageDTO = {
  id: number;
  session_id: number;
  message: string;
  sender: Sender;
  created_at: string;
};

export type ChatSessionDTO = {
  id: number;
  user_id: number;
  session_created_at: string;
  session_started_at: string | null;
  session_ended_at: string | null;
  // optional convenience field returned by backend
  lastMessageAt?: string | null;
};

const API_ROOT = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "";
const BASE_URL = `${API_ROOT}/chat`;

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const chatApi = {
  // Sessions
  getSessions: async (): Promise<ChatSessionDTO[]> => {
    const res = await fetch(`${BASE_URL}/sessions`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Failed to fetch sessions");
    return res.json();
  },

  createSession: async (): Promise<ChatSessionDTO> => {
    const res = await fetch(`${BASE_URL}/session`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({}), // user is taken from token server-side
    });
    if (!res.ok) throw new Error("Failed to create session");
    return res.json();
  },

  endSession: async (sessionID: number): Promise<ChatSessionDTO> => {
    const res = await fetch(`${BASE_URL}/session/${sessionID}/end`, {
      method: "POST",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to end session");
    return res.json();
  },

  reopenSession: async (sessionID: number): Promise<ChatSessionDTO> => {
    const res = await fetch(`${BASE_URL}/session/${sessionID}/reopen`, {
      method: "PATCH",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to reopen session");
    return res.json();
  },

  // Messages
  sendMessage: async (
    sessionID: number,
    message: string,
    sender: Sender
  ): Promise<ChatMessageDTO> => {
    const res = await fetch(`${BASE_URL}/message`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ sessionID, message, sender }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    return res.json();
  },

  getMessages: async (sessionID: number): Promise<ChatMessageDTO[]> => {
    const res = await fetch(`${BASE_URL}/messages/${sessionID}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch messages");
    return res.json();
  },
};
