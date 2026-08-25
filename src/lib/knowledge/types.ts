export type KnowledgeSubject = "english" | "iq";

export type KnowledgeTopic = {
  id: string;
  subject: KnowledgeSubject;
  title: string;
  content: string;
  sourceFile: string;
};

export type KnowledgeDocument = {
  subject: KnowledgeSubject;
  title: string;
  description: string;
  topics: KnowledgeTopic[];
  sourceFile: string;
};
