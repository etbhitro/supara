import Link from "next/link";
import { ArrowRight, BellRing, ClipboardCheck, Database, Eye, KeyRound, MessageCircle, ScrollText, ShieldCheck } from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/Brand";
import { AGENTS } from "@/lib/agents";

const BASE = process.env.NEXT_PUBLIC_BASE ?? "";

// Что агент читает и что из этого получает владелец.
const SOURCES = ["Битрикс24: сделки и контакты", "Звонки колл-центра", "Брони и номерной фонд", "Касса и оплаты", "Сайт, Instagram, WhatsApp"];
const OUTPUTS = [
  { icon: MessageCircle, title: "Сводка в Telegram", text: "Каждое утро и вечер, без звонков управляющему" },
  { icon: BellRing, title: "Советы и тревоги", text: "Где теряются деньги и что сделать сегодня" },
  { icon: ClipboardCheck, title: "Задачи персоналу", text: "Уборка, подготовка, закупка — с контролем срока" },
];

// Примеры: так выглядят советы на демо-данных.
const ADVICE = [
  { tag: "Деньги", title: "На субботу свободно 6 юрт из 11", text: "В базе 14 постоянных гостей. Отправьте им предложение на выходные — рассылку подготовил, нужно ваше «да»." },
  { tag: "Внимание", title: "3 заявки ждут ответа дольше двух часов", text: "Две из Instagram, одна с сайта. Администратор сегодня отвечает медленнее обычного." },
  { tag: "Деньги", title: "Группа заезжает завтра, остаток не внесён", text: "38 000 сом по двум юртам. Напомнить гостю об оплате до приезда?" },
  { tag: "Идея", title: "Турагентства дают половину броней", text: "И почти все на будни. Предложите им пакет с баней и ужином — будни загружены слабее всего." },
];

const LOCATIONS = [
  { name: "Этно-комплекс", place: "с. Кок-Жар", items: ["Бронь столов и юрт-залов", "Музей: билеты и группы", "Банкеты и той со сметой"] },
  { name: "Супара-Чункурчак", place: "урочище Чункурчак", items: ["Юрты, бешики, земляной домик", "Шахматка без двойных броней", "Заезд, выезд, уборка, оплата"] },
  { name: "Супара Талкан", place: "производство", items: ["Заказы и подарочные наборы", "Партии, сырьё, остатки", "Себестоимость и маржа"] },
];

const SAFETY = [
  { icon: Database, title: "Своя база и свой сервер", text: "Данные Супары лежат отдельно от любых других проектов, со своими ключами." },
  { icon: KeyRound, title: "Каждый видит своё", text: "Администратор не видит финансы, персонал — только свои задачи, управляющий — только свою локацию." },
  { icon: ScrollText, title: "Всё записано", text: "Кто, что и когда открыл или изменил — и люди, и агенты. Журнал нельзя подчистить." },
  { icon: ShieldCheck, title: "Деньги решает человек", text: "Возврат, скидку и списание агент только предлагает. Подтверждаете вы." },
];

