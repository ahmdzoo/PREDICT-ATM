import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar
                open={sidebarOpen}
                onToggle={() => setSidebarOpen((v) => !v)}
            />
            <main
                className={`p-4 lg:p-6 pt-16 lg:pt-6 transition-all duration-300 min-h-screen ${
                    sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
                }`}
            >
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
