// app/profile/page.tsx

"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import Layout from '../../components/Layout'; // Adjust path if needed
import { useAuth, User } from '../../context/AuthContext'; // Import User type
import axiosInstance from '../../lib/axios'; // Your axios instance
import { User as UserIcon, Mail, Save, AlertCircle, CheckCircle, Building, MapPin, Calendar, Loader2 } from 'lucide-react';

// --- UPDATED INTERFACE ---
// Interface for user data (matches AuthContext and backend model)
interface UserProfile {
    _id?: string;
    id?: string;
    firstName: string; // Changed
    lastName: string;  // Changed
    email: string;
    role?: string;
    award?: string;
    birthday?: string | null;
    school?: string | null;
    district?: string | null;
}
// -------------------------

// Helper to format date for input
const formatDateForInput = (isoDateString: string | null | undefined): string => {
    if (!isoDateString) return '';
    try { return isoDateString.substring(0, 10); } // YYYY-MM-DD
    catch (e) { console.error("Error formatting date:", e); return ''; }
};

// --- Reusable Field Group Component (Standalone) ---
// (No changes needed here)
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
// -----------------------------------------------------------

export default function ProfilePage() {
    const { user: authUser, login } = useAuth();

    // --- UPDATED STATE ---
    // Form state initialized from authUser
    const [firstName, setFirstName] = useState(authUser?.firstName || ''); // Changed
    const [lastName, setLastName] = useState(authUser?.lastName || '');   // Changed
    const [email, setEmail] = useState(authUser?.email || '');
    const [birthday, setBirthday] = useState(formatDateForInput(authUser?.birthday));
    const [school, setSchool] = useState(authUser?.school || '');
    const [district, setDistrict] = useState(authUser?.district || '');
    // ---------------------

    const [isLoading, setIsLoading] = useState(!authUser); // True only if authUser isn't ready
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- UPDATED EFFECT ---
    // Effect to populate form when authUser becomes available
    useEffect(() => {
        if (authUser) {
            setFirstName(authUser.firstName); // Changed
            setLastName(authUser.lastName);   // Changed
            setEmail(authUser.email);
            setBirthday(formatDateForInput(authUser.birthday));
            setSchool(authUser.school || ''); 
            setDistrict(authUser.district || '');
            setIsLoading(false); // Data ready
        } else { setIsLoading(true); } // Keep loading if no authUser yet
    }, [authUser]);
    // ----------------------

    // --- UPDATED PROFILE UPDATE HANDLER ---
    const handleProfileUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setIsUpdating(true); setError(null); setSuccessMessage(null);
        
        // Updated validation
        if (!firstName || !lastName || !email) { 
            setError("First Name, Last Name, and Email are required."); 
            setIsUpdating(false); 
            return; 
        }

        try {
            const updatePayload: Partial<UserProfile> = {};
            const initialData = authUser;
            if (!initialData) throw new Error("User data not available for comparison.");

            // Compare current form state with initial authUser state
            if (firstName !== initialData.firstName) updatePayload.firstName = firstName; // Changed
            if (lastName !== initialData.lastName) updatePayload.lastName = lastName;   // Changed
            if (email !== initialData.email) updatePayload.email = email;
            
            const formattedBirthday = birthday ? birthday : null;
            if (formattedBirthday !== formatDateForInput(initialData.birthday)) { updatePayload.birthday = formattedBirthday; }
            if (school !== (initialData.school || '')) updatePayload.school = school || null;
            if (district !== (initialData.district || '')) updatePayload.district = district || null;

            if (Object.keys(updatePayload).length > 0) {
                console.log("Updating profile:", updatePayload);
                const response = await axiosInstance.put<UserProfile>('/users/profile', updatePayload);
                const updatedData = response.data;
                console.log("Update response:", updatedData);

                // Update AuthContext
                 const currentToken = localStorage.getItem('authToken');
                 if (currentToken && authUser) {
                    const updatedAuthUser: User = { // Use User type from AuthContext
                        id: authUser.id, 
                        role: authUser.role, 
                        firstName: updatedData.firstName, // Changed
                        lastName: updatedData.lastName,   // Changed
                        email: updatedData.email,
                        award: updatedData.award || authUser.award, 
                        birthday: updatedData.birthday,
                        school: updatedData.school, 
                        district: updatedData.district,
                    };
                    await login(currentToken, updatedAuthUser); // login() updates context and storage
                    console.log("AuthContext updated.");
                 } else { console.warn("Context not updated (no token or authUser)."); }
                setSuccessMessage('Profile updated successfully!');
            } else { setSuccessMessage('No changes were made.'); }
        } catch (err: any) {
            console.error("Update profile err:", err);
            let errorMsg = "Update failed. Please check console.";
            if (err.response && err.response.data && err.response.data.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            }
            setError(errorMsg);
        } finally { setIsUpdating(false); }
    };
    // ----------------------------------------

    // --- Render Logic ---
    const renderProfileForm = () => {
        // Show loading state if authUser isn't ready yet
        if (isLoading) return <div className="loading-placeholder"><Loader2 className="animate-spin text-blue-500" size={32} /><p className='ml-3 dark:text-gray-300'>Loading profile...</p></div>;
        // Should not happen if Layout protects the route, but good failsafe
        if (!authUser) return <p className="info-text">Could not load user profile. Please try logging in again.</p>;

        // --- UPDATED FORM RENDER ---
        // Render the form using the FieldGroup component
        return (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
                {/* Error/Success Messages */}
                {error && (<div className="alert-error"><AlertCircle size={18} /> {error}</div>)}
                {successMessage && (<div className="alert-success"><CheckCircle size={18} /> {successMessage}</div>)}

                {/* --- SPLIT NAME FIELDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldGroup 
                        id="firstName" 
                        label="First Name" 
                        icon={UserIcon} 
                        required 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        placeholder="e.g., John"
                    />
                    <FieldGroup 
                        id="lastName" 
                        label="Last Name" 
                        icon={UserIcon} 
                        required 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        placeholder="e.g., Doe"
                    />
                </div>
                {/* ------------------------- */}
                
                <FieldGroup id="email" label="Email Address" icon={Mail} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                <FieldGroup id="birthday" label="Birthday" icon={Calendar} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                <FieldGroup id="school" label="School" icon={Building} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g., Central College" />
                <FieldGroup id="district" label="District" icon={MapPin} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Colombo" />

                {/* Save Button */}
                <div className="pt-2">
                    <button type="submit" disabled={isUpdating || isLoading} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                        {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        );
        // -------------------------
    };

    // Placeholder for password form
    const renderPasswordForm = () => (
         <div className="mt-10 pt-6 border-t dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Change Password</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Password change functionality is not yet implemented.</p>
         </div>
     );

    // Main component return
    return (
        <Layout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Your Profile</h1>
                <p className="text-gray-600 dark:text-gray-400">View and update your account details.</p>
            </div>
            {/* Form Container */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 max-w-2xl mx-auto">
               {renderProfileForm()}
               {renderPasswordForm()}
            </div>
            {/* Minimal Global Styles needed */}
             <style jsx global>{`
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; }
                .info-text { text-align: center; color: #6B7280; } .dark .info-text { color: #9CA3AF; }
                .alert-error { padding: 0.75rem; border-radius: 0.5rem; background-color: #FEF2F2; color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #F87171; } .dark .alert-error { background-color: rgba(185, 28, 28, 0.2); color: #F87171; border-color: rgba(185, 28, 28, 0.5); }
                .alert-success { padding: 0.75rem; border-radius: 0.5rem; background-color: #F0FDF4; color: #15803D; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; border: 1px solid #86EFAC; } .dark .alert-success { background-color: rgba(21, 128, 61, 0.2); color: #86EFAC; border-color: rgba(21, 128, 61, 0.5); }
                 /* Fix dark mode date picker icon */
                 .dark input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); }
            `}</style>
        </Layout>
    );
}