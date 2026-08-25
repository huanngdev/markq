"use client";

import { useState } from "react";
import { z } from "zod";

const documentSchema = z.object({
  sourceFile: z.string(),
  markdown: z.string(),
  summary: z.object({ id: z.string(), title: z.string() }).nullable(),
  published: z.boolean(),
  error: z.string().nullable(),
});
const documentsResponseSchema = z.object({ documents: z.array(documentSchema) });
const errorSchema = z.object({ error: z.string() });

export type ManagedQuizDocument = z.infer<typeof documentSchema>;

export type QuizManagerViewModel = {
  token: string;
  documents: ManagedQuizDocument[];
  selectedFile: string;
  markdown: string;
  isConnected: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string;
  message: string;
};

const newQuizTemplate = `---
schemaVersion: 2
id: new-quiz
title: New Quiz
description: Describe this quiz.
tags: []
published: false
visibility: private
settings:
  timeLimitMinutes: null
  shuffleQuestions: false
  shuffleOptions: false
  navigationMode: free
  allowUnanswered: true
  reviewMode: after-submit
  passingScore: null
  expireBehavior: auto-submit
  scoringMode: exact
  incorrectPenalty: 0
  attemptsAllowed: null
---

## question-1

### Question

Write the question here.

### Options

- [ ] A. First option
- [ ] B. Second option

### Answer

A

### Points

1

### Explanation

Explain why A is correct.
`;

function errorMessage(payload: unknown, fallback: string) {
  const parsed = errorSchema.safeParse(payload);
  return parsed.success ? parsed.data.error : fallback;
}

export function useQuizManager() {
  const [viewModel, setViewModel] = useState<QuizManagerViewModel>({
    token: "",
    documents: [],
    selectedFile: "",
    markdown: "",
    isConnected: false,
    isLoading: false,
    isSaving: false,
    error: "",
    message: "",
  });

  async function connect() {
    const token = viewModel.token.trim();
    if (!token) {
      setViewModel((state) => ({ ...state, error: "Enter the admin token." }));
      return;
    }
    setViewModel((state) => ({ ...state, isLoading: true, error: "", message: "" }));
    try {
      const response = await fetch("/api/admin/quizzes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessage(payload, "Could not load quiz documents."));
      const { documents } = documentsResponseSchema.parse(payload);
      const selected = documents[0];
      setViewModel((state) => ({
        ...state,
        documents,
        selectedFile: selected?.sourceFile ?? "",
        markdown: selected?.markdown ?? "",
        isConnected: true,
        isLoading: false,
      }));
    } catch (error) {
      setViewModel((state) => ({
        ...state,
        isLoading: false,
        error: error instanceof Error ? error.message : "Could not load quiz documents.",
      }));
    }
  }

  function selectDocument(sourceFile: string) {
    const document = viewModel.documents.find((item) => item.sourceFile === sourceFile);
    if (!document) return;
    setViewModel((state) => ({
      ...state,
      selectedFile: document.sourceFile,
      markdown: document.markdown,
      error: "",
      message: "",
    }));
  }

  function createDocument() {
    setViewModel((state) => ({
      ...state,
      selectedFile: "new-quiz.md",
      markdown: newQuizTemplate,
      error: "",
      message: "",
    }));
  }

  async function saveDocument() {
    setViewModel((state) => ({ ...state, isSaving: true, error: "", message: "" }));
    try {
      const response = await fetch("/api/admin/quizzes", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${viewModel.token.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceFile: viewModel.selectedFile,
          markdown: viewModel.markdown,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(errorMessage(payload, "Could not save the quiz document."));
      setViewModel((state) => ({ ...state, isSaving: false, message: "Quiz validated and saved." }));
      await connect();
    } catch (error) {
      setViewModel((state) => ({
        ...state,
        isSaving: false,
        error: error instanceof Error ? error.message : "Could not save the quiz document.",
      }));
    }
  }

  return {
    viewModel,
    commands: {
      setToken: (token: string) => setViewModel((state) => ({ ...state, token })),
      setSelectedFile: (selectedFile: string) => setViewModel((state) => ({ ...state, selectedFile })),
      setMarkdown: (markdown: string) => setViewModel((state) => ({ ...state, markdown })),
      connect,
      selectDocument,
      createDocument,
      saveDocument,
    },
  };
}
