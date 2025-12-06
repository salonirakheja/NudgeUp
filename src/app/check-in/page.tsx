'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/check-in/Header';
import { GreetingSection } from '@/components/check-in/GreetingSection';
import { ProgressCard } from '@/components/check-in/ProgressCard';
import { HabitCard } from '@/components/check-in/HabitCard';
import { FloatingButton } from '@/components/check-in/FloatingButton';
import { AddHabitModal } from '@/components/check-in/AddHabitModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { useCommitments } from '@/contexts/CommitmentsContext';

function CheckInPageContent() {
  const { commitments, addCommitment } = useCommitments();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const completedCount = commitments.filter(c => c.completed).length;
  const totalCommitments = commitments.length;

  const handleAddCommitment = (newCommitment: { name: string; icon: string; duration?: number; frequencyType?: 'daily' | 'weekly'; timesPerWeek?: number }) => {
    addCommitment({
      name: newCommitment.name,
      icon: newCommitment.icon,
      duration: newCommitment.duration,
      frequencyType: newCommitment.frequencyType,
      timesPerWeek: newCommitment.timesPerWeek,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="w-full max-w-[440px] min-h-[956px] relative bg-white mx-auto pb-20">
      {/* Header */}
      <div className="pt-5">
        <Header />
      </div>

      {/* Greeting Section */}
      <div className="px-6 pt-8">
        <GreetingSection userName="Saloni" />
      </div>

      {/* Progress Card */}
      <div className="px-6 pt-3">
        <ProgressCard 
          completed={completedCount} 
          total={totalCommitments}
          commitments={commitments}
        />
      </div>

      {/* Commitments Section */}
      <div className="px-6 pt-6 pb-16 flex flex-col">
        <h2 className="text-neutral-700 text-[18px] font-semibold leading-[24px]" style={{ fontFamily: 'Inter, sans-serif', marginBottom: '20px' }}>
          Your Daily Commitments
        </h2>
        
        <div className="flex flex-col" style={{ gap: '10px' }}>
          {commitments.map((commitment) => (
            <HabitCard 
              key={commitment.id} 
              habit={commitment}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingButton onClick={() => setIsModalOpen(true)} />

      {/* Add Commitment Modal */}
      <AddHabitModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddCommitment}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function CheckInPage() {
  return (
    <ProtectedRoute>
      <CheckInPageContent />
    </ProtectedRoute>
  );
}

