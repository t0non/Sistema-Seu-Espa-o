import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className = "h-12 w-12", showText = false }: LogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Outer Circle */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="#4B76A8" strokeWidth="4" />
        
        {/* House Shape */}
        <path 
          d="M30 55 L50 35 L70 55 L70 75 L30 75 Z" 
          fill="#22C55E" 
        />
        <path 
          d="M50 35 L70 55 L70 75 L50 75 Z" 
          fill="#4B76A8" 
        />
        
        {/* Windows on blue side */}
        <rect x="55" y="60" width="4" height="4" fill="white" />
        <rect x="61" y="60" width="4" height="4" fill="white" />
        <rect x="55" y="66" width="4" height="4" fill="white" />
        <rect x="61" y="66" width="4" height="4" fill="white" />

        {/* Broom / Squeegee */}
        <line x1="25" y1="30" x2="75" y2="30" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="30" x2="35" y2="75" stroke="#22C55E" strokeWidth="3" />
        <path d="M30 70 L40 80 L30 85 L20 80 Z" fill="#22C55E" />

        {/* Sparkles */}
        <path d="M65 45 L67 42 L70 45 L67 48 Z" fill="white" />
        <circle cx="62" cy="40" r="1.5" fill="white" />
      </svg>
      {showText && (
        <div className="mt-1 text-center">
          <p className="text-[8px] font-bold text-brand-blue-dark leading-none">Seu Espaço</p>
          <p className="text-[5px] uppercase tracking-tighter text-brand-green font-bold">Limpeza Pós Obras</p>
        </div>
      )}
    </div>
  );
}
