import { type FormEvent, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  apiErrorMessage,
  createTask,
  deleteTask,
  fetchProject,
  fetchProjectTasks,
  fetchUsers,
  updateTask,
} from '../api'
import { toApiDate, toDateInputValue } from '../date'
import { Project, Task, TaskPriority, TaskStatus, User } from '../types'
import { TaskDraft } from '../components/TaskEditorPanel'
import { useFormFields } from './useFormFields'

type TaskFilters = {
  status: string
  assignee: string
}

const emptyFilters: TaskFilters = {
  status: '',
  assignee: '',
}

const emptyTaskDraft: TaskDraft = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  assignee_id: '',
  due_date: '',
}

export const taskStatuses: TaskStatus[] = ['todo', 'in_progress', 'done']
export const taskPriorities: TaskPriority[] = ['low', 'medium', 'high']

function taskMatchesFilters(task: Task, filters: TaskFilters) {
  const statusMatch = !filters.status || task.status === filters.status
  const assigneeMatch =
    !filters.assignee ||
    (filters.assignee === 'unassigned' ? !task.assignee_id : task.assignee_id === filters.assignee)

  return statusMatch && assigneeMatch
}

export function useProjectDetail() {
  const { id } = useParams()
  const filters = useFormFields(emptyFilters)
  const draft = useFormFields(emptyTaskDraft)
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pageError, setPageError] = useState('')
  const [editorError, setEditorError] = useState('')
  const [loadingProject, setLoadingProject] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [savingTask, setSavingTask] = useState(false)
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true
    setLoadingProject(true)
    setLoadingUsers(true)
    setPageError('')

    Promise.all([fetchProject(id), fetchUsers()])
      .then(([projectData, usersData]) => {
        if (!active) {
          return
        }

        setProject({
          id: projectData.id,
          name: projectData.name,
          description: projectData.description,
          owner_id: projectData.owner_id,
          created_at: projectData.created_at,
        })
        setUsers(usersData.users)
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setPageError(apiErrorMessage(error, 'Unable to load project details'))
      })
      .finally(() => {
        if (!active) {
          return
        }

        setLoadingProject(false)
        setLoadingUsers(false)
      })

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!id) {
      return
    }

    let active = true
    setLoadingTasks(true)
    setPageError('')

    fetchProjectTasks(id, filters.value)
      .then((data) => {
        if (!active) {
          return
        }

        setTasks(data.tasks)
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setPageError(apiErrorMessage(error, 'Unable to load tasks'))
      })
      .finally(() => {
        if (active) {
          setLoadingTasks(false)
        }
      })

    return () => {
      active = false
    }
  }, [id, filters.value])

  const resetEditor = () => {
    setIsEditorOpen(false)
    setEditingTask(null)
    setEditorError('')
    draft.resetValue()
  }

  const openCreateEditor = () => {
    setEditingTask(null)
    setEditorError('')
    draft.resetValue()
    setIsEditorOpen(true)
  }

  const openEditEditor = (task: Task) => {
    setEditingTask(task)
    setEditorError('')
    draft.replaceValue({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee_id: task.assignee_id || '',
      due_date: toDateInputValue(task.due_date),
    })
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    if (savingTask) {
      return
    }

    resetEditor()
  }

  const handleEditorSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!id) {
      return
    }

    setSavingTask(true)
    setEditorError('')

    const payload = {
      title: draft.value.title.trim(),
      description: draft.value.description.trim() || null,
      status: draft.value.status,
      priority: draft.value.priority,
      assignee_id: draft.value.assignee_id || null,
      due_date: toApiDate(draft.value.due_date),
    }

    try {
      const savedTask = editingTask
        ? await updateTask(editingTask.id, payload)
        : await createTask(id, payload)

      setTasks((current) => {
        const nextTasks = current.filter((task) => task.id !== savedTask.id)
        if (!taskMatchesFilters(savedTask, filters.value)) {
          return nextTasks
        }

        return [savedTask, ...nextTasks]
      })

      resetEditor()
    } catch (error: any) {
      setEditorError(apiErrorMessage(error, 'Unable to save task'))
    } finally {
      setSavingTask(false)
    }
  }

  const handleOptimisticStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    const previousTasks = tasks
    const optimisticTask = { ...task, status: nextStatus }

    setPageError('')
    setStatusPendingId(task.id)
    setTasks((current) => {
      const nextTasks = current.filter((item) => item.id !== task.id)
      if (!taskMatchesFilters(optimisticTask, filters.value)) {
        return nextTasks
      }

      return [optimisticTask, ...nextTasks]
    })

    try {
      const updated = await updateTask(task.id, { status: nextStatus })
      setTasks((current) => {
        const nextTasks = current.filter((item) => item.id !== updated.id)
        if (!taskMatchesFilters(updated, filters.value)) {
          return nextTasks
        }

        return [updated, ...nextTasks]
      })
    } catch (error: any) {
      setTasks(previousTasks)
      setPageError(apiErrorMessage(error, 'Unable to update task status'))
    } finally {
      setStatusPendingId(null)
    }
  }

  const handleDeleteTask = async (task: Task) => {
    const previousTasks = tasks
    setDeletingTaskId(task.id)
    setPageError('')
    setTasks((current) => current.filter((item) => item.id !== task.id))

    try {
      await deleteTask(task.id)
    } catch (error: any) {
      setTasks(previousTasks)
      setPageError(apiErrorMessage(error, 'Unable to delete task'))
    } finally {
      setDeletingTaskId(null)
    }
  }

  return {
    project,
    tasks,
    users,
    filters: filters.value,
    updateFilter: filters.updateField,
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
    draft: draft.value,
    updateDraftField: draft.updateField,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    handleEditorSubmit,
    handleOptimisticStatusChange,
    handleDeleteTask,
  }
}
