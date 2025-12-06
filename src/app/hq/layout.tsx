import Link from 'next/link';
import { LayoutDashboard, Store, ArrowRightLeft, PieChart, Settings, LogOut } from 'lucide-react';

export default function HQLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Beloop<span className="text-rose-500">.</span>HQ
                    </h1>
                    <p className="text-slate-400 text-xs mt-1">Enterprise Admin</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink href="/hq" icon={<LayoutDashboard size={20} />} label="Overview" />
                    <NavLink href="/hq/branches" icon={<Store size={20} />} label="Branches" />
                    <NavLink href="/hq/inventory" icon={<ArrowRightLeft size={20} />} label="Inventory & Transfers" />
                    <NavLink href="/hq/reports" icon={<PieChart size={20} />} label="Reports" />
                    <NavLink href="/hq/settings" icon={<Settings size={20} />} label="Settings" />
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2 rounded-lg hover:bg-slate-800">
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
        >
            {icon}
            <span className="font-medium">{label}</span>
        </Link>
    );
}
