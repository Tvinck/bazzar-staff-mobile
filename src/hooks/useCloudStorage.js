import { useEffect, useState } from 'react';

/**
 * Hook для работы с Cloud Storage Telegram
 * Позволяет сохранять данные пользователя в облаке (до 1024 ключей)
 * 
 * @returns {Object} - { getItem, setItem, getItems, setItems, removeItem, removeItems, getKeys }
 */
export const useCloudStorage = () => {
    const tg = window.Telegram?.WebApp;
    const [isAvailable, setIsAvailable] = useState(false);

    useEffect(() => {
        setIsAvailable(!!tg?.CloudStorage);
    }, [tg]);

    /**
     * Получить значение по ключу
     * @param {string} key - Ключ (1-128 символов)
     * @returns {Promise<string|null>}
     */
    const getItem = (key) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve(null);
                return;
            }

            tg.CloudStorage.getItem(key, (error, value) => {
                if (error) {
                    console.error('CloudStorage getItem error:', error);
                    resolve(null);
                } else {
                    resolve(value || null);
                }
            });
        });
    };

    /**
     * Сохранить значение по ключу
     * @param {string} key - Ключ (1-128 символов)
     * @param {string} value - Значение (до 4096 символов)
     * @returns {Promise<boolean>}
     */
    const setItem = (key, value) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve(false);
                return;
            }

            tg.CloudStorage.setItem(key, value, (error, success) => {
                if (error) {
                    console.error('CloudStorage setItem error:', error);
                    resolve(false);
                } else {
                    resolve(success);
                }
            });
        });
    };

    /**
     * Получить несколько значений
     * @param {string[]} keys - Массив ключей
     * @returns {Promise<Object>}
     */
    const getItems = (keys) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve({});
                return;
            }

            tg.CloudStorage.getItems(keys, (error, values) => {
                if (error) {
                    console.error('CloudStorage getItems error:', error);
                    resolve({});
                } else {
                    resolve(values || {});
                }
            });
        });
    };

    /**
     * Сохранить несколько значений
     * @param {Object} items - Объект { key: value }
     * @returns {Promise<boolean>}
     */
    const setItems = (items) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve(false);
                return;
            }

            tg.CloudStorage.setItems(items, (error, success) => {
                if (error) {
                    console.error('CloudStorage setItems error:', error);
                    resolve(false);
                } else {
                    resolve(success);
                }
            });
        });
    };

    /**
     * Удалить значение по ключу
     * @param {string} key - Ключ
     * @returns {Promise<boolean>}
     */
    const removeItem = (key) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve(false);
                return;
            }

            tg.CloudStorage.removeItem(key, (error, success) => {
                if (error) {
                    console.error('CloudStorage removeItem error:', error);
                    resolve(false);
                } else {
                    resolve(success);
                }
            });
        });
    };

    /**
     * Удалить несколько значений
     * @param {string[]} keys - Массив ключей
     * @returns {Promise<boolean>}
     */
    const removeItems = (keys) => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve(false);
                return;
            }

            tg.CloudStorage.removeItems(keys, (error, success) => {
                if (error) {
                    console.error('CloudStorage removeItems error:', error);
                    resolve(false);
                } else {
                    resolve(success);
                }
            });
        });
    };

    /**
     * Получить все ключи
     * @returns {Promise<string[]>}
     */
    const getKeys = () => {
        return new Promise((resolve) => {
            if (!tg?.CloudStorage) {
                resolve([]);
                return;
            }

            tg.CloudStorage.getKeys((error, keys) => {
                if (error) {
                    console.error('CloudStorage getKeys error:', error);
                    resolve([]);
                } else {
                    resolve(keys || []);
                }
            });
        });
    };

    return {
        isAvailable,
        getItem,
        setItem,
        getItems,
        setItems,
        removeItem,
        removeItems,
        getKeys
    };
};

export default useCloudStorage;
