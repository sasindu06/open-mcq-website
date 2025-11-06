// app/admin/questions/[level]/[subject]/[year]/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, ListChecks, PlusCircle, Edit, Trash2, Loader2, BookCopy, BookOpen, CalendarDays, ChevronRight } from 'lucide-react'; // Icons

// Define the shape of a question object
interface Question {
    _id: string;
    grade: string;
    subject: string;
    year: number;
    question: string;
    options: string[];
    correctAnswer: string;
}

export default function ManageSpecificQuestionsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    // Extract parameters from URL
    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;
    const year = params.year ? parseInt(decodeURIComponent(params.year as string), 10) : null;

    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

     // --- Role Check ---
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);

    // --- Fetch Questions for the specific level, subject, and year ---
    useEffect(() => {
        if (user?.role === 'admin' && level && subject && year) {
            const fetchQuestions = async () => {
                setIsLoadingData(true);
                setError(null);
                try {
                    // Fetch questions filtered by all three parameters
                    const response = await axiosInstance.get<Question[]>(`/admin/questions`, {
                        params: {
                            grade: level,
                            subject: subject,
                            year: year
                        }
                    });
                    setQuestions(response.data);
                } catch (err: any) {
                    console.error(`Failed to fetch questions for ${level} ${subject} ${year}:`, err);
                    setError(err.response?.data?.message || `Could not load questions.`);
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchQuestions();
        } else if (!isAuthLoading) {
             setIsLoadingData(false);
        }
    }, [user, isAuthLoading, level, subject, year]); // Depend on all params


    // --- Loading / Access Denied / Missing Params States ---
    if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48} className="mx-auto text-red-500 mb-4" /><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }
     if (!level || !subject || year === null || isNaN(year)) {
          return <Layout><div className="text-center p-8"><p>Level, Subject, or Year parameter missing or invalid in URL.</p></div></Layout>;
     }


    // --- Handlers ---
    const handleAddQuestion = () => {
        // Navigate to a dedicated 'add' page, passing current context
        router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/${year}/add`);
        // alert(`Add question for ${level} ${subject} ${year} (not implemented)`);
    };

    const handleEditQuestion = (id: string) => {
         // Navigate to a dedicated 'edit' page, passing current context and question ID
         router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/${year}/edit/${id}`);
        // alert(`Edit question ${id} (not implemented)`);
    };

    const handleDeleteQuestion = async (id: string, questionText: string) => {
         if (confirm(`Are you sure you want to delete this question?\n\n"${questionText}"`)) {
            setError(null);
            setIsLoadingData(true); // Indicate activity
            try {
                await axiosInstance.delete(`/admin/questions/${id}`);
                // Refresh the list after successful deletion
                setQuestions(prev => prev.filter(q => q._id !== id));
                // Optionally show a success message
            } catch (err: any) {
                 console.error("Failed to delete question:", err);
                 setError(err.response?.data?.message || "Could not delete question.");
            } finally {
                 setIsLoadingData(false); // Stop indicating activity
            }
        }
    };


    // --- Render Logic ---
    const renderQuestionList = () => {
         if (isLoadingData && questions.length === 0) { // Show loading only initially
            return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
        }
         if (error) {
            return <p className="text-center text-red-500 dark:text-red-400 mt-8">{error}</p>;
        }
         if (questions.length === 0 && !isLoadingData) { // Check loading state
             return (
                 <div className="text-center text-gray-500 dark:text-gray-400 mt-8 space-y-4">
                     <p>No questions found for {level} / {subject} / {year}.</p>
                     <button
                        onClick={handleAddQuestion}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <PlusCircle size={18} /> Add First Question
                    </button>
                 </div>
            );
        }

        // Display table of questions
        return (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-6">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-3/5">Question Text</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">Correct Answer</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/5">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {questions.map((q) => (
                            <tr key={q._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" title={q.question}>
                                    <span className="line-clamp-2">{q.question}</span> {/* Show limited lines */}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-medium">{q.correctAnswer}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                    <button
                                        onClick={() => handleEditQuestion(q._id)}
                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        title="Edit"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteQuestion(q._id, q.question)}
                                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                        title="Delete"
                                    >
                                       <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Layout>
             {/* Title & Add Button & Breadcrumbs */}
            <div className="mb-6">
                {/* Breadcrumbs/Back Links */}
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 space-x-1">
                     <button onClick={() => router.push('/admin/questions')} className="hover:underline">Levels</button>
                     <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}`)} className="hover:underline">{level}</button>
                     <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}`)} className="hover:underline">{subject}</button>
                 </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                     <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           <CalendarDays size={24}/> {year} Questions
                        </h1>
                         <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {level} / {subject}
                        </p>
                    </div>
                    <button
                        onClick={handleAddQuestion}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors self-start sm:self-center"
                    >
                        <PlusCircle size={18} /> Add New Question
                    </button>
                </div>
            </div>

             {/* Render the list or loading/error states */}
            {renderQuestionList()}

        </Layout>
    );
}