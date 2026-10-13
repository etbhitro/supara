"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { NoAccess } from "@/components/DataShell";
import { AGENT_NAME, adviceFor, funnel, morningReport, salesQueue, summarize, type Advice } from "@/lib/agents";
import { addDays, formatDay, formatRange, formatSom, fromISO, isWeekend, todayISO } from "@/lib/format";
import { shortDate, useMarket } from "@/lib/market";
import { useStore } from "@/lib/store";

const TONE: Record<Advice["tone"], string> = {
  money: "bg-accent-500",
  warn: "bg-felt",
  idea: "bg-sky-400",
};

const DAYS = 14;

// Главный экран — сводки. Сама шахматка живёт в «Бронях».
export default function OverviewPage() {
  const { state, update } = useStore();
  const market = useMarket();
  if (state.role === "staff") return <NoAccess what="Обзор" />;

  const s = summarize(state);
  // Финансы видят только владелец и управляющий (ТЗ 4.6).
  const showMoney = state.role === "owner" || state.role === "manager";
  const today = todayISO();
  const advice = adviceFor(state).filter((a) => showMoney || a.tone !== "money");
  const requests = salesQueue(state).filter((i) => i.kind === "request");
  const f = funnel(state);
  const tasks = state.tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  const active = state.bookings.filter((b) => b.status !== "cancelled" && b.status !== "request");
  const load = Array.from({ length: DAYS }, (_, i) => {
    const day = addDays(today, i);
    return { day, busy: active.filter((b) => b.from <= day && day < b.to).length };
  });

  const stats = [
    { label: "Занято", value: `${s.occupiedToday}/${s.total}` },
    { label: "Загрузка, 7 дней", value: `${Math.round(s.occupancyWeek * 100)}%` },
    ...(showMoney
      ? [
          { label: "Оплачено", value: formatSom(s.paidTotal) },
          { label: "К доплате", value: formatSom(s.dueTotal) },
          { label: "Средний чек", value: formatSom(f.avgCheck) },
        ]
      : [
          { label: "Заезды", value: String(s.arrivals.length) },
          { label: "Выезды", value: String(s.departures.length) },
        ]),
    { label: "Конверсия", value: `${Math.round(f.conversion * 100)}%` },
  ];

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((st) => (
          <div key={st.label} className="card py-4">
            <div className="label-kicker">{st.label}</div>
            <div className="mt-1.5 text-xl font-extrabold tracking-tight text-stone-50 xl:text-2xl">{st.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Panel title="Загрузка, 14 дней" href="/bookings/">
          <div className="flex h-32 items-end gap-1.5">
            {load.map(({ day, busy }) => (
              <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-bold text-muted-100">{busy || ""}</span>
                <span
                  className={`w-full rounded-t-md ${isWeekend(day) ? "bg-accent-500" : "bg-accent-700"}`}
                  style={{ height: `${Math.max(3, (busy / Math.max(1, s.total)) * 100)}%` }}
                />
                <span className={`text-[10px] ${day === today ? "font-extrabold text-accent-300" : "text-muted-300"}`}>{fromISO(day).getDate()}</span>
              </div>
            ))}
          </div>
        </Panel>

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

        <Panel title="Сводка">
          <div className="whitespace-pre-line text-sm leading-relaxed text-stone-100">{morningReport(state, showMoney)}</div>
        </Panel>

        <Panel title="Заявки" href="/bookings/">
          {requests.length === 0 ? (
            <Empty>Новых нет</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {requests.map((i) => (
                <li key={i.booking.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate">
                    <b className="text-stone-50">{i.guest}</b> · {i.unit}
                  </span>
                  <span className="shrink-0 text-xs text-muted-100">{formatRange(i.booking.from, i.booking.to)}</span>
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

        <Panel title="Сотрудники" href={showMoney ? "/agents/" : undefined}>
          <ul className="space-y-2.5 text-sm">
            {state.logs.slice(0, 5).map((l) => (
              <li key={l.id}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-accent-400">
                  {AGENT_NAME[l.agent]} · {new Date(l.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="text-stone-100">{l.text}</div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Рынок" href={showMoney ? "/agents/" : undefined}>
            {!market || market.items.length === 0 ? (
              <Empty>Пусто</Empty>
            ) : (
              <ul className="space-y-2">
                {market.items.slice(0, 5).map((i) => (
                  <li key={i.url} className="flex items-baseline justify-between gap-3 text-sm">
                    <a href={i.url} target="_blank" rel="noopener" className="min-w-0 truncate font-semibold text-stone-100 hover:text-accent-300">
                      {i.title}
                    </a>
                    <span className="shrink-0 text-[11px] text-muted-200">
                      {i.source} · {shortDate(i.date)}
                    </span>
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
    <section className="card h-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="label-kicker">{title}</h2>
        {href && (
          <Link href={href} className="text-[11px] font-bold text-accent-400 hover:text-accent-300">
            Открыть →
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
