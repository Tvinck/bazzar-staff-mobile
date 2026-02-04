import { useEffect, useState } from 'react';

/**
 * Hook для работы с темой Telegram
 * Автоматически адаптирует приложение под тему пользователя
 * 
 * @returns {Object} - { themeParams, colorScheme, isDark }
 */
export const useTelegramTheme = () => {
    const tg = window.Telegram?.WebApp;
    const [themeParams, setThemeParams] = useState(tg?.themeParams || {});
    const [colorScheme, setColorScheme] = useState(tg?.colorScheme || 'dark');

    useEffect(() => {
        if (!tg) return;

        // Инициализация
        setThemeParams(tg.themeParams);
        setColorScheme(tg.colorScheme);

        // Слушать изменения темы
        const handleThemeChange = () => {
            setThemeParams(tg.themeParams);
            setColorScheme(tg.colorScheme);
        };

        tg.onEvent('themeChanged', handleThemeChange);

        return () => {
            tg.offEvent('themeChanged', handleThemeChange);
        };
    }, [tg]);

    const isDark = colorScheme === 'dark';

    return {
        themeParams,
        colorScheme,
        isDark,
        // Основные цвета
        bgColor: themeParams.bg_color || '#1c1c1e',
        textColor: themeParams.text_color || '#ffffff',
        hintColor: themeParams.hint_color || '#8e8e93',
        linkColor: themeParams.link_color || '#007aff',
        buttonColor: themeParams.button_color || '#007aff',
        buttonTextColor: themeParams.button_text_color || '#ffffff',
        secondaryBgColor: themeParams.secondary_bg_color || '#2c2c2e',
        headerBgColor: themeParams.header_bg_color || '#1c1c1e',
        accentTextColor: themeParams.accent_text_color || '#007aff',
        sectionBgColor: themeParams.section_bg_color || '#1c1c1e',
        sectionHeaderTextColor: themeParams.section_header_text_color || '#8e8e93',
        subtitleTextColor: themeParams.subtitle_text_color || '#8e8e93',
        destructiveTextColor: themeParams.destructive_text_color || '#ff3b30'
    };
};

export default useTelegramTheme;
