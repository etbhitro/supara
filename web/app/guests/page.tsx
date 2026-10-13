"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Cell, EmptyState, NoAccess, Row, Table, inputCls } from "@/components/DataShell";
import { formatSom } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function GuestsPage() {
  const { state } = useStore();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.guests
      .filter((g) => !term || g.name.toLowerCase().includes(term) || g.phone.includes(term))
      .map((g) => {
        const visits = state.bookings.filter((b) => b.guestId === g.id && b.status !== "cancelled" && b.status !== "request");
        return { guest: g, visits: visits.length, paid: visits.reduce((sum, b) => sum + b.paid, 0) };
      });
  }, [state.guests, state.bookings, q]);

  if (state.role === "staff") return <NoAccess what="Гости" />;
  const showMoney = state.role === "owner" || state.role === "manager";

  return (
    <>
      <PageHeader title="Гости" subtitle="Карточки гостей: контакты, визиты, откуда пришли" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени или телефону" className={`${inputCls} mb-4 max-w-xs`} />

      {rows.length === 0 ? (
        <EmptyState title="Никого не нашли" />
      ) : (
        <Table headers={["Гость", "Телефон", "Визитов", ...(showMoney ? ["Оплачено"] : []), "Источник", "Заметка"]}>
          {rows.map(({ guest, visits, paid }) => (
            <Row key={guest.id}>
              <Cell>
                <div className="font-semibold">{guest.name}</div>
                {guest.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {guest.tags.map((t) => (
                      <span key={t} className="chip bg-white/10 text-muted-100">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Cell>
              <Cell className="whitespace-nowrap">{guest.phone}</Cell>
              <Cell>{visits}</Cell>
              {showMoney && <Cell className="whitespace-nowrap">{formatSom(paid)}</Cell>}
              <Cell>{guest.source}</Cell>
              <Cell className="text-muted-100">{guest.note ?? "—"}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </>
  );
}
