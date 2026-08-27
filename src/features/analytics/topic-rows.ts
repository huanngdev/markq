import type { TopicAnalytics } from "@/lib/analytics/types";

export type AnalyticsTopicRow = Pick<TopicAnalytics,
  "topicId" | "title" | "subjectTitle" | "questionCount" | "correctCount"
  | "incorrectCount" | "unansweredCount" | "accuracyPercent"
> & { lessonHref: string };

// Only aggregate values cross the client boundary, never lesson bodies or answers.
export function buildTopicRows(topics: TopicAnalytics[], filter: string): AnalyticsTopicRow[] {
  return topics.map((topic) => ({
    topicId: topic.topicId,
    title: topic.title,
    subjectTitle: topic.subjectTitle,
    questionCount: topic.questionCount,
    correctCount: topic.correctCount,
    incorrectCount: topic.incorrectCount,
    unansweredCount: topic.unansweredCount,
    accuracyPercent: topic.accuracyPercent,
    lessonHref: `/knowledge/${topic.topicId}?subject=${encodeURIComponent(filter)}`,
  })).sort((left, right) => right.incorrectCount - left.incorrectCount
    || left.accuracyPercent - right.accuracyPercent
    || left.title.localeCompare(right.title, "vi"));
}
