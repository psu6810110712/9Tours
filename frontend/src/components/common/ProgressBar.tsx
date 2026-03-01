import React from 'react';

/**
 * 1 = จอง
 * 2 = ตรวจสอบข้อมูล
 * 3 = ชำระเงิน
 * 4 = รับตั๋ว
 */
interface ProgressBarProps {
    currentStep: 1 | 2 | 3 | 4;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
    const steps = [
        { num: 1, label: 'จอง', width: 'w-24' },
        { num: 2, label: 'ตรวจสอบข้อมูล', width: 'w-32' },
        { num: 3, label: 'ชำระเงิน', width: 'w-24' },
        { num: 4, label: 'รับตั๋ว', width: 'w-24' },
    ];

    return (
        <div className="hidden md:flex items-start w-full max-w-3xl px-10 relative z-10 pt-1">
            {steps.map((step, index) => {
                const isCompleted = currentStep > step.num;
                const isCurrent = currentStep === step.num;
                const isActive = isCompleted || isCurrent;

                return (
                    <React.Fragment key={step.num}>
                        <div className={`flex flex-col items-center ${step.width}`}>
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md z-10
                  ${isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}
                `}
                            >
                                {step.num}
                            </div>
                            <span
                                className={`text-sm font-bold mt-2.5
                  ${isActive ? 'text-primary' : 'text-gray-400'}
                `}
                            >
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-[2px] mt-5 -mx-4 z-0
                  ${currentStep > step.num ? 'bg-primary' : 'bg-gray-200'}
                `}
                            ></div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
