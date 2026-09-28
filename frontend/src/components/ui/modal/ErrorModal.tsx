'use client';

import React from 'react';
import { Modal } from './Modal';
import { AlertCircle } from 'lucide-react';
import { InfoBlock, InfoItem } from './InfoBlock';

export interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  title: string;
  description?: string;
  errorMessage?: string;
  items?: InfoItem[];
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
  children?: React.ReactNode;
}

export function ErrorModal({
  isOpen,
  onClose,
  category = 'ACTION COULD NOT BE COMPLETED',
  title,
  description,
  errorMessage,
  items,
  actionLabel,
  onAction,
  cancelLabel = 'Dismiss',
  children,
}: ErrorModalProps) {
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
            className="px-4 py-2 text-xs font-semibold text-charcoal-700 bg-white hover:bg-ivory-200 border border-ivory-300 rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </>
      }
    >
      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 bg-wine-50 border border-wine-100 rounded-xl text-wine-600">
          <AlertCircle className="w-4 h-4 text-wine-500 shrink-0 mt-0.5" strokeWidth={2} />
          <div className="text-xs text-charcoal-700 leading-normal">
            {errorMessage}
          </div>
        </div>
      )}

      {items && items.length > 0 && <InfoBlock items={items} />}
      {children}
    </Modal>
  );
}
