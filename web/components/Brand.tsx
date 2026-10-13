// Знак-заглушка: тундук (верх юрты) в круге. Заменить на логотип Супары, когда заказчик пришлёт файл.

export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="#D9A441" strokeWidth="2.5" />
      <path
        d="M9 24 Q24 10 39 24 M9 24 Q24 38 39 24 M24 9 Q10 24 24 39 M24 9 Q38 24 24 39"
        fill="none"
        stroke="#F3E6D0"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <BrandMark />
      <div className="leading-tight">
        <div className="text-[15px] font-extrabold tracking-[0.16em] text-stone-50">СУПАРА</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-500">панель управления</div>
      </div>
    </div>
  );
}
