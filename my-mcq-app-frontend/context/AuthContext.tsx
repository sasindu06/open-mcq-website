// context/AuthContext.tsx
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axiosInstance from '../lib/axios';

// --- 1. Define the correct User interface ---
export interface User {
  id: string;
  firstName: string; // Changed from 'name'
  lastName: string;  // Added
  email: string;
  role: 'user' | 'admin';
  award?: string;
  birthday?: string | null;
  school?: string | null;
  district?: string | null;
}
// ---------------------------------------------

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    delete axiosInstance.defaults.headers.common['Authorization'];
    console.log("User logged out, localStorage cleared.");
  };

  // --- 2. Update the 'login' function's validation check ---
  const login = (newToken: string, userData: User): Promise<void> => {
    return new Promise((resolve, reject) => {
      // THIS IS THE FIX: Check for 'firstName' and 'lastName'
      if (newToken && userData && userData.id && userData.firstName && userData.lastName && userData.email && userData.role) {
        try {
            console.log("AuthContext: Logging in user:", userData);
            localStorage.setItem('authToken', newToken);
            localStorage.setItem('authUser', JSON.stringify(userData));
            setToken(newToken);
            setUser(userData);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            resolve();
        } catch (error) {
             console.error("AuthContext: Error during login storage/state update:", error);
             reject(new Error("Login failed during storage update."));
        }
      } else {
        // This is the error you are seeing. It fails because 'firstName' or 'lastName' is missing.
        console.error("AuthContext: Login failed - Invalid token or core user data missing.", { token: newToken, user: userData });
        reject(new Error("Login failed. Invalid data received from server."));
      }
    });
  };

  // --- 3. Update the 'useEffect' check ---
  useEffect(() => {
    console.log("AuthContext: Checking localStorage on initial load...");
    setIsLoading(true);
    const savedToken = localStorage.getItem('authToken');
    const savedUserJson = localStorage.getItem('authUser');

    if (savedToken && savedUserJson) {
      console.log("AuthContext: Found token and user data in localStorage.");
      try {
        const parsedUser: User = JSON.parse(savedUserJson);
        // THIS IS ALSO THE FIX: Check for 'firstName' and 'lastName'
        if (parsedUser && parsedUser.id && parsedUser.firstName && parsedUser.lastName && parsedUser.email && parsedUser.role) {
            setToken(savedToken);
            setUser(parsedUser);
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
            console.log("AuthContext: User state restored from localStorage:", parsedUser);
        } else {
             console.warn("AuthContext: Invalid user data found in localStorage. Clearing.");
             logout();
        }
      } catch (error) {
        console.error("AuthContext: Failed to parse user data from localStorage. Clearing.", error);
        logout();
      }
    } else {
         console.log("AuthContext: No token or user data found in localStorage.");
         setToken(null);
         setUser(null);
         delete axiosInstance.defaults.headers.common['Authorization'];
    }

    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};