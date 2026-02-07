const tg = window.Telegram?.WebApp;

export const haptic = {
    impact: (style = 'medium') => {
        try {
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred(style);
            } else if (navigator.vibrate) {
                if (style === 'light') navigator.vibrate(10);
                if (style === 'medium') navigator.vibrate(20);
                if (style === 'heavy') navigator.vibrate(40);
            }
        } catch (e) {
            console.warn('Haptic impact not supported', e);
        }
    },
    notification: (type = 'success') => {
        try {
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred(type);
            } else if (navigator.vibrate) {
                if (type === 'success') navigator.vibrate([10, 30, 10]);
                if (type === 'error') navigator.vibrate([50, 50, 50]);
                if (type === 'warning') navigator.vibrate([30, 30]);
            }
        } catch (e) {
            console.warn('Haptic notification not supported', e);
        }
    },
    selection: () => {
        try {
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.selectionChanged();
            }
        } catch (e) {
            console.warn('Haptic selection not supported', e);
        }
    }
};

/**
 * Показать нативный Popup Telegram
 */
export const showPopup = (params) => {
    if (!tg?.showPopup) {
        const result = window.confirm(params.message);
        return Promise.resolve(result ? 'ok' : 'cancel');
    }

    return new Promise((resolve) => {
        try {
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
        } catch (e) {
            console.error('tg.showPopup failed', e);
            const result = window.confirm(params.message);
            resolve(result ? 'ok' : 'cancel');
        }
    });
};

/**
 * Показать Alert
 */
export const showAlert = async (message, title = '') => {
    if (!tg?.showAlert) {
        window.alert(message);
        return;
    }

    return new Promise((resolve) => {
        try {
            tg.showAlert(message, resolve);
        } catch (e) {
            console.error('tg.showAlert failed', e);
            window.alert(message);
            resolve();
        }
    });
};

/**
 * Показать Confirm диалог
 */
export const showConfirm = async (message, title = 'Подтверждение') => {
    if (!tg?.showConfirm) {
        return window.confirm(message);
    }

    return new Promise((resolve) => {
        try {
            tg.showConfirm(message, (confirmed) => {
                resolve(confirmed);
            });
        } catch (e) {
            console.error('tg.showConfirm failed', e);
            resolve(window.confirm(message));
        }
    });
};

/**
 * Показать диалог с кастомными кнопками
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

    try {
        // 1. Expand
        if (tg.expand) tg.expand();

        // 2. Data Protection
        if (tg.enableClosingConfirmation) {
            tg.enableClosingConfirmation();
        }

        // 3. Colors
        if (tg.setHeaderColor) {
            tg.setHeaderColor('#1c1c1e');
        }
        if (tg.setBackgroundColor) {
            tg.setBackgroundColor('#1c1c1e');
        }

        // 4. Ready
        if (tg.ready) tg.ready();
    } catch (e) {
        console.warn('setupTelegramApp encountered unsupported methods', e);
    }
};
