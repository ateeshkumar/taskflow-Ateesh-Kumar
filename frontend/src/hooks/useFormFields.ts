import { useRef, useState } from 'react'

export function useFormFields<T>(initialValue: T) {
  const initialRef = useRef(initialValue)
  const [value, setValue] = useState(initialRef.current)

  const updateField = <K extends keyof T>(field: K, nextValue: T[K]) => {
    setValue((current) => ({
      ...current,
      [field]: nextValue,
    }))
  }

  const replaceValue = (nextValue: T) => {
    setValue(nextValue)
  }

  const resetValue = (nextValue?: T) => {
    setValue(nextValue ?? initialRef.current)
  }

  return {
    value,
    updateField,
    replaceValue,
    resetValue,
  }
}
