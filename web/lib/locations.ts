// Этно-комплекс (ресторан в юртах) и Супара Талкан (заказы конфет).
// Чункурчак с проживанием живёт в store.tsx и agents.ts.

import { addDays, todayISO } from "./format";
import type { Order, OrderStatus, Reservation, ReservationStatus, State } from "./store";

export const RESERVATION_LABEL: Record<ReservationStatus, string> = {
  request: "Заявка",
  confirmed: "Подтверждена",
  done: "Прошла",
  cancelled: "Отменена",
};

export const ORDER_LABEL: Record<OrderStatus, string> = {
  new: "Новый",
  production: "В производстве",
  ready: "Готов",
  delivered: "Выдан",
};

const ORDER_NEXT: Record<OrderStatus, OrderStatus | null> = {
  new: "production",
  production: "ready",
  ready: "delivered",
  delivered: null,
};

export function hallName(state: State, id: string): string {
  return state.halls.find((h) => h.id === id)?.name ?? "Зал";
}

// Брони ресторана на день, по времени.
export function reservationsOn(state: State, date: string): Reservation[] {
  return state.reservations
    .filter((r) => r.date === date && r.status !== "cancelled")
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function upcomingBanquets(state: State): Reservation[] {
  const today = todayISO();
  return state.reservations
    .filter((r) => r.kind === "Банкет" && r.date > today && r.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function ethnoStats(state: State) {
  const today = reservationsOn(state, todayISO());
  return {
    today: today.length,
    guests: today.reduce((sum, r) => sum + r.people, 0),
    banquets: upcomingBanquets(state).length,
    prepaid: state.reservations.filter((r) => r.status !== "cancelled").reduce((sum, r) => sum + r.prepaid, 0),
  };
}

export function setReservation(state: State, id: string, status: ReservationStatus): State {
  return { ...state, reservations: state.reservations.map((r) => (r.id === id ? { ...r, status } : r)) };
}

export function activeOrders(state: State): Order[] {
  return state.orders.filter((o) => o.status !== "delivered").sort((a, b) => a.due.localeCompare(b.due));
}

export function talkanStats(state: State) {
  const active = activeOrders(state);
  return {
    active: active.length,
    sum: active.reduce((s, o) => s + o.total, 0),
    boxes: active.reduce((s, o) => s + o.boxes, 0),
    paid: state.orders.reduce((s, o) => s + o.paid, 0),
  };
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return ORDER_NEXT[status];
}

export function advanceOrder(state: State, id: string): State {
  return {
    ...state,
    orders: state.orders.map((o) => {
      const next = ORDER_NEXT[o.status];
      return o.id === id && next ? { ...o, status: next } : o;
    }),
  };
}

// Что горит в ресторане и на производстве — для советов аналитика.
export function locationAlerts(state: State): { title: string; text: string }[] {
  const tomorrow = addDays(todayISO(), 1);
  const out: { title: string; text: string }[] = [];
  for (const r of upcomingBanquets(state)) {
    if (r.date <= tomorrow && r.prepaid === 0) {
      out.push({ title: `Банкет завтра без предоплаты`, text: `${hallName(state, r.hallId)}, ${r.people} гостей, ${r.guest}.` });
    }
  }
  for (const o of activeOrders(state)) {
    if (o.due <= tomorrow && (o.status === "new" || o.status === "production")) {
      out.push({ title: `Заказ Талкан не готов к сроку`, text: `${o.customer}: ${o.boxes} наборов, ${ORDER_LABEL[o.status].toLowerCase()}.` });
    }
  }
  return out;
}
