"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { BookingBoard } from "@/components/BookingBoard";
import { NoAccess } from "@/components/DataShell";
import { adviceFor, summarize, type Advice } from "@/lib/agents";
import { formatDay, formatSom, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

const BASE = process.env.NEXT_PUBLIC_BASE ?? "";

const TONE: Record<Advice["tone"], string> = {
  money: "bg-accent-500",
  warn: "bg-felt",
  idea: "bg-sky-400",
};

// Главный экран: всё, что нужно владельцу, видно без переходов.
export default function OverviewPage() {
  const { state, update } = useStore();
  if (state.role === "staff") return <NoAccess what="Обзор" />;

  const s = summarize(state);
  // Финансы видят только владелец и управляющий (ТЗ 4.6).
  const showMoney = state.role === "owner" || state.role === "manager";
  const today = todayISO();
  const advice = adviceFor(state).filter((a) => showMoney || a.tone !== "money");
  const tasks = state.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  const stats = [
    { label: "Занято", value: `${s.occupiedToday}/${s.total}` },
    { label: "Загрузка, 7 дней", value: `${Math.round(s.occupancyWeek * 100)}%` },
    ...(showMoney
      ? [
          { label: "Оплачено", value: formatSom(s.paidTotal) },
          { label: "К доплате", value: formatSom(s.dueTotal) },
        ]
      : [
          { label: "Заезды", value: String(s.arrivals.length) },
          { label: "Выезды", value: String(s.departures.length) },
        ]),
  ];

  return (
    <>
      <div className="relative isolate mb-5 overflow-hidden rounded-3xl border border-white/10">
        <img
          src={`${BASE}/img/chunkurchak.jpg`}
          srcSet={`${BASE}/img/chunkurchak-960.jpg 960w, ${BASE}/img/chunkurchak.jpg 1920w`}
          sizes="(min-width: 768px) 80vw, 100vw"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/40" />
        <div className="px-5 pb-5 pt-6 md:px-7 md:pb-7 md:pt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-50 md:text-3xl">Супара-Чункурчак</h1>
            <span className="text-sm font-semibold text-stone-200">{formatDay(today)}</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            {stats.map((st) => (
              <div key={st.label}>
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-stone-300">{st.label}</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight text-stone-50 md:text-[2rem]">{st.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <BookingBoard />
        </div>

        <div className="grid content-start gap-4 md:grid-cols-3 xl:grid-cols-1">
          <Panel title="Агент советует">
            {advice.length === 0 ? (
              <Empty>Всё по плану</Empty>
            ) : (
              <ul className="space-y-3">
                {advice.map((a) => (
                  <li key={a.title} className="flex gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE[a.tone]}`} />
                    <div>
                      <div className="text-sm font-bold leading-snug text-stone-50">{a.title}</div>
                      <div className="text-xs leading-snug text-muted-100">{a.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Сегодня">
            {s.arrivals.length === 0 && s.departures.length === 0 ? (
              <Empty>Без заездов и выездов</Empty>
            ) : (
              <ul className="space-y-2 text-sm">
                {s.arrivals.map((a) => (
                  <li key={`in-${a.unit}`} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      <b className="text-stone-50">{a.unit}</b> · {a.guest}
                    </span>
                    <span className="chip bg-emerald-500/15 text-emerald-300">Заезд</span>
                  </li>
                ))}
                {s.departures.map((d) => (
                  <li key={`out-${d.unit}`} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      <b className="text-stone-50">{d.unit}</b> · {d.guest}
                    </span>
                    <span className="chip bg-sky-500/15 text-sky-300">Выезд</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Задачи" href="/tasks/">
            {tasks.length === 0 ? (
              <Empty>Все выполнены</Empty>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2.5">
                    <button
                      onClick={() => update((st) => ({ ...st, tasks: st.tasks.map((x) => (x.id === t.id ? { ...x, done: true } : x)) }))}
                      aria-label="Отметить выполненной"
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-white/25 text-transparent transition hover:border-accent hover:text-accent"
                    >
                      <Check size={12} />
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm leading-snug text-stone-100">{t.title}</div>
                      <div className={`text-[11px] ${t.due < today ? "font-bold text-red-300" : "text-muted-300"}`}>
                        {t.assignee} · {t.due < today ? "просрочено" : formatDay(t.due)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Panel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label-kicker">{title}</h2>
        {href && (
          <Link href={href} className="text-[11px] font-bold text-accent-400 hover:text-accent-300">
            Все →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-muted-200">{children}</div>;
}
