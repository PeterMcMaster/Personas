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

export default function CreatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("famous");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [famousName, setFamousName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (tab === "custom") {
      if (!name.trim() || !description.trim()) {
        setError("Please fill in all fields.");
        return;
      }
      setSubmitting(true);
      try {
        await api.personas.create({
          name: name.trim(),
          description: description.trim(),
          type: "custom",
          avatar_color: selectedColor,
        });
        router.push("/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create persona.");
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!famousName.trim()) {
        setError("Please enter a name.");
        return;
      }
      setSubmitting(true);
      try {
        await api.personas.createFamous(famousName.trim());
        router.push("/");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create persona.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const customValid = name.trim().length > 0 && description.trim().length > 0;
  const famousValid = famousName.trim().length > 0;
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
        {(["famous", "custom"] as Tab[]).map((t) => (
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
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Famous Person&apos;s Name
            </label>
            <input
              value={famousName}
              onChange={(e) => setFamousName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canSubmit && !submitting && handleSubmit()}
              placeholder="e.g. Marie Curie, Nikola Tesla, Cleopatra…"
              className="w-full px-4 py-3 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/30 transition-colors text-sm"
            />
            <p className="text-xs text-gray-600 mt-1.5">
              Any real public figure — historical or contemporary. We&apos;ll verify the name and
              fetch a biography automatically.
            </p>
          </div>

          {submitting && (
            <div className="flex items-center gap-3 p-4 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-sm text-gray-400">Verifying &amp; fetching biography…</p>
            </div>
          )}

          {famousName.trim() && !submitting && (
            <div className="flex items-center gap-3 p-4 bg-[#1a1a24] border border-[#2e2e4a] rounded-xl">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-base shrink-0 bg-indigo-500">
                {famousName.trim().charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{famousName.trim()}</p>
                <p className="text-xs text-gray-500">Biography will be fetched on creation</p>
              </div>
            </div>
          )}
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
        {submitting
          ? tab === "famous"
            ? "Verifying & fetching bio…"
            : "Creating…"
          : "Create Persona"}
        {!submitting && <ChevronRight size={16} />}
      </button>
    </div>
  );
}
