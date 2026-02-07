import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from './SkeletonLoader';

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue', trend, delay = 0, isLoading }) => {

    const colors = {
        // ... (keep existing colors map)
        blue: {
            bg: 'bg-accent-blue/10',
            text: 'text-accent-blue',
            border: 'border-accent-blue/20',
            glow: 'shadow-accent-blue/10'
        },
        green: {
            bg: 'bg-accent-green/10',
            text: 'text-accent-green',
            border: 'border-accent-green/20',
            glow: 'shadow-accent-green/10'
        },
        orange: {
            bg: 'bg-accent-orange/10',
            text: 'text-accent-orange',
            border: 'border-accent-orange/20',
            glow: 'shadow-accent-orange/10'
        },
        purple: {
            bg: 'bg-accent-purple/10',
            text: 'text-accent-purple',
            border: 'border-accent-purple/20',
            glow: 'shadow-accent-purple/10'
        },
        cyan: {
            bg: 'bg-accent-cyan/10',
            text: 'text-accent-cyan',
            border: 'border-accent-cyan/20',
            glow: 'shadow-accent-cyan/10'
        },
        red: {
            bg: 'bg-accent-red/10',
            text: 'text-accent-red',
            border: 'border-accent-red/20',
            glow: 'shadow-accent-red/10'
        }
    };

    const theme = colors[color] || colors.blue;

    if (isLoading) {
        return (
            <div className={`glass-card p-5 rounded-2xl border border-white/5 relative`}>
                <div className="flex justify-between items-start mb-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className={`glass-card p-5 rounded-2xl border ${theme.border} shadow-lg ${theme.glow} relative group`}
        >
            {/* Background Gradient Splash */}
            <div className={`absolute top-0 right-0 w-24 h-24 ${theme.bg} blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 group-hover:opacity-40 transition-opacity`} />

            <div className="relative z-10 flex justify-between items-start mb-3">
                <div className={`p-2.5 rounded-xl ${theme.bg} ${theme.text} border ${theme.border}`}>
                    <Icon className="w-6 h-6" />
                </div>

                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${trend > 0
                        ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                        : 'bg-accent-red/10 text-accent-red border-accent-red/20'
                        }`}>
                        {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1">
                    {title}
                </h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white tracking-tight">
                        {value}
                    </span>
                </div>
                {subtitle && (
                    <p className="text-zinc-500 text-xs mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
