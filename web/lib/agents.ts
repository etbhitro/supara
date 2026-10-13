// Демо-агенты МВП. Работают по правилам прямо в браузере, без нейросети:
// для Claude API нужен сервер с ключом (см. ТЗ, этап 2 и 5). Логика и права
// те же, что будут у настоящих агентов: бот не подтверждает бронь сам, всё пишет в журнал.

import { addDays, formatDay, formatRange, formatSom, fromISO, nightsBetween, toISO, todayISO } from "./format";
import {
  addBooking,
  freeUnits,
  log,
  uid,
  type AgentId,
  type ChatSession,
  type State,
  type Task,
  type Unit,
} from "./store";

export interface AgentInfo {
  id: string;
  name: string;
  does: string;
  live: boolean;
}

export const AGENTS: AgentInfo[] = [
  { id: "guest_admin", name: "Агент-администратор", does: "Отвечает гостям по ценам и свободным датам, принимает заявки на бронь. Бронь подтверждает человек.", live: true },
  { id: "operations", name: "Агент по операциям", does: "Ставит задачи персоналу (уборка после выезда), следит за просрочками.", live: true },
  { id: "analyst", name: "Агент-аналитик", does: "Собирает утренний отчёт: загрузка, заезды и выезды, деньги, что требует внимания.", live: true },
  { id: "sales", name: "Агент по продажам", does: "Дожимает неоплаченные заявки, возвращает гостей, предлагает допуслуги.", live: false },
  { id: "purchasing", name: "Агент по закупкам", does: "Следит за остатками, формирует заявки поставщикам.", live: false },
  { id: "reputation", name: "Агент по репутации", does: "Собирает отзывы, готовит ответы, сообщает о негативе.", live: false },
  { id: "quality", name: "Агент качества сервиса", does: "Разбирает звонки по чек-листу, даёт советы сотрудникам.", live: false },
  { id: "coordinator", name: "Координатор", does: "Принимает запросы владельца и распределяет их между агентами.", live: false },
];

export const AGENT_NAME: Record<AgentId, string> = {
  guest_admin: "Агент-администратор",
  operations: "Агент по операциям",
  analyst: "Агент-аналитик",
};

// ---------- Гостевой бот ----------

