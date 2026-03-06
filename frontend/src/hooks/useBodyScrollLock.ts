import { useEffect } from 'react';

/**
 * Hook to lock body scroll when a component (like a modal) is mounted.
 * @param lock - Boolean to indicate if the scroll should be locked.
 */
export const useBodyScrollLock = (lock: boolean) => {
    useEffect(() => {
        if (lock) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle === 'hidden' ? 'unset' : originalStyle;
            };
        }
        return undefined;
    }, [lock]);
};
