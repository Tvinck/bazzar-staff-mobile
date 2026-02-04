import { supabase } from '../supabase';

export const logAction = async (action, details = {}) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('Audit: No authenticated user found');
            return;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action: action,
                details: details,
                // ip_address can be added if we have a way to fetch it, but usually backend does it.
                // client-side ip is notoriously unreliable or impossible to get without external service.
            });

        if (error) {
            console.error('Audit Log Error:', error);
        }
    } catch (e) {
        console.error('Audit Log Exception:', e);
    }
};

export const ACTIONS = {
    ORDER_STATUS_UPDATE: 'order_status_update',
    MONEY_WITHDRAWAL: 'money_withdrawal',
    USER_BAN: 'user_ban',
    LOGIN: 'login',
    PIN_VERIFIED: 'pin_verified',
    SETTINGS_CHANGE: 'settings_change'
};
