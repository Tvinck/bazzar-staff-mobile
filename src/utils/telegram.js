const tg = window.Telegram?.WebApp;

export const haptic = {
    impact: (style = 'medium') => {
        // style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred(style);
        } else if (navigator.vibrate) {
            // Fallback
            if (style === 'light') navigator.vibrate(10);
            if (style === 'medium') navigator.vibrate(20);
            if (style === 'heavy') navigator.vibrate(40);
        }
    },
    notification: (type = 'success') => {
        // type: 'error' | 'success' | 'warning'
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred(type);
        } else if (navigator.vibrate) {
            if (type === 'success') navigator.vibrate([10, 30, 10]);
            if (type === 'error') navigator.vibrate([50, 50, 50]);
            if (type === 'warning') navigator.vibrate([30, 30]);
        }
    },
    selection: () => {
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.selectionChanged();
        }
    }
};

/**
 * Показать нативный Popup Telegram
 * @param {Object} params - Параметры попапа
 * @param {string} params.title - Заголовок
 * @param {string} params.message - Сообщение
 * @param {Array} params.buttons - Массив кнопок
 * @returns {Promise<string>} ID нажатой кнопки
 */
export const showPopup = (params) => {
    if (!tg?.showPopup) {
        // Fallback для веб-версии
        const result = window.confirm(params.message);
        return Promise.resolve(result ? 'ok' : 'cancel');
    }

    return new Promise((resolve) => {
        const buttons = params.buttons || [
            { id: 'ok', type: 'ok', text: 'OK' }
        ];

        tg.showPopup({
            title: params.title || '',
            message: params.message,
            buttons: buttons
        }, (buttonId) => {
            resolve(buttonId);
        });
    });
};

/**
 * Показать Alert (упрощенная версия popup)
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок (опционально)
 */
export const showAlert = async (message, title = '') => {
    if (!tg?.showAlert) {
        window.alert(message);
        return;
    }

    return new Promise((resolve) => {
        tg.showAlert(message, resolve);
    });
};

/**
 * Показать Confirm диалог
 * @param {string} message - Сообщение
 * @param {string} title - Заголовок
 * @returns {Promise<boolean>} true если OK, false если Cancel
 */
export const showConfirm = async (message, title = 'Подтверждение') => {
    if (!tg?.showConfirm) {
        return window.confirm(message);
    }

    return new Promise((resolve) => {
        tg.showConfirm(message, (confirmed) => {
            resolve(confirmed);
        });
    });
};

/**
 * Показать диалог с кастомными кнопками
 * @param {Object} params
 * @param {string} params.title - Заголовок
 * @param {string} params.message - Сообщение
 * @param {string} params.okText - Текст кнопки OK (по умолчанию "OK")
 * @param {string} params.cancelText - Текст кнопки Cancel (по умолчанию "Отмена")
 * @param {boolean} params.destructive - Сделать OK кнопку красной (по умолчанию false)
 * @returns {Promise<boolean>} true если OK, false если Cancel
 */
export const showDialog = async (params) => {
    const {
        title = '',
        message,
        okText = 'OK',
        cancelText = 'Отмена',
        destructive = false
    } = params;

    const buttons = [
        {
            id: 'ok',
            type: destructive ? 'destructive' : 'default',
            text: okText
        },
        {
            id: 'cancel',
            type: 'cancel',
            text: cancelText
        }
    ];

    const result = await showPopup({ title, message, buttons });
    return result === 'ok';
};

export const setupTelegramApp = () => {
    if (!tg) return;

    // 1. Expand
    tg.expand();

    // 2. Data Protection (Close Confirmation)
    if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
    }

    // 3. Colors
    // We force Dark Mode for this specific app design
    if (tg.setHeaderColor) {
        tg.setHeaderColor('#1c1c1e'); // Main background color
    }
    if (tg.setBackgroundColor) {
        tg.setBackgroundColor('#1c1c1e');
    }

    // 4. Ready
    tg.ready();
};
