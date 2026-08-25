import type { KnowledgeSubject } from "@/lib/knowledge/types";

import type {
  AnalyticsAnswerRecord,
  AnalyticsReport,
  KnowledgeTopicMap,
  SubjectAnalytics,
  TopicAnalytics,
  TopicFallbackMap,
} from "./types";

type MutableTopic = Omit<TopicAnalytics, "accuracyPercent"> & {
  attemptIds: Set<string>;
};

function percentage(correct: number, total: number) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function emptySubject(subject: KnowledgeSubject): SubjectAnalytics {
  return {
    subject,
    attemptCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 0,
    questionCount: 0,
    accuracyPercent: 0,
    topics: [],
  };
}

function compareWeakness(left: TopicAnalytics, right: TopicAnalytics) {
  if (right.incorrectCount !== left.incorrectCount) {
    return right.incorrectCount - left.incorrectCount;
  }
  if (left.accuracyPercent !== right.accuracyPercent) {
    return left.accuracyPercent - right.accuracyPercent;
  }
  return left.title.localeCompare(right.title, "vi");
}

export function buildAnalyticsReport(
  records: AnalyticsAnswerRecord[],
  knowledgeTopics: KnowledgeTopicMap,
  fallbackTopicIds: TopicFallbackMap,
  knowledgeErrors: string[] = [],
): AnalyticsReport {
  const topics = new Map<string, MutableTopic>();

  for (const record of records) {
    const topicId = record.topicId ?? fallbackTopicIds.get(`${record.quizId}:${record.questionId}`);
    if (!topicId) continue;
    const knowledge = knowledgeTopics.get(topicId);
    if (!knowledge) continue;

    let topic = topics.get(topicId);
    if (!topic) {
      topic = {
        topicId,
        subject: knowledge.subject,
        title: knowledge.title,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        questionCount: 0,
        mistakeExamples: [],
        knowledgeMarkdown: knowledge.content,
        attemptIds: new Set(),
      };
      topics.set(topicId, topic);
    }

    topic.questionCount += 1;
    topic.attemptIds.add(record.attemptId);
    if (record.selectedOptions.length === 0) {
      topic.unansweredCount += 1;
    } else if (record.isCorrect) {
      topic.correctCount += 1;
    } else {
      topic.incorrectCount += 1;
      if (!topic.mistakeExamples.includes(record.prompt) && topic.mistakeExamples.length < 3) {
        topic.mistakeExamples.push(record.prompt);
      }
    }
  }

  const finalizedTopics = [...topics.values()].map((topic) => ({
    topicId: topic.topicId,
    subject: topic.subject,
    title: topic.title,
    correctCount: topic.correctCount,
    incorrectCount: topic.incorrectCount,
    unansweredCount: topic.unansweredCount,
    questionCount: topic.questionCount,
    accuracyPercent: percentage(topic.correctCount, topic.questionCount),
    mistakeExamples: topic.mistakeExamples,
    knowledgeMarkdown: topic.knowledgeMarkdown,
  }));
  const subjects: Record<KnowledgeSubject, SubjectAnalytics> = {
    english: emptySubject("english"),
    iq: emptySubject("iq"),
  };

  for (const subject of ["english", "iq"] as const) {
    const subjectTopics = finalizedTopics
      .filter((topic) => topic.subject === subject)
      .toSorted(compareWeakness);
    const attemptIds = new Set<string>();
    for (const topic of topics.values()) {
      if (topic.subject === subject) topic.attemptIds.forEach((id) => attemptIds.add(id));
    }
    const totals = subjectTopics.reduce(
      (sum, topic) => ({
        correct: sum.correct + topic.correctCount,
        incorrect: sum.incorrect + topic.incorrectCount,
        unanswered: sum.unanswered + topic.unansweredCount,
        questions: sum.questions + topic.questionCount,
      }),
      { correct: 0, incorrect: 0, unanswered: 0, questions: 0 },
    );
    subjects[subject] = {
      subject,
      attemptCount: attemptIds.size,
      correctCount: totals.correct,
      incorrectCount: totals.incorrect,
      unansweredCount: totals.unanswered,
      questionCount: totals.questions,
      accuracyPercent: percentage(totals.correct, totals.questions),
      topics: subjectTopics,
    };
  }

  const attemptIds = new Set<string>();
  for (const topic of topics.values()) topic.attemptIds.forEach((id) => attemptIds.add(id));
  const correctCount = subjects.english.correctCount + subjects.iq.correctCount;
  const incorrectCount = subjects.english.incorrectCount + subjects.iq.incorrectCount;
  const unansweredCount = subjects.english.unansweredCount + subjects.iq.unansweredCount;
  const questionCount = correctCount + incorrectCount + unansweredCount;

  return {
    attemptCount: attemptIds.size,
    correctCount,
    incorrectCount,
    unansweredCount,
    questionCount,
    accuracyPercent: percentage(correctCount, questionCount),
    subjects,
    weakTopics: finalizedTopics.filter((topic) => topic.incorrectCount > 0).toSorted(compareWeakness),
    knowledgeErrors,
  };
}
