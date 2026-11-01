import { useState, useEffect, useRef } from "react"

export function useIsClamped() {
  const [isClamped, setIsClamped] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const checkClamped = () => {
      if (ref.current) {
        setIsClamped(
          ref.current.scrollHeight > ref.current.clientHeight ||
          ref.current.scrollWidth > ref.current.clientWidth
        )
      }
    }

    checkClamped()
    window.addEventListener("resize", checkClamped)

    return () => window.removeEventListener("resize", checkClamped)
  }, [])

  return [ref, isClamped]
}

export default useIsClamped
