import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hyva Transport — Fleet Management System",
  description:
    "Multi-tenant SaaS platform for transport companies to manage hired vehicle operations, trip logging, weight-based revenue calculation, and owner settlement.",
};

import { Toaster } from 'react-hot-toast'
import PageLoader from '@/components/PageLoader'
import { LoadingProvider } from '@/lib/context/LoadingContext'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LoadingProvider>
          <PageLoader />
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid var(--color-border)'
              }
            }} 
          />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}
