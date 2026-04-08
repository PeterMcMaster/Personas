"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, BrainCircuit } from "lucide-react";
import { api, type Persona } from "@/lib/api";
import PersonaCard from "@/components/PersonaCard";

export default function DashboardPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.personas
      .list()
      .then(setPersonas)
      .catch(() => setError("Could not connect to the backend. Is it running?"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    await api.personas.delete(id);
    setPersonas((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Personas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {personas.length > 0
              ? `${personas.length} persona${personas.length !== 1 ? "s" : ""} created`
              : "No personas yet"}
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          New Persona
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-52 rounded-2xl bg-[#1a1a24] border border-[#2e2e4a] animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <BrainCircuit size={28} className="text-red-400" />
          </div>
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-gray-600 text-sm mt-2">
            Run{" "}
            <code className="text-gray-500">
              cd backend &amp;&amp; uvicorn main:app --reload
            </code>
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && personas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
            <BrainCircuit size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No personas yet</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            Create your first persona by describing a personality, or bring a
            famous historical figure to life.
          </p>
          <Link
            href="/create"
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Create Persona
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && personas.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((p) => (
            <PersonaCard key={p.id} persona={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
