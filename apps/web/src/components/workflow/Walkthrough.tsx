"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Play } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export interface WalkthroughStep {
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  route?: string;
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  isOpen: boolean;
  onClose: () => void;
}

export const Walkthrough: React.FC<WalkthroughProps> = ({ steps, isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    const step = steps[currentStepIndex];

    // Handle cross-page navigation
    if (step.route && pathname !== step.route) {
      router.push(step.route);
      // Don't calculate rect yet, wait for navigation
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        // Scroll into view gently if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    const interval = setInterval(updateRect, 500); // Polling for layout shifts
    return () => {
      window.removeEventListener('resize', updateRect);
      clearInterval(interval);
    };
  }, [isOpen, currentStepIndex, steps]);

  if (!isOpen) return null;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Determine Dialog Style/Position
  let dialogStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 9999,
  };

  if (targetRect) {
    const spacing = 16;
    const position = currentStep.position || 'bottom';

    if (position === 'bottom') {
      dialogStyle.top = targetRect.bottom + spacing;
      dialogStyle.left = targetRect.left;
    } else if (position === 'top') {
      dialogStyle.bottom = window.innerHeight - targetRect.top + spacing;
      dialogStyle.left = targetRect.left;
    } else if (position === 'right') {
      dialogStyle.top = targetRect.top;
      dialogStyle.left = targetRect.right + spacing;
    } else if (position === 'left') {
      dialogStyle.top = targetRect.top;
      dialogStyle.right = window.innerWidth - targetRect.left + spacing;
    }
  } else {
    // Center if element not found
    dialogStyle.top = '50%';
    dialogStyle.left = '50%';
    dialogStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] pointer-events-none"
          >
            {targetRect ? (
              <>
                {/* TOP MASK */}
                <motion.div
                  className="absolute top-0 left-0 right-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto"
                  animate={{ height: Math.max(0, targetRect.top - 8) }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={onClose}
                />
                {/* BOTTOM MASK */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto"
                  animate={{ top: targetRect.bottom + 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={onClose}
                />
                {/* LEFT MASK */}
                <motion.div
                  className="absolute left-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto"
                  animate={{
                    top: Math.max(0, targetRect.top - 8),
                    bottom: window.innerHeight - (targetRect.bottom + 8),
                    width: Math.max(0, targetRect.left - 8)
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={onClose}
                />
                {/* RIGHT MASK */}
                <motion.div
                  className="absolute right-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto"
                  animate={{
                    top: Math.max(0, targetRect.top - 8),
                    bottom: window.innerHeight - (targetRect.bottom + 8),
                    left: targetRect.right + 8
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  onClick={onClose}
                />

                {/* HIGHLIGHT RING (Empty interior, clicks pass through) */}
                <motion.div
                  layout
                  initial={false}
                  animate={{
                    x: targetRect.left - 8,
                    y: targetRect.top - 8,
                    width: targetRect.width + 16,
                    height: targetRect.height + 16,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute rounded-xl border-2 border-[#3D5CFF] shadow-[0_0_20px_rgba(61,92,255,0.4)] pointer-events-none"
                />
              </>
            ) : (
              <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] pointer-events-auto"
                onClick={onClose}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Dialog */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={dialogStyle}
          className="w-80 bg-[#151C2F] border border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#0F1423]">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3D5CFF]/20 text-[#3D5CFF] text-xs font-bold">
                {currentStepIndex + 1}
              </div>
              <h3 className="font-semibold text-white tracking-wide">{currentStep.title}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 text-gray-300 text-sm leading-relaxed">
            {currentStep.content}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#0F1423] border-t border-gray-800">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === currentStepIndex ? 'bg-[#3D5CFF]' : 'bg-gray-700'
                    }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 bg-[#3D5CFF] hover:bg-[#4d6aff] text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
