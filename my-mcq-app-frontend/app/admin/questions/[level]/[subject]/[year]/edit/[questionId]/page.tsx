// app/admin/questions/[level]/[subject]/[year]/edit/[questionId]/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, Save, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, Type, Link as LinkIcon, Edit } from 'lucide-react';

// --- Define Option Type for State ---
interface OptionState {
    text: string | null; // Allow null
    imageUrl: string | null; // Allow null
}
// -----------------------------------------

// Define type for fetched question data
interface QuestionPayload {
    grade: string;
    subject: string;
    year: number;
    question: string;
    options: OptionState[]; // Array of {text, imageUrl}
    correctAnswer: string; // This string can be text OR a URL
    contextImageUrl: string | null;
    contextText: string | null;
}

export default function EditQuestionPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    // Get params from URL
    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;
    const year = params.year ? parseInt(decodeURIComponent(params.year as string), 10) : null;
    const questionId = params.questionId as string;

    // Form state
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState<OptionState[]>([
        { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }
    ]);
    const [correctAnswerValue, setCorrectAnswerValue] = useState(''); // Store the text OR the imageUrl
    const [contextImageUrl, setContextImageUrl] = useState('');
    const [contextText, setContextText] = useState('');

    const [isLoadingData, setIsLoadingData] = useState(true); // For initial fetch
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

     // Role Check
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
     }, [user, isAuthLoading, router]);

     // --- Fetch existing question data ---
     useEffect(() => {
        if (questionId && user?.role === 'admin') {
            const fetchQuestion = async () => {
                setIsLoadingData(true); setError(null);
                try {
                    const response = await axiosInstance.get<QuestionPayload>(`/admin/questions/${questionId}`);
                    const data = response.data;
                    
                    // Populate state with fetched data
                    setQuestionText(data.question);
                    const fetchedOptions = data.options || [];
                    setOptions([
                        fetchedOptions[0] || { text: '', imageUrl: '' },
                        fetchedOptions[1] || { text: '', imageUrl: '' },
                        fetchedOptions[2] || { text: '', imageUrl: '' },
                        fetchedOptions[3] || { text: '', imageUrl: '' },
                    ]);
                    setCorrectAnswerValue(data.correctAnswer); // Set the text or URL
                    setContextImageUrl(data.contextImageUrl || '');
                    setContextText(data.contextText || '');

                } catch (err: any) {
                    console.error("Failed to fetch question:", err);
                    setError(err.response?.data?.message || "Could not load question data.");
                } finally {
                    setIsLoadingData(false);
                }
            };
            fetchQuestion();
        }
     }, [questionId, user, router]);
     // ----------------------------------------

    // Loading / Access Denied / Missing Params States
    if (isAuthLoading || !user) { return <Layout><div className="loading-placeholder"><Loader2/> Verifying access...</div></Layout>; }
    if (user.role !== 'admin') { return <Layout><div className="access-denied"><ShieldAlert/> Access Denied</div></Layout>; }
    if (!level || !subject || year === null || isNaN(year) || !questionId) { return <Layout>Invalid params</Layout>; }
    if (isLoadingData) { return <Layout><div className="loading-placeholder"><Loader2/> Loading question data...</div></Layout>; }

    // --- UPDATED Handlers ---
    const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
        const newOptions = [...options];
        const currentOption = { ...newOptions[index] };
        
        // Get the old value (text or URL) that might be the correct answer
        const oldIdentifier = currentOption.text || currentOption.imageUrl;

        currentOption[field] = value;
        // "Either/Or" logic
        if (field === 'text' && value.trim()) {
            currentOption.imageUrl = '';
        } else if (field === 'imageUrl' && value.trim()) {
            currentOption.text = '';
        }
        
        newOptions[index] = currentOption;

        // If the value we just changed WAS the correct answer, clear it.
        if (correctAnswerValue === oldIdentifier) {
            setCorrectAnswerValue('');
        }
        setOptions(newOptions);
    };

    const handleCorrectAnswerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // We store the TEXT or URL of the selected option
        setCorrectAnswerValue(event.target.value);
    };
    // -------------------------

    // --- UPDATED Submit Handler ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); setSuccessMessage(null);

        // --- Validation for new structure ---
        if (!questionText.trim()) { setError('Question text required.'); return; }

        const validOptions = options.map(opt => ({
            text: opt.text ? opt.text.trim() : null,
            imageUrl: opt.imageUrl ? opt.imageUrl.trim() : null
        })).filter(opt => (opt.text || opt.imageUrl) && !(opt.text && opt.imageUrl)); // Has one, not both

        if (validOptions.length !== 4) { setError('All 4 options require EITHER text OR an image URL (not both).'); return; }

        if (!correctAnswerValue) { setError('Correct answer required.'); return; }
        // Check if the saved answer value exists in our list of valid options
        const isValidCorrectAnswer = validOptions.some(opt => (opt.text === correctAnswerValue) || (opt.imageUrl === correctAnswerValue));
        if (!isValidCorrectAnswer) { setError('Correct answer must match one of the options.'); return; }
        // -----------------------------------

        setIsSubmitting(true);

        // Prepare payload with the correct structure
        const payload = {
            grade: level, subject: subject, year: year,
            question: questionText.trim(),
            options: validOptions, // Already formatted with nulls
            correctAnswer: correctAnswerValue, // Send the text OR URL
            contextImageUrl: contextImageUrl.trim() || null,
            contextText: contextText.trim() || null,
        };

        console.log("Updating question:", payload);

        try {
            // --- Use PUT and include questionId ---
            await axiosInstance.put(`/admin/questions/${questionId}`, payload);
            setSuccessMessage('Question updated successfully!');
            
            // Redirect back after delay
            setTimeout(() => {
                router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}/${year}`);
            }, 1500);

        } catch (err: any) {
            console.error("Failed to update question:", err);
            setError(err.response?.data?.message || "Error updating question.");
             if (err.response?.data?.errors) { setError(`Validation failed: ${err.response.data.errors.join(', ')}`); }
        } finally { setIsSubmitting(false); }
    };
    // ------------------------------

    return (
        <Layout>
             {/* Title & Breadcrumbs */}
             <div className="mb-6">
                 {/* Breadcrumbs (Same as add page) */}
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 space-x-1">
                     <button onClick={() => router.push('/admin/questions')} className="hover:underline">Levels</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}`)} className="hover:underline">{level}</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}`)} className="hover:underline">{subject}</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}/${year}`)} className="hover:underline">{year}</button>
                 </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"> <Edit /> Edit Question </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1"> For: {level} / {subject} / {year} </p>
            </div>

            {/* Edit Question Form */}
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (<div className="alert-error"><AlertCircle size={18} /> {error}</div>)}
                    {successMessage && (<div className="alert-success"><CheckCircle size={18} /> {successMessage}</div>)}

                    {/* Context Fields */}
                    <fieldset className="border dark:border-gray-600 rounded-md p-4">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">Optional Context</legend>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="contextImageUrl" className="label-style">Context Image URL</label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input type="url" id="contextImageUrl" value={contextImageUrl} onChange={(e) => setContextImageUrl(e.target.value)} className="w-full input-style pl-8" placeholder="https://..." />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="contextText" className="label-style">Context Text / Passage</label>
                                 <textarea id="contextText" value={contextText} onChange={(e) => setContextText(e.target.value)} rows={3} className="w-full input-style" placeholder="Shared text for the question..."></textarea>
                            </div>
                        </div>
                    </fieldset>

                    {/* Question Text */}
                    <div>
                        <label htmlFor="questionText" className="label-style"> Question Text <span className="text-red-500">*</span> </label>
                        <textarea id="questionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} required className="w-full input-style" placeholder="Enter the question..."></textarea>
                    </div>

                    {/* --- Options Inputs (Same as previous fix) --- */}
                    <div className="space-y-5">
                         <label className="label-style block mb-3"> Options (Provide EITHER text OR image URL for each) <span className="text-red-500">*</span> </label>
                        {options.map((option, index) => (
                            <div key={index} className="p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className="block font-semibold text-gray-500 dark:text-gray-400 mb-2">{String.fromCharCode(65 + index)}:</span>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    {/* Text Input Block */}
                                    <div className="flex-1 w-full">
                                        <label htmlFor={`optionText${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Text</label>
                                        <div className="relative">
                                            <Type className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                            <input
                                                id={`optionText${index}`}
                                                type="text"
                                                value={option.text || ''} // Handle null
                                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                                className="w-full input-style pl-8"
                                                placeholder={`Text for Option ${String.fromCharCode(65 + index)}`}
                                                disabled={!!(option.imageUrl && option.imageUrl.trim())}
                                             />
                                        </div>
                                    </div>
                                    <span className='text-xs text-gray-500 dark:text-gray-400 self-center px-1'>OR</span>
                                    {/* Image URL Input Block */}
                                    <div className="flex-1 w-full">
                                         <label htmlFor={`optionImageUrl${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Image URL</label>
                                         <div className="relative">
                                             <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                            <input
                                                id={`optionImageUrl${index}`}
                                                type="url"
                                                value={option.imageUrl || ''} // Handle null
                                                onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                                                className="w-full input-style pl-8"
                                                placeholder={`Image URL for Option ${String.fromCharCode(65 + index)}`}
                                                disabled={!!(option.text && option.text.trim())}
                                            />
                                         </div>
                                          {/* Basic Image Preview */}
                                          {option.imageUrl && <img src={option.imageUrl} alt={`Preview ${index}`} className="mt-2 max-h-20 rounded border dark:border-gray-500"/>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* ----------------------------- */}

                    {/* --- UPDATED Correct Answer Selection (THIS IS THE FIX) --- */}
                    <div>
                        <label htmlFor="correctAnswer" className="label-style"> Correct Answer <span className="text-red-500">*</span> </label>
                        <select id="correctAnswer" value={correctAnswerValue} onChange={handleCorrectAnswerChange} required className="w-full select-style">
                            <option value="" disabled>-- Select Correct Answer --</option>
                            
                            {/* Map over ALL options */}
                            {options.map((option, index) => {
                                // The value is the non-null text OR the non-null image URL
                                const value = (option.text && option.text.trim()) || (option.imageUrl && option.imageUrl.trim());
                                // The label is the text, or a placeholder for the image
                                const label = (option.text && option.text.trim()) ? (option.text.substring(0, 50) + (option.text.length > 50 ? "..." : "")) : "(Image Option)";
                                
                                // Only render if it's a valid option (has text OR image)
                                if (!value) return null; 

                                return (
                                    <option key={index} value={value}>
                                        {String.fromCharCode(65 + index)}: {label}
                                    </option>
                                );
                            })}
                        </select>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: The selected value (text or URL) will be saved.</p>
                    </div>
                    {/* ------------------------------------- */}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={() => router.back()} disabled={isSubmitting}
                            className="btn-secondary mr-3">
                            Cancel
                        </button>
                         <button type="submit" disabled={isSubmitting || !questionText}
                            className="btn-primary flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                </form>
            </div>
            
             {/* Styles (same as before) */}
             <style jsx>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-medium; color: #374151; } .dark .label-style { color: #D1D5DB; }
                .input-style { display: block; width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; background-color: #F9FAFB; } .dark .input-style { background-color: #374151; border-color: #4B5563; color: #F3F4F6; }
                .input-style:focus { outline: none; border-color: #3B82F6; ring: 1px solid #3B82F6; }
                .select-style { /* Apply input-style and add arrow */ appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; display: block; width: 100%; padding: 0.75rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; background-color: #F9FAFB; } .dark .select-style { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-color: #374151; border-color: #4B5563; color: #F3F4F6; } .select-style:focus { outline: none; border-color: #3B82F6; ring: 1px solid #3B82F6; }
                .btn-primary { padding: 0.625rem 1.25rem; background-color: #2563EB; color: white; font-medium; border-radius: 0.5rem; shadow: sm; transition: background-color 0.2s; } .btn-primary:hover { background-color: #1D4ED8; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-secondary { padding: 0.625rem 1.25rem; background-color: #E5E7EB; color: #1F2937; font-medium; border-radius: 0.5rem; shadow: sm; transition: background-color 0.2s; } .dark .btn-secondary { background-color: #4B5563; color: #E5E7EB; } .btn-secondary:hover { background-color: #D1D5DB; } .dark .btn-secondary:hover { background-color: #525f73; } .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; } .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; } .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; } .loading-placeholder svg { animation: spin 1s linear infinite; }
                .access-denied { text-align: center; padding: 2rem; } .access-denied svg { margin: auto; color: #EF4444; margin-bottom: 1rem; }
             `}</style>
        </Layout>
    );
}