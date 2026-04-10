import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../types'

function readStoredUser() {
  const stored = localStorage.getItem('taskflow_user')
  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem('taskflow_user')
    localStorage.removeItem('taskflow_token')
    return null
  }
}

export function useSession() {
  const [user, setUser] = useState<User | null>(() => readStoredUser())
  const navigate = useNavigate()

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem('taskflow_token', token)
    localStorage.setItem('taskflow_user', JSON.stringify(userData))
    setUser(userData)
    navigate('/projects')
  }

  const handleLogout = () => {
    localStorage.removeItem('taskflow_token')
    localStorage.removeItem('taskflow_user')
    setUser(null)
    navigate('/login')
  }

  return {
    user,
    handleLogin,
    handleLogout,
  }
}
