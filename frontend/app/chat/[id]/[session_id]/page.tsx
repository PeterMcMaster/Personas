"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { api, type Persona, type MessageOut } from "@/lib/api";
import ChatBubble from "@/components/ChatBubble";

interface Props {
  params: Promise<{ id: string; session_id: string }>;
}

export default function ChatSessionPage({ params }: Props) {
  const { id, session_id } = use(params);
  const personaId = Number(id);
  const chatId = Number(session_id);

  const [persona, setPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<MessageOut[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      api.personas.get(personaId),
      api.chats.get(chatId),
    ])
      .then(([p, chat]) => {
        setPersona(p);
        setMessages(chat.messages);
      })
      .finally(() => setLoadingSession(false));
  }, [personaId, chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setLoading(true);

    try {
      const { user_message, assistant_message } = await api.chats.sendMessage(chatId, text);
      setMessages((prev) => [...prev, user_message, assistant_message]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: -1,
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (loadingSession) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-400" size={28} />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-400">Persona not found.</p>
        <Link href="/" className="text-indigo-400 hover:underline text-sm">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#2e2e4a] bg-[#0f0f13] shrink-0">
        <Link
          href={`/chat/${personaId}`}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: persona.avatar_color }}
        >
          {persona.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white">{persona.name}</h1>
          <p className="text-xs text-gray-500 capitalize">{persona.type} persona</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-60">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
              style={{ backgroundColor: persona.avatar_color }}
            >
              {persona.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{persona.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">Say something to start the conversation.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={msg.content}
            personaName={persona.name}
            avatarColor={persona.avatar_color}
          />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: persona.avatar_color }}
            >
              {persona.name.charAt(0).toUpperCase()}
            </div>
            <div className="bg-[#22223a] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[#2e2e4a] bg-[#0f0f13] shrink-0">
        <div className="flex gap-3 items-end max-w-3xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${persona.name}...`}
            rows={1}
            className="flex-1 px-4 py-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors text-sm resize-none leading-relaxed"
            style={{ maxHeight: "8rem" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:bg-[#1a1a24] disabled:text-gray-600 text-white transition-colors shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-700 text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
