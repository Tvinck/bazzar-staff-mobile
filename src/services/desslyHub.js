/**
 * DesslyHub API Client
 * Документация: https://desslyhub.readme.io/reference/introduction
 * 
 * Авторизация: Header 'apikey: YOUR_API_KEY'
 * Base URL: https://desslyhub.com/api/v1
 */

const DESSLYHUB_API_KEY = 'b067ff3a1e7840dd9de50c627ac2b59e';
const DESSLYHUB_BASE_URL = '/api/desslyhub'; // Через Vite proxy

class DesslyHubAPI {
    constructor(apiKey = DESSLYHUB_API_KEY) {
        this.apiKey = apiKey;
        this.baseURL = DESSLYHUB_BASE_URL;
    }

    /**
     * Базовый метод для запросов
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            ...options.headers
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('DesslyHub API Error:', error);
            throw error;
        }
    }

    // ==================== MERCHANT & BALANCE ====================

    /**
     * Получить баланс мерчанта
     * GET /merchants/balance
     */
    async getBalance() {
        return this.request('/merchants/balance');
    }

    /**
     * Получить список транзакций
     * GET /merchants/transactions?page=1
     */
    async getTransactions(page = 1) {
        return this.request(`/merchants/transactions?page=${page}`);
    }

    /**
     * Получить транзакцию по ID
     * GET /merchants/transaction/{id}
     */
    async getTransaction(id) {
        return this.request(`/merchants/transaction/${id}`);
    }

    /**
     * Проверить статус транзакции
     * GET /status/{id}
     */
    async checkStatus(id) {
        return this.request(`/status/${id}`);
    }

    // ==================== VOUCHERS (ВАУЧЕРЫ) ====================

    /**
     * Получить список ваучеров
     * GET /service/voucher/products
     */
    async getVouchers() {
        return this.request('/service/voucher/products');
    }

    /**
     * Получить информацию о ваучере
     * GET /service/voucher/products/{id}
     */
    async getVoucher(id) {
        return this.request(`/service/voucher/products/${id}`);
    }

    /**
     * Купить ваучер
     * POST /service/voucher/buy
     * Body: { root_id: number, variant_id: number, reference: string }
     */
    async buyVoucher(data) {
        return this.request('/service/voucher/buy', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ==================== STEAM ====================

    /**
     * Получить список игр Steam
     * GET /service/steamgift/games
     */
    async getSteamGames() {
        return this.request('/service/steamgift/games');
    }

    /**
     * Получить информацию об игре
     * GET /service/steamgift/games/{appid}
     */
    async getSteamGame(appid) {
        return this.request(`/service/steamgift/games/${appid}`);
    }

    /**
     * Купить игру в подарок
     * POST /service/steamgift/gift
     * Body: { appid: number, friend_url: string }
     */
    async buySteamGift(data) {
        return this.request('/service/steamgift/gift', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Проверить Steam логин
     * POST /service/steamtopup/check_login
     * Body: { amount: number, username: string }
     */
    async checkSteamLogin(data) {
        return this.request('/service/steamtopup/check_login', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Пополнить Steam кошелек
     * POST /steam/refill
     * Body: { amount: number, username: string }
     */
    async steamRefill(data) {
        return this.request('/steam/refill', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ==================== MOBILE ====================

    /**
     * Получить список мобильных игр
     * GET /service/mobile/variant/{v}/games
     * v = 1 или 2
     */
    async getMobileGames(variant = 1) {
        return this.request(`/service/mobile/variant/${variant}/games`);
    }

    /**
     * Пополнить мобильный аккаунт
     * POST /service/mobile/variant/{v}/games/refill
     * Body: { game_id: number, account: string, amount: number }
     */
    async mobileRefill(variant, data) {
        return this.request(`/service/mobile/variant/${variant}/games/refill`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ==================== CURRENCY ====================

    /**
     * Получить курс обмена
     * GET /exchange_rate/steam/{currency}
     * currency = USD, RUB, EUR и т.д.
     */
    async getExchangeRate(currency = 'RUB') {
        return this.request(`/exchange_rate/steam/${currency}`);
    }

    // ==================== LEGACY METHODS (для совместимости) ====================

    /**
     * @deprecated Используйте getVouchers()
     */
    async getProducts() {
        return this.getVouchers();
    }

    /**
     * @deprecated Используйте getTransactions()
     */
    async getOrders(params = {}) {
        const page = params.page || 1;
        return this.getTransactions(page);
    }

    /**
     * @deprecated Используйте buyVoucher()
     */
    async createOrder(orderData) {
        // Преобразуем старый формат в новый
        const product = orderData.product_id;

        // Нужно получить root_id и variant_id из product_id
        // Это требует предварительной загрузки списка товаров
        console.warn('createOrder is deprecated. Use buyVoucher with root_id and variant_id');

        return this.buyVoucher({
            root_id: parseInt(product) || 1,
            variant_id: 1,
            reference: orderData.customer_email || `order_${Date.now()}`
        });
    }
}

export const desslyHubAPI = new DesslyHubAPI();
export default desslyHubAPI;
