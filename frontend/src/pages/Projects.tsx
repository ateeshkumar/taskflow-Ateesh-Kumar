import { Link } from 'react-router-dom'
import { useProjectsPage } from '../hooks/useProjectsPage'
import {
  card,
  emptyText,
  errorBox,
  input,
  label,
  loadingText,
  panel,
  primaryButton,
  textarea,
} from '../ui'

export default function Projects() {
  const {
    formValues,
    updateFormField,
    projects,
    loadError,
    submitError,
    loadingProjects,
    submitting,
    handleSubmit,
  } = useProjectsPage()

  return (
    <div className={panel}>
      <div className="grid gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Projects</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Create a project, then jump into task planning and assignment.</p>
      </div>

      <form className={`${card} grid gap-4`} onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create a new project</h2>
        <label className={label}>
          Name
          <input
            className={input}
            value={formValues.name}
            onChange={(event) => updateFormField('name', event.target.value)}
            required
          />
        </label>
        <label className={label}>
          Description
          <textarea
            className={textarea}
            value={formValues.description}
            onChange={(event) => updateFormField('description', event.target.value)}
          />
        </label>
        {submitError ? <div className={errorBox}>{submitError}</div> : null}
        <button className={primaryButton} type="submit" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create project'}
        </button>
      </form>

      <div className={card}>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Your projects</h2>
        {loadError ? <div className={`${errorBox} mt-4`}>{loadError}</div> : null}
        {loadingProjects ? (
          <div className={loadingText}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className={emptyText}>No projects yet. Create one to get started.</div>
        ) : (
          <ul className="mt-4 grid gap-4">
            {projects.map((project) => (
              <li
                key={project.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 md:grid-cols-[1fr_auto] md:items-center dark:border-slate-700 dark:bg-slate-950/45"
              >
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{project.description || 'No description yet.'}</p>
                </div>
                <Link className={`${primaryButton} px-3 py-2 text-sm`} to={`/projects/${project.id}`}>
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
