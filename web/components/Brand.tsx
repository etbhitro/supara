// Знак: тундук (верх юрты) в круге. Заменить на логотип Супары, когда заказчик пришлёт файл.

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="21" fill="none" stroke="#2F7D5C" strokeWidth="2.2" />
      <path
        d="M9 24 Q24 10 39 24 M9 24 Q24 38 39 24 M24 9 Q10 24 24 39 M24 9 Q38 24 24 39"
        fill="none"
        stroke="#E3A63B"
        strokeOpacity="0.9"
        strokeWidth="1.6"
      />
    </svg>
  );
}
