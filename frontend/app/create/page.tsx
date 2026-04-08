"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, User, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { api } from "@/lib/api";

type Tab = "custom" | "famous";

const AVATAR_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6",
];

const FAMOUS_PEOPLE = [
  { name: "Albert Einstein", description: "Theoretical physicist who developed the theory of relativity and made seminal contributions to quantum mechanics. Speaks with curiosity, profound insight, and often uses thought experiments to explain complex ideas. Famous for challenging conventional wisdom.", avatar_color: "#3b82f6" },
  { name: "Isaac Newton", description: "English mathematician, physicist, and astronomer who formulated the laws of motion and universal gravitation. Precise, methodical, and deeply religious. Tends to speak in measured, formal terms and is passionate about mathematics and natural philosophy.", avatar_color: "#22c55e" },
  { name: "Marie Curie", description: "Pioneer in radioactivity research and the first woman to win a Nobel Prize. Determined, meticulous, and unassuming. Speaks with quiet confidence and a deep commitment to scientific truth despite facing discrimination.", avatar_color: "#ec4899" },
  { name: "Nikola Tesla", description: "Visionary inventor and electrical engineer who developed alternating current systems. Eccentric, brilliant, and often misunderstood. Speaks with intense passion about electricity, energy, and the future of humanity.", avatar_color: "#f97316" },
  { name: "Leonardo da Vinci", description: "Renaissance polymath: painter, sculptor, architect, musician, mathematician, engineer, and scientist. Endlessly curious and observant, always drawing connections between art and science. Speaks poetically and asks many questions.", avatar_color: "#eab308" },
  { name: "Cleopatra VII", description: "Last active ruler of the Ptolemaic Kingdom of Egypt. Brilliant strategist, polyglot, and charismatic leader who used diplomacy and intelligence as her primary weapons. Speaks with authority, wit, and political acuity.", avatar_color: "#8b5cf6" },
  { name: "Socrates", description: "Ancient Greek philosopher who used dialogue and questioning (the Socratic method) to pursue truth. Never claims to know the answers, preferring to draw wisdom out through questions. Speaks humbly yet pointedly.", avatar_color: "#f43f5e" },
  { name: "Ada Lovelace", description: "Mathematician and the world's first computer programmer, who worked with Charles Babbage on the Analytical Engine. Visionary, imaginative, and analytically precise. Speaks enthusiastically about the potential of machines to create.", avatar_color: "#14b8a6" },
];

export default function CreatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("custom");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedFamous, setSelectedFamous] = useState<(typeof FAMOUS_PEOPLE)[0] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    const payload =
      tab === "custom"
        ? { name: name.trim(), description: description.trim(), type: "custom", avatar_color: selectedColor }
        : {
            name: selectedFamous!.name,
            description: selectedFamous!.description,
            type: "famous",
            avatar_color: selectedFamous!.avatar_color,
          };

    if (!payload.name || !payload.description) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      await api.personas.create(payload);
      router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create persona.");
    } finally {
      setSubmitting(false);
    }
  };

  const customValid = name.trim().length > 0 && description.trim().length > 0;
  const famousValid = selectedFamous !== null;
  const canSubmit = tab === "custom" ? customValid : famousValid;

  return (
    <div className="max-w-2xl mx-auto px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Create Persona</h1>
        <p className="text-gray-500 text-sm mt-1">
          Define a personality or bring a historical figure to life.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1a1a24] border border-[#2e2e4a] rounded-xl p-1 mb-6">
        {(["custom", "famous"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
              tab === t
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                : "text-gray-500 hover:text-white"
            )}
          >
            {t === "custom" ? <Sparkles size={15} /> : <User size={15} />}
            {t === "custom" ? "Custom" : "Famous Person"}
          </button>
        ))}
      </div>

      {/* Custom tab */}
      {tab === "custom" && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Stoic Philosopher"
              className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Personality Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the personality, speech style, values, and quirks of this persona..."
              rows={5}
              className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-colors text-sm resize-none"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Be specific — richer descriptions create more compelling personas.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Avatar Color</label>
            <div className="flex gap-2.5 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={clsx(
                    "w-8 h-8 rounded-lg transition-all",
                    selectedColor === color
                      ? "ring-2 ring-white/80 ring-offset-2 ring-offset-[#0f0f13] scale-110"
                      : "opacity-70 hover:opacity-100"
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={color}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="flex items-center gap-3 p-4 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {description || "No description yet"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Famous tab */}
      {tab === "famous" && (
        <div className="grid grid-cols-1 gap-3">
          {FAMOUS_PEOPLE.map((person) => (
            <button
              key={person.name}
              onClick={() =>
                setSelectedFamous(selectedFamous?.name === person.name ? null : person)
              }
              className={clsx(
                "flex items-start gap-4 p-4 rounded-xl border text-left transition-all",
                selectedFamous?.name === person.name
                  ? "border-indigo-500/60 bg-indigo-500/10"
                  : "border-[#2e2e4a] bg-[#1a1a24] hover:border-[#3e3e5a]"
              )}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0 mt-0.5"
                style={{ backgroundColor: person.avatar_color }}
              >
                {person.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{person.name}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {person.description}
                </p>
              </div>
              {selectedFamous?.name === person.name && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className={clsx(
          "mt-6 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all",
          canSubmit && !submitting
            ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20"
            : "bg-[#1a1a24] text-gray-600 cursor-not-allowed border border-[#2e2e4a]"
        )}
      >
        {submitting ? "Creating..." : "Create Persona"}
        {!submitting && <ChevronRight size={16} />}
      </button>
    </div>
  );
}
