import { useEffect, useRef, type RefObject } from 'react'

const LOCK_COUNT_ATTR = 'data-scroll-lock-count'
const ORIGINAL_PADDING_ATTR = 'data-scroll-lock-padding-right'
const ORIGINAL_POSITION_ATTR = 'data-scroll-lock-position'
const ORIGINAL_TOP_ATTR = 'data-scroll-lock-top'
const ORIGINAL_LEFT_ATTR = 'data-scroll-lock-left'
const ORIGINAL_RIGHT_ATTR = 'data-scroll-lock-right'
const ORIGINAL_WIDTH_ATTR = 'data-scroll-lock-width'
const ORIGINAL_SCROLL_Y_ATTR = 'data-scroll-lock-scroll-y'

type BodyScrollLockOptions = {
  allowTouchMoveRefs?: Array<RefObject<HTMLElement | null>>
}

type TouchMoveState = {
  lastTouchY: number
}

function getAllowedTouchMoveElement(
  target: EventTarget | null,
  allowTouchMoveRefs: Array<RefObject<HTMLElement | null>>,
) {
  if (!(target instanceof Node)) {
    return null
  }

  for (const ref of allowTouchMoveRefs) {
    const element = ref.current
    if (element?.contains(target)) {
      return element
    }
  }

  return null
}

function shouldPreventChainedScroll(element: HTMLElement, deltaY: number) {
  const maxScrollTop = element.scrollHeight - element.clientHeight
  if (maxScrollTop <= 0) {
    return true
  }

  const atTop = element.scrollTop <= 0
  const atBottom = element.scrollTop >= maxScrollTop - 1
  const isPullingDown = deltaY > 0
  const isPushingUp = deltaY < 0

  return (atTop && isPullingDown) || (atBottom && isPushingUp)
}

export function useBodyScrollLock(locked: boolean, options: BodyScrollLockOptions = {}) {
  const { allowTouchMoveRefs = [] } = options
  const allowTouchMoveRefsRef = useRef(allowTouchMoveRefs)
  const touchMoveStateRef = useRef<TouchMoveState>({
    lastTouchY: 0,
  })

  useEffect(() => {
    allowTouchMoveRefsRef.current = allowTouchMoveRefs
  }, [allowTouchMoveRefs])

  useEffect(() => {
    if (!locked || typeof document === 'undefined') {
      return
    }

    const body = document.body
    const currentCount = Number(body.getAttribute(LOCK_COUNT_ATTR) ?? '0')

    if (currentCount === 0) {
      const scrollY = window.scrollY
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      body.setAttribute(ORIGINAL_PADDING_ATTR, body.style.paddingRight)
      body.setAttribute(ORIGINAL_POSITION_ATTR, body.style.position)
      body.setAttribute(ORIGINAL_TOP_ATTR, body.style.top)
      body.setAttribute(ORIGINAL_LEFT_ATTR, body.style.left)
      body.setAttribute(ORIGINAL_RIGHT_ATTR, body.style.right)
      body.setAttribute(ORIGINAL_WIDTH_ATTR, body.style.width)
      body.setAttribute(ORIGINAL_SCROLL_Y_ATTR, String(scrollY))

      body.classList.add('ui-scroll-lock')
      body.style.overflow = 'hidden'
      body.style.position = 'fixed'
      body.style.top = `-${scrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'

      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
    }

    body.setAttribute(LOCK_COUNT_ATTR, String(currentCount + 1))

    const handleTouchStart = (event: TouchEvent) => {
      touchMoveStateRef.current = {
        lastTouchY: event.touches[0]?.clientY ?? 0,
      }
    }

    const preventBackgroundTouchMove = (event: TouchEvent) => {
      const allowedElement = getAllowedTouchMoveElement(event.target, allowTouchMoveRefsRef.current)

      if (!allowedElement) {
        event.preventDefault()
        return
      }

      const currentTouchY = event.touches[0]?.clientY ?? touchMoveStateRef.current.lastTouchY
      const deltaY = currentTouchY - touchMoveStateRef.current.lastTouchY

      touchMoveStateRef.current.lastTouchY = currentTouchY

      if (shouldPreventChainedScroll(allowedElement, deltaY)) {
        event.preventDefault()
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', preventBackgroundTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', preventBackgroundTouchMove)

      const nextCount = Math.max(0, Number(body.getAttribute(LOCK_COUNT_ATTR) ?? '1') - 1)

      if (nextCount === 0) {
        const scrollY = Number(body.getAttribute(ORIGINAL_SCROLL_Y_ATTR) ?? '0')

        body.classList.remove('ui-scroll-lock')
        body.style.overflow = ''
        body.style.paddingRight = body.getAttribute(ORIGINAL_PADDING_ATTR) ?? ''
        body.style.position = body.getAttribute(ORIGINAL_POSITION_ATTR) ?? ''
        body.style.top = body.getAttribute(ORIGINAL_TOP_ATTR) ?? ''
        body.style.left = body.getAttribute(ORIGINAL_LEFT_ATTR) ?? ''
        body.style.right = body.getAttribute(ORIGINAL_RIGHT_ATTR) ?? ''
        body.style.width = body.getAttribute(ORIGINAL_WIDTH_ATTR) ?? ''

        body.removeAttribute(LOCK_COUNT_ATTR)
        body.removeAttribute(ORIGINAL_PADDING_ATTR)
        body.removeAttribute(ORIGINAL_POSITION_ATTR)
        body.removeAttribute(ORIGINAL_TOP_ATTR)
        body.removeAttribute(ORIGINAL_LEFT_ATTR)
        body.removeAttribute(ORIGINAL_RIGHT_ATTR)
        body.removeAttribute(ORIGINAL_WIDTH_ATTR)
        body.removeAttribute(ORIGINAL_SCROLL_Y_ATTR)

        window.scrollTo(0, scrollY)
        return
      }

      body.setAttribute(LOCK_COUNT_ATTR, String(nextCount))
    }
  }, [locked])
}
