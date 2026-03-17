import Modal from '../common/Modal'

interface ContactAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title?: string
  description?: string
  confirmText?: string
  closeText?: string
}

export default function ContactAdminModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'กรุณาติดต่อเจ้าหน้าที่',
  description = 'รายการนี้ได้รับการยืนยันหรือชำระเงินแล้ว หากต้องการยกเลิกหรือขอเงินคืน กรุณาติดต่อแอดมินโดยตรงเพื่อดำเนินการต่อไปครับ',
  confirmText = 'ยืนยันการยกเลิก',
  closeText = 'ปิดหน้าต่าง',
}: ContactAdminModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mt-3 text-[15px] font-medium leading-relaxed text-gray-500">
          {description}
        </p>

        <div className="mt-6 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-left">
          <p className="text-sm font-semibold text-gray-500">ช่องทางติดต่อทีมงาน</p>
          <div className="mt-2 space-y-1.5 text-[15px] leading-6 text-gray-700">
            <p><span className="font-semibold text-gray-900">โทรศัพท์:</span> 095-0323782</p>
            <p><span className="font-semibold text-gray-900">แชต:</span> Line Official หรือ Facebook</p>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={onConfirm}
                className="ui-focus-ring ui-pressable w-full rounded-full bg-red-600 py-3.5 text-lg font-bold text-white hover:bg-red-700"
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="ui-focus-ring ui-pressable w-full rounded-full border border-gray-200 py-3.5 text-lg font-bold text-gray-700 hover:bg-gray-50"
              >
                {closeText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="ui-focus-ring ui-pressable w-full rounded-full bg-primary py-3.5 text-lg font-bold text-white hover:bg-primary-dark"
            >
              {closeText}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
