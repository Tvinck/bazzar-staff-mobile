import { useEffect } from 'react';

/**
 * Hook для управления кнопкой настроек в Telegram
 * Показывает кнопку с тремя точками в заголовке приложения
 * 
 * @param {Function} onClick - Обработчик клика по кнопке
 * @param {boolean} isVisible - Показывать ли кнопку (по умолчанию true)
 */
export const useSettingsButton = (onClick, isVisible = true) => {
    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        if (!tg?.SettingsButton) return;

        if (isVisible && onClick) {
            try {
                tg.SettingsButton.show();
                tg.SettingsButton.onClick(onClick);

                return () => {
                    try {
                        tg.SettingsButton.offClick(onClick);
                        tg.SettingsButton.hide();
                    } catch (e) {
                        console.warn('SettingsButton cleanup failed', e);
                    }
                };
            } catch (e) {
                console.warn('SettingsButton.show failed', e);
            }
        } else {
            try {
                tg.SettingsButton.hide();
            } catch (e) {
                console.warn('SettingsButton.hide failed', e);
            }
        }
    }, [tg, onClick, isVisible]);
};

export default useSettingsButton;
