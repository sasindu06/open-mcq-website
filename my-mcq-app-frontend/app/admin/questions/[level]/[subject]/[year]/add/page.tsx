// app/admin/questions/[level]/[subject]/[year]/add/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../../../components/Layout'; // Adjust path
import { useAuth } from '../../../../../../../context/AuthContext'; // Adjust path
import axiosInstance from '../../../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { 
    ShieldAlert, PlusCircle, Save, Loader2, AlertCircle, CheckCircle, 
    Image as ImageIcon, FileText as FileTextIcon, Type, Link as LinkIcon 
} from 'lucide-react';

// Option Type (Same as V2)
interface OptionState {
    text: string;
    imageUrl: string;
}

export default function AddQuestionPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();

    const level = params.level ? decodeURIComponent(params.level as string) : null;
    const subject = params.subject ? decodeURIComponent(params.subject as string) : null;
    const year = params.year ? parseInt(decodeURIComponent(params.year as string), 10) : null;

    // --- UPDATED: Form state (Added 5th option) ---
    const [questionText, setQuestionText] = useState('');
    const [options, setOptions] = useState<OptionState[]>([
        { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }
    ]);
    // -------------------------------------------------
    const [correctAnswerValue, setCorrectAnswerValue] = useState(''); 
    const [contextImageUrl, setContextImageUrl] = useState('');
    const [contextText, setContextText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

     // Role Check (Same)
    useEffect(() => {
        if (!isAuthLoading && user?.role !== 'admin') {
            router.push('/dashboard');
        }
     }, [user, isAuthLoading, router]);

    // Loading / Access Denied / Missing Params States (Same)
     if (isAuthLoading || !user) { return <Layout>Loading...</Layout>; }
     if (user.role !== 'admin') { return <Layout>Access Denied</Layout>; }
     if (!level || !subject || year === null || isNaN(year)) { return <Layout>Invalid params</Layout>; }

    // --- UPDATED: Option Handler (No change, works as-is) ---
    const handleOptionChange = (index: number, field: 'text' | 'imageUrl', value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };

        if (field === 'text' && value.trim()) {
            newOptions[index].imageUrl = '';
        } else if (field === 'imageUrl' && value.trim()) {
            newOptions[index].text = '';
        }

        if (correctAnswerValue === (field === 'text' ? options[index].text : options[index].imageUrl)) {
            setCorrectAnswerValue('');
        }

        setOptions(newOptions);
    };

    // --- UPDATED: Correct Answer Handler (No change, works as-is) ---
    const handleCorrectAnswerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setCorrectAnswerValue(event.target.value);
    };
    // ----------------------------------------

    // --- UPDATED: Submit Handler ---
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null); setSuccessMessage(null);

        // --- Validation (UPDATED) ---
        if (!questionText.trim()) { setError('Question text required.'); return; }

        // Filter for options that are validly filled (EITHER text OR image)
        const validOptions = options.filter(opt => 
            (opt.text.trim() || opt.imageUrl.trim()) && 
            !(opt.text.trim() && opt.imageUrl.trim())
        );
        
        // --- THIS IS THE CHANGE ---
        // We now check for 4 OR 5 valid options
        if (validOptions.length !== 4 && validOptions.length !== 5) { 
            setError('You must provide 4 or 5 options, each with EITHER text OR an image URL (not both).'); 
            return; 
        }
        // --------------------------

        const textOptions = validOptions.filter(opt => opt.text).map(opt => opt.text.trim());
        const uniqueTexts = new Set(textOptions);
        if (uniqueTexts.size !== textOptions.length) { 
            setError('Option texts must be unique.'); 
            return; 
        }
        // --- End Validation ---


        // --- CHANGED: Validate the new correct answer value ---
        if (!correctAnswerValue) { 
            setError('Correct answer selection is required.'); 
            return; 
        }
        const isAnswerValid = validOptions.some(opt => 
            opt.text.trim() === correctAnswerValue || 
            opt.imageUrl.trim() === correctAnswerValue
        );
        if (!isAnswerValid) { 
            setError('Correct answer must match one of the options.'); 
            return; 
        }
        // ------------------------------------------------------

        setIsSubmitting(true);

        const payload = {
            grade: level, subject: subject, year: year,
            question: questionText.trim(),
            // --- UPDATED: Send only the validly filled options ---
            options: validOptions.map(opt => ({
                text: opt.text.trim() || null, 
                imageUrl: opt.imageUrl.trim() || null 
            })),
            // -----------------------------------------------------
            correctAnswer: correctAnswerValue.trim(),
            contextImageUrl: contextImageUrl.trim() || null,
            contextText: contextText.trim() || null,
        };

        console.log("Submitting new question:", payload);

        try {
            await axiosInstance.post('/admin/questions', payload);
            setSuccessMessage('Question added successfully!');
            
            // --- UPDATED: Clear form (reset to 5) ---
            setQuestionText(''); 
            setOptions([{ text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }, { text: '', imageUrl: '' }]);
            // ------------------------------------------
            setCorrectAnswerValue(''); 
            setContextImageUrl(''); 
            setContextText('');
            
            setTimeout(() => {
                router.push(`/admin/questions/${encodeURIComponent(level!)}/${encodeURIComponent(subject!)}/${year}`);
            }, 1500);

        } catch (err: any) {
            console.error("Failed to add question:", err);
            setError(err.response?.data?.message || "Error adding question.");
             if (err.response?.data?.errors) { 
                 setError(`Validation failed: ${err.response.data.errors.join(', ')}`); 
             }
        } finally { 
            setIsSubmitting(false); 
        }
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"> <PlusCircle /> Add New Question </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1"> For: {level} / {subject} / {year} </p>
            </div>

            {/* Add Question Form */}
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (<div className="alert-error"><AlertCircle size={18} /> {error}</div>)}
                    {successMessage && (<div className="alert-success"><CheckCircle size={18} /> {successMessage}</div>)}

                    {/* Context Fields (No Change) */}
                    <fieldset className="border dark:border-gray-600 rounded-md p-4">
                        <legend className="text-sm font-medium text-gray-600 dark:text-gray-400 px-2">Optional Context (Shared Image/Text)</legend>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="contextImageUrl" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                   <ImageIcon size={14}/> Context Image URL (Optional)
                                </label>
                                <input id="contextImageUrl" type="url" value={contextImageUrl} onChange={(e) => setContextImageUrl(e.target.value)} className="w-full input-style" placeholder="https://example.com/diagram.png" />
                                {contextImageUrl && ( <img src={contextImageUrl} alt="Context Preview" className="mt-2 max-h-40 rounded border dark:border-gray-600" onError={(e) => e.currentTarget.style.display='none'} onLoad={(e) => e.currentTarget.style.display='block'}/> )}
                             </div>
                             <div>
                                <label htmlFor="contextText" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                   <FileTextIcon size={14}/> Context Text (Optional Passage)
                                </label>
                                <textarea id="contextText" rows={3} value={contextText} onChange={(e) => setContextText(e.target.value)} className="w-full input-style" placeholder="Enter shared text passage here..." />
                            </div>
                        </div>
                    </fieldset>

                    {/* Question Text (No Change) */}
                    <div>
                        <label htmlFor="questionText" className="label-style"> Question Text <span className="text-red-500">*</span> </label>
                        <textarea id="questionText" rows={4} value={questionText} onChange={(e) => setQuestionText(e.target.value)} required className="w-full input-style" placeholder="Enter the question here..."/>
                    </div>

                    {/* Options Inputs (No Change - .map() now renders 5) */}
                    <div className="space-y-5">
                         <label className="label-style"> 
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
                                            id={`optionText${index}`} type="text" value={option.text}
                                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                            className="w-full input-style pl-8" 
                                            placeholder={`Text for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!option.imageUrl.trim()}
                                         />
                                    </div>
                                </div>
                                
                                <span className='text-xs text-gray-500 dark:text-gray-400 self-center'>OR</span>
                                
                                <div className="flex-1 w-full">
                                     <label htmlFor={`optionImageUrl${index}`} className="sr-only">Option {String.fromCharCode(65 + index)} Image URL</label>
                                     <div className="relative">
                                         <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                                        <input
                                            id={`optionImageUrl${index}`} type="url" value={option.imageUrl}
                                            onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                                            className="w-full input-style pl-8"
                                            placeholder={`Image URL for Option ${String.fromCharCode(65 + index)}`}
                                            disabled={!!option.text.trim()}
                                        />
                                     </div>
                                      {option.imageUrl && <img src={option.imageUrl} alt={`Preview ${index}`} className="mt-2 max-h-20 rounded border dark:border-gray-500"/>}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- UPDATED Correct Answer Selection (No change, works as-is) --- */}
                    <div>
                        <label htmlFor="correctAnswer" className="label-style"> Correct Answer <span className="text-red-500">*</span> </label>
                        <select id="correctAnswer" value={correctAnswerValue} onChange={handleCorrectAnswerChange} required className="w-full select-style">
                            <option value="" disabled>-- Select Correct Answer --</option>
                            
                            {options
                                .filter(opt => opt.text.trim() || opt.imageUrl.trim())
                                .map((option, index) => {
                                    const originalIndex = options.findIndex(o => o === option);
                                    const isImage = !!option.imageUrl.trim();
                                    const optionValue = isImage ? option.imageUrl.trim() : option.text.trim();
                                    
                                    return (
                                        <option key={originalIndex} value={optionValue}>
                                            {String.fromCharCode(65 + originalIndex)}: {isImage ? '(Image) ' + optionValue : optionValue}
                                        </option>
                                    );
                                })}
                        </select>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">You can now select text or image-based answers.</p>
                    </div>
                    {/* ------------------------------------- */}

                    {/* Submit Button (No change) */}
                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={isSubmitting} className="button-primary disabled:opacity-50 disabled:cursor-wait">
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSubmitting ? 'Saving...' : 'Save Question'}
                        </button>
                    </div>

                </form>
            </div>
             
             {/* Styles (same as before) */}
             <style jsx>{`
                .label-style { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
                .dark .label-style { color: #D1D5DB; }
                .input-style, .select-style { display: block; width: 100%; padding: 0.5rem 0.75rem; border-radius: 0.5rem; transition: all 0.2s; background-color: #F9FAFB; color: #111827; border: 1px solid #D1D5DB; }
                .dark .input-style, .dark .select-style { background-color: #374151; color: #F9FAFB; border-color: #4B5563; }
                .input-style:focus, .select-style:focus { border-color: #3B82F6; outline: none; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
                .input-style.pl-8 { padding-left: 2.25rem; } 
                .select-style { appearance: none; }
                .button-primary { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background-color: #16A34A; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; }
                .button-primary:hover:not(:disabled) { background-color: #15803D; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; }
                .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; }
                .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
            `}</style>
        </Layout>
    );
}