// Сценарии «живых» процессов для демо интеграций: диалоги в каналах, звонки, качество сервиса, устройства.
// Настоящих каналов здесь нет — это проигрываемые сценарии с вымышленными гостями и сотрудниками.
// Реальная серверная часть (вебхуки, очередь, адаптеры) — в закрытом репозитории supara-platform.

export type Chan = "whatsapp" | "instagram" | "telegram";

export const CHAN: Record<Chan, { label: string; dot: string }> = {
  whatsapp: { label: "WhatsApp", dot: "bg-[#7FB79A]" },
  instagram: { label: "Instagram", dot: "bg-[#CF8496]" },
  telegram: { label: "Telegram", dot: "bg-[#86AACB]" },
};

export interface ThreadLine {
  from: "guest" | "agent";
  text: string;
}

export interface Thread {
  id: string;
  channel: Chan;
  location: string;
  guest: string;
  outcome: string;
  human: boolean; // передано человеку
  lines: ThreadLine[];
}

export const THREADS: Thread[] = [
  {
    id: "t1",
    channel: "whatsapp",
    location: "Чункурчак",
    guest: "Айгерим",
    outcome: "Заявка создана",
    human: false,
    lines: [
      { from: "guest", text: "Здравствуйте! Есть юрта на эти выходные? Нас четверо." },
      { from: "agent", text: "Здравствуйте! Я AI-ассистент Супары. На субботу свободна юрта на четверых, 6 000 сом за ночь. Оформить заявку?" },
      { from: "guest", text: "Да, на одну ночь." },
      { from: "agent", text: "Заявка оформлена. Администратор подтвердит бронь после предоплаты и напишет вам сюда же." },
    ],
  },
  {
    id: "t2",
    channel: "instagram",
    location: "Этно-комплекс",
    guest: "nurlan.k",
    outcome: "Передано менеджеру",
    human: true,
    lines: [
      { from: "guest", text: "Сколько стоит банкет на 40 человек в юрте?" },
      { from: "agent", text: "Здравствуйте! Я AI-ассистент Супары. На 40 гостей подойдёт Большая юрта. Смету считает менеджер по банкетам — передаю ему ваш запрос, он ответит здесь." },
    ],
  },
  {
    id: "t3",
    channel: "telegram",
    location: "Талкан",
    guest: "Жанара",
    outcome: "Заказ создан",
    human: false,
    lines: [
      { from: "guest", text: "Можно 20 подарочных наборов в деревянной упаковке к пятнице?" },
      { from: "agent", text: "Здравствуйте! Я AI-ассистент Супары. Да, 20 наборов в дереве к пятнице успеваем. Оформить заказ?" },
      { from: "guest", text: "Оформляйте." },
      { from: "agent", text: "Заказ принят и передан в производство. Менеджер пришлёт счёт." },
    ],
  },
  {
    id: "t4",
    channel: "whatsapp",
    location: "Этно-комплекс",
    guest: "Гость ресторана",
    outcome: "Жалоба — управляющему",
    human: true,
    lines: [
      { from: "guest", text: "Вчера ждали горячее почти час. Очень недовольны." },
      { from: "agent", text: "Мне жаль, что так вышло. Я AI-ассистент Супары и сразу передаю ваше обращение управляющему — он свяжется с вами сегодня." },
    ],
  },
];

// Путь сообщения через систему.
export const PIPELINE = ["Вебхук", "Очередь", "Агент", "Ответ"];

export interface CallLine {
  who: "Сотрудник" | "Гость";
  text: string;
}

export interface CallScript {
  id: string;
  employee: string;
  role: string;
  location: string;
  duration: string;
  lines: CallLine[];
  criteria: { name: string; score: number }[];
  total: number;
  tips: string[];
  flag?: string;
}

export const CALLS: CallScript[] = [
  {
    id: "c1",
    employee: "Алия",
    role: "ресепшен",
    location: "Чункурчак",
    duration: "1:42",
    lines: [
      { who: "Сотрудник", text: "Супара-Чункурчак, Алия, здравствуйте! Разговор записывается для контроля качества." },
      { who: "Гость", text: "Здравствуйте, хотим приехать в субботу вдвоём, что у вас есть?" },
      { who: "Сотрудник", text: "На двоих подойдёт бешик, 4 500 сом за ночь. Могу сразу предложить баню на вечер." },
      { who: "Гость", text: "Давайте с баней. Мой номер [телефон]." },
      { who: "Сотрудник", text: "Записала. Бронь закрепим после предоплаты, ссылку пришлю в WhatsApp." },
    ],
    criteria: [
      { name: "Приветствие", score: 10 },
      { name: "Выявление потребности", score: 8 },
      { name: "Допуслуги", score: 10 },
      { name: "Закрытие на бронь", score: 9 },
      { name: "Тон", score: 9 },
    ],
    total: 9.2,
    tips: ["Уточняйте даты выезда — в разговоре прозвучал только заезд.", "Хорошо предложена баня: так держать."],
  },
  {
    id: "c2",
    employee: "Тимур",
    role: "ресепшен",
    location: "Этно-комплекс",
    duration: "0:58",
    lines: [
      { who: "Сотрудник", text: "Алло." },
      { who: "Гость", text: "Здравствуйте, это Супара? Хотим стол на вечер на шестерых." },
      { who: "Сотрудник", text: "На вечер всё занято." },
      { who: "Гость", text: "А на завтра?" },
      { who: "Сотрудник", text: "Не знаю, перезвоните завтра." },
    ],
    criteria: [
      { name: "Приветствие", score: 2 },
      { name: "Выявление потребности", score: 4 },
      { name: "Допуслуги", score: 0 },
      { name: "Закрытие на бронь", score: 1 },
      { name: "Тон", score: 4 },
    ],
    total: 2.4,
    tips: ["Назовите заведение и своё имя в начале разговора.", "Предложите другое время или зал, а не отказ.", "Запишите контакт гостя и перезвоните сами."],
    flag: "Отказ без альтернативы — упущенная бронь",
  },
];

