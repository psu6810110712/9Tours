interface ScrollerArrowButtonProps {
  direction: 'left' | 'right'
  onClick: () => void
  ariaLabel?: string
  className?: string
  disabled?: boolean
}

export default function ScrollerArrowButton({
  direction,
  onClick,
  ariaLabel,
  className = '',
  disabled = false,
}: ScrollerArrowButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel || (direction === 'left' ? 'เลื่อนไปทางซ้าย' : 'เลื่อนไปทางขวา')}
      onClick={onClick}
      disabled={disabled}
      className={`ui-focus-ring ui-arrow-button ${disabled ? 'cursor-not-allowed opacity-45' : ''} ${className}`.trim()}
    >
      <svg
        className={`h-5 w-5 ${direction === 'right' ? 'rotate-180' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.4}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 5.5 8.5 12l6 6.5" />
      </svg>
    </button>
  )
}
