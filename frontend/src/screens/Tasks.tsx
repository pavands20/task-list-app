// @ts-nocheck -- generated from the approved design under its JS runtime contract; not hand-written TypeScript.
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Empty } = UI;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { Edit, Filter } = Icons;

const PRODUCT = "Task list app";
const mix = (colour, percent) => `color-mix(in srgb, ${colour} ${percent}%, transparent)`;

const SAMPLE_TASKS = [
  { id: "t-001", title: "Submit expense report", due_date: "2026-11-19", is_done: true,  created_at: "2026-11-15T09:30:00Z", updated_at: "2026-11-18T08:00:00Z" },
  { id: "t-002", title: "Buy groceries",         due_date: "2026-11-20", is_done: false, created_at: "2026-11-16T14:20:00Z", updated_at: "2026-11-16T14:20:00Z" },
  { id: "t-003", title: "Plan weekend trip",     due_date: "2026-11-25", is_done: false, created_at: "2026-11-17T11:00:00Z", updated_at: "2026-11-17T11:00:00Z" },
  { id: "t-004", title: "Call dentist",          due_date: null,          is_done: false, created_at: "2026-11-18T07:45:00Z", updated_at: "2026-11-18T07:45:00Z" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
];

function formatDate(d) {
  if (!d) return "No due date";
  const dt = new Date(d + "T00:00:00");
  return "Due " + dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Screen() {
  const [tasks, setTasks] = React.useState(SAMPLE_TASKS);
  const [filter, setFilter] = React.useState("all");
  const [newTitle, setNewTitle] = React.useState("");
  const [newDue, setNewDue] = React.useState("");
  const [addError, setAddError] = React.useState("");
  const [editing, setEditing] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDue, setEditDue] = React.useState("");
  const [editError, setEditError] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const editTitleRef = React.useRef(null);

  const rule = `2px solid ${brand.primaryColor}`;
  const hair = `1px solid ${mix(brand.primaryColor, 14)}`;

  /* US-014: sort by due date ascending (nulls last), then by created_at */
  const sorted = [...tasks].sort((a, b) => {
    if (a.due_date && b.due_date) {
      if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
      return a.created_at.localeCompare(b.created_at);
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    return a.created_at.localeCompare(b.created_at);
  });

  /* US-013: filter active / completed */
  const filtered = sorted.filter((t) => {
    if (filter === "active") return !t.is_done;
    if (filter === "completed") return t.is_done;
    return true;
  });

  /* US-007: add task with required title and optional due date */
  const handleAdd = () => {
    if (!newTitle.trim()) {
      setAddError("Title is required to create a task.");
      return;
    }
    const now = new Date().toISOString();
    setTasks([...tasks, {
      id: "t-" + Date.now(),
      title: newTitle.trim(),
      due_date: newDue || null,
      is_done: false,
      created_at: now,
      updated_at: now,
    }]);
    setNewTitle("");
    setNewDue("");
    setAddError("");
  };

  /* US-009: toggle done / not done */
  const toggleDone = (id) => {
    setTasks(tasks.map((t) =>
      t.id === id ? { ...t, is_done: !t.is_done, updated_at: new Date().toISOString() } : t
    ));
  };

  const openEdit = (task) => {
    setEditing(task);
    setEditTitle(task.title);
    setEditDue(task.due_date || "");
    setEditError("");
    setConfirmDelete(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditTitle("");
    setEditDue("");
    setEditError("");
    setConfirmDelete(false);
  };

  /* US-008: save edited title / due date */
  const handleSave = () => {
    if (!editTitle.trim()) {
      setEditError("Title is required. A task cannot have an empty title.");
      return;
    }
    setTasks(tasks.map((t) =>
      t.id === editing.id
        ? { ...t, title: editTitle.trim(), due_date: editDue || null, updated_at: new Date().toISOString() }
        : t
    ));
    closeEdit();
  };

  const handleToggleInModal = () => {
    const updated = { ...editing, is_done: !editing.is_done, updated_at: new Date().toISOString() };
    setTasks(tasks.map((t) => (t.id === editing.id ? updated : t)));
    setEditing(updated);
  };

  /* US-010: delete task — two-step confirm inside modal */
  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setTasks(tasks.filter((t) => t.id !== editing.id));
    closeEdit();
  };

  React.useEffect(() => {
    if (editing && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [editing]);

  React.useEffect(() => {
    if (!editing) return;
    const handler = (e) => { if (e.key === "Escape") closeEdit(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editing]);

  return (
    <div className="bg-white" style={{ color: brand.primaryColor, fontFamily: brand.fontBody }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
        button:focus-visible, input:focus-visible { outline: 2px solid ${brand.accentColor}; outline-offset: 1px; }
      `}</style>

      {/* Row 1 — page title */}
      <div data-wf="b-0-0" className="pb-4" style={{ borderBottom: rule }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: brand.neutralColor }}>{PRODUCT}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight" style={{ fontFamily: brand.fontHeading }}>My Tasks</h1>
      </div>

      {/* Row 2 — add task form */}
      <div className="flex flex-col sm:flex-row gap-3 py-4" style={{ borderBottom: rule }}>
        <div className="sm:w-6/12">
          <label htmlFor="new-title" className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: brand.neutralColor }}>New task title</label>
          <input
            id="new-title"
            data-wf="b-1-0"
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); if (addError) setAddError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            placeholder="What needs to be done?"
            className="h-9 w-full bg-white px-3 text-sm outline-none"
            style={{ border: rule, borderRadius: brand.radius }}
            aria-invalid={!!addError}
            aria-describedby={addError ? "new-title-err" : undefined}
          />
        </div>
        <div className="sm:w-3/12">
          <label htmlFor="new-due" className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: brand.neutralColor }}>Due date (optional)</label>
          <input
            id="new-due"
            data-wf="b-1-1"
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="h-9 w-full bg-white px-3 text-sm outline-none"
            style={{ border: rule, borderRadius: brand.radius, fontVariantNumeric: "tabular-nums" }}
          />
        </div>
        <div className="sm:w-3/12 flex items-end">
          <button
            type="button"
            data-wf="b-1-2"
            onClick={handleAdd}
            className="h-9 w-full px-4 text-xs font-bold uppercase tracking-[0.14em] text-white inline-flex items-center justify-center gap-2 transition-colors"
            style={{ backgroundColor: brand.primaryColor, borderRadius: brand.radius }}
          >
            <Icons.Plus aria-hidden="true" style={{ width: 16, height: 16 }} /> Add Task
          </button>
        </div>
      </div>
      {addError && (
        <p id="new-title-err" className="text-xs font-semibold py-1" style={{ color: brand.accentColor }} role="alert">{addError}</p>
      )}

      {/* Row 3 — filter tabs + sort label */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
        <div role="group" aria-label="Filter tasks" className="flex" data-wf="b-2-0" style={{ border: rule, borderRadius: brand.radius }}>
          {FILTERS.map((f, i) => (
            <button
              key={f.key}
              type="button"
              data-wf={`i-2-0-${i}`}
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className="h-9 px-4 text-xs font-bold uppercase tracking-[0.14em] transition-colors"
              style={{
                borderLeft: i ? rule : "none",
                backgroundColor: filter === f.key ? brand.primaryColor : "#fff",
                color: filter === f.key ? "#fff" : brand.primaryColor,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="sm:ml-auto text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: brand.neutralColor }} data-wf="b-2-1">
          Sorted by due date, then created time
        </p>
      </div>

      {/* Row 4 — task list  /  Row 7 — empty state */}
      {tasks.length === 0 ? (
        <div data-wf="b-6-0" style={{ borderTop: rule }}>
          <Empty
            title="No tasks yet"
            description="Add your first task above using the new task form."
            className="py-16"
          />
        </div>
      ) : (
        <div data-wf="b-3-0" className="overflow-x-auto" style={{ borderTop: rule }}>
          <table className="w-full text-[13px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.14em]" style={{ borderBottom: rule, color: brand.neutralColor }}>
                <th scope="col" className="w-12 py-2"><span className="sr-only">Mark done</span></th>
                <th scope="col" className="py-2 font-bold">Task</th>
                <th scope="col" className="py-2 font-bold">Due date</th>
                <th scope="col" className="py-2 font-bold text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, idx) => (
                <tr
                  key={task.id}
                  className="transition-colors hover:bg-black/[0.03]"
                  style={{ borderBottom: hair }}
                  data-wf={`i-3-0-${idx}`}
                >
                  <td className="py-2 pl-2">
                    <button
                      type="button"
                      data-wf={`i-3-0-${idx}`}
                      aria-label={task.is_done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                      aria-pressed={task.is_done}
                      onClick={() => toggleDone(task.id)}
                      className="w-6 h-6 inline-flex items-center justify-center transition-colors"
                      style={{
                        border: rule,
                        borderRadius: brand.radius,
                        backgroundColor: task.is_done ? brand.primaryColor : "#fff",
                      }}
                    >
                      {task.is_done && <Icons.Check aria-hidden="true" style={{ width: 14, height: 14, color: "#fff" }} />}
                    </button>
                  </td>
                  <td className="py-2">
                    <span
                      className={task.is_done ? "line-through" : ""}
                      style={{ color: task.is_done ? brand.neutralColor : brand.primaryColor }}
                    >
                      {task.title}
                    </span>
                    {task.is_done && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: brand.neutralColor }}>Done</span>
                    )}
                  </td>
                  <td className="py-2" style={{ color: task.due_date ? brand.primaryColor : brand.neutralColor }}>
                    {formatDate(task.due_date)}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      data-wf={`i-3-0-${idx}`}
                      aria-label={`Edit "${task.title}"`}
                      onClick={() => openEdit(task)}
                      className="h-8 px-3 text-[11px] font-bold uppercase tracking-[0.14em] inline-flex items-center gap-1.5 transition-colors"
                      style={{ border: rule, borderRadius: brand.radius }}
                    >
                      <Icons.Edit aria-hidden="true" style={{ width: 14, height: 14 }} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm font-semibold" style={{ color: brand.neutralColor }}>
              {filter === "active"
                ? "No active tasks — everything is marked done."
                : "No completed tasks yet."}
            </div>
          )}
        </div>
      )}

      {/* Row 5–6 — edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(17,17,17,0.35)" }}
          onClick={closeEdit}
        >
          <div
            className="bg-white w-full max-w-lg"
            style={{ border: rule, borderRadius: brand.radius, boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-heading"
          >
            {/* Row 5 — modal fields */}
            <div data-wf="b-4-0" className="p-5" style={{ borderBottom: rule }}>
              <div className="flex items-center justify-between mb-4">
                <h2 id="edit-heading" className="text-lg font-bold tracking-tight" style={{ fontFamily: brand.fontHeading }}>
                  Edit Task
                </h2>
                <button
                  type="button"
                  aria-label="Close edit dialog"
                  onClick={closeEdit}
                  className="w-8 h-8 inline-flex items-center justify-center transition-colors"
                  style={{ border: rule, borderRadius: brand.radius }}
                >
                  <Icons.X aria-hidden="true" style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-title"
                    data-wf="i-4-0-0"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-1"
                    style={{ color: brand.neutralColor }}
                  >
                    Title (required)
                  </label>
                  <input
                    id="edit-title"
                    data-wf="i-4-0-0"
                    ref={editTitleRef}
                    value={editTitle}
                    onChange={(e) => { setEditTitle(e.target.value); if (editError) setEditError(""); }}
                    className="h-9 w-full bg-white px-3 text-sm outline-none"
                    style={{ border: rule, borderRadius: brand.radius }}
                    aria-invalid={!!editError}
                    aria-describedby={editError ? "edit-title-err" : undefined}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-due"
                    data-wf="i-4-0-1"
                    className="block text-[11px] font-bold uppercase tracking-[0.14em] mb-1"
                    style={{ color: brand.neutralColor }}
                  >
                    Due date (optional — clear to remove)
                  </label>
                  <input
                    id="edit-due"
                    data-wf="i-4-0-1"
                    type="date"
                    value={editDue}
                    onChange={(e) => setEditDue(e.target.value)}
                    className="h-9 w-full bg-white px-3 text-sm outline-none"
                    style={{ border: rule, borderRadius: brand.radius, fontVariantNumeric: "tabular-nums" }}
                  />
                </div>
                {editError && (
                  <p id="edit-title-err" className="text-xs font-semibold" style={{ color: brand.accentColor }} role="alert">
                    {editError}
                  </p>
                )}
              </div>
            </div>

            {/* Row 6 — modal actions */}
            <div className="flex flex-col sm:flex-row gap-2 p-5">
              <button
                type="button"
                data-wf="b-5-0"
                onClick={handleSave}
                className="h-9 flex-1 px-4 text-xs font-bold uppercase tracking-[0.14em] text-white inline-flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: brand.primaryColor, borderRadius: brand.radius }}
              >
                <Icons.Check aria-hidden="true" style={{ width: 16, height: 16 }} /> Save Changes
              </button>
              <button
                type="button"
                data-wf="b-5-1"
                onClick={handleToggleInModal}
                className="h-9 flex-1 px-4 text-xs font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-colors"
                style={{ border: rule, borderRadius: brand.radius }}
              >
                {editing.is_done ? "Mark Not Done" : "Mark Done"}
              </button>
              <button
                type="button"
                data-wf="b-5-2"
                onClick={handleDelete}
                className="h-9 flex-1 px-4 text-xs font-bold uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-colors"
                style={{
                  border: rule,
                  borderRadius: brand.radius,
                  color: confirmDelete ? brand.accentColor : brand.primaryColor,
                  backgroundColor: confirmDelete ? mix(brand.accentColor, 8) : "#fff",
                }}
              >
                <Icons.X aria-hidden="true" style={{ width: 16, height: 16 }} /> {confirmDelete ? "Confirm Delete" : "Delete Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
