export const cache = {
    // Save data to LocalStorage with timestamp
    set: (key, data, ttlMinutes = 60) => {
        try {
            const item = {
                data,
                expiry: Date.now() + ttlMinutes * 60 * 1000,
            };
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.error('Cache set error', e);
        }
    },

    // Get data if not expired
    get: (key) => {
        try {
            const itemStr = localStorage.getItem(key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            if (Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.data;
        } catch (e) {
            return null;
        }
    },

    // Helper to fetch with cache fallback
    fetchWithCache: async (key, fetcher, ttlMinutes = 60) => {
        try {
            // 1. Try Network
            const data = await fetcher();
            if (data) {
                cache.set(key, data, ttlMinutes);
                return data;
            }
        } catch (e) {
            console.warn('Network failed, trying cache...', e);
        }

        // 2. Fallback to Cache
        const cached = cache.get(key);
        return cached || null; // Return null if nothing found
    }
};
