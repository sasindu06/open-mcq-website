// app/admin/users/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../../components/Layout'; // Adjust path
import { useAuth, User } from '../../../context/AuthContext'; // To check role & get current user ID
import axiosInstance from '../../../lib/axios'; // Adjust path
import { useRouter } from 'next/navigation';
import { Users, Edit, Trash2, ShieldAlert, Loader2, UserCheck, UserX } from 'lucide-react'; // Icons

// Define the shape of User data received from the backend
interface AdminUserView {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: string; // Assuming backend sends this
    // Add other fields if needed (e.g., award, school...)
}

// --- Format Date Helper ---
// (Moved outside component for better organization)
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
    catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
};
// -------------------------

export default function ManageUsersPage() {
    // Note: useAuth provides 'User' type which includes 'id', backend uses '_id'.
    // We use currentUser?.id for self-check and user._id for data mapping.
    const { user: currentUser, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null); // Track deletion state

     // --- Role Check & Redirection ---
    useEffect(() => {
        // Only redirect after the initial auth check is complete
        if (!isAuthLoading && currentUser?.role !== 'admin') {
            console.log("ManageUsersPage: Not admin, redirecting.");
            router.push('/dashboard'); // Redirect non-admins
        }
    }, [currentUser, isAuthLoading, router]); // Depend on auth state and user role

    // --- Fetch Users ---
    const fetchUsers = async () => {
        // Conditions to check before fetching
        if (isAuthLoading || currentUser?.role !== 'admin') {
            console.log("fetchUsers: Skipping fetch - auth loading or not admin.");
            setIsLoadingData(false); // Ensure loading stops
            return;
        }
        console.log("Fetching users list...");
        setIsLoadingData(true);
        setError(null);
        try {
            // Use the GET /api/admin/users endpoint
            const response = await axiosInstance.get<AdminUserView[]>('/admin/users');
            console.log("Fetched users data:", response.data);
            setUsers(response.data);
        } catch (err: any) {
            console.error("Failed to fetch users:", err);
            setError(err.response?.data?.message || "Could not load users.");
        } finally {
            setIsLoadingData(false); // Stop loading indicator
        }
    };

    // Fetch users on initial load *after* admin role confirmed
    useEffect(() => {
        // Trigger fetch only when auth is resolved and user is admin
        if (!isAuthLoading && currentUser?.role === 'admin') {
            fetchUsers();
        }
    }, [currentUser, isAuthLoading]); // Effect dependencies


    // --- Handlers ---
    const handleEditUser = (userId: string) => {
        console.log(`Navigating to edit user: ${userId}`);
        router.push(`/admin/users/edit/${userId}`); // Navigate to edit page
    };

    const handleDeleteUser = async (userToDelete: AdminUserView) => {
        // Prevent admin from deleting themselves
        if (currentUser?.id === userToDelete._id) {
             alert("You cannot delete your own admin account.");
             return;
        }
        // Prevent multiple delete clicks while one is processing
        if (deletingId) return;

        if (confirm(`Are you sure you want to delete user "${userToDelete.name}" (${userToDelete.email})?\nThis action cannot be undone.`)) {
            setError(null);
            setDeletingId(userToDelete._id); // Show loading state for this specific row
            console.log(`Attempting to delete user: ${userToDelete._id}`);
            try {
                // Call DELETE /api/admin/users/:id
                await axiosInstance.delete(`/admin/users/${userToDelete._id}`);
                console.log(`User ${userToDelete._id} deleted successfully.`);
                // Refresh the list after successful deletion (Optimistic UI update)
                setUsers(prev => prev.filter(u => u._id !== userToDelete._id));
                // Optionally show a success message toast/notification here
            } catch (err: any) {
                 console.error("Failed to delete user:", err);
                 const errorMsg = err.response?.data?.message || "Could not delete user.";
                 setError(errorMsg); // Show error message banner if needed
                 alert(`Error: ${errorMsg}`); // Show alert for immediate feedback
            } finally {
                 setDeletingId(null); // Stop loading state for this row regardless of outcome
            }
        }
    };


     // --- Loading / Access Denied States ---
    if (isAuthLoading || (!isAuthLoading && !currentUser)) {
        // Waiting for auth context to resolve user status or still loading
         return <Layout><div className="loading-placeholder"><Loader2 className="animate-spin"/> Verifying access...</div></Layout>;
    }
    if (currentUser?.role !== 'admin') {
        // Auth resolved, but user is not admin (should have been redirected, but show message)
        return <Layout><div className="access-denied"><ShieldAlert/> Access Denied</div></Layout>;
    }


    // --- Render Logic for Admin ---
    const renderUserList = () => {
         // Show loading spinner only when actively fetching and list is empty initially
         if (isLoadingData && users.length === 0) return <div className="loading-placeholder"><Loader2 className="animate-spin"/> Loading users...</div>;
         // Show fetch error if occurred
         if (error) return <p className="error-text mt-8">{error}</p>;
         // Show message if fetch completed but no users found
         if (users.length === 0 && !isLoadingData) return <p className="info-text mt-8">No users found.</p>;

        // Render the table if users exist
        return (
            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow mt-6 border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Table Head */}
                    <thead className="bg-gray-100 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    {/* Table Body */}
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                            <tr key={user._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150 ${deletingId === user._id ? 'opacity-40 bg-red-50 dark:bg-red-900/20' : ''}`}>
                                {/* Name */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                                {/* Email */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                                {/* Role Badge */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold leading-4 ${ user.role === 'admin' ? 'role-admin' : 'role-user' }`}>
                                        {user.role}
                                    </span>
                                </td>
                                {/* Joined Date */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(user.createdAt)}</td>
                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button
                                        onClick={() => handleEditUser(user._id)}
                                        disabled={!!deletingId} // Disable if any delete is in progress
                                        className="action-button edit-button"
                                        title="Edit User"
                                    > <Edit size={16}/> </button>
                                    <button
                                        onClick={() => handleDeleteUser(user)}
                                        // Disable delete for self or while another delete is happening
                                        disabled={!!deletingId || currentUser?.id === user._id}
                                        className={`action-button delete-button ${currentUser?.id === user._id ? 'disabled-self-delete' : ''}`}
                                        title={currentUser?.id === user._id ? "Cannot delete self" : "Delete User"}
                                    >
                                       {/* Show loader only for the specific user being deleted */}
                                       {deletingId === user._id ? <Loader2 className="animate-spin inline-block" size={16}/> : <Trash2 size={16}/>}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    // --- Main Page Render ---
    return (
        <Layout>
             {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                 <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Users /> Manage Users
                    </h1>
                     <p className="text-gray-600 dark:text-gray-400 mt-1"> View, edit roles, or delete user accounts. </p>
                </div>
                {/* Optional: Add "Create User" button later if needed */}
            </div>

             {/* Render list or placeholders */}
            {renderUserList()}

             {/* Styles */}
             <style jsx global>{`
                /* Global styles needed for placeholders etc. */
                .loading-placeholder { display: flex; justify-content: center; align-items: center; min-height: 10rem; gap: 0.75rem; color: #6B7280; } .dark .loading-placeholder { color: #9CA3AF; }
                .access-denied { text-align: center; padding: 2rem; } .access-denied svg { margin: auto; color: #EF4444; margin-bottom: 1rem; } .access-denied h1 { font-size: 1.25rem; font-weight: 600; color: #B91C1C; } .dark .access-denied h1 { color: #F87171; }
                .error-text { text-align: center; color: #DC2626; } .dark .error-text { color: #F87171; }
                .info-text { text-align: center; color: #6B7280; } .dark .info-text { color: #9CA3AF; }

                /* Specific styles for the table (extracted from Tailwind classes for clarity) */
                .role-admin { background-color: #DBEAFE; color: #1E40AF; } /* bg-blue-100 text-blue-800 */
                .dark .role-admin { background-color: #1E3A8A; color: #BFDBFE; } /* dark:bg-blue-900 dark:text-blue-200 */
                .role-user { background-color: #F3F4F6; color: #1F2937; } /* bg-gray-100 text-gray-800 */
                .dark .role-user { background-color: #4B5563; color: #F3F4F6; } /* dark:bg-gray-600 dark:text-gray-100 */

                .action-button { padding: 0.25rem; border-radius: 0.25rem; transition: color 0.15s ease-in-out; }
                .action-button:disabled { opacity: 0.4; cursor: not-allowed; }
                .edit-button { color: #2563EB; } .edit-button:hover:not(:disabled) { color: #1D4ED8; }
                .dark .edit-button { color: #60A5FA; } .dark .edit-button:hover:not(:disabled) { color: #3B82F6; }
                .delete-button { color: #DC2626; } .delete-button:hover:not(:disabled) { color: #B91C1C; }
                .dark .delete-button { color: #F87171; } .dark .delete-button:hover:not(:disabled) { color: #EF4444; }
                .disabled-self-delete { opacity: 0.4; cursor: not-allowed; }
            `}</style>

        </Layout>
    );
}

// Ensure User type from AuthContext is available if needed (it's used internally)
// type User = import('../../../context/AuthContext').User;