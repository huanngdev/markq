export type QuizOption = {
  id: string;
  content: string;
};

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOption: string;
  explanation: string;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  published: boolean;
  questions: QuizQuestion[];
  sourceFile: string;
};

export type PublicQuizQuestion = Omit<QuizQuestion, "correctOption" | "explanation">;

export type PublicQuiz = Omit<Quiz, "questions" | "sourceFile" | "published"> & {
  questions: PublicQuizQuestion[];
};

export type QuizSummary = Pick<Quiz, "id" | "title" | "description" | "tags"> & {
  questionCount: number;
};

export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    tags: quiz.tags,
    questions: quiz.questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
  };
}

export function toQuizSummary(quiz: Quiz): QuizSummary {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    tags: quiz.tags,
    questionCount: quiz.questions.length,
  };
}
