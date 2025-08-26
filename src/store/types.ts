export interface ChatSession {
    id: number;
    session_started_at?: string;
    session_ended_at?: string;
    session_created_at: string;
    user_id: number;
}

export interface ChatMessage {
    id: number;
    message: string;
    sender: string;
    created_at: string;
    session_id: number;
}
