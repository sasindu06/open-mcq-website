// app/admin/questions/[level]/[subject]/[year]/edit/[questionId]/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { 
    ShieldAlert, Save, Loader2, AlertCircle, CheckCircle, 
    Image as ImageIcon, FileText as FileTextIcon, Type, Link as LinkIcon, Edit 
} from 'lucide-react'; // Added icons

// --- Define Option Type for State (No Change) ---
interface OptionState {
    text: string | null;
    imageUrl: string | null;
}
// -----------------------------------------

// --- Define type for fetched question data (No Change) ---
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
// --------------------------------------------------

export default function EditQuestionPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    // Get params from URL
    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;
    const year = params.year ? parseInt(decodeURIComponent(params.year as string), 10) : null;
    const questionId = params.questionId as string;

    // --- UPDATED: Form state (Initialize with 5) ---
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState<OptionState[]>([
        { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }
    ]);
    const [correctAnswerValue, setCorrectAnswerValue] = useState(''); // Store the text OR the imageUrl
    const [contextImageUrl, setContextImageUrl] = useState('');
    const [contextText, setContextText] = useState('');
    // -----------------------------------------------

    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

     // Role Check (No Change)
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
     }, [user, isAuthLoading, router]);

     // --- UPDATED: Fetch existing question data (for 5 options) ---
     useEffect(() => {
        if (questionId && user?.role === 'admin') {
            const fetchQuestion = async () => {
                setIsLoadingData(true); setError(null);
                try {
                    const response = await axiosInstance.get<QuestionPayload>(`/admin/questions/${questionId}`);
                    const data = response.data;
                    
                    setQuestionText(data.question);
                    
                    // --- THIS IS THE CHANGE ---
                    // Ensure 5 options exist, padding with empty if data has 4
                    const fetchedOptions = data.options || [];
                    setOptions([
                        { text: fetchedOptions[0]?.text || '', imageUrl: fetchedOptions[0]?.imageUrl || '' },
                        { text: fetchedOptions[1]?.text || '', imageUrl: fetchedOptions[1]?.imageUrl || '' },
                        { text: fetchedOptions[2]?.text || '', imageUrl: fetchedOptions[2]?.imageUrl || '' },
                        { text: fetchedOptions[3]?.text || '', imageUrl: fetchedOptions[3]?.imageUrl || '' },
                        { text: fetchedOptions[4]?.text || '', imageUrl: fetchedOptions[4]?.imageUrl || '' }, // Add 5th option
                    ]);
                    // --------------------------
                    
                    setCorrectAnswerValue(data.correctAnswer);
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
        } else if (!isAuthLoading) {
            setIsLoadingData(false);
        }
     }, [questionId, user, isAuthLoading]);
     // ----------------------------------------

    // Loading / Access Denied / Missing Params States (No Change)
    if (isAuthLoading || !user) { return <Layout><div className="loading-placeholder"><Loader2 className="animate-spin"/> Verifying access...</div></Layout>; }
    if (user.role !== 'admin') { return <Layout><div className="access-denied"><ShieldAlert/> Access Denied</div></Layout>; }
    if (!level || !subject || year === null || isNaN(year) || !questionId) { return <Layout>Invalid URL parameters.</Layout>; }
    if (isLoadingData) { return <Layout><div className="loading-placeholder"><Loader2 className="animate-spin"/> Loading question data...</div></Layout>; }

    // --- Option Handler (No Change, works for 5) ---
    const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
        const newOptions = [...options];
        const currentOption = { ...newOptions[index] };
        
        const oldIdentifier = (currentOption.text || currentOption.imageUrl || '').trim();
        currentOption[field] = value;
        
        if (field === 'text' && value.trim()) {
            currentOption.imageUrl = '';
        } else if (field === 'imageUrl' && value.trim()) {
            currentOption.text = '';
        }
        newOptions[index] = currentOption;

        if (correctAnswerValue && correctAnswerValue === oldIdentifier) {
            setCorrectAnswerValue('');
        }
        setOptions(newOptions);
    };

    // --- Correct Answer Handler (No Change, works for 5) ---
    const handleCorrectAnswerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCorrectAnswerValue(event.target.value);
    };
    // ------------------------------------

    // --- UPDATED: Submit Handler (Validates 4 or 5) ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); setSuccessMessage(null);

        if (!questionText.trim()) { setError('Question text required.'); return; }

        // Find valid options (has one, not both)
        const validOptions = options.map(opt => ({
            text: (opt.text && opt.text.trim()) || null,
            imageUrl: (opt.imageUrl && opt.imageUrl.trim()) || null
        })).filter(opt => (opt.text || opt.imageUrl) && !(opt.text && opt.imageUrl));

        // --- THIS IS THE CHANGE ---
        // We now check for 4 OR 5 valid options
        if (validOptions.length !== 4 && validOptions.length !== 5) { 
            setError('You must provide 4 or 5 options, each with EITHER text OR an image URL (not both).'); 
            return; 
        }
        // --------------------------

        if (!correctAnswerValue) { setError('Correct answer required.'); return; }
        
        const isValidCorrectAnswer = validOptions.some(opt => (opt.text === correctAnswerValue) || (opt.imageUrl === correctAnswerValue));
        if (!isValidCorrectAnswer) { 
            setError('Correct answer must match one of the options. Please re-select it.'); 
            setCorrectAnswerValue('');
            return; 
        }

        setIsSubmitting(true);

        const payload = {
            grade: level, subject: subject, year: year,
            question: questionText.trim(),
            options: validOptions, // Send only the valid options
            correctAnswer: correctAnswerValue, 
            contextImageUrl: contextImageUrl.trim() || null,
            contextText: contextText.trim() || null,
        };

        console.log("Updating question:", payload);

        try {
            await axiosInstance.put(`/admin/questions/${questionId}`, payload);
            setSuccessMessage('Question updated successfully!');
            
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
             {/* Title & Breadcrumbs (No Change) */}
             <div className="mb-6">
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

                    {/* Context Fields (No Change) */}
                    <fieldset className="border dark:border-gray-600 rounded-md p-4">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">Optional Context</legend>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="contextImageUrl" className="label-style flex items-center gap-1.5"><ImageIcon size={14}/> Context Image URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                    <input type="url" id="contextImageUrl" value={contextImageUrl} onChange={(e) => setContextImageUrl(e.target.value)} className="w-full input-style pl-8" placeholder="https://..." />
                                </div>
                                {contextImageUrl && ( <img src={contextImageUrl} alt="Context Preview" className="mt-2 max-h-40 rounded border dark:border-gray-600"/> )}
                            </div>
                            <div>
                                <label htmlFor="contextText" className="label-style flex items-center gap-1.5"><FileTextIcon size={14}/> Context Text / Passage</label>
                                 <textarea id="contextText" value={contextText} onChange={(e) => setContextText(e.target.value)} rows={3} className="w-full input-style" placeholder="Shared text for the question..."></textarea>
                            </div>
                        </div>
                    </fieldset>

                    {/* Question Text (No Change) */}
                    <div>
                        <label htmlFor="questionText" className="label-style"> Question Text <span className="text-red-500">*</span> </label>
                        <textarea id="questionText" value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={4} required className="w-full input-style" placeholder="Enter the question..."></textarea>
                    </div>

                    {/* --- UPDATED: Options Inputs (.map() now renders 5) --- */}
                    <div className="space-y-5">
                         <label className="label-style block mb-3"> 
                            Options (Provide EITHER text OR image URL for 4 or 5) 
                            <span className="text-red-500">*</span> 
                         </label>
                        {options.map((option, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + index)}:</span>
                                
                                <div className="flex-1 w-full">
                                    <label htmlFor={`optionText${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Text</label>
                                    <div className="relative">
                                        <Type className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input
                                            id={`optionText${index}`}
                                            type="text"
                                            value={option.text || ''} 
                                            // --- FIXED TYPO: Using e.target.value ---
                                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                            className="w-full input-style pl-8"
                                            placeholder={`Text for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!(option.imageUrl && option.imageUrl.trim())}
                                         />
                                    </div>
                                </div>
                                <span className='text-xs text-gray-500 dark:text-gray-400 self-center px-1'>OR</span>
                                <div className="flex-1 w-full">
                                     <label htmlFor={`optionImageUrl${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Image URL</label>
                                     <div className="relative">
                                         <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input
                                            id={`optionImageUrl${index}`}
                                            type="url"
                                            value={option.imageUrl || ''} 
                                            onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                                            className="w-full input-style pl-8"
                                            placeholder={`Image URL for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!(option.text && option.text.trim())}
                                        />
                                     </div>
                                      {option.imageUrl && <img src={option.imageUrl} alt={`Preview ${index}`} className="mt-2 max-h-20 rounded border dark:border-gray-500"/>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* ----------------------------- */}

                    {/* --- Correct Answer Selection (No Change, works for 5) --- */}
                    <div>
                        <label htmlFor="correctAnswer" className="label-style"> Correct Answer <span className="text-red-500">*</span> </label>
                        <select id="correctAnswer" value={correctAnswerValue} onChange={handleCorrectAnswerChange} required className="w-full select-style">
                            <option value="" disabled>-- Select Correct Answer --</option>
                            
                            {options.map((option, index) => {
                                const value = (option.text && option.text.trim()) || (option.imageUrl && option.imageUrl.trim());
                                const label = (option.text && option.text.trim()) 
                                    ? (option.text.substring(0, 70) + (option.text.length > 70 ? "..." : "")) 
                                    : `(Image) ${option.imageUrl ? option.imageUrl.substring(0, 50) + '...' : ''}`;
                                
                                if (!value) return null; // Don't show empty options in dropdown

                                return (
                                    <option key={index} value={value}>
                                        {String.fromCharCode(65 + index)}: {label}
                                    </option>
                                );
                            })}
                        </select>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can select both text and image-based answers.</p>
                    </div>
                    {/* ------------------------------------- */}

                    {/* Submit Button (No Change) */}
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
            
             {/* Styles (No Change) */}
             <style jsx>{`
                .label-style { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; } .dark .label-style { color: #D1D5DB; }
                .input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; background-color: #F9FAFB; transition: all 0.2s; } .dark .input-style { background-color: #374151; border-color: #4B5563; color: #F3F4F6; }
                .input-style:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
                .input-style.pl-8 { padding-left: 2.25rem; }
                .select-style { appearance: none; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; background-color: #F9FAFB; } .dark .select-style { background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-color: #374151; border-color: #4B5563; color: #F3F4F6; } .select-style:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
                .btn-primary { display: inline-flex; align-items: center; padding: 0.625rem 1.25rem; background-color: #2563EB; color: white; font-medium; border-radius: 0.5rem; transition: background-color 0.2s; } .btn-primary:hover:not(:disabled) { background-color: #1D4ED8; } .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-secondary { display: inline-flex; align-items: center; padding: 0.625rem 1.25rem; background-color: #E5E7EB; color: #1F2937; font-medium; border-radius: 0.5rem; transition: background-color 0.2s; } .dark .btn-secondary { background-color: #4B5563; color: #E5E7EB; } .btn-secondary:hover:not(:disabled) { background-color: #D1D5DB; } .dark .btn-secondary:hover:not(:disabled) { background-color: #525f73; } .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; } .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-itemss-center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; } .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; }
                .access-denied { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #EF4444; } .access-denied svg { height: 2.5rem; width: 2.5rem; }
             `}</style>
        </Layout>
    );
}