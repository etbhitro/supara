"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Cell, Dialog, EmptyState, Field, Row, Table, inputCls } from "@/components/DataShell";
import { addDays, formatRange, formatSom, fromISO, isWeekend, nightsBetween, todayISO, weekday } from "@/lib/format";
import {
  SOURCES,
  STATUS_LABEL,
  addBooking,
  addPayment,
  setStatus,
  useStore,
  type Booking,
  type BookingStatus,
} from "@/lib/store";

const DAYS = 14;

const STATUS_CELL: Record<BookingStatus, string> = {
  request: "bg-accent/25 text-accent-100 border-accent/60 border-dashed",
  confirmed: "bg-emerald-500/25 text-emerald-100 border-emerald-400/40",
  checked_in: "bg-sky-500/30 text-sky-100 border-sky-400/40",
  checked_out: "bg-white/10 text-muted-100 border-white/10",
  cancelled: "",
};

const STATUS_CHIP: Record<BookingStatus, string> = {
  request: "bg-accent/20 text-accent-300",
  confirmed: "bg-emerald-500/15 text-emerald-300",
  checked_in: "bg-sky-500/15 text-sky-300",
  checked_out: "bg-white/10 text-muted-100",
  cancelled: "bg-felt/30 text-red-200",
};

interface Draft {
  unitId: string;
  from: string;
  to: string;
}

