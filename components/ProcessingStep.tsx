import React from 'react';
import { SpinnerIcon, SuccessIcon } from './Icons';

interface ProcessingStepProps {
  label: string;
  status: 'waiting' | 'active' | 'done';
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({ label, status }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
      status === 'active' 
        ? 'bg-corporate-50 border-corporate-200 shadow-sm' 
        : status === 'done' 
          ? 'bg-green-50 border-green-100' 
          : 'opacity-50 border-transparent'
    }`}>
      <div className="flex-shrink-0">
        {status === 'active' && <SpinnerIcon />}
        {status === 'done' && <SuccessIcon />}
        {status === 'waiting' && <div className="w-6 h-6 rounded-full border-2 border-corporate-200" />}
      </div>
      <span className={`font-medium ${
        status === 'active' ? 'text-corporate-900' : status === 'done' ? 'text-green-800' : 'text-corporate-400'
      }`}>
        {label}
      </span>
    </div>
  );
};