import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Hook для управления нативной кнопкой "Назад" в Telegram
 * Автоматически показывает/скрывает кнопку в зависимости от текущего маршрута
 * 
 * @param {Object} options - Опции
 * @param {boolean} options.show - Принудительно показать кнопку (по умолчанию auto)
 * @param {Function} options.onClick - Кастомный обработчик клика (по умолчанию navigate(-1))
 */
export const useBackButton = (options = {}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const tg = window.Telegram?.WebApp;

    useEffect(() => {
        if (!tg?.BackButton) return;

        const { show, onClick } = options;

        // Определяем, нужно ли показывать кнопку
        const isHomePage = location.pathname === '/';
        const shouldShow = show !== undefined ? show : !isHomePage;

        if (shouldShow) {
            // Показываем кнопку
            tg.BackButton.show();

            // Обработчик клика
            const handleBack = () => {
                if (onClick) {
                    onClick();
                } else {
                    navigate(-1);
                }
            };

            tg.BackButton.onClick(handleBack);

            // Cleanup
            return () => {
                tg.BackButton.offClick(handleBack);
                tg.BackButton.hide();
            };
        } else {
            // Скрываем кнопку на главной странице
            tg.BackButton.hide();
        }
    }, [location, navigate, tg, options]);
};

export default useBackButton;
