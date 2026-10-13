"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Plus } from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { AskContext, ViewCard } from "@/components/views";
import { PROMPTS, route, sceneOf, statusLine } from "@/lib/coordinator";
import { uid, useStore } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_BASE ?? "";

// Фото на фоне: едва заметное, меняется вместе с темой разговора.
const SCENES = [
  { id: "chunkurchak", on: "opacity-[0.28]", tone: "" },
  // Красный тундук яркий — приглушаем сильнее остальных.
  { id: "ethno", on: "opacity-[0.15]", tone: "saturate-[0.6]" },
  { id: "talkan", on: "opacity-[0.2]", tone: "" },
] as const;

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
  const scene = sceneOf(thread[thread.length - 1]?.view);

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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper" aria-hidden>
        {SCENES.map((s) => (
          <img
            key={s.id}
            src={`${BASE}/img/${s.id}.jpg`}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover ${s.tone} transition-opacity duration-1000 ${scene === s.id ? s.on : "opacity-0"}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-paper/70 via-paper/20 to-paper/85" />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-paper via-paper/80 to-transparent px-5 pb-6 pt-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="text-[15px] font-medium tracking-wide text-ink">Супара</span>
        </div>
        {!empty && (
          <button className="btn-ghost" onClick={() => update((s) => ({ ...s, thread: [] }))}>
            <Plus size={14} />
            Новый запрос
          </button>
        )}
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-48 pt-24 md:px-6">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
            <h1 className="animate-rise text-[clamp(2.4rem,7vw,3.75rem)] font-light leading-[1.05] tracking-tight text-ink">{greeting()}</h1>
            <p className="mt-4 animate-rise text-base text-muted-100 [animation-delay:80ms]">{statusLine(state)}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {thread.map((m, i) => {
              const isLastQuestion = m.from === "me" && i === thread.length - 2;
              if (m.from === "me") {
                return (
                  <div key={m.id} ref={isLastQuestion ? lastRef : undefined} className="flex scroll-mt-24 justify-end">
                    <div className="max-w-[85%] rounded-3xl bg-leaf px-5 py-2.5 text-[15px] text-white">{m.text}</div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="space-y-4">
                  <p className="animate-rise text-[1.35rem] font-light leading-snug tracking-tight text-ink">{m.text}</p>
                  {m.view && <ViewCard view={m.view} />}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-paper via-paper/95 to-transparent px-4 pb-3 pt-10 md:px-6">
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
            className="flex items-center gap-2 rounded-full bg-white py-2 pl-6 pr-2 shadow-soft ring-1 ring-inset ring-black/[0.06] transition focus-within:ring-leaf/40"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Спросите координатора"
              aria-label="Запрос координатору"
              className="min-w-0 flex-1 bg-transparent py-2 text-base text-ink outline-none placeholder:text-muted-300"
            />
            <button
              type="submit"
              aria-label="Отправить"
              disabled={!text.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-leaf text-white transition hover:bg-leaf-dark disabled:bg-black/[0.06] disabled:text-muted-300"
            >
              <ArrowUp size={18} />
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-300">
            Фото:{" "}
            <a className="hover:text-muted-100" href="https://commons.wikimedia.org/wiki/File:Chunkurchak_pano_view.jpg" target="_blank" rel="noopener">
              Vilya Shoni
            </a>
            ,{" "}
            <a className="hover:text-muted-100" href="https://commons.wikimedia.org/wiki/File:The_T%C3%BCnd%C3%BCk.jpg" target="_blank" rel="noopener">
              Ataian
            </a>{" "}
            (CC BY-SA 4.0),{" "}
            <a className="hover:text-muted-100" href="https://commons.wikimedia.org/wiki/File:Rocky_Mountain_chocolates.jpg" target="_blank" rel="noopener">
              Wilfredor
            </a>
          </p>
        </div>
      </div>
    </AskContext.Provider>
  );
}
