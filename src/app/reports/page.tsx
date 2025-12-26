/* eslint-disable react/forbid-dom-props */
/* hint-disable no-inline-styles */
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { POSExtendedService } from "@/services/pos-extended";
import { ArrowLeft, Calendar, DollarSign, ShoppingBag, Users, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export default function ReportsPage() {
    const { user, isLoaded } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [trend, setTrend] = useState<any[]>([]);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState("today"); // today, week, month

    const tenantId = (user?.publicMetadata?.tenantId as string);
    const outletId = (user?.publicMetadata?.outletId as string);

    useEffect(() => {
        if (isLoaded && tenantId && outletId) {
            loadReports();
        }
    }, [isLoaded, tenantId, outletId, dateRange]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const now = new Date();
            let start = new Date();
            let end = new Date();

            if (dateRange === "today") {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            } else if (dateRange === "week") {
                start = subDays(now, 7);
            } else if (dateRange === "month") {
                start = startOfMonth(now);
                end = endOfMonth(now);
            }

            const [statsData, trendData, topItemsData] = await Promise.all([
                POSExtendedService.getReportStats({ tenantId, outletId }, start, end),
                POSExtendedService.getReportSalesTrend({ tenantId, outletId }, start, end),
                POSExtendedService.getReportTopItems({ tenantId, outletId }, start, end)
            ]);

            setStats(statsData);
            setTrend(trendData);
            setTopItems(topItemsData);
        } catch (error) {
            console.error("Failed to load reports", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowLeft />
                        </Link>
                        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                    </div>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        {['today', 'week', 'month'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${dateRange === range ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Sales"
                                value={`$${stats?.sales?.toLocaleString() || 0}`}
                                icon={<DollarSign className="text-green-600" />}
                                color="bg-green-50 text-green-700"
                            />
                            <StatCard
                                title="Total Orders"
                                value={stats?.orders || 0}
                                icon={<ShoppingBag className="text-blue-600" />}
                                color="bg-blue-50 text-blue-700"
                            />
                            <StatCard
                                title="Customers"
                                value={stats?.customers || 0}
                                icon={<Users className="text-purple-600" />}
                                color="bg-purple-50 text-purple-700"
                            />
                            <StatCard
                                title="Avg Order Value"
                                value={`$${Math.round(stats?.avgOrderValue || 0)}`}
                                icon={<TrendingUp className="text-orange-600" />}
                                color="bg-orange-50 text-orange-700"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Sales Trend */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Sales Trend</h3>
                                <div className="h-64 flex items-end gap-2">
                                    {trend.length === 0 ? (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">No data available</div>
                                    ) : (
                                        trend.map((item, idx) => {
                                            const max = Math.max(...trend.map(t => t.amount));
                                            const height = (item.amount / max) * 100;
                                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                            // @ts-ignore
                                            const barStyle = { '--bar-height': `${height}%` } as React.CSSProperties;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                                    <div
                                                        className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-all h-[var(--bar-height)]"
                                                        // eslint-disable-next-line
                                                        style={barStyle}
                                                    ></div>
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap z-10">
                                                        {format(new Date(item.date), 'MMM d')}: ${item.amount}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-400">
                                    <span>{trend[0] ? format(new Date(trend[0].date), 'MMM d') : ''}</span>
                                    <span>{trend[trend.length - 1] ? format(new Date(trend[trend.length - 1].date), 'MMM d') : ''}</span>
                                </div>
                            </div>

                            {/* Top Items */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-lg mb-4">Top Selling Items</h3>
                                <div className="space-y-4">
                                    {topItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-500 border border-gray-200">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-gray-500">{item.orders} orders</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-gray-700">
                                                ${item.revenue.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                    {topItems.length === 0 && (
                                        <div className="text-center text-gray-400 py-8">No sales data yet</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
                {icon}
            </div>
        </div>
    );
}
