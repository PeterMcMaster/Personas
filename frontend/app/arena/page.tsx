"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Swords, Play, ChevronRight, RefreshCw, Loader2, Send, Trash2 } from "lucide-react";
import clsx from "clsx";
import { api, type Persona, type ArenaMsgOut, type ArenaSessionOut } from "@/lib/api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ArenaContent() {
  const searchParams = useSearchParams();
  const preselectedA = searchParams.get("a");

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaAId, setPersonaAId] = useState<number | "">("");
  const [personaBId, setPersonaBId] = useState<number | "">("");
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<ArenaMsgOut[]>([]);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPersonas, setLoadingPersonas] = useState(true);
  const [userInput, setUserInput] = useState("");

  // Past sessions
  const [pastSessions, setPastSessions] = useState<ArenaSessionOut[]>([]);
  const [loadingPastSessions, setLoadingPastSessions] = useState(false);
  const [viewingSession, setViewingSession] = useState<number | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);

  const sessionIdRef = useRef<number | null>(null);
  const turnRef = useRef<"a" | "b">("a");
  const abortRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // Load all past sessions on mount
  useEffect(() => {
    setLoadingPastSessions(true);
    api.arena
      .listSessionsForPersona()
      .then(setPastSessions)
      .finally(() => setLoadingPastSessions(false));
  }, []);

  const personaA = personas.find((p) => p.id === Number(personaAId));
  const personaB = personas.find((p) => p.id === Number(personaBId));

  const canStart =
    personaAId !== "" &&
    personaBId !== "" &&
    personaAId !== personaBId &&
    !started;

  const runTurn = async () => {
    if (abortRef.current) return;
    if (!personaA || !personaB || sessionIdRef.current === null) return;

    setLoading(true);
    try {
      const msg = await api.arena.runTurn(sessionIdRef.current, turnRef.current);
      if (abortRef.current) return;
      setMessages((prev) => [...prev, msg]);
      turnRef.current = turnRef.current === "a" ? "b" : "a";
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: -1,
          session_id: sessionIdRef.current!,
          speaker_id: -1,
          speaker_name: "System",
          content: "⚠️ An error occurred. Check that the backend is running.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!personaA || !personaB) return;
    abortRef.current = false;
    setMessages([]);
    setUserInput("");
    turnRef.current = "a";

    try {
      setLoading(true);
      const session = await api.arena.createSession(personaA.id, personaB.id, topic);
      sessionIdRef.current = session.id;
      setStarted(true);
      // Fire first turn
      const msg = await api.arena.runTurn(session.id, "a");
      setMessages([msg]);
      turnRef.current = "b";
    } catch {
      setMessages([{
        id: -1,
        session_id: -1,
        speaker_id: -1,
        speaker_name: "System",
        content: "⚠️ Failed to start the session. Check that the backend is running.",
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (loading) return;
    runTurn();
  };

  const handleReset = () => {
    abortRef.current = true;
    setStarted(false);
    setViewingSession(null);
    setMessages([]);
    setUserInput("");
    turnRef.current = "a";
    sessionIdRef.current = null;
    setTimeout(() => { abortRef.current = false; }, 0);
    // Refresh past sessions list
    api.arena.listSessionsForPersona().then(setPastSessions);
  };

  const handleSendMessage = async () => {
    const text = userInput.trim();
    if (!text || loading || sessionIdRef.current === null) return;
    setUserInput("");
    try {
      const msg = await api.arena.sendUserMessage(sessionIdRef.current, text);
      setMessages((prev) => [...prev, msg]);
    } catch {
      // silently ignore send errors
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    setDeletingSessionId(sessionId);
    try {
      await api.arena.deleteSession(sessionId);
      setPastSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleViewSession = async (sessionId: number) => {
    setViewingSession(sessionId);
    setStarted(false);
    setLoading(true);
    try {
      const session = await api.arena.getSession(sessionId);
      setMessages(session.messages);
    } finally {
      setLoading(false);
    }
  };

  const selectOptions = personas.map((p) => ({ value: p.id, label: p.name }));
  const isReadOnly = viewingSession !== null;

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
            <a href="/create" className="text-indigo-400 hover:underline">Create more</a>.
          </p>
        ) : (
          <div className="space-y-4">
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
                    disabled={started || isReadOnly}
                    className={clsx(
                      "w-full py-2.5 pr-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none",
                      personaA ? "pl-10" : "pl-4"
                    )}
                  >
                    <option value="">Select persona...</option>
                    {selectOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
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
                    disabled={started || isReadOnly}
                    className={clsx(
                      "w-full py-2.5 pr-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/60 transition-colors appearance-none",
                      personaB ? "pl-10" : "pl-4"
                    )}
                  >
                    <option value="">Select persona...</option>
                    {selectOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
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
                  disabled={started || isReadOnly}
                  placeholder="e.g. The nature of gravity"
                  className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/60 transition-colors"
                />
              </div>

              {/* Controls */}
              <div className="flex gap-2 pb-0.5">
                {!started && !isReadOnly ? (
                  <button
                    onClick={handleStart}
                    disabled={!canStart || loading}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      canStart && !loading
                        ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-[#1a1a24] border border-[#2e2e4a] text-gray-600 cursor-not-allowed"
                    )}
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    Start
                  </button>
                ) : started ? (
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
                ) : null}
                {(started || isReadOnly) && (
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

            {/* Past sessions heading */}
            {!started && !isReadOnly && (loadingPastSessions || pastSessions.length > 0) && (
              <p className="flex items-center gap-2 text-xs text-gray-500 font-medium uppercase tracking-wide">
                Past Sessions
                {loadingPastSessions && <Loader2 size={12} className="animate-spin" />}
              </p>
            )}

            {/* Past sessions list */}
            {!started && !isReadOnly && (
              <div className="space-y-2">
                {pastSessions.map((s) => {
                  const pA = personas.find((p) => p.id === s.persona_a_id);
                  const pB = personas.find((p) => p.id === s.persona_b_id);
                  return (
                    <div key={s.id} className="relative group">
                      <button
                        onClick={() => handleViewSession(s.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#2e2e4a] bg-[#1a1a24] hover:border-indigo-500/40 hover:bg-[#1e1e2e] transition-all text-left"
                      >
                        <div className="flex -space-x-2 shrink-0">
                          {[pA, pB].map((p, i) =>
                            p ? (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold border border-[#0f0f13]"
                                style={{ backgroundColor: p.avatar_color }}
                              >
                                {p.name.charAt(0)}
                              </div>
                            ) : null
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-xs text-white font-medium truncate">
                            {pA?.name ?? "?"} vs {pB?.name ?? "?"}
                            {s.topic ? ` · ${s.topic}` : ""}
                          </p>
                          <p className="text-xs text-gray-600">{formatDate(s.created_at)} · {s.message_count} messages</p>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        disabled={deletingSessionId === s.id}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Delete session"
                      >
                        {deletingSessionId === s.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {isReadOnly && (
              <p className="text-xs text-indigo-400">
                Viewing past session — press reset to start a new debate.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {messages.length === 0 && !started && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Swords size={40} className="text-gray-600 mb-4" />
            <p className="text-gray-500 text-sm">
              Select two personas and press Start to begin the debate.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.speaker_id === -2) {
            return (
              <div key={i} className="flex justify-center">
                <div className="flex flex-col items-center gap-1 max-w-sm w-full">
                  <span className="text-xs text-gray-500 px-1">You</span>
                  <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed bg-white/5 border border-white/10 text-gray-300 w-full text-center">
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          }

          const isA = personaA && msg.speaker_id === personaA.id;
          const color =
            msg.speaker_id === personaA?.id
              ? personaA.avatar_color
              : msg.speaker_id === personaB?.id
              ? personaB.avatar_color
              : "#6b7280";

          return (
            <div
              key={i}
              className={clsx("flex gap-3 max-w-2xl", isA ? "mr-auto" : "ml-auto flex-row-reverse")}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: color }}
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
                  {msg.content}
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

      {/* User input bar — visible once debate has started (not for read-only past sessions) */}
      {started && !isReadOnly && (
        <div className="px-8 py-4 border-t border-[#2e2e4a] shrink-0">
          <div className="flex gap-3">
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={loading}
              placeholder="Add a message to the debate…"
              className="flex-1 px-4 py-2.5 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 text-sm focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || loading}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0",
                userInput.trim() && !loading
                  ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
                  : "bg-[#1a1a24] border border-[#2e2e4a] text-gray-600 cursor-not-allowed"
              )}
            >
              <Send size={14} />
              Send
            </button>
          </div>
        </div>
      )}
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
