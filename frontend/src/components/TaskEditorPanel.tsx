import { type FormEvent } from 'react'
import { TaskPriority, TaskStatus, User } from '../types'
import { errorBox, input, label, primaryButton, secondaryButton, select, textarea } from '../ui'

export type TaskDraft = {
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
  due_date: string
}

type Props = {
  open: boolean
  mode: 'create' | 'edit'
  saving: boolean
  error: string
  value: TaskDraft
  users: User[]
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  onFieldChange: <K extends keyof TaskDraft>(field: K, value: TaskDraft[K]) => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}

function formatLabel(value: string) {
  return value.replace('_', ' ')
}

export default function TaskEditorPanel({
  open,
  mode,
  saving,
  error,
  value,
  users,
  statuses,
  priorities,
  onFieldChange,
  onClose,
  onSubmit,
}: Props) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/55" onClick={onClose}>
      <aside
        className="h-full w-full max-w-[460px] overflow-y-auto bg-slate-50 p-6 shadow-[-18px_0_50px_rgba(15,23,42,0.18)] dark:bg-slate-900 dark:shadow-[-18px_0_50px_rgba(2,6,23,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {mode === 'create' ? 'Create task' : 'Edit task'}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Use the side panel to manage task details without leaving the page.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className={label}>
            Title
            <input
              className={input}
              value={value.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              required
            />
          </label>

          <label className={label}>
            Description
            <textarea
              className={textarea}
              value={value.description}
              onChange={(event) => onFieldChange('description', event.target.value)}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={label}>
              Status
              <select
                className={select}
                value={value.status}
                onChange={(event) => onFieldChange('status', event.target.value as TaskStatus)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className={label}>
              Priority
              <select
                className={select}
                value={value.priority}
                onChange={(event) => onFieldChange('priority', event.target.value as TaskPriority)}
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {formatLabel(priority)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className={label}>
              Assignee
              <select
                className={select}
                value={value.assignee_id}
                onChange={(event) => onFieldChange('assignee_id', event.target.value)}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={label}>
              Due date
              <input
                className={input}
                type="date"
                value={value.due_date}
                onChange={(event) => onFieldChange('due_date', event.target.value)}
              />
            </label>
          </div>

          {error ? <div className={errorBox}>{error}</div> : null}

          <div className="flex justify-end gap-3">
            <button className={secondaryButton} type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className={primaryButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create task' : 'Save changes'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}
