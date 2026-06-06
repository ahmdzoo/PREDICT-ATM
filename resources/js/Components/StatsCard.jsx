export default function StatsCard({ icon: Icon, label, value, sub, color = 'emerald', loading = false }) {
    const colors = {
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-indigo-600',
        amber: 'from-amber-500 to-orange-600',
        red: 'from-red-500 to-rose-600',
        cyan: 'from-cyan-500 to-teal-600',
    };

    return (
        <div className={`rounded-xl bg-gradient-to-br ${colors[color]} p-5 text-white shadow-lg`}>
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{label}</p>
                    {loading ? (
                        <div className="h-7 w-28 bg-white/20 rounded animate-pulse" />
                    ) : (
                        <p className="text-2xl font-bold">{value}</p>
                    )}
                    {sub && <p className="text-white/60 text-xs">{sub}</p>}
                </div>
                {Icon && (
                    <div className="p-2.5 bg-white/15 rounded-lg">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
    );
}
