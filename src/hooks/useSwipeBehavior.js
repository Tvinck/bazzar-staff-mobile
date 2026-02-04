import { useEffect } from 'react';

/**
 * Hook для управления поведением вертикальных свайпов в Telegram
 * Позволяет отключить закрытие приложения свайпом вниз
 * 
 * @param {boolean} allowVerticalSwipe - Разрешить вертикальные свайпы (по умолчанию false)
 */
export const useSwipeBehavior = (allowVerticalSwipe = false) => {
    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        if (!tg) return;

        if (allowVerticalSwipe) {
            // Разрешить свайпы (для финальных экранов)
            if (tg.enableVerticalSwipes) {
                tg.enableVerticalSwipes();
            }
        } else {
            // Запретить свайпы (для страниц с прокруткой)
            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }
        }

        return () => {
            // Cleanup: по умолчанию отключаем свайпы
            if (tg.disableVerticalSwipes) {
                tg.disableVerticalSwipes();
            }
        };
    }, [tg, allowVerticalSwipe]);
};

export default useSwipeBehavior;
