"use client";

// Данные МВП: без сервера и базы. Стартовый набор создаётся от сегодняшней даты и
// хранится в браузере (localStorage). Когда появится Supabase, этот файл заменит
// слой запросов — страницы работают только через useStore().

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addDays, nightsBetween, todayISO } from "./format";

export type Role = "owner" | "manager" | "reception" | "staff";
export type LocationId = "chunkurchak" | "ethno" | "talkan";
export type BookingStatus = "request" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type AgentId = "coordinator" | "guest_admin" | "sales" | "rop" | "marketer" | "parser" | "operations" | "analyst";

export interface Unit {
  id: string;
  locationId: LocationId;
  name: string;
  kind: "Юрта" | "Бешик" | "Земляной домик";
  capacity: number;
  price: number; // сом за ночь
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  source: string;
  note?: string;
}

export interface Booking {
  id: string;
  unitId: string;
  guestId: string;
  from: string; // заезд
  to: string; // выезд
  people: number;
  status: BookingStatus;
  total: number;
  paid: number;
  source: string;
  createdBy: "staff" | "agent";
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  due: string;
  done: boolean;
  createdBy: "staff" | "agent";
  bookingId?: string;
}

export interface AgentLog {
  id: string;
  at: string; // ISO datetime
  agent: AgentId;
  text: string;
}

export interface ChatMessage {
  id: string;
  from: "guest" | "bot";
  text: string;
}

// Сообщение гостю, которое подготовил сотрудник по продажам.
export interface Reminder {
  id: string;
  bookingId: string;
  at: string;
  text: string;
}

// Акция, которую подготовил маркетолог.
export interface Campaign {
  id: string;
  at: string;
  title: string;
  text: string;
  audience: number;
}

// ---------- Этно-комплекс: ресторан в юртах ----------
export interface Hall {
  id: string;
  name: string;
  capacity: number;
}

export type ReservationStatus = "request" | "confirmed" | "done" | "cancelled";

export interface Reservation {
  id: string;
  hallId: string;
  date: string;
  time: string;
  people: number;
  guest: string;
  phone: string;
  kind: "Стол" | "Банкет";
  status: ReservationStatus;
  total: number; // смета банкета, для стола 0
  prepaid: number;
}

// ---------- Супара Талкан: заказы конфет ----------
export type OrderStatus = "new" | "production" | "ready" | "delivered";

export interface Order {
  id: string;
  customer: string;
  boxes: number;
  packaging: "Стандарт" | "Дерево" | "Кожа" | "Войлок";
  total: number;
  paid: number;
  due: string;
  status: OrderStatus;
}

// Что координатор разворачивает в ответ на запрос владельца.
export type View =
  | { kind: "group" }
  | { kind: "ethno" }
  | { kind: "talkan" }
  | { kind: "summary" }
  | { kind: "board" }
  | { kind: "requests" }
  | { kind: "tasks" }
  | { kind: "money" }
  | { kind: "free"; from: string; to: string }
  | { kind: "team" }
  | { kind: "funnel" }
  | { kind: "marketing" }
  | { kind: "market" }
  | { kind: "sales" }
  | { kind: "advice" }
  | { kind: "guests" }
  | { kind: "guestbot" };

// Реплика в разговоре с координатором.
export interface ThreadMessage {
  id: string;
  from: "me" | "bot";
  text: string;
  view?: View;
}

// Что гостевой бот уже выяснил в текущем диалоге.
export interface ChatSession {
  from?: string;
  to?: string;
  people?: number;
  kind?: Unit["kind"];
}

export interface State {
  seedDate: string;
  touched: boolean;
  role: Role;
  units: Unit[];
  guests: Guest[];
  bookings: Booking[];
  tasks: Task[];
  logs: AgentLog[];
  chat: ChatMessage[];
  session: ChatSession;
  thread: ThreadMessage[];
  reminders: Reminder[];
  campaigns: Campaign[];
  halls: Hall[];
  reservations: Reservation[];
  orders: Order[];
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Владелец",
  manager: "Управляющий",
  reception: "Администратор",
  staff: "Персонал",
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  request: "Заявка",
  confirmed: "Подтверждена",
  checked_in: "Проживает",
  checked_out: "Выехал",
  cancelled: "Отменена",
};

export const SOURCES = ["Бот", "Звонок", "Instagram", "WhatsApp", "Сайт", "Турагентство"];

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

