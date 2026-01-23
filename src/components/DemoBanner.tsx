import React from 'react';
import { isDemoMode } from '../lib/demoData';
import { AlertCircle } from 'lucide-react';

const DemoBanner: React.FC = () => {
  if (!isDemoMode()) return null;

  return (
    <div className="bg-yellow-400 border-b border-yellow-500 px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-900">
        <AlertCircle className="w-4 h-4" />
        <span>DEMO MODE: This is a demonstration with sample data. No real data is being used.</span>
      </div>
    </div>
  );
};

export default DemoBanner;


