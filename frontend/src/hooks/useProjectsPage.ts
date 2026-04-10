import { type FormEvent, useEffect, useState } from 'react'
import { apiErrorMessage, createProject, fetchProjects } from '../api'
import { Project } from '../types'
import { useFormFields } from './useFormFields'

type ProjectFormValues = {
  name: string
  description: string
}

const emptyProjectForm: ProjectFormValues = {
  name: '',
  description: '',
}

export function useProjectsPage() {
  const form = useFormFields(emptyProjectForm)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    fetchProjects()
      .then((data) => {
        if (!active) {
          return
        }

        setProjects(data.projects)
      })
      .catch((error) => {
        if (!active) {
          return
        }

        setLoadError(apiErrorMessage(error, 'Unable to load projects'))
      })
      .finally(() => {
        if (active) {
          setLoadingProjects(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitError('')
    setSubmitting(true)

    try {
      const project = await createProject(form.value.name, form.value.description)
      setProjects((current) => [project, ...current])
      form.resetValue()
    } catch (err: any) {
      setSubmitError(apiErrorMessage(err, 'Could not create project'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    formValues: form.value,
    updateFormField: form.updateField,
    projects,
    loadError,
    submitError,
    loadingProjects,
    submitting,
    handleSubmit,
  }
}
