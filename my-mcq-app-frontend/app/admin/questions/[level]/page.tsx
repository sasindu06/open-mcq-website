// app/admin/questions/[level]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
// --- Added PlusCircle ---
import { ShieldAlert, BookOpen, ChevronRight, Loader2, BookCopy, PlusCircle } from 'lucide-react'; // Icons

export default function SelectSubjectPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const level = params.level ? decodeURIComponent(params.level as string) : null;

    const [subjects, setSubjects] = useState<string[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // Role Check
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    // Fetch Subjects for the Level
    useEffect(() => {
        if (user?.role === 'admin' && level) {
            const fetchSubjects = async () => {
                setIsLoadingData(true);
                setError(null);
                try {
                    // Fetch questions filtered by grade only to get subjects for this level
                    const questionsResponse = await axiosInstance.get<any[]>(`/admin/questions`, {
                        params: { grade: level }
                    });
                    const uniqueSubjects = [...new Set(questionsResponse.data.map(q => q.subject))].sort();
                    setSubjects(uniqueSubjects);

                } catch (err: any) {
                    console.error(`Failed to fetch subjects for level ${level}:`, err);
                    setError(err.response?.data?.message || `Could not load subjects for ${level}.`);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchSubjects();
        } else if (!isAuthLoading) {
             setIsLoadingData(false);
        }
    }, [user, isAuthLoading, level]);


    // Loading / Access Denied States
    if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48} /><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }
     if (!level) {
          return <Layout><div className="text-center p-8"><p>Level parameter missing.</p></div></Layout>;
     }


    // Render Logic
    const renderSubjectSelection = () => {
         if (isLoadingData) {
             return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
        }
         if (error) {
            return <p className="text-center text-red-500 dark:text-red-400 mt-8">{error}</p>;
        }

        // Display buttons for subjects + Add New button
        return (
            <div className="space-y-4 mt-6 max-w-md mx-auto">
                 {/* --- Add New Subject Button --- */}
                 <button
                    onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/add-subject`)} // Navigate to add-subject page
                    className="w-full flex justify-center items-center text-left bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg shadow-sm p-4 hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors duration-150"
                >
                    <span className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-300">
                        <PlusCircle size={18}/> Add New Subject
                    </span>
                </button>
                {/* ----------------------------- */}


                 {subjects.length === 0 && !isLoadingData && (
                     <p className="text-center text-gray-500 dark:text-gray-400 pt-4">No subjects found for {level} yet. Add one above.</p>
                 )}

                {subjects.map((subject) => (
                    <button
                        key={subject}
                        onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}`)}
                        className="w-full flex justify-between items-center text-left bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 transform hover:scale-[1.02]"
                    >
                        <span className="flex items-center gap-3 font-semibold text-lg text-gray-800 dark:text-gray-200">
                           <BookOpen size={20} className="text-purple-600 dark:text-purple-400"/>
                            {subject}
                        </span>
                        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Layout>
             {/* Title & Breadcrumb */}
            <div className="mb-6">
                 <button onClick={() => router.push('/admin/questions')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2">
                     &larr; Back to Levels
                 </button>
                 <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                     <BookCopy size={24}/> {level}
                 </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Select or add a subject to manage questions.
                </p>
            </div>

            {renderSubjectSelection()}

        </Layout>
    );
}