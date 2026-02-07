import { useEffect, useState } from 'react';

/**
 * Hook для работы с биометрической аутентификацией Telegram
 * Поддерживает FaceID, TouchID, и PIN-код устройства
 * 
 * @returns {Object} - { isAvailable, isInited, authenticate, requestAccess }
 */
export const useBiometric = () => {
    const tg = window.Telegram?.WebApp;
    const [isAvailable, setIsAvailable] = useState(false);
    const [isInited, setIsInited] = useState(false);
    const [biometricType, setBiometricType] = useState(null); // 'face' | 'finger' | 'unknown'

    useEffect(() => {
        if (!tg?.BiometricManager) {
            return;
        }

        // Инициализация BiometricManager
        tg.BiometricManager.init(() => {
            const manager = tg.BiometricManager;
            setIsInited(manager.isInited);
            setIsAvailable(manager.isInited && manager.isBiometricAvailable);
            setBiometricType(manager.biometricType || 'unknown');
        });
    }, [tg]);

    /**
     * Запросить доступ к биометрии
     * @param {string} reason - Причина запроса (отображается пользователю)
     * @returns {Promise<boolean>} - true если доступ предоставлен
     */
    const requestAccess = (reason = 'Для безопасного входа в приложение') => {
        return new Promise((resolve) => {
            if (!tg?.BiometricManager || !isInited) {
                resolve(false);
                return;
            }

            tg.BiometricManager.requestAccess({ reason }, (granted) => {
                if (granted) {
                    setIsAvailable(true);
                }
                resolve(granted);
            });
        });
    };

    /**
     * Аутентифицировать пользователя через биометрию
     * @param {string} reason - Причина аутентификации
     * @returns {Promise<{success: boolean, token?: string}>}
     */
    const authenticate = (reason = 'Подтвердите вход') => {
        return new Promise((resolve) => {
            if (!tg?.BiometricManager || !isAvailable) {
                resolve({ success: false, error: 'Biometric not available' });
                return;
            }

            tg.BiometricManager.authenticate({ reason }, (success, token) => {
                if (success) {
                    resolve({ success: true, token });
                } else {
                    resolve({ success: false, error: 'Authentication failed' });
                }
            });
        });
    };

    /**
     * Обновить биометрический токен (для хранения сессии)
     * @param {string} token - Токен для сохранения
     * @param {string} reason - Причина обновления
     * @returns {Promise<boolean>}
     */
    const updateBiometricToken = (token, reason = 'Сохранение сессии') => {
        return new Promise((resolve) => {
            if (!tg?.BiometricManager || !isAvailable) {
                resolve(false);
                return;
            }

            tg.BiometricManager.updateBiometricToken(token, (updated) => {
                resolve(updated);
            });
        });
    };

    /**
     * Открыть настройки биометрии
     */
    const openSettings = () => {
        if (tg?.BiometricManager?.openSettings) {
            tg.BiometricManager.openSettings();
        }
    };

    return {
        isAvailable,
        isInited,
        biometricType,
        requestAccess,
        authenticate,
        updateBiometricToken,
        openSettings
    };
};

export default useBiometric;
