// Парсер рынка: читает RSS новостных сайтов КР, оставляет новости про туризм и отдых
// и пишет их в public/data/market.json. Запускается в GitHub Actions перед сборкой
// (при каждом push и по расписанию), сервер не нужен.
// Источники — те же, что у market_scout в ulut-baatyry-agent (robots.txt разрешает RSS).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FEEDS = [
  { name: "24.kg", url: "https://24.kg/rss/" },
  { name: "kaktus.media", url: "https://kaktus.media/?rss" },
  { name: "kabar.kg", url: "https://kabar.kg/rss/" },
  { name: "economist.kg", url: "https://economist.kg/feed/" },
  { name: "sputnik.kg", url: "https://ru.sputnik.kg/export/rss2/archive/index.xml" },
  { name: "tourism.gov.kg", url: "https://tourism.gov.kg/feed/" },
];

// Новость попадает в ленту, если в заголовке есть одна из основ (по анонсу слишком много шума).
const KEYWORDS = [
  "турис", "туроп", "турпоток", "курорт", "отел", "гостиниц", "пансионат", "гостев", "юрт", "этно",
  "отдых", "путешеств", "иссык-кул", "чункурчак", "ала-арч", "ресторан", "общепит", "кафе",
  "авиарейс", "безвиз", "этнофест", "кочевник", "горнолыж", "экотур", "резорт", "погода в кыргызстане", "афиша", "нерабочи",
];

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/data/market.json");
const MAX_ITEMS = 40;
const MAX_AGE_DAYS = 60;

function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

async function readFeed(feed) {
  const res = await fetch(feed.url, {
    headers: { "User-Agent": "supara-market-parser/1.0 (+https://github.com/etbhitro/supara)" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml = await res.text();
  const items = [];
  for (const [, block] of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)) {
    const title = tag(block, "title");
    const url = tag(block, "link");
    const date = new Date(tag(block, "pubDate"));
    if (!title || !/^https?:\/\//.test(url) || Number.isNaN(date.getTime())) continue;
    items.push({ title, url, source: feed.name, date: date.toISOString() });
  }
  return items;
}

const results = await Promise.allSettled(FEEDS.map(readFeed));
const sources = [];
let found = [];
results.forEach((r, i) => {
  if (r.status === "fulfilled") {
    const hits = r.value.filter((it) => KEYWORDS.some((k) => it.title.toLowerCase().includes(k)));
    sources.push({ name: FEEDS[i].name, read: r.value.length, matched: hits.length });
    found = found.concat(hits);
  } else {
    sources.push({ name: FEEDS[i].name, read: 0, matched: 0, error: String(r.reason?.message ?? r.reason) });
  }
});

// Прошлые находки сохраняем: в RSS новости живут недолго.
let previous = [];
try {
  previous = JSON.parse(await readFile(OUT, "utf8")).items ?? [];
} catch {
  previous = [];
}
const oldest = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000).toISOString();
const seen = new Set();
const items = [...found, ...previous]
  .filter((it) => it.date >= oldest)
  .filter((it) => (seen.has(it.url) ? false : (seen.add(it.url), true)))
  .sort((a, b) => b.date.localeCompare(a.date))
  .slice(0, MAX_ITEMS);

await mkdir(dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), sources, items }, null, 1));
console.log(`market: ${items.length} items (${found.length} new matches)`);
for (const s of sources) console.log(` ${s.name}: ${s.error ? `ошибка ${s.error}` : `${s.matched} из ${s.read}`}`);
