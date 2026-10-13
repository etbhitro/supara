"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NoAccess } from "@/components/DataShell";
import { AGENTS, AGENT_NAME, guestBotReply } from "@/lib/agents";
import { uid, useStore } from "@/lib/store";

const HINTS = ["Сколько стоит?", "Есть места на выходные?", "Хочу юрту с 20 по 22, нас четверо", "Как добраться?"];

export default function AgentsPage() {
  const { state, update } = useStore();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [state.chat.length]);

  if (state.role !== "owner" && state.role !== "manager") return <NoAccess what="AI-агенты" />;

  function send(message: string) {
    const clean = message.trim();
    if (!clean) return;
    update((s) => {
      const withGuest = { ...s, chat: [...s.chat, { id: uid("c"), from: "guest" as const, text: clean }] };
      const { state: next, reply } = guestBotReply(withGuest, clean);
      return { ...next, chat: [...next.chat, { id: uid("c"), from: "bot" as const, text: reply }] };
    });
    setText("");
  }

  return (
    <>
      <PageHeader title="AI-агенты" subtitle="Гостевой бот, операции и аналитика" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card flex h-[560px] flex-col p-0">
          <div className="border-b border-white/10 px-5 py-3">
            <div className="card-title">Гостевой бот</div>
            <div className="text-xs text-muted-200">Диалог с гостем</div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
            {state.chat.map((m) => (
              <div key={m.id} className={`flex ${m.from === "guest" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.from === "guest" ? "rounded-br-md bg-accent-600 text-ink-900" : "rounded-bl-md bg-ink-700 text-stone-100"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {HINTS.map((h) => (
              <button key={h} onClick={() => send(h)} className="btn-ghost py-1.5">
                {h}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Сообщение от гостя…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-stone-100 outline-none placeholder:text-muted-300 focus:border-accent"
            />
            <button className="btn-primary shrink-0 px-3" type="submit" aria-label="Отправить">
              <Send size={16} />
            </button>
          </form>
        </div>

        <div className="grid content-start gap-4">
          <div className="card">
            <div className="card-title mb-3">Журнал действий агентов</div>
            {state.logs.length === 0 ? (
              <div className="text-sm text-muted-200">Пока пусто.</div>
            ) : (
              <ul className="max-h-[240px] space-y-3 overflow-y-auto pr-1 text-sm">
                {state.logs.map((l) => (
                  <li key={l.id}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-accent-400">
                      {AGENT_NAME[l.agent]} · {new Date(l.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-stone-100">{l.text}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="card-title mb-3">Команда агентов</div>
            <ul className="space-y-3">
              {AGENTS.filter((a) => a.live).map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-100">{a.name}</div>
                    <div className="text-xs leading-relaxed text-muted-200">{a.does}</div>
                  </div>
                  <span className="chip mt-0.5 bg-emerald-500/15 text-emerald-300">Работает</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
