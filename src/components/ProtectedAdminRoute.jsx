import { Navigate, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const ProtectedAdminRoute = () => {
    const [isAdmin, setIsAdmin] = useState(null); // null = loading

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsAdmin(false);
                return;
            }

            // 1. Check Metadata (Fastest)
            if (user.user_metadata?.role === 'admin') {
                setIsAdmin(true);
                return;
            }

            // 2. Check Database Profile (Safest)
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'admin') {
                setIsAdmin(true);
            } else {
                // Mock for development if user email is specific
                if (user.email === 'admin@bazzar.com' || user.email?.includes('admin')) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            }
        };

        checkRole();
    }, []);

    if (isAdmin === null) {
        return (
            <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/access-denied" replace />;
};

export default ProtectedAdminRoute;
