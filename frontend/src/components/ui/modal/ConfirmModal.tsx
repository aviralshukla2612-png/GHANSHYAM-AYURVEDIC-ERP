'use client';

import React from 'react';
import { Modal } from './Modal';
import { InfoBlock, InfoItem } from './InfoBlock';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  category?: string;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'bronze' | 'danger' | 'sage';
  items?: InfoItem[];
  infoTitle?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  category = 'CONFIRM ACTION',
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  items,
  infoTitle,
  children,
  icon,
}: ConfirmModalProps) {
  const variantButtonStyles = {
    primary:
      'bg-charcoal-900 hover:bg-charcoal-800 text-white shadow-sm active:scale-[0.99]',
    bronze:
      'bg-bronze-500 hover:bg-bronze-600 text-charcoal-900 font-bold shadow-sm active:scale-[0.99]',
    sage:
      'bg-sage-700 hover:bg-sage-600 text-white shadow-sm active:scale-[0.99]',
    danger:
      'bg-wine-500 hover:bg-wine-600 text-white shadow-sm active:scale-[0.99]',
  }[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      title={title}
      description={description}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-charcoal-700 bg-white hover:bg-ivory-200 border border-ivory-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${variantButtonStyles}`}
          >
            {icon}
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </>
      }
    >
      {items && items.length > 0 && (
        <InfoBlock title={infoTitle} items={items} />
      )}
      {children}
    </Modal>
  );
}
