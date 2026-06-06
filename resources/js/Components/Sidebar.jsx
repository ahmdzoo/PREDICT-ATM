import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ArrowLeftRight,
    TrendingUp,
    LogOut,
    Menu,
    X,
    PanelLeftClose,
    PanelLeft,
    Landmark,
    Building2,
    Banknote,
    Wallet,
    ArrowUpDown,
    Smartphone,
    ChevronDown,
    List,
    PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
    { to: '/prediction', icon: TrendingUp, label: 'Prediksi SES' },
];

const txMenuItems = [
    { to: '/transactions', icon: List, label: 'Riwayat Transaksi' },
    { to: '/transactions/create?jenis=tarik_tunai', icon: Wallet, label: 'Tarik Tunai' },
    { to: '/transactions/create?jenis=transfer', icon: ArrowUpDown, label: 'Transfer' },
    { to: '/transactions/create?jenis=ppob', icon: Smartphone, label: 'PPOB' },
    { to: '/transactions/create?jenis=topup_digital', icon: Banknote, label: 'Topup Digital' },
    { to: '/transactions/create?jenis=restock_kas', icon: Banknote, label: 'Restock Kas' },
];

export default function Sidebar({ open, onToggle }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [txDropdownOpen, setTxDropdownOpen] = useState(false);
    const txDropdownRef = useRef(null);

    const isActive = (path) => {
        if (path === '/transactions') {
            return location.pathname === '/transactions';
        }
        return location.pathname === path;
    };
    const isOwner = user?.role === 'owner';

    const isTxActive = location.pathname === '/transactions' || location.pathname === '/transactions/create';

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (txDropdownRef.current && !txDropdownRef.current.contains(event.target)) {
                setTxDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close dropdown on navigation
    useEffect(() => {
        setTxDropdownOpen(false);
    }, [location]);

    const allNavItems = isOwner
        ? [
            ...navItems,
            { to: '/branches', icon: Building2, label: 'Cabang' },
            { to: '/master-banks', icon: Banknote, label: 'Master Bank' },
        ]
        : navItems;

    return (
        <>
            {/* Mobile hamburger — always visible on small screens */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
            >
                <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Floating expand button — desktop only, shown when sidebar is collapsed */}
            {!open && (
                <button
                    onClick={onToggle}
                    className="hidden lg:flex fixed top-1/2 -translate-y-1/2 left-0 z-50 w-6 h-12 bg-white border border-gray-200 rounded-r-lg shadow-sm items-center justify-center hover:bg-gray-100 transition-colors"
                >
                    <PanelLeft className="w-4 h-4 text-gray-400" />
                </button>
            )}

            <aside
                className={`
                    fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-white flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${open ? 'lg:translate-x-0' : 'lg:-translate-x-full'}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500 rounded-lg">
                            <Landmark className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm">Mini ATM</h1>
                            <p className="text-xs text-slate-400">BRI Link</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Desktop collapse button */}
                        <button
                            onClick={onToggle}
                            className="hidden lg:flex p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Tutup sidebar"
                        >
                            <PanelLeftClose className="w-4 h-4 text-slate-400" />
                        </button>
                        {/* Mobile close button */}
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden p-1 hover:bg-slate-800 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Branch indicator for admin */}
                {!isOwner && user?.branch && (
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{user.branch.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-300">Admin</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {allNavItems.map((item) => {
                        if (item.to === '/transactions') {
                            return (
                                <div key={item.to} className="relative" ref={txDropdownRef}>
                                    <button
                                        onClick={() => setTxDropdownOpen((v) => !v)}
                                        className={`
                                            w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                            ${isTxActive
                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                            }
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                                            <span>{item.label}</span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${txDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {txDropdownOpen && (
                                        <div className="ml-7 mt-1 space-y-0.5 border-l-2 border-emerald-500/30 pl-3">
                                            {txMenuItems.map((m) => {
                                                const active = isActive(m.to);
                                                return (
                                                    <NavLink
                                                        key={m.to}
                                                        to={m.to}
                                                        onClick={() => { setMobileOpen(false); setTxDropdownOpen(false); }}
                                                        className={`
                                                            flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                                                            ${active
                                                                ? 'bg-emerald-500/15 text-emerald-400'
                                                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                                            }
                                                        `}
                                                    >
                                                        <m.icon className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span>{m.label}</span>
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                    ${isActive(item.to)
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                            >
                                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User info & logout */}
                <div className="border-t border-slate-700 p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-bold">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