const STAGES = [
  { n: "01", title: "Ядро", time: "1–2 недели", text: "Брони, шахматка, гости, оплаты. Можно вести всё в системе вместо тетради." },
  { n: "02", title: "Гостевой бот и задачи", time: "1–2 недели", text: "Бот принимает заявки ночью, персонал получает задачи сам." },
  { n: "03", title: "Деньги и отчёты", time: "1 неделя", text: "Доходы, расходы, дашборд и сводки владельцу в Telegram." },
  { n: "04", title: "Кухня, склад, мероприятия", time: "1–2 недели", text: "Меню, остатки, закупки, банкеты со сметой и чек-листами." },
  { n: "05", title: "Координатор и аналитика", time: "1–2 недели", text: "Вопросы к данным голосом: «сколько заработали за выходные?»" },
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden bg-ink text-stone-200">
      {/* ---------- Первый экран ---------- */}
      <header className="relative isolate min-h-[100svh]">
        <img
          src={`${BASE}/img/chunkurchak.jpg`}
          srcSet={`${BASE}/img/chunkurchak-960.jpg 960w, ${BASE}/img/chunkurchak.jpg 1920w`}
          sizes="100vw"
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/80 via-ink/60 to-ink" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_30%,transparent,rgba(26,19,14,0.75))]" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 md:px-8">
          <BrandLockup />
          <Link href="/demo/" className="rounded-full border border-accent/50 px-5 py-2 text-sm font-semibold text-accent-300 transition hover:bg-accent hover:text-ink-900">
            Открыть демо
          </Link>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-20">
          <div className="animate-rise">
            <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-accent-400">
              <span className="h-px w-10 bg-accent-500" />
              Цифровой управляющий
            </p>
            <h1 className="font-display text-[clamp(2.9rem,7.4vw,5.6rem)] font-semibold leading-[0.95] text-stone-50">
              Весь бизнес Супары <em className="text-accent-400">на одном экране</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-stone-300">
              Битрикс24 остаётся. Поверх него работают AI-агенты: читают сделки, брони и кассу, каждое утро присылают сводку и говорят,
              что сделать сегодня.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/demo/" className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-bold text-ink-900 shadow-[0_10px_40px_rgba(217,164,65,0.35)] transition hover:bg-accent-400">
                Посмотреть в работе
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <a href="#how" className="text-sm font-semibold text-stone-300 underline decoration-accent/60 underline-offset-4 hover:text-stone-50">
                Как это устроено
              </a>
            </div>
          </div>

          {/* Пример утренней сводки */}
          <div className="animate-rise [animation-delay:200ms] lg:justify-self-end">
            <div className="w-full max-w-[380px] rounded-[2rem] border border-white/15 bg-ink-800/90 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="flex items-center gap-3 border-b border-white/10 px-3 pb-3 pt-2">
                <BrandMark size={34} />
                <div>
                  <div className="text-sm font-bold text-stone-50">Супара · владельцу</div>
                  <div className="text-[11px] text-emerald-400">агент на связи</div>
                </div>
                <span className="ml-auto text-[11px] text-muted-300">09:00</span>
              </div>
              <div className="space-y-2.5 px-2 py-4 text-[13.5px] leading-relaxed">
                <div className="rounded-2xl rounded-bl-md bg-ink-600 px-4 py-3 text-stone-100">
                  Доброе утро! Чункурчак: занято <b>8 из 11</b>, сегодня 3 заезда и 2 выезда. За вчера получено <b>96 000 сом</b>.
                </div>
                <div className="rounded-2xl rounded-bl-md border border-accent/40 bg-accent/10 px-4 py-3 text-stone-100">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-accent-300">Совет</span>
                  На субботу свободно 6 юрт. Разослать предложение 14 постоянным гостям?
                </div>
                <div className="ml-auto w-fit rounded-2xl rounded-br-md bg-accent px-4 py-2.5 font-semibold text-ink-900">Да, отправляй</div>
                <div className="rounded-2xl rounded-bl-md bg-ink-600 px-4 py-3 text-stone-100">Отправил. Вечером покажу, кто забронировал.</div>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-stone-400 lg:max-w-[380px]">Пример сводки. Цифры условные.</p>
          </div>
        </div>
      </header>

      {/* ---------- Цели запуска ---------- */}
      <section className="border-y border-white/10 bg-ink-800">
        <div className="mx-auto grid max-w-6xl gap-px bg-white/10 md:grid-cols-3">
          {[
            ["< 2 мин", "ответ гостю в любое время суток"],
            ["0", "двойных броней на один объект"],
            ["9:00", "сводка у владельца, без ручной работы"],
          ].map(([big, small]) => (
            <div key={big} className="bg-ink-800 px-6 py-9 text-center md:px-8">
              <div className="font-display text-6xl font-semibold text-accent-400">{big}</div>
              <div className="mt-2 text-sm text-stone-300">{small}</div>
            </div>
          ))}
        </div>
        <p className="pb-4 text-center text-[11px] uppercase tracking-[0.18em] text-muted-400">Цели, под которые строится система</p>
      </section>

      {/* ---------- Битрикс хранит, агент думает ---------- */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <Kicker>Как это устроено</Kicker>
        <h2 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] text-stone-50">
          Битрикс хранит. <em className="text-accent-400">Агент думает.</em>
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
          Ничего не нужно переносить и никого переучивать. Сотрудники работают как привыкли, а система подключается к тому, что уже
          есть, и превращает разрозненные записи в понятную картину для владельца.
        </p>

        <div className="mt-14 grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <ul className="space-y-2.5">
            {SOURCES.map((s) => (
              <li key={s} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-stone-100">
                <Eye size={16} className="shrink-0 text-accent-400" />
                {s}
              </li>
            ))}
          </ul>

          <div className="relative mx-auto mb-8 grid h-56 w-56 place-items-center lg:mb-0">
            <div className="absolute inset-0 animate-spin-slow opacity-90">
              <BrandMark size={224} />
            </div>
            <div className="absolute inset-[52px] rounded-full bg-ink shadow-[0_0_50px_rgba(217,164,65,0.45)]" />
            <div className="relative font-display text-2xl font-semibold leading-none text-stone-50">AI-агенты</div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-accent-400">
              читают · считают · советуют
            </div>
          </div>

          <ul className="space-y-2.5">
            {OUTPUTS.map((o) => (
              <li key={o.title} className="rounded-xl border border-accent/30 bg-accent/[0.07] px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-stone-50">
                  <o.icon size={16} className="shrink-0 text-accent-400" />
                  {o.title}
                </div>
                <div className="mt-1 pl-[26px] text-xs text-stone-300">{o.text}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Что агент скажет утром ---------- */}
      <section className="relative bg-ink-800">
        <Ornament />
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-28">
          <Kicker>Не отчёты, а решения</Kicker>
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] text-stone-50">
            Что агент скажет вам <em className="text-accent-400">завтра утром</em>
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {ADVICE.map((a) => (
              <article key={a.title} className="group rounded-2xl border border-white/10 bg-ink p-6 transition hover:-translate-y-1 hover:border-accent/50">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-400">{a.tag}</span>
                <h3 className="mt-2 font-display text-[1.7rem] font-semibold leading-tight text-stone-50">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-300">{a.text}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-300">Примеры на условных данных. В демо советы считаются по бронями и задачам, которые вы меняете сами.</p>
        </div>
        <Ornament />
      </section>

      {/* ---------- Три направления ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative">
            <img src={`${BASE}/img/tunduk.jpg`} alt="Тундук юрты, вид изнутри" loading="lazy" className="aspect-[4/5] w-full rounded-[2rem] object-cover" />
            <div className="absolute -bottom-5 -right-3 rounded-2xl border border-accent/40 bg-ink px-5 py-4 shadow-2xl md:-right-6">
              <div className="font-display text-4xl font-semibold leading-none text-accent-400">3 → 1</div>
              <div className="mt-1 text-xs text-stone-300">три направления, одна картина</div>
            </div>
          </div>
          <div>
            <Kicker>Вся группа сразу</Kicker>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.02] text-stone-50">
              Ресторан, отель и производство — <em className="text-accent-400">под одной крышей</em>
            </h2>
            <div className="mt-9 space-y-4">
              {LOCATIONS.map((l) => (
                <div key={l.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl font-semibold text-stone-50">{l.name}</h3>
                    <span className="text-xs text-muted-200">{l.place}</span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-300">
                    {l.items.map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1 w-1 rounded-full bg-accent-500" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Команда агентов ---------- */}
      <section className="bg-ink-800">
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-28">
          <Kicker>Кто работает на вас</Kicker>
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] text-stone-50">
            Восемь сотрудников, которые <em className="text-accent-400">не уходят домой</em>
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {AGENTS.map((a, i) => (
              <div key={a.id} className="bg-ink-800 p-6 transition hover:bg-ink-700">
                <div className="font-display text-3xl font-semibold text-accent-500/70">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 text-base font-bold text-stone-50">{a.name}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-stone-300">{a.does}</p>
                {a.live && <span className="mt-3 inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">уже в демо</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Безопасность ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
        <Kicker>Данные под замком</Kicker>
        <h2 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] text-stone-50">
          Агент много видит. <em className="text-accent-400">И мало может без вас.</em>
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {SAFETY.map((s) => (
            <div key={s.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-400">
                <s.icon size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-50">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-300">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Этапы ---------- */}
      <section className="relative bg-ink-800">
        <Ornament />
        <div className="mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-28">
          <Kicker>Как запускаем</Kicker>
          <h2 className="max-w-3xl font-display text-[clamp(2.2rem,5vw,3.8rem)] font-semibold leading-[1.02] text-stone-50">
            Первый рабочий результат — <em className="text-accent-400">через две недели</em>
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-stone-300">
            Запускаем по частям. Каждый этап заканчивается тем, чем уже можно пользоваться, а не обещанием.
          </p>
          <ol className="mt-12 space-y-3">
            {STAGES.map((s) => (
              <li key={s.n} className="grid items-baseline gap-x-6 gap-y-1 rounded-2xl border border-white/10 bg-ink px-6 py-5 md:grid-cols-[auto_1fr_auto]">
                <span className="font-display text-4xl font-semibold leading-none text-accent-400">{s.n}</span>
                <div>
                  <h3 className="text-lg font-bold text-stone-50">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-stone-300">{s.text}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-200">{s.time}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted-200">Дальше по мере необходимости: маркетинг и платежи, контроль качества звонков, камеры и датчики.</p>
        </div>
      </section>

      {/* ---------- Финал ---------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-[0.07]">
          <BrandMark size={720} />
        </div>
        <div className="mx-auto max-w-3xl px-5 py-28 text-center md:py-36">
          <h2 className="font-display text-[clamp(2.6rem,6.5vw,4.8rem)] font-semibold leading-[0.98] text-stone-50">
            Лучше один раз <em className="text-accent-400">увидеть</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-stone-300">
            Демо уже работает: шахматка броней, гости, задачи и бот, которому можно написать как гость.
          </p>
          <Link href="/demo/" className="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-9 py-4 text-lg font-bold text-ink-900 shadow-[0_10px_50px_rgba(217,164,65,0.4)] transition hover:bg-accent-400">
            Открыть демо
            <ArrowRight size={20} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-[11px] leading-relaxed text-muted-300 md:px-8">
        <p>Демо-версия. Гости, брони и цифры на этой странице условные.</p>
        <p className="mt-1">
          Фото:{" "}
          <a className="underline hover:text-stone-200" href="https://commons.wikimedia.org/wiki/File:Chunkurchak_pano_view.jpg" target="_blank" rel="noopener">
            Vilya Shoni
          </a>
          ,{" "}
          <a className="underline hover:text-stone-200" href="https://commons.wikimedia.org/wiki/File:The_T%C3%BCnd%C3%BCk.jpg" target="_blank" rel="noopener">
            Ataian
          </a>{" "}
          · Wikimedia Commons · CC BY-SA 4.0
        </p>
      </footer>
    </div>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-accent-400">
      <span className="h-px w-10 bg-accent-500" />
      {children}
    </p>
  );
}

// Орнаментальная кайма: цепочка ромбов, как на войлочном ковре.
function Ornament() {
  return (
    <svg className="block h-4 w-full text-accent-500/50" aria-hidden>
      <defs>
        <pattern id="orn" width="32" height="16" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 1 L16 8 L8 15 Z M16 8 L24 1 L32 8 L24 15 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="8" cy="8" r="1.4" fill="currentColor" />
          <circle cx="24" cy="8" r="1.4" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="16" fill="url(#orn)" />
    </svg>
  );
}
