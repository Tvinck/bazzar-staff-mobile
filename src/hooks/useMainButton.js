import { useEffect, useRef } from 'react';

/**
 * Hook для управления главной кнопкой действия в Telegram
 * Большая кнопка внизу экрана (над клавиатурой)
 * 
 * @param {string} text - Текст кнопки
 * @param {Function} onClick - Обработчик клика
 * @param {Object} options - Дополнительные опции
 * @param {boolean} options.isVisible - Показать кнопку (по умолчанию true)
 * @param {boolean} options.isActive - Активна ли кнопка (по умолчанию true)
 * @param {boolean} options.isProgressVisible - Показать прогресс (по умолчанию false)
 * @param {string} options.color - Цвет кнопки (по умолчанию #007aff)
 * @param {string} options.textColor - Цвет текста (по умолчанию #ffffff)
 */
export const useMainButton = (text, onClick, options = {}) => {
    const tg = window.Telegram?.WebApp;
    const onClickRef = useRef(onClick);

    // Обновляем ref при изменении onClick
    useEffect(() => {
        onClickRef.current = onClick;
    }, [onClick]);

    useEffect(() => {
        if (!tg?.MainButton) return;

        const {
            isVisible = true,
            isActive = true,
            isProgressVisible = false,
            color = '#007aff',
            textColor = '#ffffff'
        } = options;

        // Обработчик клика с использованием ref
        const handleClick = () => {
            if (onClickRef.current) {
                onClickRef.current();
            }
        };

        if (isVisible) {
            try {
                // Настраиваем кнопку
                tg.MainButton.setText(text);
                tg.MainButton.setParams({
                    color,
                    text_color: textColor,
                    is_active: isActive,
                    is_visible: true
                });

                // Показываем/скрываем прогресс
                if (isProgressVisible) {
                    tg.MainButton.showProgress(false); // false = не скрывать кнопку
                } else {
                    tg.MainButton.hideProgress();
                }

                tg.MainButton.show();
                tg.MainButton.onClick(handleClick);
            } catch (e) {
                console.warn('MainButton.show/setParams failed', e);
            }
        }

        // Cleanup
        return () => {
            try {
                tg.MainButton.offClick(handleClick);
                tg.MainButton.hide();
                tg.MainButton.hideProgress();
            } catch (e) {
                console.warn('MainButton cleanup failed', e);
            }
        };
    }, [text, tg, options]);
};

export default useMainButton;
