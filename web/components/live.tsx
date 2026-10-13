"use client";

// «Живые» карточки интеграций: диалоги, звонки, качество сервиса, устройства и тревоги.
// Каждая карточка проигрывает сценарий по кругу, пока открыта (сценарии — в lib/live.ts).

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  ALERT,
  CALLS,
  CHAN,
  DEVICE_EVENTS,
  NOW_FEED,
  PIPELINE,
  RATING,
  RECENT_CALLS,
  SITES,
  THREADS,
  type DeviceEvent,
} from "@/lib/live";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card animate-rise ${className}`}>{children}</div>;
}

function Live() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="absolute inset-0 animate-ping rounded-full bg-bronze opacity-60" />
      <span className="relative h-2 w-2 rounded-full bg-bronze" />
    </span>
  );
}

function clock(): string {
  return new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

// ---------- Строка «сейчас» на приветственном экране ----------

export function NowLine() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % NOW_FEED.length), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="mt-6 flex animate-rise items-center justify-center gap-3 text-[15px] text-muted-100 [animation-delay:1300ms]">
      <Live />
      <span key={i} className="animate-fade-in">
        {NOW_FEED[i]}
      </span>
    </p>
  );
}

// ---------- Диалоги: единый inbox всех каналов ----------

export function Inbox() {
  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [stage, setStage] = useState(-1); // этап пути сообщения, -1 — тишина
  const [done, setDone] = useState<Set<number>>(new Set());
  const [run, setRun] = useState({ from: 0, n: 0 });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      let idx = run.from;
      while (alive) {
        const thread = THREADS[idx];
        setActive(idx);
        setShown(0);
        setStage(-1);
        await wait(700);
        for (let i = 0; i < thread.lines.length && alive; i++) {
          if (thread.lines[i].from === "agent") {
            // сообщение гостя проходит вебхук → очередь → агента, затем уходит ответ
            for (let s = 0; s < 3 && alive; s++) {
              setStage(s);
              await wait(620);
            }
            if (!alive) return;
            setStage(3);
          }
          setShown(i + 1);
          await wait(thread.lines[i].from === "agent" ? 2300 : 900);
          setStage(-1);
        }
        if (!alive) return;
        setDone((d) => new Set(d).add(idx));
        await wait(3400);
        idx = (idx + 1) % THREADS.length;
      }
    })();
    return () => {
      alive = false;
    };
  }, [run]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [shown, stage]);

  const thread = THREADS[active];

  return (
    <Card className="p-0">
      <div className="grid md:grid-cols-[250px_minmax(0,1fr)]">
        <ul className="flex gap-2 overflow-x-auto border-b border-black/[0.06] p-3 [scrollbar-width:none] md:block md:space-y-1 md:border-b-0 md:border-r md:p-3">
          {THREADS.map((t, i) => (
            <li key={t.id} className="shrink-0">
              <button
                onClick={() => setRun({ from: i, n: run.n + 1 })}
                className={`w-full rounded-2xl px-3.5 py-2.5 text-left transition ${i === active ? "bg-white/70 shadow-[0_2px_12px_rgba(60,40,20,0.08)]" : "hover:bg-white/40"}`}
              >
                <div className="flex items-center gap-2 text-[15px] text-ink">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${CHAN[t.channel].dot}`} />
                  <span className="truncate">{t.guest}</span>
                </div>
                <div className="mt-0.5 whitespace-nowrap text-[13px] text-muted-200">
                  {CHAN[t.channel].label} · {t.location}
                </div>
                {done.has(i) && (
                  <div className={`chip mt-1.5 ${t.human ? "bg-[#F6E9CC] text-[#6E5210]" : "bg-[#EBDCCD] text-[#5F4027]"}`}>{t.outcome}</div>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex min-h-[430px] flex-col">
          {/* путь сообщения через систему */}
          <div className="flex items-center gap-2 border-b border-black/[0.06] px-5 py-3.5">
            {PIPELINE.map((name, s) => (
              <div key={name} className="flex flex-1 items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-300 ${
                    stage === s ? "scale-150 bg-bronze shadow-[0_0_0_5px_rgba(164,113,72,0.18)]" : stage > s ? "bg-bronze/70" : "bg-black/15"
                  }`}
                />
                <span className={`text-[13px] transition-colors ${stage === s ? "font-medium text-ink" : "text-muted-300"}`}>{name}</span>
                {s < PIPELINE.length - 1 && <span className={`h-px flex-1 transition-colors ${stage > s ? "bg-bronze/60" : "bg-black/10"}`} />}
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-5">
            {thread.lines.slice(0, shown).map((line, i) => (
              <div key={`${thread.id}-${i}`} className={`flex animate-fade-in ${line.from === "guest" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[84%] rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed ${
                    line.from === "guest" ? "rounded-bl-lg bg-white/75 text-ink" : "rounded-br-lg bg-bronze/90 text-white"
                  }`}
                >
                  {line.text}
                </div>
              </div>
            ))}
            {stage >= 0 && stage < 3 && (
              <div className="flex justify-end">
                <div className="flex gap-1 rounded-3xl rounded-br-lg bg-bronze/25 px-4 py-3.5">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-bronze" style={{ animationDelay: `${d * 140}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-black/[0.06] px-5 py-3 text-[13px] text-muted-200">
            <span className="flex items-center gap-2">
              <Live />
              {CHAN[thread.channel].label} · {thread.location}
            </span>
            <span>{done.has(active) ? thread.outcome : "идёт диалог"}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------- Звонки: запись, расшифровка, оценка ----------

export function Calls() {
  const [idx, setIdx] = useState(0);
  const [lines, setLines] = useState(0);
  const [phase, setPhase] = useState<"talk" | "score">("talk");
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      let i = 0;
      while (alive) {
        const call = CALLS[i];
        setIdx(i);
        setLines(0);
        setPhase("talk");
        setSeconds(0);
        setScore(0);
        await wait(900);
        for (let n = 1; n <= call.lines.length && alive; n++) {
          setLines(n);
          await wait(2100);
        }
        if (!alive) return;
        setPhase("score");
        // оценка «набегает» до итогового значения
        for (let step = 1; step <= 20 && alive; step++) {
          setScore((call.total * step) / 20);
          await wait(45);
        }
        await wait(6500);
        i = (i + 1) % CALLS.length;
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "talk") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase, idx]);

  const call = CALLS[idx];
  const good = call.total >= 7;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Live />
          <div>
            <div className="text-[17px] text-ink">
              {call.employee} <span className="text-muted-200">· {call.role}, {call.location}</span>
            </div>
            <div className="text-[13px] text-muted-200">{phase === "talk" ? "идёт звонок, запись с уведомлением" : `звонок завершён · ${call.duration}`}</div>
          </div>
        </div>
        {phase === "talk" ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 items-center gap-[3px]" aria-hidden>
              {Array.from({ length: 22 }, (_, b) => (
                <span key={b} className="w-[3px] origin-center rounded-full bg-bronze/70 [animation:wave_0.9s_ease-in-out_infinite]" style={{ height: "100%", animationDelay: `${(b * 97) % 900}ms` }} />
              ))}
            </div>
            <span className="font-display text-2xl tabular-nums text-ink">
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
        ) : (
          <div className="text-right">
            <div className={`font-display text-[2.6rem] leading-none tabular-nums ${good ? "text-ink" : "text-felt"}`}>{score.toFixed(1).replace(".", ",")}</div>
            <div className="text-[13px] text-muted-200">оценка из 10</div>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {call.lines.slice(0, lines).map((l, i) => (
          <div key={`${call.id}-${i}`} className="flex animate-fade-in gap-3 text-[15px] leading-relaxed">
            <span className={`w-[5.5rem] shrink-0 text-[13px] ${l.who === "Гость" ? "text-muted-200" : "text-bronze-dark"}`}>{l.who}</span>
            <span className="text-ink">{l.text}</span>
          </div>
        ))}
      </div>

      {phase === "score" && (
        <div className="mt-6 animate-rise border-t border-black/[0.06] pt-5">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {call.criteria.map((c) => (
              <div key={c.name}>
                <div className="mb-1.5 flex justify-between text-[15px]">
                  <span className="text-ink">{c.name}</span>
                  <span className="text-muted-200">{c.score}</span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
                  <span className={`block h-full origin-left rounded-full [animation:grow_0.9s_cubic-bezier(.2,.7,.2,1)_both] ${c.score >= 7 ? "bg-bronze" : "bg-felt/70"}`} style={{ width: `${c.score * 10}%` }} />
                </span>
              </div>
            ))}
          </div>
          {call.flag && <div className="chip mt-5 bg-[#F3D5CB] text-[#8A2E17]">{call.flag} → управляющему</div>}
          <ul className="mt-4 space-y-1.5 text-[15px] text-ink/80">
            {call.tips.map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-bronze" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-6 divide-y divide-black/[0.06] border-t border-black/[0.06]">
        {RECENT_CALLS.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-[15px]">
            <span className="w-12 tabular-nums text-muted-200">{r.when}</span>
            <span className="min-w-[150px] flex-1 text-ink">{r.employee}</span>
            <span className="text-muted-200">
              {r.location} · {r.duration}
            </span>
            <span className="text-muted-200">{r.result}</span>
            <span className={`chip tabular-nums ${r.score >= 7 ? "bg-[#EBDCCD] text-[#5F4027]" : "bg-[#F3D5CB] text-[#8A2E17]"}`}>{r.score.toFixed(1).replace(".", ",")}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------- Качество сервиса: рейтинг сотрудников ----------

export function Quality() {
  return (
    <Card>
      <div className="label-kicker mb-5">Рейтинг за неделю</div>
      <ul className="space-y-5">
        {RATING.map((r, i) => (
          <li key={r.name}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="text-[17px] text-ink">
                {r.name} <span className="text-[15px] text-muted-200">· {r.role}</span>
              </span>
              <span className="flex items-baseline gap-3 text-[15px] text-muted-200">
                <span>{r.calls} звонков</span>
                {r.conversion !== undefined && <span>в бронь {r.conversion}%</span>}
                <span className={r.trend >= 0 ? "text-bronze-dark" : "text-felt"}>
                  {r.trend >= 0 ? "+" : "−"}
                  {Math.abs(r.trend).toFixed(1).replace(".", ",")}
                </span>
                <span className={`font-display text-2xl tabular-nums ${r.score >= 7 ? "text-ink" : "text-felt"}`}>{r.score.toFixed(1).replace(".", ",")}</span>
              </span>
            </div>
            <span className="block h-2 overflow-hidden rounded-full bg-black/[0.07]">
              <span
                className={`block h-full origin-left rounded-full [animation:grow_1.1s_cubic-bezier(.2,.7,.2,1)_both] ${r.score >= 7 ? "bg-bronze" : "bg-felt/70"}`}
                style={{ width: `${r.score * 10}%`, animationDelay: `${i * 140}ms` }}
              />
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-5">
        <span className="chip bg-[#F3D5CB] text-[#8A2E17]">Критично</span>
        <span className="text-[15px] text-ink">Тимур: отказ без альтернативы, 3 упущенные брони за неделю</span>
      </div>
    </Card>
  );
}

// ---------- Устройства и тревоги ----------

export function Devices() {
  const [tick, setTick] = useState(0);
  const [events, setEvents] = useState<(DeviceEvent & { time: string; key: number })[]>([]);
  const [alert, setAlert] = useState<"none" | "open" | "escalated" | "acked">("none");

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      let n = 0;
      await wait(900);
      while (alive) {
        const e = DEVICE_EVENTS[n % DEVICE_EVENTS.length];
        setEvents((list) => [{ ...e, time: clock(), key: n }, ...list].slice(0, 6));
        n += 1;
        if (n === 3) setAlert((a) => (a === "none" ? "open" : a));
        if (n === 7) setAlert((a) => (a === "open" ? "escalated" : a));
        await wait(3400);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // показания датчиков слегка «дышат» вокруг своего значения
  const reading = (base: number, jitter: number, seed: number) => {
    const v = base + Math.sin(tick * 1.3 + seed) * jitter;
    return jitter < 1 ? v.toFixed(1).replace(".", ",") : String(Math.round(v));
  };

  return (
    <div className="grid animate-rise gap-3">
      {alert !== "none" && (
        <div className={`card flex flex-wrap items-center gap-x-5 gap-y-3 py-5 ${alert === "acked" ? "" : "border-felt/40 bg-[#FBEDE8]/80"}`}>
          {alert !== "acked" && (
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-felt opacity-70" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-felt" />
            </span>
          )}
          <div className="min-w-[200px] flex-1">
            <div className="text-[17px] text-ink">{ALERT.text}</div>
            <div className="text-[15px] text-muted-200">
              {ALERT.site} · {ALERT.time}
              {alert === "escalated" && " · никто не подтвердил, ушло управляющему"}
              {alert === "acked" && " · подтверждено"}
            </div>
          </div>
          {alert !== "acked" && (
            <button className="btn-primary" onClick={() => setAlert("acked")}>
              <Check size={16} />
              Подтвердить
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {SITES.map((s, si) => (
          <div key={s.name} className="card p-6">
            <div className="flex items-center justify-between text-[17px] text-ink">
              {s.name}
              <Live />
            </div>
            <div className="figure mt-5">
              {s.cameras[0]}
              <span className="text-muted-300">/{s.cameras[1]}</span>
            </div>
            <div className="label-kicker mt-2">камер на связи</div>
            <dl className="mt-5 space-y-1.5 text-[15px]">
              {s.sensors.map((sensor, i) => (
                <div key={sensor.name} className="flex justify-between gap-3">
                  <dt className="text-muted-200">{sensor.name}</dt>
                  <dd className="tabular-nums text-ink">
                    {reading(sensor.value, sensor.jitter, si * 3 + i)} {sensor.unit}
                  </dd>
                </div>
              ))}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-200">Двери</dt>
                <dd className="text-ink">{s.door}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="card py-4">
        <ul className="divide-y divide-black/[0.06]">
          {events.map((e) => (
            <li key={e.key} className="flex animate-fade-in items-center gap-4 py-3 text-[15px]">
              <span className="w-12 tabular-nums text-muted-200">{e.time}</span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${e.level === "warning" ? "bg-[#D9B45C]" : "bg-bronze/50"}`} />
              <span className="min-w-0 flex-1 text-ink">{e.text}</span>
              <span className="shrink-0 text-muted-200">{e.site}</span>
            </li>
          ))}
          {events.length === 0 && <li className="py-3 text-[15px] text-muted-200">Ждём события…</li>}
        </ul>
      </div>
    </div>
  );
}
