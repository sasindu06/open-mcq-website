// app/admin/questions/[level]/[subject]/[year]/add/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, PlusCircle, Save, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, FileText as FileTextIcon, Type, Link as LinkIcon } from 'lucide-react'; // Added icons

// --- NEW: Define Option Type for State ---
interface OptionState {
    text: string;
    imageUrl: string;
}
// -----------------------------------------

export default function AddQuestionPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;
    const year = params.year ? parseInt(decodeURIComponent(params.year as string), 10) : null;

    // Form state
    const [questionText, setQuestionText] = useState('');
    // --- UPDATED: Options state uses the new interface ---
    const [options, setOptions] = useState<OptionState[]>([
        { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }
    ]);
    // ----------------------------------------------------
    const [correctAnswerText, setCorrectAnswerText] = useState(''); // Store the TEXT of the correct answer
    const [contextImageUrl, setContextImageUrl] = useState('');
    const [contextText, setContextText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

     // Role Check
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
     }, [user, isAuthLoading, router]);

    // Loading / Access Denied / Missing Params States
     if (isAuthLoading || !user) { /* ... */ return <Layout>Loading...</Layout> }
     if (user.role !== 'admin') { /* ... */ return <Layout>Access Denied</Layout> }
     if (!level || !subject || year === null || isNaN(year)) { /* ... */ return <Layout>Invalid params</Layout> }

    // --- UPDATED Handlers ---
    const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };

        // Simple logic: If user types text, clear image URL, and vice-versa
        if (field === 'text' && value.trim()) {
            newOptions[index].imageUrl = '';
        } else if (field === 'imageUrl' && value.trim()) {
            newOptions[index].text = '';
        }

        // If the TEXT of the currently selected correct answer was changed, clear correctAnswerText
        if (correctAnswerText === options[index].text && field === 'text' && value !== correctAnswerText) {
            setCorrectAnswerText('');
        }

        setOptions(newOptions);
    };

    const handleCorrectAnswerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        // We store the TEXT of the selected option
        setCorrectAnswerText(event.target.value);
    };
    // -------------------------

    // --- UPDATED Submit Handler ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); setSuccessMessage(null);

        // --- Validation for new structure ---
        if (!questionText.trim()) { setError('Question text required.'); return; }

        const validOptions = options.filter(opt => (opt.text.trim() || opt.imageUrl.trim()) && !(opt.text.trim() && opt.imageUrl.trim()));
        if (validOptions.length !== 4) { setError('All 4 options require EITHER text OR an image URL (not both).'); return; }

        const uniqueTexts = new Set(validOptions.filter(opt => opt.text).map(opt => opt.text.trim()));
        if (uniqueTexts.size !== validOptions.filter(opt => opt.text).length) { setError('Option texts must be unique.'); return; }
        // Note: Could add validation for unique image URLs too if needed

        if (!correctAnswerText) { setError('Correct answer required.'); return; }
        if (!validOptions.some(opt => opt.text.trim() === correctAnswerText.trim())) { setError('Correct answer text must match the text of one option.'); return; }
        // -----------------------------------

        setIsSubmitting(true);

        // Prepare payload with the correct structure
        const payload = {
            grade: level, subject: subject, year: year,
            question: questionText.trim(),
            options: validOptions.map(opt => ({
                text: opt.text.trim() || null, // Send null if empty
                imageUrl: opt.imageUrl.trim() || null // Send null if empty
            })),
            correctAnswer: correctAnswerText.trim(), // Send the text
            contextImageUrl: contextImageUrl.trim() || null,
            contextText: contextText.trim() || null,
        };

        console.log("Submitting new question:", payload);

        try {
            await axiosInstance.post('/admin/questions', payload);
            setSuccessMessage('Question added successfully!');
            // Clear form (Optional)
            setQuestionText(''); setOptions([{ text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }]);
            setCorrectAnswerText(''); setContextImageUrl(''); setContextText('');
            // Redirect back after delay
            setTimeout(() => {
                router.push(`/admin/questions/${encodeURIComponent(level)}/${encodeURIComponent(subject)}/${year}`);
            }, 1500);

        } catch (err: any) {
            console.error("Failed to add question:", err);
            setError(err.response?.data?.message || "Error adding question.");
             if (err.response?.data?.errors) { setError(`Validation failed: ${err.response.data.errors.join(', ')}`); }
        } finally { setIsSubmitting(false); }
    };
    // ------------------------------


    return (
        <Layout>
             {/* Title & Breadcrumbs */}
             <div className="mb-6">
                 {/* Breadcrumbs */}
                 <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 space-x-1">
                     <button onClick={() => router.push('/admin/questions')} className="hover:underline">Levels</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}`)} className="hover:underline">{level}</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}`)} className="hover:underline">{subject}</button> <span>/</span>
                     <button onClick={() => router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}/${year}`)} className="hover:underline">{year}</button>
                 </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"> <PlusCircle /> Add New Question </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1"> For: {level} / {subject} / {year} </p>
            </div>

            {/* Add Question Form */}
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (<div className="alert-error"><AlertCircle size={18} /> {error}</div>)}
                    {successMessage && (<div className="alert-success"><CheckCircle size={18} /> {successMessage}</div>)}

                    {/* Context Fields (No change) */}
                    <fieldset className="border dark:border-gray-600 rounded-md p-4"> /* ... */ </fieldset>

                    {/* Question Text (No change) */}
                    <div> /* ... */ </div>

                    {/* --- UPDATED Options Inputs --- */}
                    <div className="space-y-5">
                         <label className="label-style"> Options (Provide EITHER text OR image URL for each) <span className="text-red-500">*</span> </label>
                        {options.map((option, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                <span className="font-semibold text-gray-500 dark:text-gray-400">{String.fromCharCode(65 + index)}:</span>
                                {/* Text Input */}
                                <div className="flex-1 w-full">
                                    <label htmlFor={`optionText${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Text</label>
                                    <div className="relative">
                                        <Type className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input
                                            id={`optionText${index}`}
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                            className="w-full input-style pl-8" // Add padding for icon
                                            placeholder={`Text for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!option.imageUrl.trim()} // Disable if imageUrl has content
                                         />
                                    </div>
                                </div>
                                <span className='text-xs text-gray-500 dark:text-gray-400 self-center'>OR</span>
                                {/* Image URL Input */}
                                <div className="flex-1 w-full">
                                     <label htmlFor={`optionImageUrl${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Image URL</label>
                                     <div className="relative">
                                         <LinkIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input
                                            id={`optionImageUrl${index}`}
                                            type="url"
                                            value={option.imageUrl}
                                            onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                                            className="w-full input-style pl-8" // Add padding for icon
                                            placeholder={`Image URL for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!option.text.trim()} // Disable if text has content
                                        />
                                     </div>
                                      {/* Basic Image Preview */}
                                      {option.imageUrl && <img src={option.imageUrl} alt={`Preview ${index}`} className="mt-2 max-h-20 rounded border dark:border-gray-500"/>}
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* ----------------------------- */}

                    {/* --- UPDATED Correct Answer Selection --- */}
                    <div>
                        <label htmlFor="correctAnswer" className="label-style"> Correct Answer (Select by Text) <span className="text-red-500">*</span> </label>
                        <select id="correctAnswer" value={correctAnswerText} onChange={handleCorrectAnswerChange} required className="w-full select-style">
                            <option value="" disabled>-- Select Correct Answer --</option>
                            {/* Filter only options that have text */}
                            {options.filter(opt => opt.text.trim()).map((option, index) => (
                                <option key={index} value={option.text.trim()}>
                                    {/* Find original index for A/B/C/D */}
                                    {String.fromCharCode(65 + options.findIndex(o => o === option))}: {option.text.trim()}
                                </option>
                            ))}
                        </select>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Note: Image options cannot be selected as correct answer currently.</p>
                    </div>
                    {/* ------------------------------------- */}

                    {/* Submit Button (No change) */}
                    <div className="flex justify-end pt-4"> /* ... */ </div>

                </form>
            </div>
             {/* Styles (same as before) */}
             <style jsx>{` /* ... */ `}</style>
        </Layout>
    );
}