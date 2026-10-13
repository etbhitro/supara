"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { AskContext, ViewCard } from "@/components/views";
import { PROMPTS, route, statusLine } from "@/lib/coordinator";
import { uid, useStore } from "@/lib/store";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

// Один экран: владелец спрашивает, координатор разворачивает нужное.
export default function Home() {
  const { state, update } = useStore();
  const [text, setText] = useState("");
  const lastRef = useRef<HTMLDivElement>(null);
  const thread = state.thread;
  const empty = thread.length === 0;

  useEffect(() => {
    lastRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [thread.length]);

  // Ссылка вида /?q=Сводка сразу открывает ответ.
  const linked = useRef(false);
  useEffect(() => {
    if (linked.current) return;
    linked.current = true;
    const queries = new URLSearchParams(window.location.search).getAll("q");
    if (queries.length === 0) return;
    update((s) => ({ ...s, thread: [] }));
    queries.forEach(ask);
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function ask(raw: string) {
    const clean = raw.trim();
    if (!clean) return;
    update((s) => {
      const reply = route(s, clean);
      return {
        ...s,
        thread: [...s.thread, { id: uid("q"), from: "me", text: clean }, { id: uid("a"), from: "bot", text: reply.text, view: reply.view }],
      };
    });
    setText("");
  }

  return (
    <AskContext.Provider value={ask}>
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-ink via-ink/90 to-transparent px-5 pb-6 pt-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[15px] font-medium tracking-wide text-stone-50">Супара</span>
        </div>
        {!empty && (
          <button className="btn-ghost" onClick={() => update((s) => ({ ...s, thread: [] }))}>
            <Plus size={14} />
            Новый запрос
          </button>
        )}
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-44 pt-24 md:px-6">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
            <h1 className="animate-rise text-[clamp(2.4rem,7vw,3.75rem)] font-light leading-[1.05] tracking-tight text-stone-50">{greeting()}</h1>
            <p className="mt-4 animate-rise text-base text-muted-200 [animation-delay:80ms]">{statusLine(state)}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {thread.map((m, i) => {
              const isLastQuestion = m.from === "me" && i === thread.length - 2;
              if (m.from === "me") {
                return (
                  <div key={m.id} ref={isLastQuestion ? lastRef : undefined} className="flex scroll-mt-24 justify-end">
                    <div className="max-w-[85%] rounded-3xl bg-ink-700 px-5 py-2.5 text-[15px] text-stone-100">{m.text}</div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="space-y-4">
                  <p className="animate-rise text-[1.35rem] font-light leading-snug tracking-tight text-stone-50">{m.text}</p>
                  {m.view && <ViewCard view={m.view} />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-ink via-ink to-transparent px-4 pb-5 pt-10 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:justify-center">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => ask(p)} className="btn-ghost shrink-0">
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
            className="flex items-center gap-2 rounded-full bg-ink-700 py-2 pl-6 pr-2 ring-1 ring-inset ring-white/10 transition focus-within:ring-white/25"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Спросите координатора"
              aria-label="Запрос координатору"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-stone-50 outline-none placeholder:text-muted-300"
            />
            <button
              type="submit"
              aria-label="Отправить"
              disabled={!text.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-50 text-ink-900 transition hover:bg-white disabled:bg-white/10 disabled:text-muted-300"
            >
              <ArrowUp size={18} />
            </button>
          </form>
        </div>
      </div>
    </AskContext.Provider>
  );
}
