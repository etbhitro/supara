// Координатор: понимает запрос владельца и решает, что развернуть в ответ.
// Работает по ключевым словам; с сервером его заменит агент на Claude с тем же контрактом.

import { adviceFor, funnel, parseDates, salesQueue, summarize } from "./agents";
import { addDays, formatRange, formatSom, todayISO } from "./format";
import { ethnoStats, talkanStats } from "./locations";
import { freeUnits, type State, type View } from "./store";

export interface Reply {
  text: string;
  view?: View;
}

// Быстрые запросы под строкой ввода.
export const PROMPTS = ["Сводка", "Чункурчак", "Этно-комплекс", "Талкан", "Деньги", "Что делать сегодня?", "Команда"];

function plural(n: number, one: string, few: string, many: string): string {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return one;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

export function statusLine(state: State): string {
  const s = summarize(state);
  const e = ethnoStats(state);
  const t = talkanStats(state);
  return [
    `Чункурчак ${s.occupiedToday} из ${s.total}`,
    `ресторан: ${e.today} ${plural(e.today, "бронь", "брони", "броней")}`,
    `Талкан: ${t.active} ${plural(t.active, "заказ", "заказа", "заказов")}`,
  ].join(" · ");
}

// Какое фото показать на фоне для ответа.
export function sceneOf(view: View | undefined): "chunkurchak" | "ethno" | "talkan" {
  if (view?.kind === "ethno") return "ethno";
  if (view?.kind === "talkan") return "talkan";
  return "chunkurchak";
}

export function route(state: State, raw: string): Reply {
  const text = raw.toLowerCase().replace(/ё/g, "е");
  const today = todayISO();
  const s = summarize(state);

  if (/что делать|совет|внимани|проблем|аналит/.test(text)) {
    const n = adviceFor(state).length;
    return n ? { text: `${n} ${plural(n, "вопрос требует", "вопроса требуют", "вопросов требуют")} внимания.`, view: { kind: "advice" } } : { text: "Всё идёт по плану." };
  }
  if (/этно|ресторан|столик|столы|банкет|кок-жар|музей/.test(text)) {
    const e = ethnoStats(state);
    return { text: `Сегодня ${e.today} ${plural(e.today, "бронь", "брони", "броней")}, ${e.guests} гостей.`, view: { kind: "ethno" } };
  }
  if (/талкан|конфет|шоколад|производств|набор/.test(text)) {
    const t = talkanStats(state);
    return { text: `В работе ${t.active} ${plural(t.active, "заказ", "заказа", "заказов")} на ${formatSom(t.sum)}.`, view: { kind: "talkan" } };
  }
  if (/чункурчак|проживан|юрт|бешик/.test(text)) {
    return { text: `Занято ${s.occupiedToday} из ${s.total}, загрузка на неделю ${Math.round(s.occupancyWeek * 100)}%.`, view: { kind: "summary" } };
  }
  if (/команд|сотрудник|агент/.test(text)) return { text: "Восемь сотрудников на связи.", view: { kind: "team" } };
  if (/роп|воронк|конверс/.test(text)) {
    return { text: `Конверсия ${Math.round(funnel(state).conversion * 100)}%.`, view: { kind: "funnel" } };
  }
  if (/маркет|канал|акци|реклам|источник/.test(text)) return { text: "Откуда приходят гости.", view: { kind: "marketing" } };
  if (/парсер|рынок|новост|конкурент/.test(text)) return { text: "Свежее по рынку.", view: { kind: "market" } };
  if (/продаж|напомин|дожать|долг/.test(text)) {
    const n = salesQueue(state).length;
    return { text: n ? `В работе у продаж: ${n}.` : "У продаж всё закрыто.", view: n ? { kind: "sales" } : undefined };
  }
  if (/администратор|бот/.test(text)) return { text: "Гостевой бот. Напишите ему как гость.", view: { kind: "guestbot" } };
  if (/заявк/.test(text)) {
    const n = state.bookings.filter((b) => b.status === "request").length;
    return n ? { text: `${n} ${plural(n, "заявка ждёт", "заявки ждут", "заявок ждут")} подтверждения.`, view: { kind: "requests" } } : { text: "Новых заявок нет." };
  }
  if (/задач|просроч|уборк|операц|обход/.test(text)) {
    const open = state.tasks.filter((t) => !t.done);
    const overdue = open.filter((t) => t.due < today).length;
    return { text: `Открыто ${open.length}${overdue ? `, просрочено ${overdue}` : ""}.`, view: { kind: "tasks" } };
  }
  if (/деньг|заработ|выручк|оплат|касс|финанс|доход|чек/.test(text)) {
    const all = s.paidTotal + ethnoStats(state).prepaid + talkanStats(state).paid;
    return { text: `По группе получено ${formatSom(all)}.`, view: { kind: "money" } };
  }
  const dates = parseDates(text, today);
  if (/свобод|мест/.test(text) || dates) {
    const from = dates?.from ?? today;
    const to = dates?.to ?? addDays(today, 1);
    const free = freeUnits(state, from, to).length;
    return { text: `${formatRange(from, to)}: свободно ${free} из ${state.units.length}.`, view: { kind: "free", from, to } };
  }
  if (/брон|шахматк|календар|занят|загруз/.test(text)) return { text: "Шахматка Чункурчака на две недели.", view: { kind: "board" } };
  if (/гост|клиент/.test(text)) return { text: `В базе ${state.guests.length} гостей.`, view: { kind: "guests" } };
  return { text: "Три направления, одна картина.", view: { kind: "group" } };
}