export interface RecentCall {
  id: string;
  when: string;
  employee: string;
  location: string;
  duration: string;
  score: number;
  result: string;
}

export const RECENT_CALLS: RecentCall[] = [
  { id: "r1", when: "10:14", employee: "Бекзат · продажи", location: "Чункурчак", duration: "3:05", score: 8.6, result: "Бронь" },
  { id: "r2", when: "09:52", employee: "Мадина · колл-центр", location: "Этно-комплекс", duration: "1:20", score: 7.9, result: "Стол на 19:00" },
  { id: "r3", when: "09:31", employee: "Алия · ресепшен", location: "Чункурчак", duration: "2:11", score: 9.0, result: "Бронь" },
  { id: "r4", when: "09:07", employee: "Тимур · ресепшен", location: "Этно-комплекс", duration: "0:46", score: 4.1, result: "Без результата" },
];

export interface Rated {
  name: string;
  role: string;
  score: number;
  calls: number;
  conversion?: number; // звонок → бронь, %
  trend: number;
}

export const RATING: Rated[] = [
  { name: "Алия", role: "ресепшен · Чункурчак", score: 9.1, calls: 46, trend: 0.3 },
  { name: "Бекзат", role: "продажи · Чункурчак", score: 8.4, calls: 61, conversion: 41, trend: 0.5 },
  { name: "Мадина", role: "колл-центр · Этно-комплекс", score: 7.8, calls: 88, trend: -0.1 },
  { name: "Тимур", role: "ресепшен · Этно-комплекс", score: 5.2, calls: 39, trend: -0.9 },
];

export interface Site {
  name: string;
  cameras: [number, number]; // на связи / всего
  sensors: { name: string; value: number; unit: string; jitter: number }[];
  door: string;
}

export const SITES: Site[] = [
  {
    name: "Чункурчак",
    cameras: [8, 8],
    door: "КПП закрыт",
    sensors: [
      { name: "Улица", value: 9, unit: "°C", jitter: 0.4 },
      { name: "Шум у юрт", value: 38, unit: "дБ", jitter: 3 },
    ],
  },
  {
    name: "Этно-комплекс",
    cameras: [11, 12],
    door: "Касса закрыта",
    sensors: [
      { name: "Холодильная камера", value: 4, unit: "°C", jitter: 0.3 },
      { name: "Шум в зале", value: 61, unit: "дБ", jitter: 4 },
    ],
  },
  {
    name: "Талкан",
    cameras: [4, 4],
    door: "Склад закрыт",
    sensors: [
      { name: "Склад", value: 18, unit: "°C", jitter: 0.3 },
      { name: "Влажность", value: 44, unit: "%", jitter: 1 },
    ],
  },
];

export interface DeviceEvent {
  site: string;
  text: string;
  level: "info" | "warning";
}

export const DEVICE_EVENTS: DeviceEvent[] = [
  { site: "Чункурчак", text: "Движение у КПП: въезд автомобиля", level: "info" },
  { site: "Этно-комплекс", text: "Камера «Парковка» не на связи", level: "warning" },
  { site: "Талкан", text: "Температура склада в норме", level: "info" },
  { site: "Этно-комплекс", text: "Шум в зале выше 70 дБ", level: "warning" },
  { site: "Чункурчак", text: "Дверь бани открыта", level: "info" },
  { site: "Талкан", text: "Движение на складе: смена на месте", level: "info" },
  { site: "Этно-комплекс", text: "Камера «Парковка» снова на связи", level: "info" },
];

export const ALERT = { site: "Этно-комплекс", text: "Дверь кассы открыта вне смены", time: "23:14" };

// Короткая лента «что происходит сейчас» для приветственного экрана.
export const NOW_FEED = [
  "WhatsApp · Чункурчак: гостю ответили за 6 секунд, заявка создана",
  "Звонок на ресепшен Чункурчака разобран: оценка 9,2",
  "Instagram · Этно-комплекс: запрос на банкет передан менеджеру",
  "Датчики: холодильная камера 4 °C, всё в норме",
  "Telegram · Талкан: заказ на 20 наборов принят",
  "Камеры: 23 из 24 на связи",
];
