'use client';

import React from 'react';
import { Modal } from './Modal';

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  category?: string;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  customMaxWidthClass?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  category,
  title,
  description,
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  maxWidth = 'lg',
  customMaxWidthClass,
  children,
  icon,
}: FormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      title={title}
      description={description}
      maxWidth={maxWidth}
      customMaxWidthClass={customMaxWidthClass}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        <div className="pt-3 border-t border-ivory-300 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-charcoal-700 bg-white hover:bg-ivory-200 border border-ivory-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {icon}
            {isSubmitting ? 'Submitting...' : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
