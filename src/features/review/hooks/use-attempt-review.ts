"use client";

import { useEffect, useEffectEvent, useState } from "react";

import type { AttemptReview } from "@/lib/attempts/types";

export type AttemptReviewViewModel = {
  currentIndex: number;
  isMobileOpen: boolean;
};

export type AttemptReviewCommands = {
  changeQuestion(index: number): void;
  setMobileOpen(isOpen: boolean): void;
};

export function useAttemptReview(attempt: AttemptReview) {
  const [viewModel, setViewModel] = useState<AttemptReviewViewModel>({
    currentIndex: 0,
    isMobileOpen: false,
  });

  function changeQuestion(index: number) {
    if (index < 0 || index >= attempt.answers.length) return;
    setViewModel({ currentIndex: index, isMobileOpen: false });
  }

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.isContentEditable || target.matches("input, textarea, select")
    );
    if (event.defaultPrevented || isTyping || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      changeQuestion(viewModel.currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      changeQuestion(viewModel.currentIndex + 1);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const commands: AttemptReviewCommands = {
    changeQuestion,
    setMobileOpen: (isMobileOpen) => setViewModel((state) => ({ ...state, isMobileOpen })),
  };
  return { viewModel, commands };
}
