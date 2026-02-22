import React from 'react';
import './global.css'
import { AuthProvider } from './context/AuthContext';
import { Tour } from '@/components/Tour';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>

          <main>
            {children}
            <Tour />
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}