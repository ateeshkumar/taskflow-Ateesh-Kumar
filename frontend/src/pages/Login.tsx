import { Link } from 'react-router-dom'
import { useLoginForm } from '../hooks/useAuthForm'
import { User } from '../types'
import { card, errorBox, input, label, mutedText, primaryButton } from '../ui'

type Props = {
  onSuccess: (user: User, token: string) => void
}

export default function Login({ onSuccess }: Props) {
  const { values, updateField, error, loading, handleSubmit } = useLoginForm(onSuccess)

  return (
    <div className="mx-auto grid max-w-md gap-6">
      <div className="grid gap-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Login</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Open your workspace and pick up where you left off.</p>
      </div>
      <form className={`${card} grid gap-4`} onSubmit={handleSubmit}>
        <label className={label}>
          Email
          <input
            className={input}
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            type="email"
            required
          />
        </label>
        <label className={label}>
          Password
          <input
            className={input}
            value={values.password}
            onChange={(event) => updateField('password', event.target.value)}
            type="password"
            required
          />
        </label>
        {error ? <div className={errorBox}>{error}</div> : null}
        <button className={primaryButton} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="grid gap-2 text-center">
        <p className={mutedText}>Use the seeded account from the README or create a new one.</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          New?{' '}
          <Link
            className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 dark:text-cyan-200 dark:decoration-cyan-700/60"
            to="/register"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
