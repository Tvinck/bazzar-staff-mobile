const StatCard = ({ icon, title, value, subtitle, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className="fintech-card rounded-2xl p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium mb-2">{title}</p>
                    <p className="text-2xl font-bold text-white mb-1">{value}</p>
                    <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorClasses[color]}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
