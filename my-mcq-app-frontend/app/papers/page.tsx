// app/papers/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import axiosInstance from '../../lib/axios';
import { ChevronDown, ArrowRight, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation'; // Import useRouter

// Define the shape of our filter data
interface PaperFilters {
  grades: string[];
  subjects: string[];
  years: string[];
}

export default function PapersPage() {
  const router = useRouter(); // Get the router instance
  const [filters, setFilters] = useState<PaperFilters>({ grades: [], subjects: [], years: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null); // For API errors

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Fetch filter data when the component loads
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axiosInstance.get<PaperFilters>('/papers/filters');
        setFilters(response.data);
      } catch (err) {
        setApiError('Failed to load paper options. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFilters();
  }, []);

  // Updated function to start the quiz
  const handleStartQuiz = async () => {
    if (!selectedGrade || !selectedSubject || !selectedYear) {
      alert("Please make all selections before starting.");
      return;
    }
    setApiError(null);
    setIsLoading(true); // Set loading state for the button

    try {
      // Call the new backend endpoint
      const response = await axiosInstance.post('/papers/start', {
        grade: selectedGrade,
        subject: selectedSubject,
        year: selectedYear,
      });

      const { attemptId } = response.data;

      // Redirect to the new quiz page, passing the attemptId
      router.push(`/quiz/${attemptId}`);

    } catch (err: any) {
      console.error("Failed to start quiz:", err);
      setApiError(err.response?.data?.message || "Failed to start quiz. Please try again.");
      setIsLoading(false); // Stop loading on error
    }
  };

  return (
    <Layout>
      {/* Title Section */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Select Your Paper 📝
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose the grade, subject, and year to start your quiz.
        </p>
      </div>

      {/* Main Content Area */}
      {isLoading && !filters.grades.length ? ( // Show initial loading message
        <p className="text-center text-gray-500">Loading paper options...</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-10 mb-6 max-w-2xl mx-auto">
          
          {/* Grade Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <GraduationCap size={18} /> Grade Level
            </label>
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10"
              >
                <option value="">Select Grade Level</option>
                {filters.grades.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Subject Selection */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <BookOpen size={18} /> Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={!selectedGrade}
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Subject</option>
                {filters.subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Year Selection */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
              <Calendar size={18} /> Year
            </label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedSubject}
                className="w-full px-4 py-4 rounded-xl appearance-none cursor-pointer bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Year</option>
                {filters.years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" size={20} />
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartQuiz}
            disabled={!selectedGrade || !selectedSubject || !selectedYear || isLoading}
            className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:scale-100"
          >
            {isLoading ? "Starting..." : "Start Quiz"} <ArrowRight size={20} />
          </button>

          {/* Display API errors here */}
          {apiError && (
            <p className="text-center text-red-500 mt-4">{apiError}</p>
          )}
        </div>
      )}
    </Layout>
  );
}