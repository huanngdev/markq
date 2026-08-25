import type { KnowledgeSubject, KnowledgeTopic } from "@/lib/knowledge/types";

export type AnalyticsAnswerRecord = {
  attemptId: string;
  quizId: string;
  questionId: string;
  prompt: string;
  topicId: string | null;
  selectedOptions: string[];
  isCorrect: boolean;
};

export type TopicAnalytics = {
  topicId: string;
  subject: KnowledgeSubject;
  title: string;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionCount: number;
  accuracyPercent: number;
  mistakeExamples: string[];
  knowledgeMarkdown: string;
};

export type SubjectAnalytics = {
  subject: KnowledgeSubject;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionCount: number;
  accuracyPercent: number;
  topics: TopicAnalytics[];
};

export type AnalyticsReport = {
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  questionCount: number;
  accuracyPercent: number;
  subjects: Record<KnowledgeSubject, SubjectAnalytics>;
  weakTopics: TopicAnalytics[];
  knowledgeErrors: string[];
};

export type KnowledgeTopicMap = ReadonlyMap<string, KnowledgeTopic>;
export type TopicFallbackMap = ReadonlyMap<string, string>;
