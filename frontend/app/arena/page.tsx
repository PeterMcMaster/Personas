"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Swords, Play, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import clsx from "clsx";
import { api, type Persona, type ChatMessage } from "@/lib/api";

interface ArenaMessage {
  speaker_id: number;
  speaker_name: string;
  avatar_color: string;
  reply: string;
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const preselectedA = searchParams.get("a");

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaAId, setPersonaAId] = useState<number | "">("");
  const [personaBId, setPersonaBId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<ArenaMessage[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const abortRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const turnRef = useRef<"a" | "b">("a");
  const chatHistoryRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    api.personas
      .list()
      .then((list) => {
        setPersonas(list);
        if (preselectedA) {
          const id = Number(preselectedA);
          if (list.some((p) => p.id === id)) setPersonaAId(id);
        }
      })
      .finally(() => setLoadingPersonas(false));
  }, [preselectedA]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const personaA = personas.find((p) => p.id === Number(personaAId));
  const personaB = personas.find((p) => p.id === Number(personaBId));
  const canStart =
    personaAId !== "" &&
    personaBId !== "" &&
    personaAId !== personaBId &&
    !started;

  const runTurn = async () => {
    if (abortRef.current) return;
    if (!personaA || !personaB) return;

    setLoading(true);
    try {
      const result = await api.arena.turn({
        persona_a_id: personaA.id,
        persona_b_id: personaB.id,
        topic,
        history: chatHistoryRef.current,
        next_speaker: turnRef.current,
      });

      if (abortRef.current) return;

      const speaker = turnRef.current === "a" ? personaA : personaB;
      const arenaMsg: ArenaMessage = {
        speaker_id: result.speaker_id,
        speaker_name: result.speaker_name,
        avatar_color: speaker.avatar_color,
        reply: result.reply,
      };

      setMessages((prev) => [...prev, arenaMsg]);

      chatHistoryRef.current = [
        ...chatHistoryRef.current,
        { role: "user", content: `${result.speaker_name}: ${result.reply}` },
      ];

      turnRef.current = turnRef.current === "a" ? "b" : "a";
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          speaker_id: -1,
          speaker_name: "System",
          avatar_color: "#6b7280",
          reply: "⚠️ An error occurred. Check that the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    abortRef.current = false;
    chatHistoryRef.current = [];
    turnRef.current = "a";
    setMessages([]);
    setStarted(true);
    runTurn();
  };

  const handleNext = () => {
    if (loading) return;
    runTurn();
  };

  const handleReset = () => {
    abortRef.current = true;
    setStarted(false);
    setMessages([]);
    chatHistoryRef.current = [];
    turnRef.current = "a";
    // Allow new runs after reset
    setTimeout(() => { abortRef.current = false; }, 0);
  };

  const selectOptions = personas.map((p) => ({ value: p.id, label: p.name }));

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#2e2e4a] shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Swords size={22} className="text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Arena</h1>
        </div>
        <p className="text-gray-500 text-sm">
          Select two personas and watch them debate a topic.
        </p>
      </div>

      {/* Config */}
      <div className="px-8 py-5 border-b border-[#2e2e4a] shrink-0">
        {loadingPersonas ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading personas...
          </div>
        ) : personas.length < 2 ? (
          <p className="text-sm text-gray-500">
            You need at least 2 personas to use the Arena.{" "}
            <a href="/create" className="text-indigo-400 hover:underline">
              Create more
            </a>
            .
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            {/* Persona A */}
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                Persona A
              </label>
              <div className="relative">
                {personaA && (
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold pointer-events-none"
                    style={{ backgroundColor: personaA.avatar_color }}
                  >
                    {personaA.name.charAt(0)}
                  </div>
                )}
                <select
                  value={personaAId}
                  onChange={(e) => setPersonaAId(Number(e.target.value))}
                  disabled={started}
                  className={clsx(
                    "w-full py-2.5 pr-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none",
                    personaA ? "pl-10" : "pl-4"
                  )}
                >
                  <option value="">Select persona...</option>
                  {selectOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-gray-600 font-bold text-sm pb-2">vs</div>

            {/* Persona B */}
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                Persona B
              </label>
              <div className="relative">
                {personaB && (
                  <div
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold pointer-events-none"
                    style={{ backgroundColor: personaB.avatar_color }}
                  >
                    {personaB.name.charAt(0)}
                  </div>
                )}
                <select
                  value={personaBId}
                  onChange={(e) => setPersonaBId(Number(e.target.value))}
                  disabled={started}
                  className={clsx(
                    "w-full py-2.5 pr-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none",
                    personaB ? "pl-10" : "pl-4"
                  )}
                >
                  <option value="">Select persona...</option>
                  {selectOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topic */}
            <div className="flex-[2] min-w-48">
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">
                Topic (optional)
              </label>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={started}
                placeholder="e.g. The nature of gravity"
                className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            {/* Controls */}
            <div className="flex gap-2 pb-0.5">
              {!started ? (
                <button
                  onClick={handleStart}
                  disabled={!canStart}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    canStart
                      ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-[#1a1a24] border border-[#2e2e4a] text-gray-600 cursor-not-allowed"
                  )}
                >
                  <Play size={14} />
                  Start
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    loading
                      ? "bg-[#1a1a24] border border-[#2e2e4a] text-gray-600 cursor-not-allowed"
                      : "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                  )}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
                  Next
                </button>
              )}
              {started && (
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Reset"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && !started && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Swords size={40} className="text-gray-600 mb-4" />
            <p className="text-gray-500 text-sm">
              Select two personas and press Start to begin the debate.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isA = personaA && msg.speaker_id === personaA.id;
          return (
            <div
              key={i}
              className={clsx("flex gap-3 max-w-2xl", isA ? "mr-auto" : "ml-auto flex-row-reverse")}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: msg.avatar_color }}
              >
                {msg.speaker_name.charAt(0).toUpperCase()}
              </div>
              <div className={clsx("flex flex-col gap-1", isA ? "items-start" : "items-end")}>
                <span className="text-xs text-gray-500 px-1">{msg.speaker_name}</span>
                <div
                  className={clsx(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isA
                      ? "bg-[#22223a] text-gray-200 rounded-tl-sm"
                      : "bg-indigo-500/20 text-indigo-100 rounded-tr-sm border border-indigo-500/20"
                  )}
                >
                  {msg.reply}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Loader2 size={14} className="animate-spin" />
            <span>
              {turnRef.current === "a" ? personaA?.name : personaB?.name} is thinking...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-indigo-400" size={28} />
      </div>
    }>
      <ArenaContent />
    </Suspense>
  );
}
