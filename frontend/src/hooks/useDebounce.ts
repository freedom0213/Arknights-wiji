import { useState, useEffect } from 'react'

// 通用防抖 hook：value 变化后 delay ms 才更新 debouncedValue
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