// [ДОПУЩЕНИЕ] Количество объектов, вместимость и цены условные: на supara.kg их нет.
function seedUnits(): Unit[] {
  const units: Unit[] = [];
  for (let i = 1; i <= 6; i++) {
    units.push({ id: `yurt-${i}`, locationId: "chunkurchak", name: `Юрта ${i}`, kind: "Юрта", capacity: 4, price: 6000 });
  }
  for (let i = 1; i <= 4; i++) {
    units.push({ id: `beshik-${i}`, locationId: "chunkurchak", name: `Бешик ${i}`, kind: "Бешик", capacity: 2, price: 4500 });
  }
  units.push({ id: "earth-1", locationId: "chunkurchak", name: "Земляной домик", kind: "Земляной домик", capacity: 4, price: 8000 });
  return units;
}

// Гости вымышленные.
function seedGuests(): Guest[] {
  return [
    { id: "g1", name: "Айбек Токтогулов", phone: "+996 700 000 101", tags: ["семья", "постоянный"], source: "Звонок", note: "Просит юрту подальше от ресторана" },
    { id: "g2", name: "Мээрим Асанова", phone: "+996 700 000 102", tags: ["семья"], source: "Instagram" },
    { id: "g3", name: "Данияр Жумабеков", phone: "+996 700 000 103", tags: ["корпоратив"], source: "Турагентство" },
    { id: "g4", name: "Анна Ким", phone: "+996 700 000 104", tags: [], source: "Сайт" },
    { id: "g5", name: "Нурлан Садыков", phone: "+996 700 000 105", tags: ["VIP"], source: "Звонок" },
    { id: "g6", name: "Томас Вебер", phone: "+49 000 000 106", tags: [], source: "Турагентство", note: "Говорит по-английски" },
    { id: "g7", name: "Гульнара Осмонова", phone: "+996 700 000 107", tags: ["постоянный"], source: "WhatsApp" },
  ];
}

// Названия залов — с supara.kg. [ДОПУЩЕНИЕ] Вместимость, брони и заказы условные.
function seedHalls(): Hall[] {
  return [
    { id: "h-men", name: "Юрта мужчин", capacity: 20 },
    { id: "h-ancestors", name: "Юрта предков", capacity: 30 },
    { id: "h-warriors", name: "Юрта воинов", capacity: 25 },
    { id: "h-big", name: "Большая юрта", capacity: 80 },
  ];
}

function seedReservations(today: string): Reservation[] {
  return [
    { id: "r1", hallId: "h-ancestors", date: today, time: "13:00", people: 12, guest: "Бакыт Сыдыков", phone: "+996 700 000 201", kind: "Стол", status: "confirmed", total: 0, prepaid: 0 },
    { id: "r2", hallId: "h-big", date: today, time: "19:00", people: 60, guest: "Чолпон Абдраимова", phone: "+996 700 000 202", kind: "Банкет", status: "confirmed", total: 180000, prepaid: 90000 },
    { id: "r3", hallId: "h-men", date: today, time: "20:00", people: 8, guest: "Руслан Исаев", phone: "+996 700 000 203", kind: "Стол", status: "request", total: 0, prepaid: 0 },
    { id: "r4", hallId: "h-warriors", date: addDays(today, 1), time: "18:00", people: 22, guest: "Эльмира Турдубаева", phone: "+996 700 000 204", kind: "Банкет", status: "confirmed", total: 66000, prepaid: 0 },
    { id: "r5", hallId: "h-big", date: addDays(today, 3), time: "17:00", people: 75, guest: "Азиз Маматов", phone: "+996 700 000 205", kind: "Банкет", status: "confirmed", total: 260000, prepaid: 100000 },
  ];
}

function seedOrders(today: string): Order[] {
  return [
    { id: "o1", customer: "Частный заказ", boxes: 5, packaging: "Дерево", total: 12500, paid: 12500, due: today, status: "ready" },
    { id: "o2", customer: "Корпоративный заказ", boxes: 40, packaging: "Кожа", total: 120000, paid: 60000, due: addDays(today, 1), status: "production" },
    { id: "o3", customer: "Свадебный заказ", boxes: 100, packaging: "Стандарт", total: 150000, paid: 0, due: addDays(today, 6), status: "new" },
    { id: "o4", customer: "Подарочный заказ", boxes: 10, packaging: "Войлок", total: 28000, paid: 28000, due: addDays(today, -2), status: "delivered" },
  ];
}

