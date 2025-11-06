// app/admin/questions/[level]/[subject]/add-paper/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, PlusCircle, Save, Loader2, AlertCircle, CheckCircle, ChevronRight, BookCopy, BookOpen, CalendarPlus } from 'lucide-react'; // Added CalendarPlus

export default function AddNewPaperPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    // Extract level and subject from URL
    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;

    // Form state
    const [newYear, setNewYear] = useState<string>(''); // Year input as string initially
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

     // --- Role Check ---
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [user, isAuthLoading, router]);


    // --- Loading / Access Denied / Missing Params ---
     if (isAuthLoading || !user) {
        return <Layout><div className="flex justify-center items-center h-64"><p>Verifying access...</p></div></Layout>;
    }
     if (user.role !== 'admin') {
         return <Layout><div className="text-center p-8"><ShieldAlert size={48} className="mx-auto text-red-500 mb-4" /><h1 className="text-xl font-semibold">Access Denied</h1></div></Layout>;
     }
      if (!level || !subject ) {
          return <Layout><div className="text-center p-8"><p>Level or Subject parameter missing.</p></div></Layout>;
     }

    // --- Handlers ---
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
        if (correctAnswer === options[index] && value !== correctAnswer) {
            setCorrectAnswer('');
        }
    };

    const handleCorrectAnswerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCorrectAnswer(event.target.value);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        // --- Validation ---
        const yearNum = parseInt(newYear, 10);
        if (!newYear || isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) { // Basic year validation
            setError('Please enter a valid year (e.g., 2024).');
            return;
        }
        if (!questionText.trim()) { setError('Question text cannot be empty.'); return; }
        if (options.some(opt => !opt.trim())) { setError('All four options must be filled.'); return; }
        const uniqueOptions = new Set(options.map(opt => opt.trim()));
        if (uniqueOptions.size !== 4) { setError('Options must be unique.'); return; }
        if (!correctAnswer) { setError('Please select the correct answer.'); return; }
        if (!options.map(opt => opt.trim()).includes(correctAnswer.trim())) { setError('Correct answer must match one option.'); return; }
        // -----------------

        setIsSubmitting(true);

        const formattedOptions = options.map(opt => ({
            text: opt.trim(), // Each option is text
            imageUrl: null    // Image URL is null
        }));

        const payload = {
            grade: level,
            subject: subject,
            year: yearNum,
            question: questionText.trim(),
            options: formattedOptions, // Send the new array of objects
            correctAnswer: correctAnswer.trim(),
            contextImageUrl: null, // Also send null for the new context fields
            contextText: null
        };

        console.log("Submitting new paper (first question):", payload);

        try {
            // Use the same POST endpoint as adding a regular question
            await axiosInstance.post('/admin/questions', payload);
            setSuccessMessage(`Paper for ${yearNum} added successfully with the first question!`);

            // Redirect back to the year selection page after a delay
            setTimeout(() => {
                router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}`);
            }, 2000); // Wait 2 seconds

        } catch (err: any) {
            console.error("Failed to add new paper/question:", err);
            setError(err.response?.data?.message || "An error occurred while adding the paper.");
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Layout>
             {/* Title & Breadcrumbs */}
            <div className="mb-6">
                 {/* Breadcrumbs/Back Links */}
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 space-x-1">
                     <button onClick={() => router.push('/admin/questions')} className="hover:underline">Levels</button>
                     <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}`)} className="hover:underline">{level}</button>
                     <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}`)} className="hover:underline">{subject}</button>
                 </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CalendarPlus /> Add New Paper/Year
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    For: {level} / {subject}
                </p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Enter the new year and the details for the first question of this paper.
                </p>
            </div>

            {/* Add Paper Form */}
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center gap-2 text-sm">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-2 text-sm">
                            <CheckCircle size={18} /> {successMessage}
                        </div>
                    )}

                     {/* New Year Input */}
                    <div>
                        <label htmlFor="newYear" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            New Paper Year <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="newYear"
                            type="number" // Use number type for better input control
                            step="1"
                            min="1900"
                            max="2100"
                            value={newYear}
                            onChange={(e) => setNewYear(e.target.value)}
                            required
                            className="w-full sm:w-1/2 lg:w-1/3 input-style" // Use shared style
                            placeholder="e.g., 2025"
                        />
                    </div>

                    <hr className="dark:border-gray-600"/>

                     <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 pt-2">First Question Details</h3>


                    {/* Question Text */}
                    <div>
                        <label htmlFor="questionText" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Question Text <span className="text-red-500">*</span>
                        </label>
                        <textarea id="questionText" rows={3} value={questionText} onChange={(e) => setQuestionText(e.target.value)} required className="w-full input-style" placeholder="Enter the first question..." />
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Options (4 unique options) <span className="text-red-500">*</span>
                         </label>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + index)}:</span>
                                <input type="text" value={option} onChange={(e) => handleOptionChange(index, e.target.value)} required className="flex-grow input-style" placeholder={`Option ${String.fromCharCode(65 + index)}`} />
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer Selection */}
                    <div>
                        <label htmlFor="correctAnswer" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                            Correct Answer <span className="text-red-500">*</span>
                        </label>
                        <select id="correctAnswer" value={correctAnswer} onChange={handleCorrectAnswerChange} required className="w-full select-style">
                            <option value="" disabled>-- Select Correct Answer --</option>
                            {options.filter(opt => opt.trim()).map((option, index) => (
                                <option key={index} value={option.trim()}>{String.fromCharCode(65 + index)}: {option.trim()}</option>
                            ))}
                        </select>
                         {!correctAnswer && options.every(opt => opt.trim()) && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Please select the correct option.</p>
                         )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait transition-colors">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSubmitting ? 'Saving...' : 'Save New Paper'}
                        </button>
                    </div>

                </form>
            </div>
             {/* Include styles if not global */}
             <style jsx>{`
                .input-style, .select-style { /* Basic example styles */
                    display: block; width: 100%;
                    padding: 0.5rem 0.75rem; border-radius: 0.5rem; transition: all 0.2s;
                    background-color: #F9FAFB; color: #111827; border: 1px solid #D1D5DB;
                }
                .dark .input-style, .dark .select-style { background-color: #374151; color: #F9FAFB; border-color: #4B5563; }
                .input-style:focus, .select-style:focus { border-color: #3B82F6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
                .select-style { appearance: none; }
            `}</style>
        </Layout>
    );
}