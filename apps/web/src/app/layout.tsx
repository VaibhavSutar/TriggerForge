import React from 'react';
import './global.css'
import { AuthProvider } from './context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>

        <main>
          {children}
        </main>
        </AuthProvider>
      </body>
    </html>
  );
}