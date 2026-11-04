import { useState, useEffect } from 'react'


export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    // Cancel the timer if value changes before delay elapses
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
