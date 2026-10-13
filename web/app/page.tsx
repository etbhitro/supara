"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, X } from "lucide-react";
import { BrandMark } from "@/components/Brand";
import { NowLine } from "@/components/live";
import { AskContext, ViewCard } from "@/components/views";
import { PROMPTS, route, sceneOf, statusLine } from "@/lib/coordinator";
import { uid, useStore } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_BASE ?? "";

// Фото на фоне: едва заметное, меняется вместе с темой разговора.
const SCENES = [
  { id: "chunkurchak", on: "opacity-[0.36]", tone: "" },
  // Красный тундук яркий — приглушаем сильнее остальных.
  { id: "ethno", on: "opacity-[0.15]", tone: "saturate-[0.65]" },
  { id: "talkan", on: "opacity-[0.26]", tone: "" },
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
  const thread = state.thread;
  const empty = thread.length === 0;
  // На экране всегда один ответ: новый запрос заменяет предыдущий, а не уезжает вверх.
  const question = thread.find((m) => m.from === "me");
  const answer = thread.find((m) => m.from === "bot");
  const scene = sceneOf(answer?.view);

  function close() {
    update((s) => ({ ...s, thread: [] }));
  }

  // Esc закрывает открытый ответ
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") update((s) => (s.thread.length ? { ...s, thread: [] } : s));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [update]);

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
        thread: [{ id: uid("q"), from: "me", text: clean }, { id: uid("a"), from: "bot", text: reply.text, view: reply.view }],
      };
    });
    setText("");
    window.scrollTo(0, 0);
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
        <div className="absolute inset-0 bg-gradient-to-b from-paper/60 via-paper/10 to-paper/80" />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between bg-gradient-to-b from-paper via-paper/80 to-transparent px-5 pb-6 pt-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <span className="font-display text-xl text-ink">Супара</span>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-[54rem] flex-col px-4 pb-52 pt-24 md:px-6">
        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center pb-10 text-center">
            <h1 className="animate-rise font-display text-[clamp(3rem,8.5vw,5rem)] leading-[1.05] text-ink [animation-duration:1100ms]">{greeting()}</h1>
            <p className="mt-5 animate-rise text-lg text-muted-100 [animation-delay:900ms]">{statusLine(state)}</p>
            <NowLine />
          </div>
        ) : (
          answer && (
            // key: при новом запросе карточка создаётся заново, старая исчезает сразу
            <div key={answer.id} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full border border-bronze/25 bg-bronze/15 px-5 py-2 text-[15px] text-ink backdrop-blur-xl">{question?.text}</span>
                <button onClick={close} aria-label="Закрыть" title="Закрыть" className="btn-ghost h-11 w-11 shrink-0 p-0">
                  <X size={18} />
                </button>
              </div>
              <p className="animate-rise font-display text-[1.75rem] leading-snug text-ink">{answer.text}</p>
              {answer.view && <ViewCard view={answer.view} />}
            </div>
          )
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-paper via-paper/95 to-transparent px-4 pb-3 pt-10 md:px-6">
        <div className={`mx-auto w-full max-w-[54rem] ${empty ? "animate-rise [animation-delay:1500ms]" : ""}`}>
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:flex-wrap md:justify-center">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => ask(p)} className="btn-ghost shrink-0 px-4 py-2 text-sm">
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(text);
            }}
            className="flex items-center gap-2 rounded-full border border-white/80 bg-white/55 py-2 pl-7 pr-2 shadow-[0_16px_50px_rgba(60,40,20,0.12)] backdrop-blur-2xl transition focus-within:bg-white/80"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Спросите координатора"
              aria-label="Запрос координатору"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[17px] text-ink outline-none placeholder:text-muted-300"
            />
            <button
              type="submit"
              aria-label="Отправить"
              disabled={!text.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-bronze text-white transition hover:bg-bronze-dark disabled:bg-black/[0.06] disabled:text-muted-300"
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
