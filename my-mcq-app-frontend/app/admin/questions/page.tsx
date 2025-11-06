// app/admin/questions/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout'; // Adjust path
import { useAuth } from '../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../lib/axios'; // Adjust path
import { useRouter } from 'next/navigation';
// --- Added PlusCircle ---
import { ShieldAlert, BookCopy, ChevronRight, Loader2, PlusCircle } from 'lucide-react'; // Icons

export default function SelectLevelPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [levels, setLevels] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // Role Check
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    // Fetch Distinct Levels (Grades)
    useEffect(() => {
        if (user?.role === 'admin') {
            const fetchLevels = async () => {
                setIsLoadingData(true);
                setError(null);
                try {
                    const response = await axiosInstance.get<{ grades: string[] }>('/papers/filters');
                    setLevels(response.data.grades?.filter(g => g).sort() || []);
                } catch (err: any) {
                    console.error("Failed to fetch levels:", err);
                    setError(err.response?.data?.message || "Could not load available levels.");
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchLevels();
        } else if (!isAuthLoading) {
             setIsLoadingData(false);
        }
    }, [user, isAuthLoading]);


    // Loading / Access Denied States
    if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48} /><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }

    // Render Logic
    const renderLevelSelection = () => {
         if (isLoadingData) {
            return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
        }
         if (error) {
            return <p className="text-center text-red-500 dark:text-red-400 mt-8">{error}</p>;
        }

        // Display buttons for levels + Add New button
        return (
            <div className="space-y-4 mt-6 max-w-md mx-auto">
                 {/* --- Add New Level Button --- */}
                 <button
                    onClick={() => router.push(`/admin/questions/add-level`)} // Navigate to add-level page
                    className="w-full flex justify-center items-center text-left bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg shadow-sm p-4 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-150"
                >
                    <span className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300">
                        <PlusCircle size={18}/> Add New Level
                    </span>
                </button>
                {/* --------------------------- */}


                 {levels.length === 0 && !isLoadingData && (
                    <p className="text-center text-gray-500 dark:text-gray-400 pt-4">No levels found yet. Add one above.</p>
                 )}

                {levels.map((level) => (
                    <button
                        key={level}
                        onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}`)}
                        className="w-full flex justify-between items-center text-left bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 transform hover:scale-[1.02]"
                    >
                        <span className="flex items-center gap-3 font-semibold text-lg text-gray-800 dark:text-gray-200">
                            <BookCopy size={20} className="text-blue-600 dark:text-blue-400"/>
                            {level}
                        </span>
                        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Layout>
             {/* Title */}
            <div className="mb-6 text-center">
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Manage Questions
                 </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select or add a level (grade) to manage questions for.
                </p>
            </div>

            {renderLevelSelection()}

        </Layout>
    );
}