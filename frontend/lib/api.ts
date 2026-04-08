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

export interface ArenaMessage {
  speaker_id: number;
  speaker_name: string;
  reply: string;
}

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

export const api = {
  personas: {
    list: () => request<Persona[]>("/personas"),
    get: (id: number) => request<Persona>(`/personas/${id}`),
    create: (body: { name: string; description: string; type: string; avatar_color: string }) =>
      request<Persona>("/personas", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: number) =>
      request<void>(`/personas/${id}`, { method: "DELETE" }),
  },
  chat: {
    send: (personaId: number, message: string, history: ChatMessage[]) =>
      request<{ reply: string }>(`/chat/${personaId}`, {
        method: "POST",
        body: JSON.stringify({ message, history }),
      }),
  },
  arena: {
    turn: (payload: {
      persona_a_id: number;
      persona_b_id: number;
      topic: string;
      history: ChatMessage[];
      next_speaker: "a" | "b";
    }) =>
      request<ArenaMessage>("/arena", { method: "POST", body: JSON.stringify(payload) }),
  },
};
