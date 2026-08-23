import type { Quiz } from "@/lib/quizzes/types";

export type SubmittedAnswers = Record<string, string | undefined>;

export function gradeQuiz(quiz: Quiz, submittedAnswers: SubmittedAnswers) {
  const validQuestionIds = new Set(quiz.questions.map((question) => question.id));
  const unknownQuestionId = Object.keys(submittedAnswers).find((id) => !validQuestionIds.has(id));
  if (unknownQuestionId) {
    throw new Error(`Question does not exist: ${unknownQuestionId}`);
  }

  const answers = quiz.questions.map((question, questionOrder) => {
    const selectedOption = submittedAnswers[question.id]?.toUpperCase();
    if (selectedOption && !question.options.some((option) => option.id === selectedOption)) {
      throw new Error(`Invalid option for question ${question.id}: ${selectedOption}`);
    }

    return {
      question,
      questionOrder,
      selectedOption: selectedOption ?? null,
      isCorrect: selectedOption === question.correctOption,
    };
  });

  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const unansweredCount = answers.filter((answer) => answer.selectedOption === null).length;
  const incorrectCount = answers.length - correctCount - unansweredCount;

  return {
    answers,
    correctCount,
    incorrectCount,
    unansweredCount,
    totalQuestions: answers.length,
    scorePercent: Math.round((correctCount / answers.length) * 100),
  };
}
