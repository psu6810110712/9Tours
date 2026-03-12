import React from 'react'

/**
 * 1 = จอง
 * 2 = ตรวจสอบข้อมูล
 * 3 = ชำระเงิน
 * 4 = รับตั๋ว
 */
interface ProgressBarProps {
  currentStep: 1 | 2 | 3 | 4
}

const steps = [
  { num: 1, label: 'จอง' },
  { num: 2, label: 'ตรวจสอบข้อมูล' },
  { num: 3, label: 'ชำระเงิน' },
  { num: 4, label: 'รับตั๋ว' },
] as const

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <>
      <div className="flex w-full items-center justify-center gap-2 md:hidden">
        {steps.map((step) => {
          const isActive = currentStep >= step.num
          return (
            <div
              key={step.num}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {step.num}. {step.label}
            </div>
          )
        })}
      </div>

      <div className="hidden w-full max-w-3xl items-start px-6 pt-1 md:flex">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.num
          const isCurrent = currentStep === step.num
          const isActive = isCompleted || isCurrent

          return (
            <React.Fragment key={step.num}>
              <div className="flex w-28 flex-col items-center lg:w-36">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-base font-bold shadow-sm ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {step.num}
                </div>
                <span className={`mt-2.5 text-center text-sm font-bold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`mt-5 h-[2px] flex-1 ${currentStep > step.num ? 'bg-primary' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </>
  )
}