const MONTH_STEMS = ["янв", "фев", "мар", "апр", "ма", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const WORD_NUMBERS: [RegExp, number][] = [
  [/один|одного|\bя\b/, 1],
  [/двое|вдво[её]м|два|две|пара/, 2],
  [/трое|втро[её]м|три/, 3],
  [/четверо|вчетвером|четыре/, 4],
];

function monthFromText(text: string): number | undefined {
  // «мая/май» проверяем после «мар», чтобы не спутать
  for (let i = 0; i < MONTH_STEMS.length; i++) {
    const stem = MONTH_STEMS[i];
    const re = stem === "ма" ? /(^|\s)ма[яй]/ : new RegExp(`(^|\\s)${stem}`);
    if (re.test(text)) return i;
  }
  return undefined;
}

function dateFor(day: number, month: number | undefined, today: string): string {
  const base = fromISO(today);
  let d = new Date(base.getFullYear(), month ?? base.getMonth(), day);
  // Дата уже прошла — значит, гость про следующий месяц или год.
  if (toISO(d) < today) {
    d = month === undefined ? new Date(base.getFullYear(), base.getMonth() + 1, day) : new Date(base.getFullYear() + 1, month, day);
  }
  return toISO(d);
}

function parseDates(text: string, today: string): { from: string; to: string } | undefined {
  const range = text.match(/(\d{1,2})\s*(?:-|–|—|по|до)\s*(\d{1,2})(?:\.(\d{1,2}))?/);
  if (range) {
    const month = range[3] ? Number(range[3]) - 1 : monthFromText(text);
    const from = dateFor(Number(range[1]), month, today);
    let to = dateFor(Number(range[2]), month, today);
    if (to <= from) to = addDays(from, 1);
    return { from, to };
  }
  if (/послезавтра/.test(text)) return { from: addDays(today, 2), to: addDays(today, 3) };
  if (/завтра/.test(text)) return { from: addDays(today, 1), to: addDays(today, 2) };
  if (/сегодня/.test(text)) return { from: today, to: addDays(today, 1) };
  if (/выходн/.test(text)) {
    const dow = fromISO(today).getDay();
    const toSaturday = (6 - dow + 7) % 7;
    const from = addDays(today, toSaturday);
    return { from, to: addDays(from, 1) };
  }
  const single = text.match(/(?:на|с)\s+(\d{1,2})(?:\.(\d{1,2}))?(?:\s|$|[^\d])/);
  if (single) {
    const month = single[2] ? Number(single[2]) - 1 : monthFromText(text);
    if (single[2] || month !== undefined) {
      const from = dateFor(Number(single[1]), month, today);
      return { from, to: addDays(from, 1) };
    }
  }
  return undefined;
}

function parsePeople(text: string): number | undefined {
  const m = text.match(/(\d{1,2})\s*(?:чел|гост|взросл|персон)/) ?? text.match(/нас\s+(\d{1,2})/);
  if (m) return Number(m[1]);
  if (/нас|будем|мы\s|едем|для/.test(text)) {
    for (const [re, n] of WORD_NUMBERS) if (re.test(text)) return n;
  }
  return undefined;
}

function parseKind(text: string): Unit["kind"] | undefined {
  if (/юрт/.test(text)) return "Юрта";
  if (/бешик/.test(text)) return "Бешик";
  if (/землян|домик/.test(text)) return "Земляной домик";
  return undefined;
}

function parsePhone(text: string): string | undefined {
  const m = text.match(/\+?\d[\d\s()-]{7,}\d/);
  return m ? m[0].trim() : undefined;
}

function priceList(state: State): string {
  const kinds = new Map<string, Unit>();
  for (const u of state.units) if (!kinds.has(u.kind)) kinds.set(u.kind, u);
  const lines = [...kinds.values()].map((u) => `• ${u.kind}: ${formatSom(u.price)} за ночь, до ${u.capacity} гостей`);
  return `Проживание в «Супара-Чункурчак»:\n${lines.join("\n")}\n\nНапишите даты и сколько вас, проверю, что свободно.`;
}

function options(state: State, s: ChatSession): Unit[] {
  if (!s.from || !s.to) return [];
  return freeUnits(state, s.from, s.to).filter(
    (u) => (!s.kind || u.kind === s.kind) && (!s.people || u.capacity >= s.people),
  );
}

export function guestBotReply(state: State, raw: string): { state: State; reply: string } {
  const text = raw.toLowerCase().replace(/ё/g, "е");
  const today = todayISO();
  const session: ChatSession = { ...state.session };

  const dates = parseDates(text, today);
  if (dates) Object.assign(session, dates);
  const people = parsePeople(text);
  if (people) session.people = people;
  const kind = parseKind(text);
  if (kind) session.kind = kind;
  const phone = parsePhone(raw);

  let next: State = { ...state, session };

  // Гость оставил телефон — оформляем заявку (не бронь: подтверждает человек).
  if (phone && session.from && session.to) {
    const unit = options(next, session)[0];
    if (!unit) {
      return { state: next, reply: `На ${formatRange(session.from, session.to)} подходящих вариантов уже нет. Напишите другие даты, проверю.` };
    }
    const name = raw.replace(phone, "").replace(/[,.;:!]/g, " ").replace(/\s+/g, " ").trim().split(" ").slice(0, 2).join(" ");
    const result = addBooking(next, {
      unitId: unit.id,
      guestName: name || "Гость из бота",
      guestPhone: phone,
      from: session.from,
      to: session.to,
      people: session.people ?? 2,
      source: "Бот",
      status: "request",
      createdBy: "agent",
    });
    if (result.error || !result.booking) return { state: next, reply: `Не получилось оформить заявку: ${result.error}. Передаю администратору.` };
    next = log(result.state, "guest_admin", `Принял заявку из бота: ${unit.name}, ${formatRange(session.from, session.to)}, тел. ${phone}. Ждёт подтверждения администратора.`);
    next = { ...next, session: {} };
    return {
      state: next,
      reply: `Заявка принята: ${unit.name}, ${formatRange(session.from, session.to)}, ${formatSom(result.booking.total)}.\nАдминистратор свяжется с вами и подтвердит бронь после предоплаты.`,
    };
  }

  if (session.from && session.to && (dates || people || kind)) {
    const free = options(next, session);
    const nights = nightsBetween(session.from, session.to);
    if (free.length === 0) {
      const any = freeUnits(next, session.from, session.to).filter((u) => !session.people || u.capacity >= session.people);
      const hint = any.length ? ` Свободно другое: ${[...new Set(any.map((u) => u.kind))].join(", ")}.` : " Попробуйте соседние даты.";
      return { state: next, reply: `На ${formatRange(session.from, session.to)} такого варианта нет.${hint}` };
    }
    const byKind = new Map<string, { unit: Unit; count: number }>();
    for (const u of free) {
      const cur = byKind.get(u.kind);
      if (cur) cur.count += 1;
      else byKind.set(u.kind, { unit: u, count: 1 });
    }
    const lines = [...byKind.values()].map(
      ({ unit, count }) => `• ${unit.kind} (свободно: ${count}), до ${unit.capacity} гостей: ${formatSom(unit.price * nights)} за ${nights} ноч.`,
    );
    return {
      state: next,
      reply: `На ${formatRange(session.from, session.to)} свободно:\n${lines.join("\n")}\n\nЧтобы оставить заявку, напишите имя и телефон.`,
    };
  }

  if (/цен|стоит|стоимост|прайс|почем|сколько/.test(text)) return { state: next, reply: priceList(next) };
  if (kind) return { state: next, reply: `${kind}: напишите даты заезда и выезда, проверю, свободно ли.` };
  if (/добрат|адрес|где\s|находит|дорог|ехать/.test(text)) {
    return { state: next, reply: "«Супара-Чункурчак» — урочище Чункурчак, около 40 км от Бишкека. Колл-центр: +996 553 787272, +996 554 961414." };
  }
  if (/ресторан|меню|кухн|поесть|еда/.test(text)) {
    return { state: next, reply: "Ресторан национальной кухни работает с 9:00 до 24:00. Стол можно забронировать через колл-центр: +996 553 787272." };
  }
  if (/брон|свобод|заброни|мест/.test(text)) {
    return { state: next, reply: "Напишите даты и сколько вас, например: «с 20 по 22, нас четверо»." };
  }
  if (/привет|салам|здравств|добрый|start/.test(text)) {
    return { state: next, reply: "Здравствуйте! Могу подсказать цены, проверить свободные даты и принять заявку на бронь. Что вас интересует?" };
  }
  if (/спасибо|рахмат/.test(text)) return { state: next, reply: "Рады помочь! Ждём вас в Супаре." };

  // Не понял — не выдумываем, а передаём человеку.
  const task: Task = {
    id: uid("t"),
    title: `Ответить гостю из бота: «${raw.slice(0, 80)}»`,
    assignee: "Администратор",
    due: today,
    done: false,
    createdBy: "agent",
  };
  next = { ...next, tasks: [task, ...next.tasks] };
  next = log(next, "guest_admin", `Не смог ответить на вопрос гостя, передал администратору: «${raw.slice(0, 80)}».`);
  return { state: next, reply: "Уточню у администратора и вернусь с ответом. Если срочно, позвоните: +996 553 787272." };
}

// ---------- Аналитик ----------

export interface Summary {
  total: number;
  occupiedToday: number;
  occupancyWeek: number; // доля 0..1 на ближайшие 7 ночей
  arrivals: { unit: string; guest: string; people: number }[];
  departures: { unit: string; guest: string }[];
  paidTotal: number;
  dueTotal: number;
  requests: number;
  overdueTasks: number;
}

export function summarize(state: State): Summary {
  const today = todayISO();
  const active = state.bookings.filter((b) => b.status !== "cancelled" && b.status !== "request");
  const unitName = (id: string) => state.units.find((u) => u.id === id)?.name ?? "—";
  const guestName = (id: string) => state.guests.find((g) => g.id === id)?.name ?? "Гость";

  const occupiedOn = (day: string) => active.filter((b) => b.from <= day && day < b.to).length;
  let weekNights = 0;
  for (let i = 0; i < 7; i++) weekNights += occupiedOn(addDays(today, i));

  return {
    total: state.units.length,
    occupiedToday: occupiedOn(today),
    occupancyWeek: state.units.length ? weekNights / (state.units.length * 7) : 0,
    arrivals: active
      .filter((b) => b.from === today && b.status === "confirmed")
      .map((b) => ({ unit: unitName(b.unitId), guest: guestName(b.guestId), people: b.people })),
    departures: active
      .filter((b) => b.to === today && b.status === "checked_in")
      .map((b) => ({ unit: unitName(b.unitId), guest: guestName(b.guestId) })),
    paidTotal: active.reduce((sum, b) => sum + b.paid, 0),
    dueTotal: active.filter((b) => b.status !== "checked_out").reduce((sum, b) => sum + (b.total - b.paid), 0),
    requests: state.bookings.filter((b) => b.status === "request").length,
    overdueTasks: state.tasks.filter((t) => !t.done && t.due < today).length,
  };
}

export function morningReport(state: State, showMoney: boolean): string {
  const s = summarize(state);
  const lines: string[] = [];
  lines.push(`Доброе утро! Сводка по Чункурчаку на ${formatDay(todayISO())}.`);
  lines.push("");
  lines.push(`Загрузка сегодня: ${s.occupiedToday} из ${s.total} (${Math.round((s.occupiedToday / Math.max(1, s.total)) * 100)}%).`);
  lines.push(`Загрузка на 7 дней: ${Math.round(s.occupancyWeek * 100)}%.`);
  lines.push(
    s.arrivals.length
      ? `Заезды сегодня: ${s.arrivals.map((a) => `${a.unit} (${a.guest}, ${a.people} чел.)`).join("; ")}.`
      : "Заездов сегодня нет.",
  );
  lines.push(s.departures.length ? `Выезды сегодня: ${s.departures.map((d) => `${d.unit} (${d.guest})`).join("; ")}.` : "Выездов сегодня нет.");
  if (showMoney) {
    lines.push("");
    lines.push(`Получено оплат: ${formatSom(s.paidTotal)}. Ждём доплат: ${formatSom(s.dueTotal)}.`);
  }
  const attention: string[] = [];
  if (s.requests) attention.push(`заявок без подтверждения: ${s.requests}`);
  if (s.overdueTasks) attention.push(`просроченных задач: ${s.overdueTasks}`);
  if (s.occupancyWeek < 0.4) attention.push("загрузка на неделю ниже 40%");
  lines.push("");
  lines.push(attention.length ? `Требует внимания: ${attention.join(", ")}.` : "Всё идёт по плану.");
  return lines.join("\n");
}

// ---------- Советы ----------
// Агент не только пересказывает цифры, но и говорит, что с ними делать.

export interface Advice {
  tone: "money" | "warn" | "idea";
  title: string;
  text: string;
}

export function adviceFor(state: State): Advice[] {
  const today = todayISO();
  const out: Advice[] = [];
  const active = state.bookings.filter((b) => b.status !== "cancelled" && b.status !== "request");
  const unitName = (id: string) => state.units.find((u) => u.id === id)?.name ?? "объект";

  // Ближайшая суббота: сколько объектов простаивает.
  const saturday = addDays(today, (6 - fromISO(today).getDay() + 7) % 7);
  const busy = active.filter((b) => b.from <= saturday && saturday < b.to).length;
  const free = state.units.length - busy;
  if (free / Math.max(1, state.units.length) >= 0.4) {
    const regulars = state.guests.filter((g) => g.tags.includes("постоянный")).length;
    out.push({
      tone: "money",
      title: `Суббота ${formatDay(saturday)}: свободно ${free} из ${state.units.length}`,
      text: `Разослать предложение постоянным гостям (${regulars}).`,
    });
  }

  const soon = active.filter((b) => b.status === "confirmed" && b.from <= addDays(today, 2) && b.paid < b.total);
  if (soon.length) {
    const sum = soon.reduce((s, b) => s + (b.total - b.paid), 0);
    out.push({
      tone: "money",
      title: `Не внесён остаток: ${formatSom(sum)}`,
      text: `${soon.map((b) => unitName(b.unitId)).join(", ")} — напомнить до заезда.`,
    });
  }

  const requests = state.bookings.filter((b) => b.status === "request");
  if (requests.length) {
    out.push({
      tone: "warn",
      title: `Заявок без ответа: ${requests.length}`,
      text: "Подтвердить или позвонить сегодня.",
    });
  }

  const overdue = state.tasks.filter((t) => !t.done && t.due < today);
  if (overdue.length) {
    out.push({
      tone: "warn",
      title: `Просроченных задач: ${overdue.length}`,
      text: overdue[0].title,
    });
  }

  const bySource = new Map<string, number>();
  for (const b of active) bySource.set(b.source, (bySource.get(b.source) ?? 0) + 1);
  const top = [...bySource.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && active.length >= 5) {
    out.push({
      tone: "idea",
      title: `Главный источник: ${top[0]}`,
      text: `${top[1]} из ${active.length} броней.`,
    });
  }

  return out.slice(0, 4);
}
