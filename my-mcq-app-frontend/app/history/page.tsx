// app/history/page.tsx

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../lib/axios';
import { Loader2, Calendar, CheckCircle, Percent, Hash, AlertTriangle, Trash2, X } from 'lucide-react'; // <-- Added Trash2 and X icons

// Define the shape of a single attempt
interface Attempt {
  _id: string;
  grade: string;
  subject: string;
  year: number;
  score: number;
  totalQuestions: number;
  createdAt: string; // ISO date string
}

export default function HistoryPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // State for data
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  
  // State for filters
  const [filters, setFilters] = useState({
    grade: '',
    subject: '',
    year: '',
  });

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: State for confirmation modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // -----------------------------------------

  // Fetch attempts when user is loaded
  useEffect(() => {
    if (!isAuthLoading && user) {
      const fetchAttempts = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await axiosInstance.get<Attempt[]>('/users/attempts');
          setAttempts(response.data);
        } catch (err: any) {
          console.error("Failed to fetch attempts:", err);
          setError(err.response?.data?.message || err.message || "Could not load history.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchAttempts();
    } else if (!isAuthLoading && !user) {
      setIsLoading(false); // Stop loading if no user
    }
  }, [user, isAuthLoading]);

  // --- Filter logic ---
  const uniqueGrades = useMemo(() => [...new Set(attempts.map(a => a.grade))], [attempts]);
  const uniqueSubjects = useMemo(() => [...new Set(attempts.map(a => a.subject))], [attempts]);
  const uniqueYears = useMemo(() => [...new Set(attempts.map(a => a.year.toString()))].sort((a, b) => Number(b) - Number(a)), [attempts]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredAttempts = useMemo(() => {
    return attempts.filter(attempt => {
      return (
        (filters.grade === '' || attempt.grade === filters.grade) &&
        (filters.subject === '' || attempt.subject === filters.subject) &&
        (filters.year === '' || attempt.year.toString() === filters.year)
      );
    });
  }, [attempts, filters]);
  // --- End filter logic ---

  // Helper to format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
      });
    } catch (e) {
        return "Invalid Date";
    }
  };

  // --- NEW: Function to handle history deletion ---
  const handleClearHistory = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await axiosInstance.delete('/users/attempts');
      // Success! Clear the state locally
      setAttempts([]);
      setFilters({ grade: '', subject: '', year: '' }); // Reset filters
      setShowConfirmModal(false);
      // Optionally show a success toast here
    } catch (err: any) {
      console.error("Failed to clear history:", err);
      setError(err.response?.data?.message || err.message || "Could not clear history.");
      // Keep modal open to show error? Or close it. User's choice.
      // setShowConfirmModal(false);
    } finally {
      setIsDeleting(false);
    }
  };
  // -----------------------------------------------

  // --- Render Functions ---

  const renderLoading = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-900 dark:text-white" />
      <p className="ml-3 text-gray-900 dark:text-white">Loading history...</p>
    </div>
  );

  const renderError = () => (
    <div className="text-center p-8 text-red-500 dark:text-red-400">
      <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
      <p>{error}</p>
    </div>
  );

  const renderNoAttempts = () => (
    <div className="text-center p-8 text-gray-500 dark:text-gray-400">
      <p>You haven't completed any attempts yet.</p>
      <a href="/papers" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 mt-2 inline-block">
        Start a quiz now
      </a>
    </div>
  );

  const renderFilterBar = () => (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      {/* Grade Filter */}
      <select
        name="grade"
        value={filters.grade}
        onChange={handleFilterChange}
        className="block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Grades</option>
        {uniqueGrades.map(grade => <option key={grade} value={grade}>{grade}</option>)}
      </select>
      {/* Subject Filter */}
      <select
        name="subject"
        value={filters.subject}
        onChange={handleFilterChange}
        className="block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Subjects</option>
        {uniqueSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
      </select>
      {/* Year Filter */}
      <select
        name="year"
        value={filters.year}
        onChange={handleFilterChange}
        className="block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Years</option>
        {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
      {/* --- NEW: Clear History Button --- */}
      <button
        onClick={() => setShowConfirmModal(true)}
        disabled={attempts.length === 0} // Disable if no attempts
        className="w-full sm:w-auto sm:col-start-4 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:text-red-300 dark:bg-red-900/50 dark:hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 size={16} />
        Clear History
      </button>
      {/* ---------------------------------- */}
    </div>
  );

  const renderHistoryTable = () => (
    <div className="shadow-lg rounded-xl overflow-hidden bg-white dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Paper
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Score
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAttempts.map((attempt) => (
              <tr key={attempt._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{attempt.subject} - {attempt.year}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{attempt.grade}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-500" />
                    {formatDate(attempt.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="font-semibold">{attempt.score} / {attempt.totalQuestions}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Percent size={14} className="text-blue-500" />
                    <span className="font-semibold">
                      {((attempt.score / attempt.totalQuestions) * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Show if filters result in no matches */}
      {filteredAttempts.length === 0 && attempts.length > 0 && (
         <p className="text-center p-6 text-gray-500 dark:text-gray-400">
            No attempts match your current filters.
         </p>
      )}
    </div>
  );

  // --- NEW: Render Modal Component ---
  const renderConfirmModal = () => {
    if (!showConfirmModal) return null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full m-4">
          <div className="p-6">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-300" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                  Clear Attempt History
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure you want to delete all of your attempts? This action is permanent and cannot be undone.
                  </p>
                </div>
                {/* Show delete-specific error */}
                {error && isDeleting && (
                    <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleClearHistory}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Delete All'
              )}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => {
                  setShowConfirmModal(false);
                  setError(null); // Clear any errors when canceling
              }}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ------------------------------------

  return (
    <Layout>
      {/* --- NEW: Render the modal --- */}
      {renderConfirmModal()}
      
      <div className="p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Attempt History
        </h1>

        {/* Show loading spinner first */}
        {isLoading && renderLoading()}

        {/* Show error if loading failed */}
        {!isLoading && error && !isDeleting && renderError()} 
        {/* ^ Don't show general error if we are in the middle of deleting */}

        {/* Show main content if loading is done and no error */}
        {!isLoading && !error && (
          <>
            {/* Show filters only if there are attempts */}
            {attempts.length > 0 && renderFilterBar()}
            
            {/* Show table if there are filtered attempts */}
            {filteredAttempts.length > 0 && renderHistoryTable()}
            
            {/* Show 'No attempts' message if initial load found none */}
            {attempts.length === 0 && renderNoAttempts()}
          </>
        )}
      </div>
    </Layout>
  );
}