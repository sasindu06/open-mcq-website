// app/admin/users/edit/[userId]/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../../../../components/Layout'; // Adjust path
import { useAuth, User } from '../../../../../context/AuthContext'; // To check role & User type
import axiosInstance from '../../../../../lib/axios'; // Adjust path
import { useRouter, useParams } from 'next/navigation';
import { ShieldAlert, Edit, Save, Loader2, AlertCircle, CheckCircle, User as UserIcon, Mail, ShieldCheck } from 'lucide-react'; // Icons

// Interface specifically for the data fetched/edited here
interface EditUserData {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt?: string; // Optional field from backend
}

// --- Reusable Field Group Component (Standalone, DEFINED OUTSIDE EditUserPage) ---
interface FieldGroupProps {
    id: string; label: string; icon: React.ElementType; required?: boolean; type?: string;
    placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    minLength?: number;
}
const FieldGroup: React.FC<FieldGroupProps> = ({
    id, label, icon: Icon, required, type = "text", placeholder, value, onChange, minLength
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <input
                id={id} name={id} type={type} required={required} value={value}
                onChange={onChange} minLength={minLength} placeholder={placeholder}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 pl-10 pr-3 py-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
            />
        </div>
    </div>
);
// --------------------------------------------------------------------------------

// --- Main EditUserPage Component ---
export default function EditUserPage() {
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'user' | 'admin'>('user');
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [originalEmail, setOriginalEmail] = useState('');

     // Role Check
    useEffect(() => {
        if (!isAuthLoading && currentUser?.role !== 'admin') {
            router.push('/dashboard');
        }
    }, [currentUser, isAuthLoading, router]);

    // Fetch Existing User Data
    useEffect(() => {
        if (currentUser?.role === 'admin' && userId) {
            const fetchUser = async () => {
                setIsLoadingData(true); setError(null);
                try {
                    const response = await axiosInstance.get<EditUserData>(`/admin/users/${userId}`);
                    const userData = response.data;
                    setName(userData.name); setEmail(userData.email);
                    setOriginalEmail(userData.email); setRole(userData.role);
                } catch (err: any) { console.error("Fetch err:", err); setError(err.response?.data?.message || "Could not load data."); }
                finally { setIsLoadingData(false); }
            };
            fetchUser();
        } else if (!isAuthLoading) { setIsLoadingData(false); }
    }, [currentUser, isAuthLoading, userId]);

    // Loading / Access Denied / Invalid ID States
    if (isAuthLoading || !currentUser) return <Layout><div className="loading-placeholder"><Loader2/> Verifying access...</div></Layout>;
    if (currentUser.role !== 'admin') return <Layout><div className="access-denied"><ShieldAlert/> Access Denied</div></Layout>;
    if (!userId) return <Layout><div className="error-text">User ID missing from URL.</div></Layout>;

    // Handle form submission for UPDATE
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault(); setError(null); setSuccessMessage(null);
        if (!name.trim() || !email.trim() || !role) { setError('Name, Email, Role required.'); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setError('Invalid email address.'); return; }
        setIsSubmitting(true);
        const payload = { name: name.trim(), email: email.trim(), role: role };
        console.log(`Updating user ${userId} with:`, payload);
        try {
            await axiosInstance.put(`/admin/users/${userId}`, payload);
            setSuccessMessage('User updated successfully!');
            setOriginalEmail(payload.email); // Update original email state
            setTimeout(() => { router.push(`/admin/users`); }, 1500); // Redirect after delay
        } catch (err: any) {
            console.error("Update user err:", err);
            let errorMsg = "Update failed."; /* (error extraction logic remains same) */
            setError(errorMsg);
        } finally { setIsSubmitting(false); }
    };

    // --- Render Form ---
    const renderEditForm = () => {
         if (isLoadingData) return <div className="loading-placeholder"><Loader2 className="animate-spin"/> Loading user data...</div>;
         if (error && !originalEmail) return <p className="error-text mt-8">{error}</p>; // Show fetch error if form can't load

         const isCurrentUser = currentUser?.id === userId;

         return (
             <form onSubmit={handleSubmit} className="space-y-6">
                 {error && (<div className="alert-error"><AlertCircle size={18} /> {error}</div>)}
                 {successMessage && (<div className="alert-success"><CheckCircle size={18} /> {successMessage}</div>)}

                 {/* Use FieldGroup Component Here */}
                 <FieldGroup id="name" label="Full Name" icon={UserIcon} required value={name} onChange={(e) => setName(e.target.value)} />
                 <FieldGroup id="email" label="Email Address" icon={Mail} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

                 {/* Role Selection (Specific styling applied directly) */}
                 <div>
                     <label htmlFor="role" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                         Role <span className="text-red-500">*</span>
                     </label>
                     <div className="relative mt-1 rounded-md shadow-sm">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <ShieldCheck className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                         </div>
                         <select
                            id="role" value={role} disabled={isCurrentUser}
                            onChange={(e) => setRole(e.target.value as 'user' | 'admin')} required
                            // --- Applying consistent input styles directly ---
                            className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white pl-10 pr-3 py-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed appearance-none" // Added appearance-none
                         >
                             <option value="user">User</option>
                             <option value="admin">Admin</option>
                         </select>
                         {/* Optional: Add custom dropdown arrow here if needed */}
                         {isCurrentUser && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Cannot change your own role.</p>}
                     </div>
                 </div>

                 {/* Submit Button */}
                 <div className="flex justify-end pt-4">
                     <button type="submit" disabled={isSubmitting || isLoadingData} className="button-primary-blue disabled:opacity-60 disabled:cursor-wait">
                         {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                         {isSubmitting ? 'Saving...' : 'Save Changes'}
                     </button>
                 </div>
             </form>
         );
    }

    // --- Main Component Return ---
    return (
        <Layout>
             {/* Header & Breadcrumbs */}
            <div className="mb-6">
                 <button onClick={() => router.push('/admin/users')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2 flex items-center gap-1">
                     &larr; Back to Users
                 </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2"> <Edit /> Edit User </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{originalEmail || email || 'Loading...'}</p>
            </div>

            {/* Edit User Form Container */}
            <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
               {renderEditForm()}
            </div>

             {/* Styles */}
             <style jsx global>{`
                /* Global styles */
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; }
                .access-denied { text-align: center; padding: 2rem; } .access-denied svg { margin: auto; color: #EF4444; margin-bottom: 1rem; } .access-denied h1 { font-size: 1.25rem; font-weight: 600; color: #B91C1C; } .dark .access-denied h1 { color: #F87171; }
                .error-text { text-align: center; color: #DC2626; } .dark .error-text { color: #F87171; }
                .info-text { text-align: center; color: #6B7280; } .dark .info-text { color: #9CA3AF; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; } .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; } .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
                /* Button Style */
                .button-primary-blue { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background-color: #2563EB; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s; } .button-primary-blue:hover:not(:disabled) { background-color: #1D4ED8; }
             `}</style>

        </Layout>
    );
}