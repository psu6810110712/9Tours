import Modal from './Modal'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  cancelText?: string
  confirmStyle?: 'danger' | 'primary'
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  confirmStyle = 'primary',
}: ConfirmModalProps) {
  const isDanger = confirmStyle === 'danger'

  return (
    <Modal isOpen={isOpen} onClose={onCancel} width="max-w-sm">
      <div className="text-center">
        <div className="mb-5 flex items-center justify-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isDanger ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            {isDanger ? (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">{message}</p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            className="ui-focus-ring ui-pressable flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`ui-focus-ring ui-pressable flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
