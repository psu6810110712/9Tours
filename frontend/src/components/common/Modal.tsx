import React from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
}

export default function Modal({ isOpen, onClose, children, width = 'max-w-md' }: ModalProps) {
    useBodyScrollLock(isOpen);

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            <div className={`bg-white rounded-[2rem] p-8 w-full ${width} relative z-10 shadow-2xl animate-fade-in-up border border-gray-100`}>
                {/* Optional close button in upper right, or can leave logic to children. 
            For now, giving a generic close button if needed, but Login/Register have their own structures.
            We will just render children to be flexible. */}
                {children}
            </div>
        </div>
    );
}
