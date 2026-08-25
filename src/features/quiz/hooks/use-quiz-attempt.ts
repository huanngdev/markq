"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

import {
  apiErrorSchema,
  attemptWorkspaceResponseSchema,
  submitAttemptResponseSchema,
} from "@/lib/attempts/contracts";
import type { AttemptWorkspace } from "@/lib/attempts/types";

export type PendingQuizAction =
  | { type: "home" }
  | { type: "submit"; unanswered: number };

export type QuizAttemptViewModel = {
  attempt: AttemptWorkspace | null;
  currentIndex: number;
  remainingSeconds: number | null;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  isMobileOpen: boolean;
  error: string;
  pendingAction: PendingQuizAction | null;
};

export type QuizAttemptCommands = {
  goToQuestion(index: number): void;
  selectOption(optionId: string): void;
  toggleFlag(): void;
  requestSubmit(): void;
  requestHome(): void;
  confirmPendingAction(): void;
  dismissPendingAction(): void;
  setMobileOpen(isOpen: boolean): void;
  retry(): void;
  canOpenQuestion(index: number): boolean;
};

type PendingUpdate = {
  questionId: string;
  selectedOptions?: string[];
  isFlagged?: boolean;
};

function responseError(payload: unknown, fallback: string) {
  const parsed = apiErrorSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : fallback;
}

function secondsUntil(expiresAt: string | null) {
  if (expiresAt === null) return null;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1_000));
}

function mergeUpdate(current: PendingUpdate | undefined, next: PendingUpdate): PendingUpdate {
  return {
    questionId: next.questionId,
    selectedOptions: next.selectedOptions ?? current?.selectedOptions,
    isFlagged: next.isFlagged ?? current?.isFlagged,
  };
}

