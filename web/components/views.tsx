"use client";

// Карточки, которые координатор разворачивает в ответ. Каждая читает живые данные,
// поэтому старые ответы в разговоре не устаревают.

import { createContext, useContext, useState } from "react";
import { ArrowUpRight, Check, Send } from "lucide-react";
import { BookingBoard, NewBookingDialog, type Draft } from "@/components/BookingBoard";
import {
  AGENTS,
  adviceFor,
  assignCalls,
  funnel,
  guestBotReply,
  operationsRound,
  prepareCampaign,
  prepareReminder,
  salesQueue,
  sourceStats,
  summarize,
} from "@/lib/agents";
import { addDays, formatDay, formatRange, formatSom, fromISO, isWeekend, nightsBetween, todayISO } from "@/lib/format";
import { shortDate, useMarket } from "@/lib/market";
import { freeUnits, setStatus, uid, useStore, type AgentId, type View } from "@/lib/store";

// Карточка может задать координатору следующий вопрос (например, плитка сотрудника).
export const AskContext = createContext<(text: string) => void>(() => {});

export function ViewCard({ view }: { view: View }) {
  switch (view.kind) {
    case "summary":
      return <Summary />;
    case "board":
      return (
        <Card>
          <BookingBoard />
        </Card>
      );
    case "requests":
      return <Requests />;
    case "tasks":
      return <Tasks />;
    case "money":
      return <Money />;
    case "free":
      return <Free from={view.from} to={view.to} />;
    case "team":
      return <Team />;
    case "funnel":
      return <FunnelView />;
    case "marketing":
      return <Marketing />;
    case "market":
      return <MarketView />;
    case "sales":
      return <Sales />;
    case "advice":
      return <AdviceView />;
    case "guests":
      return <Guests />;
    case "guestbot":
      return <GuestBot />;
  }
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card animate-rise ${className}`}>{children}</div>;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="figure">{value}</div>
      <div className="label-kicker mt-2">{label}</div>
    </div>
  );
}

function Rows({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-white/[0.06]">{children}</ul>;
}

function Summary() {
  const { state } = useStore();
  const s = summarize(state);
  const today = todayISO();
  const active = state.bookings.filter((b) => b.status !== "cancelled" && b.status !== "request");
  const load = Array.from({ length: 14 }, (_, i) => {
    const day = addDays(today, i);
    return { day, busy: active.filter((b) => b.from <= day && day < b.to).length };
  });
  const moves = [
    ...s.arrivals.map((a) => ({ key: `in-${a.unit}`, unit: a.unit, guest: a.guest, kind: "Заезд" })),
    ...s.departures.map((d) => ({ key: `out-${d.unit}`, unit: d.unit, guest: d.guest, kind: "Выезд" })),
  ];

  return (
    <Card>
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
        <Figure label="занято сегодня" value={`${s.occupiedToday}/${s.total}`} />
        <Figure label="загрузка, 7 дней" value={`${Math.round(s.occupancyWeek * 100)}%`} />
        <Figure label="оплачено, сом" value={Math.round(s.paidTotal).toLocaleString("ru-RU")} />
        <Figure label="к доплате, сом" value={Math.round(s.dueTotal).toLocaleString("ru-RU")} />
      </div>

      <div className="mt-8 flex h-20 items-end gap-1.5">
        {load.map(({ day, busy }) => (
          <div key={day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span
              className={`w-full rounded-md ${busy ? (isWeekend(day) ? "bg-accent" : "bg-stone-400") : "bg-white/10"}`}
              style={{ height: `${Math.max(6, (busy / Math.max(1, s.total)) * 100)}%` }}
            />
            <span className={`text-[10px] ${day === today ? "font-semibold text-stone-50" : "text-muted-300"}`}>{fromISO(day).getDate()}</span>
          </div>
        ))}
      </div>

      {moves.length > 0 && (
        <div className="mt-6 border-t border-white/[0.06] pt-2">
          <Rows>
            {moves.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 py-3 text-[15px]">
                <span className="min-w-0 truncate text-stone-100">
                  {m.unit} <span className="text-muted-200">· {m.guest}</span>
                </span>
                <span className="text-sm text-muted-200">{m.kind}</span>
              </li>
            ))}
          </Rows>
        </div>
      )}
    </Card>
  );
}

function Requests() {
  const { state, update } = useStore();
  const items = salesQueue(state).filter((i) => i.kind === "request");
  if (items.length === 0) return null;
  return (
    <Card className="py-3">
      <Rows>
        {items.map((i) => (
          <li key={i.booking.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
            <div className="min-w-[160px] flex-1">
              <div className="text-[15px] text-stone-50">{i.guest}</div>
              <div className="text-sm text-muted-200">
                {i.unit} · {formatRange(i.booking.from, i.booking.to)} · {formatSom(i.booking.total)}
              </div>
            </div>
            <button className="btn-ghost" onClick={() => update((s) => setStatus(s, i.booking.id, "cancelled"))}>
              Отклонить
            </button>
            <button className="btn-primary" onClick={() => update((s) => setStatus(s, i.booking.id, "confirmed"))}>
              Подтвердить
            </button>
          </li>
        ))}
      </Rows>
    </Card>
  );
}

function Tasks() {
  const { state, update } = useStore();
  const today = todayISO();
  const open = state.tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Card className="py-3">
      <Rows>
        {open.map((t) => (
          <li key={t.id} className="flex items-center gap-3.5 py-3.5">
            <button
              onClick={() => update((s) => ({ ...s, tasks: s.tasks.map((x) => (x.id === t.id ? { ...x, done: true } : x)) }))}
              aria-label="Отметить выполненной"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-white/25 text-transparent transition hover:bg-stone-50 hover:text-ink-900"
            >
              <Check size={13} strokeWidth={3} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] text-stone-50">{t.title}</div>
              <div className="text-sm text-muted-200">{t.assignee}</div>
            </div>
            <span className={`text-sm ${t.due < today ? "text-felt" : "text-muted-200"}`}>{t.due < today ? "просрочено" : formatDay(t.due)}</span>
          </li>
        ))}
        {open.length === 0 && <li className="py-3.5 text-[15px] text-muted-200">Все задачи выполнены</li>}
      </Rows>
      <div className="flex justify-end border-t border-white/[0.06] pt-3">
        <button className="btn-ghost" onClick={() => update(operationsRound)}>
          Сделать обход
        </button>
      </div>
    </Card>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; note: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[15px]">
            <span className="text-stone-100">{r.label}</span>
            <span className="text-muted-200">{r.note}</span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <span className="block h-full rounded-full bg-stone-200" style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Money() {
  const { state } = useStore();
  const s = summarize(state);
  const f = funnel(state);
  const rows = sourceStats(state).filter((r) => r.revenue > 0);
  return (
    <Card>
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
        <Figure label="оплачено, сом" value={Math.round(s.paidTotal).toLocaleString("ru-RU")} />
        <Figure label="к доплате, сом" value={Math.round(s.dueTotal).toLocaleString("ru-RU")} />
        <Figure label="средний чек, сом" value={Math.round(f.avgCheck).toLocaleString("ru-RU")} />
      </div>
      <div className="mt-8">
        <Bars rows={rows.map((r) => ({ label: r.source, value: r.revenue, note: formatSom(r.revenue) }))} />
      </div>
    </Card>
  );
}

function Free({ from, to }: { from: string; to: string }) {
  const { state } = useStore();
  const [draft, setDraft] = useState<Draft | null>(null);
  const nights = nightsBetween(from, to);
  const free = freeUnits(state, from, to);
  const kinds = [...new Set(free.map((u) => u.kind))];
  if (free.length === 0) return null;
  return (
    <Card className="py-3">
      <Rows>
        {kinds.map((kind) => {
          const units = free.filter((u) => u.kind === kind);
          const unit = units[0];
          return (
            <li key={kind} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
              <div className="min-w-[160px] flex-1">
                <div className="text-[15px] text-stone-50">{kind}</div>
                <div className="text-sm text-muted-200">
                  свободно {units.length} · до {unit.capacity} гостей · {formatSom(unit.price * nights)}
                </div>
              </div>
              <button className="btn-primary" onClick={() => setDraft({ unitId: unit.id, from, to })}>
                Забронировать
              </button>
            </li>
          );
        })}
      </Rows>
      {draft && <NewBookingDialog draft={draft} onClose={() => setDraft(null)} />}
    </Card>
  );
}

function Team() {
  const ask = useContext(AskContext);
  const { state } = useStore();
  const market = useMarket();
  const load: Record<AgentId, string> = {
    coordinator: "на связи",
    guest_admin: `${state.chat.filter((m) => m.from === "guest").length} сообщений`,
    sales: `${salesQueue(state).filter((i) => !i.reminded).length} в работе`,
    rop: `конверсия ${Math.round(funnel(state).conversion * 100)}%`,
    marketer: `${state.campaigns.length} акций`,
    parser: `${market?.items.length ?? 0} находок`,
    operations: `${state.tasks.filter((t) => !t.done).length} задач`,
    analyst: `${adviceFor(state).length} советов`,
  };
  return (
    <div className="grid animate-rise grid-cols-2 gap-2.5 sm:grid-cols-4">
      {AGENTS.map((a) => (
        <button
          key={a.id}
          disabled={a.id === "coordinator"}
          onClick={() => ask(a.name)}
          className="group rounded-3xl bg-ink-800 p-4 text-left ring-1 ring-inset ring-white/[0.06] transition enabled:hover:bg-ink-700"
        >
          <div className="flex items-center justify-between">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <ArrowUpRight size={15} className="text-muted-400 transition group-enabled:group-hover:text-stone-50" />
          </div>
          <div className="mt-5 text-[15px] text-stone-50">{a.name}</div>
          <div className="mt-0.5 text-sm text-muted-200">{load[a.id]}</div>
        </button>
      ))}
    </div>
  );
}

function FunnelView() {
  const { state, update } = useStore();
  const f = funnel(state);
  return (
    <Card>
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
        <Figure label="конверсия" value={`${Math.round(f.conversion * 100)}%`} />
        <Figure label="средний чек, сом" value={Math.round(f.avgCheck).toLocaleString("ru-RU")} />
        <Figure label="долг, сом" value={Math.round(f.debt).toLocaleString("ru-RU")} />
      </div>
      <div className="mt-8">
        <Bars rows={f.stages.map((st) => ({ label: st.label, value: st.count, note: String(st.count) }))} />
      </div>
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={() => update(assignCalls)}>
          Раздать звонки администратору
        </button>
      </div>
    </Card>
  );
}

function Marketing() {
  const { state, update } = useStore();
  const rows = sourceStats(state);
  return (
    <Card>
      <Bars
        rows={rows.map((r) => ({
          label: r.source,
          value: r.revenue,
          note: `${r.bookings + r.requests} · ${formatSom(r.revenue)}`,
        }))}
      />
      {state.campaigns.map((c) => (
        <div key={c.id} className="mt-6 rounded-2xl bg-ink-700 p-4">
          <div className="flex items-baseline justify-between gap-3 text-sm text-muted-200">
            <span>{c.title}</span>
            <span>получателей: {c.audience}</span>
          </div>
          <div className="mt-2 text-[15px] leading-relaxed text-stone-100">{c.text}</div>
        </div>
      ))}
      <div className="mt-6 flex justify-end">
        <button className="btn-primary" onClick={() => update(prepareCampaign)}>
          Подготовить акцию
        </button>
      </div>
    </Card>
  );
}

function MarketView() {
  const market = useMarket();
  if (!market || market.items.length === 0) return null;
  return (
    <Card className="py-3">
      <Rows>
        {market.items.slice(0, 8).map((i) => (
          <li key={i.url}>
            <a href={i.url} target="_blank" rel="noopener" className="group flex items-start justify-between gap-4 py-3.5">
              <span className="min-w-0">
                <span className="block text-[15px] text-stone-50 group-hover:text-accent">{i.title}</span>
                <span className="text-sm text-muted-200">
                  {i.source} · {shortDate(i.date)}
                </span>
              </span>
              <ArrowUpRight size={16} className="mt-1 shrink-0 text-muted-400 group-hover:text-accent" />
            </a>
          </li>
        ))}
      </Rows>
    </Card>
  );
}

function Sales() {
  const { state, update } = useStore();
  const queue = salesQueue(state);
  return (
    <Card className="py-3">
      <Rows>
        {queue.map((i) => {
          const message = state.reminders.find((r) => r.bookingId === i.booking.id);
          return (
            <li key={i.booking.id} className="py-3.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="min-w-[160px] flex-1">
                  <div className="text-[15px] text-stone-50">{i.guest}</div>
                  <div className="text-sm text-muted-200">
                    {i.unit} · {formatRange(i.booking.from, i.booking.to)} · {i.kind === "request" ? "заявка" : `долг ${formatSom(i.due)}`}
                  </div>
                </div>
                {!message && (
                  <button className="btn-ghost" onClick={() => update((s) => prepareReminder(s, i.booking.id))}>
                    Напомнить
                  </button>
                )}
              </div>
              {message && <div className="mt-3 rounded-2xl bg-ink-700 p-4 text-[15px] leading-relaxed text-stone-100">{message.text}</div>}
            </li>
          );
        })}
      </Rows>
      {queue.some((i) => !i.reminded) && (
        <div className="flex justify-end border-t border-white/[0.06] pt-3">
          <button className="btn-primary" onClick={() => update((s) => salesQueue(s).reduce((acc, i) => prepareReminder(acc, i.booking.id), s))}>
            Напомнить всем
          </button>
        </div>
      )}
    </Card>
  );
}

const ADVICE_FOLLOWUP: Record<string, string> = {
  Суббота: "Маркетолог",
  "Не внесён": "Продажи",
  Заявок: "Заявки",
  Просроченных: "Задачи",
  Главный: "Маркетолог",
};

function AdviceView() {
  const ask = useContext(AskContext);
  const { state } = useStore();
  const advice = adviceFor(state);
  if (advice.length === 0) return null;
  return (
    <Card className="py-3">
      <Rows>
        {advice.map((a) => {
          const next = Object.entries(ADVICE_FOLLOWUP).find(([key]) => a.title.startsWith(key))?.[1];
          return (
            <li key={a.title} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
              <div className="min-w-[200px] flex-1">
                <div className="text-[15px] text-stone-50">{a.title}</div>
                <div className="text-sm text-muted-200">{a.text}</div>
              </div>
              {next && (
                <button className="btn-ghost" onClick={() => ask(next)}>
                  {next}
                </button>
              )}
            </li>
          );
        })}
      </Rows>
    </Card>
  );
}

function Guests() {
  const { state } = useStore();
  return (
    <Card className="py-3">
      <Rows>
        {state.guests.map((g) => {
          const visits = state.bookings.filter((b) => b.guestId === g.id && b.status !== "cancelled" && b.status !== "request").length;
          return (
            <li key={g.id} className="flex items-center justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <div className="text-[15px] text-stone-50">{g.name}</div>
                <div className="truncate text-sm text-muted-200">
                  {g.phone}
                  {g.tags.length ? ` · ${g.tags.join(", ")}` : ""}
                </div>
              </div>
              <span className="shrink-0 text-sm text-muted-200">визитов: {visits}</span>
            </li>
          );
        })}
      </Rows>
    </Card>
  );
}

function GuestBot() {
  const { state, update } = useStore();
  const [text, setText] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    update((s) => {
      const withGuest = { ...s, chat: [...s.chat, { id: uid("c"), from: "guest" as const, text: clean }] };
      const { state: next, reply } = guestBotReply(withGuest, clean);
      return { ...next, chat: [...next.chat, { id: uid("c"), from: "bot" as const, text: reply }] };
    });
    setText("");
  }

  return (
    <Card>
      <div className="max-h-[360px] space-y-2 overflow-y-auto">
        {state.chat.map((m) => (
          <div key={m.id} className={`flex ${m.from === "guest" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-2.5 text-[15px] leading-relaxed ${
                m.from === "guest" ? "bg-stone-50 text-ink-900" : "bg-ink-700 text-stone-100"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex items-center gap-2 rounded-full bg-ink-700 py-1.5 pl-5 pr-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Хочу юрту с 20 по 22, нас четверо"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-stone-50 outline-none placeholder:text-muted-300"
        />
        <button type="submit" aria-label="Отправить" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-stone-50 hover:bg-white/20">
          <Send size={15} />
        </button>
      </form>
    </Card>
  );
}
