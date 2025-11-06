// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext"; // Import AuthProvider

const inter = Inter({ subsets: ["latin"] });

// --- UPDATE METADATA ---
export const metadata: Metadata = {
  title: "Open MCQ", // Changed title
  description: "A free, open MCQ evaluation app", // Updated description
};
// -----------------------

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider> {/* Wrap the content */}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}