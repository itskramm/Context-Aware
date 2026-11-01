import { useState, useEffect, useRef } from "react"

export function useSize() {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect
        setSize({ width, height })
      }
    })

    observer.observe(ref.current)
    
    // Set initial size
    const { width, height } = ref.current.getBoundingClientRect()
    setSize({ width, height })

    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
