import React, { useState } from 'react';

export const StepContainer: React.FC<{ children: React.ReactNode; title: string; description?: string }> = ({ children, title, description }) => (
  <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto w-full">
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{title}</h2>
      {description && <p className="text-slate-400 text-lg">{description}</p>}
    </div>
    <div className="flex-1 overflow-y-auto pr-2 pb-20 custom-scrollbar">
      {children}
    </div>
  </div>
);

export const SidebarItem: React.FC<{ active: boolean; label: string; number: number; completed: boolean }> = ({ active, label, number, completed }) => {
  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-300 ${active ? 'bg-brand-500/10 border border-brand-500/20' : 'opacity-60 hover:opacity-100 hover:bg-slate-900/50'}`}>
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold border transition-colors duration-300
        ${completed ? 'bg-brand-500 border-brand-500 text-white' : active ? 'border-brand-400 text-brand-400' : 'border-slate-600 text-slate-500'}
      `}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-brand-100' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
};

export const Tooltip: React.FC<{ content: string; children: React.ReactNode }> = ({ content, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded border border-slate-700 shadow-xl z-50 pointer-events-none animate-fade-in text-center">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
        </div>
      )}
    </div>
  );
};
