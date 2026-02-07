// src/components/dashboard/DashboardIllustrations.tsx
import React from 'react';

export const WorkingIllustration: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Desk */}
    <rect x="40" y="120" width="120" height="8" fill="#8B5CF6" rx="2" />
    <rect x="45" y="128" width="6" height="40" fill="#7C3AED" rx="1" />
    <rect x="149" y="128" width="6" height="40" fill="#7C3AED" rx="1" />

    {/* Computer */}
    <rect x="70" y="85" width="60" height="40" fill="#6366F1" rx="2" />
    <rect x="75" y="90" width="50" height="30" fill="#93C5FD" rx="1" />
    <line x1="90" y1="95" x2="110" y2="95" stroke="#60A5FA" strokeWidth="2" />
    <line x1="90" y1="100" x2="110" y2="100" stroke="#60A5FA" strokeWidth="2" />

    {/* Person */}
    <circle cx="100" cy="50" r="12" fill="#FCD34D" />
    <path d="M 85 65 Q 100 70 115 65" fill="#6366F1" />
    <rect x="90" y="65" width="20" height="25" fill="#6366F1" rx="2" />

    {/* Plant */}
    <ellipse cx="150" cy="115" rx="8" ry="10" fill="#10B981" />
    <rect x="148" y="115" width="4" height="10" fill="#059669" />

    {/* Coffee cup */}
    <rect x="50" y="110" width="12" height="15" fill="#EF4444" rx="2" />
    <rect x="52" y="108" width="8" height="2" fill="#DC2626" rx="1" />
  </svg>
);

export const GoalIllustration: React.FC<{ className?: string }> = ({ className = "w-20 h-20" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="35" fill="#E0E7FF" />
    <circle cx="50" cy="50" r="25" fill="#C7D2FE" />
    <circle cx="50" cy="50" r="15" fill="#A5B4FC" />
    <circle cx="50" cy="50" r="8" fill="#6366F1" />
    <path d="M 30 30 L 50 50" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="50" r="3" fill="#EF4444" />
  </svg>
);

export const MoneyIllustration: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="30" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
    <text x="40" y="52" fontSize="32" fontWeight="bold" fill="#F59E0B" textAnchor="middle">₹</text>
  </svg>
);

export const ChartUpIllustration: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="50" width="12" height="20" fill="#60A5FA" rx="2" />
    <rect x="25" y="40" width="12" height="30" fill="#3B82F6" rx="2" />
    <rect x="40" y="30" width="12" height="40" fill="#2563EB" rx="2" />
    <rect x="55" y="20" width="12" height="50" fill="#1D4ED8" rx="2" />
    <path d="M 65 15 L 75 15 L 75 25" stroke="#10B981" strokeWidth="2" fill="none" />
    <path d="M 65 15 L 75 25" stroke="#10B981" strokeWidth="2" />
  </svg>
);

export const CalendarIllustration: React.FC<{ className?: string }> = ({ className = "w-16 h-16" }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="20" width="50" height="45" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="2" rx="4" />
    <rect x="15" y="20" width="50" height="12" fill="#3B82F6" rx="4" />
    <line x1="25" y1="15" x2="25" y2="25" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    <line x1="55" y1="15" x2="55" y2="25" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="28" cy="45" r="3" fill="#3B82F6" />
    <circle cx="40" cy="45" r="3" fill="#3B82F6" />
    <circle cx="52" cy="45" r="3" fill="#3B82F6" />
    <circle cx="28" cy="55" r="3" fill="#3B82F6" />
    <circle cx="40" cy="55" r="3" fill="#10B981" />
  </svg>
);
