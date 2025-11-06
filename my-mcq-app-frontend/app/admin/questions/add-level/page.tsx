// app/admin/questions/add-level/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
// --- CORRECTED IMPORT PATHS ---
import Layout from '../../../../components/Layout'; // Go up 4 levels to src/
import { useAuth } from '../../../../context/AuthContext'; // Go up 4 levels to src/
// -----------------------------
import { useRouter } from 'next/navigation';
import { ShieldAlert, PlusCircle, ChevronRight, Loader2, AlertCircle, BookCopy } from 'lucide-react'; // Icons

export default function AddNewLevelPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    // Form state
    const [newLevel, setNewLevel] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

     // --- Role Check ---
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);


    // --- Loading / Access Denied ---
     if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48}/><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }

    // --- Handlers ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic Validation
        const trimmedLevel = newLevel.trim();
        if (!trimmedLevel) {
            setError('Level name cannot be empty.');
            return;
        }

        setIsSubmitting(true);

        // Navigate to the "Add New Subject" page for this new level
        router.push(`/admin/questions/${encodeURIComponent(trimmedLevel)}/add-subject`);
    };


    return (
        <Layout>
             {/* Title & Breadcrumbs */}
            <div className="mb-6">
                 {/* Breadcrumbs/Back Links */}
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                     <button onClick={() => router.push('/admin/questions')} className="hover:underline">Levels</button>
                 </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PlusCircle /> Add New Level
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Enter the name for the new level or grade (e.g., "Primary 6", "A/L London").
                </p>
            </div>

            {/* Add Level Form */}
            <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-2 text-sm">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                     {/* New Level Input */}
                    <div>
                        <label htmlFor="newLevel" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            New Level Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                             <BookCopy className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                                id="newLevel"
                                type="text"
                                value={newLevel}
                                onChange={(e) => setNewLevel(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-lg transition-all duration-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none"
                                placeholder="e.g., Primary 6"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                             {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : 'Next: Add First Subject'}
                             {!isSubmitting && <ChevronRight size={18}/>}
                        </button>
                    </div>

                </form>
            </div>
             {/* Styles (optional) */}
             <style jsx>{`
                input { background-color: #F9FAFB; color: #111827; border: 1px solid #D1D5DB; }
                .dark input { background-color: #374151; color: #F9FAFB; border-color: #4B5563; }
                input:focus { border-color: #3B82F6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
            `}</style>
        </Layout>
    );
}