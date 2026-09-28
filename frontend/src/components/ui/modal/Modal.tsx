'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customMaxWidthClass?: string;
  hideCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  category,
  title,
  description,
  children,
  footer,
  maxWidth = 'lg',
  customMaxWidthClass,
  hideCloseButton = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
    custom: customMaxWidthClass || 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      style={{
        backgroundColor: 'rgba(26, 24, 23, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        className={`w-[calc(100vw-24px)] sm:w-full ${maxWidthClasses[maxWidth]} bg-[#FFFFFF] text-[#1A1817] rounded-2xl sm:rounded-3xl border border-[#EAE5DC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-[0.98] duration-200`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#EAE5DC] bg-[#FAF8F5] flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-0.5">
            {category && (
              <span className="inline-block text-[10px] font-bold text-[#6B1D2F] uppercase tracking-widest font-mono">
                {category}
              </span>
            )}
            <h2 className="text-base sm:text-lg font-bold text-[#1A1817] tracking-tight leading-snug">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-[#78726D] font-normal leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {!hideCloseButton && (
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-[#8C857E] hover:text-[#1A1817] hover:bg-[#EFECE5] transition-colors shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#5A544F] leading-relaxed bg-[#FFFFFF]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[#EAE5DC] bg-[#FAF8F5] flex items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
