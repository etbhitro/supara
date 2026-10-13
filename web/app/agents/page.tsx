"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { NoAccess } from "@/components/DataShell";
import {
  AGENTS,
  adviceFor,
  assignCalls,
  funnel,
  guestBotReply,
  morningReport,
  operationsRound,
  ownerReply,
  prepareCampaign,
  prepareReminder,
  salesQueue,
  sourceStats,
} from "@/lib/agents";
import { shortDate, useMarket } from "@/lib/market";
import { formatDay, formatRange, formatSom, todayISO } from "@/lib/format";
import { uid, useStore, type AgentId, type ChatMessage } from "@/lib/store";

const OWNER_HINTS = ["Сколько заработали?", "Что свободно на выходные?", "Какие задачи просрочены?", "Что делать сегодня?"];
const GUEST_HINTS = ["Сколько стоит?", "Есть места на выходные?", "Хочу юрту с 20 по 22, нас четверо", "Как добраться?"];

export default function StaffPage() {
  const { state, update } = useStore();
  const [active, setActive] = useState<AgentId>("coordinator");
  const market = useMarket();

  if (state.role !== "owner" && state.role !== "manager") return <NoAccess what="Сотрудники" />;

  const today = todayISO();
  const queue = salesQueue(state);
  // Что у каждого сейчас в работе — цифра на карточке.
  const load: Record<AgentId, string> = {
    coordinator: `${state.ownerChat.filter((m) => m.from === "guest").length} вопросов`,
    guest_admin: `${state.chat.filter((m) => m.from === "guest").length} сообщений`,
    sales: `${queue.filter((i) => !i.reminded).length} в работе`,
    rop: `${Math.round(funnel(state).conversion * 100)}% конверсия`,
    marketer: `${state.campaigns.length} акций`,
    parser: `${market?.items.length ?? 0} находок`,
    operations: `${state.tasks.filter((t) => !t.done).length} задач`,
    analyst: `${adviceFor(state).length} советов`,
  };

  return (
    <>
      <PageHeader title="Сотрудники" />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <ul className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {AGENTS.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => setActive(a.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active === a.id ? "border-accent/60 bg-accent/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/20 text-sm font-extrabold text-accent-300">
                  {a.name[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-stone-50">
                    {a.name}
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="block text-xs leading-snug text-muted-200">{a.does}</span>
                </span>
                <span className="shrink-0 text-[11px] font-bold text-muted-100">{load[a.id]}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="min-w-0">
          {active === "coordinator" && (
            <Chat
              messages={state.ownerChat}
              hints={OWNER_HINTS}
              placeholder="Вопрос владельца…"
              onSend={(text) =>
                update((s) => ({
                  ...s,
                  ownerChat: [
                    ...s.ownerChat,
                    { id: uid("o"), from: "guest", text },
                    { id: uid("o"), from: "bot", text: ownerReply(s, text) },
                  ],
                }))
              }
            />
          )}

          {active === "guest_admin" && (
            <Chat
              messages={state.chat}
              hints={GUEST_HINTS}
              placeholder="Сообщение от гостя…"
              onSend={(text) =>
                update((s) => {
                  const withGuest = { ...s, chat: [...s.chat, { id: uid("c"), from: "guest" as const, text }] };
                  const { state: next, reply } = guestBotReply(withGuest, text);
                  return { ...next, chat: [...next.chat, { id: uid("c"), from: "bot" as const, text: reply }] };
                })
              }
            />
          )}

          {active === "sales" && (
            <div className="grid gap-4">
              <div className="card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="label-kicker">В работе</div>
                  <button
                    className="btn-primary py-2"
                    disabled={queue.every((i) => i.reminded)}
                    onClick={() => update((s) => salesQueue(s).reduce((acc, i) => prepareReminder(acc, i.booking.id), s))}
                  >
                    <Play size={14} />
                    Напомнить всем
                  </button>
                </div>
                {queue.length === 0 ? (
                  <div className="text-sm text-muted-200">Пусто</div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {queue.map((i) => (
                      <li key={i.booking.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                        <span className="min-w-[150px] flex-1 font-semibold text-stone-50">{i.guest}</span>
                        <span className="text-muted-100">
                          {i.unit} · {formatRange(i.booking.from, i.booking.to)}
                        </span>
                        <span className={`chip ${i.kind === "request" ? "bg-accent/20 text-accent-300" : "bg-felt/30 text-red-200"}`}>
                          {i.kind === "request" ? "Заявка" : `Долг ${formatSom(i.due)}`}
                        </span>
                        {i.reminded ? (
                          <span className="chip bg-emerald-500/15 text-emerald-300">Готово</span>
                        ) : (
                          <button className="btn-ghost py-1.5" onClick={() => update((s) => prepareReminder(s, i.booking.id))}>
                            Напомнить
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {state.reminders.length > 0 && (
                <div className="card">
                  <div className="label-kicker mb-3">Сообщения гостям</div>
                  <ul className="space-y-2">
                    {state.reminders.map((r) => (
                      <li key={r.id} className="rounded-xl bg-ink-700 px-4 py-3 text-sm leading-relaxed text-stone-100">
                        {r.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {active === "operations" && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="label-kicker">Задачи</div>
                <button className="btn-primary py-2" onClick={() => update(operationsRound)}>
                  <Play size={14} />
                  Сделать обход
                </button>
              </div>
              <ul className="divide-y divide-white/5">
                {state.tasks
                  .filter((t) => !t.done)
                  .sort((a, b) => a.due.localeCompare(b.due))
                  .map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                      <span className="min-w-[180px] flex-1 font-semibold text-stone-50">{t.title}</span>
                      <span className="text-muted-100">{t.assignee}</span>
                      <span className={`chip ${t.due < today ? "bg-felt/30 text-red-200" : "bg-white/10 text-muted-100"}`}>
                        {t.due < today ? "Просрочено" : formatDay(t.due)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {active === "rop" && <RopDesk />}

          {active === "marketer" && <MarketerDesk />}

          {active === "parser" && (
            <div className="card">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="label-kicker">Рынок</div>
                {market && <span className="text-[11px] font-bold text-muted-200">Обновлено {shortDate(market.fetchedAt)}</span>}
              </div>
              {!market || market.items.length === 0 ? (
                <div className="text-sm text-muted-200">Пусто</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {market.items.map((i) => (
                    <li key={i.url} className="py-2.5">
                      <a href={i.url} target="_blank" rel="noopener" className="text-sm font-semibold text-stone-50 hover:text-accent-300">
                        {i.title}
                      </a>
                      <div className="text-[11px] text-muted-200">
                        {i.source} · {shortDate(i.date)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {active === "analyst" && (
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="card">
                <div className="label-kicker mb-3">Сводка</div>
                <div className="whitespace-pre-line text-sm leading-relaxed text-stone-100">{morningReport(state, true)}</div>
              </div>
              <div className="card">
                <div className="label-kicker mb-3">Советы</div>
                <ul className="space-y-3">
                  {adviceFor(state).map((a) => (
                    <li key={a.title}>
                      <div className="text-sm font-bold text-stone-50">{a.title}</div>
                      <div className="text-xs text-muted-100">{a.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <Journal agent={active} />
        </div>
      </div>
    </>
  );
}

function RopDesk() {
  const { state, update } = useStore();
  const f = funnel(state);
  const max = Math.max(1, ...f.stages.map((st) => st.count));
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Конверсия", `${Math.round(f.conversion * 100)}%`],
          ["Средний чек", formatSom(f.avgCheck)],
          ["Долг", formatSom(f.debt)],
        ].map(([label, value]) => (
          <div key={label} className="card py-4">
            <div className="label-kicker">{label}</div>
            <div className="mt-1.5 text-xl font-extrabold tracking-tight text-stone-50">{value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="label-kicker">Воронка</div>
          <button className="btn-primary py-2" onClick={() => update(assignCalls)}>
            <Play size={14} />
            Раздать поручения
          </button>
        </div>
        <ul className="space-y-2">
          {f.stages.map((st) => (
            <li key={st.label} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
              <span className="text-muted-100">{st.label}</span>
              <span className="h-6 overflow-hidden rounded-md bg-white/[0.04]">
                <span className="block h-full rounded-md bg-accent-600" style={{ width: `${(st.count / max) * 100}%` }} />
              </span>
              <span className="text-right font-bold text-stone-50">{st.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MarketerDesk() {
  const { state, update } = useStore();
  const rows = sourceStats(state);
  const total = Math.max(1, rows.reduce((sum, r) => sum + r.revenue, 0));
  return (
    <div className="grid gap-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="label-kicker">Каналы</div>
          <button className="btn-primary py-2" onClick={() => update(prepareCampaign)}>
            <Play size={14} />
            Подготовить акцию
          </button>
        </div>
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.source} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="font-semibold text-stone-50">{r.source}</span>
                <span className="text-muted-100">
                  {r.bookings} броней{r.requests ? ` · ${r.requests} заявок` : ""} · <b className="text-stone-50">{formatSom(r.revenue)}</b>
                </span>
              </div>
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <span className="block h-full rounded-full bg-accent-500" style={{ width: `${(r.revenue / total) * 100}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {state.campaigns.length > 0 && (
        <div className="card">
          <div className="label-kicker mb-3">Акции</div>
          <ul className="space-y-2">
            {state.campaigns.map((c) => (
              <li key={c.id} className="rounded-xl bg-ink-700 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-stone-50">{c.title}</span>
                  <span className="text-[11px] font-bold text-muted-100">получателей: {c.audience}</span>
                </div>
                <div className="mt-1 text-sm leading-relaxed text-stone-100">{c.text}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Chat({
  messages,
  hints,
  placeholder,
  onSend,
}: {
  messages: ChatMessage[];
  hints: string[];
  placeholder: string;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  function send(message: string) {
    const clean = message.trim();
    if (!clean) return;
    onSend(clean);
    setText("");
  }

  return (
    <div className="card flex h-[520px] flex-col p-0">
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
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
        {hints.map((h) => (
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
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-stone-100 outline-none placeholder:text-muted-300 focus:border-accent"
        />
        <button className="btn-primary shrink-0 px-3" type="submit" aria-label="Отправить">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function Journal({ agent }: { agent: AgentId }) {
  const { state } = useStore();
  const logs = state.logs.filter((l) => l.agent === agent);
  if (logs.length === 0) return null;
  return (
    <div className="card mt-4">
      <div className="label-kicker mb-3">Журнал</div>
      <ul className="max-h-[220px] space-y-2.5 overflow-y-auto pr-1 text-sm">
        {logs.map((l) => (
          <li key={l.id} className="flex gap-3">
            <span className="shrink-0 text-[11px] font-bold text-accent-400">
              {new Date(l.at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-stone-100">{l.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
