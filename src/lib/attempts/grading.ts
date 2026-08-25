import type { Quiz, QuizQuestion } from "@/lib/quizzes/types";

export type SubmittedSelection = string | readonly string[] | undefined;
export type SubmittedAnswers = Readonly<Record<string, SubmittedSelection>>;

export type GradedAnswer = {
  question: QuizQuestion;
  questionOrder: number;
  selectedOptions: string[];
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
};

export type GradeResult = {
  answers: GradedAnswer[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  totalQuestions: number;
  earnedPoints: number;
  totalPoints: number;
  scorePercent: number;
};

function normalizeSelection(selection: SubmittedSelection, question: QuizQuestion) {
  const values = selection === undefined ? [] : Array.isArray(selection) ? selection : [selection];
  const normalized = values.map((value) => value.trim().toUpperCase());

  if (normalized.some((value) => value.length === 0)) {
    throw new Error(`Empty option for question ${question.id}`);
  }
  if (new Set(normalized).size !== normalized.length) {
    throw new Error(`Duplicate option for question ${question.id}`);
  }
  if (question.selectionMode === "single" && normalized.length > 1) {
    throw new Error(`Question ${question.id} only accepts one option`);
  }

  const validOptionIds = new Set(question.options.map((option) => option.id));
  const invalidOption = normalized.find((option) => !validOptionIds.has(option));
  if (invalidOption) {
    throw new Error(`Invalid option for question ${question.id}: ${invalidOption}`);
  }

  return normalized.toSorted();
}

function setsAreEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function partialPoints(
  question: QuizQuestion,
  selectedOptions: readonly string[],
  incorrectPenalty: number,
) {
  if (selectedOptions.length === 0) return 0;

  const correctOptions = new Set(question.correctOptions);
  const correctSelections = selectedOptions.filter((option) => correctOptions.has(option)).length;
  const incorrectSelections = selectedOptions.length - correctSelections;
  const incorrectOptionCount = question.options.length - question.correctOptions.length;
  const correctRatio = correctSelections / question.correctOptions.length;
  const incorrectRatio = incorrectOptionCount === 0 ? 0 : incorrectSelections / incorrectOptionCount;
  const rawPoints = question.points * (correctRatio - incorrectRatio);

  return Math.max(-question.points, rawPoints - incorrectSelections * incorrectPenalty);
}

function gradeAnswer(
  question: QuizQuestion,
  questionOrder: number,
  selection: SubmittedSelection,
  quiz: Quiz,
): GradedAnswer {
  const selectedOptions = normalizeSelection(selection, question);
  const correctOptions = question.correctOptions.toSorted();
  const isCorrect = setsAreEqual(selectedOptions, correctOptions);
  const earnedPoints = quiz.settings.scoringMode === "partial"
    ? partialPoints(question, selectedOptions, quiz.settings.incorrectPenalty)
    : isCorrect
      ? question.points
      : selectedOptions.length > 0
        ? -quiz.settings.incorrectPenalty
        : 0;

  return {
    question,
    questionOrder,
    selectedOptions,
    isCorrect,
    earnedPoints,
    maxPoints: question.points,
  };
}

export function gradeQuiz(quiz: Quiz, submittedAnswers: SubmittedAnswers): GradeResult {
  const validQuestionIds = new Set(quiz.questions.map((question) => question.id));
  const unknownQuestionId = Object.keys(submittedAnswers).find((id) => !validQuestionIds.has(id));
  if (unknownQuestionId) {
    throw new Error(`Question does not exist: ${unknownQuestionId}`);
  }

  const answers = quiz.questions.map((question, questionOrder) =>
    gradeAnswer(question, questionOrder, submittedAnswers[question.id], quiz));
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const unansweredCount = answers.filter((answer) => answer.selectedOptions.length === 0).length;
  const incorrectCount = answers.length - correctCount - unansweredCount;
  const totalPoints = answers.reduce((total, answer) => total + answer.maxPoints, 0);
  const rawEarnedPoints = answers.reduce((total, answer) => total + answer.earnedPoints, 0);
  const earnedPoints = Math.max(0, Math.min(totalPoints, rawEarnedPoints));

  return {
    answers,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions: answers.length,
    earnedPoints,
    totalPoints,
    scorePercent: totalPoints === 0 ? 0 : Math.round((earnedPoints / totalPoints) * 100),
  };
}