export function useQuizAttempt(quizId: string) {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<QuizAttemptViewModel>({
    attempt: null,
    currentIndex: 0,
    remainingSeconds: null,
    isLoading: true,
    isSaving: false,
    isSubmitting: false,
    isMobileOpen: false,
    error: "",
    pendingAction: null,
  });
  const attemptRef = useRef<AttemptWorkspace | null>(null);
  const pendingUpdatesRef = useRef(new Map<string, PendingUpdate>());
  const saveTimerRef = useRef<number | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const isSubmittingRef = useRef(false);

  function updateAttempt(updater: (attempt: AttemptWorkspace) => AttemptWorkspace) {
    const current = attemptRef.current;
    if (!current) return;
    const next = updater(current);
    attemptRef.current = next;
    setViewModel((state) => ({ ...state, attempt: next }));
  }

  async function flushProgress() {
    const attempt = attemptRef.current;
    const updates = [...pendingUpdatesRef.current.values()];
    if (!attempt || updates.length === 0 || attempt.status !== "in_progress") {
      return saveQueueRef.current;
    }

    pendingUpdatesRef.current.clear();
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    setViewModel((state) => ({ ...state, isSaving: true }));

    const operation = saveQueueRef.current.then(async () => {
      const current = attemptRef.current;
      if (!current || current.status !== "in_progress") return;
      const response = await fetch(`/api/attempts/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: current.version, updates }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(payload, "Could not save your progress."));
      const parsed = attemptWorkspaceResponseSchema.parse(payload);
      updateAttempt((local) => ({
        ...local,
        status: parsed.attempt.status,
        version: parsed.attempt.version,
      }));
    });
    saveQueueRef.current = operation.catch((error: unknown) => {
      setViewModel((state) => ({
        ...state,
        error: error instanceof Error ? error.message : "Could not save your progress.",
      }));
    }).finally(() => {
      setViewModel((state) => ({ ...state, isSaving: false }));
    });

    return operation;
  }

  function scheduleUpdate(update: PendingUpdate) {
    const current = pendingUpdatesRef.current.get(update.questionId);
    pendingUpdatesRef.current.set(update.questionId, mergeUpdate(current, update));
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      void flushProgress().catch(() => undefined);
    }, 450);
  }

  const startAttempt = useCallback(async () => {
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(payload, "Could not start the quiz."));
      const { attempt } = attemptWorkspaceResponseSchema.parse(payload);
      attemptRef.current = attempt;
      setViewModel((state) => ({
        ...state,
        attempt,
        remainingSeconds: secondsUntil(attempt.expiresAt),
        isLoading: false,
      }));
    } catch (error) {
      setViewModel((state) => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not start the quiz.",
      }));
    }
  }, [quizId]);

  useEffect(() => {
    void startAttempt();
  }, [startAttempt]);

  async function submitNow() {
    const attempt = attemptRef.current;
    if (!attempt || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setViewModel((state) => ({ ...state, isSubmitting: true, error: "" }));
    try {
      await flushProgress();
      const response = await fetch(`/api/attempts/${attempt.id}/submit`, { method: "POST" });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(responseError(payload, "Could not submit the quiz."));
      const result = submitAttemptResponseSchema.parse(payload);
      if (attempt.settings.reviewMode === "never") router.push("/attempts");
      else router.push(`/attempts/${result.attemptId}`);
    } catch (error) {
      isSubmittingRef.current = false;
      setViewModel((state) => ({
        ...state,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Could not submit the quiz.",
      }));
    }
  }

  const handleTimerExpired = useEffectEvent(() => {
    if (!isSubmittingRef.current) void submitNow();
  });

  const activeExpiresAt = viewModel.attempt?.expiresAt ?? null;
  const activeStatus = viewModel.attempt?.status ?? null;

  useEffect(() => {
    if (!activeExpiresAt || activeStatus !== "in_progress") return;
    const timer = window.setInterval(() => {
      const remainingSeconds = secondsUntil(activeExpiresAt);
      setViewModel((state) => ({ ...state, remainingSeconds }));
      if (remainingSeconds === 0) {
        window.clearInterval(timer);
        handleTimerExpired();
      }
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [activeExpiresAt, activeStatus]);

  function canOpenQuestion(index: number) {
    const attempt = attemptRef.current;
    if (!attempt || index < 0 || index >= attempt.answers.length) return false;
    if (attempt.settings.navigationMode === "free") return true;
    return !attempt.answers.slice(0, index).some((answer) => answer.selectedOptions.length === 0);
  }

  function goToQuestion(index: number) {
    if (!canOpenQuestion(index)) return;
    setViewModel((state) => ({ ...state, currentIndex: index, isMobileOpen: false }));
  }

  function selectOption(optionId: string) {
    const attempt = attemptRef.current;
    if (!attempt || attempt.status !== "in_progress") return;
    const answer = attempt.answers[viewModel.currentIndex];
    if (!answer) return;
    const selectedOptions = answer.selectionMode === "single"
      ? [optionId]
      : answer.selectedOptions.includes(optionId)
        ? answer.selectedOptions.filter((id) => id !== optionId)
        : [...answer.selectedOptions, optionId];
    updateAttempt((current) => ({
      ...current,
      answers: current.answers.map((item, index) =>
        index === viewModel.currentIndex ? { ...item, selectedOptions } : item),
    }));
    scheduleUpdate({ questionId: answer.questionId, selectedOptions });
  }

  function toggleFlag() {
    const attempt = attemptRef.current;
    const answer = attempt?.answers[viewModel.currentIndex];
    if (!attempt || !answer || attempt.status !== "in_progress") return;
    const isFlagged = !answer.isFlagged;
    updateAttempt((current) => ({
      ...current,
      answers: current.answers.map((item, index) =>
        index === viewModel.currentIndex ? { ...item, isFlagged } : item),
    }));
    scheduleUpdate({ questionId: answer.questionId, isFlagged });
  }

  function requestSubmit() {
    const attempt = attemptRef.current;
    if (!attempt) return;
    const unanswered = attempt.answers.filter((answer) => answer.selectedOptions.length === 0).length;
    if (unanswered > 0) {
      if (!attempt.settings.allowUnanswered) {
        setViewModel((state) => ({ ...state, error: "Answer every question before submitting." }));
        return;
      }
      setViewModel((state) => ({ ...state, pendingAction: { type: "submit", unanswered } }));
      return;
    }
    void submitNow();
  }

  function requestHome() {
    const hasAnswers = attemptRef.current?.answers.some((answer) => answer.selectedOptions.length > 0);
    if (hasAnswers) {
      setViewModel((state) => ({ ...state, pendingAction: { type: "home" } }));
    } else {
      void leaveHome();
    }
  }

  async function leaveHome() {
    try {
      await flushProgress();
      router.push("/");
    } catch {
      setViewModel((state) => ({ ...state, pendingAction: null }));
    }
  }

  function confirmPendingAction() {
    const action = viewModel.pendingAction;
    setViewModel((state) => ({ ...state, pendingAction: null }));
    if (action?.type === "home") void leaveHome();
    else if (action?.type === "submit") void submitNow();
  }

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement && (
      target.isContentEditable || target.matches("input:not([type='radio']):not([type='checkbox']), textarea, select")
    );
    if (event.defaultPrevented || isTyping || viewModel.pendingAction || viewModel.isSubmitting) return;
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      requestSubmit();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToQuestion(viewModel.currentIndex - 1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToQuestion(viewModel.currentIndex + 1);
      return;
    }
    if (event.key.toLowerCase() === "f") {
      event.preventDefault();
      toggleFlag();
      return;
    }

    const answer = attemptRef.current?.answers[viewModel.currentIndex];
    if (!answer) return;
    const key = event.key.toUpperCase();
    const numericIndex = /^[1-9]$/.test(key) ? Number(key) - 1 : -1;
    const option = answer.options.find((item) => item.id === key) ?? answer.options[numericIndex];
    if (option) {
      event.preventDefault();
      selectOption(option.id);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingUpdatesRef.current.size === 0 && !viewModel.isSaving) return;
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [viewModel.isSaving]);

  const commands: QuizAttemptCommands = {
    goToQuestion,
    selectOption,
    toggleFlag,
    requestSubmit,
    requestHome,
    confirmPendingAction,
    dismissPendingAction: () => setViewModel((state) => ({ ...state, pendingAction: null })),
    setMobileOpen: (isMobileOpen) => setViewModel((state) => ({ ...state, isMobileOpen })),
    retry: () => {
      setViewModel((state) => ({ ...state, isLoading: true, error: "" }));
      void startAttempt();
    },
    canOpenQuestion,
  };

  return {
    viewModel,
    commands,
  };
}
