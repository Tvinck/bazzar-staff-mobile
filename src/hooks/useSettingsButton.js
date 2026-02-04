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
            tg.SettingsButton.show();
            tg.SettingsButton.onClick(onClick);

            return () => {
                tg.SettingsButton.offClick(onClick);
                tg.SettingsButton.hide();
            };
        } else {
            tg.SettingsButton.hide();
        }
    }, [tg, onClick, isVisible]);
};

export default useSettingsButton;
