import { type FormEvent, useState } from 'react'
import { apiErrorMessage, login, register } from '../api'
import { User } from '../types'
import { useFormFields } from './useFormFields'

type LoginValues = {
  email: string
  password: string
}

type RegisterValues = {
  name: string
  email: string
  password: string
}

const emptyLoginValues: LoginValues = {
  email: '',
  password: '',
}

const emptyRegisterValues: RegisterValues = {
  name: '',
  email: '',
  password: '',
}

export function useLoginForm(onSuccess: (user: User, token: string) => void) {
  const form = useFormFields(emptyLoginValues)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.value.email.trim() || !form.value.password.trim()) {
      setError('Email and password are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await login(form.value.email, form.value.password)
      onSuccess(response.user, response.token)
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  return {
    values: form.value,
    updateField: form.updateField,
    error,
    loading,
    handleSubmit,
  }
}

export function useRegisterForm(onSuccess: (user: User, token: string) => void) {
  const form = useFormFields(emptyRegisterValues)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.value.name.trim() || !form.value.email.trim() || !form.value.password.trim()) {
      setError('Name, email, and password are required')
      return
    }

    if (form.value.password.trim().length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await register(form.value.name, form.value.email, form.value.password)
      onSuccess(response.user, response.token)
    } catch (err: any) {
      setError(apiErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  return {
    values: form.value,
    updateField: form.updateField,
    error,
    loading,
    handleSubmit,
  }
}
