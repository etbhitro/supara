"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, RotateCcw } from "lucide-react";
import { BrandLockup } from "./Brand";
import { ROLE_LABEL, useStore, type Role } from "@/lib/store";

interface NavItem {
  path: string;
  label: string;
}

const ALL = {
  home: { path: "/", label: "Обзор" },
  bookings: { path: "/bookings/", label: "Брони" },
  guests: { path: "/guests/", label: "Гости" },
  tasks: { path: "/tasks/", label: "Задачи" },
  agents: { path: "/agents/", label: "Сотрудники" },
} satisfies Record<string, NavItem>;

// Кто что видит (ТЗ, раздел 2). Персонал — только свои задачи.
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  owner: [ALL.home, ALL.bookings, ALL.guests, ALL.tasks, ALL.agents],
  manager: [ALL.home, ALL.bookings, ALL.guests, ALL.tasks, ALL.agents],
  reception: [ALL.home, ALL.bookings, ALL.guests, ALL.tasks],
  staff: [ALL.tasks],
};

export function canSee(role: Role, path: string): boolean {
  return NAV_BY_ROLE[role].some((i) => i.path === path);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, update, reset } = useStore();
  const [open, setOpen] = useState(false);
  const items = NAV_BY_ROLE[state.role];
  const current = pathname.endsWith("/") ? pathname : `${pathname}/`;

  const body = (
    <div className="flex h-full w-[232px] flex-col bg-ink-900">
      <Link href="/" className="block px-5 pb-4 pt-6" aria-label="Обзор">
        <BrandLockup />
      </Link>
      <div className="mx-5 h-px bg-white/[0.06]" />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {items.map((item) => {
          const active = current === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setOpen(false)}
              className={`mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-white/[0.06] font-semibold text-stone-50"
                  : "text-muted-200 hover:bg-white/[0.04] hover:text-stone-100"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-500" : "bg-muted-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/[0.06] px-4 py-4">
        <label className="block">
          <div className="label-kicker mb-1.5">Смотреть как</div>
          <select
            value={state.role}
            onChange={(e) => update((s) => ({ ...s, role: e.target.value as Role }))}
            className="w-full rounded-lg border border-white/10 bg-ink-700 px-3 py-2 text-sm font-semibold text-stone-100 outline-none focus:border-accent"
          >
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={reset} className="btn-ghost mt-3 w-full">
          <RotateCcw size={13} />
          Сбросить данные
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink text-stone-200">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-white/[0.06] md:block">{body}</aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/5 bg-ink-900 px-4 md:hidden">
        <button
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg text-stone-200 hover:bg-white/5"
          aria-label="Меню"
        >
          <Menu size={20} />
        </button>
        <BrandLockup />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 animate-fade-in">{body}</div>
        </div>
      )}

      <main className="min-h-screen pt-14 md:ml-[232px] md:pt-0">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-9 md:py-9">{children}</div>
      </main>
    </div>
  );
}
