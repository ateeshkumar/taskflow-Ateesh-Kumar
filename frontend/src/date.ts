const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/

function formatDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function toDateInputValue(value?: string | null) {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (DATE_ONLY_RE.test(trimmed)) {
    return trimmed
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return ''
  }

  return parsed.toISOString().slice(0, 10)
}

export function toApiDate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  return trimmed
}

export function formatDueDate(value?: string | null) {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (DATE_ONLY_RE.test(trimmed)) {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(formatDateParts(trimmed))
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}
