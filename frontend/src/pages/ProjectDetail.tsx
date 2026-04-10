import TaskEditorPanel from '../components/TaskEditorPanel'
import { formatExactDateTime } from '../date'
import { taskPriorities, taskStatuses, useProjectDetail } from '../hooks/useProjectDetail'
import { TaskStatus } from '../types'
import {
  card,
  dangerButton,
  emptyText,
  errorBox,
  loadingText,
  mutedText,
  panel,
  primaryButton,
  secondaryButton,
  select,
} from '../ui'

function formatLabel(value: string) {
  return value.replace('_', ' ')
}

function statusBadgeClass(status: TaskStatus) {
  switch (status) {
    case 'todo':
      return 'border border-violet-200/70 bg-violet-100 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/15 dark:text-violet-200'
    case 'in_progress':
      return 'border border-amber-200/70 bg-amber-100 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-200'
    case 'done':
      return 'border border-emerald-200/70 bg-emerald-100 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-200'
    default:
      return 'border border-slate-200 bg-slate-200 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
  }
}

export default function ProjectDetail() {
  const {
    project,
    tasks,
    users,
    filters,
    updateFilter,
    pageError,
    editorError,
    loadingProject,
    loadingTasks,
    loadingUsers,
    savingTask,
    statusPendingId,
    deletingTaskId,
    isEditorOpen,
    editingTask,
    draft,
    updateDraftField,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    handleEditorSubmit,
    handleOptimisticStatusChange,
    handleDeleteTask,
  } = useProjectDetail()

  return (
    <div className={panel}>
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{project?.name || 'Project detail'}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {project?.description || 'Track tasks, filter the backlog, and keep status changes visible.'}
          </p>
        </div>
        <button className={primaryButton} type="button" onClick={openCreateEditor} disabled={loadingProject}>
          New task
        </button>
      </div>

      {pageError ? <div className={errorBox}>{pageError}</div> : null}

      <div className={`${card} p-4`}>
        <div className="grid gap-4 md:grid-cols-2 xl:max-w-xl">
          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Status
            <select
              className={select}
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="">All statuses</option>
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Assignee
            <select
              className={select}
              value={filters.assignee}
              onChange={(event) => updateFilter('assignee', event.target.value)}
              disabled={loadingUsers}
            >
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={card}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Tasks</h2>
          <span className={mutedText}>{tasks.length} visible</span>
        </div>

        {loadingProject || loadingTasks ? (
          <div className={loadingText}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className={emptyText}>No tasks match the current filters yet.</div>
        ) : (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <article
                key={task.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-950/45"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="grid gap-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{task.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className={`${secondaryButton} px-3 py-2`} type="button" onClick={() => openEditEditor(task)}>
                      Edit
                    </button>
                    <button
                      className={`${dangerButton} px-3 py-2`}
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      disabled={deletingTaskId === task.id}
                    >
                      {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(task.status)}`}>
                    {formatLabel(task.status)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formatLabel(task.priority)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {task.assignee_name || (task.assignee_id ? task.assignee_id : 'Unassigned')}
                  </span>
                  {task.due_date ? (
                    <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      Due {formatExactDateTime(task.due_date)}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                  <label className="grid min-w-[170px] gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Status
                    <select
                      className={select}
                      value={task.status}
                      onChange={(event) =>
                        handleOptimisticStatusChange(task, event.target.value as TaskStatus)
                      }
                      disabled={statusPendingId === task.id}
                    >
                      {taskStatuses.map((status) => (
                        <option key={status} value={status}>
                          {formatLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  {statusPendingId === task.id ? <span className={mutedText}>Saving...</span> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <TaskEditorPanel
        error={editorError}
        mode={editingTask ? 'edit' : 'create'}
        open={isEditorOpen}
        priorities={taskPriorities}
        saving={savingTask}
        statuses={taskStatuses}
        users={users}
        value={draft}
        onFieldChange={updateDraftField}
        onClose={closeEditor}
        onSubmit={handleEditorSubmit}
      />
    </div>
  )
}
