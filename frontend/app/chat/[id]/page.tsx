"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Plus, Trash2, Loader2 } from "lucide-react";
import { api, type Persona, type ChatOut } from "@/lib/api";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ChatHistoryPage({ params }: Props) {
  const { id } = use(params);
  const personaId = Number(id);
  const router = useRouter();

  const [persona, setPersona] = useState<Persona | null>(null);
  const [chats, setChats] = useState<ChatOut[]>([]);
  const [loadingPersona, setLoadingPersona] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [starting, setStarting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    api.personas.get(personaId).then(setPersona).finally(() => setLoadingPersona(false));
    api.chats.listForPersona(personaId).then(setChats).finally(() => setLoadingChats(false));
  }, [personaId]);

  const handleDeleteChat = async (e: React.MouseEvent, chatId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(chatId);
    try {
      await api.chats.delete(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewChat = async () => {
    setStarting(true);
    try {
      const chat = await api.chats.create(personaId);
      router.push(`/chat/${personaId}/${chat.id}`);
    } finally {
      setStarting(false);
    }
  };

  if (loadingPersona) {
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
          href="/"
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
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white">{persona.name}</h1>
          <p className="text-xs text-gray-500 capitalize">{persona.type} persona</p>
        </div>
        <button
          onClick={handleNewChat}
          disabled={starting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          {starting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          New Chat
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loadingChats ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
          </div>
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
            <MessageSquare size={40} className="text-gray-600" />
            <div>
              <p className="text-white font-medium">No conversations yet</p>
              <p className="text-gray-500 text-sm mt-1">Start a new chat to begin talking with {persona.name}.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {chats.map((chat) => (
              <div key={chat.id} className="relative group">
                <Link
                  href={`/chat/${personaId}/${chat.id}`}
                  className="flex items-start gap-4 p-4 rounded-xl border border-[#2e2e4a] bg-[#1a1a24] hover:border-indigo-500/40 hover:bg-[#1e1e2e] transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
                    style={{ backgroundColor: persona.avatar_color }}
                  >
                    {persona.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-white">
                        {formatDate(chat.created_at)}
                      </p>
                      <span className="text-xs text-gray-600 shrink-0">
                        {chat.message_count} message{chat.message_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {chat.last_message ?? "No messages yet"}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  disabled={deletingId === chat.id}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                  aria-label="Delete chat"
                >
                  {deletingId === chat.id
                    ? <Loader2 size={14} className="animate-spin" />
                    : <Trash2 size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
