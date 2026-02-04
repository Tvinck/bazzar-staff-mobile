import { useState } from 'react';

/**
 * Hook для работы со сканером QR-кодов Telegram
 * 
 * @returns {Object} - { isScanning, scanQR, closeScanner }
 */
export const useQRScanner = () => {
    const tg = window.Telegram?.WebApp;
    const [isScanning, setIsScanning] = useState(false);
    const [isAvailable] = useState(!!tg?.showScanQrPopup);

    /**
     * Открыть сканер QR-кодов
     * @param {string} text - Текст подсказки для пользователя
     * @returns {Promise<string|null>} - Данные QR-кода или null если отменено
     */
    const scanQR = (text = 'Отсканируйте QR-код') => {
        return new Promise((resolve) => {
            if (!tg?.showScanQrPopup) {
                console.warn('QR Scanner not available');
                resolve(null);
                return;
            }

            setIsScanning(true);

            tg.showScanQrPopup({ text }, (data) => {
                setIsScanning(false);

                if (data) {
                    // QR код отсканирован
                    resolve(data);
                    return true; // Закрыть сканер
                } else {
                    // Пользователь отменил
                    resolve(null);
                    return true;
                }
            });
        });
    };

    /**
     * Закрыть сканер QR-кодов
     */
    const closeScanner = () => {
        if (tg?.closeScanQrPopup) {
            tg.closeScanQrPopup();
            setIsScanning(false);
        }
    };

    return {
        isAvailable,
        isScanning,
        scanQR,
        closeScanner
    };
};

export default useQRScanner;
