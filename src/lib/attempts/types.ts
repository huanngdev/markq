import type {
  QuizOption,
  QuizSchemaVersion,
  QuizSettings,
  ReviewMode,
  SelectionMode,
} from "@/lib/quizzes/types";

export type AttemptStatus = "in_progress" | "submitted" | "expired";

export type AttemptAnswer = {
  id: string;
  questionId: string;
  topicId: string | null;
  questionOrder: number;
  prompt: string;
  options: QuizOption[];
  selectedOptions: string[];
  correctOptions: string[];
  selectionMode: SelectionMode;
  points: number;
  earnedPoints: number;
  isCorrect: boolean | null;
  isFlagged: boolean;
  explanation: string;
  updatedAt: string;
};

export type Attempt = {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  quizSchemaVersion: QuizSchemaVersion;
  status: AttemptStatus;
  settings: QuizSettings;
  questionOrder: string[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
  passed: boolean | null;
  startedAt: string;
  expiresAt: string | null;
  updatedAt: string;
  submittedAt: string | null;
  version: number;
  answers: AttemptAnswer[];
};

export type AttemptSummary = Omit<Attempt, "userId" | "settings" | "questionOrder" | "answers"> & {
  reviewMode: ReviewMode;
};

export type AttemptReviewAnswer = Omit<AttemptAnswer, "updatedAt">;

export type AttemptReview = AttemptSummary & {
  answers: AttemptReviewAnswer[];
};

export type AttemptWorkspaceAnswer = Pick<
  AttemptAnswer,
  | "questionId"
  | "questionOrder"
  | "prompt"
  | "options"
  | "selectedOptions"
  | "selectionMode"
  | "points"
  | "isFlagged"
>;

export type AttemptWorkspace = Pick<
  Attempt,
  | "id"
  | "quizId"
  | "quizTitle"
  | "status"
  | "settings"
  | "expiresAt"
  | "version"
> & {
  answers: AttemptWorkspaceAnswer[];
};

export type QuizAttemptStat = {
  attemptCount: number;
  latestScore: number;
  bestScore: number;
  latestAttemptId: string;
  inProgressAttemptId: string | null;
  latestReviewAvailable: boolean;
};
