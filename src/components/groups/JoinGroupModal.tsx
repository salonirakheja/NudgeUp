'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (codeOrLink: string) => void;
}

export const JoinGroupModal = ({ isOpen, onClose, onJoin }: JoinGroupModalProps) => {
  const [codeOrLink, setCodeOrLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeOrLink.trim()) {
      alert('Please enter a group code or link');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Add actual API call to join group
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      onJoin(codeOrLink.trim());
      setCodeOrLink('');
      onClose();
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Failed to join group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-neutral-700 text-xl font-medium leading-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Join a Group
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 5L5 15M5 5L15 15" stroke="#4A5568" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-neutral-700 text-base font-normal leading-6 mb-2 block" style={{ fontFamily: 'Inter, sans-serif' }}>
              Enter group code or link
            </label>
            <Input
              type="text"
              placeholder="e.g., ABC123 or https://nudgeup.app/join/ABC123"
              value={codeOrLink}
              onChange={(e) => setCodeOrLink(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isLoading || !codeOrLink.trim()}
            >
              {isLoading ? 'Joining...' : 'Join Group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

