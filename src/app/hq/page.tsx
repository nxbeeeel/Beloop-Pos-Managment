import { TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';

export default function HQDashboard() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
                <p className="text-slate-500">Welcome back, Admin. Here's what's happening across your network.</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value="$124,592"
                    change="+12.5%"
                    icon={<DollarSign className="text-emerald-600" />}
                    trend="up"
                />
                <StatCard
                    title="Active Branches"
                    value="12"
                    change="2 New"
                    icon={<StoreIcon className="text-blue-600" />}
                    trend="neutral"
                />
                <StatCard
                    title="Total Orders"
                    value="1,459"
                    change="+8.2%"
                    icon={<TrendingUp className="text-rose-600" />}
                    trend="up"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value="5"
                    change="Action Needed"
                    icon={<AlertCircle className="text-amber-600" />}
                    trend="down"
                    isAlert
                />
            </div>

            {/* Recent Activity & Branch Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area (Placeholder) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-4">Revenue Trends</h3>
                    <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        [Chart Component Placeholder]
                    </div>
                </div>

                {/* Top Branches */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-4">Top Performing Branches</h3>
                    <div className="space-y-4">
                        <BranchRow name="Downtown Flagship" revenue="$45,200" status="Open" />
                        <BranchRow name="Westside Mall" revenue="$32,150" status="Open" />
                        <BranchRow name="Airport Kiosk" revenue="$18,900" status="Busy" />
                        <BranchRow name="North Station" revenue="$12,400" status="Closing" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon, trend, isAlert }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${isAlert ? 'bg-amber-50' : 'bg-slate-50'}`}>
                    {icon}
                </div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-700' :
                        trend === 'down' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                    {change}
                </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
    );
}

function BranchRow({ name, revenue, status }: any) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
            <div>
                <p className="font-medium text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">Today: {revenue}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'Busy' ? 'bg-rose-100 text-rose-700' :
                    status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {status}
            </span>
        </div>
    );
}

function StoreIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
        </svg>
    );
}
