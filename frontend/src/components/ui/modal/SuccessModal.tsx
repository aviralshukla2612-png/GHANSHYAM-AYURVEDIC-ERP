'use client';

import React from 'react';
import { Modal } from './Modal';
import { Check } from 'lucide-react';
import { InfoBlock, InfoItem } from './InfoBlock';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
  title: string;
  description?: string;
  referenceNumber?: string;
  referenceLabel?: string;
  nextStep?: string;
  items?: InfoItem[];
  actionLabel?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function SuccessModal({
  isOpen,
  onClose,
  category = 'OPERATION COMPLETE',
  title,
  description,
  referenceNumber,
  referenceLabel = 'Reference',
  nextStep,
  items,
  actionLabel = 'Continue',
  onAction,
  children,
}: SuccessModalProps) {
  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      category={category}
      title={title}
      description={description}
      footer={
        <button
          type="button"
          onClick={handleAction}
          className="px-5 py-2 text-xs font-semibold text-white bg-charcoal-900 hover:bg-charcoal-800 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      }
    >
      <div className="flex items-start gap-3.5 p-3.5 bg-sage-500/10 border border-sage-500/20 rounded-xl text-sage-700">
        <div className="w-6 h-6 rounded-full bg-sage-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Check className="w-3.5 h-3.5 text-sage-700" strokeWidth={2.5} />
        </div>
        <div className="space-y-0.5">
          {referenceNumber && (
            <div className="text-[11px] font-mono font-bold text-charcoal-900">
              {referenceLabel}: {referenceNumber}
            </div>
          )}
          {nextStep && (
            <div className="text-[11px] text-charcoal-600 leading-normal">
              <strong className="text-charcoal-800 font-semibold">Next Step:</strong> {nextStep}
            </div>
          )}
        </div>
      </div>

      {items && items.length > 0 && <InfoBlock items={items} />}
      {children}
    </Modal>
  );
}
