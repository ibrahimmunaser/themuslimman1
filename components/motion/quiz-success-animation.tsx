"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Star } from "lucide-react";

interface QuizSuccessAnimationProps {
  score: number;
  passed: boolean;
  show?: boolean;
}

/**
 * Full-screen overlay that celebrates a quiz pass with a ring + score reveal.
 * Wraps in AnimatePresence so it mounts/unmounts cleanly.
 */
export function QuizSuccessAnimation({ score, passed, show = true }: QuizSuccessAnimationProps) {
  const prefersReduced = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="quiz-success"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: prefersReduced ? 1 : 0.8, opacity: 0, y: prefersReduced ? 0 : 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
            className="relative flex flex-col items-center gap-5 p-10 rounded-3xl bg-surface border border-gold/20 shadow-2xl shadow-black/60 max-w-sm mx-4 text-center"
          >
            {/* Gold ring + icon */}
            <div className="relative">
              {/* Pulsing ring */}
              {!prefersReduced && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-gold/30"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
                />
              )}
              <motion.div
                className={`w-20 h-20 rounded-full flex items-center justify-center border-2 ${
                  passed
                    ? "bg-gold/15 border-gold/40"
                    : "bg-surface-raised border-border"
                }`}
                initial={{ rotate: prefersReduced ? 0 : -30, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.2, type: "spring", stiffness: 200, damping: 18 }}
              >
                {passed
                  ? <Star className="w-9 h-9 text-gold fill-gold/40" />
                  : <Check className="w-9 h-9 text-text-secondary" />}
              </motion.div>
            </div>

            {/* Score */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReduced ? 0 : 0.4, delay: 0.45 }}
            >
              <p className="text-5xl font-bold text-gold mb-1">{score}%</p>
              <p className={`text-sm font-semibold ${passed ? "text-green-400" : "text-text-secondary"}`}>
                {passed ? "Quiz Passed" : "Keep Practising"}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
