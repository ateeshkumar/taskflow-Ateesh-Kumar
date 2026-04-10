export type User = {
  id: string
  name: string
  email: string
  created_at: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export type TaskPriority = 'low' | 'medium' | 'high'

export type Project = {
  id: string
  name: string
  description?: string | null
  owner_id: string
  created_at: string
  tasks?: Task[]
}

export type Task = {
  id: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  project_id: string
  assignee_id?: string | null
  creator_id: string
  due_date?: string | null
  created_at: string
  updated_at: string
  assignee_name?: string | null
  creator_name?: string | null
}
