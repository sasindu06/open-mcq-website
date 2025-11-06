// components/LanguageSwitcher.tsx
"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import React, { useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale(); // This hook gets the current active locale (e.g., "en")

  const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;
    
    // We use startTransition to avoid blocking the UI
    startTransition(() => {
        // This regex replaces the current locale in the pathname
        // e.g., /en/dashboard -> /si/dashboard
        const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
        router.replace(newPath);
    });
  };

  return (
    <div className="relative">
      <Languages
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
      />
      <select
        defaultValue={locale}
        onChange={onSelectChange}
        disabled={isPending}
        className="block w-full appearance-none rounded-lg border
                   border-gray-200 dark:border-gray-700
                   bg-gray-100 dark:bg-gray-700
                   pl-10 pr-8 py-2
                   text-sm font-medium text-gray-900 dark:text-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   transition-colors"
        aria-label="Change language"
      >
        <option value="en">English</option>
        <option value="si">Sinhala (සිංහල)</option>
      </select>
    </div>
  );
}