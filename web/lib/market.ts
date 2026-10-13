"use client";

// Находки парсера рынка. Файл собирает scripts/parse-market.mjs в GitHub Actions.

import { useEffect, useState } from "react";

export interface MarketItem {
  title: string;
  url: string;
  source: string;
  date: string;
}

export interface Market {
  fetchedAt: string;
  items: MarketItem[];
}

const BASE = process.env.NEXT_PUBLIC_BASE ?? "";

export function useMarket(): Market | null {
  const [market, setMarket] = useState<Market | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${BASE}/data/market.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Market | null) => {
        if (alive && data && Array.isArray(data.items)) setMarket(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return market;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
