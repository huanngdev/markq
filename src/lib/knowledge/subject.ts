export function isKnowledgeSubject(value: unknown): value is string {
  return typeof value === "string" && value !== "all" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function defaultSubjectTitle(subject: string): string {
  return subject.split("-").map((word) => word.length <= 2
    ? word.toUpperCase()
    : word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
