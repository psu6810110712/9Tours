import { useEffect } from 'react'

const LOCK_COUNT_ATTR = 'data-scroll-lock-count'
const ORIGINAL_PADDING_ATTR = 'data-scroll-lock-padding-right'

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return
    }

    const body = document.body
    const currentCount = Number(body.getAttribute(LOCK_COUNT_ATTR) ?? '0')

    if (currentCount === 0) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      body.setAttribute(ORIGINAL_PADDING_ATTR, body.style.paddingRight)
      body.classList.add('ui-scroll-lock')
      body.style.overflow = 'hidden'

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    body.setAttribute(LOCK_COUNT_ATTR, String(currentCount + 1))

    return () => {
      const nextCount = Math.max(0, Number(body.getAttribute(LOCK_COUNT_ATTR) ?? '1') - 1)

      if (nextCount === 0) {
        body.classList.remove('ui-scroll-lock')
        body.style.overflow = ''
        body.style.paddingRight = body.getAttribute(ORIGINAL_PADDING_ATTR) ?? ''
        body.removeAttribute(LOCK_COUNT_ATTR)
        body.removeAttribute(ORIGINAL_PADDING_ATTR)
        return
      }

      body.setAttribute(LOCK_COUNT_ATTR, String(nextCount))
    }
  }, [locked])
}