export function BookingBoard({ showRequests = false }: { showRequests?: boolean }) {
  const { state, update } = useStore();
  const today = todayISO();
  const [start, setStart] = useState(addDays(today, -2));
  const [draft, setDraft] = useState<Draft | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(start, i)), [start]);
  const guestName = (id: string) => state.guests.find((g) => g.id === id)?.name ?? "Гость";
  const unitName = (id: string) => state.units.find((u) => u.id === id)?.name ?? "—";
  const visible = state.bookings.filter((b) => b.status !== "cancelled");
  const requests = state.bookings.filter((b) => b.status === "request");
  const opened = state.bookings.find((b) => b.id === openId) ?? null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button className="btn-ghost" onClick={() => setStart(addDays(start, -7))} aria-label="Неделя назад">
          <ChevronLeft size={14} />
        </button>
        <button className="btn-ghost" onClick={() => setStart(addDays(today, -2))}>
          Сегодня
        </button>
        <button className="btn-ghost" onClick={() => setStart(addDays(start, 7))} aria-label="Неделя вперёд">
          <ChevronRight size={14} />
        </button>
        <div className="flex flex-wrap gap-1.5">
          {(["request", "confirmed", "checked_in", "checked_out"] as BookingStatus[]).map((s) => (
            <span key={s} className={`chip ${STATUS_CHIP[s]}`}>
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
        <button className="btn-primary ml-auto py-2" onClick={() => setDraft({ unitId: state.units[0].id, from: today, to: addDays(today, 1) })}>
          <Plus size={16} />
          Бронь
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="grid min-w-[980px]" style={{ gridTemplateColumns: `132px repeat(${DAYS}, minmax(58px, 1fr))` }}>
          <div className="sticky left-0 z-10 border-b border-white/10 bg-ink-800 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-200">
            Объект
          </div>
          {days.map((d) => (
            <div
              key={d}
              className={`border-b border-l border-white/10 px-1 py-2 text-center text-[11px] leading-tight ${
                d === today ? "bg-accent/20 font-bold text-accent-300" : isWeekend(d) ? "bg-white/[0.04] text-stone-200" : "text-muted-200"
              }`}
            >
              <div className="font-bold">{fromISO(d).getDate()}</div>
              <div>{weekday(d)}</div>
            </div>
          ))}

          {state.units.map((u) => (
            <div key={u.id} className="contents">
              <div className="sticky left-0 z-10 border-b border-white/5 bg-ink-800 px-3 py-2">
                <div className="text-sm font-semibold text-stone-100">{u.name}</div>
                <div className="text-[10px] text-muted-300">
                  до {u.capacity} чел. · {u.price.toLocaleString("ru-RU")}
                </div>
              </div>
              {days.map((d) => {
                const b = visible.find((x) => x.unitId === u.id && x.from <= d && d < x.to);
                if (!b) {
                  return (
                    <button
                      key={d}
                      onClick={() => setDraft({ unitId: u.id, from: d, to: addDays(d, 1) })}
                      className="border-b border-l border-white/5 transition hover:bg-accent/10"
                      aria-label={`Забронировать ${u.name}`}
                    />
                  );
                }
                const first = b.from === d || d === days[0];
                return (
                  <button
                    key={d}
                    onClick={() => setOpenId(b.id)}
                    className={`overflow-hidden border-y px-1.5 text-left text-[11px] font-semibold ${STATUS_CELL[b.status]} ${
                      b.from === d ? "ml-1 rounded-l-lg border-l" : ""
                    } ${addDays(b.to, -1) === d ? "mr-1 rounded-r-lg border-r" : ""} my-1`}
                  >
                    {first ? <span className="block truncate">{guestName(b.guestId)}</span> : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {showRequests && <h2 className="mb-3 mt-8 text-base font-bold text-stone-50">Заявки</h2>}
      {!showRequests ? null : requests.length === 0 ? (
        <EmptyState title="Новых заявок нет" />
      ) : (
        <Table headers={["Гость", "Объект", "Даты", "Сумма", "Источник", ""]}>
          {requests.map((b) => (
            <Row key={b.id} onClick={() => setOpenId(b.id)}>
              <Cell className="font-semibold">{guestName(b.guestId)}</Cell>
              <Cell>{unitName(b.unitId)}</Cell>
              <Cell className="whitespace-nowrap">{formatRange(b.from, b.to)}</Cell>
              <Cell className="whitespace-nowrap">{formatSom(b.total)}</Cell>
              <Cell>{b.source}</Cell>
              <Cell>
                <span className="chip bg-accent/20 text-accent-300">Открыть</span>
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {draft && <NewBookingDialog draft={draft} onClose={() => setDraft(null)} />}

      <Dialog open={!!opened} onClose={() => setOpenId(null)} title={opened ? `${unitName(opened.unitId)} · ${guestName(opened.guestId)}` : ""}>
        {opened && (
          <BookingCard
            booking={opened}
            phone={state.guests.find((g) => g.id === opened.guestId)?.phone ?? ""}
            onStatus={(s) => update((st) => setStatus(st, opened.id, s))}
            onPay={(amount) => update((st) => addPayment(st, opened.id, amount))}
          />
        )}
      </Dialog>
    </>
  );
}

function NewBookingDialog({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const { state, update } = useStore();
  const [unitId, setUnitId] = useState(draft.unitId);
  const [from, setFrom] = useState(draft.from);
  const [to, setTo] = useState(draft.to);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState("2");
  const [source, setSource] = useState("Звонок");
  const [error, setError] = useState("");

  const unit = state.units.find((u) => u.id === unitId);
  const nights = from && to ? nightsBetween(from, to) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Проверяем на текущем состоянии, чтобы показать ошибку до сохранения.
    const result = addBooking(state, {
      unitId,
      guestName: name,
      guestPhone: phone,
      from,
      to,
      people: Number(people) || 1,
      source,
      status: "confirmed",
      createdBy: "staff",
    });
    if (result.error) {
      setError(result.error);
      return;
    }
    update(() => result.state);
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title="Новая бронь">
      <form onSubmit={submit}>
        <Field label="Объект">
          <select className={inputCls} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
            {state.units.map((u) => (
              <option key={u.id} value={u.id} className="bg-ink-800">
                {u.name} · до {u.capacity} чел. · {formatSom(u.price)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Заезд">
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} required />
          </Field>
          <Field label="Выезд">
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} required />
          </Field>
        </div>
        <Field label="Гость">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя и фамилия" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Телефон">
            <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+996" required />
          </Field>
          <Field label="Гостей">
            <input type="number" min={1} max={12} className={inputCls} value={people} onChange={(e) => setPeople(e.target.value)} />
          </Field>
        </div>
        <Field label="Источник">
          <select className={inputCls} value={source} onChange={(e) => setSource(e.target.value)}>
            {SOURCES.map((s) => (
              <option key={s} className="bg-ink-800">
                {s}
              </option>
            ))}
          </select>
        </Field>

        {unit && nights > 0 && (
          <div className="mb-3 text-sm text-muted-100">
            {nights} ноч. × {formatSom(unit.price)} = <b className="text-stone-50">{formatSom(unit.price * nights)}</b>
          </div>
        )}
        {error && <div className="mb-3 rounded-lg bg-felt/25 px-3 py-2 text-sm font-semibold text-red-200">{error}</div>}
        <button className="btn-primary w-full" type="submit">
          Сохранить бронь
        </button>
      </form>
    </Dialog>
  );
}

function BookingCard({
  booking,
  phone,
  onStatus,
  onPay,
}: {
  booking: Booking;
  phone: string;
  onStatus: (s: BookingStatus) => void;
  onPay: (amount: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const left = booking.total - booking.paid;
  const closed = booking.status === "checked_out" || booking.status === "cancelled";

  return (
    <div className="text-sm">
      <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2">
        <Info label="Даты" value={formatRange(booking.from, booking.to)} />
        <Info label="Гостей" value={String(booking.people)} />
        <Info label="Телефон" value={phone || "—"} />
        <Info label="Источник" value={booking.createdBy === "agent" ? `${booking.source} (агент)` : booking.source} />
        <Info label="Сумма" value={formatSom(booking.total)} />
        <Info label="Оплачено" value={`${formatSom(booking.paid)}${left > 0 ? ` · остаток ${formatSom(left)}` : ""}`} />
      </dl>
      <div className="mb-4">
        <span className={`chip ${STATUS_CHIP[booking.status]}`}>{STATUS_LABEL[booking.status]}</span>
      </div>

      {!closed && left > 0 && (
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (n > 0) onPay(n);
            setAmount("");
          }}
        >
          <input
            type="number"
            min={1}
            className={inputCls}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Оплата, до ${left.toLocaleString("ru-RU")}`}
          />
          <button className="btn-ghost shrink-0" type="submit">
            Внести
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {booking.status === "request" && (
          <button className="btn-primary" onClick={() => onStatus("confirmed")}>
            Подтвердить
          </button>
        )}
        {booking.status === "confirmed" && (
          <button className="btn-primary" onClick={() => onStatus("checked_in")}>
            Заселить
          </button>
        )}
        {booking.status === "checked_in" && (
          <button className="btn-primary" onClick={() => onStatus("checked_out")}>
            Выселить
          </button>
        )}
        {(booking.status === "request" || booking.status === "confirmed") && (
          <button className="btn-ghost" onClick={() => onStatus("cancelled")}>
            Отменить бронь
          </button>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-kicker">{label}</dt>
      <dd className="mt-0.5 font-semibold text-stone-100">{value}</dd>
    </div>
  );
}
