'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JoinMobButtonProps {
  mobId: string | null;
  mobName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'compact';
  size?: 'sm' | 'md' | 'lg';
}

const encouragingTexts = [
  'Join the Mob!',
  'Be Part of This!',
  'Explore This Mob',
  'Join Now',
  'Discover More',
];

export function JoinMobButton({ mobId, mobName, className = '', variant = 'default', size = 'md' }: JoinMobButtonProps) {
  const [textIndex, setTextIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Rotate encouraging text on hover
  useEffect(() => {
    if (isHovered) {
      const interval = setInterval(() => {
        setTextIndex((prev) => (prev + 1) % encouragingTexts.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isHovered]);

  if (!mobId) return null;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const baseClasses = `inline-flex items-center gap-2 ${sizeClasses[size]} rounded-lg font-semibold transition-all duration-300 relative overflow-hidden group`;
  
  const variantClasses = {
    default: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:scale-105 animate-pulse-glow',
    outline: 'border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent-soft)] hover:border-[var(--accent-hover)] hover:scale-105',
    ghost: 'text-[var(--accent)] hover:bg-[var(--accent-soft)] hover:scale-105',
    compact: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg hover:scale-105',
  };

  const displayText = mobName 
    ? (isHovered ? encouragingTexts[textIndex] : `Join ${mobName}`)
    : (isHovered ? encouragingTexts[textIndex] : 'Join Mob');

  return (
    <Link
      href={`/mob/${mobId}`}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      {variant === 'default' && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-shift" />
      )}
      
      {/* Icon with animation */}
      <svg 
        className={`${iconSizes[size]} relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
      
      {/* Text with smooth transition */}
      <span className="relative z-10 transition-all duration-300">
        {displayText}
      </span>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
    </Link>
  );
}

