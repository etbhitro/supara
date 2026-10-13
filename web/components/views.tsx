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
import {
  ORDER_LABEL,
  RESERVATION_LABEL,
  advanceOrder,
  ethnoStats,
  hallName,
  nextOrderStatus,
  reservationsOn,
  setReservation,
  talkanStats,
  upcomingBanquets,
} from "@/lib/locations";
import { shortDate, useMarket } from "@/lib/market";
import {
  freeUnits,
  setStatus,
  uid,
  useStore,
  type AgentId,
  type OrderStatus,
  type Reservation,
  type ReservationStatus,
  type View,
} from "@/lib/store";

// Карточка может задать координатору следующий вопрос (например, плитка сотрудника).
export const AskContext = createContext<(text: string) => void>(() => {});

export function ViewCard({ view }: { view: View }) {
  switch (view.kind) {
    case "group":
      return <Group />;
    case "ethno":
      return <Ethno />;
    case "talkan":
      return <Talkan />;
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
  return <ul className="divide-y divide-black/[0.06]">{children}</ul>;
}

function Summary() {
  const ask = useContext(AskContext);
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
              className={`w-full rounded-md ${busy ? (isWeekend(day) ? "bg-bronze" : "bg-bronze/40") : "bg-black/10"}`}
              style={{ height: `${Math.max(6, (busy / Math.max(1, s.total)) * 100)}%` }}
            />
            <span className={`text-[10px] ${day === today ? "font-semibold text-ink" : "text-muted-300"}`}>{fromISO(day).getDate()}</span>
          </div>
        ))}
      </div>

      {moves.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-2">
          <Rows>
            {moves.map((m) => (
              <li key={m.key} className="flex items-center justify-between gap-3 py-3 text-[17px]">
                <span className="min-w-0 truncate text-ink">
                  {m.unit} <span className="text-muted-200">· {m.guest}</span>
                </span>
                <span className="text-[15px] text-muted-200">{m.kind}</span>
              </li>
            ))}
          </Rows>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {["Шахматка", "Заявки", "Задачи"].map((q) => (
          <button key={q} className="btn-ghost" onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>
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
              <div className="text-[17px] text-ink">{i.guest}</div>
              <div className="text-[15px] text-muted-200">
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
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-black/25 text-transparent transition hover:bg-bronze hover:text-white"
            >
              <Check size={13} strokeWidth={3} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[17px] text-ink">{t.title}</div>
              <div className="text-[15px] text-muted-200">{t.assignee}</div>
            </div>
            <span className={`text-[15px] ${t.due < today ? "text-felt" : "text-muted-200"}`}>{t.due < today ? "просрочено" : formatDay(t.due)}</span>
          </li>
        ))}
        {open.length === 0 && <li className="py-3.5 text-[17px] text-muted-200">Все задачи выполнены</li>}
      </Rows>
      <div className="flex justify-end border-t border-black/[0.06] pt-3">
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
          <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[17px]">
            <span className="text-ink">{r.label}</span>
            <span className="text-muted-200">{r.note}</span>
          </div>
          <span className="block h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
            <span className="block h-full rounded-full bg-bronze" style={{ width: `${(r.value / max) * 100}%` }} />
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
        <div className="label-kicker mb-4">Получено по направлениям</div>
        <Bars
          rows={[
            { label: "Чункурчак", value: s.paidTotal, note: formatSom(s.paidTotal) },
            { label: "Этно-комплекс", value: ethnoStats(state).prepaid, note: formatSom(ethnoStats(state).prepaid) },
            { label: "Талкан", value: talkanStats(state).paid, note: formatSom(talkanStats(state).paid) },
          ]}
        />
      </div>
      <div className="mt-8">
        <div className="label-kicker mb-4">Каналы Чункурчака</div>
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
                <div className="text-[17px] text-ink">{kind}</div>
                <div className="text-[15px] text-muted-200">
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
          className="group rounded-3xl border border-white/70 bg-white/50 p-5 text-left shadow-[0_12px_40px_rgba(60,40,20,0.08)] backdrop-blur-2xl transition enabled:hover:bg-white/75"
        >
          <div className="flex items-center justify-between">
            <span className="h-2 w-2 rounded-full bg-[#C9A35C]" />
            <ArrowUpRight size={15} className="text-muted-400 transition group-enabled:group-hover:text-bronze" />
          </div>
          <div className="mt-5 text-[17px] text-ink">{a.name}</div>
          <div className="mt-0.5 text-[15px] text-muted-200">{load[a.id]}</div>
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
        <div key={c.id} className="mt-6 rounded-2xl bg-white/60 p-4">
          <div className="flex items-baseline justify-between gap-3 text-[15px] text-muted-200">
            <span>{c.title}</span>
            <span>получателей: {c.audience}</span>
          </div>
          <div className="mt-2 text-[17px] leading-relaxed text-ink">{c.text}</div>
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
                <span className="block text-[17px] text-ink group-hover:text-bronze">{i.title}</span>
                <span className="text-[15px] text-muted-200">
                  {i.source} · {shortDate(i.date)}
                </span>
              </span>
              <ArrowUpRight size={16} className="mt-1 shrink-0 text-muted-400 group-hover:text-bronze" />
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
                  <div className="text-[17px] text-ink">{i.guest}</div>
                  <div className="text-[15px] text-muted-200">
                    {i.unit} · {formatRange(i.booking.from, i.booking.to)} · {i.kind === "request" ? "заявка" : `долг ${formatSom(i.due)}`}
                  </div>
                </div>
                {!message && (
                  <button className="btn-ghost" onClick={() => update((s) => prepareReminder(s, i.booking.id))}>
                    Напомнить
                  </button>
                )}
              </div>
              {message && <div className="mt-3 rounded-2xl bg-white/60 p-4 text-[17px] leading-relaxed text-ink">{message.text}</div>}
            </li>
          );
        })}
      </Rows>
      {queue.some((i) => !i.reminded) && (
        <div className="flex justify-end border-t border-black/[0.06] pt-3">
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
  Банкет: "Этно-комплекс",
  Заказ: "Талкан",
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
                <div className="text-[17px] text-ink">{a.title}</div>
                <div className="text-[15px] text-muted-200">{a.text}</div>
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
                <div className="text-[17px] text-ink">{g.name}</div>
                <div className="truncate text-[15px] text-muted-200">
                  {g.phone}
                  {g.tags.length ? ` · ${g.tags.join(", ")}` : ""}
                </div>
              </div>
              <span className="shrink-0 text-[15px] text-muted-200">визитов: {visits}</span>
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
              className={`max-w-[85%] whitespace-pre-line rounded-3xl px-4 py-2.5 text-[17px] leading-relaxed ${
                m.from === "guest" ? "bg-bronze text-white" : "bg-white/60 text-ink"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex items-center gap-2 rounded-full bg-white/60 py-1.5 pl-5 pr-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Хочу юрту с 20 по 22, нас четверо"
          className="min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-muted-300"
        />
        <button type="submit" aria-label="Отправить" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.06] text-ink hover:bg-black/10">
          <Send size={15} />
        </button>
      </form>
    </Card>
  );
}

// ---------- Вся группа, ресторан, производство ----------

function Group() {
  const ask = useContext(AskContext);
  const { state } = useStore();
  const s = summarize(state);
  const e = ethnoStats(state);
  const t = talkanStats(state);
  const tiles = [
    { name: "Чункурчак", figure: `${s.occupiedToday}/${s.total}`, label: "занято сегодня", note: `загрузка на неделю ${Math.round(s.occupancyWeek * 100)}%` },
    { name: "Этно-комплекс", figure: String(e.today), label: "броней сегодня", note: `${e.guests} гостей · банкетов впереди: ${e.banquets}` },
    { name: "Талкан", figure: String(t.active), label: "заказов в работе", note: `${t.boxes} наборов · ${formatSom(t.sum)}` },
  ];
  return (
    <div className="grid animate-rise gap-3 sm:grid-cols-3">
      {tiles.map((x) => (
        <button key={x.name} onClick={() => ask(x.name)} className="card group p-6 text-left transition hover:bg-white/75">
          <div className="flex items-center justify-between text-[17px] text-ink">
            {x.name}
            <ArrowUpRight size={16} className="text-muted-400 transition group-hover:text-bronze" />
          </div>
          <div className="figure mt-6">{x.figure}</div>
          <div className="label-kicker mt-2">{x.label}</div>
          <div className="mt-4 text-[15px] text-muted-200">{x.note}</div>
        </button>
      ))}
    </div>
  );
}

const RESERVATION_CHIP: Record<ReservationStatus, string> = {
  request: "bg-[#F6E9CC] text-[#6E5210]",
  confirmed: "bg-[#EBDCCD] text-[#5F4027]",
  done: "bg-[#E9E4DC] text-[#857B6F]",
  cancelled: "bg-[#F3D5CB] text-[#8A2E17]",
};

function ReservationRow({ r, withDate }: { r: Reservation; withDate?: boolean }) {
  const { state, update } = useStore();
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
      <span className="w-[4.5rem] shrink-0 text-[17px] tabular-nums text-ink">{withDate ? formatDay(r.date) : r.time}</span>
      <div className="min-w-[160px] flex-1">
        <div className="text-[17px] text-ink">
          {hallName(state, r.hallId)} <span className="text-muted-200">· {r.people} гостей</span>
        </div>
        <div className="text-[15px] text-muted-200">
          {r.guest}
          {r.kind === "Банкет" ? ` · банкет ${formatSom(r.total)}, внесено ${formatSom(r.prepaid)}` : ""}
        </div>
      </div>
      {r.status === "request" ? (
        <button className="btn-primary" onClick={() => update((s) => setReservation(s, r.id, "confirmed"))}>
          Подтвердить
        </button>
      ) : (
        <span className={`chip ${RESERVATION_CHIP[r.status]}`}>{RESERVATION_LABEL[r.status]}</span>
      )}
    </li>
  );
}

function Ethno() {
  const { state } = useStore();
  const e = ethnoStats(state);
  const today = reservationsOn(state, todayISO());
  const banquets = upcomingBanquets(state);
  return (
    <Card>
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
        <Figure label="броней сегодня" value={String(e.today)} />
        <Figure label="гостей сегодня" value={String(e.guests)} />
        <Figure label="предоплаты, сом" value={e.prepaid.toLocaleString("ru-RU")} />
      </div>
      {today.length > 0 && (
        <div className="mt-6 border-t border-black/[0.06] pt-2">
          <Rows>
            {today.map((r) => (
              <ReservationRow key={r.id} r={r} />
            ))}
          </Rows>
        </div>
      )}
      {banquets.length > 0 && (
        <div className="mt-4">
          <div className="label-kicker">Банкеты впереди</div>
          <Rows>
            {banquets.map((r) => (
              <ReservationRow key={r.id} r={r} withDate />
            ))}
          </Rows>
        </div>
      )}
    </Card>
  );
}

const ORDER_CHIP: Record<OrderStatus, string> = {
  new: "bg-[#F6E9CC] text-[#6E5210]",
  production: "bg-[#E6BFA8] text-[#6A2F18]",
  ready: "bg-[#EBDCCD] text-[#5F4027]",
  delivered: "bg-[#E9E4DC] text-[#857B6F]",
};

function Talkan() {
  const { state, update } = useStore();
  const t = talkanStats(state);
  const today = todayISO();
  const orders = [...state.orders].sort((a, b) => a.due.localeCompare(b.due));
  return (
    <Card>
      <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
        <Figure label="заказов в работе" value={String(t.active)} />
        <Figure label="наборов" value={String(t.boxes)} />
        <Figure label="на сумму, сом" value={t.sum.toLocaleString("ru-RU")} />
      </div>
      <div className="mt-6 border-t border-black/[0.06] pt-2">
        <Rows>
          {orders.map((o) => {
            const next = nextOrderStatus(o.status);
            const late = o.status !== "delivered" && o.due < today;
            return (
              <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
                <div className="min-w-[170px] flex-1">
                  <div className="text-[17px] text-ink">
                    {o.customer} <span className="text-muted-200">· {o.boxes} наборов, {o.packaging.toLowerCase()}</span>
                  </div>
                  <div className={`text-[15px] ${late ? "text-felt" : "text-muted-200"}`}>
                    к {formatDay(o.due)} · {formatSom(o.total)}
                    {o.paid < o.total ? ` · оплачено ${formatSom(o.paid)}` : " · оплачен"}
                  </div>
                </div>
                <span className={`chip ${ORDER_CHIP[o.status]}`}>{ORDER_LABEL[o.status]}</span>
                {next && (
                  <button className="btn-ghost" onClick={() => update((s) => advanceOrder(s, o.id))}>
                    {ORDER_LABEL[next]} →
                  </button>
                )}
              </li>
            );
          })}
        </Rows>
      </div>
    </Card>
  );
}
