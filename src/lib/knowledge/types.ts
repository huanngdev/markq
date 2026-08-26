export type KnowledgeSubject = string;

export type KnowledgeTopic = {
  id: string;
  subject: KnowledgeSubject;
  subjectTitle: string;
  title: string;
  content: string;
  sourceFile: string;
};

export type KnowledgeDocument = {
  subject: KnowledgeSubject;
  subjectTitle: string;
  title: string;
  description: string;
  topics: KnowledgeTopic[];
  sourceFile: string;
};
