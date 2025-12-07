import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate('/')}
      className="fixed left-4 top-4 z-50 w-14 h-14 bg-[#1a1a2e] border-2 border-[var(--theme-primary)] rounded-xl flex items-center justify-center hover:bg-[var(--theme-primary)] hover:text-[#0f0f19] transition-all shadow-lg"
    >
      <ArrowLeft size={24} />
    </button>
  );
};

export default BackButton;
