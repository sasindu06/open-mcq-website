// app/auth/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Mail, Lock, User as UserIcon, Building, MapPin, Calendar, Loader2 } from 'lucide-react';
import axiosInstance from '../../lib/axios';
import { useAuth, User } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

// --- Reusable Field Group Component (Standalone) ---
interface FieldGroupProps {
    id: string; label: string; icon: React.ElementType; required?: boolean; type?: string;
    placeholder?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    minLength?: number; showPasswordHint?: boolean;
}

const FieldGroup: React.FC<FieldGroupProps> = ({
    id, label, icon: Icon, required, type = "text", placeholder, value, onChange, minLength, showPasswordHint
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
            {showPasswordHint && <span className="text-xs text-gray-500"> (min. 6 characters)</span>}
        </label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            </div>
            <input
                id={id} name={id} type={type} required={required} value={value}
                onChange={onChange} minLength={minLength} placeholder={placeholder}
                className="block w-full rounded-md border
                           border-gray-300 dark:border-gray-600
                           bg-gray-50 dark:bg-gray-700
                           text-gray-900 dark:text-white
                           placeholder-gray-400 dark:placeholder-gray-500
                           pl-10 pr-3 py-3
                           focus:outline-none focus:ring-blue-500 focus:border-blue-500
                           sm:text-sm transition-colors duration-200"
            />
        </div>
    </div>
);
// -----------------------------------------------------------

// --- NEW Welcome Modal Component ---
interface WelcomeModalProps {
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 transition-opacity duration-300">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 md:p-8 shadow-2xl dark:bg-gray-800 transform transition-all duration-300 scale-100">
                <h2 className="mb-3 text-center text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Welcome to Open MCQ!
                </h2>
                <p className="text-center text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                    We hope for a great future for you.
                </p>
                
                <div className="my-5 p-4 rounded-lg bg-yellow-50 dark:bg-gray-700 border border-yellow-300 dark:border-gray-600">
                    <h3 className="mb-2 text-center text-lg font-semibold text-yellow-800 dark:text-yellow-400">
                        Attention
                    </h3>
                    
                    <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <p>
                            This is just an improving project and anytime errors or server errors may occur (like 404 page not found).
                        </p>
                        <p>
                            If you encounter an error, please contact our WhatsApp number. I use free resources for hosting and servers, so sometimes they may be down. I apologize for that.
                        </p>
                        <p>
                            This is a non-commercial project.
                        </p>
                        <p className="font-medium pt-2">
                            Thank you for using this site.
                        </p>
                        <p className="text-center font-bold text-base text-gray-800 dark:text-gray-100">
                            WhatsApp - 0783550601
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={onClose}
                        className="w-full max-w-xs mx-auto rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all hover:shadow-lg"
                    >
                        Keep going
                    </button>
                </div>
            </div>
        </div>
    );
};
// -----------------------------------------------------------


// --- Main AuthPage Component ---
export default function AuthPage() {
  const { isDark, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthday, setBirthday] = useState('');
  const [school, setSchool] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- NEW STATE FOR MODAL ---
  const [showWelcome, setShowWelcome] = useState(false);
  // ---------------------------

  const { login, user: authUser, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

   useEffect(() => {
       if (!isAuthLoading && authUser) {
           console.log("AuthPage: User already logged in, redirecting to /dashboard");
           router.push('/dashboard');
       }
   }, [authUser, isAuthLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        console.log("Attempting login...");
        const response = await axiosInstance.post('/auth/login', { email, password });
        console.log("Login response OK, calling context login...");
        await login(response.data.token, response.data.user as User);
        console.log("Context login complete, waiting for redirect...");
      } else {
        // --- THIS IS THE REGISTRATION LOGIC ---
        const payload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            ...(birthday && { birthday }),
            ...(school.trim() && { school: school.trim() }),
            ...(district.trim() && { district: district.trim() }),
        };
        
        if (password.length < 6) {
             throw new Error("Password must be at least 6 characters long.");
        }
        if (!firstName.trim() || !lastName.trim()) {
            throw new Error("First name and last name are required.");
        }

        console.log("Attempting registration with payload:", payload);
        await axiosInstance.post('/auth/register', payload);
        console.log("Registration successful.");
        
        // --- MODIFIED BEHAVIOR ---
        // alert('Registration successful! Please log in.'); // <-- REMOVED THIS
        setShowWelcome(true); // <-- ADDED THIS to show modal
        // -------------------------
        
        setFirstName(''); setLastName('');
        setEmail(''); setPassword(''); setBirthday(''); setSchool(''); setDistrict('');
        setError('');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let errorMessage = "An unexpected error occurred. Please try again.";
       if (err.response) {
           console.error("Backend Error Response:", err.response.data);
           if (err.response.data?.errors && Array.isArray(err.response.data.errors)) {
               errorMessage = err.response.data.errors.join(' ');
           } else if (err.response.data?.message) {
               errorMessage = err.response.data.message;
           } else {
                errorMessage = `Server Error: ${err.response.status} ${err.response.statusText}`;
           }
       } else if (err.request) {
            console.error("Network Error:", err.request);
            errorMessage = "Network error. Please check your connection and try again.";
       } else if (err.message) {
            errorMessage = err.message;
       }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

   if (isAuthLoading || (!isAuthLoading && authUser)) {
        return (
             <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                 <p className="text-gray-900 dark:text-white">Loading...</p>
             </div>
        );
   }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      
      {/* --- RENDER THE MODAL IF showWelcome IS TRUE --- */}
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      {/* ----------------------------------------------- */}

      <button 
        onClick={toggleTheme} 
        className="fixed top-4 right-4 md:top-6 md:right-6 p-2 md:p-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all" 
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div 
          className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-10"
        >

          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full mb-4 bg-blue-50 dark:bg-blue-500/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">OM</div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900 dark:text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{isLogin ? 'Sign in to Open MCQ' : 'Join Open MCQ today!'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <FieldGroup id="firstName" label="First Name" icon={UserIcon} required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
                <FieldGroup id="lastName" label="Last Name" icon={UserIcon} required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
                
                <FieldGroup id="birthday" label="Birthday (Optional)" icon={Calendar} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} />
                <FieldGroup id="school" label="School (Optional)" icon={Building} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g., Central College" />
                <FieldGroup id="district" label="District (Optional)" icon={MapPin} value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., Colombo" />
             </>
            )}

            <FieldGroup id="email" label="Email" icon={Mail} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <FieldGroup id="password" label="Password" icon={Lock} required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={isLogin ? undefined : 6} showPasswordHint={!isLogin} />

            {error && (<p className="text-sm text-red-500 text-center">{error}</p>)}

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] disabled:opacity-60 disabled:cursor-wait transition-all duration-200">
              {isLoading && <Loader2 className="animate-spin" size={20}/>}
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>

       <style jsx global>{`
         .loading-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #F9FAFB; }
         .dark .loading-screen { background-color: #111827; }
         .dark input[type="date"]::-webkit-calendar-picker-indicator {
            filter: invert(1);
         }
       `}</style>

    </div>
  );
}