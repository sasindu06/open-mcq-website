// app/admin/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout'; // Adjust path
import { useAuth } from '../../context/AuthContext'; // To check role
import axiosInstance from '../../lib/axios'; // Adjust path
import { useRouter } from 'next/navigation';
import { ShieldAlert, ListChecks, Users, Loader2, BarChart3, UserPlus, Activity, TrendingUp, AlertCircle } from 'lucide-react'; // Added icons

// Define type for the stats data received from backend
interface AdminStatsData {
    timeframe: string;
    startDate: string; // YYYY-MM-DD
    newUsersCount: number;
    activeUsersCount: number;
    topUsers: { userId: string; name: string; attemptCount: number }[];
}

// Define timeframe options
type Timeframe = 'daily' | 'monthly' | 'quarterly' | 'yearly';
const timeframes: Timeframe[] = ['daily', 'monthly', 'quarterly', 'yearly'];

export default function AdminDashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    // State for stats
    const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('daily');
    const [statsData, setStatsData] = useState<AdminStatsData | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState<string | null>(null);

    // --- Role Check & Redirection ---
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            console.log("AdminPage: User not admin, redirecting...");
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    // --- Fetch Stats based on selected timeframe ---
    useEffect(() => {
        if (!isAuthLoading && user?.role === 'admin') {
            const fetchStats = async () => {
                console.log(`Fetching admin stats for timeframe: ${selectedTimeframe}`);
                setIsLoadingStats(true); setStatsError(null);
                try {
                    const response = await axiosInstance.get<AdminStatsData>('/admin/stats', { params: { timeframe: selectedTimeframe } });
                    console.log("Fetched stats data:", response.data);
                    setStatsData(response.data);
                } catch (err: any) { console.error(`Fetch err (${selectedTimeframe}):`, err); setStatsError(err.response?.data?.message || `Could not load stats.`); setStatsData(null); }
                finally { setIsLoadingStats(false); }
            };
            fetchStats();
        } else if (!isAuthLoading) { setIsLoadingStats(false); }
    }, [user, selectedTimeframe, isAuthLoading]);


    // --- Loading / Access Denied States ---
    if (isAuthLoading || (!isAuthLoading && !user)) return <Layout><div className="loading-placeholder"><Loader2/> Verifying access...</div></Layout>;
    if (user?.role !== 'admin') return <Layout><div className="access-denied"><ShieldAlert/> Access Denied</div></Layout>;


    // --- Render Stats Cards ---
    const renderStatsCards = () => {
        if (isLoadingStats) return <div className="stats-loading-grid"> {[...Array(3)].map((_, i) => <div key={i} className="stats-loading-card"></div>)} </div>;
        if (statsError) return <div className="alert-error mt-4"><AlertCircle size={18} /> {statsError}</div>;
        if (!statsData) return <p className="info-text mt-4">Stats unavailable.</p>;

        const statsItems = [
             { icon: UserPlus, label: 'New Users', value: statsData.newUsersCount, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
             { icon: Activity, label: 'Active Users', value: statsData.activeUsersCount, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statsItems.map((item, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                        <div className={`p-3 inline-block rounded-lg ${item.bgColor} ${item.color}`}> <item.icon size={24} /> </div>
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{item.value}</p>
                    </div>
                ))}
            </div>
        );
    }; // <-- Semicolon added

     // --- Render Top Users ---
     const renderTopUsers = () => {
         if (isLoadingStats || !statsData) return null;
         if (statsError) return null;
         if (statsData.topUsers.length === 0) return <p className="info-text mt-4">No users made attempts in this period.</p>;

         return (
             <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center gap-2"> <TrendingUp size={20}/> Top Active Users ({statsData.timeframe}) </h3>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {statsData.topUsers.map((topUser, index) => (
                         <li key={topUser.userId} className="py-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}. {topUser.name}</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{topUser.attemptCount} attempt(s)</span>
                        </li>
                    ))}
                </ul>
             </div>
         );
     }; // <-- Semicolon added


    // --- Main Admin Dashboard Content ---
    return ( // <-- Should parse correctly now
        <Layout>
            {/* Title */}
            <div className="mb-6"> <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Admin Dashboard</h1> </div>

            {/* Timeframe Selection */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
                 <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">View Stats For:</span>
                 {timeframes.map(tf => (
                    <button key={tf} onClick={() => setSelectedTimeframe(tf)} disabled={isLoadingStats}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${selectedTimeframe === tf ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </button>
                 ))}
                 {statsData && !isLoadingStats && ( <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto"> ({statsData.startDate} to Now) </span> )}
            </div>

            {/* Stats Display */}
            <div className="mb-8"> {renderStatsCards()} </div>
            <div className="mb-8 max-w-lg"> {renderTopUsers()} </div>
            <hr className="my-8 dark:border-gray-700"/>

            {/* Management Tools */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Management Tools</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Manage Questions Card */}
                    <button onClick={() => router.push('/admin/questions')}
                        className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-blue-900/30 hover:scale-[1.03] transition-all duration-200 text-left border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"> <ListChecks size={24} /> </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Manage Questions</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, or delete quiz questions.</p>
                            </div>
                         </div>
                    </button>
                     {/* Manage Users Card */}
                    <button onClick={() => router.push('/admin/users')}
                         className="group block p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl dark:hover:shadow-purple-900/30 hover:scale-[1.03] transition-all duration-200 text-left border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-600">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"> <Users size={24} /> </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Manage Users</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">View, edit roles, or delete users.</p>
                            </div>
                         </div>
                    </button>
                </div>
            </div>

             {/* Minimal Global Styles needed */}
             <style jsx global>{`
                /* Global styles */
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; }
                .access-denied { text-align: center; padding: 2rem; } .access-denied svg { margin: auto; color: #EF4444; margin-bottom: 1rem; } .access-denied h1 { font-size: 1.25rem; font-weight: 600; color: #B91C1C; } .dark .access-denied h1 { color: #F87171; }
                .error-text { text-align: center; color: #DC2626; } .dark .error-text { color: #F87171; }
                .info-text { text-align: center; color: #6B7280; } .dark .info-text { color: #9CA3AF; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; } .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; } .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
                /* Stats Loading Placeholder */
                .stats-loading-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1.5rem; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @media (min-width: 768px) { .stats-loading-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (min-width: 1024px) { .stats-loading-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
                .stats-loading-card { height: 8rem; background-color: #E5E7EB; border-radius: 0.75rem; } .dark .stats-loading-card { background-color: #374151; }
             `}</style>

        </Layout>
    );
}