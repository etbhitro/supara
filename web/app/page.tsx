"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { NoAccess } from "@/components/DataShell";
import { morningReport, summarize } from "@/lib/agents";
import { formatDay, formatSom, todayISO } from "@/lib/format";
import { useStore } from "@/lib/store";

const LOCATIONS = [
  { name: "Супара-Чункурчак", note: "Проживание: юрты, бешики, земляной домик", live: true },
  { name: "Этно-комплекс «Супара»", note: "Ресторан в юртах, музей", live: false },
  { name: "Супара Талкан", note: "Производство и продажа конфет", live: false },
];

export default function OverviewPage() {
  const { state } = useStore();
  if (state.role === "staff") return <NoAccess what="Обзор" />;

  const s = summarize(state);
  // Финансы видят только владелец и управляющий (ТЗ 4.6).
  const showMoney = state.role === "owner" || state.role === "manager";
  const today = todayISO();
  const overdue = state.tasks.filter((t) => !t.done && t.due < today);

  return (
    <>
      <PageHeader title="Обзор" subtitle={`Сегодня ${formatDay(today)}`} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {LOCATIONS.map((l) => (
          <div key={l.name} className={`card ${l.live ? "border-accent/40" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="card-title">{l.name}</div>
              <span className={`chip ${l.live ? "bg-accent/20 text-accent-300" : "bg-white/10 text-muted-200"}`}>
                {l.live ? "В демо" : "Следующий шаг"}
              </span>
            </div>
            <div className="mt-1.5 text-xs text-muted-200">{l.note}</div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Занято сегодня" value={`${s.occupiedToday} из ${s.total}`} />
        <Stat label="Загрузка на 7 дней" value={`${Math.round(s.occupancyWeek * 100)}%`} />
        {showMoney ? (
          <>
            <Stat label="Получено оплат" value={formatSom(s.paidTotal)} small />
            <Stat label="Ждём доплат" value={formatSom(s.dueTotal)} small />
          </>
        ) : (
          <>
            <Stat label="Заездов сегодня" value={String(s.arrivals.length)} />
            <Stat label="Выездов сегодня" value={String(s.departures.length)} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="card-title">Утренний отчёт</div>
            <span className="chip bg-white/10 text-muted-100">Агент-аналитик</span>
          </div>
          <div className="whitespace-pre-line rounded-xl bg-ink-700 px-4 py-3 text-sm leading-relaxed text-stone-100">
            {morningReport(state, showMoney)}
          </div>
          <div className="mt-2 text-xs text-muted-300">Такой отчёт владелец будет получать в Telegram каждое утро.</div>
        </div>

        <div className="grid gap-4">
          <div className="card">
            <div className="card-title mb-3">Заезды и выезды сегодня</div>
            {s.arrivals.length === 0 && s.departures.length === 0 && <div className="text-sm text-muted-200">Сегодня без движения.</div>}
            <ul className="space-y-2 text-sm">
              {s.arrivals.map((a) => (
                <li key={`in-${a.unit}`} className="flex items-center justify-between gap-3">
                  <span>
                    <b className="text-stone-50">{a.unit}</b> · {a.guest}, {a.people} чел.
                  </span>
                  <span className="chip bg-emerald-500/15 text-emerald-300">Заезд</span>
                </li>
              ))}
              {s.departures.map((d) => (
                <li key={`out-${d.unit}`} className="flex items-center justify-between gap-3">
                  <span>
                    <b className="text-stone-50">{d.unit}</b> · {d.guest}
                  </span>
                  <span className="chip bg-sky-500/15 text-sky-300">Выезд</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="card-title mb-3">Требует внимания</div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Заявки без подтверждения</span>
                <Link href="/bookings/" className={`chip ${s.requests ? "bg-accent/20 text-accent-300" : "bg-white/10 text-muted-200"}`}>
                  {s.requests}
                </Link>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Просроченные задачи</span>
                <Link href="/tasks/" className={`chip ${overdue.length ? "bg-felt/30 text-red-200" : "bg-white/10 text-muted-200"}`}>
                  {overdue.length}
                </Link>
              </li>
            </ul>
            {overdue.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-white/10 pt-3 text-xs text-muted-100">
                {overdue.map((t) => (
                  <li key={t.id}>
                    {t.title} · {t.assignee}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="card">
      <div className="label-kicker mb-2">{label}</div>
      <div className={small ? "text-xl font-extrabold tracking-tight text-stone-50" : "stat-value"}>{value}</div>
    </div>
  );
}
