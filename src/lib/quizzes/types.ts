export const currentQuizSchemaVersion = 2 as const;

export type QuizSchemaVersion = 1 | typeof currentQuizSchemaVersion;
export type SelectionMode = "single" | "multiple";
export type NavigationMode = "free" | "sequential";
export type ReviewMode = "after-submit" | "never";
export type ExpireBehavior = "auto-submit" | "mark-expired";
export type ScoringMode = "exact" | "partial";
export type QuizVisibility = "public" | "unlisted" | "private";

export type QuizSettings = {
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  navigationMode: NavigationMode;
  allowUnanswered: boolean;
  reviewMode: ReviewMode;
  passingScore: number | null;
  expireBehavior: ExpireBehavior;
  scoringMode: ScoringMode;
  incorrectPenalty: number;
  attemptsAllowed: number | null;
};

export const defaultQuizSettings: QuizSettings = {
  timeLimitMinutes: null,
  shuffleQuestions: false,
  shuffleOptions: false,
  navigationMode: "free",
  allowUnanswered: true,
  reviewMode: "after-submit",
  passingScore: null,
  expireBehavior: "auto-submit",
  scoringMode: "exact",
  incorrectPenalty: 0,
  attemptsAllowed: null,
};

export type QuizOption = {
  id: string;
  content: string;
};

export type QuizQuestion = {
  id: string;
  topicId: string | null;
  prompt: string;
  options: QuizOption[];
  correctOptions: string[];
  selectionMode: SelectionMode;
  points: number;
  explanation: string;
};

export type Quiz = {
  schemaVersion: QuizSchemaVersion;
  id: string;
  title: string;
  description: string;
  tags: string[];
  published: boolean;
  visibility: QuizVisibility;
  settings: QuizSettings;
  questions: QuizQuestion[];
  sourceFile: string;
};

export type PublicQuizQuestion = Omit<QuizQuestion, "correctOptions" | "explanation" | "topicId">;

export type PublicQuiz = Omit<Quiz, "questions" | "sourceFile" | "published"> & {
  questions: PublicQuizQuestion[];
};

export type QuizSummary = Pick<
  Quiz,
  "id" | "title" | "description" | "tags" | "visibility" | "settings"
> & {
  questionCount: number;
  totalPoints: number;
  multipleChoiceCount: number;
};

export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    schemaVersion: quiz.schemaVersion,
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    tags: quiz.tags,
    visibility: quiz.visibility,
    settings: quiz.settings,
    questions: quiz.questions.map(({ id, prompt, options, selectionMode, points }) => ({
      id,
      prompt,
      options,
      selectionMode,
      points,
    })),
  };
}

export function toQuizSummary(quiz: Quiz): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    tags: quiz.tags,
    visibility: quiz.visibility,
    settings: quiz.settings,
    questionCount: quiz.questions.length,
    totalPoints: quiz.questions.reduce((total, question) => total + question.points, 0),
    multipleChoiceCount: quiz.questions.filter((question) => question.selectionMode === "multiple").length,
  };
}
