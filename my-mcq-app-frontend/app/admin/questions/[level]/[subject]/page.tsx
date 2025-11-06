// app/admin/questions/[level]/[subject]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation'; // Import useParams
// --- FIX: Add PlusCircle to the import ---
import { ShieldAlert, CalendarDays, ChevronRight, Loader2, BookCopy, BookOpen, PlusCircle } from 'lucide-react'; // Icons

export default function SelectYearPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams(); // Get URL parameters

    // Extract level and subject from URL, decode URI components
    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;

    const [years, setYears] = useState<number[]>([]); // Years are numbers
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // --- Role Check ---
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    // --- Fetch Distinct Years for the Selected Level and Subject ---
    useEffect(() => {
        // Only fetch if admin and parameters are available
        if (user?.role === 'admin' && level && subject) {
            const fetchYears = async () => {
                setIsLoadingData(true);
                setError(null);
                try {
                    // Fetch questions filtered by both grade and subject
                    const questionsResponse = await axiosInstance.get<any[]>(`/admin/questions`, {
                        params: {
                            grade: level,
                            subject: subject
                        }
                    });

                    // Extract unique years, convert to numbers, filter out NaN, and sort descending
                    const uniqueYears = Array.from(new Set(questionsResponse.data.map(q => parseInt(q.year, 10))))
                                        .filter(year => !isNaN(year)) // Ensure they are valid numbers
                                        .sort((a, b) => b - a); // Sort newest year first
                    setYears(uniqueYears);

                } catch (err: any) {
                    console.error(`Failed to fetch years for ${level} ${subject}:`, err);
                    setError(err.response?.data?.message || `Could not load years for ${level} ${subject}.`);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchYears();
        } else if (!isAuthLoading) {
             setIsLoadingData(false); // Stop loading if not admin or params missing
        }
    }, [user, isAuthLoading, level, subject]); // Depend on level and subject


     // --- Loading / Access Denied / Missing Params States ---
    if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48} className="mx-auto text-red-500 mb-4" /><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }
     if (!level || !subject) {
          return <Layout><div className="text-center p-8"><p>Level or Subject parameter missing in URL.</p></div></Layout>;
     }


    // --- Render Logic ---
    const renderYearSelection = () => {
         if (isLoadingData) {
             return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
        }
         if (error) {
            return <p className="text-center text-red-500 dark:text-red-400 mt-8">{error}</p>;
        }
         if (years.length === 0) {
            return (
                 <div className="text-center text-gray-500 dark:text-gray-400 mt-8 space-y-4">
                     <p>No years found for {level} - {subject}.</p>
                     {/* Button to add the first paper/year */}
                     <button
                        onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/add-paper`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                     >
                        <PlusCircle size={18}/> Add First Year/Paper
                     </button>
                </div>
            );
        }

        // Display buttons for each year
        return (
            <div className="space-y-4 mt-6 max-w-md mx-auto">
                {/* --- Add New Year/Paper Button --- */}
                 <button
                    onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/add-paper`)}
                    className="w-full flex justify-center items-center text-left bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg shadow-sm p-4 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-150"
                >
                    <span className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300">
                        <PlusCircle size={18}/> Add New Year/Paper
                    </span>
                </button>


                {years.map((year) => (
                    <button
                        key={year}
                        // Navigate to the question list page for this level, subject, and year
                        onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/${year}`)}
                        className="w-full flex justify-between items-center text-left bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 transform hover:scale-[1.02]"
                    >
                        <span className="flex items-center gap-3 font-semibold text-lg text-gray-800 dark:text-gray-200">
                           <CalendarDays size={20} className="text-green-600 dark:text-green-400"/>
                            {year}
                        </span>
                        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Layout>
             {/* Title & Breadcrumb/Back link */}
            <div className="mb-6">
                 <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}`)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-1">
                     <ChevronRight size={16} className="transform rotate-180"/> Back to Subjects ({level})
                 </button>
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <BookOpen size={24}/> {subject}
                 </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Select the year to manage questions for, or add a new paper.
                </p>
            </div>

             {/* Render year list or loading/error states */}
            {renderYearSelection()}

        </Layout>
    );
}
