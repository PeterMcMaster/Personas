const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Persona {
  id: number;
  name: string;
  description: string;
  type: "custom" | "famous";
  avatar_color: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ---------------------------------------------------------------------------
// Persona chat types
// ---------------------------------------------------------------------------

export interface MessageOut {
  id: number;
  role: string;
  content: string;
  created_at: string;
}

export interface ChatOut {
  id: number;
  persona_id: number;
  created_at: string;
  message_count: number;
  last_message: string | null;
}

export interface ChatDetailOut {
  id: number;
  persona_id: number;
  created_at: string;
  messages: MessageOut[];
}

export interface SendMessageResponse {
  user_message: MessageOut;
  assistant_message: MessageOut;
}

// ---------------------------------------------------------------------------
// Arena types
// ---------------------------------------------------------------------------

export interface ArenaMsgOut {
  id: number;
  session_id: number;
  speaker_id: number;
  speaker_name: string;
  content: string;
  created_at: string;
}

export interface ArenaSessionOut {
  id: number;
  persona_a_id: number;
  persona_b_id: number;
  topic: string;
  created_at: string;
  message_count: number;
}

export interface ArenaSessionDetailOut {
  id: number;
  persona_a_id: number;
  persona_b_id: number;
  topic: string;
  created_at: string;
  messages: ArenaMsgOut[];
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const api = {
  personas: {
    list: () => request<Persona[]>("/personas"),
    get: (id: number) => request<Persona>(`/personas/${id}`),
    create: (body: { name: string; description: string; type: string; avatar_color: string }) =>
      request<Persona>("/personas", { method: "POST", body: JSON.stringify(body) }),
    createFamous: (name: string) =>
      request<Persona>("/personas/famous", { method: "POST", body: JSON.stringify({ name }) }),
    delete: (id: number) =>
      request<void>(`/personas/${id}`, { method: "DELETE" }),
  },

  chats: {
    create: (personaId: number) =>
      request<ChatDetailOut>("/chats", {
        method: "POST",
        body: JSON.stringify({ persona_id: personaId }),
      }),
    listForPersona: (personaId: number) =>
      request<ChatOut[]>(`/personas/${personaId}/chats`),
    get: (chatId: number) =>
      request<ChatDetailOut>(`/chats/${chatId}`),
    sendMessage: (chatId: number, content: string) =>
      request<SendMessageResponse>(`/chats/${chatId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    delete: (chatId: number) =>
      request<void>(`/chats/${chatId}`, { method: "DELETE" }),
  },

  arena: {
    createSession: (personaAId: number, personaBId: number, topic: string) =>
      request<ArenaSessionDetailOut>("/arena/sessions", {
        method: "POST",
        body: JSON.stringify({ persona_a_id: personaAId, persona_b_id: personaBId, topic }),
      }),
    listSessionsForPersona: (personaId?: number) =>
      request<ArenaSessionOut[]>(
        personaId !== undefined ? `/arena/sessions?persona_id=${personaId}` : "/arena/sessions"
      ),
    getSession: (sessionId: number) =>
      request<ArenaSessionDetailOut>(`/arena/sessions/${sessionId}`),
    runTurn: (sessionId: number, nextSpeaker: "a" | "b") =>
      request<ArenaMsgOut>(`/arena/sessions/${sessionId}/turns`, {
        method: "POST",
        body: JSON.stringify({ next_speaker: nextSpeaker }),
      }),
    sendUserMessage: (sessionId: number, content: string) =>
      request<ArenaMsgOut>(`/arena/sessions/${sessionId}/user-messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    deleteSession: (sessionId: number) =>
      request<void>(`/arena/sessions/${sessionId}`, { method: "DELETE" }),
  },
};
