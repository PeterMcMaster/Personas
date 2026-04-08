"use client";

import Link from "next/link";
import { MessageCircle, Swords, Trash2 } from "lucide-react";
import type { Persona } from "@/lib/api";

interface Props {
  persona: Persona;
  onDelete: (id: number) => void;
}

export default function PersonaCard({ persona, onDelete }: Props) {
  const initial = persona.name.charAt(0).toUpperCase();

  return (
    <div className="group relative flex flex-col bg-[#1a1a24] border border-[#2e2e4a] rounded-2xl p-5 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-inner shrink-0"
          style={{ backgroundColor: persona.avatar_color }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-white truncate">{persona.name}</h3>
          <span className="text-xs text-gray-500 capitalize">{persona.type}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 line-clamp-3 flex-1 mb-5 leading-relaxed">
        {persona.description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/chat/${persona.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-colors"
        >
          <MessageCircle size={14} />
          Chat
        </Link>
        <Link
          href={`/arena?a=${persona.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
        >
          <Swords size={14} />
          Arena
        </Link>
        <button
          onClick={() => onDelete(persona.id)}
          className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label="Delete persona"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
