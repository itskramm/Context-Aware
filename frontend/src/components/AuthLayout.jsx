import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold tracking-tight">Context Aware</h1>
          </Link>
          {title && (
            <h2 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h2>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-8">
          {children}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Context Aware. All rights reserved.
        </p>
      </div>
    </div>
  );
}
