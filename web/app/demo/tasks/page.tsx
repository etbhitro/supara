"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Dialog, EmptyState, Field, inputCls, useDialog } from "@/components/DataShell";
import { formatDay, todayISO } from "@/lib/format";
import { uid, useStore, type Task } from "@/lib/store";

const ASSIGNEES = ["Уборка", "Техник", "Администратор", "Повар", "Охрана"];

export default function TasksPage() {
  const { state, update } = useStore();
  const today = todayISO();
  const dlg = useDialog();
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState(ASSIGNEES[0]);
  const [due, setDue] = useState(today);

  const open = state.tasks.filter((t) => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = state.tasks.filter((t) => t.done);
  const canAdd = state.role !== "staff";

  function toggle(id: string) {
    update((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const task: Task = { id: uid("t"), title: title.trim(), assignee, due, done: false, createdBy: "staff" };
    update((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    setTitle("");
    dlg.hide();
  }

  return (
    <>
      <PageHeader
        title="Задачи"
        subtitle="Персонал будет получать их в Telegram и отмечать выполнение с фото"
        action={
          canAdd && (
            <button className="btn-primary" onClick={dlg.show}>
              <Plus size={16} />
              Новая задача
            </button>
          )
        }
      />

      {open.length === 0 ? (
        <EmptyState title="Все задачи выполнены" />
      ) : (
        <ul className="space-y-2">
          {open.map((t) => (
            <TaskRow key={t.id} task={t} overdue={t.due < today} onToggle={() => toggle(t.id)} />
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-base font-bold text-stone-50">Выполнено</h2>
          <ul className="space-y-2">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} overdue={false} onToggle={() => toggle(t.id)} />
            ))}
          </ul>
        </>
      )}

      <Dialog open={dlg.open} onClose={dlg.hide} title="Новая задача">
        <form onSubmit={submit}>
          <Field label="Что сделать">
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: подготовить баню к 18:00" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Кому">
              <select className={inputCls} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                {ASSIGNEES.map((a) => (
                  <option key={a} className="bg-ink-800">
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Срок">
              <input type="date" className={inputCls} value={due} onChange={(e) => setDue(e.target.value)} required />
            </Field>
          </div>
          <button className="btn-primary w-full" type="submit">
            Поставить задачу
          </button>
        </form>
      </Dialog>
    </>
  );
}

function TaskRow({ task, overdue, onToggle }: { task: Task; overdue: boolean; onToggle: () => void }) {
  return (
    <li className={`flex items-center gap-3 rounded-2xl border bg-white/[0.03] px-4 py-3 ${overdue ? "border-felt/60" : "border-white/10"}`}>
      <button
        onClick={onToggle}
        aria-label={task.done ? "Вернуть в работу" : "Отметить выполненной"}
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition ${
          task.done ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-200" : "border-white/20 text-transparent hover:border-accent hover:text-accent"
        }`}
      >
        <Check size={15} />
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-semibold ${task.done ? "text-muted-300 line-through" : "text-stone-100"}`}>{task.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-200">
          <span>{task.assignee}</span>
          <span>·</span>
          <span className={overdue ? "font-bold text-red-300" : ""}>
            {overdue ? "просрочено, " : "до "}
            {formatDay(task.due)}
          </span>
          {task.createdBy === "agent" && <span className="chip bg-accent/20 text-accent-300">поставил агент</span>}
        </div>
      </div>
    </li>
  );
}
