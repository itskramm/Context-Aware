import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function LectureContentWarning({ message = "This content may be sensitive" }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
      <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
      <p className="text-sm text-yellow-800 dark:text-yellow-200">{message}</p>
    </div>
  );
}
