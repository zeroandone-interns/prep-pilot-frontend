const BASE_URL = "http://localhost:3000/chat";

export const chatApi = {
    createSession: async (userID: number) => {
        const res = await fetch(`${BASE_URL}/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID }),
        });
        if (!res.ok) throw new Error("Failed to create session");
        return res.json(); // backend returns ChatSession object
    },

    endSession: async (sessionID: number) => {
        const res = await fetch(`${BASE_URL}/session/${sessionID}/end`, {
            method: "POST",
        });
        if (!res.ok) throw new Error("Failed to end session");
        return res.json();
    },

    reopenSession: async (sessionID: number) => {
        const res = await fetch(`${BASE_URL}/session/${sessionID}/reopen`, {
            method: "PATCH",
        });
        if (!res.ok) throw new Error("Failed to reopen session");
        return res.json();
    },

    sendMessage: async (sessionID: number, message: string, sender: string) => {
        const res = await fetch(`${BASE_URL}/message`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionID, message, sender }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        return res.json(); // backend returns ChatMessage object
    },

    getMessages: async (sessionID: number) => {
        const res = await fetch(`${BASE_URL}/messages/${sessionID}`);
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json(); // backend returns ChatMessage[]
    },
};
