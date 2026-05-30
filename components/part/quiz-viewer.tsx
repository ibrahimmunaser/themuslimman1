"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from "lucide-react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import type { Quiz, QuizQuestion } from "@/lib/types";
import { trackQuizCompleted } from "@/app/actions/progress";
import { AnimatedProgressBar } from "@/components/motion";

interface QuizViewerProps {
  quiz: Quiz;
  partNumber?: number;
  /** When true (free preview), skip progress tracking — user is not logged in */
  previewMode?: boolean;
}

type AnswerState = "unanswered" | "correct" | "wrong";

interface QuestionResult {
  question: QuizQuestion;
  chosen: string;
  correct: boolean;
}

function QuestionCard({
  question,
  index,
  total,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (chosen: string, correct: boolean) => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const answered = chosen !== null;

  const handleSelect = (option: string) => {
    if (answered) return;
    setChosen(option);
    onAnswer(option, option === question.correct_answer);
  };

  const getOptionState = (option: string): AnswerState => {
    if (!answered) return "unanswered";
    if (option === question.correct_answer) return "correct";
    if (option === chosen) return "wrong";
    return "unanswered";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-amber-400">
          Question {index + 1} of {total}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                "h-1.5 rounded-full transition-all",
                i < index ? "bg-amber-500/30 w-3" :
                i === index ? "bg-amber-500 w-6" :
                "bg-zinc-800 w-3"
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/60 border border-zinc-800">
        <p className="text-lg font-semibold text-white leading-relaxed">
          {question.question}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, i) => {
          const state = getOptionState(option);
          return (
            <button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={answered}
              role="radio"
              aria-checked={chosen === option}
              className={clsx(
                "group relative overflow-hidden flex items-center gap-4 w-full text-left px-5 py-4 rounded-xl border transition-all text-base font-medium",
                !answered && "hover:border-amber-500/40 hover:bg-amber-500/5 cursor-pointer hover:translate-x-1",
                answered && "cursor-default",
                state === "unanswered" && "border-zinc-800 bg-zinc-900/50 text-zinc-300",
                state === "correct" && "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/10",
                state === "wrong" && "border-red-500/50 bg-red-500/10 text-red-300",
              )}
            >
              {/* Subtle glow on hover */}
              {!answered && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
              
              <span className={clsx(
                "relative flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold transition-all",
                state === "unanswered" && "border-zinc-700 text-zinc-500 bg-zinc-900/50 group-hover:border-amber-500/40 group-hover:text-amber-400 group-hover:bg-amber-500/5",
                state === "correct" && "border-emerald-500/60 text-emerald-400 bg-emerald-500/10 scale-110",
                state === "wrong" && "border-red-500/60 text-red-400 bg-red-500/10",
              )}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="relative flex-1 leading-snug">{option}</span>
              {state === "correct" && <CheckCircle2 className="relative w-5 h-5 flex-shrink-0 text-emerald-400" />}
              {state === "wrong" && <XCircle className="relative w-5 h-5 flex-shrink-0 text-red-400" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {answered && (
        <div className={clsx(
          "rounded-xl border px-5 py-4 text-base leading-relaxed",
          chosen === question.correct_answer
            ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-200"
            : "border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-200"
        )}>
          <p className="font-semibold mb-2 text-lg">
            {chosen === question.correct_answer ? "✓ Correct!" : `✗ Correct answer: ${question.correct_answer}`}
          </p>
          <p className="text-zinc-300">{question.explanation}</p>
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {question.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreScreen({
  results,
  total,
  onRetry,
  partNumber,
  previewMode,
}: {
  results: QuestionResult[];
  total: number;
  onRetry: () => void;
  partNumber?: number;
  previewMode?: boolean;
}) {
  const prefersReduced = useReducedMotion();
  const score = results.filter((r) => r.correct).length;
  const pct   = Math.round((score / total) * 100);
  const passed = pct >= 80;

  useEffect(() => {
    if (partNumber && !previewMode) {
      trackQuizCompleted(partNumber, pct).catch(() => {});
      // Immediately update the header progress badges without waiting for a reload.
      window.dispatchEvent(
        new CustomEvent("seerah:progressUpdate", {
          detail: { quizPassed: passed, quizBestScore: pct },
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grade =
    pct === 100 ? { label: "Perfect Score!", color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10" } :
    pct >= 80   ? { label: "Excellent!", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" } :
    pct >= 60   ? { label: "Good Job!", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10" } :
    pct >= 40   ? { label: "Keep Practicing", color: "text-amber-400", bg: "from-amber-500/20 to-amber-600/10" } :
                  { label: "Study More", color: "text-red-400", bg: "from-red-500/20 to-red-600/10" };

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Completion banner — passing scores */}
      {passed && (
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] }}
          className="w-full max-w-md px-4 py-3.5 rounded-xl bg-gradient-to-r from-gold/8 to-green-500/5 border border-gold/25 flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gold leading-snug">
              {pct === 100 ? "Perfect score!" : "Quiz passed"}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Your understanding of this lesson has been confirmed. Keep going.
            </p>
          </div>
        </motion.div>
      )}

      {/* Trophy Card */}
      <motion.div
        initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.9, y: prefersReduced ? 0 : 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.55, ease: [0, 0, 0.2, 1], delay: 0.1 }}
        className={`w-full max-w-md p-8 rounded-2xl bg-gradient-to-br ${grade.bg} border border-zinc-800 shadow-2xl`}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ rotate: prefersReduced ? 0 : -15, scale: prefersReduced ? 1 : 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: prefersReduced ? 0 : 0.5, delay: 0.25, type: "spring", stiffness: 200, damping: 16 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20"
          >
            <Trophy className="w-12 h-12 text-amber-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: prefersReduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="text-center"
          >
            <p className={clsx("text-5xl font-bold tabular-nums mb-2", grade.color)}>{pct}%</p>
            <p className={clsx("text-lg font-semibold mb-1", grade.color)}>{grade.label}</p>
            <p className="text-base text-zinc-400">{score} out of {total} correct</p>
          </motion.div>
          {/* Animated score bar */}
          <AnimatedProgressBar
            percent={pct}
            height={6}
            fillClassName={passed ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-amber-500 to-amber-400"}
            trackClassName="bg-zinc-800"
            className="w-full"
            delay={0.5}
          />
        </div>
      </motion.div>

      {/* Per-question summary */}
      <div className="w-full flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Question Review</h3>
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: prefersReduced ? 0 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i + 0.4, ease: [0, 0, 0.2, 1] }}
            className={clsx(
              "group relative overflow-hidden flex items-start gap-4 px-5 py-4 rounded-xl border transition-all",
              r.correct
                ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 to-emerald-500/4 hover:border-emerald-500/40"
                : "border-red-500/30 bg-gradient-to-br from-red-500/8 to-red-500/4 hover:border-red-500/40"
            )}
          >
            {/* Subtle glow effect */}
            <div className={clsx(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
              r.correct ? "bg-emerald-500/5" : "bg-red-500/5"
            )} />
            
            {r.correct
              ? <CheckCircle2 className="relative w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <XCircle className="relative w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
            <div className="relative flex-1 min-w-0">
              <p className="text-base text-white leading-relaxed font-medium mb-2">{r.question.question}</p>
              {!r.correct && (
                <div className="flex flex-col gap-1 text-sm">
                  <p className="text-red-300">
                    Your answer: <span className="font-semibold">{r.chosen}</span>
                  </p>
                  <p className="text-emerald-300">
                    Correct answer: <span className="font-semibold">{r.question.correct_answer}</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Retry */}
      <motion.button
        onClick={onRetry}
        whileHover={prefersReduced ? undefined : { scale: 1.04 }}
        whileTap={prefersReduced ? undefined : { scale: 0.97 }}
        initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.5 + results.length * 0.05 }}
        className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/30 text-black text-base font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
      >
        <RotateCcw className="w-5 h-5" />
        Retake Quiz
      </motion.button>
    </div>
  );
}

export function QuizViewer({ quiz, partNumber, previewMode }: QuizViewerProps) {
  const [current, setCurrent] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [pendingResult, setPendingResult] = useState<QuestionResult | null>(null);
  const [done, setDone] = useState(false);

  const handleAnswer = (chosen: string, correct: boolean) => {
    setPendingResult({ question: quiz.questions[current], chosen, correct });
  };

  const handleNext = () => {
    if (!pendingResult) return;
    const updated = [...results, pendingResult];
    setPendingResult(null);
    if (current + 1 >= quiz.questions.length) {
      setResults(updated);
      setDone(true);
    } else {
      setResults(updated);
      setCurrent((c) => c + 1);
    }
  };

  const handleRetry = () => {
    setCurrent(0);
    setResults([]);
    setPendingResult(null);
    setDone(false);
  };

  if (done) {
    return (
      <ScoreScreen
        results={results}
        total={quiz.questions.length}
        onRetry={handleRetry}
        partNumber={partNumber}
        previewMode={previewMode}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
        >
          <QuestionCard
            question={quiz.questions[current]}
            index={current}
            total={quiz.questions.length}
            onAnswer={handleAnswer}
          />
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {pendingResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="flex justify-end"
          >
            <motion.button
              onClick={handleNext}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/30 text-black text-base font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
            >
              {current + 1 >= quiz.questions.length ? "See Results" : "Next Question"}
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
