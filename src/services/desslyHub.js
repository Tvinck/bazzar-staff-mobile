/**
 * DesslyHub API Client (via Supabase Edge Function)
 * 
 * All requests are routed through 'dbm-io' Edge Function for security.
 * Authorization: Handled by Edge Function using stored credentials.
 */

import { supabase } from '../supabase';

class DesslyHubAPI {

    /**
     * Invoke the Edge Function
     */
    async invoke(action, payload = {}) {
        try {
            const { data, error } = await supabase.functions.invoke('dbm-io', {
                body: { action, ...payload }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`DesslyHub API Error (${action}):`, error);
            throw error;
        }
    }

    // ==================== MERCHANT & BALANCE ====================

    async getBalance() {
        return this.invoke('get_balance');
    }

    async getTransactions(page = 1) {
        return this.invoke('get_transactions', { page });
    }

    // ==================== VOUCHERS (ВАУЧЕРЫ) ====================

    async getVouchers() {
        return this.invoke('get_vouchers');
    }

    async buyVoucher(data) {
        // data: { root_id, variant_id, reference }
        return this.invoke('buy_voucher', data);
    }

    // ==================== STEAM ====================

    async getSteamGames() {
        return this.invoke('get_steam_games');
    }

    async buySteamGift(data) {
        // data: { appid, friend_url }
        return this.invoke('buy_steam_gift', data);
    }

    async steamRefill(data) {
        // data: { amount, username }
        return this.invoke('steam_refill', data);
    }

    // ==================== MOBILE ====================
    // Not implemented in Edge Function yet, skipping or could implement later

    // ==================== LEGACY COMPATIBILITY ====================

    async getProducts() {
        return this.getVouchers();
    }
}

export const desslyHubAPI = new DesslyHubAPI();
export default desslyHubAPI;

