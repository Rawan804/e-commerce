import { useState, useEffect } from 'react'

/**
 * Delays updating the returned value until `delay` ms have passed since
 * the last change. Use this to avoid firing a search API call on every
 * keystroke.
 *
 * @example
 *   const debouncedQuery = useDebounce(query, 400)
 *   useEffect(() => { fetchProducts(debouncedQuery) }, [debouncedQuery])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    // Cancel the timer if value changes before delay elapses
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
