'use client';

import React from 'react';

export interface InfoItem {
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  highlight?: boolean;
  highlightColor?: 'bronze' | 'charcoal' | 'sage' | 'wine' | 'emerald';
}

export interface InfoBlockProps {
  title?: string;
  items?: InfoItem[];
  columns?: 1 | 2 | 3 | 4;
  children?: React.ReactNode;
  className?: string;
}

export function InfoBlock({
  title,
  items,
  columns = 2,
  children,
  className = '',
}: InfoBlockProps) {
  const colClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  const highlightStyles = {
    bronze: 'text-bronze-600 font-bold',
    charcoal: 'text-charcoal-900 font-bold',
    sage: 'text-sage-700 font-bold',
    wine: 'text-wine-600 font-bold',
    emerald: 'text-emerald-700 font-bold',
  };

  return (
    <div
      className={`p-4 bg-ivory-100/90 rounded-xl border border-ivory-300/80 space-y-3 ${className}`}
    >
      {title && (
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 border-b border-ivory-300/60 pb-1.5">
          {title}
        </h4>
      )}

      {items && items.length > 0 && (
        <div className={`grid ${colClass} gap-3 text-xs`}>
          {items.map((item, idx) => (
            <div key={idx} className="space-y-0.5">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 font-mono">
                {item.label}
              </span>
              <div
                className={`text-xs ${
                  item.highlight
                    ? highlightStyles[item.highlightColor || 'charcoal']
                    : 'text-charcoal-900 font-medium'
                }`}
              >
                {item.value}
              </div>
              {item.subValue && (
                <div className="text-[11px] text-charcoal-500">
                  {item.subValue}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