function seed(today: string): State {
  const units = seedUnits();
  const price = (unitId: string) => units.find((u) => u.id === unitId)!.price;
  const mk = (
    id: string,
    unitId: string,
    guestId: string,
    startOffset: number,
    nights: number,
    people: number,
    status: BookingStatus,
    paidShare: number,
    source: string,
    createdBy: "staff" | "agent" = "staff",
  ): Booking => {
    const total = price(unitId) * nights;
    return {
      id,
      unitId,
      guestId,
      from: addDays(today, startOffset),
      to: addDays(today, startOffset + nights),
      people,
      status,
      total,
      paid: Math.round(total * paidShare),
      source,
      createdBy,
      createdAt: addDays(today, startOffset - 5),
    };
  };

  const bookings: Booking[] = [
    mk("b1", "yurt-1", "g1", -2, 2, 4, "checked_in", 1, "Звонок"),
    mk("b2", "yurt-2", "g2", -1, 3, 3, "checked_in", 0.5, "Instagram"),
    mk("b3", "beshik-1", "g4", -3, 2, 2, "checked_out", 1, "Сайт"),
    mk("b4", "yurt-3", "g3", 0, 2, 4, "confirmed", 0.5, "Турагентство"),
    mk("b5", "yurt-4", "g3", 0, 2, 4, "confirmed", 0.5, "Турагентство"),
    mk("b6", "earth-1", "g5", 1, 2, 2, "confirmed", 1, "Звонок"),
    mk("b7", "beshik-2", "g6", 2, 3, 2, "confirmed", 0.3, "Турагентство"),
    mk("b8", "beshik-3", "g7", 4, 2, 2, "request", 0, "Бот", "agent"),
    mk("b9", "yurt-1", "g2", 5, 2, 4, "confirmed", 0.5, "Instagram"),
    mk("b10", "yurt-5", "g1", -6, 2, 4, "checked_out", 1, "Звонок"),
    mk("b11", "beshik-4", "g5", -5, 1, 2, "checked_out", 1, "Звонок"),
  ];

  const tasks: Task[] = [
    { id: "t1", title: "Уборка: Бешик 1 после выезда", assignee: "Уборка", due: addDays(today, -1), done: false, createdBy: "agent", bookingId: "b3" },
    { id: "t2", title: "Подготовить Юрту 3 и Юрту 4 к заезду группы", assignee: "Уборка", due: today, done: false, createdBy: "staff" },
    { id: "t3", title: "Закупить дрова для бани", assignee: "Техник", due: addDays(today, 1), done: false, createdBy: "staff" },
    { id: "t4", title: "Проверить печь в Земляном домике", assignee: "Техник", due: today, done: true, createdBy: "staff" },
  ];

  const logs: AgentLog[] = [
    { id: "l1", at: `${addDays(today, -1)}T23:40:00`, agent: "guest_admin", text: "Принял заявку от гостя Гульнара Осмонова: Бешик 3. Ждёт подтверждения администратора." },
    { id: "l2", at: `${addDays(today, -1)}T12:05:00`, agent: "operations", text: "Выезд из «Бешик 1»: поставил задачу на уборку." },
  ];

  return {
    seedDate: today,
    touched: false,
    role: "owner",
    units,
    guests: seedGuests(),
    bookings,
    tasks,
    logs,
    chat: [
      { id: "c0", from: "bot", text: "Саламатсызбы! Я бот центра отдыха «Супара-Чункурчак». Подскажу цены, проверю свободные даты и приму заявку на бронь." },
    ],
    session: {},
    thread: [],
    reminders: [],
    campaigns: [],
    halls: seedHalls(),
    reservations: seedReservations(today),
    orders: seedOrders(today),
  };
}

// Пересечение по одному объекту: заезд в день чужого выезда разрешён.
export function findConflict(
  bookings: Booking[],
  unitId: string,
  from: string,
  to: string,
  ignoreId?: string,
): Booking | undefined {
  return bookings.find(
    (b) => b.unitId === unitId && b.id !== ignoreId && b.status !== "cancelled" && b.from < to && from < b.to,
  );
}

