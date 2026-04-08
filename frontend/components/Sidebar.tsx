"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, Swords, BrainCircuit } from "lucide-react";
import clsx from "clsx";

const NAV = [
  { href: "/", label: "Personas", icon: LayoutGrid },
  { href: "/create", label: "Create", icon: Plus },
  { href: "/arena", label: "Arena", icon: Swords },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-60 shrink-0 bg-[#13131c] border-r border-[#2e2e4a] h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#2e2e4a]">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <BrainCircuit size={20} className="text-white" />
        </div>
        <span className="text-lg font-semibold text-white tracking-tight">Personas</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-6 py-4 border-t border-[#2e2e4a]">
        <p className="text-xs text-gray-600 leading-relaxed">
          Configure your LLM provider in{" "}
          <code className="text-gray-500">backend/.env</code>
        </p>
      </div>
    </aside>
  );
}
