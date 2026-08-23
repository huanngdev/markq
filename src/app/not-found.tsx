import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="py-10 text-center">
          <FileQuestion className="mx-auto text-muted-foreground" size={38} aria-hidden="true" />
          <p className="mt-5 text-sm font-medium text-muted-foreground">404</p>
          <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">This quiz or attempt does not exist, is hidden, or the link is no longer valid.</p>
          <Link href="/" className={buttonVariants({ size: "lg", className: "mt-6" })}>Back to Quizzes</Link>
        </CardContent>
      </Card>
    </main>
  );
}