export function freeUnits(state: State, from: string, to: string): Unit[] {
  return state.units.filter((u) => !findConflict(state.bookings, u.id, from, to));
}

export interface NewBooking {
  unitId: string;
  guestName: string;
  guestPhone: string;
  from: string;
  to: string;
  people: number;
  source: string;
  status: BookingStatus;
  createdBy: "staff" | "agent";
}

// Чистые функции изменения состояния — ими пользуются и панель, и агенты.
export function addBooking(state: State, input: NewBooking): { state: State; error?: string; booking?: Booking } {
  const unit = state.units.find((u) => u.id === input.unitId);
  if (!unit) return { state, error: "Объект не найден" };
  const nights = nightsBetween(input.from, input.to);
  if (nights < 1) return { state, error: "Выезд должен быть позже заезда" };
  if (input.people > unit.capacity) return { state, error: `В «${unit.name}» помещается до ${unit.capacity} гостей` };
  const conflict = findConflict(state.bookings, input.unitId, input.from, input.to);
  if (conflict) return { state, error: `«${unit.name}» уже занят на эти даты` };

  const phone = input.guestPhone.trim();
  let guest = state.guests.find((g) => phone && g.phone.replace(/\D/g, "") === phone.replace(/\D/g, ""));
  let guests = state.guests;
  if (!guest) {
    guest = { id: uid("g"), name: input.guestName.trim() || "Гость", phone, tags: [], source: input.source };
    guests = [...guests, guest];
  }
  const booking: Booking = {
    id: uid("b"),
    unitId: unit.id,
    guestId: guest.id,
    from: input.from,
    to: input.to,
    people: input.people,
    status: input.status,
    total: unit.price * nights,
    paid: 0,
    source: input.source,
    createdBy: input.createdBy,
    createdAt: todayISO(),
  };
  return { state: { ...state, guests, bookings: [...state.bookings, booking] }, booking };
}

export function log(state: State, agent: AgentId, text: string): State {
  const entry: AgentLog = { id: uid("l"), at: new Date().toISOString(), agent, text };
  return { ...state, logs: [entry, ...state.logs].slice(0, 60) };
}

export function setStatus(state: State, bookingId: string, status: BookingStatus): State {
  const booking = state.bookings.find((b) => b.id === bookingId);
  if (!booking) return state;
  let next: State = {
    ...state,
    bookings: state.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  };
  // Агент по операциям: после выезда сам ставит уборку.
  if (status === "checked_out") {
    const unit = state.units.find((u) => u.id === booking.unitId);
    const task: Task = {
      id: uid("t"),
      title: `Уборка: ${unit?.name ?? "объект"} после выезда`,
      assignee: "Уборка",
      due: todayISO(),
      done: false,
      createdBy: "agent",
      bookingId,
    };
    next = { ...next, tasks: [task, ...next.tasks] };
    next = log(next, "operations", `Выезд из «${unit?.name}»: поставил задачу на уборку.`);
  }
  return next;
}

export function addPayment(state: State, bookingId: string, amount: number): State {
  return {
    ...state,
    bookings: state.bookings.map((b) =>
      b.id === bookingId ? { ...b, paid: Math.min(b.total, b.paid + Math.max(0, amount)) } : b,
    ),
  };
}

const KEY = "supara-mvp-v6";

interface Store {
  state: State;
  update: (fn: (s: State) => State) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);

  useEffect(() => {
    const today = todayISO();
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) loaded = JSON.parse(raw) as State;
    } catch {
      loaded = null;
    }
    // Нетронутое демо пересоздаём каждый день, чтобы даты не устаревали.
    if (!loaded || (!loaded.touched && loaded.seedDate !== today)) loaded = seed(today);
    // Каждый вход начинается с приветствия: прошлый разговор не показываем.
    setState({ ...loaded, thread: [] });
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // хранилище недоступно (приватный режим) — работаем в памяти
    }
  }, [state]);

  const update = useCallback((fn: (s: State) => State) => {
    setState((s) => (s ? { ...fn(s), touched: true } : s));
  }, []);

  const reset = useCallback(() => setState(seed(todayISO())), []);

  const value = useMemo(() => (state ? { state, update, reset } : null), [state, update, reset]);

  if (!value) {
    return <div className="min-h-screen" />;
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const store = useContext(Ctx);
  if (!store) throw new Error("useStore вне StoreProvider");
  return store;
}
