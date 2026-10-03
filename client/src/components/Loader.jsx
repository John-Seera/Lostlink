import React from 'react';

export default function Loader({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div
        className={`${sizeClasses[size]} border-blue-500/20 border-t-blue-500 rounded-full animate-spin`}
      />
      {message && <p className="text-sm text-slate-400 font-medium animate-pulse">{message}</p>}
    </div>
  );
}
