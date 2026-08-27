import type { Metadata } from "next";
import { connection } from "next/server";

import { QuizManager } from "@/components/quiz-manager";
import { isAdminEnabled } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Manage quizzes",
  robots: { index: false, follow: false },
};

export default async function ManageQuizzesPage() {
  await connection();
  return <QuizManager isEnabled={isAdminEnabled()} />;
}
