/// <reference types="vite/client" />
import { Project, Task, User } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function authHeaders() {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('taskflow_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export function apiErrorMessage(error: any, fallback: string) {
  if (error?.fields && typeof error.fields === 'object') {
    return Object.entries(error.fields)
      .map(([field, message]) => `${field} ${String(message)}`)
      .join(', ')
  }

  return error?.error || fallback
}

async function handleResponse(response: Response) {
  if (response.status === 204) {
    return null
  }

  const json = await response.json().catch(() => null)
  if (!response.ok) {
    throw json || { error: response.statusText }
  }
  return json
}

async function request(path: string, init: RequestInit = {}, requiresAuth = true) {
  const headers: Record<string, string> = {
    ...(requiresAuth ? authHeaders() : {}),
    ...(init.headers as Record<string, string> | undefined),
  }

  if (init.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  return handleResponse(
    await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    }),
  )
}

export async function login(email: string, password: string) {
  return request(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    },
    false,
  )
}

export async function register(name: string, email: string, password: string) {
  return request(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
    false,
  )
}

export async function fetchProjects() {
  return request('/projects')
}

export async function fetchProject(id: string) {
  return request(`/projects/${id}`)
}

export async function fetchProjectTasks(id: string, filters: { status: string; assignee: string }) {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }
  if (filters.assignee) {
    params.set('assignee', filters.assignee)
  }

  const query = params.toString()
  return request(`/projects/${id}/tasks${query ? `?${query}` : ''}`)
}

export async function fetchUsers() {
  return request('/users')
}

export async function createProject(name: string, description: string) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description: description || null }),
  })
}

export async function createTask(projectId: string, payload: Partial<Task>) {
  return request(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateTask(taskId: string, payload: Partial<Task>) {
  return request(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteTask(taskId: string) {
  return request(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
}
