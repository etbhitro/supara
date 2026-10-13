"use client";

import { useState, type ReactNode } from "react";

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.02]">
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-medium text-muted-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Row({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-black/5 transition last:border-b-0 hover:bg-black/[0.03] ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

export function Cell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-ink ${className}`}>{children}</td>;
}

export function EmptyState({ title, hint }: { title: string; hint?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-black/[0.02] px-6 py-10 text-center">
      <div className="text-sm font-semibold text-ink/80">{title}</div>
      {hint && <div className="mt-1 text-xs text-muted-200">{hint}</div>}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md animate-fade-in overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-inset ring-black/5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="text-lg font-medium text-ink">{title}</div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-200 hover:bg-black/5 hover:text-ink"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function useDialog() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="label-kicker mb-1.5">{label}</div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-black/10 bg-black/[0.04] px-4 py-3 text-sm text-ink placeholder:text-muted-300 outline-none transition focus:border-bronze focus:ring-2 focus:ring-bronze/15";

export function NoAccess({ what }: { what: string }) {
  return <EmptyState title={`Для этой роли раздел «${what}» закрыт`} hint="Смените роль в меню, чтобы посмотреть." />;
}
