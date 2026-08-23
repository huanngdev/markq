"use client";

import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="py-10 text-center">
          <CircleAlert className="mx-auto text-destructive" size={38} aria-hidden="true" />
          <p className="mt-5 text-sm font-medium text-muted-foreground">Something went wrong</p>
          <h1 className="mt-2 text-2xl font-semibold">Could not load this page</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Check the database and quiz file format, then try again.
          </p>
          <Button size="lg" className="mt-6" onClick={reset}>
            <RotateCcw data-icon="inline-start" aria-hidden="true" /> Try Again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
