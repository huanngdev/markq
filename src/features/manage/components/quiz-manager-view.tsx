"use client";

import { FilePlus2, House, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ManagedQuizDocument, QuizManagerViewModel } from "@/features/manage/hooks/use-quiz-manager";
import { cn } from "@/lib/utils";

type QuizManagerCommands = {
  setToken(value: string): void;
  setSelectedFile(value: string): void;
  setMarkdown(value: string): void;
  connect(): void;
  selectDocument(sourceFile: string): void;
  createDocument(): void;
  saveDocument(): void;
};

function DocumentButton({ document, isSelected, onSelect }: {
  document: ManagedQuizDocument;
  isSelected: boolean;
  onSelect(): void;
}) {
  return (
    <button type="button" onClick={onSelect} className={cn(
      "w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted",
      isSelected && "border-primary bg-muted",
    )}>
      <span className="block truncate text-sm font-medium">{document.summary?.title ?? document.sourceFile}</span>
      <span className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {document.sourceFile}
        {document.error ? <Badge variant="destructive">Invalid</Badge> : <Badge variant="outline">{document.published ? "Published" : "Draft"}</Badge>}
      </span>
    </button>
  );
}

export function QuizManagerView({
  isEnabled,
  viewModel,
  commands,
}: {
  isEnabled: boolean;
  viewModel: QuizManagerViewModel;
  commands: QuizManagerCommands;
}) {
  return (
    <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Home" className={buttonVariants({ variant: "outline", size: "icon-lg" })}><House aria-hidden="true" /></Link>
          <div><p className="text-xs text-muted-foreground">Admin</p><h1 className="text-2xl font-semibold">Quiz documents</h1></div>
        </div>
        <ThemeToggle />
      </header>

      {!isEnabled ? (
        <Alert variant="destructive">
          <AlertTitle>Admin editor is disabled</AlertTitle>
          <AlertDescription>Set MARKQ_ADMIN_TOKEN to a random value of at least 32 characters, then restart the app.</AlertDescription>
        </Alert>
      ) : !viewModel.isConnected ? (
        <Card className="mx-auto max-w-lg">
          <CardHeader><CardTitle>Connect to the editor</CardTitle></CardHeader>
          <CardContent>
            <Label htmlFor="admin-token">Admin token</Label>
            <Input id="admin-token" type="password" autoComplete="off" value={viewModel.token} onChange={(event) => commands.setToken(event.target.value)} className="mt-2" />
            {viewModel.error ? <p role="alert" className="mt-2 text-sm text-destructive">{viewModel.error}</p> : null}
            <Button className="mt-4" disabled={viewModel.isLoading} onClick={commands.connect}>
              {viewModel.isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null} Connect
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Card>
            <CardHeader className="flex grid-cols-none flex-row items-center justify-between"><CardTitle>Files</CardTitle><Button size="sm" variant="outline" onClick={commands.createDocument}><FilePlus2 aria-hidden="true" /> New</Button></CardHeader>
            <CardContent className="space-y-2">
              {viewModel.documents.map((document) => <DocumentButton key={document.sourceFile} document={document} isSelected={document.sourceFile === viewModel.selectedFile} onSelect={() => commands.selectDocument(document.sourceFile)} />)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex grid-cols-none flex-row items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Label htmlFor="source-file">Filename</Label>
                <Input id="source-file" value={viewModel.selectedFile} onChange={(event) => commands.setSelectedFile(event.target.value)} className="mt-1" />
              </div>
              <Button disabled={viewModel.isSaving || !viewModel.selectedFile || !viewModel.markdown} onClick={commands.saveDocument}>
                {viewModel.isSaving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save
              </Button>
            </CardHeader>
            <CardContent>
              <Label htmlFor="quiz-markdown">Markdown</Label>
              <Textarea id="quiz-markdown" spellCheck={false} value={viewModel.markdown} onChange={(event) => commands.setMarkdown(event.target.value)} className="mt-2 min-h-[65vh] resize-y font-mono text-sm" />
              {viewModel.error ? <p role="alert" className="mt-3 text-sm text-destructive">{viewModel.error}</p> : null}
              {viewModel.message ? <p role="status" className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{viewModel.message}</p> : null}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
